import { pool } from '../config/supabase.js';
import { createJournalEntry } from '../services/ledger.service.js';

export const getVendorBills = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT vb.*, c.name as vendor_name
      FROM vendor_bills vb
      JOIN contacts c ON vb.vendor_id = c.id
      ORDER BY vb.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    let countQuery = `SELECT COUNT(*) FROM vendor_bills`;

    // Role-based filtering for portal contacts
    if (req.user && req.user.role === 'contact') {
      // Find contact ID for this user
      const contactRes = await pool.query(`SELECT id FROM contacts WHERE user_id = $1`, [req.user.id]);
      const contactId = contactRes.rows[0]?.id;

      if (!contactId) {
        return res.json({ success: true, data: { items: [], page: Number(page), pageSize: Number(limit), totalCount: 0 }, error: null });
      }

      query = `
        SELECT vb.*, c.name as vendor_name
        FROM vendor_bills vb
        JOIN contacts c ON vb.vendor_id = c.id
        WHERE vb.vendor_id = $3
        ORDER BY vb.created_at DESC
        LIMIT $1 OFFSET $2
      `;
      countQuery = `SELECT COUNT(*) FROM vendor_bills WHERE vendor_id = $1`;
      
      const [vbResult, countResult] = await Promise.all([
        pool.query(query, [limit, offset, contactId]),
        pool.query(countQuery, [contactId])
      ]);

      return returnResponse(res, vbResult, countResult, page, limit);
    }

    const [vbResult, countResult] = await Promise.all([
      pool.query(query, [limit, offset]),
      pool.query(countQuery)
    ]);

    returnResponse(res, vbResult, countResult, page, limit);
  } catch (err) {
    next(err);
  }
};

function returnResponse(res, vbResult, countResult, page, limit) {
  const items = vbResult.rows.map(row => ({
    id: row.id,
    number: row.number,
    vendorName: row.vendor_name,
    purchaseOrderId: row.purchase_order_id,
    vendorId: row.vendor_id,
    billReference: row.bill_reference,
    invoiceDate: row.invoice_date,
    dueDate: row.due_date,
    status: row.status,
    totalAmount: Number(row.total_amount) || 0,
    amountPaid: Number(row.amount_paid) || 0,
    amountDue: Math.max((Number(row.total_amount) || 0) - (Number(row.amount_paid) || 0), 0),
    state: row.journal_entry_id ? 'posted' : 'draft',
    paymentStatus: row.status
  }));

  res.json({
    success: true,
    data: {
      items,
      page: Number(page),
      pageSize: Number(limit),
      totalCount: Number(countResult.rows[0].count)
    },
    error: null
  });
}

