import { pool } from '../config/supabase.js';
import { createJournalEntry } from '../services/ledger.service.js';

export const createPayment = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { direction, vendorBillId, customerInvoiceId, partnerId, amount, method, paymentDate, note } = req.body;
    
    await client.query('BEGIN');

    // Basic validation
    if (direction === 'outbound' && !vendorBillId) {
      throw new Error('vendorBillId is required for outbound payments');
    }
    if (direction === 'inbound' && !customerInvoiceId) {
      throw new Error('customerInvoiceId is required for inbound payments');
    }

    const payResult = await client.query(
      `INSERT INTO payments (direction, vendor_bill_id, customer_invoice_id, amount, method, payment_date, note, status, created_at, recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', NOW(), $8)
       RETURNING *`,
      [direction, vendorBillId || null, customerInvoiceId || null, amount, method, paymentDate, note || null, req.user.id]
    );
    
    const payment = payResult.rows[0];
    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: {
        id: payment.id,
        direction: payment.direction,
        vendorBillId: payment.vendor_bill_id,
        customerInvoiceId: payment.customer_invoice_id,
        amount: Number(payment.amount),
        method: payment.method,
        status: payment.status,
        note: payment.note
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

export const confirmPayment = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // 1. Fetch Payment
    const payRes = await client.query('SELECT * FROM payments WHERE id = $1', [id]);
    if (payRes.rowCount === 0) {
      throw new Error('Payment not found');
    }
    const payment = payRes.rows[0];

    if (payment.status !== 'draft') {
       throw new Error('Only draft payments can be confirmed');
    }

    // 2. Journal Entry construction
    // We need the Bank or Cash journal
    const journalRes = await client.query(`SELECT id, default_debit_account_id, default_credit_account_id FROM journals WHERE type = $1 LIMIT 1`, [payment.method]);
    if (journalRes.rowCount === 0) throw new Error(`${payment.method} journal not configured`);
    
    const journal = journalRes.rows[0];
    
    // We need AP/AR accounts based on direction
    let partnerAccountId;
    let bankAccountId;
    const amount = Number(payment.amount);

    if (payment.direction === 'outbound') {
      // Paying a vendor. Debit AP, Credit Bank.
      const apRes = await client.query(`SELECT default_credit_account_id as ap FROM journals WHERE type = 'purchase' LIMIT 1`);
      partnerAccountId = apRes.rows[0]?.ap;
      bankAccountId = journal.default_credit_account_id;
    } else {
      // Receiving from customer. Debit Bank, Credit AR.
      const arRes = await client.query(`SELECT default_debit_account_id as ar FROM journals WHERE type = 'sales' LIMIT 1`);
      partnerAccountId = arRes.rows[0]?.ar;
      bankAccountId = journal.default_debit_account_id;
    }

    if (!partnerAccountId || !bankAccountId) {
       throw new Error('Accounting configuration missing for partner or bank accounts');
    }

    const jeLines = [];
    if (payment.direction === 'outbound') {
      jeLines.push({ accountId: partnerAccountId, partnerId: payment.partner_id, debit: amount, credit: 0 });
      jeLines.push({ accountId: bankAccountId, partnerId: null, debit: 0, credit: amount });
    } else {
      jeLines.push({ accountId: bankAccountId, partnerId: null, debit: amount, credit: 0 });
      jeLines.push({ accountId: partnerAccountId, partnerId: payment.partner_id, debit: 0, credit: amount });
    }

    // 3. Create the Journal Entry
    const je = await createJournalEntry(client, {
      entryDate: payment.payment_date,
      journalId: journal.id,
      status: 'posted',
      lines: jeLines,
      sourceType: 'payment',
      sourceId: payment.id
    });

    // 4. Update Payment Status
    await client.query(`UPDATE payments SET status = 'confirmed' WHERE id = $1`, [id]);

    // 5. Update related Document
    let docData = null;
    if (payment.vendor_bill_id) {
      const billRes = await client.query(`SELECT total_amount, amount_paid FROM vendor_bills WHERE id = $1`, [payment.vendor_bill_id]);
      const bill = billRes.rows[0];
      const newAmountPaid = Number(bill.amount_paid) + amount;
      const newStatus = newAmountPaid >= Number(bill.total_amount) ? 'paid' : 'partially_paid'; // Assuming partially_paid exists
      
      await client.query(
        `UPDATE vendor_bills SET amount_paid = $1, status = $2 WHERE id = $3`,
        [newAmountPaid, newStatus, payment.vendor_bill_id]
      );
      docData = { vendorBill: { id: payment.vendor_bill_id, status: newStatus, amountPaid: newAmountPaid } };
    } else if (payment.customer_invoice_id) {
      const invRes = await client.query(`SELECT total_amount, amount_paid FROM customer_invoices WHERE id = $1`, [payment.customer_invoice_id]);
      if (invRes.rowCount > 0) {
        const inv = invRes.rows[0];
        const newAmountPaid = Number(inv.amount_paid) + amount;
        const newStatus = newAmountPaid >= Number(inv.total_amount) ? 'paid' : 'partially_paid';
        
        await client.query(
          `UPDATE customer_invoices SET amount_paid = $1, status = $2 WHERE id = $3`,
          [newAmountPaid, newStatus, payment.customer_invoice_id]
        );
        docData = { customerInvoice: { id: payment.customer_invoice_id, status: newStatus, amountPaid: newAmountPaid } };
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        id: payment.id,
        status: 'confirmed',
        journalEntryId: je.id,
        ...docData
      },
      error: null
    });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.message === 'Payment not found') {
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

export const cancelPayment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const payResult = await pool.query(
      `UPDATE payments SET status = 'cancelled' WHERE id = $1 AND status = 'draft' RETURNING *`,
      [id]
    );

    if (payResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Draft payment not found' }
      });
    }

    res.json({
      success: true,
      data: {
        id: payResult.rows[0].id,
        status: payResult.rows[0].status
      },
      error: null
    });
  } catch (err) {
    next(err);
  }
};
