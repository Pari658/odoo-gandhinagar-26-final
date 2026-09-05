import pool from '../config/supabase.js';
import { generateSONumber, calculateLineTotals, calculateOrderTotals } from '../lib/salesHelpers.js';

export async function createSalesOrder({ customerId, orderDate, lines, createdBy }) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Validate customer
    const customerRes = await client.query('SELECT id, name, type FROM contacts WHERE id = $1 AND is_archived = false', [customerId]);
    if (customerRes.rows.length === 0) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Customer not found' };
    }
    const customer = customerRes.rows[0];
    if (customer.type !== 'customer' && customer.type !== 'both') {
      throw { status: 400, code: 'VALIDATION_ERROR', message: 'Contact is not a customer', field: 'customerId' };
    }

    // Generate SO number
    const number = await generateSONumber();

    // Create Header
    const soDate = orderDate || new Date().toISOString().split('T')[0];
    const soInsert = await client.query(
      `INSERT INTO sales_orders (number, customer_id, status, order_date, created_by, created_at)
       VALUES ($1, $2, 'draft', $3, $4, NOW())
       RETURNING id, number, status, order_date, created_at`,
      [number, customerId, soDate, createdBy]
    );
    const salesOrder = soInsert.rows[0];

    const enrichedLines = [];
    for (const line of lines) {
      // Validate product
      const productRes = await client.query('SELECT id, name FROM products WHERE id = $1 AND is_archived = false', [line.productId]);
      if (productRes.rows.length === 0) {
        throw { status: 404, code: 'NOT_FOUND', message: `Product not found: ${line.productId}` };
      }
      const product = productRes.rows[0];

      // Validate tax rate
      let taxRatePercent = 0;
      if (line.taxRateId) {
        const taxRes = await client.query('SELECT id, rate_percent FROM tax_rates WHERE id = $1', [line.taxRateId]);
        if (taxRes.rows.length === 0) {
          throw { status: 404, code: 'NOT_FOUND', message: `Tax rate not found: ${line.taxRateId}` };
        }
        taxRatePercent = taxRes.rows[0].rate_percent;
      }

      const lineInsert = await client.query(
        `INSERT INTO sales_order_lines (sales_order_id, product_id, analytic_account_id, quantity, unit_price, tax_rate_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [salesOrder.id, product.id, line.analyticAccountId || null, line.quantity, line.unitPrice, line.taxRateId || null]
      );

      enrichedLines.push({
        id: lineInsert.rows[0].id,
        productId: product.id,
        productName: product.name,
        analyticAccountId: line.analyticAccountId || null,
        quantity: parseFloat(line.quantity),
        unitPrice: parseFloat(line.unitPrice),
        taxRateId: line.taxRateId || null,
        taxRatePercent: parseFloat(taxRatePercent)
      });
    }

    await client.query('COMMIT');

    const totals = calculateOrderTotals(enrichedLines.map(l => ({
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      taxRatePercent: l.taxRatePercent
    })));

    return {
      id: salesOrder.id,
      number: salesOrder.number,
      customerId,
      customerName: customer.name,
      status: salesOrder.status,
      orderDate: salesOrder.order_date,
      createdBy,
      createdAt: salesOrder.created_at,
      ...totals,
      lines: enrichedLines.map(l => ({
        id: l.id,
        productId: l.productId,
        productName: l.productName,
        analyticAccountId: l.analyticAccountId,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        taxRateId: l.taxRateId,
        taxRatePercent: l.taxRatePercent,
        ...calculateLineTotals(l.quantity, l.unitPrice, l.taxRatePercent),
      })),
    };
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.status) throw err; // rethrow custom errors
    throw { status: 500, code: 'SERVER_ERROR', message: err.message };
  } finally {
    client.release();
  }
}

export async function getSalesOrders({ page = 1, pageSize = 10, search = '', userRole = 'admin', contactId = null } = {}) {
  const limit = parseInt(pageSize, 10) || 10;
  const offset = (page - 1) * limit;

  let whereConditions = [];
  const params = [];

  if (userRole === 'contact' && contactId) {
    params.push(contactId);
    whereConditions.push(`so.customer_id = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    whereConditions.push(`(so.number ILIKE $${params.length} OR c.name ILIKE $${params.length})`);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const countQuery = `
    SELECT COUNT(*) 
    FROM sales_orders so
    JOIN contacts c ON so.customer_id = c.id
    ${whereClause}
  `;
  const countRes = await pool.query(countQuery, params);
  const totalCount = parseInt(countRes.rows[0].count, 10);

  // For selectQuery, we need to append limit and offset to the params array
  const selectParams = [...params, limit, offset];
  const selectQuery = `
    SELECT so.*, c.name as customer_name 
    FROM sales_orders so 
    JOIN contacts c ON so.customer_id = c.id 
    ${whereClause}
    ORDER BY so.created_at DESC 
    LIMIT $${selectParams.length - 1} OFFSET $${selectParams.length}
  `;
  const res = await pool.query(selectQuery, selectParams);

  const items = res.rows.map(so => ({
    id: so.id,
    number: so.number,
    customerId: so.customer_id,
    customerName: so.customer_name,
    status: so.status,
    orderDate: so.order_date,
    createdBy: so.created_by,
    createdAt: so.created_at,
  }));

  return { items, page, pageSize, totalCount };
}

export async function updateSalesOrder(id, { customerId, orderDate, lines }) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify it exists and is in draft state
    const soRes = await client.query('SELECT status FROM sales_orders WHERE id = $1 FOR UPDATE', [id]);
    if (soRes.rows.length === 0) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Sales order not found' };
    }
    if (soRes.rows[0].status !== 'draft') {
      throw { status: 409, code: 'CONFLICT', message: `Cannot edit a sales order with status '${soRes.rows[0].status}'` };
    }

    // Validate customer
    const customerRes = await client.query('SELECT id, name, type FROM contacts WHERE id = $1 AND is_archived = false', [customerId]);
    if (customerRes.rows.length === 0) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Customer not found' };
    }
    const customer = customerRes.rows[0];

    // Update Header
    const soDate = orderDate || new Date().toISOString().split('T')[0];
    await client.query(
      `UPDATE sales_orders SET customer_id = $1, order_date = $2 WHERE id = $3`,
      [customerId, soDate, id]
    );

    // Replace lines entirely
    await client.query('DELETE FROM sales_order_lines WHERE sales_order_id = $1', [id]);

    for (const line of lines) {
      const productRes = await client.query('SELECT id FROM products WHERE id = $1 AND is_archived = false', [line.productId]);
      if (productRes.rows.length === 0) {
        throw { status: 404, code: 'NOT_FOUND', message: `Product not found: ${line.productId}` };
      }

      await client.query(
        `INSERT INTO sales_order_lines (sales_order_id, product_id, analytic_account_id, quantity, unit_price, tax_rate_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, line.productId, line.analyticAccountId || null, line.quantity, line.unitPrice, line.taxRateId || null]
      );
    }

    await client.query('COMMIT');

    return getSalesOrderById(id);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.status) throw err;
    throw { status: 500, code: 'SERVER_ERROR', message: err.message };
  } finally {
    client.release();
  }
}

export async function getSalesOrderById(id) {
  const soRes = await pool.query(
    `SELECT so.*, c.name as customer_name 
     FROM sales_orders so 
     JOIN contacts c ON so.customer_id = c.id 
     WHERE so.id = $1`,
    [id]
  );

  if (soRes.rows.length === 0) {
    throw { status: 404, code: 'NOT_FOUND', message: 'Sales order not found' };
  }

  const so = soRes.rows[0];

  const linesRes = await pool.query(
    `SELECT sol.*, p.name as product_name, t.rate_percent as tax_rate_percent 
     FROM sales_order_lines sol
     JOIN products p ON sol.product_id = p.id
     LEFT JOIN tax_rates t ON sol.tax_rate_id = t.id
     WHERE sol.sales_order_id = $1`,
    [id]
  );

  const lines = linesRes.rows.map(l => {
    const qty = parseFloat(l.quantity);
    const price = parseFloat(l.unit_price);
    const taxPct = parseFloat(l.tax_rate_percent || 0);
    return {
      id: l.id,
      productId: l.product_id,
      productName: l.product_name,
      analyticAccountId: l.analytic_account_id,
      quantity: qty,
      unitPrice: price,
      taxRateId: l.tax_rate_id,
      taxRatePercent: taxPct,
      ...calculateLineTotals(qty, price, taxPct)
    };
  });

  const totals = calculateOrderTotals(lines.map(l => ({
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    taxRatePercent: l.taxRatePercent
  })));

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

export async function confirmSalesOrder(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const soRes = await client.query('SELECT status FROM sales_orders WHERE id = $1 FOR UPDATE', [id]);
    if (soRes.rows.length === 0) {
      throw { status: 404, code: 'NOT_FOUND', message: 'Sales order not found' };
    }
    
    const so = soRes.rows[0];
    if (so.status !== 'draft') {
      throw { status: 409, code: 'CONFLICT', message: `Cannot confirm a sales order with status '${so.status}'` };
    }

    await client.query('UPDATE sales_orders SET status = $1 WHERE id = $2', ['confirmed', id]);
    
    await client.query('COMMIT');
    
    return getSalesOrderById(id);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.status) throw err;
    throw { status: 500, code: 'SERVER_ERROR', message: err.message };
  } finally {
    client.release();
  }
}