export const createVendorBill = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { vendorId, purchaseOrderId, invoiceDate, dueDate, billReference, lines } = req.body;
    
    await client.query('BEGIN');

    // Generate number
    const countRes = await client.query(`SELECT COUNT(*) FROM vendor_bills`);
    const count = Number(countRes.rows[0].count) + 1;
    const number = `Bill/${new Date(invoiceDate).getFullYear()}/${count.toString().padStart(4, '0')}`;

    const billResult = await client.query(
      `INSERT INTO vendor_bills (number, purchase_order_id, vendor_id, bill_reference, invoice_date, due_date, status, total_amount, amount_paid, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'unpaid', 0, 0, NOW())
       RETURNING *`,
      [number, purchaseOrderId || null, vendorId, billReference || null, invoiceDate, dueDate]
    );
    
    const bill = billResult.rows[0];
    const billLines = [];
    let totalAmount = 0;

    for (const line of lines) {
      const lineTotal = line.quantity * line.unitPrice;
      totalAmount += lineTotal;
      
      const vblResult = await client.query(
        `INSERT INTO vendor_bill_lines (vendor_bill_id, product_id, account_id, analytic_account_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [bill.id, line.productId, line.accountId, line.analyticAccountId || null, line.quantity, line.unitPrice]
      );

      const productRes = await client.query('SELECT name FROM products WHERE id = $1', [line.productId]);
      const productName = productRes.rows[0]?.name;

      billLines.push({
        id: vblResult.rows[0].id,
        productId: line.productId,
        productName,
        accountId: line.accountId,
        analyticAccountId: line.analyticAccountId || null,
        quantity: line.quantity,
        unitPrice: Number(line.unitPrice),
        total: lineTotal
      });
    }

    await client.query(`UPDATE vendor_bills SET total_amount = $1 WHERE id = $2`, [totalAmount, bill.id]);
    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: {
        id: bill.id,
        number: bill.number,
        purchaseOrderId: bill.purchase_order_id,
        vendorId: bill.vendor_id,
        billReference: bill.bill_reference,
        invoiceDate: bill.invoice_date,
        dueDate: bill.due_date,
        status: bill.status,
        totalAmount,
        amountPaid: 0,
        lines: billLines
      },
      error: null
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

export const confirmVendorBill = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // 1. Fetch Bill details
    const billRes = await client.query('SELECT * FROM vendor_bills WHERE id = $1', [id]);
    if (billRes.rowCount === 0) {
      throw new Error('Vendor bill not found');
    }
    const bill = billRes.rows[0];

    if (bill.status !== 'unpaid' && bill.status !== 'draft') {
       throw new Error('Bill has already been confirmed/posted.');
    }

    // 2. Fetch Bill lines to construct Journal Entry
    const linesRes = await client.query('SELECT * FROM vendor_bill_lines WHERE vendor_bill_id = $1', [id]);
    
    // We need the Accounts Payable liability account from journals (Purchase Journal)
    const journalRes = await client.query(`SELECT id, default_credit_account_id FROM journals WHERE type = 'purchase' LIMIT 1`);
    if (journalRes.rowCount === 0) throw new Error('Purchase Journal not configured');
    
    const journalId = journalRes.rows[0].id;
    const payableAccountId = journalRes.rows[0].default_credit_account_id;

    if (!payableAccountId) {
       throw new Error('Purchase Journal missing default credit account (Accounts Payable)');
    }

    const jeLines = [];
    let totalDebit = 0;

    // Create a debit line for each expense line
    for (const line of linesRes.rows) {
      const lineTotal = Number(line.quantity) * Number(line.unit_price);
      totalDebit += lineTotal;

      jeLines.push({
        accountId: line.account_id,
        partnerId: bill.vendor_id,
        analyticAccountId: line.analytic_account_id,
        debit: lineTotal,
        credit: 0
      });
    }

    // Create a single credit line for Accounts Payable
    jeLines.push({
      accountId: payableAccountId,
      partnerId: bill.vendor_id,
      analyticAccountId: null,
      debit: 0,
      credit: totalDebit
    });

    // 3. Create the Journal Entry
    const je = await createJournalEntry(client, {
      entryDate: bill.invoice_date,
      journalId,
      status: 'posted',
      lines: jeLines,
      sourceType: 'vendor_bill',
      sourceId: bill.id
    });

    // 4. Link JE to Bill and update status
    await client.query(
      `UPDATE vendor_bills SET status = 'unpaid', journal_entry_id = $2 WHERE id = $1`,
      [id, je.id]
    );

    // 5. Calculate Budget Impact
    const budgetImpact = [];
    for (const line of linesRes.rows) {
      if (line.analytic_account_id) {
        const lineTotal = Number(line.quantity) * Number(line.unit_price);
        
        // Find budget for this analytic account active during invoice date
        const budgetRes = await client.query(`
          SELECT 
            b.id AS budget_id,
            b.name AS budget_name,
            aa.name AS analytic_name,
            b.committed_amount,
            COALESCE(achieved.achieved_amount, 0) AS achieved_amount
          FROM budgets b
          JOIN analytic_accounts aa ON aa.id = b.analytic_account_id
          LEFT JOIN LATERAL (
              SELECT SUM(vbl.quantity * vbl.unit_price) AS achieved_amount
              FROM vendor_bill_lines vbl
              JOIN vendor_bills vb ON vb.id = vbl.vendor_bill_id
              WHERE vbl.analytic_account_id = b.analytic_account_id
                AND vb.journal_entry_id IS NOT NULL
                AND vb.invoice_date BETWEEN b.period_start AND b.period_end
          ) achieved ON TRUE
          WHERE b.analytic_account_id = $1
            AND b.status = 'confirmed'
            AND $2::date BETWEEN b.period_start AND b.period_end
          LIMIT 1
        `, [line.analytic_account_id, bill.invoice_date]);

        if (budgetRes.rowCount > 0) {
          const b = budgetRes.rows[0];
          budgetImpact.push({
            budgetName: b.budget_name,
            analyticName: b.analytic_name,
            committedAmount: Number(b.committed_amount),
            achievedAmount: Number(b.achieved_amount),
            deductedAmount: lineTotal,
            remainingBudget: Number(b.committed_amount) - Number(b.achieved_amount)
          });
        }
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        id: bill.id,
        status: 'unpaid',
        journalEntryId: je.id,
        budgetImpact
      },
      error: null
    });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.message === 'Vendor bill not found') {
       res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: err.message } });
    } else if (err.code === 'UNBALANCED_ENTRY') {
       res.status(400).json({ success: false, data: null, error: { code: 'UNBALANCED_ENTRY', message: err.message } });
    } else {
       next(err);
    }
  } finally {
    client.release();
  }
};

export const getVendorBillById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const billResult = await pool.query(`
      SELECT vb.*, c.name as vendor_name, c.email as vendor_email, po.number as purchase_order_number
      FROM vendor_bills vb
      LEFT JOIN contacts c ON vb.vendor_id = c.id
      LEFT JOIN purchase_orders po ON vb.purchase_order_id = po.id
      WHERE vb.id = $1
    `, [id]);

    if (billResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Vendor bill not found' }
      });
    }

    const bill = billResult.rows[0];

    const linesResult = await pool.query(`
      SELECT vbl.*, p.name as product_name, a.name as account_name, aa.name as analytic_account_name
      FROM vendor_bill_lines vbl
      LEFT JOIN products p ON vbl.product_id = p.id
      LEFT JOIN chart_of_accounts a ON vbl.account_id = a.id
      LEFT JOIN analytic_accounts aa ON vbl.analytic_account_id = aa.id
      WHERE vbl.vendor_bill_id = $1
    `, [id]);

    const lines = linesResult.rows.map(l => ({
      id: l.id,
      productId: l.product_id,
      productName: l.product_name || 'Standard Expense Item',
      accountId: l.account_id,
      accountName: l.account_name || 'Expense Account',
      analyticAccountId: l.analytic_account_id,
      analyticAccountName: l.analytic_account_name || null,
      quantity: Number(l.quantity),
      unitPrice: Number(l.unit_price),
      total: Number(l.quantity) * Number(l.unit_price)
    }));

    const totalAmount = Number(bill.total_amount) || 0;
    const amountPaid = Number(bill.amount_paid) || 0;

    res.json({
      success: true,
      data: {
        id: bill.id,
        number: bill.number,
        vendorId: bill.vendor_id,
        vendorName: bill.vendor_name,
        vendorEmail: bill.vendor_email,
        purchaseOrderId: bill.purchase_order_id,
        purchaseOrderNumber: bill.purchase_order_number,
        billReference: bill.bill_reference,
        invoiceDate: bill.invoice_date,
        dueDate: bill.due_date,
        status: bill.status,
        totalAmount,
        amountPaid,
        amountDue: Math.max(totalAmount - amountPaid, 0),
        journalEntryId: bill.journal_entry_id,
        createdAt: bill.created_at,
        lines
      },
      error: null
    });
  } catch (err) {
    next(err);
  }
};

export const deleteVendorBill = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // Fetch bill to check journal entry
    const billRes = await client.query('SELECT * FROM vendor_bills WHERE id = $1', [id]);
    if (billRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Vendor bill not found' }
      });
    }

    const bill = billRes.rows[0];

    // 1. Delete associated payments & their journal entries
    const payRes = await client.query('SELECT id, journal_entry_id FROM payments WHERE vendor_bill_id = $1', [id]);
    for (const pay of payRes.rows) {
      if (pay.journal_entry_id) {
        await client.query('DELETE FROM journal_entry_lines WHERE journal_entry_id = $1', [pay.journal_entry_id]);
        await client.query('DELETE FROM journal_entries WHERE id = $1', [pay.journal_entry_id]);
      }
    }
    await client.query('DELETE FROM payments WHERE vendor_bill_id = $1', [id]);

    // 2. Delete vendor bill lines
    await client.query('DELETE FROM vendor_bill_lines WHERE vendor_bill_id = $1', [id]);

    // 3. Clear journal entry pointer to avoid FK circular dependency
    await client.query('UPDATE vendor_bills SET journal_entry_id = NULL WHERE id = $1', [id]);

    // 4. Delete vendor bill record
    await client.query('DELETE FROM vendor_bills WHERE id = $1', [id]);

    // 5. Delete linked journal entry if any
    if (bill.journal_entry_id) {
      await client.query('DELETE FROM journal_entry_lines WHERE journal_entry_id = $1', [bill.journal_entry_id]);
      await client.query('DELETE FROM journal_entries WHERE id = $1', [bill.journal_entry_id]);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: { id, message: 'Vendor bill and linked records deleted successfully' },
      error: null
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

