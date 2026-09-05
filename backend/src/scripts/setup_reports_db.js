import { query, pool } from '../config/db.js';

async function setup() {
  try {
    console.log('Creating v_balance_sheet view...');
    await query(`
      CREATE OR REPLACE VIEW v_balance_sheet AS
      SELECT coa.type, coa.name AS account_name,
             SUM(jel.debit) - SUM(jel.credit) AS balance
      FROM journal_entry_lines jel
      JOIN journal_entries je ON je.id = jel.journal_entry_id AND je.status = 'posted'
      JOIN chart_of_accounts coa ON coa.id = jel.account_id
      WHERE coa.report_group = 'balance_sheet'
      GROUP BY coa.type, coa.name;
    `);
    console.log('✓ v_balance_sheet created.');

    console.log('Creating v_profit_and_loss view...');
    await query(`
      CREATE OR REPLACE VIEW v_profit_and_loss AS
      SELECT coa.type, coa.name AS account_name,
             SUM(jel.credit) - SUM(jel.debit) AS amount
      FROM journal_entry_lines jel
      JOIN journal_entries je ON je.id = jel.journal_entry_id AND je.status = 'posted'
      JOIN chart_of_accounts coa ON coa.id = jel.account_id
      WHERE coa.report_group = 'profit_and_loss'
      GROUP BY coa.type, coa.name;
    `);
    console.log('✓ v_profit_and_loss created.');

    console.log('Creating v_budget_progress view...');
    await query(`
      DROP VIEW IF EXISTS v_budget_progress CASCADE;
      CREATE VIEW v_budget_progress AS
      SELECT
          b.id AS budget_id,
          b.name AS budget_name,
          aa.id AS analytic_account_id,
          aa.name AS analytic_name,
          aa.type AS analytic_type,
          b.period_start,
          b.period_end,
          b.committed_amount,
          COALESCE(achieved.achieved_amount, 0) AS achieved_amount,
          CASE WHEN b.committed_amount > 0
               THEN ROUND(COALESCE(achieved.achieved_amount, 0) / b.committed_amount * 100, 2)
               ELSE 0 END AS achieved_percent,
          b.committed_amount - COALESCE(achieved.achieved_amount, 0) AS amount_to_achieve,
          b.status,
          b.responsible_contact_id
      FROM budgets b
      JOIN analytic_accounts aa ON aa.id = b.analytic_account_id
      LEFT JOIN LATERAL (
          SELECT SUM(cil.quantity * cil.unit_price) AS achieved_amount
          FROM customer_invoice_lines cil
          JOIN customer_invoices ci ON ci.id = cil.customer_invoice_id
          WHERE aa.type = 'income'
            AND cil.analytic_account_id = aa.id
            AND ci.invoice_date BETWEEN b.period_start AND b.period_end
          UNION ALL
          SELECT SUM(vbl.quantity * vbl.unit_price) AS achieved_amount
          FROM vendor_bill_lines vbl
          JOIN vendor_bills vb ON vb.id = vbl.vendor_bill_id
          WHERE aa.type = 'expense'
            AND vbl.analytic_account_id = aa.id
            AND vb.invoice_date BETWEEN b.period_start AND b.period_end
      ) achieved ON TRUE;
    `);
    console.log('✓ v_budget_progress created.');

    const countRes = await query('SELECT COUNT(*) FROM chart_of_accounts;');
    if (parseInt(countRes.rows[0].count, 10) === 0) {
      console.log('Seeding initial chart of accounts in DB...');
      const accounts = [
        ['HDFC Operating Bank Account', 'bank', 'balance_sheet'],
        ['Petty Cash', 'cash', 'balance_sheet'],
        ['Accounts Receivable (Debtors)', 'asset', 'balance_sheet'],
        ['Accounts Payable (Creditors)', 'liability', 'balance_sheet'],
        ['Owner Capital A/c', 'capital', 'balance_sheet'],
        ['Furniture Sales Income', 'income', 'profit_and_loss'],
        ['Raw Timber Purchase Expense', 'expense', 'profit_and_loss'],
        ['Workshop Electricity & Utility', 'other_expense', 'profit_and_loss']
      ];
      for (const [name, type, report_group] of accounts) {
        await query(
          `INSERT INTO chart_of_accounts (id, name, type, report_group) 
           VALUES (gen_random_uuid(), $1, $2, $3)
           ON CONFLICT (name) DO NOTHING;`,
          [name, type, report_group]
        );
      }
      console.log('✓ Chart of accounts seeded.');
    } else {
      console.log(`✓ Chart of accounts already has ${countRes.rows[0].count} records.`);
    }

    // Also check if any journals exist
    const jCountRes = await query('SELECT COUNT(*) FROM journals;');
    if (parseInt(jCountRes.rows[0].count, 10) === 0) {
      console.log('Seeding default journals in DB...');
      const coaRes = await query('SELECT id, name FROM chart_of_accounts;');
      const coaMap = {};
      coaRes.rows.forEach(r => { coaMap[r.name] = r.id; });

      await query(`
        INSERT INTO journals (id, name, type, default_debit_account_id, default_credit_account_id) VALUES
        (gen_random_uuid(), 'Customer Sales Journal', 'sales', $1, $2),
        (gen_random_uuid(), 'Vendor Purchase Journal', 'purchase', $3, $4),
        (gen_random_uuid(), 'Bank Receipts & Payments', 'bank', $5, $5),
        (gen_random_uuid(), 'Cash Receipts & Payments', 'cash', $6, $6)
        ON CONFLICT DO NOTHING;
      `, [
        coaMap['Accounts Receivable (Debtors)'] || null,
        coaMap['Furniture Sales Income'] || null,
        coaMap['Raw Timber Purchase Expense'] || null,
        coaMap['Accounts Payable (Creditors)'] || null,
        coaMap['HDFC Operating Bank Account'] || null,
        coaMap['Petty Cash'] || null
      ]);
      console.log('✓ Default journals seeded.');
    }
  } catch (err) {
    console.error('Setup error:', err);
  } finally {
    await pool.end();
  }
}

setup();
