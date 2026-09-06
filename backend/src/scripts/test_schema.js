import 'dotenv/config';
import { pool } from '../config/supabase.js';

async function main() {
  try {
    const solCols = await pool.query(`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'sales_order_lines'
      ORDER BY ordinal_position
    `);
    console.log('SALES ORDER LINES COLUMNS:', solCols.rows);

    const prodCols = await pool.query(`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products'
      ORDER BY ordinal_position
    `);
    console.log('PRODUCTS COLUMNS:', prodCols.rows);

    const salesJournal = await pool.query(`
      SELECT id, name, type, default_credit_account_id, default_debit_account_id FROM journals WHERE type = 'sales' LIMIT 1
    `);
    console.log('SALES JOURNAL:', salesJournal.rows);

    const defaultAcc = await pool.query(`
      SELECT id, name, type FROM chart_of_accounts LIMIT 5
    `);
    console.log('CHART OF ACCOUNTS SAMPLE:', defaultAcc.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
