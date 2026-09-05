import pg from 'pg';
import { ENV } from '../lib/env.js';
const { Pool } = pg;

const connectionString = ENV.SUPABASE_CONNECTION_STRING;

export const pool = new Pool({
    connectionString,
    ssl: false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000
});

pool.on('connect', () => {
    console.log('✅ Supabase PostgreSQL Connection Pool Active');
});

pool.on('error', (err) => {
    console.error('❌ Supabase PostgreSQL Connection Pool Error:', err.message);
});

export async function query(text, params = []) {
    try {
        return await pool.query(text, params);
    } catch (err) {
        console.error('Supabase Query Error:', err.message);
        throw err;
    }
}

export default pool;
