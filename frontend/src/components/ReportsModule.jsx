import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  TrendingUp, 
  Scale, 
  ShieldCheck,
  DollarSign,
  ShoppingCart,
  Zap,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock,
  Printer,
  PieChart,
  FileSpreadsheet
} from 'lucide-react';

export default function ReportsModule() {
  const { user } = useAuth();
  
  // Active Report View: 'overall' | 'profit_and_loss' | 'balance_sheet'
  const [activeTab, setActiveTab] = useState('overall');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [overallData, setOverallData] = useState(null);
  const [pnlData, setPnlData] = useState(null);
  const [bsData, setBsData] = useState(null);

  const isStaff = user?.role === 'admin' || user?.role === 'accountant';

  useEffect(() => {
    if (isStaff) {
      fetchReportData();
    }
  }, [isStaff]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both P&L and Balance Sheet (Overall numbers)
      const [pnlRes, bsRes] = await Promise.all([
        apiRequest('GET', '/reports/profit-and-loss'),
        apiRequest('GET', '/reports/balance-sheet')
      ]);

      setPnlData(pnlRes);
      setBsData(bsRes);

      // Compile overall summary metrics
      const summary = {
        salesRevenue: pnlRes?.salesRevenue?.total || 0,
        directPurchases: pnlRes?.directPurchases?.total || 0,
        operatingExpenses: pnlRes?.operatingExpenses?.total || 0,
        grossProfit: pnlRes?.grossProfit?.amount || 0,
        netProfit: pnlRes?.netProfit?.amount || 0,
        profitMargin: pnlRes?.netProfit?.profitMargin || 0,
        isProfitable: pnlRes?.netProfit?.isProfitable || false,
        laymanSummary: pnlRes?.netProfit?.laymanSummary || '',
        totalAssets: bsRes?.assets?.total || 0,
        totalLiabilities: bsRes?.liabilities?.total || 0,
        totalEquity: bsRes?.equity?.total || 0,
        isBalanced: bsRes?.isBalanced || false
      };

      setOverallData(summary);
    } catch (err) {
      console.error('Failed to load overall report data:', err);
      setError(err.message || 'Could not fetch overall reports from backend');
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isStaff) {
    return (
      <div className="p-8 rounded-2xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="font-heading font-bold text-base text-[#2C221E] dark:text-[#F5EFE6]">
          Access Restricted
        </h3>
        <p className="text-xs text-[#6B5E55] dark:text-[#A89B91] max-w-md mx-auto">
          Financial statements, Balance Sheet, and P&L reports are restricted exclusively to Business Owners (Admin) and Invoicing Accountants.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Clean Top Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-[#FAF6EE] dark:bg-[#29211D] text-[#B45309] border border-[#E6DFD5] dark:border-[#382D27]">
              Live Backend Ledger
            </span>
            <span className="text-xs text-[#6B5E55] dark:text-[#A89B91]">Urban Furniture Financials</span>
          </div>
          <h1 className="font-heading text-2xl font-bold text-[#2C221E] dark:text-[#F5EFE6] mt-1 flex items-center gap-2">
            {activeTab === 'overall' && (
              <>
                <PieChart className="w-6 h-6 text-[#B45309]" />
                Overall Financial Report
              </>
            )}
            {activeTab === 'profit_and_loss' && (
              <>
                <TrendingUp className="w-6 h-6 text-emerald-600" />
                Profit & Loss Statement
              </>
            )}
            {activeTab === 'balance_sheet' && (
              <>
                <Scale className="w-6 h-6 text-[#B45309]" />
                Balance Sheet Statement
              </>
            )}
          </h1>
          <p className="text-xs text-[#6B5E55] dark:text-[#A89B91] mt-0.5">
            {activeTab === 'overall' && 'Complete financial health overview, profit status, and assets vs liabilities.'}
            {activeTab === 'profit_and_loss' && 'Total furniture sales revenue, material purchases, and operating expenses.'}
            {activeTab === 'balance_sheet' && 'Cumulative summary of company assets, liabilities, and owner capital.'}
          </p>
        </div>

        {/* View Switcher Tabs & Print */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl bg-[#FAF6EE] dark:bg-[#221B17] p-1 border border-[#E6DFD5] dark:border-[#382D27]">
            <button
              onClick={() => setActiveTab('overall')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'overall'
                  ? 'bg-white dark:bg-[#1C1613] text-[#B45309] shadow-sm'
                  : 'text-[#6B5E55] dark:text-[#A89B91] hover:text-[#2C221E]'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Overall</span>
            </button>
            <button
              onClick={() => setActiveTab('profit_and_loss')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'profit_and_loss'
                  ? 'bg-white dark:bg-[#1C1613] text-emerald-700 dark:text-emerald-400 shadow-sm'
                  : 'text-[#6B5E55] dark:text-[#A89B91] hover:text-[#2C221E]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Profit & Loss</span>
            </button>
            <button
              onClick={() => setActiveTab('balance_sheet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'balance_sheet'
                  ? 'bg-white dark:bg-[#1C1613] text-[#B45309] shadow-sm'
                  : 'text-[#6B5E55] dark:text-[#A89B91] hover:text-[#2C221E]'
              }`}
            > 
              <Scale className="w-3.5 h-3.5" />
              <span>Balance Sheet</span>
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-[#251E1A] border border-[#E6DFD5] dark:border-[#382D27] text-[#2C221E] dark:text-[#F5EFE6] hover:border-[#B45309] transition-all cursor-pointer shadow-xs"
            title="Print or Export PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="font-bold cursor-pointer">✕</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-xs text-[#6B5E55] space-y-2">
          <div className="w-6 h-6 border-2 border-[#B45309] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div>Loading overall financial data from backend...</div>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* 1. OVERALL REPORT VIEW (SIMPLIFIED EXECUTIVE OVERVIEW)                     */}
          {/* ========================================================================= */}
          {activeTab === 'overall' && overallData && (
            <div className="space-y-6">
              
              {/* Executive Summary Banner */}
              <div className={`p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm ${
                overallData.isProfitable
                  ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              }`}>
                <div className="flex items-center gap-3.5">
                  <div className={`p-2.5 rounded-xl ${
                    overallData.isProfitable 
                      ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' 
                      : 'bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300'
                  }`}>
                    {overallData.isProfitable ? (
                      <Sparkles className="w-6 h-6" />
                    ) : (
                      <AlertCircle className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider opacity-80">
                      Overall Bottom Line
                    </div>
                    <div className="font-heading font-bold text-base mt-0.5">
                      {overallData.laymanSummary || (overallData.isProfitable ? 'Business is operating profitably' : 'Expenses exceed income')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[11px] opacity-80">Net Profit / Loss</div>
                    <div className={`font-mono font-bold text-lg ${overallData.isProfitable ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                      {formatINR(overallData.netProfit)}
                    </div>
                  </div>
                  <div className="text-right pl-4 border-l border-current/20">
                    <div className="text-[11px] opacity-80">Profit Margin</div>
                    <div className="font-mono font-bold text-lg">
                      {overallData.profitMargin}%
                    </div>
                  </div>
                </div>
              </div>

              {/* 6 Key Overall Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* 1. Total Sales Revenue */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#6B5E55] dark:text-[#A89B91]">Total Revenue (Sales)</span>
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold font-mono text-[#2C221E] dark:text-[#F5EFE6] mt-3">
                    {formatINR(overallData.salesRevenue)}
                  </div>
                  <div className="text-[11px] text-[#6B5E55] dark:text-[#A89B91] mt-1">
                    Customer invoices & goods sold
                  </div>
                </div>

                {/* 2. Total Direct Purchases */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#6B5E55] dark:text-[#A89B91]">Direct Purchases (Raw Materials)</span>
                    <div className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold font-mono text-[#2C221E] dark:text-[#F5EFE6] mt-3">
                    {formatINR(overallData.directPurchases)}
                  </div>
                  <div className="text-[11px] text-[#6B5E55] dark:text-[#A89B91] mt-1">
                    Timber, hardware & procurement
                  </div>
                </div>

                {/* 3. Operating Expenses */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#6B5E55] dark:text-[#A89B91]">Operating Expenses</span>
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                      <Zap className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold font-mono text-[#2C221E] dark:text-[#F5EFE6] mt-3">
                    {formatINR(overallData.operatingExpenses)}
                  </div>
                  <div className="text-[11px] text-[#6B5E55] dark:text-[#A89B91] mt-1">
                    Utilities, workshop & running costs
                  </div>
                </div>

                {/* 4. Total Assets */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#6B5E55] dark:text-[#A89B91]">Total Assets</span>
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold font-mono text-[#2C221E] dark:text-[#F5EFE6] mt-3">
                    {formatINR(overallData.totalAssets)}
                  </div>
                  <div className="text-[11px] text-[#6B5E55] dark:text-[#A89B91] mt-1">
                    Bank balance, cash & accounts receivable
                  </div>
                </div>

                {/* 5. Total Liabilities */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#6B5E55] dark:text-[#A89B91]">Total Liabilities</span>
                    <div className="p-2 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                      <ArrowDownRight className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold font-mono text-[#2C221E] dark:text-[#F5EFE6] mt-3">
                    {formatINR(overallData.totalLiabilities)}
                  </div>
                  <div className="text-[11px] text-[#6B5E55] dark:text-[#A89B91] mt-1">
                    Creditors & vendor payables
                  </div>
                </div>

                {/* 6. Total Equity / Net Worth */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#6B5E55] dark:text-[#A89B91]">Total Equity</span>
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold font-mono text-[#2C221E] dark:text-[#F5EFE6] mt-3">
                    {formatINR(overallData.totalEquity)}
                  </div>
                  <div className="text-[11px] text-[#6B5E55] dark:text-[#A89B91] mt-1">
                    Owner capital & retained earnings
                  </div>
                </div>

              </div>

              {/* Summary Statements Grid (Income Breakdown vs Assets Breakdown) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Income & Expense Summary */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E6DFD5]/60 dark:border-[#382D27] pb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <h3 className="font-heading font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6]">
                        Income & Expense Summary
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('profit_and_loss')}
                      className="text-xs text-[#B45309] hover:underline cursor-pointer font-medium"
                    >
                      View Full P&L →
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-[#E6DFD5]/40 dark:border-[#382D27]/60">
                      <span className="text-[#6B5E55] dark:text-[#A89B91]">Gross Sales Revenue</span>
                      <span className="font-mono font-bold text-[#2C221E] dark:text-[#F5EFE6]">{formatINR(overallData.salesRevenue)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-[#E6DFD5]/40 dark:border-[#382D27]/60">
                      <span className="text-[#6B5E55] dark:text-[#A89B91]">Less: Raw Materials Purchases</span>
                      <span className="font-mono text-amber-700 dark:text-amber-400 font-semibold">- {formatINR(overallData.directPurchases)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-[#E6DFD5]/40 dark:border-[#382D27]/60 font-semibold bg-[#FAF6EE] dark:bg-[#221B17] px-2 rounded">
                      <span className="text-[#2C221E] dark:text-[#F5EFE6]">Gross Profit</span>
                      <span className="font-mono">{formatINR(overallData.grossProfit)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-[#E6DFD5]/40 dark:border-[#382D27]/60">
                      <span className="text-[#6B5E55] dark:text-[#A89B91]">Less: Operating Expenses</span>
                      <span className="font-mono text-purple-700 dark:text-purple-400 font-semibold">- {formatINR(overallData.operatingExpenses)}</span>
                    </div>
                    <div className={`flex items-center justify-between py-2 px-3 rounded-lg font-bold ${
                      overallData.isProfitable ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
                    }`}>
                      <span>Net Bottom Line</span>
                      <span className="font-mono text-sm">{formatINR(overallData.netProfit)}</span>
                    </div>
                  </div>
                </div>

                {/* Financial Position Summary */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E6DFD5]/60 dark:border-[#382D27] pb-3">
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-[#B45309]" />
                      <h3 className="font-heading font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6]">
                        Financial Position (Balance Sheet)
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('balance_sheet')}
                      className="text-xs text-[#B45309] hover:underline cursor-pointer font-medium"
                    >
                      View Balance Sheet →
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between py-1 border-b border-[#E6DFD5]/40 dark:border-[#382D27]/60">
                      <span className="text-[#6B5E55] dark:text-[#A89B91]">Total Assets Owned</span>
                      <span className="font-mono font-bold text-blue-700 dark:text-blue-400">{formatINR(overallData.totalAssets)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-[#E6DFD5]/40 dark:border-[#382D27]/60">
                      <span className="text-[#6B5E55] dark:text-[#A89B91]">Total Liabilities Owed</span>
                      <span className="font-mono font-semibold text-rose-700 dark:text-rose-400">{formatINR(overallData.totalLiabilities)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-[#E6DFD5]/40 dark:border-[#382D27]/60">
                      <span className="text-[#6B5E55] dark:text-[#A89B91]">Owner's Capital & Equity</span>
                      <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">{formatINR(overallData.totalEquity)}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-[#E6DFD5]/40 dark:border-[#382D27]/60 bg-[#FAF6EE] dark:bg-[#221B17] px-2 rounded font-semibold">
                      <span className="text-[#2C221E] dark:text-[#F5EFE6]">Liabilities + Equity</span>
                      <span className="font-mono">{formatINR(overallData.totalLiabilities + overallData.totalEquity)}</span>
                    </div>
                    <div className={`flex items-center justify-between py-2 px-3 rounded-lg font-bold ${
                      overallData.isBalanced 
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                        : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}>
                      <div className="flex items-center gap-1.5">
                        {overallData.isBalanced ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-amber-600" />}
                        <span>Bookkeeping Status</span>
                      </div>
                      <span>{overallData.isBalanced ? 'Balanced (A = L + E)' : 'In Progress / Unposted'}</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* 2. PROFIT & LOSS STATEMENT VIEW                                            */}
          {/* ========================================================================= */}
          {activeTab === 'profit_and_loss' && pnlData && (
            <div className="space-y-6">
              
              {/* Top 4 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27]">
                  <span className="text-xs text-[#6B5E55] dark:text-[#A89B91]">1. Total Sales (Money In)</span>
                  <div className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-2">
                    {formatINR(pnlData.salesRevenue?.total)}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27]">
                  <span className="text-xs text-[#6B5E55] dark:text-[#A89B91]">2. Raw Materials Cost</span>
                  <div className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400 mt-2">
                    {formatINR(pnlData.directPurchases?.total)}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27]">
                  <span className="text-xs text-[#6B5E55] dark:text-[#A89B91]">3. Gross Profit</span>
                  <div className="text-xl font-bold font-mono text-blue-700 dark:text-blue-400 mt-2">
                    {formatINR(pnlData.grossProfit?.amount)}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27]">
                  <span className="text-xs text-[#6B5E55] dark:text-[#A89B91]">4. Net Profit</span>
                  <div className={`text-xl font-bold font-mono mt-2 ${
                    pnlData.netProfit?.isProfitable ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
                  }`}>
                    {formatINR(pnlData.netProfit?.amount)}
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown Tables */}
              <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 shadow-sm space-y-6">
                
                {/* 1. Sales Revenue */}
                <div>
                  <h3 className="font-heading font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6] mb-3 flex items-center justify-between">
                    <span>1. Sales Revenue (Income Accounts)</span>
                    <span className="font-mono text-emerald-700 dark:text-emerald-400">{formatINR(pnlData.salesRevenue?.total)}</span>
                  </h3>
                  <div className="border border-[#E6DFD5]/70 dark:border-[#382D27] rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#FAF6EE] dark:bg-[#221B17] border-b border-[#E6DFD5] dark:border-[#382D27] text-[#6B5E55] dark:text-[#A89B91]">
                        <tr>
                          <th className="py-2.5 px-4">Account Name</th>
                          <th className="py-2.5 px-4 text-right">Debit</th>
                          <th className="py-2.5 px-4 text-right">Credit</th>
                          <th className="py-2.5 px-4 text-right">Net Sales</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6DFD5]/40 dark:divide-[#382D27]">
                        {pnlData.salesRevenue?.items?.length > 0 ? (
                          pnlData.salesRevenue.items.map(acc => (
                            <tr key={acc.id} className="hover:bg-[#FAF6EE]/50 dark:hover:bg-[#221B17]/50">
                              <td className="py-2 px-4 font-medium text-[#2C221E] dark:text-[#F5EFE6]">{acc.name}</td>
                              <td className="py-2 px-4 text-right font-mono text-[#6B5E55]">{formatINR(acc.debit)}</td>
                              <td className="py-2 px-4 text-right font-mono text-[#6B5E55]">{formatINR(acc.credit)}</td>
                              <td className="py-2 px-4 text-right font-mono font-bold text-[#2C221E] dark:text-[#F5EFE6]">{formatINR(acc.amount)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-3 px-4 text-center text-[#8C7E74]">No sales recorded</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Direct Purchases */}
                <div>
                  <h3 className="font-heading font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6] mb-3 flex items-center justify-between">
                    <span>2. Direct Materials Cost (Purchase Accounts)</span>
                    <span className="font-mono text-amber-700 dark:text-amber-400">{formatINR(pnlData.directPurchases?.total)}</span>
                  </h3>
                  <div className="border border-[#E6DFD5]/70 dark:border-[#382D27] rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#FAF6EE] dark:bg-[#221B17] border-b border-[#E6DFD5] dark:border-[#382D27] text-[#6B5E55] dark:text-[#A89B91]">
                        <tr>
                          <th className="py-2.5 px-4">Account Name</th>
                          <th className="py-2.5 px-4 text-right">Debit</th>
                          <th className="py-2.5 px-4 text-right">Credit</th>
                          <th className="py-2.5 px-4 text-right">Net Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6DFD5]/40 dark:divide-[#382D27]">
                        {pnlData.directPurchases?.items?.length > 0 ? (
                          pnlData.directPurchases.items.map(acc => (
                            <tr key={acc.id} className="hover:bg-[#FAF6EE]/50 dark:hover:bg-[#221B17]/50">
                              <td className="py-2 px-4 font-medium text-[#2C221E] dark:text-[#F5EFE6]">{acc.name}</td>
                              <td className="py-2 px-4 text-right font-mono text-[#6B5E55]">{formatINR(acc.debit)}</td>
                              <td className="py-2 px-4 text-right font-mono text-[#6B5E55]">{formatINR(acc.credit)}</td>
                              <td className="py-2 px-4 text-right font-mono font-bold text-[#2C221E] dark:text-[#F5EFE6]">{formatINR(acc.amount)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-3 px-4 text-center text-[#8C7E74]">No purchases recorded</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Operating Expenses */}
                <div>
                  <h3 className="font-heading font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6] mb-3 flex items-center justify-between">
                    <span>3. Operating Expenses (Electricity, Rent, Utilities)</span>
                    <span className="font-mono text-purple-700 dark:text-purple-400">{formatINR(pnlData.operatingExpenses?.total)}</span>
                  </h3>
                  <div className="border border-[#E6DFD5]/70 dark:border-[#382D27] rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#FAF6EE] dark:bg-[#221B17] border-b border-[#E6DFD5] dark:border-[#382D27] text-[#6B5E55] dark:text-[#A89B91]">
                        <tr>
                          <th className="py-2.5 px-4">Account Name</th>
                          <th className="py-2.5 px-4 text-right">Debit</th>
                          <th className="py-2.5 px-4 text-right">Credit</th>
                          <th className="py-2.5 px-4 text-right">Net Expense</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6DFD5]/40 dark:divide-[#382D27]">
                        {pnlData.operatingExpenses?.items?.length > 0 ? (
                          pnlData.operatingExpenses.items.map(acc => (
                            <tr key={acc.id} className="hover:bg-[#FAF6EE]/50 dark:hover:bg-[#221B17]/50">
                              <td className="py-2 px-4 font-medium text-[#2C221E] dark:text-[#F5EFE6]">{acc.name}</td>
                              <td className="py-2 px-4 text-right font-mono text-[#6B5E55]">{formatINR(acc.debit)}</td>
                              <td className="py-2 px-4 text-right font-mono text-[#6B5E55]">{formatINR(acc.credit)}</td>
                              <td className="py-2 px-4 text-right font-mono font-bold text-[#2C221E] dark:text-[#F5EFE6]">{formatINR(acc.amount)}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="py-3 px-4 text-center text-[#8C7E74]">No operating expenses recorded</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* 3. BALANCE SHEET STATEMENT VIEW                                           */}
          {/* ========================================================================= */}
          {activeTab === 'balance_sheet' && bsData && (
            <div className="space-y-6">
              
              {/* Balance Verification Banner */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                bsData.isBalanced 
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800' 
                  : 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800'
              }`}>
                <div className="flex items-center gap-2.5">
                  {bsData.isBalanced ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-amber-600" />}
                  <div>
                    <span className="font-heading font-bold text-sm">
                      {bsData.isBalanced ? 'Balance Sheet is in Equilibrium' : 'Transactions In Progress'}
                    </span>
                    <p className="text-[11px] opacity-80">
                      {bsData.isBalanced 
                        ? 'Total Assets exactly equal Total Liabilities + Owner Equity.' 
                        : 'Post all pending journal entries to achieve balance.'}
                    </p>
                  </div>
                </div>
                <div className="font-mono text-xs font-bold">
                  Assets {formatINR(bsData.assets?.total)} = L+E {formatINR(bsData.totalLiabilitiesAndEquity)}
                </div>
              </div>

              {/* Assets & Liabilities Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left: Assets */}
                <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E6DFD5]/60 dark:border-[#382D27] pb-3">
                    <h3 className="font-heading font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6]">
                      Assets (What Urban Furniture Owns)
                    </h3>
                    <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
                      {formatINR(bsData.assets?.total)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {bsData.assets?.items?.length > 0 ? (
                      bsData.assets.items.map(acc => (
                        <div key={acc.id} className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-[#FAF6EE]/50 dark:bg-[#221B17]/50 border border-[#E6DFD5]/40 dark:border-[#382D27]/40">
                          <div>
                            <div className="font-medium text-[#2C221E] dark:text-[#F5EFE6]">{acc.name}</div>
                            <span className="text-[10px] text-[#8C7E74] capitalize">{acc.type}</span>
                          </div>
                          <span className="font-mono font-bold text-[#2C221E] dark:text-[#F5EFE6]">{formatINR(acc.balance)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-xs text-[#8C7E74]">No asset accounts</div>
                    )}
                  </div>
                </div>

                {/* Right: Liabilities & Equity */}
                <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E6DFD5]/60 dark:border-[#382D27] pb-3">
                    <h3 className="font-heading font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6]">
                      Liabilities & Equity (What is Owed & Owned)
                    </h3>
                    <span className="font-mono font-bold text-[#B45309]">
                      {formatINR(bsData.totalLiabilitiesAndEquity)}
                    </span>
                  </div>

                  {/* Liabilities Section */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-[#8C7E74] uppercase tracking-wider">Liabilities</div>
                    {bsData.liabilities?.items?.length > 0 ? (
                      bsData.liabilities.items.map(acc => (
                        <div key={acc.id} className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-[#FAF6EE]/50 dark:bg-[#221B17]/50 border border-[#E6DFD5]/40 dark:border-[#382D27]/40">
                          <div>
                            <div className="font-medium text-[#2C221E] dark:text-[#F5EFE6]">{acc.name}</div>
                            <span className="text-[10px] text-[#8C7E74] capitalize">{acc.type}</span>
                          </div>
                          <span className="font-mono font-bold text-rose-700 dark:text-rose-400">{formatINR(acc.balance)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-[#8C7E74] italic py-1">No liabilities recorded</div>
                    )}
                  </div>

                  {/* Equity Section */}
                  <div className="space-y-2 pt-2 border-t border-[#E6DFD5]/40 dark:border-[#382D27]/60">
                    <div className="text-xs font-semibold text-[#8C7E74] uppercase tracking-wider">Equity & Capital</div>
                    {bsData.equity?.items?.length > 0 && bsData.equity.items.map(acc => (
                      <div key={acc.id} className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-[#FAF6EE]/50 dark:bg-[#221B17]/50 border border-[#E6DFD5]/40 dark:border-[#382D27]/40">
                        <div>
                          <div className="font-medium text-[#2C221E] dark:text-[#F5EFE6]">{acc.name}</div>
                          <span className="text-[10px] text-[#8C7E74] capitalize">{acc.type}</span>
                        </div>
                        <span className="font-mono font-bold text-[#2C221E] dark:text-[#F5EFE6]">{formatINR(acc.balance)}</span>
                      </div>
                    ))}
                    
                    {/* Retained Earnings / Net Profit line */}
                    {typeof bsData.equity?.retainedEarnings === 'number' && (
                      <div className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/50">
                        <div>
                          <div className="font-medium text-emerald-900 dark:text-emerald-200">
                            Retained Earnings / Net Profit
                          </div>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400">Cumulative bottom line</span>
                        </div>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                          {formatINR(bsData.equity.retainedEarnings)}
                        </span>
                      </div>
                    )}
                  </div>

                </div>

              </div>

            </div>
          )}
        </>
      )}

    </div>
  );
}
