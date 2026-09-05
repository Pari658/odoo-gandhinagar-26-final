import { inMemoryStore } from '../db/index.js';

export async function getTaxRates(req, res) {
  const formatted = inMemoryStore.tax_rates.map(t => ({
    id: t.id,
    name: t.name,
    ratePercent: parseFloat(Number(t.rate_percent).toFixed(2)),
    linkedAccountId: t.linked_account_id || null
  }));

  return res.json({
    success: true,
    data: formatted,
    error: null
  });
}

export async function createTaxRate(req, res) {
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

  const newTaxRate = {
    id: `tax-${Date.now().toString().slice(-4)}`,
    name,
    rate_percent: parseFloat(Number(ratePercent).toFixed(2)),
    linked_account_id: linkedAccountId || null
  };

  inMemoryStore.tax_rates.push(newTaxRate);

  return res.status(201).json({
    success: true,
    data: {
      id: newTaxRate.id,
      name: newTaxRate.name,
      ratePercent: newTaxRate.rate_percent,
      linkedAccountId: newTaxRate.linked_account_id
    },
    error: null
  });
}
