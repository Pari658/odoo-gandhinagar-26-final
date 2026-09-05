import pool from '../config/supabase.js';
import { inMemoryStore } from '../db/index.js';

export async function getAnalyticAccounts(req, res) {
  try {
    const { type } = req.query;
    let queryText = 'SELECT * FROM analytic_accounts ORDER BY name ASC';
    let params = [];

    if (type) {
      queryText = 'SELECT * FROM analytic_accounts WHERE type::text = $1 ORDER BY name ASC';
      params = [type];
    }

    const dbRes = await pool.query(queryText, params);

    const formatted = dbRes.rows.map(a => ({
      id: a.id,
      name: a.name,
      type: a.type
    }));

    return res.json({
      success: true,
      data: formatted,
      error: null
    });
  } catch (err) {
    console.error('getAnalyticAccounts error, falling back to inMemoryStore:', err.message);
    const { type } = req.query;
    let items = [...inMemoryStore.analytic_accounts];
    if (type) {
      items = items.filter(a => a.type === type);
    }
    return res.json({
      success: true,
      data: items,
      error: null
    });
  }
}

export async function getAnalyticAccountById(req, res) {
  try {
    const { id } = req.params;
    const dbRes = await pool.query('SELECT * FROM analytic_accounts WHERE id = $1', [id]);

    if (dbRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Analytic account not found' }
      });
    }

    const row = dbRes.rows[0];
    return res.json({
      success: true,
      data: {
        id: row.id,
        name: row.name,
        type: row.type
      },
      error: null
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SERVER_ERROR', message: err.message }
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

    const dbRes = await pool.query(
      'DELETE FROM analytic_accounts WHERE id = $1 RETURNING *',
      [id]
    );

    if (dbRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Analytic account not found' }
      });
    }

    return res.json({
      success: true,
      data: { id, message: 'Analytic account deleted successfully' },
      error: null
    });
  } catch (err) {
    console.error('deleteAnalyticAccount error:', err.message);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
}

export async function getAnalyticBudgets(req, res) {
  const { id } = req.params;

  try {
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
