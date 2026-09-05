import { inMemoryStore } from '../db/index.js';

export async function getJournals(req, res) {
  const formatted = inMemoryStore.journals.map(j => ({
    id: j.id,
    name: j.name,
    type: j.type,
    defaultDebitAccountId: j.default_debit_account_id || null,
    defaultCreditAccountId: j.default_credit_account_id || null,
    createdAt: j.created_at
  }));

  return res.json({
    success: true,
    data: formatted,
    error: null
  });
}

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

  const newJournal = {
    id: `j-${Date.now().toString().slice(-4)}`,
    name,
    type,
    default_debit_account_id: defaultDebitAccountId || null,
    default_credit_account_id: defaultCreditAccountId || null,
    created_at: new Date().toISOString()
  };

  inMemoryStore.journals.push(newJournal);

  return res.status(201).json({
    success: true,
    data: {
      id: newJournal.id,
      name: newJournal.name,
      type: newJournal.type,
      defaultDebitAccountId: newJournal.default_debit_account_id,
      defaultCreditAccountId: newJournal.default_credit_account_id,
      createdAt: newJournal.created_at
    },
    error: null
  });
}
