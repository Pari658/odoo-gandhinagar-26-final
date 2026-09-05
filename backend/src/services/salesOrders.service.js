import pool from '../config/supabase.js';
import { generateSONumber, calculateLineTotals, calculateOrderTotals } from '../lib/salesHelpers.js';

/**
 * Create a new Sales Order with line items.
 * Status starts as 'draft'.
 */
export async function createSalesOrder({ customerId, orderDate, lines, createdBy }) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Validate customer exists and is of type 'customer' or 'both'
    const customerResult = await client.query(
      `SELECT id, name, type FROM contacts WHERE id = $1 AND is_archived = false`,
      [customerId]
    );

    if (customerResult.rows.length === 0) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Customer not found' };
    }

    const customer = customerResult.rows[0];
    if (customer.type !== 'customer' && customer.type !== 'both') {
      throw { status: 400, code: 'VALIDATION_ERROR', message: 'Contact is not a customer', field: 'customerId' };
    }

    // Validate all products exist
    for (const line of lines) {
      const productResult = await client.query(
        `SELECT id FROM products WHERE id = $1 AND is_archived = false`,
        [line.productId]
      );
      if (productResult.rows.length === 0) {
        throw { status: 404, code: 'NOT_FOUND', message: `Product not found: ${line.productId}` };
      }
    }

    // Fetch tax rates for lines that have taxRateId
    for (const line of lines) {
      if (line.taxRateId) {
        const taxResult = await client.query(
          `SELECT rate_percent FROM tax_rates WHERE id = $1`,
          [line.taxRateId]
        );
        if (taxResult.rows.length === 0) {
          throw { status: 404, code: 'NOT_FOUND', message: `Tax rate not found: ${line.taxRateId}` };
        }
        line.taxRatePercent = parseFloat(taxResult.rows[0].rate_percent);
      } else {
        line.taxRatePercent = 0;
      }
    }

    // Generate SO number
    const number = await generateSONumber();

    // Insert sales_orders header
    const soResult = await client.query(
      `INSERT INTO sales_orders (number, customer_id, status, order_date, created_by)
       VALUES ($1, $2, 'draft', $3, $4)
       RETURNING *`,
      [number, customerId, orderDate || new Date().toISOString().split('T')[0], createdBy]
    );

    const salesOrder = soResult.rows[0];

    // Insert sales_order_lines
    const insertedLines = [];
    for (const line of lines) {
      const lineResult = await client.query(
        `INSERT INTO sales_order_lines (sales_order_id, product_id, analytic_account_id, quantity, unit_price, tax_rate_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          salesOrder.id,
          line.productId,
          line.analyticAccountId || null,
          line.quantity,
          line.unitPrice,
          line.taxRateId || null,
        ]
      );
      insertedLines.push(lineResult.rows[0]);
    }

    await client.query('COMMIT');

    // Calculate totals for the response
    const totals = calculateOrderTotals(lines);

    return {
      id: salesOrder.id,
      number: salesOrder.number,
      customerId: salesOrder.customer_id,
      customerName: customer.name,
      status: salesOrder.status,
      orderDate: salesOrder.order_date,
      createdBy: salesOrder.created_by,
      createdAt: salesOrder.created_at,
      ...totals,
      lines: insertedLines.map((l, i) => ({
        id: l.id,
        productId: l.product_id,
        analyticAccountId: l.analytic_account_id,
        quantity: parseFloat(l.quantity),
        unitPrice: parseFloat(l.unit_price),
        taxRateId: l.tax_rate_id,
        taxRatePercent: lines[i].taxRatePercent,
        ...calculateLineTotals(parseFloat(l.quantity), parseFloat(l.unit_price), lines[i].taxRatePercent),
      })),
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Get all Sales Orders with pagination.
 */
export async function getSalesOrders({ page = 1, pageSize = 20 } = {}) {
  const offset = (page - 1) * pageSize;

  const countResult = await pool.query(`SELECT COUNT(*) FROM sales_orders`);
  const totalCount = parseInt(countResult.rows[0].count, 10);

  const result = await pool.query(
    `SELECT so.*, c.name AS customer_name
     FROM sales_orders so
     JOIN contacts c ON c.id = so.customer_id
     ORDER BY so.created_at DESC
     LIMIT $1 OFFSET $2`,
    [pageSize, offset]
  );

  const items = result.rows.map((row) => ({
    id: row.id,
    number: row.number,
    customerId: row.customer_id,
    customerName: row.customer_name,
    status: row.status,
    orderDate: row.order_date,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }));

  return { items, page, pageSize, totalCount };
}

/**
 * Get a single Sales Order by ID, including line items with product names.
 */
export async function getSalesOrderById(id) {
  const soResult = await pool.query(
    `SELECT so.*, c.name AS customer_name
     FROM sales_orders so
     JOIN contacts c ON c.id = so.customer_id
     WHERE so.id = $1`,
    [id]
  );

  if (soResult.rows.length === 0) {
    throw { status: 404, code: 'NOT_FOUND', message: 'Sales order not found' };
  }

  const so = soResult.rows[0];

  const linesResult = await pool.query(
    `SELECT sol.*, p.name AS product_name, tr.rate_percent AS tax_rate_percent
     FROM sales_order_lines sol
     JOIN products p ON p.id = sol.product_id
     LEFT JOIN tax_rates tr ON tr.id = sol.tax_rate_id
     WHERE sol.sales_order_id = $1`,
    [id]
  );

  const lines = linesResult.rows.map((l) => {
    const taxRatePercent = l.tax_rate_percent ? parseFloat(l.tax_rate_percent) : 0;
    return {
      id: l.id,
      productId: l.product_id,
      productName: l.product_name,
      analyticAccountId: l.analytic_account_id,
      quantity: parseFloat(l.quantity),
      unitPrice: parseFloat(l.unit_price),
      taxRateId: l.tax_rate_id,
      taxRatePercent,
      ...calculateLineTotals(parseFloat(l.quantity), parseFloat(l.unit_price), taxRatePercent),
    };
  });

  const totals = calculateOrderTotals(
    lines.map((l) => ({ quantity: l.quantity, unitPrice: l.unitPrice, taxRatePercent: l.taxRatePercent }))
  );

  return {
    id: so.id,
    number: so.number,
    customerId: so.customer_id,
    customerName: so.customer_name,
    status: so.status,
    orderDate: so.order_date,
    createdBy: so.created_by,
    createdAt: so.created_at,
    ...totals,
    lines,
  };
}

/**
 * Confirm a draft Sales Order (draft → confirmed).
 */
export async function confirmSalesOrder(id) {
  const soResult = await pool.query(
    `SELECT id, status FROM sales_orders WHERE id = $1`,
    [id]
  );

  if (soResult.rows.length === 0) {
    throw { status: 404, code: 'NOT_FOUND', message: 'Sales order not found' };
  }

  if (soResult.rows[0].status !== 'draft') {
    throw { status: 409, code: 'CONFLICT', message: `Cannot confirm a sales order with status '${soResult.rows[0].status}'` };
  }

  await pool.query(
    `UPDATE sales_orders SET status = 'confirmed', updated_at = NOW() WHERE id = $1`,
    [id]
  );

  return getSalesOrderById(id);
}
