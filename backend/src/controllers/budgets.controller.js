import { query } from '../db/index.js';

const budgetProgressSource = `
  budgets b
  JOIN analytic_accounts aa ON aa.id = b.analytic_account_id
  LEFT JOIN contacts rc ON rc.id = b.responsible_contact_id
  LEFT JOIN budgets rb ON rb.id = b.revision_of_id
  LEFT JOIN LATERAL (
    SELECT SUM(amount) AS achieved_amount
    FROM (
      SELECT SUM(cil.quantity * cil.unit_price) AS amount
      FROM customer_invoice_lines cil
      JOIN customer_invoices ci ON ci.id = cil.customer_invoice_id
      WHERE aa.type = 'income'
        AND cil.analytic_account_id = aa.id
        AND ci.journal_entry_id IS NOT NULL
        AND ci.invoice_date BETWEEN b.period_start AND b.period_end
      UNION ALL
      SELECT SUM(vbl.quantity * vbl.unit_price) AS amount
      FROM vendor_bill_lines vbl
      JOIN vendor_bills vb ON vb.id = vbl.vendor_bill_id
      WHERE aa.type = 'expense'
        AND vbl.analytic_account_id = aa.id
        AND vb.journal_entry_id IS NOT NULL
        AND vb.invoice_date BETWEEN b.period_start AND b.period_end
    ) achieved_rows
  ) achieved ON TRUE
`;

const budgetProgressColumns = `
  b.id AS budget_id,
  b.name AS budget_name,
  aa.id AS analytic_account_id,
  aa.name AS analytic_name,
  aa.type AS analytic_type,
  b.period_start,
  b.period_end,
  b.committed_amount::numeric(14,2) AS committed_amount,
  COALESCE(achieved.achieved_amount, 0)::numeric(14,2) AS achieved_amount,
  CASE WHEN b.committed_amount > 0
    THEN ROUND(COALESCE(achieved.achieved_amount, 0) / b.committed_amount * 100, 2)
    ELSE 0 END AS achieved_percent,
  (b.committed_amount - COALESCE(achieved.achieved_amount, 0))::numeric(14,2) AS amount_to_achieve,
  b.status,
  b.responsible_contact_id,
  b.revision_of_id,
  rb.name AS revision_of_name,
  rc.name AS responsible_contact_name
`;

/**
 * Format a row from v_budget_progress into an API response object
 */
function mapBudgetRow(b) {
  const committed = parseFloat(b.committed_amount) || 0;
  const achieved = parseFloat(b.achieved_amount) || 0;
  const percent = parseFloat(b.achieved_percent) || 0;
  const remaining = parseFloat(b.amount_to_achieve) || 0;

  // Determine health status
  let health = 'on_track';
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
    revisionOfId: b.revision_of_id,
    revisionOfName: b.revision_of_name,
    health,
    healthLabel,
    responsibleContactId: b.responsible_contact_id,
    responsibleContactName: b.responsible_contact_name || 'General Management'
  };
}

/**
 * GET /api/v1/budgets
 * Fetches all budgets with live achieved progress
 */
