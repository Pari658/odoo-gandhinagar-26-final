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
export async function deleteAnalyticAccount(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM analytic_accounts WHERE id = $1 RETURNING id', [id]);

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
    console.error('Error deleting analytic account:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'DB_ERROR',
        message: 'Failed to delete analytic account'
      }
    });
  }
}
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