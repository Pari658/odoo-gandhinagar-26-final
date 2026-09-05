import { query } from '../db/index.js';

/**
 * GET /api/v1/budgets
 * Fetches all budgets with live achieved progress
 */
export async function getBudgets(req, res) {
  try {
    const sql = `
      SELECT 
        bp.budget_id,
        bp.budget_name,
        bp.analytic_account_id,
        bp.analytic_name,
        bp.analytic_type,
        bp.period_start,
        bp.period_end,
        bp.committed_amount::numeric(14,2) AS committed_amount,
        bp.achieved_amount::numeric(14,2) AS achieved_amount,
        bp.achieved_percent::numeric(5,2) AS achieved_percent,
        bp.amount_to_achieve::numeric(14,2) AS amount_to_achieve,
        bp.status,
        bp.responsible_contact_id,
        c.name AS responsible_contact_name
      FROM v_budget_progress bp
      LEFT JOIN contacts c ON c.id = bp.responsible_contact_id
      ORDER BY bp.period_start DESC, bp.budget_name ASC;
    `;

    const result = await query(sql);
    const rawItems = result?.rows || [];

    const items = rawItems.map(b => {
      const committed = parseFloat(b.committed_amount) || 0;
      const achieved = parseFloat(b.achieved_amount) || 0;
      const percent = parseFloat(b.achieved_percent) || 0;
      const remaining = parseFloat(b.amount_to_achieve) || 0;

      // Determine health status
      let health = 'on_track'; // green
      let healthLabel = 'Within Budget';
      if (b.analytic_type === 'expense') {
        if (percent > 100) {
          health = 'over_budget';
          healthLabel = 'Exceeded Limit';
        } else if (percent >= 80) {
          health = 'warning';
          healthLabel = 'Approaching Cap';
        }
      } else {
        // Income target
        if (percent >= 100) {
          health = 'achieved';
          healthLabel = 'Target Reached';
        } else if (percent >= 50) {
          health = 'on_track';
          healthLabel = 'In Progress';
        } else {
          health = 'behind';
          healthLabel = 'Needs Attention';
        }
      }

      return {
        id: b.budget_id,
        name: b.budget_name,
        analyticAccountId: b.analytic_account_id,
        analyticName: b.analytic_name,
        analyticType: b.analytic_type,
        periodStart: b.period_start ? new Date(b.period_start).toISOString().split('T')[0] : '',
        periodEnd: b.period_end ? new Date(b.period_end).toISOString().split('T')[0] : '',
        committedAmount: committed,
        achievedAmount: achieved,
        achievedPercent: percent,
        amountToAchieve: remaining,
        status: b.status,
        health,
        healthLabel,
        responsibleContactId: b.responsible_contact_id,
        responsibleContactName: b.responsible_contact_name || 'General Management'
      };
    });

    // Compute executive totals
    const expenseBudgets = items.filter(b => b.analyticType === 'expense');
    const incomeBudgets = items.filter(b => b.analyticType === 'income');

    const totalExpenseCommitted = expenseBudgets.reduce((s, b) => s + b.committedAmount, 0);
    const totalExpenseAchieved = expenseBudgets.reduce((s, b) => s + b.achievedAmount, 0);

    const totalIncomeTarget = incomeBudgets.reduce((s, b) => s + b.committedAmount, 0);
    const totalIncomeAchieved = incomeBudgets.reduce((s, b) => s + b.achievedAmount, 0);

    return res.json({
      success: true,
      data: {
        summary: {
          totalExpenseCommitted: parseFloat(totalExpenseCommitted.toFixed(2)),
          totalExpenseAchieved: parseFloat(totalExpenseAchieved.toFixed(2)),
          expenseUtilizationPercent: totalExpenseCommitted > 0 
            ? parseFloat(((totalExpenseAchieved / totalExpenseCommitted) * 100).toFixed(1)) 
            : 0,
          totalIncomeTarget: parseFloat(totalIncomeTarget.toFixed(2)),
          totalIncomeAchieved: parseFloat(totalIncomeAchieved.toFixed(2)),
          incomeAchievementPercent: totalIncomeTarget > 0 
            ? parseFloat(((totalIncomeAchieved / totalIncomeTarget) * 100).toFixed(1)) 
            : 0,
          totalBudgets: items.length
        },
        items
      },
      error: null
    });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'BUDGET_ERROR', message: error.message || 'Failed to fetch budgets' }
    });
  }
}

