import { query, inMemoryStore } from '../db/index.js';

/**
 * GET /api/v1/reports/balance-sheet
 * Query params:
 *  - asOf: YYYY-MM-DD (defaults to today)
 *  - includeDraft: boolean (optional, default false)
 */
export async function getBalanceSheet(req, res) {
  try {
    const asOfDate = req.query.asOf || new Date().toISOString().split('T')[0];
    const includeDraft = req.query.includeDraft === 'true';

    const statusClause = includeDraft
      ? "je.status IN ('draft', 'posted')"
      : "je.status = 'posted'";

    // 1. Fetch all Balance Sheet Accounts with aggregated debits and credits up to asOfDate
    const bsQuery = `
  SELECT
    coa.id,
    coa.name,
    coa.type,
    coa.report_group,
    COALESCE(SUM(jel.debit), 0)::numeric(14,2) AS total_debit,
    COALESCE(SUM(jel.credit), 0)::numeric(14,2) AS total_credit
  FROM chart_of_accounts coa
  LEFT JOIN journal_entry_lines jel
    ON jel.account_id = coa.id
  LEFT JOIN journal_entries je
    ON je.id = jel.journal_entry_id
  WHERE coa.report_group = 'balance_sheet'
    AND coa.is_archived = FALSE
    AND (
      jel.id IS NULL
      OR (
        je.status = 'posted'
        AND je.entry_date <= $1::date
      )
    )
  GROUP BY coa.id, coa.name, coa.type, coa.report_group
  ORDER BY coa.type, coa.name;
`;

    // 2. Fetch Net Profit/Loss (Retained Earnings) up to asOfDate from P&L accounts
    const plQuery = `
      SELECT 
        coa.type,
        COALESCE(SUM(jel.debit), 0)::numeric(14,2) AS total_debit,
        COALESCE(SUM(jel.credit), 0)::numeric(14,2) AS total_credit
      FROM chart_of_accounts coa
      LEFT JOIN journal_entry_lines jel ON jel.account_id = coa.id
      LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id 
        AND ${statusClause}
        AND je.entry_date <= $1::date
      WHERE coa.report_group = 'profit_and_loss' AND coa.is_archived = FALSE
      GROUP BY coa.type;
    `;

    let bsRows = [];
    let plRows = [];

    try {
      const bsResult = await query(bsQuery, [asOfDate]);
      const plResult = await query(plQuery, [asOfDate]);
      bsRows = bsResult?.rows || [];
      plRows = plResult?.rows || [];
    } catch (dbErr) {
      console.warn('DB Query fallback in getBalanceSheet:', dbErr.message);
    }

    // If database returned no chart of accounts, fallback to inMemoryStore
    if (bsRows.length === 0 && inMemoryStore.chart_of_accounts) {
      bsRows = inMemoryStore.chart_of_accounts
        .filter(a => a.report_group === 'balance_sheet')
        .map(a => ({
          id: a.id,
          name: a.name,
          type: a.type,
          report_group: a.report_group,
          total_debit: 0,
          total_credit: 0
        }));
    }

    // Process Accounts
    const assetsList = [];
    const liabilitiesList = [];
    const equityList = [];

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalCapital = 0;

    for (const row of bsRows) {
      const debit = parseFloat(row.total_debit) || 0;
      const credit = parseFloat(row.total_credit) || 0;

      if (['asset', 'bank', 'cash'].includes(row.type)) {
        // Asset normal balance is Debit - Credit
        const balance = debit - credit;
        totalAssets += balance;
        assetsList.push({
          id: row.id,
          name: row.name,
          type: row.type,
          debit,
          credit,
          balance: parseFloat(balance.toFixed(2))
        });
      } else if (row.type === 'liability') {
        // Liability normal balance is Credit - Debit
        const balance = credit - debit;
        totalLiabilities += balance;
        liabilitiesList.push({
          id: row.id,
          name: row.name,
          type: row.type,
          debit,
          credit,
          balance: parseFloat(balance.toFixed(2))
        });
      } else if (row.type === 'capital') {
        // Capital normal balance is Credit - Debit
        const balance = credit - debit;
        totalCapital += balance;
        equityList.push({
          id: row.id,
          name: row.name,
          type: row.type,
          debit,
          credit,
          balance: parseFloat(balance.toFixed(2))
        });
      }
    }

    // Calculate Retained Earnings (Net Profit = Income credits - Expense debits)
    let netIncome = 0;
    for (const row of plRows) {
      const debit = parseFloat(row.total_debit) || 0;
      const credit = parseFloat(row.total_credit) || 0;
      if (row.type === 'income') {
        netIncome += (credit - debit);
      } else if (['expense', 'other_expense'].includes(row.type)) {
        netIncome -= (debit - credit);
      }
    }

    const retainedEarnings = parseFloat(netIncome.toFixed(2));
    const totalEquity = parseFloat((totalCapital + retainedEarnings).toFixed(2));
    const totalLiabilitiesAndEquity = parseFloat((totalLiabilities + totalEquity).toFixed(2));
    const roundedAssets = parseFloat(totalAssets.toFixed(2));

    // Balance check (within 1 cent difference for floating point)
    const discrepancy = parseFloat(Math.abs(roundedAssets - totalLiabilitiesAndEquity).toFixed(2));
    const isBalanced = discrepancy <= 0.05;

    return res.json({
      success: true,
      data: {
        reportName: 'Balance Sheet',
        asOfDate,
        currency: 'INR',
        currencySymbol: '₹',
        assets: {
          items: assetsList,
          subtotals: {
            bank: parseFloat(assetsList.filter(a => a.type === 'bank').reduce((s, a) => s + a.balance, 0).toFixed(2)),
            cash: parseFloat(assetsList.filter(a => a.type === 'cash').reduce((s, a) => s + a.balance, 0).toFixed(2)),
            otherAssets: parseFloat(assetsList.filter(a => a.type === 'asset').reduce((s, a) => s + a.balance, 0).toFixed(2)),
          },
          total: roundedAssets
        },
        liabilities: {
          items: liabilitiesList,
          total: parseFloat(totalLiabilities.toFixed(2))
        },
        equity: {
          items: equityList,
          capital: parseFloat(totalCapital.toFixed(2)),
          retainedEarnings,
          total: totalEquity
        },
        totalLiabilitiesAndEquity,
        discrepancy,
        isBalanced
      },
      error: null
    });
  } catch (error) {
    console.error('Error generating balance sheet:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'REPORT_ERROR',
        message: error.message || 'Failed to generate balance sheet report'
      }
    });
  }
}

