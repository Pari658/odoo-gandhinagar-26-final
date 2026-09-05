import { inMemoryStore } from '../db/index.js';

export async function getAccounts(req, res) {
  const { type, reportGroup } = req.query;

  let items = [...inMemoryStore.chart_of_accounts];

  if (type) {
    items = items.filter(a => a.type === type);
  }

  if (reportGroup) {
    items = items.filter(a => a.report_group === reportGroup);
  }

  const formatted = items.map(a => ({
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
}

export async function createAccount(req, res) {
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

  const newAccount = {
    id: `acc-${Date.now().toString().slice(-4)}`,
    name,
    type,
    report_group: derivedReportGroup,
    is_archived: false,
    created_at: new Date().toISOString()
  };

  inMemoryStore.chart_of_accounts.push(newAccount);

  return res.status(201).json({
    success: true,
    data: {
      id: newAccount.id,
      name: newAccount.name,
      type: newAccount.type,
      reportGroup: newAccount.report_group,
      isArchived: false,
      createdAt: newAccount.created_at
    },
    error: null
  });
}
