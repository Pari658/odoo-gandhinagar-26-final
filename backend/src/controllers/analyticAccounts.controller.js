import { pool } from '../config/supabase.js';

export async function getAnalyticAccounts(req, res) {
  const { type } = req.query;

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

export async function getAnalyticAccountById(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT id, name, type FROM analytic_accounts WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Analytic account not found'
        }
      });
    }

    return res.json({
      success: true,
      data: result.rows[0],
      error: null
    });
  } catch (error) {
    console.error('Error fetching analytic account by id:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'DB_ERROR',
        message: 'Failed to fetch analytic account'
      }
    });
  }
}

export async function createAnalyticAccount(req, res) {
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

  try {
    const result = await pool.query(
      'INSERT INTO analytic_accounts (name, type) VALUES ($1, $2) RETURNING id, name, type',
      [name.trim(), type]
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

export async function updateAnalyticAccount(req, res) {
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

  try {
    const result = await pool.query(
      'UPDATE analytic_accounts SET name = $1, type = $2 WHERE id = $3 RETURNING id, name, type',
      [name.trim(), type, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Analytic account not found'
        }
      });
    }

    return res.json({
      success: true,
      data: result.rows[0],
      error: null
    });
  } catch (error) {
    console.error('Error updating analytic account:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'DB_ERROR',
        message: 'Failed to update analytic account'
      }
    });
  }
}

export async function deleteAnalyticAccount(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM analytic_accounts WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: 'Analytic account not found'
        }
      });
    }

    return res.json({
      success: true,
      data: { id, message: 'Analytic account deleted successfully' },
      error: null
    });
  } catch (error) {
    console.error('Error deleting analytic account:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'DB_ERROR',
        message: error.message || 'Failed to delete analytic account'
      }
    });
  }
}

export async function getAnalyticBudgets(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        bp.budget_id AS id,
        bp.budget_name AS name,
        bp.period_start AS "periodStart",
        bp.period_end AS "periodEnd",
        bp.committed_amount::numeric(14,2) AS "committedAmount",
        bp.achieved_amount::numeric(14,2) AS "achievedAmount",
        bp.achieved_percent::numeric(5,2) AS "achievedPercent",
        bp.amount_to_achieve::numeric(14,2) AS "amountToAchieve"
      FROM v_budget_progress bp
      WHERE bp.analytic_account_id = $1
      ORDER BY bp.period_start DESC
    `, [id]);

    return res.json({
      success: true,
      data: {
        items: result.rows,
        page: 1,
        pageSize: 20,
        totalCount: result.rows.length
      },
      error: null
    });
  } catch (error) {
    console.error('Error fetching analytic budgets:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: { message: error.message || 'Server error' }
    });
  }
}