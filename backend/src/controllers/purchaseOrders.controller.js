import { pool } from '../config/supabase.js';

export const getPurchaseOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT po.*, c.name as vendor_name, c.email as vendor_email,
             CASE WHEN EXISTS (
               SELECT 1 FROM vendor_bills vb WHERE vb.purchase_order_id = po.id
             ) THEN 'done' ELSE po.status::text END AS display_status
      FROM purchase_orders po
      JOIN contacts c ON po.vendor_id = c.id
      WHERE po.id = $1
    `;
    const poResult = await pool.query(query, [id]);

    if (poResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Purchase order not found' }
      });
    }

    const po = poResult.rows[0];

    const linesQuery = `
      SELECT pol.*, p.name as product_name
      FROM purchase_order_lines pol
      JOIN products p ON pol.product_id = p.id
      WHERE pol.purchase_order_id = $1
    `;
    const linesResult = await pool.query(linesQuery, [id]);

    let total = 0;
    const lines = linesResult.rows.map(line => {
      const lineTotal = line.quantity * line.unit_price;
      total += lineTotal;
      return {
        id: line.id,
        productId: line.product_id,
        productName: line.product_name,
        analyticAccountId: line.analytic_account_id,
        quantity: line.quantity,
        unitPrice: Number(line.unit_price),
        total: lineTotal
      };
    });

    res.json({
      success: true,
      data: {
        id: po.id,
        number: po.number,
        vendorId: po.vendor_id,
        vendorName: po.vendor_name,
        vendorEmail: po.vendor_email,
        status: po.display_status,
        orderDate: po.order_date,
        total,
        lines
      },
      error: null
    });
  } catch (err) {
    next(err);
  }
};

export const getPurchaseOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT po.*, c.name as vendor_name,
      (SELECT SUM(quantity * unit_price) FROM purchase_order_lines WHERE purchase_order_id = po.id) as total,
      CASE WHEN EXISTS (
        SELECT 1 FROM vendor_bills vb WHERE vb.purchase_order_id = po.id
      ) THEN 'done' ELSE po.status::text END AS display_status
      FROM purchase_orders po
      JOIN contacts c ON po.vendor_id = c.id
      ORDER BY po.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const countQuery = `SELECT COUNT(*) FROM purchase_orders`;

    const [poResult, countResult] = await Promise.all([
      pool.query(query, [limit, offset]),
      pool.query(countQuery)
    ]);

    const items = poResult.rows.map(row => ({
      id: row.id,
      number: row.number,
      vendorId: row.vendor_id,
      vendorName: row.vendor_name,
      status: row.display_status,
      orderDate: row.order_date,
      total: Number(row.total) || 0
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
  } catch (err) {
    next(err);
  }
};

export const createPurchaseOrder = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { vendorId, orderDate, lines } = req.body;
    
    await client.query('BEGIN');

    // Generate number (e.g. PO0001)
    const poCountRes = await client.query(`SELECT COUNT(*) FROM purchase_orders`);
    const count = Number(poCountRes.rows[0].count) + 1;
    const number = `PO${count.toString().padStart(4, '0')}`;

    const poResult = await client.query(
      `INSERT INTO purchase_orders (number, vendor_id, status, order_date, created_at, created_by)
       VALUES ($1, $2, 'draft', $3, NOW(), $4)
       RETURNING *`,
      [number, vendorId, orderDate, req.user.id]
    );
    
    const po = poResult.rows[0];
    const poLines = [];
    let total = 0;

    for (const line of lines) {
      const lineTotal = line.quantity * line.unitPrice;
      total += lineTotal;
      
      const plResult = await client.query(
        `INSERT INTO purchase_order_lines (purchase_order_id, product_id, analytic_account_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [po.id, line.productId, line.analyticAccountId || null, line.quantity, line.unitPrice]
      );

      const productRes = await client.query('SELECT name FROM products WHERE id = $1', [line.productId]);
      const productName = productRes.rows[0]?.name;

      poLines.push({
        id: plResult.rows[0].id,
        productId: line.productId,
        productName,
        analyticAccountId: line.analyticAccountId || null,
        quantity: line.quantity,
        unitPrice: Number(line.unitPrice),
        total: lineTotal
      });
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: {
        id: po.id,
        number: po.number,
        vendorId: po.vendor_id,
        status: po.status,
        orderDate: po.order_date,
        lines: poLines,
        total
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

export const confirmPurchaseOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const poResult = await pool.query(
      `UPDATE purchase_orders SET status = 'confirmed' WHERE id = $1 RETURNING *`,
      [id]
    );

    if (poResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Purchase order not found' }
      });
    }

    // Dummy warning check for budget (mocked for now)
    const hasWarning = Math.random() > 0.5; // Simulate budget check

    const response = {
      success: true,
      data: {
        id: poResult.rows[0].id,
        status: poResult.rows[0].status
      },
      error: null
    };

    if (hasWarning) {
      response.warning = {
        code: 'BUDGET_EXCEEDED',
        message: 'The entered amount is higher than the remaining budget for this analytic account. Consider adjusting the value or revising the budget.'
      };
    }

    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const createBillFromPO = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id: poId } = req.params;
    const { billDate, dueDate, billReference } = req.body;

    await client.query('BEGIN');

    const poRes = await client.query('SELECT * FROM purchase_orders WHERE id = $1', [poId]);
    if (poRes.rowCount === 0) {
      throw new Error('Purchase order not found');
    }
    const po = poRes.rows[0];

    const linesRes = await client.query(
      `SELECT pol.*, p.name as product_name 
       FROM purchase_order_lines pol 
       JOIN products p ON pol.product_id = p.id 
       WHERE pol.purchase_order_id = $1`,
      [poId]
    );

    const billCountRes = await client.query(`SELECT COUNT(*) FROM vendor_bills`);
    const billNumber = `Bill/${new Date(billDate).getFullYear()}/${String(Number(billCountRes.rows[0].count) + 1).padStart(4, '0')}`;

    const billResult = await client.query(
      `INSERT INTO vendor_bills (number, purchase_order_id, vendor_id, bill_reference, invoice_date, due_date, status, total_amount, amount_paid, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'unpaid', 0, 0, NOW())
       RETURNING *`,
      [billNumber, poId, po.vendor_id, billReference || null, billDate, dueDate]
    );

    const bill = billResult.rows[0];
    let totalAmount = 0;
    const billLines = [];

    // Fallback purchase expense account
    const expenseAccRes = await client.query(`SELECT id FROM chart_of_accounts WHERE type = 'expense' LIMIT 1`);
    const defaultAccountId = expenseAccRes.rows[0]?.id;

    for (const line of linesRes.rows) {
      const lineTotal = line.quantity * line.unit_price;
      totalAmount += lineTotal;

      const vblResult = await client.query(
        `INSERT INTO vendor_bill_lines (vendor_bill_id, product_id, account_id, analytic_account_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [bill.id, line.product_id, defaultAccountId, line.analytic_account_id, line.quantity, line.unit_price]
      );

      billLines.push({
        id: vblResult.rows[0].id,
        productId: line.product_id,
        productName: line.product_name,
        accountId: defaultAccountId,
        analyticAccountId: line.analytic_account_id,
        quantity: line.quantity,
        unitPrice: Number(line.unit_price),
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
        purchaseOrderId: poId,
        vendorId: bill.vendor_id,
        billReference: bill.bill_reference,
        invoiceDate: bill.invoice_date,
        dueDate: bill.due_date,
        status: 'unpaid',
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
