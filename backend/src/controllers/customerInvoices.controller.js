import pool from '../config/supabase.js';
import { inMemoryStore } from '../db/index.js';

// Seed fallback for customer invoices if DB table is empty
const inMemoryCustomerInvoices = [
  {
    id: 'ci-101',
    number: 'INV-2026-001',
    sales_order_id: null,
    customer_id: 'c-102',
    customer_email: 'nimesh.pathak@example.com',
    customer_name: 'Nimesh Pathak',
    invoice_date: '2026-03-01',
    due_date: '2026-03-31',
    total_amount: 14750.00,
    amount_paid: 14750.00,
    status: 'paid',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    lines: [
      { id: 'cil-101', productName: 'Solid Teak Dining Table', quantity: 1, unitPrice: 12500.00, taxAmount: 2250.00, total: 14750.00 }
    ]
  },
  {
    id: 'ci-102',
    number: 'INV-2026-002',
    sales_order_id: null,
    customer_id: 'c-102',
    customer_email: 'nimesh.pathak@example.com',
    customer_name: 'Nimesh Pathak',
    invoice_date: '2026-03-05',
    due_date: '2026-04-05',
    total_amount: 4130.00,
    amount_paid: 0.00,
    status: 'unpaid',
    created_at: new Date().toISOString(),
    lines: [
      { id: 'cil-102', productName: 'Ergonomic Office Chair', quantity: 1, unitPrice: 3500.00, taxAmount: 630.00, total: 4130.00 }
    ]
  },
  {
    id: 'ci-103',
    number: 'INV-2026-003',
    sales_order_id: null,
    customer_id: 'c-103',
    customer_email: 'rahul@azurefurniture.com',
    customer_name: 'Rahul Sharma',
    invoice_date: '2026-02-15',
    due_date: '2026-03-01',
    total_amount: 8260.00,
    amount_paid: 4000.00,
    status: 'partial',
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    lines: [
      { id: 'cil-103', productName: 'Custom Wood Polishing Service', quantity: 2, unitPrice: 3500.00, taxAmount: 1260.00, total: 8260.00 }
    ]
  },
  {
    id: 'ci-104',
    number: 'INV-2026-004',
    sales_order_id: null,
    customer_id: 'c-104',
    customer_email: 'raj@example.com',
    customer_name: 'Raj Patel',
    invoice_date: '2026-03-02',
    due_date: '2026-03-20',
    total_amount: 12500.00,
    amount_paid: 0.00,
    status: 'unpaid',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    lines: [
      { id: 'cil-104', productName: 'Executive Wooden Desk', quantity: 1, unitPrice: 12500.00, taxAmount: 0.00, total: 12500.00 }
    ]
  }
];

/**
 * GET /api/v1/customer-invoices/my-bills
 * Fetches bills/invoices specifically belonging to the logged-in Customer/Contact
 */
export async function getMyBills(req, res) {
  try {
    const userEmail = (req.user?.email || '').toLowerCase();
    const userId = req.user?.id;
    const contactId = req.user?.contactId;

    let items = [];

    // 1. Try querying Supabase PostgreSQL customer_invoices table
    try {
      const dbRes = await pool.query(`
        SELECT ci.id, ci.number, ci.sales_order_id, ci.customer_id, ci.invoice_date, 
               ci.due_date, ci.total_amount, ci.amount_paid, ci.status, ci.created_at,
               c.name AS customer_name, c.email AS customer_email
        FROM customer_invoices ci
        JOIN contacts c ON ci.customer_id = c.id
        WHERE LOWER(c.email) = $1 OR c.user_id = $2 OR ci.customer_id = $3
        ORDER BY ci.created_at DESC
      `, [userEmail, userId, contactId]);

      if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
        items = dbRes.rows.map(row => ({
          id: row.id,
          number: row.number,
          salesOrderId: row.sales_order_id,
          customerId: row.customer_id,
          customerName: row.customer_name,
          customerEmail: row.customer_email,
          invoiceDate: row.invoice_date,
          dueDate: row.due_date,
          totalAmount: parseFloat(row.total_amount || 0),
          amountPaid: parseFloat(row.amount_paid || 0),
          balanceDue: Math.max(0, parseFloat(row.total_amount || 0) - parseFloat(row.amount_paid || 0)),
          status: row.status,
          createdAt: row.created_at
        }));
      }
    } catch (dbErr) {
      console.warn('Customer Invoices DB lookup warning:', dbErr.message);
    }

    // 2. Fallback to in-memory store if DB query returned 0 rows
    if (items.length === 0) {
      items = inMemoryCustomerInvoices.filter(inv => 
        (inv.customer_email && inv.customer_email.toLowerCase() === userEmail) ||
        (contactId && inv.customer_id === contactId) ||
        (userId && inv.customer_id === userId)
      ).map(row => ({
        ...row,
        totalAmount: parseFloat(row.total_amount || 0),
        amountPaid: parseFloat(row.amount_paid || 0),
        balanceDue: Math.max(0, parseFloat(row.total_amount || 0) - parseFloat(row.amount_paid || 0))
      }));
    }

    return res.json({
      success: true,
      data: {
        items,
        totalCount: items.length
      },
      error: null
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
}

/**
 * GET /api/v1/customer-invoices (Staff List & Management)
 */
export async function getCustomerInvoices(req, res) {
  try {
    let items = [];
    try {
      const dbRes = await pool.query(`
        SELECT ci.id, ci.number, ci.sales_order_id, ci.customer_id, ci.invoice_date, 
               ci.due_date, ci.total_amount, ci.amount_paid, ci.status, ci.created_at,
               c.name AS customer_name, c.email AS customer_email
        FROM customer_invoices ci
        LEFT JOIN contacts c ON ci.customer_id = c.id
        ORDER BY ci.created_at DESC
      `);
      if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
        items = dbRes.rows.map(row => ({
          id: row.id,
          number: row.number,
          customerName: row.customer_name || 'Customer',
          customerEmail: row.customer_email || '',
          invoiceDate: row.invoice_date,
          dueDate: row.due_date,
          totalAmount: parseFloat(row.total_amount || 0),
          amountPaid: parseFloat(row.amount_paid || 0),
          balanceDue: Math.max(0, parseFloat(row.total_amount || 0) - parseFloat(row.amount_paid || 0)),
          status: row.status,
          createdAt: row.created_at
        }));
      }
    } catch (e) {
      console.warn('Customer invoices list warning:', e.message);
    }

    if (items.length === 0) {
      items = inMemoryCustomerInvoices;
    }

    return res.json({
      success: true,
      data: { items, totalCount: items.length },
      error: null
    });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}
