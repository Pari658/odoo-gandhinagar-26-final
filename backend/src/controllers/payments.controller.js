import { pool } from '../config/supabase.js';
import { createJournalEntry } from '../services/ledger.service.js';

const PAGE_SIZE = 20;
const VIEW_ROLES = ['admin', 'accountant', 'contact'];
const STAFF_ROLES = ['admin', 'accountant'];
const ERROR_CODES = ['VALIDATION_ERROR', 'NOT_FOUND', 'UNAUTHORIZED', 'FORBIDDEN', 'CONFLICT', 'UNBALANCED_ENTRY'];

function sendError(res, status, code, message, field) {
  return res.status(status).json({
    success: false,
    data: null,
    error: { code, message, ...(field ? { field } : {}) }
  });
}

function ensureRole(req, res, roles) {
  if (!req.user || !roles.includes(req.user.role)) {
    sendError(res, 403, 'FORBIDDEN', 'Access denied');
    return false;
  }
  return true;
}

function handleError(res, error) {
  const code = ERROR_CODES.includes(error.code) ? error.code : 'CONFLICT';
  const status = error.statusCode || (code === 'NOT_FOUND' ? 404 : code === 'CONFLICT' ? 409 : 400);
  return sendError(res, status, code, error.message || 'Payment operation failed');
}

function mapPayment(row) {
  return {
    id: row.id,
    direction: row.direction,
    vendorBillId: row.vendor_bill_id,
    customerInvoiceId: row.customer_invoice_id,
    partnerId: row.partner_id,
    partnerName: row.partner_name,
    targetNumber: row.target_number,
    amount: Number(row.amount),
    method: row.method,
    paymentDate: row.payment_date,
    status: row.status,
    note: row.note,
    journalEntryId: row.journal_entry_id,
    recordedBy: row.recorded_by,
    createdAt: row.created_at
  };
}

async function getTarget(client, payment, lock = false) {
  const lockClause = lock ? ' FOR UPDATE' : '';
  if (payment.vendor_bill_id) {
    const result = await client.query(
      `SELECT id, vendor_id AS partner_id, total_amount, amount_paid
       FROM vendor_bills WHERE id = $1${lockClause}`,
      [payment.vendor_bill_id]
    );
    return result.rows[0] ? { ...result.rows[0], kind: 'vendor' } : null;
  }

  const result = await client.query(
    `SELECT id, customer_id AS partner_id, total_amount, amount_paid
     FROM customer_invoices WHERE id = $1${lockClause}`,
    [payment.customer_invoice_id]
  );
  return result.rows[0] ? { ...result.rows[0], kind: 'customer' } : null;
}

function targetTable(target) {
  return target.kind === 'vendor' ? 'vendor_bills' : 'customer_invoices';
}

function targetDirection(target) {
  return target.kind === 'vendor' ? 'outbound' : 'inbound';
}

