import { pool } from '../config/supabase.js';

export async function getCustomerInvoices(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const offset = (page - 1) * pageSize;
    const params = [];
    const filters = [];

    if (req.query.unpaidOnly === 'true') {
      filters.push('ci.amount_paid < ci.total_amount');
    }

    if (req.user.role === 'contact') {
      params.push(req.user.contactId || null);
      filters.push(`ci.customer_id = $${params.length}`);
    }

    const where = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const from = `
      FROM customer_invoices ci
      JOIN contacts c ON c.id = ci.customer_id
      ${where}`;
    const [itemsResult, countResult] = await Promise.all([
      pool.query(
        `SELECT ci.id, ci.number, ci.customer_id, c.name AS customer_name,
                ci.invoice_date, ci.due_date, ci.total_amount, ci.amount_paid,
                ci.status
         ${from}
         ORDER BY ci.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, pageSize, offset]
      ),
      pool.query(`SELECT COUNT(*) ${from}`, params)
    ]);

    return res.json({
      success: true,
      data: {
        items: itemsResult.rows.map(invoice => ({
          id: invoice.id,
          number: invoice.number,
          customerId: invoice.customer_id,
          customerName: invoice.customer_name,
          invoiceDate: invoice.invoice_date,
          dueDate: invoice.due_date,
          totalAmount: Number(invoice.total_amount),
          amountPaid: Number(invoice.amount_paid),
          amountDue: Number(invoice.total_amount) - Number(invoice.amount_paid),
          status: invoice.status
        })),
        page,
        pageSize,
        totalCount: Number(countResult.rows[0].count)
      },
      error: null
    });
  } catch (error) {
    next(error);
  }
}

export async function getMyBills(req, res, next) {
  try {
    const contactId = req.user.contactId;

    let queryText = `
      SELECT ci.id, ci.number, ci.customer_id, c.name AS customer_name, c.email AS customer_email,
             ci.invoice_date, ci.due_date, ci.total_amount, ci.amount_paid, ci.status,
             so.number AS sales_order_number, so.order_date AS sales_order_date
      FROM customer_invoices ci
      JOIN contacts c ON c.id = ci.customer_id
      LEFT JOIN sales_orders so ON so.id = ci.sales_order_id
    `;
    const params = [];

    if (req.user.role === 'contact') {
      if (!contactId) {
        return res.json({ success: true, data: { items: [], totalCount: 0 }, error: null });
      }
      params.push(contactId);
      queryText += ` WHERE ci.customer_id = $1`;
    }

    queryText += ` ORDER BY ci.created_at DESC`;

    const result = await pool.query(queryText, params);
    const invoices = result.rows;

    if (invoices.length === 0) {
      return res.json({ success: true, data: { items: [], totalCount: 0 }, error: null });
    }

    const invoiceIds = invoices.map(i => i.id);
    const linesResult = await pool.query(`
      SELECT cil.id, cil.customer_invoice_id, cil.product_id, p.name AS product_name,
             cil.quantity, cil.unit_price
      FROM customer_invoice_lines cil
      LEFT JOIN products p ON p.id = cil.product_id
      WHERE cil.customer_invoice_id = ANY($1::uuid[])
    `, [invoiceIds]);

    const linesByInvoice = {};
    for (const l of linesResult.rows) {
      if (!linesByInvoice[l.customer_invoice_id]) {
        linesByInvoice[l.customer_invoice_id] = [];
      }
      linesByInvoice[l.customer_invoice_id].push({
        id: l.id,
        productId: l.product_id,
        productName: l.product_name || 'Product Item',
        quantity: Number(l.quantity),
        unitPrice: Number(l.unit_price),
        total: Number(l.quantity) * Number(l.unit_price)
      });
    }

    const items = invoices.map(inv => ({
      id: inv.id,
      number: inv.number,
      customerId: inv.customer_id,
      customerName: inv.customer_name,
      customerEmail: inv.customer_email,
      invoiceDate: inv.invoice_date,
      dueDate: inv.due_date,
      totalAmount: Number(inv.total_amount),
      amountPaid: Number(inv.amount_paid),
      balanceDue: Number(inv.total_amount) - Number(inv.amount_paid),
      status: inv.status,
      salesOrderNumber: inv.sales_order_number || null,
      salesOrderDate: inv.sales_order_date || null,
      lines: linesByInvoice[inv.id] || []
    }));

    return res.json({
      success: true,
      data: {
        items,
        totalCount: items.length
      },
      error: null
    });
  } catch (error) {
    next(error);
  }
}

export async function getCustomerInvoiceById(req, res, next) {
  try {
    const { id } = req.params;

    const invoiceResult = await pool.query(`
      SELECT ci.id, ci.number, ci.customer_id, c.name AS customer_name, c.email AS customer_email,
             ci.invoice_date, ci.due_date, ci.total_amount, ci.amount_paid, ci.status, ci.journal_entry_id,
             so.number AS sales_order_number, so.order_date AS sales_order_date
      FROM customer_invoices ci
      JOIN contacts c ON c.id = ci.customer_id
      LEFT JOIN sales_orders so ON so.id = ci.sales_order_id
      WHERE ci.id = $1
    `, [id]);

    if (invoiceResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Customer invoice not found' }
      });
    }

    const invoice = invoiceResult.rows[0];

    // Optional: add authorization check here if needed for contact users
    if (req.user && req.user.role === 'contact' && invoice.customer_id !== req.user.contactId) {
       return res.status(403).json({ success: false, data: null, error: { code: 'FORBIDDEN', message: 'Not authorized to view this invoice' } });
    }

    const linesResult = await pool.query(`
      SELECT cil.id, cil.product_id, p.name AS product_name,
             cil.quantity, cil.unit_price
      FROM customer_invoice_lines cil
      LEFT JOIN products p ON p.id = cil.product_id
      WHERE cil.customer_invoice_id = $1
    `, [id]);

    const lines = linesResult.rows.map(l => ({
      id: l.id,
      productId: l.product_id,
      productName: l.product_name || 'Product Item',
      quantity: Number(l.quantity),
      unitPrice: Number(l.unit_price),
      total: Number(l.quantity) * Number(l.unit_price)
    }));

    res.json({
      success: true,
      data: {
        id: invoice.id,
        number: invoice.number,
        customerId: invoice.customer_id,
        customerName: invoice.customer_name,
        customerEmail: invoice.customer_email,
        invoiceDate: invoice.invoice_date,
        dueDate: invoice.due_date,
        totalAmount: Number(invoice.total_amount),
        amountPaid: Number(invoice.amount_paid),
        amountDue: Number(invoice.total_amount) - Number(invoice.amount_paid),
        status: invoice.status,
        journalEntryId: invoice.journal_entry_id,
        salesOrderNumber: invoice.sales_order_number || null,
        salesOrderDate: invoice.sales_order_date || null,
        lines
      },
      error: null
    });
  } catch (error) {
    next(error);
  }
}
