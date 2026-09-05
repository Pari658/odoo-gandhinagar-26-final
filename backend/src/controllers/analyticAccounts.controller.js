import { pool } from '../config/supabase.js';

export async function getAnalyticAccounts(req, res) {
  try {
    const { type } = req.query;
    let queryText = 'SELECT * FROM analytic_accounts ORDER BY name ASC';
    let params = [];

  try {
    let query = 'SELECT id, name, type FROM analytic_accounts';
    const params = [];
    
    if (type) {
      query += ' WHERE type = $1';
      params.push(type);
    }
    
    query += ' ORDER BY name ASC';
    
    const result = await pool.query(query, params);

    return res.json({
      success: true,
      data: result.rows,
      error: null
    });
  } catch (error) {
    console.error('Error fetching analytic accounts:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'DB_ERROR',
        message: 'Failed to fetch analytic accounts'
      }
    });
  }
}

export async function createAnalyticAccount(req, res) {
  try {
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name and type (income/expense) are required',
          field: !name ? 'name' : 'type'
        }
      });
    }

    const dbRes = await pool.query(
      `INSERT INTO analytic_accounts (name, type)
       VALUES ($1, $2)
       RETURNING *`,
      [name, type]
    );

    const created = dbRes.rows[0];

    return res.status(201).json({
      success: true,
      data: {
        id: created.id,
        name: created.name,
        type: created.type
      },
      error: null
    });
  } catch (err) {
    console.error('createAnalyticAccount error:', err.message);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
}

export async function updateAnalyticAccount(req, res) {
  try {
    const { id } = req.params;
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name and type are required for update'
        }
      });
    }

    const dbRes = await pool.query(
      `UPDATE analytic_accounts
       SET name = $1, type = $2
       WHERE id = $3
       RETURNING *`,
      [name, type, id]
    );

    if (dbRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Analytic account not found' }
      });
    }

    const updated = dbRes.rows[0];
    return res.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        type: updated.type
      },
      error: null
    });
  } catch (err) {
    console.error('updateAnalyticAccount error:', err.message);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
}

export async function deleteAnalyticAccount(req, res) {
  try {
    const { id } = req.params;

  try {
    const result = await pool.query(
      'INSERT INTO analytic_accounts (name, type) VALUES ($1, $2) RETURNING id, name, type',
      [name, type]
    );

    return res.status(201).json({
      success: true,
      data: result.rows[0],
      error: null
    });
  } catch (error) {
    console.error('Error creating analytic account:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'DB_ERROR',
        message: 'Failed to create analytic account'
      }
    });
  }
}

export async function getAnalyticBudgets(req, res) {
  const { id } = req.params;

  try {
    // For now, return the mock data if budgets table is not fully populated/implemented.
    // If you have a budget table, you could query it here. We'll use a placeholder for now
    // based on the previous mock data since the user didn't mention migrating budgets specifically.
    return res.json({
      success: true,
      data: {
        items: [
          {
            id: `b-${id}-01`,
            name: `Budget for ${id}`,
            periodStart: '2026-01-01',
            periodEnd: '2026-12-31',
            committedAmount: 250000.00,
            achievedAmount: 48920.00,
            achievedPercent: 19.57,
            amountToAchieve: 201080.00
          }
        ],
        page: 1,
        pageSize: 20,
        totalCount: 1
      },
      error: null
    });
  } catch (error) {
    return res.status(500).json({ success: false, data: null, error: { message: 'Server error' } });
  }
}
