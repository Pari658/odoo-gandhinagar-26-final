import 'dotenv/config';
import { pool } from '../config/supabase.js';

async function main() {
  try {
    const enums = await pool.query(`
      SELECT t.typname, e.enumlabel 
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      ORDER BY t.typname, e.enumsortorder
    `);
    console.log('--- ENUMS ---');
    console.log(enums.rows);

    const existingAcc = await pool.query('SELECT * FROM chart_of_accounts LIMIT 5');
    console.log('--- EXISTING ACCOUNTS ---');
    console.log(existingAcc.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
