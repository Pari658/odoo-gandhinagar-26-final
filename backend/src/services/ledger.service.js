/**
 * Shared Ledger Service for creating Journal Entries
 * 
 * As per the API Contract, this is the single source of truth for creating
 * Journal Entries to prevent ledger imbalances.
 */

export async function createJournalEntry(client, data) {
  const {
    entryDate,
    journalId,
    status = 'draft',
    lines,
    createdBy
  } = data;

  const toMinorUnits = (value) => {
    const text = String(value ?? 0).trim();
    if (!/^\d+(\.\d{1,2})?$/.test(text)) {
      throw new Error(`Invalid monetary value: ${text}`);
    }
    const [whole, fraction = ''] = text.split('.');
    return (BigInt(whole) * 100n) + BigInt(fraction.padEnd(2, '0'));
  };

  let totalDebit = 0n;
  let totalCredit = 0n;

  for (const line of lines) {
    totalDebit += toMinorUnits(line.debit);
    totalCredit += toMinorUnits(line.credit);
  }

  if (status === 'posted' && totalDebit !== totalCredit) {
    const error = new Error('Total debit does not equal total credit');
    error.code = 'UNBALANCED_ENTRY';
    throw error;
  }

  // Generate a rudimentary entry number
  const entryNumber = `JE/${new Date(entryDate).getFullYear()}/${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

  const jeResult = await client.query(
    `INSERT INTO journal_entries (number, journal_id, entry_date, status, source_type, source_id, created_at)
     VALUES ($1, $2, $3, $4::je_status, $5, $6, NOW())
     RETURNING id, number, status`,
    [entryNumber, journalId, entryDate, status, data.sourceType, data.sourceId]
  );
  
  const je = jeResult.rows[0];

  const lineResults = [];
  for (const line of lines) {
    const res = await client.query(
      `INSERT INTO journal_entry_lines (journal_entry_id, account_id, partner_id, analytic_account_id, debit, credit)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        je.id,
        line.accountId,
        line.partnerId || null,
        line.analyticAccountId || null,
        line.debit || 0,
        line.credit || 0
      ]
    );
    lineResults.push(res.rows[0]);
  }

  return {
    ...je,
    lines: lineResults
  };
}