export async function getBudgets(req, res) {
  try {
    const sql = `
      SELECT ${budgetProgressColumns}
      FROM ${budgetProgressSource}
      ORDER BY b.period_start DESC, b.name ASC;
    `;

    const result = await query(sql);
    const rawItems = result?.rows || [];
    const items = rawItems.map(mapBudgetRow);

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
 * GET /api/v1/budgets/:id
 * Fetches a single budget with live progress
 */
export async function getBudgetById(req, res) {
  try {
    const { id } = req.params;
    const sql = `
      SELECT ${budgetProgressColumns}
      FROM ${budgetProgressSource}
      WHERE b.id = $1
      LIMIT 1;
    `;

    const result = await query(sql, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Budget not found' }
      });
    }

    return res.json({
      success: true,
      data: mapBudgetRow(result.rows[0]),
      error: null
    });
  } catch (error) {
    console.error('Error fetching budget by id:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'BUDGET_ERROR', message: error.message }
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
      status = 'confirmed',
      revisionOfId = null
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
        id, name, analytic_account_id, period_start, period_end, committed_amount, responsible_contact_id, status, revision_of_id
      ) VALUES (
        gen_random_uuid(), $1, $2, $3::date, $4::date, $5::numeric, $6, $7, $8
      ) RETURNING id;
    `;

    const insertRes = await query(insertSql, [
      name.trim(),
      analyticAccountId,
      periodStart,
      periodEnd,
      committedAmount,
      responsibleContactId || null,
      status,
      revisionOfId || null
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
 * PUT /api/v1/budgets/:id
 * Update an existing budget
 */
export async function updateBudget(req, res) {
  try {
    const { id } = req.params;
    const {
      name,
      analyticAccountId,
      periodStart,
      periodEnd,
      committedAmount,
      responsibleContactId,
      status
    } = req.body;

    const updateSql = `
      UPDATE budgets
      SET 
        name = COALESCE($1, name),
        analytic_account_id = COALESCE($2, analytic_account_id),
        period_start = COALESCE($3::date, period_start),
        period_end = COALESCE($4::date, period_end),
        committed_amount = COALESCE($5::numeric, committed_amount),
        responsible_contact_id = $6,
        status = COALESCE($7, status)
      WHERE id = $8
      RETURNING id;
    `;

    const result = await query(updateSql, [
      name ? name.trim() : null,
      analyticAccountId || null,
      periodStart || null,
      periodEnd || null,
      committedAmount !== undefined ? committedAmount : null,
      responsibleContactId || null,
      status || null,
      id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Budget not found' }
      });
    }

    return res.json({
      success: true,
      data: { id, message: 'Budget updated successfully' },
      error: null
    });
  } catch (error) {
    console.error('Error updating budget:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'BUDGET_ERROR', message: error.message }
    });
  }
}

/**
 * PATCH /api/v1/budgets/:id/status
 * Update status ('draft', 'confirmed', 'revised', 'cancelled')
 */
export async function updateBudgetStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['draft', 'confirmed', 'revised', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'Status must be draft, confirmed, revised, or cancelled' }
      });
    }

    const updateSql = `
      UPDATE budgets 
      SET status = $1
      WHERE id = $2
      RETURNING id, name, status;
    `;
    const result = await query(updateSql, [status, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Budget not found' }
      });
    }
    return res.json({
      success: true,
      data: { budget: result.rows[0], message: `Budget status changed to ${status}` },
      error: null
    });
  } catch (error) {
    console.error('Error updating budget status:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'BUDGET_ERROR', message: error.message }
    });
  }
}

/**
 * PATCH /api/v1/budgets/:id/confirm
 */
export async function confirmBudget(req, res) {
  req.body.status = 'confirmed';
  return updateBudgetStatus(req, res);
}

/**
 * PATCH /api/v1/budgets/:id/cancel
 */
export async function cancelBudget(req, res) {
  req.body.status = 'cancelled';
  return updateBudgetStatus(req, res);
}

/**
 * POST /api/v1/budgets/:id/revise
 * Create a revised budget linked to the original budget
 */
export async function reviseBudget(req, res) {
  try {
    const { id } = req.params;

    // Fetch original budget
    const origRes = await query('SELECT * FROM budgets WHERE id = $1', [id]);
    if (origRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Original budget not found' }
      });
    }

    const orig = origRes.rows[0];
    const newName = orig.name.endsWith('(Revised)') ? orig.name : `${orig.name} (Revised)`;

    const insertSql = `
      INSERT INTO budgets (
        id, name, analytic_account_id, period_start, period_end, committed_amount, responsible_contact_id, status, revision_of_id
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'revised', $7
      ) RETURNING id;
    `;

    const insertRes = await query(insertSql, [
      newName,
      orig.analytic_account_id,
      orig.period_start,
      orig.period_end,
      orig.committed_amount,
      orig.responsible_contact_id,
      orig.id
    ]);

    const newId = insertRes.rows[0]?.id;

    return res.status(201).json({
      success: true,
      data: { id: newId, revisionOfId: orig.id, message: 'Budget revised successfully' },
      error: null
    });
  } catch (error) {
    console.error('Error revising budget:', error);
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
 */
export async function seedDemoBudgets(req, res) {
  try {
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

    if (aaMap['Project 8']) {
      await query(`
        INSERT INTO budgets (id, name, analytic_account_id, period_start, period_end, committed_amount, responsible_contact_id, status)
        VALUES (gen_random_uuid(), 'January 2026', $1, $2::date, $3::date, 200000.00, $4, 'confirmed');
      `, [aaMap['Project 8'], periodStart, periodEnd, contactId]);
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
