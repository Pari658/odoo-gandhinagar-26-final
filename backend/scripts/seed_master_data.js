import { v4 as uuidv4 } from 'uuid';
import pool from '../src/config/supabase.js';
import { inMemoryStore } from '../src/db/index.js';

// Deterministic UUIDs for the seed data so they match exactly
const ID_MAP = {
  // Users
  'u-admin-001': '11111111-1111-1111-1111-111111111111',
  'u-accountant-001': '22222222-2222-2222-2222-222222222222',
  'u-contact-001': '33333333-3333-3333-3333-333333333333',
  // Contacts
  'c-101': '44444444-4444-4444-4444-444444444444',
  'c-102': '55555555-5555-5555-5555-555555555555',
  'c-103': '66666666-6666-6666-6666-666666666666',
  // Products
  'p-201': '77777777-7777-7777-7777-777777777777',
  'p-202': '88888888-8888-8888-8888-888888888888',
  'p-203': '99999999-9999-9999-9999-999999999999',
  // Tax Rates
  'tax-gst18': 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'tax-gst5': 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'tax-exempt': 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  // Chart of Accounts
  'acc-101': 'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'acc-102': 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  'acc-103': 'ffffffff-ffff-ffff-ffff-ffffffffffff',
  'acc-201': '00000000-0000-0000-0000-000000000001',
  'acc-301': '00000000-0000-0000-0000-000000000002',
  'acc-401': '00000000-0000-0000-0000-000000000003',
  'acc-501': '00000000-0000-0000-0000-000000000004',
  'acc-502': '00000000-0000-0000-0000-000000000005',
  // Journals
  'j-sales': '00000000-0000-0000-0000-000000000006',
  'j-purchase': '00000000-0000-0000-0000-000000000007',
  'j-bank': '00000000-0000-0000-0000-000000000008',
  'j-cash': '00000000-0000-0000-0000-000000000009',
  // Analytic Accounts
  'aa-001': '00000000-0000-0000-0000-00000000000a',
  'aa-002': '00000000-0000-0000-0000-00000000000b',
  'aa-003': '00000000-0000-0000-0000-00000000000c'
};

function getUuid(oldId) {
  if (!oldId) return null;
  return ID_MAP[oldId] || uuidv4();
}

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('Starting seed process...');
    
    // 1. Truncate tables (cascade) to ensure clean slate
    console.log('Truncating tables...');
    await client.query(`
      TRUNCATE TABLE 
        sales_order_lines, sales_orders,
        users, contacts, products, tax_rates, 
        analytic_accounts, journals, chart_of_accounts
      CASCADE;
    `);

    // 2. Insert Chart of Accounts
    console.log('Seeding Chart of Accounts...');
    for (const acc of inMemoryStore.chart_of_accounts) {
      await client.query(`
        INSERT INTO chart_of_accounts (id, name, type, report_group, is_archived)
        VALUES ($1, $2, $3, $4, $5)
      `, [getUuid(acc.id), acc.name, acc.type, acc.report_group, acc.is_archived]);
    }

    // 3. Insert Tax Rates
    console.log('Seeding Tax Rates...');
    for (const tax of inMemoryStore.tax_rates) {
      await client.query(`
        INSERT INTO tax_rates (id, name, rate_percent, linked_account_id)
        VALUES ($1, $2, $3, $4)
      `, [getUuid(tax.id), tax.name, tax.rate_percent, getUuid(tax.linked_account_id)]);
    }

    // 4. Insert Journals
    console.log('Seeding Journals...');
    for (const j of inMemoryStore.journals) {
      await client.query(`
        INSERT INTO journals (id, name, type, default_debit_account_id, default_credit_account_id)
        VALUES ($1, $2, $3, $4, $5)
      `, [getUuid(j.id), j.name, j.type, getUuid(j.default_debit_account_id), getUuid(j.default_credit_account_id)]);
    }

    // 5. Insert Analytic Accounts
    console.log('Seeding Analytic Accounts...');
    for (const aa of inMemoryStore.analytic_accounts) {
      await client.query(`
        INSERT INTO analytic_accounts (id, name, type)
        VALUES ($1, $2, $3)
      `, [getUuid(aa.id), aa.name, aa.type]);
    }

    // 6. Insert Users
    console.log('Seeding Users...');
    for (const u of inMemoryStore.users) {
      await client.query(`
        INSERT INTO users (id, login_id, email, password_hash, role, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [getUuid(u.id), u.login_id, u.email, u.password_hash, u.role, u.is_active]);
    }

    // 7. Insert Contacts
    console.log('Seeding Contacts...');
    for (const c of inMemoryStore.contacts) {
      await client.query(`
        INSERT INTO contacts (id, user_id, name, type, email, mobile, city, state, pincode, profile_image_url, is_archived)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        getUuid(c.id), 
        getUuid(c.user_id), 
        c.name, c.type, c.email, c.mobile, c.city, c.state, c.pincode, c.profile_image_url, c.is_archived
      ]);
    }

    // 8. Insert Products
    console.log('Seeding Products...');
    for (const p of inMemoryStore.products) {
      await client.query(`
        INSERT INTO products (id, name, type, sales_price, cost_price, category, image_url, is_archived)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [getUuid(p.id), p.name, p.type, p.sales_price, p.cost_price, p.category, p.image_url, p.is_archived]);
    }

    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

seed();