/**
 * POST /api/v1/budgets
 * Create a new budget
 */
export async function createBudget(req, res) {
  try {
    const { 
      name, 
      analyticAccountId, 
      periodStart, 
      periodEnd, 
      committedAmount, 
      responsibleContactId,
      status = 'confirmed'
    } = req.body;

    if (!name || !analyticAccountId || !periodStart || !periodEnd || committedAmount === undefined) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'Name, analytic account, start/end dates, and committed amount are required.' }
      });
    }

    if (new Date(periodEnd) < new Date(periodStart)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'Period end date cannot be earlier than start date.' }
      });
    }

    const insertSql = `
      INSERT INTO budgets (
        id, name, analytic_account_id, period_start, period_end, committed_amount, responsible_contact_id, status
      ) VALUES (
        gen_random_uuid(), $1, $2, $3::date, $4::date, $5::numeric, $6, $7
      ) RETURNING id;
    `;

    const insertRes = await query(insertSql, [
      name.trim(),
      analyticAccountId,
      periodStart,
      periodEnd,
      committedAmount,
      responsibleContactId || null,
      status
    ]);

    const newId = insertRes.rows[0]?.id;

    return res.status(201).json({
      success: true,
      data: { id: newId, message: 'Budget created successfully' },
      error: null
    });
  } catch (error) {
    console.error('Error creating budget:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'BUDGET_ERROR', message: error.message || 'Failed to create budget' }
    });
  }
}

/**
 * PATCH /api/v1/budgets/:id/confirm
 * Confirm draft budget
 */
export async function confirmBudget(req, res) {
  try {
    const { id } = req.params;
    const updateSql = `
      UPDATE budgets 
      SET status = 'confirmed'
      WHERE id = $1
      RETURNING id, name, status;
    `;
    const result = await query(updateSql, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Budget not found' }
      });
    }
    return res.json({
      success: true,
      data: { budget: result.rows[0], message: 'Budget confirmed successfully' },
      error: null
    });
  } catch (error) {
    console.error('Error confirming budget:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'BUDGET_ERROR', message: error.message }
    });
  }
}

/**
 * GET /api/v1/budgets/check
 * Dev 2 Purchase Order Budget Warning Ping
 * Query params:
 *  - analyticAccountId: UUID
 *  - amount: number
 *  - date: YYYY-MM-DD (defaults to today)
 */
export async function checkBudget(req, res) {
  try {
    const { analyticAccountId, amount, date } = req.query;
    if (!analyticAccountId || amount === undefined) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'analyticAccountId and amount are required.' }
      });
    }

    const checkDate = date || new Date().toISOString().split('T')[0];
    const proposedAmount = parseFloat(amount) || 0;

    const sql = `
      SELECT 
        b.id AS budget_id,
        b.name AS budget_name,
        aa.name AS analytic_name,
        b.committed_amount,
        COALESCE(achieved.achieved_amount, 0) AS achieved_amount,
        b.committed_amount - COALESCE(achieved.achieved_amount, 0) AS remaining_budget
      FROM budgets b
      JOIN analytic_accounts aa ON aa.id = b.analytic_account_id
      LEFT JOIN LATERAL (
          SELECT SUM(vbl.quantity * vbl.unit_price) AS achieved_amount
          FROM vendor_bill_lines vbl
          JOIN vendor_bills vb ON vb.id = vbl.vendor_bill_id
          WHERE vbl.analytic_account_id = b.analytic_account_id
            AND vb.invoice_date BETWEEN b.period_start AND b.period_end
      ) achieved ON TRUE
      WHERE b.analytic_account_id = $1
        AND b.status = 'confirmed'
        AND $2::date BETWEEN b.period_start AND b.period_end
      LIMIT 1;
    `;

    const result = await query(sql, [analyticAccountId, checkDate]);
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: {
          hasBudget: false,
          exceedsBudget: false,
          warning: null,
          message: 'No active budget set for this analytic account in this period.'
        },
        error: null
      });
    }

    const b = result.rows[0];
    const committed = parseFloat(b.committed_amount) || 0;
    const achieved = parseFloat(b.achieved_amount) || 0;
    const remaining = parseFloat(b.remaining_budget) || 0;
    const projectedTotal = achieved + proposedAmount;
    const exceedsBudget = projectedTotal > committed;
    const overage = exceedsBudget ? parseFloat((projectedTotal - committed).toFixed(2)) : 0;

    let warning = null;
    if (exceedsBudget) {
      warning = `Budget Warning: Adding ₹${proposedAmount.toLocaleString('en-IN')} to "${b.analytic_name}" will exceed the planned budget cap (₹${committed.toLocaleString('en-IN')}) by ₹${overage.toLocaleString('en-IN')}.`;
    }

    return res.json({
      success: true,
      data: {
        hasBudget: true,
        budgetId: b.budget_id,
        budgetName: b.budget_name,
        analyticName: b.analytic_name,
        committedAmount: committed,
        achievedAmount: achieved,
        remainingBudget: remaining,
        proposedAmount,
        projectedTotal: parseFloat(projectedTotal.toFixed(2)),
        exceedsBudget,
        overage,
        warning
      },
      error: null
    });
  } catch (error) {
    console.error('Error checking budget availability:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'BUDGET_CHECK_ERROR', message: error.message }
    });
  }
}