/**
 * POST /api/v1/reports/seed-demo-transactions
 * Helper endpoint to seed a sample balanced journal entry for testing reports
 */
export async function seedDemoTransactions(req, res) {
  try {
    // Check if any journal entries already exist
    const checkRes = await query('SELECT count(*) FROM journal_entries WHERE reference = $1;', ['DEMO-OPENING-2026']);
    if (parseInt(checkRes.rows[0].count, 10) > 0) {
      return res.json({
        success: true,
        data: { message: 'Demo transactions already exist.' },
        error: null
      });
    }

    // Get account IDs
    const accRes = await query('SELECT id, name, type FROM chart_of_accounts;');
    const accMap = {};
    accRes.rows.forEach(r => { accMap[r.name] = r.id; });

    const journalRes = await query("SELECT id FROM journals WHERE type = 'bank' LIMIT 1;");
    const journalId = journalRes.rows[0]?.id;

    if (!journalId || !accMap['HDFC Operating Bank Account'] || !accMap['Owner Capital A/c']) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'SETUP_ERROR', message: 'Master accounts or journals missing.' }
      });
    }

    // Insert balanced demo opening entry:
    // Debit HDFC Bank ₹250,000
    // Debit Accounts Receivable ₹50,000
    // Credit Accounts Payable ₹30,000
    // Credit Owner Capital ₹270,000
    // Total Debits = 300,000 == Total Credits = 300,000
    const entryIdRes = await query(`
      INSERT INTO journal_entries (id, number, journal_id, entry_date, reference, status, source_type, source_id)
      VALUES (gen_random_uuid(), 'JE/2026/0001', $1, CURRENT_DATE, 'DEMO-OPENING-2026', 'posted', 'manual', gen_random_uuid())
      RETURNING id;
    `, [journalId]);

    const entryId = entryIdRes.rows[0].id;

    await query(`
      INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES
      (gen_random_uuid(), $1, $2, 250000.00, 0),
      (gen_random_uuid(), $1, $3, 50000.00, 0),
      (gen_random_uuid(), $1, $4, 0, 30000.00),
      (gen_random_uuid(), $1, $5, 0, 270000.00);
    `, [
      entryId,
      accMap['HDFC Operating Bank Account'],
      accMap['Accounts Receivable (Debtors)'],
      accMap['Accounts Payable (Creditors)'],
      accMap['Owner Capital A/c']
    ]);

    return res.json({
      success: true,
      data: { message: 'Demo opening ledger entry posted successfully.' },
      error: null
    });
  } catch (err) {
    console.error('Error seeding demo transactions:', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SEED_ERROR', message: err.message }
    });
  }
}

