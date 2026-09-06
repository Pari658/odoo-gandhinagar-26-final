import { query } from '../config/supabase.js';

/**
 * GET /api/v1/journals
 * Returns all journals with joined account names from chart_of_accounts
 */
export async function getJournals(req, res) {
  try {
    const sql = `
      SELECT 
        j.id,
        j.name,
        j.type,
        j.default_debit_account_id AS "defaultDebitAccountId",
        da.name AS "defaultDebitAccountName",
        j.default_credit_account_id AS "defaultCreditAccountId",
        ca.name AS "defaultCreditAccountName",
        j.created_at AS "createdAt"
      FROM journals j
      LEFT JOIN chart_of_accounts da ON da.id = j.default_debit_account_id
      LEFT JOIN chart_of_accounts ca ON ca.id = j.default_credit_account_id
      ORDER BY j.created_at ASC;
    `;
    const result = await query(sql);

    return res.json({
      success: true,
      data: result.rows,
      error: null
    });
  } catch (err) {
    console.error('Error fetching journals from DB:', err.message);
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'DB_ERROR',
        message: 'Failed to fetch journals'
      }
    });
  }
}

/**
 * POST /api/v1/journals
 * Creates a new journal in Supabase / PostgreSQL
 */
export async function createJournal(req, res) {
  const { name, type, defaultDebitAccountId, defaultCreditAccountId } = req.body;

  if (!name || !type) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Name and journal type (sales/purchase/bank/cash) are required',
        field: !name ? 'name' : 'type'
      }
    });
  }

  const validTypes = ['sales', 'purchase', 'bank', 'cash'];
  if (!validTypes.includes(type.toLowerCase())) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Invalid journal type '${type}'. Must be one of: ${validTypes.join(', ')}`,
        field: 'type'
      }
    });
  }

  const debitAccId = defaultDebitAccountId && defaultDebitAccountId.trim() ? defaultDebitAccountId.trim() : null;
  const creditAccId = defaultCreditAccountId && defaultCreditAccountId.trim() ? defaultCreditAccountId.trim() : null;

  try {
    const insertSql = `
      INSERT INTO journals (name, type, default_debit_account_id, default_credit_account_id)
      VALUES ($1, $2, $3, $4)
      RETURNING 
        id, 
        name, 
        type, 
        default_debit_account_id AS "defaultDebitAccountId", 
        default_credit_account_id AS "defaultCreditAccountId", 
        created_at AS "createdAt";
    `;
    const result = await query(insertSql, [name.trim(), type.toLowerCase(), debitAccId, creditAccId]);
    const created = result.rows[0];

    return res.status(201).json({
      success: true,
      data: created,
      error: null
    });
  } catch (err) {
    console.error('Error inserting journal into DB:', err.message);
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'DB_ERROR',
        message: 'Failed to create journal'
      }
    });
  }
}

/**
 * PUT /api/v1/journals/:id
 * Updates an existing journal in Supabase / PostgreSQL
 */
export async function updateJournal(req, res) {
  const { id } = req.params;
  const { name, type, defaultDebitAccountId, defaultCreditAccountId } = req.body;

  if (!name || !type) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Name and journal type (sales/purchase/bank/cash) are required',
        field: !name ? 'name' : 'type'
      }
    });
  }

  const validTypes = ['sales', 'purchase', 'bank', 'cash'];
  if (!validTypes.includes(type.toLowerCase())) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Invalid journal type '${type}'. Must be one of: ${validTypes.join(', ')}`,
        field: 'type'
      }
    });
  }

  const debitAccId = defaultDebitAccountId && defaultDebitAccountId.trim() ? defaultDebitAccountId.trim() : null;
  const creditAccId = defaultCreditAccountId && defaultCreditAccountId.trim() ? defaultCreditAccountId.trim() : null;

  try {
    const updateSql = `
      UPDATE journals
      SET 
        name = $1,
        type = $2,
        default_debit_account_id = $3,
        default_credit_account_id = $4
      WHERE id = $5
      RETURNING 
        id, 
        name, 
        type, 
        default_debit_account_id AS "defaultDebitAccountId", 
        default_credit_account_id AS "defaultCreditAccountId", 
        created_at AS "createdAt";
    `;
    const result = await query(updateSql, [name.trim(), type.toLowerCase(), debitAccId, creditAccId, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: `Journal with ID '${id}' not found`
        }
      });
    }

    return res.json({
      success: true,
      data: result.rows[0],
      error: null
    });
  } catch (err) {
    console.error('Error updating journal in DB:', err.message);
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'DATABASE_ERROR',
        message: err.message || 'Failed to update journal'
      }
    });
  }
}

