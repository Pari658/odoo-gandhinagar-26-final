import bcrypt from 'bcryptjs';
import pool from './src/config/supabase.js';

async function run() {
  const hash = bcrypt.hashSync('Password123!', 10);
  await pool.query('UPDATE users SET password_hash = $1', [hash]);
  console.log('Passwords successfully updated to Password123!');
  process.exit(0);
}

run().catch(console.error);