/**
 * GET /api/v1/reports/profit-and-loss
 * Query params:
 *  - startDate: YYYY-MM-DD (defaults to Jan 1st of current year)
 *  - endDate: YYYY-MM-DD (defaults to today)
 *  - includeDraft: boolean (optional, default false)
 */
export async function getProfitAndLoss(req, res) {
  try {
    const currentYear = new Date().getFullYear();
    const defaultStart = `${currentYear}-01-01`;
    const defaultEnd = new Date().toISOString().split('T')[0];

    const startDate = req.query.startDate || defaultStart;
    const endDate = req.query.endDate || defaultEnd;
    const includeDraft = req.query.includeDraft === 'true';

    const statusClause = includeDraft
      ? "je.status IN ('draft', 'posted')"
      : "je.status = 'posted'";

    const plQuery = `
      SELECT 
        coa.id,
        coa.name,
        coa.type,
        coa.report_group,
        COALESCE(SUM(jel.debit), 0)::numeric(14,2) AS total_debit,
        COALESCE(SUM(jel.credit), 0)::numeric(14,2) AS total_credit
      FROM chart_of_accounts coa
      LEFT JOIN journal_entry_lines jel ON jel.account_id = coa.id
      LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id 
        AND ${statusClause}
        AND je.entry_date BETWEEN $1::date AND $2::date
      WHERE coa.report_group = 'profit_and_loss' AND coa.is_archived = FALSE
      GROUP BY coa.id, coa.name, coa.type, coa.report_group
      ORDER BY coa.type, coa.name;
    `;

    let rows = [];
    try {
      const dbRes = await query(plQuery, [startDate, endDate]);
      rows = dbRes?.rows || [];
    } catch (err) {
      console.warn('DB Query fallback in getProfitAndLoss:', err.message);
    }

    if (rows.length === 0 && inMemoryStore.chart_of_accounts) {
      rows = inMemoryStore.chart_of_accounts
        .filter(a => a.report_group === 'profit_and_loss')
        .map(a => ({
          id: a.id,
          name: a.name,
          type: a.type,
          report_group: a.report_group,
          total_debit: 0,
          total_credit: 0
        }));
    }

    const salesList = [];
    const directPurchasesList = [];
    const operatingExpensesList = [];

    let totalSales = 0;
    let totalPurchases = 0;
    let totalOperatingExpenses = 0;

    for (const row of rows) {
      const debit = parseFloat(row.total_debit) || 0;
      const credit = parseFloat(row.total_credit) || 0;

      if (row.type === 'income') {
        // Income normal balance: Credit - Debit
        const amount = credit - debit;
        totalSales += amount;
        salesList.push({
          id: row.id,
          name: row.name,
          type: row.type,
          debit,
          credit,
          amount: parseFloat(amount.toFixed(2))
        });
      } else if (row.type === 'expense') {
        // Direct Costs / COGS: Debit - Credit
        const amount = debit - credit;
        totalPurchases += amount;
        directPurchasesList.push({
          id: row.id,
          name: row.name,
          type: row.type,
          debit,
          credit,
          amount: parseFloat(amount.toFixed(2))
        });
      } else if (row.type === 'other_expense') {
        // Operating overhead expenses: Debit - Credit
        const amount = debit - credit;
        totalOperatingExpenses += amount;
        operatingExpensesList.push({
          id: row.id,
          name: row.name,
          type: row.type,
          debit,
          credit,
          amount: parseFloat(amount.toFixed(2))
        });
      }
    }

    const roundedSales = parseFloat(totalSales.toFixed(2));
    const roundedPurchases = parseFloat(totalPurchases.toFixed(2));
    const grossProfit = parseFloat((roundedSales - roundedPurchases).toFixed(2));
    const roundedOperatingExpenses = parseFloat(totalOperatingExpenses.toFixed(2));
    const totalExpenses = parseFloat((roundedPurchases + roundedOperatingExpenses).toFixed(2));
    const netProfit = parseFloat((roundedSales - totalExpenses).toFixed(2));
    const isProfitable = netProfit >= 0;
    const profitMargin = roundedSales > 0 ? parseFloat(((netProfit / roundedSales) * 100).toFixed(1)) : 0;

    let laymanSummary = '';
    if (roundedSales === 0 && totalExpenses === 0) {
      laymanSummary = 'No sales or expense transactions recorded in this date range.';
    } else if (isProfitable) {
      laymanSummary = `Great job! Your business kept ₹${netProfit.toLocaleString('en-IN')} in net profit out of ₹${roundedSales.toLocaleString('en-IN')} total sales (${profitMargin}% margin).`;
    } else {
      laymanSummary = `Your business had a net loss of ₹${Math.abs(netProfit).toLocaleString('en-IN')} because total expenses (₹${totalExpenses.toLocaleString('en-IN')}) exceeded total sales (₹${roundedSales.toLocaleString('en-IN')}).`;
    }

    return res.json({
      success: true,
      data: {
        reportName: 'Profit & Loss Statement',
        period: {
          startDate,
          endDate
        },
        currency: 'INR',
        currencySymbol: '₹',
        // 1. Money In
        salesRevenue: {
          label: 'Money In (Sales & Revenue)',
          laymanHelp: 'Total money earned from selling furniture and custom woodwork services',
          items: salesList,
          total: roundedSales
        },
        // 2. Direct Purchases
        directPurchases: {
          label: 'Direct Purchases (Raw Materials & Supplies)',
          laymanHelp: 'Cost of timber, fabrics, and supplies bought to make products',
          items: directPurchasesList,
          total: roundedPurchases
        },
        // 3. Gross Profit
        grossProfit: {
          label: 'Gross Profit',
          laymanHelp: 'What you earned from sales after paying for raw materials (Sales − Materials)',
          amount: grossProfit
        },
        // 4. Operating Expenses
        operatingExpenses: {
          label: 'Shop & Running Costs (Utilities & Overhead)',
          laymanHelp: 'Day-to-day workshop expenses like electricity, maintenance, and bills',
          items: operatingExpensesList,
          total: roundedOperatingExpenses
        },
        // 5. Total Expenses
        totalExpenses: {
          label: 'Total Expenses (All Money Out)',
          amount: totalExpenses
        },
        // 6. Net Profit / Loss
        netProfit: {
          label: isProfitable ? 'Net Profit (Money You Keep)' : 'Net Loss',
          amount: netProfit,
          isProfitable,
          profitMargin,
          laymanSummary
        }
      },
      error: null
    });
  } catch (error) {
    console.error('Error generating Profit and Loss report:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: 'REPORT_ERROR',
        message: error.message || 'Failed to generate profit and loss report'
      }
    });
  }
}

