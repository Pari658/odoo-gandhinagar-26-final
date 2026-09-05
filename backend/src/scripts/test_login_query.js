import pool from '../config/supabase.js';

async function testQuery(input) {
  try {
    console.log(`Testing query for input: "${input}"`);
    const res = await pool.query(
      `SELECT u.id, u.login_id, u.email, u.password_hash, u.role, u.is_active, u.created_at,
              c.id AS contact_id, c.name AS contact_name, c.type AS contact_type
       FROM users u
       LEFT JOIN contacts c ON c.user_id = u.id OR (c.email IS NOT NULL AND u.email IS NOT NULL AND LOWER(c.email::text) = LOWER(u.email::text))
       WHERE (u.email IS NOT NULL AND LOWER(u.email::text) = LOWER($1::text))
          OR (u.login_id IS NOT NULL AND LOWER(u.login_id::text) = LOWER($1::text))
       LIMIT 1`,
      [input.trim()]
    );
    console.log('✅ QUERY SUCCESS, Found rows:', res.rows.length);
    if (res.rows.length > 0) {
      console.log('Found user:', res.rows[0].email, 'login_id:', res.rows[0].login_id);
    }
  } catch (err) {
    console.error('❌ QUERY ERROR:', err);
  }
}

testQuery('adminuser').then(() => testQuery('admin@urbanfurniture.com')).catch(console.error);