/**
 * POST /api/v1/budgets/seed-demo
 * Helper to seed sample budgets
 */
export async function seedDemoBudgets(req, res) {
  try {
    // Check if budgets already exist
    const countRes = await query('SELECT count(*) FROM budgets;');
    if (parseInt(countRes.rows[0].count, 10) > 0) {
      return res.json({
        success: true,
        data: { message: 'Budgets already exist.' },
        error: null
      });
    }

    const aaRes = await query('SELECT id, name, type FROM analytic_accounts;');
    const aaMap = {};
    aaRes.rows.forEach(r => { aaMap[r.name] = r.id; });

    const cRes = await query('SELECT id FROM contacts LIMIT 1;');
    const contactId = cRes.rows[0]?.id || null;

    const currentYear = new Date().getFullYear();
    const periodStart = `${currentYear}-01-01`;
    const periodEnd = `${currentYear}-12-31`;

    // Seed 2 budgets:
    // 1. Raw Timber Procurement Cap (Expense) Committed: 50,000 (actual bills: 35,000 => 70% used)
    // 2. Office Furniture Sales Target (Income) Committed: 100,000 (actual invoices: 85,000 => 85% achieved)
    if (aaMap['Teak Raw Material Procurement']) {
      await query(`
        INSERT INTO budgets (id, name, analytic_account_id, period_start, period_end, committed_amount, responsible_contact_id, status)
        VALUES (gen_random_uuid(), 'Q1-Q4 Raw Timber Procurement Cap', $1, $2::date, $3::date, 50000.00, $4, 'confirmed');
      `, [aaMap['Teak Raw Material Procurement'], periodStart, periodEnd, contactId]);
    }

    if (aaMap['Office Furniture Line']) {
      await query(`
        INSERT INTO budgets (id, name, analytic_account_id, period_start, period_end, committed_amount, responsible_contact_id, status)
        VALUES (gen_random_uuid(), 'FY26 Office Furniture Sales Target', $1, $2::date, $3::date, 100000.00, $4, 'confirmed');
      `, [aaMap['Office Furniture Line'], periodStart, periodEnd, contactId]);
    }

    if (aaMap['Gandhinagar Store Renovation Project']) {
      await query(`
        INSERT INTO budgets (id, name, analytic_account_id, period_start, period_end, committed_amount, responsible_contact_id, status)
        VALUES (gen_random_uuid(), 'Store Renovation Expense Cap', $1, $2::date, $3::date, 20000.00, $4, 'confirmed');
      `, [aaMap['Gandhinagar Store Renovation Project'], periodStart, periodEnd, contactId]);
    }

    return res.json({
      success: true,
      data: { message: 'Demo budgets seeded successfully.' },
      error: null
    });
  } catch (error) {
    console.error('Error seeding demo budgets:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SEED_ERROR', message: error.message }
    });
  }
}
