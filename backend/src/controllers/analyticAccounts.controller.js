import { inMemoryStore } from '../db/index.js';

export async function getAnalyticAccounts(req, res) {
  const { type } = req.query;

  let items = [...inMemoryStore.analytic_accounts];
  if (type) {
    items = items.filter(a => a.type === type);
  }

  const formatted = items.map(a => ({
    id: a.id,
    name: a.name,
    type: a.type
  }));

  return res.json({
    success: true,
    data: formatted,
    error: null
  });
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

  const newAnalytic = {
    id: `aa-${Date.now().toString().slice(-4)}`,
    name,
    type
  };

  inMemoryStore.analytic_accounts.push(newAnalytic);

  return res.status(201).json({
    success: true,
    data: newAnalytic,
    error: null
  });
}

export async function getAnalyticBudgets(req, res) {
  const { id } = req.params;

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
}
