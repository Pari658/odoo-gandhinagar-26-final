import { pool } from '../config/supabase.js';

export async function getAccounts(req, res, next) {
  try {
  const { type, reportGroup } = req.query;
    const params = [];
    const filters = [];

    if (type) {
      params.push(type);
      filters.push(`type = $${params.length}`);
    }

    if (reportGroup) {
      params.push(reportGroup);
      filters.push(`report_group = $${params.length}`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT id, name, type, report_group, is_archived, created_at
       FROM chart_of_accounts
       ${whereClause}
       ORDER BY name`,
      params
    );

    const formatted = result.rows.map(a => ({
    id: a.id,
    name: a.name,
    type: a.type,
    reportGroup: a.report_group,
    isArchived: Boolean(a.is_archived),
    createdAt: a.created_at
    }));

  const grouped = {
    asset: formatted.filter(a => a.type === 'asset'),
    bank: formatted.filter(a => a.type === 'bank'),
    cash: formatted.filter(a => a.type === 'cash'),
    liability: formatted.filter(a => a.type === 'liability'),
    capital: formatted.filter(a => a.type === 'capital'),
    income: formatted.filter(a => a.type === 'income'),
    expense: formatted.filter(a => a.type === 'expense'),
    other_expense: formatted.filter(a => a.type === 'other_expense')
  };

    return res.json({
      success: true,
      data: {
        items: formatted,
        grouped
      },
      error: null
    });
  } catch (err) {
    next(err);
  }
}

export async function createAccount(req, res, next) {
  try {
  const { name, type, reportGroup } = req.body;

  if (!name || !type) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Name and type are required',
        field: !name ? 'name' : 'type'
      }
    });
  }

  const derivedReportGroup = reportGroup || (
    ['asset', 'liability', 'bank', 'cash', 'capital'].includes(type) ? 'balance_sheet' : 'profit_and_loss'
  );

    const result = await pool.query(
      `INSERT INTO chart_of_accounts (name, type, report_group, is_archived, created_at)
       VALUES ($1, $2, $3, false, NOW())
       RETURNING id, name, type, report_group, is_archived, created_at`,
      [name, type, derivedReportGroup]
    );
    const newAccount = result.rows[0];

    return res.status(201).json({
      success: true,
      data: {
        id: newAccount.id,
        name: newAccount.name,
        type: newAccount.type,
        reportGroup: newAccount.report_group,
        isArchived: newAccount.is_archived,
        createdAt: newAccount.created_at
      },
      error: null
    });
  } catch (err) {
    next(err);
  }
}