/**
 * DELETE /api/v1/journals/:id
 * Deletes a journal by ID from Supabase / PostgreSQL
 */
export async function deleteJournal(req, res) {
  const { id } = req.params;

  try {
    const deleteSql = 'DELETE FROM journals WHERE id = $1 RETURNING id, name;';
    const result = await query(deleteSql, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: `Journal with ID '${id}' not found`
        }
      });
    }

    return res.json({
      success: true,
      data: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        message: `Journal '${result.rows[0].name}' deleted successfully`
      },
      error: null
    });
  } catch (err) {
    console.error('Error deleting journal from DB:', err.message);

    if (err.code === '23503') {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'FOREIGN_KEY_VIOLATION',
          message: 'Cannot delete this journal because it is referenced by existing journal entries or transactions.'
        }
      });
    }

    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'DATABASE_ERROR',
        message: err.message || 'Failed to delete journal'
      }
    });
  }
}

export async function getJournalById(req, res) {
  try {
    const journalResult = await query(`
      SELECT
        j.id,
        j.name,
        j.type,
        j.default_debit_account_id AS "defaultDebitAccountId",
        da.name AS "defaultDebitAccountName",
        j.default_credit_account_id AS "defaultCreditAccountId",
        ca.name AS "defaultCreditAccountName",
        j.created_at AS "createdAt"
      FROM journals j
      LEFT JOIN chart_of_accounts da ON da.id = j.default_debit_account_id
      LEFT JOIN chart_of_accounts ca ON ca.id = j.default_credit_account_id
      WHERE j.id = $1
    `, [req.params.id]);

    if (journalResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: 'Journal not found' }
      });
    }

    const entriesResult = await query(`
      SELECT
        je.id,
        je.number,
        je.entry_date AS "entryDate",
        je.reference,
        je.status,
        je.source_type AS "sourceType",
        je.source_id AS "sourceId",
        je.created_at AS "createdAt",
        jel.id AS "lineId",
        jel.account_id AS "accountId",
        coa.name AS "accountName",
        jel.partner_id AS "partnerId",
        c.name AS "partnerName",
        jel.debit,
        jel.credit
      FROM journal_entries je
      LEFT JOIN journal_entry_lines jel ON jel.journal_entry_id = je.id
      LEFT JOIN chart_of_accounts coa ON coa.id = jel.account_id
      LEFT JOIN contacts c ON c.id = jel.partner_id
      WHERE je.journal_id = $1
      ORDER BY je.entry_date DESC, je.created_at DESC, jel.id
    `, [req.params.id]);

    const entries = [];
    for (const row of entriesResult.rows) {
      let entry = entries.find(item => item.id === row.id);
      if (!entry) {
        entry = {
          id: row.id,
          number: row.number,
          entryDate: row.entryDate,
          reference: row.reference,
          status: row.status,
          sourceType: row.sourceType,
          sourceId: row.sourceId,
          createdAt: row.createdAt,
          lines: []
        };
        entries.push(entry);
      }

      if (row.lineId) {
        entry.lines.push({
          id: row.lineId,
          accountId: row.accountId,
          accountName: row.accountName,
          partnerId: row.partnerId,
          partnerName: row.partnerName,
          debit: Number(row.debit) || 0,
          credit: Number(row.credit) || 0
        });
      }
    }

    return res.json({
      success: true,
      data: { ...journalResult.rows[0], entries },
      error: null
    });
  } catch (err) {
    console.error('Error fetching journal detail:', err.message);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'DB_ERROR', message: 'Failed to fetch journal detail' }
    });
  }
}