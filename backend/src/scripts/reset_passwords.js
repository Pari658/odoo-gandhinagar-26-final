import bcrypt from 'bcryptjs';
import { query } from '../config/supabase.js';

async function reset() {
  const adminHash = bcrypt.hashSync('admin123', 10);
  const acctHash = bcrypt.hashSync('accountant123', 10);

  await query('UPDATE users SET password_hash = $1 WHERE login_id = $2 OR email = $3', [adminHash, 'adminuser', 'admin@urbanfurniture.com']);
  await query('UPDATE users SET password_hash = $1 WHERE login_id = $2 OR email = $3', [acctHash, 'acctuser', 'accountant@urbanfurniture.com']);

  console.log('✅ PASSWORDS UPDATED SUCCESSFULLY IN SUPABASE DATABASE!');
}

reset().catch(console.error);
