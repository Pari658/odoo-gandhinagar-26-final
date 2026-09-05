import pool from './src/config/supabase.js';

async function run() {
  const res = await pool.query(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name IN ('analytic_accounts', 'chart_of_accounts', 'journals');
  `);
  console.table(res.rows);
  process.exit(0);
}
run();
