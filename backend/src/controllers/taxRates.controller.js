import pool from '../config/supabase.js';

export async function getTaxRates(req, res) {
  try {
    const result = await pool.query(`SELECT * FROM tax_rates ORDER BY name ASC`);
    
    const formatted = result.rows.map(t => ({
      id: t.id,
      name: t.name,
      ratePercent: parseFloat(t.rate_percent),
      linkedAccountId: t.linked_account_id || null
    }));

    return res.json({
      success: true,
      data: formatted,
      error: null
    });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

export async function createTaxRate(req, res) {
  try {
    const { name, ratePercent, linkedAccountId } = req.body;

    if (!name || ratePercent === undefined) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name and ratePercent are required',
          field: !name ? 'name' : 'ratePercent'
        }
      });
    }

    const result = await pool.query(`
      INSERT INTO tax_rates (name, rate_percent, linked_account_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [name, ratePercent, linkedAccountId || null]);

    const newTaxRate = result.rows[0];

    return res.status(201).json({
      success: true,
      data: {
        id: newTaxRate.id,
        name: newTaxRate.name,
        ratePercent: parseFloat(newTaxRate.rate_percent),
        linkedAccountId: newTaxRate.linked_account_id
      },
      error: null
    });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

export async function updateTaxRate(req, res) {
  try {
    const { id } = req.params;
    const { name, ratePercent, linkedAccountId } = req.body;

    if (!name || ratePercent === undefined) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name and ratePercent are required for update'
        }
      });
    }

    const result = await pool.query(`
      UPDATE tax_rates
      SET name = $1, rate_percent = $2, linked_account_id = $3
      WHERE id = $4
      RETURNING *
    `, [name, ratePercent, linkedAccountId || null, id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Tax rate not found' }
      });
    }

    const updated = result.rows[0];

    return res.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        ratePercent: parseFloat(updated.rate_percent),
        linkedAccountId: updated.linked_account_id
      },
      error: null
    });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

export async function deleteTaxRate(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      DELETE FROM tax_rates
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Tax rate not found' }
      });
    }

    return res.json({
      success: true,
      data: { id, message: 'Tax rate deleted successfully' },
      error: null
    });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}