export async function createPayment(req, res) {
  if (!ensureRole(req, res, VIEW_ROLES)) return;

  const { direction, vendorBillId, customerInvoiceId, partnerId: requestedPartnerId, amount, method, paymentDate, note } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const target = await getTarget(client, { vendor_bill_id: vendorBillId, customer_invoice_id: customerInvoiceId }, true);

    if (!target) {
      const error = new Error('Linked bill or invoice was not found');
      error.code = 'NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }
    if (direction !== targetDirection(target)) {
      const error = new Error(`Direction must be ${targetDirection(target)} for this payment target`);
      error.code = 'VALIDATION_ERROR';
      error.statusCode = 400;
      throw error;
    }
    if (requestedPartnerId && requestedPartnerId !== target.partner_id) {
      const error = new Error('partnerId does not match the linked bill or invoice');
      error.code = 'VALIDATION_ERROR';
      error.statusCode = 400;
      throw error;
    }
    if (req.user.role === 'contact' && req.user.contactId !== target.partner_id) {
      const error = new Error('Contacts may only create payments for their own linked record');
      error.code = 'FORBIDDEN';
      error.statusCode = 403;
      throw error;
    }

    const dueCheck = await client.query(
      `SELECT ($1::numeric <= total_amount - amount_paid) AS within_due
       FROM ${targetTable(target)} WHERE id = $2`,
      [amount, target.id]
    );
    if (!dueCheck.rows[0]?.within_due) {
      const error = new Error('Amount exceeds the remaining amount due');
      error.code = 'VALIDATION_ERROR';
      error.statusCode = 400;
      throw error;
    }

    const result = await client.query(
      `INSERT INTO payments
        (direction, vendor_bill_id, customer_invoice_id, amount, method, payment_date, note, status, created_at, recorded_by)
       VALUES ($1, $2, $3, $4::numeric, $5, $6, $7, 'draft', NOW(), $8)
       RETURNING id, direction, vendor_bill_id, customer_invoice_id, amount, method, payment_date,
                 status, note, journal_entry_id, recorded_by, created_at`,
      [direction, vendorBillId, customerInvoiceId, amount, method, paymentDate, note || null, req.user.id]
    );

    await client.query('COMMIT');
    return res.status(201).json({
      success: true,
      data: mapPayment({ ...result.rows[0], partner_id: target.partner_id }),
      error: null
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return handleError(res, error);
  } finally {
    client.release();
  }
}

export async function getPayment(req, res) {
  if (!ensureRole(req, res, VIEW_ROLES)) return;

  try {
    const result = await pool.query(
      `SELECT p.*, COALESCE(vb.vendor_id, ci.customer_id) AS partner_id,
          COALESCE(vc.name, cc.name) AS partner_name,
          COALESCE(vb.number, ci.number) AS target_number
       FROM payments p
       LEFT JOIN vendor_bills vb ON vb.id = p.vendor_bill_id
       LEFT JOIN customer_invoices ci ON ci.id = p.customer_invoice_id
       LEFT JOIN contacts vc ON vc.id = vb.vendor_id
       LEFT JOIN contacts cc ON cc.id = ci.customer_id
       WHERE p.id = $1
         AND ($2::text <> 'contact' OR COALESCE(vb.vendor_id, ci.customer_id) = $3::uuid)`,
      [req.params.id, req.user.role, req.user.contactId || null]
    );

    if (!result.rows[0]) return sendError(res, 404, 'NOT_FOUND', 'Payment not found');
    return res.json({ success: true, data: mapPayment(result.rows[0]), error: null });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listPayments(req, res) {
  if (!ensureRole(req, res, VIEW_ROLES)) return;

  const { direction, status, vendorBillId, customerInvoiceId, page = '1' } = req.query;
  const pageNumber = Number(page);
  const offset = (pageNumber - 1) * PAGE_SIZE;
  const filters = [];
  const values = [];
  const addFilter = (sql, value) => {
    values.push(value);
    filters.push(sql.replace('?', `$${values.length}`));
  };

  if (direction) addFilter('p.direction = ?', direction);
  if (status) addFilter('p.status = ?', status);
  if (vendorBillId) addFilter('p.vendor_bill_id = ?', vendorBillId);
  if (customerInvoiceId) addFilter('p.customer_invoice_id = ?', customerInvoiceId);
  if (req.user.role === 'contact') {
    values.push(req.user.contactId);
    const placeholder = `$${values.length}`;
    filters.push(`(vb.vendor_id = ${placeholder} OR ci.customer_id = ${placeholder})`);
  }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  try {
    const fromSql = `
      FROM payments p
      LEFT JOIN vendor_bills vb ON vb.id = p.vendor_bill_id
      LEFT JOIN customer_invoices ci ON ci.id = p.customer_invoice_id
      LEFT JOIN contacts vc ON vc.id = vb.vendor_id
      LEFT JOIN contacts cc ON cc.id = ci.customer_id
      ${where}`;
    const countResult = await pool.query(`SELECT COUNT(*) ${fromSql}`, values);
    const result = await pool.query(
            `SELECT p.*, COALESCE(vb.vendor_id, ci.customer_id) AS partner_id,
              COALESCE(vc.name, cc.name) AS partner_name,
              COALESCE(vb.number, ci.number) AS target_number
       ${fromSql}
       ORDER BY p.created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, PAGE_SIZE, offset]
    );

    return res.json({
      success: true,
      data: {
        items: result.rows.map(mapPayment),
        page: pageNumber,
        pageSize: PAGE_SIZE,
        totalCount: Number(countResult.rows[0].count)
      },
      error: null
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function listPaymentTargets(req, res) {
  if (!ensureRole(req, res, VIEW_ROLES)) return;

  try {
    const contactFilter = req.user.role === 'contact' ? 'AND c.user_id = $1' : '';
    const params = req.user.role === 'contact' ? [req.user.id] : [];
    const result = await pool.query(
      `SELECT 'vendor' AS target_type, vb.id, vb.number, vb.vendor_id AS partner_id,
              c.name AS partner_name, vb.total_amount, vb.amount_paid, vb.status
       FROM vendor_bills vb
       JOIN contacts c ON c.id = vb.vendor_id
       WHERE vb.amount_paid < vb.total_amount ${contactFilter}
       UNION ALL
       SELECT 'customer' AS target_type, ci.id, ci.number, ci.customer_id AS partner_id,
              c.name AS partner_name, ci.total_amount, ci.amount_paid, ci.status
       FROM customer_invoices ci
       JOIN contacts c ON c.id = ci.customer_id
       WHERE ci.amount_paid < ci.total_amount ${contactFilter}
       ORDER BY number`,
      params
    );

    const mapTarget = row => ({
      id: row.id,
      number: row.number,
      partnerId: row.partner_id,
      partnerName: row.partner_name,
      totalAmount: Number(row.total_amount),
      amountPaid: Number(row.amount_paid),
      amountDue: Number(row.total_amount) - Number(row.amount_paid),
      status: row.status
    });

    return res.json({
      success: true,
      data: {
        vendorBills: result.rows.filter(row => row.target_type === 'vendor').map(mapTarget),
        customerInvoices: result.rows.filter(row => row.target_type === 'customer').map(mapTarget)
      },
      error: null
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function confirmPayment(req, res) {
  if (!ensureRole(req, res, STAFF_ROLES)) return;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const paymentResult = await client.query('SELECT * FROM payments WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!paymentResult.rows[0]) {
      const error = new Error('Payment not found');
      error.code = 'NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    const payment = paymentResult.rows[0];
    if (payment.status !== 'draft') {
      const error = new Error('Only draft payments can be confirmed');
      error.code = 'CONFLICT';
      error.statusCode = 409;
      throw error;
    }

    const target = await getTarget(client, payment, true);
    if (!target) {
      const error = new Error('Linked bill or invoice was not found');
      error.code = 'NOT_FOUND';
      error.statusCode = 404;
      throw error;
    }

    const dueCheck = await client.query(
      `SELECT ($1::numeric <= total_amount - amount_paid) AS within_due
       FROM ${targetTable(target)} WHERE id = $2`,
      [payment.amount, target.id]
    );
    if (!dueCheck.rows[0]?.within_due) {
      const error = new Error('Payment exceeds the remaining amount due');
      error.code = 'CONFLICT';
      error.statusCode = 409;
      throw error;
    }

    const journalResult = await client.query(
      'SELECT id, default_debit_account_id, default_credit_account_id FROM journals WHERE type = $1 LIMIT 1',
      [payment.method]
    );
    const partnerJournalResult = await client.query(
      'SELECT default_debit_account_id, default_credit_account_id FROM journals WHERE type = $1 LIMIT 1',
      [target.kind === 'vendor' ? 'purchase' : 'sales']
    );
    const journal = journalResult.rows[0];
    const partnerJournal = partnerJournalResult.rows[0];
    const bankAccountId = payment.direction === 'outbound'
      ? journal?.default_credit_account_id
      : journal?.default_debit_account_id;
    const partnerAccountId = payment.direction === 'outbound'
      ? partnerJournal?.default_credit_account_id
      : partnerJournal?.default_debit_account_id;

    if (!journal || !partnerAccountId || !bankAccountId) {
      const error = new Error('Required payment journals or accounts are not configured');
      error.code = 'CONFLICT';
      error.statusCode = 409;
      throw error;
    }

    const lines = payment.direction === 'outbound'
      ? [
        { accountId: partnerAccountId, partnerId: target.partner_id, debit: payment.amount, credit: 0 },
        { accountId: bankAccountId, partnerId: null, debit: 0, credit: payment.amount }
      ]
      : [
        { accountId: bankAccountId, partnerId: null, debit: payment.amount, credit: 0 },
        { accountId: partnerAccountId, partnerId: target.partner_id, debit: 0, credit: payment.amount }
      ];

    const journalEntry = await createJournalEntry(client, {
      entryDate: payment.payment_date,
      journalId: journal.id,
      status: 'posted',
      lines,
      sourceType: 'payment',
      sourceId: payment.id
    });

    await client.query(
      `UPDATE payments SET status = 'confirmed'::payment_workflow_status, journal_entry_id = $1 WHERE id = $2`,
      [journalEntry.id, payment.id]
    );

    const updatedTarget = await client.query(
      `UPDATE ${targetTable(target)}
       SET amount_paid = amount_paid + $1::numeric,
           status = CASE
             WHEN amount_paid + $1::numeric >= total_amount THEN 'paid'
             WHEN amount_paid + $1::numeric > 0 THEN 'partially_paid'
             ELSE 'unpaid'
           END::payment_status
       WHERE id = $2
       RETURNING amount_paid, status`,
      [payment.amount, target.id]
    );

    await client.query('COMMIT');
    const document = target.kind === 'vendor'
      ? { vendorBill: { id: target.id, amountPaid: Number(updatedTarget.rows[0].amount_paid), status: updatedTarget.rows[0].status } }
      : { customerInvoice: { id: target.id, amountPaid: Number(updatedTarget.rows[0].amount_paid), status: updatedTarget.rows[0].status } };
    return res.json({
      success: true,
      data: { id: payment.id, status: 'confirmed', journalEntryId: journalEntry.id, partnerId: target.partner_id, ...document },
      error: null
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return handleError(res, error);
  } finally {
    client.release();
  }
}

export async function cancelPayment(req, res) {
  if (!ensureRole(req, res, STAFF_ROLES)) return;

  try {
    const paymentResult = await pool.query('SELECT id, status FROM payments WHERE id = $1', [req.params.id]);
    if (!paymentResult.rows[0]) return sendError(res, 404, 'NOT_FOUND', 'Payment not found');
    if (paymentResult.rows[0].status !== 'draft') {
      return sendError(res, 409, 'CONFLICT', 'Only draft payments can be cancelled');
    }

    const result = await pool.query(
      `UPDATE payments SET status = 'cancelled' WHERE id = $1 AND status = 'draft' RETURNING id, status`,
      [req.params.id]
    );
    return res.json({ success: true, data: result.rows[0], error: null });
  } catch (error) {
    return handleError(res, error);
  }
}