/**
 * POST /api/v1/reports/seed-demo-pnl-transactions
 * Helper endpoint to seed sample sales and purchase journal entries for testing P&L
 */
export async function seedDemoPnlTransactions(req, res) {
  try {
    const checkRes = await query('SELECT count(*) FROM journal_entries WHERE reference = $1;', ['DEMO-SALE-2026-01']);
    if (parseInt(checkRes.rows[0].count, 10) > 0) {
      return res.json({
        success: true,
        data: { message: 'Demo P&L transactions already exist.' },
        error: null
      });
    }

    const accRes = await query('SELECT id, name, type FROM chart_of_accounts;');
    const accMap = {};
    accRes.rows.forEach(r => { accMap[r.name] = r.id; });

    const salesJournal = await query("SELECT id FROM journals WHERE type = 'sales' LIMIT 1;");
    const purchaseJournal = await query("SELECT id FROM journals WHERE type = 'purchase' LIMIT 1;");
    const bankJournal = await query("SELECT id FROM journals WHERE type = 'bank' LIMIT 1;");

    const sId = salesJournal.rows[0]?.id;
    const pId = purchaseJournal.rows[0]?.id;
    const bId = bankJournal.rows[0]?.id;

    if (!sId || !pId || !accMap['Furniture Sales Income'] || !accMap['Raw Timber Purchase Expense']) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'SETUP_ERROR', message: 'Master accounts or journals missing.' }
      });
    }

    // 1. Post a Customer Sale:
    // Debit Accounts Receivable ₹85,000 / Credit Furniture Sales Income ₹85,000
    const saleJe = await query(`
      INSERT INTO journal_entries (id, number, journal_id, entry_date, reference, status, source_type, source_id)
      VALUES (gen_random_uuid(), 'INV/2026/001', $1, CURRENT_DATE, 'DEMO-SALE-2026-01', 'posted', 'customer_invoice', gen_random_uuid())
      RETURNING id;
    `, [sId]);
    const saleId = saleJe.rows[0].id;
    await query(`
      INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES
      (gen_random_uuid(), $1, $2, 85000.00, 0),
      (gen_random_uuid(), $1, $3, 0, 85000.00);
    `, [saleId, accMap['Accounts Receivable (Debtors)'], accMap['Furniture Sales Income']]);

    // 2. Post a Vendor Purchase (Raw Timber):
    // Debit Raw Timber Expense ₹35,000 / Credit Accounts Payable ₹35,000
    const purJe = await query(`
      INSERT INTO journal_entries (id, number, journal_id, entry_date, reference, status, source_type, source_id)
      VALUES (gen_random_uuid(), 'BILL/2026/001', $1, CURRENT_DATE, 'DEMO-PURCHASE-2026-01', 'posted', 'vendor_bill', gen_random_uuid())
      RETURNING id;
    `, [pId]);
    const purId = purJe.rows[0].id;
    await query(`
      INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES
      (gen_random_uuid(), $1, $2, 35000.00, 0),
      (gen_random_uuid(), $1, $3, 0, 35000.00);
    `, [purId, accMap['Raw Timber Purchase Expense'], accMap['Accounts Payable (Creditors)']]);

    // 3. Post Utility Expense:
    // Debit Workshop Electricity ₹5,000 / Credit HDFC Bank ₹5,000
    if (bId && accMap['Workshop Electricity & Utility'] && accMap['HDFC Operating Bank Account']) {
      const utilJe = await query(`
        INSERT INTO journal_entries (id, number, journal_id, entry_date, reference, status, source_type, source_id)
        VALUES (gen_random_uuid(), 'PAY/2026/001', $1, CURRENT_DATE, 'DEMO-UTIL-2026-01', 'posted', 'payment', gen_random_uuid())
        RETURNING id;
      `, [bId]);
      const utilId = utilJe.rows[0].id;
      await query(`
        INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit) VALUES
        (gen_random_uuid(), $1, $2, 5000.00, 0),
        (gen_random_uuid(), $1, $3, 0, 5000.00);
      `, [utilId, accMap['Workshop Electricity & Utility'], accMap['HDFC Operating Bank Account']]);
    }

    return res.json({
      success: true,
      data: {
        message: 'Demo sales, timber purchase, and utility expense entries posted successfully.',
        sales: 85000,
        purchases: 35000,
        overhead: 5000,
        expectedNetProfit: 45000
      },
      error: null
    });
  } catch (err) {
    console.error('Error seeding demo P&L transactions:', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SEED_ERROR', message: err.message }
    });
  }
}

