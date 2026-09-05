import { query } from '../config/supabase.js';

async function seedInvoices() {
  console.log('Seeding customer invoices into Supabase PostgreSQL database...');

  // Delete old seed invoices if any
  await query("DELETE FROM customer_invoices WHERE number IN ('INV-2026-001', 'INV-2026-002', 'INV-2026-003', 'INV-2026-004')");

  // Nimesh Pathak (id: 20000000-0000-0000-0000-000000000002)
  await query(`
    INSERT INTO customer_invoices (number, customer_id, invoice_date, due_date, total_amount, amount_paid, status, created_at)
    VALUES ('INV-2026-001', '20000000-0000-0000-0000-000000000002', '2026-03-01', '2026-03-31', 14750.00, 14750.00, 'paid', NOW() - INTERVAL '5 days')
  `);

  await query(`
    INSERT INTO customer_invoices (number, customer_id, invoice_date, due_date, total_amount, amount_paid, status, created_at)
    VALUES ('INV-2026-002', '20000000-0000-0000-0000-000000000002', '2026-03-05', '2026-04-05', 4130.00, 0.00, 'unpaid', NOW())
  `);

  // Rahul Sharma (id: 20000000-0000-0000-0000-000000000001)
  await query(`
    INSERT INTO customer_invoices (number, customer_id, invoice_date, due_date, total_amount, amount_paid, status, created_at)
    VALUES ('INV-2026-003', '20000000-0000-0000-0000-000000000001', '2026-02-15', '2026-03-01', 8260.00, 4000.00, 'partially_paid', NOW() - INTERVAL '20 days')
  `);

  // Raj Mehta (id: 20000000-0000-0000-0000-000000000003)
  await query(`
    INSERT INTO customer_invoices (number, customer_id, invoice_date, due_date, total_amount, amount_paid, status, created_at)
    VALUES ('INV-2026-004', '20000000-0000-0000-0000-000000000003', '2026-03-02', '2026-03-20', 12500.00, 0.00, 'unpaid', NOW() - INTERVAL '3 days')
  `);

  console.log('✅ ALL CUSTOMER INVOICES SUCCESSFULLY INSERTED INTO SUPABASE POSTGRESQL DATABASE!');
}

seedInvoices().catch(console.error);
