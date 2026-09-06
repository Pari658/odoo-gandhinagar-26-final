import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool } from '../config/supabase.js';

async function seedDatabase() {
  const client = await pool.connect();
  try {
    console.log('🚀 Starting Urban Furniture ERP Database Seeding...');
    await client.query('BEGIN');

    const defaultPasswordHash = await bcrypt.hash('Password@123', 10);

    // 1. Chart of Accounts
    await client.query(`
      INSERT INTO public.chart_of_accounts (id, name, type, report_group) VALUES
        ('40000000-0000-0000-0000-000000000001', 'Bank A/c', 'bank', 'balance_sheet'),
        ('40000000-0000-0000-0000-000000000002', 'Cash A/c', 'cash', 'balance_sheet'),
        ('40000000-0000-0000-0000-000000000003', 'Debtors A/c (Accounts Receivable)', 'asset', 'balance_sheet'),
        ('40000000-0000-0000-0000-000000000004', 'Creditors A/c (Accounts Payable)', 'liability', 'balance_sheet'),
        ('40000000-0000-0000-0000-000000000005', 'Capital A/c', 'capital', 'balance_sheet'),
        ('40000000-0000-0000-0000-000000000006', 'Sales Revenue A/c', 'income', 'profit_and_loss'),
        ('40000000-0000-0000-0000-000000000007', 'Cost of Goods Sold (COGS)', 'expense', 'profit_and_loss'),
        ('40000000-0000-0000-0000-000000000008', 'Office & Administrative Expense', 'expense', 'profit_and_loss')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Chart of Accounts seeded');

    // 2. Journals
    await client.query(`
      INSERT INTO public.journals (id, name, type, default_debit_account_id, default_credit_account_id) VALUES
        ('50000000-0000-0000-0000-000000000001', 'Sales Journal', 'sales', '40000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000006'),
        ('50000000-0000-0000-0000-000000000002', 'Purchase Journal', 'purchase', '40000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000004'),
        ('50000000-0000-0000-0000-000000000003', 'Bank Journal', 'bank', '40000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001'),
        ('50000000-0000-0000-0000-000000000004', 'Cash Journal', 'cash', '40000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Journals seeded');

    // 3. Tax Rates
    await client.query(`
      INSERT INTO public.tax_rates (id, name, rate_percent, linked_account_id) VALUES
        ('60000000-0000-0000-0000-000000000001', 'GST 18%', 18.00, '40000000-0000-0000-0000-000000000004'),
        ('60000000-0000-0000-0000-000000000002', 'GST 12%', 12.00, '40000000-0000-0000-0000-000000000004'),
        ('60000000-0000-0000-0000-000000000003', 'GST 5%', 5.00, '40000000-0000-0000-0000-000000000004')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Tax Rates seeded');

    // 4. Analytic Accounts
    await client.query(`
      INSERT INTO public.analytic_accounts (id, name, type) VALUES
        ('70000000-0000-0000-0000-000000000001', 'Main Manufacturing Plant', 'expense'),
        ('70000000-0000-0000-0000-000000000002', 'Retail Showroom Ahmedabad', 'income'),
        ('70000000-0000-0000-0000-000000000003', 'Product R&D Design Lab', 'expense')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Analytic Accounts seeded');

    // 5. Users
    await client.query(`
      INSERT INTO public.users (id, email, password_hash, role, login_id) VALUES
        ('10000000-0000-0000-0000-000000000001', 'admin@urbanfurniture.com', $1, 'admin', 'ADM001'),
        ('10000000-0000-0000-0000-000000000002', 'accountant@urbanfurniture.com', $1, 'accountant', 'ACC001'),
        ('10000000-0000-0000-0000-000000000003', 'parth.doma@example.com', $1, 'contact', 'CUST001'),
        ('10000000-0000-0000-0000-000000000004', 'nimesh.pathak@example.com', $1, 'contact', 'CUST002'),
        ('10000000-0000-0000-0000-000000000005', 'priya.sharma@example.com', $1, 'contact', 'CUST003'),
        ('10000000-0000-0000-0000-000000000006', 'rahul.verma@example.com', $1, 'contact', 'CUST004')
      ON CONFLICT (id) DO NOTHING;
    `, [defaultPasswordHash]);
    console.log('✅ Users seeded');

    // 6. Contacts
    await client.query(`
      INSERT INTO public.contacts (id, user_id, name, type, email, mobile, city, state, pincode) VALUES
        ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Parth Doma', 'customer', 'parth.doma@example.com', '+91 9876543210', 'Gandhinagar', 'Gujarat', '382010'),
        ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004', 'Nimesh Pathak', 'customer', 'nimesh.pathak@example.com', '+91 9812345678', 'Ahmedabad', 'Gujarat', '380015'),
        ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000005', 'Priya Sharma', 'customer', 'priya.sharma@example.com', '+91 9723456789', 'Vadodara', 'Gujarat', '390001'),
        ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000006', 'Rahul Verma', 'customer', 'rahul.verma@example.com', '+91 9634567890', 'Surat', 'Gujarat', '395007'),
        ('20000000-0000-0000-0000-000000000005', NULL, 'Supreme Wood & Timber Works', 'vendor', 'sales@supremewood.com', '+91 9123456789', 'Gandhinagar', 'Gujarat', '382028'),
        ('20000000-0000-0000-0000-000000000006', NULL, 'Apex Hardware & Metal Fittings', 'vendor', 'orders@apexhardware.com', '+91 9234567890', 'Rajkot', 'Gujarat', '360001'),
        ('20000000-0000-0000-0000-000000000007', NULL, 'Urban Tech Upholstery', 'vendor', 'contact@urbantech.com', '+91 9345678901', 'Ahmedabad', 'Gujarat', '380009')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Contacts seeded');

    // 7. Products
    await client.query(`
      INSERT INTO public.products (id, name, type, sales_price, cost_price, category) VALUES
        ('30000000-0000-0000-0000-000000000001', 'Solid Teak Dining Table (6-Seater)', 'goods', 25000.00, 15000.00, 'Dining Furniture'),
        ('30000000-0000-0000-0000-000000000002', 'Ergonomic Mesh Office Chair', 'goods', 8500.00, 4500.00, 'Office Seating'),
        ('30000000-0000-0000-0000-000000000003', 'Luxury Velvet 3-Seater Sofa', 'goods', 45000.00, 28000.00, 'Living Room'),
        ('30000000-0000-0000-0000-000000000004', 'Executive Oak Desk', 'goods', 18000.00, 11000.00, 'Office Workstations'),
        ('30000000-0000-0000-0000-000000000005', 'Minimalist Open Bookshelf', 'goods', 9500.00, 5200.00, 'Storage Furniture'),
        ('30000000-0000-0000-0000-000000000006', 'King Size Sheesham Bed Frame', 'goods', 38000.00, 22000.00, 'Bedroom Furniture')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Products seeded');

    // 8. Budgets
    await client.query(`
      INSERT INTO public.budgets (id, name, analytic_account_id, period_start, period_end, committed_amount, responsible_contact_id, status) VALUES
        ('80000000-0000-0000-0000-000000000001', 'Q3 Operations Budget 2026', '70000000-0000-0000-0000-000000000001', '2026-07-01', '2026-09-30', 500000.00, '20000000-0000-0000-0000-000000000001', 'confirmed'),
        ('80000000-0000-0000-0000-000000000002', 'Showroom Modernization Budget', '70000000-0000-0000-0000-000000000002', '2026-08-01', '2026-10-31', 350000.00, '20000000-0000-0000-0000-000000000002', 'confirmed')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Budgets seeded');

    // 9. Sales Orders & Order Lines
    await client.query(`
      INSERT INTO public.sales_orders (id, number, customer_id, status, order_date, created_by) VALUES
        ('a1000000-0000-0000-0000-000000000001', 'SO/2026/0001', '20000000-0000-0000-0000-000000000001', 'invoiced', '2026-08-10', '10000000-0000-0000-0000-000000000001'),
        ('a1000000-0000-0000-0000-000000000002', 'SO/2026/0002', '20000000-0000-0000-0000-000000000001', 'invoiced', '2026-08-25', '10000000-0000-0000-0000-000000000001'),
        ('a1000000-0000-0000-0000-000000000003', 'SO/2026/0003', '20000000-0000-0000-0000-000000000002', 'invoiced', '2026-08-15', '10000000-0000-0000-0000-000000000001'),
        ('a1000000-0000-0000-0000-000000000004', 'SO/2026/0004', '20000000-0000-0000-0000-000000000003', 'confirmed', '2026-09-01', '10000000-0000-0000-0000-000000000001')
      ON CONFLICT (id) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO public.sales_order_lines (id, sales_order_id, product_id, analytic_account_id, quantity, unit_price, tax_rate_id) VALUES
        ('a1100000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 2, 25000.00, '60000000-0000-0000-0000-000000000001'),
        ('a1100000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', 4, 8500.00, '60000000-0000-0000-0000-000000000001'),
        ('a1100000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000002', 1, 45000.00, '60000000-0000-0000-0000-000000000001'),
        ('a1100000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000002', 2, 18000.00, '60000000-0000-0000-0000-000000000001'),
        ('a1100000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000006', '70000000-0000-0000-0000-000000000001', 1, 38000.00, '60000000-0000-0000-0000-000000000001')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Sales Orders & Line items seeded');

    // 10. Customer Invoices & Invoice Lines (Includes Paid & Unpaid for Parth Doma and Nimesh Pathak)
    await client.query(`
      INSERT INTO public.customer_invoices (id, number, sales_order_id, customer_id, invoice_date, due_date, total_amount, amount_paid, status) VALUES
        ('b1000000-0000-0000-0000-000000000001', 'INV/2026/0001', 'a1000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '2026-08-10', '2026-09-10', 99120.00, 99120.00, 'paid'),
        ('b1000000-0000-0000-0000-000000000002', 'INV/2026/0002', 'a1000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '2026-08-25', '2026-09-25', 53100.00, 0.00, 'unpaid'),
        ('b1000000-0000-0000-0000-000000000003', 'INV/2026/0003', 'a1000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', '2026-08-15', '2026-09-15', 42480.00, 42480.00, 'paid')
      ON CONFLICT (id) DO NOTHING;
    `);

    await client.query(`
      INSERT INTO public.customer_invoice_lines (id, customer_invoice_id, product_id, account_id, analytic_account_id, quantity, unit_price, tax_rate_id) VALUES
        ('b1100000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000006', '70000000-0000-0000-0000-000000000001', 2, 25000.00, '60000000-0000-0000-0000-000000000001'),
        ('b1100000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000006', '70000000-0000-0000-0000-000000000001', 4, 8500.00, '60000000-0000-0000-0000-000000000001'),
        ('b1100000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000006', '70000000-0000-0000-0000-000000000002', 1, 45000.00, '60000000-0000-0000-0000-000000000001'),
        ('b1100000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000006', '70000000-0000-0000-0000-000000000002', 2, 18000.00, '60000000-0000-0000-0000-000000000001')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Customer Invoices & Invoice Lines seeded');

    // 11. Purchase Orders & Vendor Bills
    await client.query(`
      INSERT INTO public.purchase_orders (id, number, vendor_id, status, order_date, created_by) VALUES
        ('c1000000-0000-0000-0000-000000000001', 'PO/2026/0001', '20000000-0000-0000-0000-000000000005', 'billed', '2026-08-01', '10000000-0000-0000-0000-000000000001'),
        ('c1000000-0000-0000-0000-000000000002', 'PO/2026/0002', '20000000-0000-0000-0000-000000000006', 'confirmed', '2026-08-20', '10000000-0000-0000-0000-000000000001')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.purchase_order_lines (id, purchase_order_id, product_id, analytic_account_id, quantity, unit_price) VALUES
        ('c1100000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 10, 15000.00),
        ('c1100000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', 20, 4500.00)
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.vendor_bills (id, number, bill_reference, purchase_order_id, vendor_id, invoice_date, due_date, total_amount, amount_paid, status) VALUES
        ('d1000000-0000-0000-0000-000000000001', 'BILL/2026/0001', 'SUP-INV-8891', 'c1000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', '2026-08-02', '2026-09-02', 150000.00, 150000.00, 'paid'),
        ('d1000000-0000-0000-0000-000000000002', 'BILL/2026/0002', 'APX-9942', 'c1000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000006', '2026-08-22', '2026-09-22', 90000.00, 0.00, 'unpaid')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.vendor_bill_lines (id, vendor_bill_id, product_id, account_id, analytic_account_id, quantity, unit_price) VALUES
        ('d1100000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000007', '70000000-0000-0000-0000-000000000001', 10, 15000.00),
        ('d1100000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000007', '70000000-0000-0000-0000-000000000001', 20, 4500.00)
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Purchase Orders & Vendor Bills seeded');

    // 12. Payments
    await client.query(`
      INSERT INTO public.payments (id, direction, method, amount, payment_date, status, note, customer_invoice_id, recorded_by) VALUES
        ('f1000000-0000-0000-0000-000000000001', 'inbound', 'bank', 99120.00, '2026-08-12', 'confirmed', 'Full online payment received via Bank Transfer', 'b1000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002'),
        ('f1000000-0000-0000-0000-000000000002', 'inbound', 'cash', 42480.00, '2026-08-18', 'confirmed', 'Cash payment confirmed at counter', 'b1000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002')
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO public.payments (id, direction, method, amount, payment_date, status, note, vendor_bill_id, recorded_by) VALUES
        ('f1000000-0000-0000-0000-000000000003', 'outbound', 'bank', 150000.00, '2026-08-05', 'confirmed', 'Vendor settlement via NEFT', 'd1000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Payments seeded');

    await client.query('COMMIT');
    console.log('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase();
