import { pool } from '../config/supabase.js';

export async function getCustomerInvoices(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const offset = (page - 1) * pageSize;
    const params = [];
    const filters = ['ci.amount_paid < ci.total_amount'];

    if (req.user.role === 'contact') {
      params.push(req.user.contactId || null);
      filters.push(`ci.customer_id = $${params.length}`);
    }

    const where = `WHERE ${filters.join(' AND ')}`;
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