/**
 * GET /api/v1/reports/overall
 * Generates an overall financial statement combining Profit & Loss and Balance Sheet
 */
export async function getOverallReport(req, res) {
  try {
    let bsData = null;
    let pnlData = null;

    const bsRes = {
      json: (payload) => { bsData = payload.data; },
      status: () => bsRes
    };
    const pnlRes = {
      json: (payload) => { pnlData = payload.data; },
      status: () => pnlRes
    };

    await getBalanceSheet({ query: { includeDraft: req.query.includeDraft || 'false' } }, bsRes);
    await getProfitAndLoss({ query: { includeDraft: req.query.includeDraft || 'false' } }, pnlRes);

    const summary = {
      salesRevenue: pnlData?.salesRevenue?.total || 0,
      directPurchases: pnlData?.directPurchases?.total || 0,
      operatingExpenses: pnlData?.operatingExpenses?.total || 0,
      grossProfit: pnlData?.grossProfit?.amount || 0,
      netProfit: pnlData?.netProfit?.amount || 0,
      profitMargin: pnlData?.netProfit?.profitMargin || 0,
      isProfitable: pnlData?.netProfit?.isProfitable || false,
      laymanSummary: pnlData?.netProfit?.laymanSummary || '',
      totalAssets: bsData?.assets?.total || 0,
      totalLiabilities: bsData?.liabilities?.total || 0,
      totalEquity: bsData?.equity?.total || 0,
      isBalanced: bsData?.isBalanced || false
    };

    return res.json({
      success: true,
      data: {
        summary,
        pnl: pnlData,
        balanceSheet: bsData
      },
      error: null
    });
  } catch (err) {
    console.error('Error compiling overall report:', err);
    return res.status(500).json({
      success: false,
      data: null,
      error: { code: 'REPORT_ERROR', message: err.message || 'Failed to generate overall report' }
    });
  }
}


