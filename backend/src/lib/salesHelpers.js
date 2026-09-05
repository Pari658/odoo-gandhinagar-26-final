import pool from '../config/supabase.js';

/**
 * Generates the next Sales Order number (SO0001, SO0002, ...).
 * Queries the DB for the highest existing number and increments.
 */
export async function generateSONumber() {
  const result = await pool.query(`
    SELECT number FROM sales_orders
    ORDER BY number DESC
    LIMIT 1
  `);

  if (result.rows.length === 0) {
    return 'SO0001';
  }

  const lastNumber = result.rows[0].number; // e.g. "SO0042"
  const seq = parseInt(lastNumber.replace('SO', ''), 10) + 1;
  return `SO${String(seq).padStart(4, '0')}`;
}

/**
 * Generates the next Customer Invoice number (INV/2026/001, INV/2026/002, ...).
 * Uses the current year from the DB server.
 */
export async function generateInvoiceNumber() {
  const yearResult = await pool.query(`SELECT EXTRACT(YEAR FROM NOW())::int AS year`);
  const year = yearResult.rows[0].year;

  const result = await pool.query(`
    SELECT number FROM customer_invoices
    WHERE number LIKE $1
    ORDER BY number DESC
    LIMIT 1
  `, [`INV/${year}/%`]);

  if (result.rows.length === 0) {
    return `INV/${year}/001`;
  }

  const lastNumber = result.rows[0].number; // e.g. "INV/2026/042"
  const seq = parseInt(lastNumber.split('/')[2], 10) + 1;
  return `INV/${year}/${String(seq).padStart(3, '0')}`;
}

/**
 * Decimal-safe multiplication for money values.
 * Converts to integer cents, multiplies, then converts back.
 * Avoids JS floating-point drift (e.g. 0.1 + 0.2 !== 0.3).
 */
function safeMoney(value) {
  return Math.round(Number(value) * 100) / 100;
}

/**
 * Calculates line-level financials for a single order/invoice line.
 * 
 * @param {number} quantity - Line quantity
 * @param {number} unitPrice - Unit price per item
 * @param {number} taxRatePercent - Tax rate percentage (e.g. 18 for 18%)
 * @returns {{ subtotal: number, taxAmount: number, lineTotal: number }}
 */
export function calculateLineTotals(quantity, unitPrice, taxRatePercent = 0) {
  const subtotal = safeMoney(quantity * unitPrice);
  const taxAmount = safeMoney(subtotal * (taxRatePercent / 100));
  const lineTotal = safeMoney(subtotal + taxAmount);

  return { subtotal, taxAmount, lineTotal };
}

/**
 * Calculates order-level totals from an array of line items.
 * Each line must have { quantity, unitPrice, taxRatePercent }.
 * 
 * @param {Array} lines - Array of line item objects
 * @returns {{ untaxedTotal: number, totalTax: number, totalAmount: number }}
 */
export function calculateOrderTotals(lines) {
  let untaxedTotal = 0;
  let totalTax = 0;

  for (const line of lines) {
    const { subtotal, taxAmount } = calculateLineTotals(
      line.quantity,
      line.unitPrice,
      line.taxRatePercent || 0
    );
    untaxedTotal = safeMoney(untaxedTotal + subtotal);
    totalTax = safeMoney(totalTax + taxAmount);
  }

  const totalAmount = safeMoney(untaxedTotal + totalTax);
  return { untaxedTotal, totalTax, totalAmount };
}
