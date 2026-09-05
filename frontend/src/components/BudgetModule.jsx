import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  ArrowLeft, 
  PieChart as PieChartIcon, 
  Trash2, 
  CheckCircle2, 
  RotateCcw, 
  Ban, 
  Save, 
  ExternalLink, 
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function BudgetModule() {
  const { user } = useAuth();

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Views & State
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [search, setSearch] = useState('');
  const [activeBudget, setActiveBudget] = useState(null);
  const [showChartModal, setShowChartModal] = useState(false);
  const [selectedChartBudget, setSelectedChartBudget] = useState(null);

  // Master Data from Backend
  const [analyticAccounts, setAnalyticAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);

  // Fetch all budgets and master data on mount
  useEffect(() => {
    fetchBudgets();
    fetchMasterData();
  }, []);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('GET', '/budgets');
      const items = res?.items || res?.data?.items || [];

      // Format backend records for UI
      const formatted = items.map(item => ({
        id: item.id,
        name: item.name,
        startDate: item.periodStart,
        endDate: item.periodEnd,
        status: (item.status || 'draft').toLowerCase(),
        revisionOfId: item.revisionOfId,
        revisionOfName: item.revisionOfName,
        responsible: item.responsibleContactName || 'None',
        responsibleContactId: item.responsibleContactId,
        analyticAccountId: item.analyticAccountId,
        analyticName: item.analyticName,
        analyticType: item.analyticType,
        committedAmount: Number(item.committedAmount) || 0,
        achievedAmount: Number(item.achievedAmount) || 0,
        achievedPercent: Number(item.achievedPercent) || 0,
        amountToAchieve: Number(item.amountToAchieve) || 0,
        lines: [
          {
            id: `line-${item.id}`,
            analyticAccountId: item.analyticAccountId,
            analytic: item.analyticName,
            type: (item.analyticType === 'income' ? 'Income' : 'Expense'),
            committedAmount: Number(item.committedAmount) || 0,
            achievedAmount: Number(item.achievedAmount) || 0,
            achievedPercent: Number(item.achievedPercent) || 0,
            amountToAchieve: Number(item.amountToAchieve) || 0
          }
        ]
      }));

      setBudgets(formatted);
    } catch (err) {
      console.error('Failed to fetch budgets:', err);
      setErrorMsg(err.message || 'Failed to load budgets from backend.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    try {
      const [aaRes, contactRes] = await Promise.all([
        apiRequest('GET', '/analytic-accounts'),
        apiRequest('GET', '/contacts?pageSize=100')
      ]);

      if (Array.isArray(aaRes)) {
        setAnalyticAccounts(aaRes);
      } else if (aaRes?.items) {
        setAnalyticAccounts(aaRes.items);
      }

      const contactList = contactRes?.items || contactRes || [];
      setContacts(contactList);
    } catch (err) {
      console.warn('Master data fetch note:', err.message);
    }
  };

  // Filtered List
  const filteredBudgets = budgets.filter(b => {
    const q = search.toLowerCase();
    return (
      b.name?.toLowerCase().includes(q) ||
      b.responsible?.toLowerCase().includes(q) ||
      b.status?.toLowerCase().includes(q)
    );
  });

  // Open existing form
  const handleOpenForm = (budget) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setActiveBudget(JSON.parse(JSON.stringify(budget)));
    setView('form');
  };

  // Open by ID (used by Revision Of clickable link)
  const handleOpenFormById = async (id) => {
    const existing = budgets.find(b => b.id === id);
    if (existing) {
      handleOpenForm(existing);
      return;
    }
    try {
      const res = await apiRequest('GET', `/budgets/${id}`);
      const item = res?.data || res;
      if (item) {
        handleOpenForm({
          id: item.id,
          name: item.name,
          startDate: item.periodStart,
          endDate: item.periodEnd,
          status: (item.status || 'draft').toLowerCase(),
          revisionOfId: item.revisionOfId,
          revisionOfName: item.revisionOfName,
          responsible: item.responsibleContactName || 'None',
          responsibleContactId: item.responsibleContactId,
          analyticAccountId: item.analyticAccountId,
          analyticName: item.analyticName,
          analyticType: item.analyticType,
          committedAmount: Number(item.committedAmount) || 0,
          achievedAmount: Number(item.achievedAmount) || 0,
          achievedPercent: Number(item.achievedPercent) || 0,
          amountToAchieve: Number(item.amountToAchieve) || 0,
          lines: [
            {
              id: `line-${item.id}`,
              analyticAccountId: item.analyticAccountId,
              analytic: item.analyticName,
              type: (item.analyticType === 'income' ? 'Income' : 'Expense'),
              committedAmount: Number(item.committedAmount) || 0,
              achievedAmount: Number(item.achievedAmount) || 0,
              achievedPercent: Number(item.achievedPercent) || 0,
              amountToAchieve: Number(item.amountToAchieve) || 0
            }
          ]
        });
      }
    } catch (err) {
      setErrorMsg('Failed to fetch original budget details.');
    }
  };

  // Create new draft budget
  const handleNewBudget = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    const defaultAnalytic = analyticAccounts[0];
    const defaultContact = contacts[0];

    const newBudget = {
      isNew: true,
      id: `new-${Date.now()}`,
      name: `Budget ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
      revisionOfId: null,
      revisionOfName: null,
      responsible: defaultContact?.name || user?.email?.split('@')[0] || 'Admin',
      responsibleContactId: defaultContact?.id || null,
      analyticAccountId: defaultAnalytic?.id || null,
      analyticName: defaultAnalytic?.name || 'Furniture',
      analyticType: defaultAnalytic?.type || 'expense',
      committedAmount: 100000,
      achievedAmount: 0,
      achievedPercent: 0,
      amountToAchieve: 100000,
      lines: [
        {
          id: `line-new-1`,
          analyticAccountId: defaultAnalytic?.id || null,
          analytic: defaultAnalytic?.name || 'Furniture',
          type: defaultAnalytic?.type === 'income' ? 'Income' : 'Expense',
          committedAmount: 100000,
          achievedAmount: 0,
          achievedPercent: 0,
          amountToAchieve: 100000
        }
      ]
    };
    setActiveBudget(newBudget);
    setView('form');
  };

  // Save budget to Backend Database
  const handleSaveBudget = async () => {
    if (!activeBudget) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setSaving(true);

    try {
      const line = activeBudget.lines[0] || {};
      const payload = {
        name: activeBudget.name.trim(),
        analyticAccountId: line.analyticAccountId || activeBudget.analyticAccountId || analyticAccounts[0]?.id,
        periodStart: activeBudget.startDate,
        periodEnd: activeBudget.endDate,
        committedAmount: Number(line.committedAmount || activeBudget.committedAmount || 0),
        responsibleContactId: activeBudget.responsibleContactId || null,
        status: activeBudget.status || 'draft',
        revisionOfId: activeBudget.revisionOfId || null
      };

      if (!payload.analyticAccountId) {
        throw new Error('Please select an analytic account.');
      }

      if (activeBudget.isNew) {
        const createRes = await apiRequest('POST', '/budgets', payload);
        setSuccessMsg('Budget created successfully in database!');
        await fetchBudgets();
        if (createRes?.data?.id) {
          handleOpenFormById(createRes.data.id);
        } else {
          setView('list');
        }
      } else {
        await apiRequest('PUT', `/budgets/${activeBudget.id}`, payload);
        setSuccessMsg('Budget updated successfully in database!');
        await fetchBudgets();
        handleOpenFormById(activeBudget.id);
      }
    } catch (err) {
      console.error('Error saving budget:', err);
      setErrorMsg(err.message || 'Failed to save budget.');
    } finally {
      setSaving(false);
    }
  };

  // Confirm budget
  const handleConfirm = async () => {
    if (!activeBudget) return;
    if (activeBudget.isNew) {
      setActiveBudget({ ...activeBudget, status: 'confirmed' });
      return;
    }
    setSaving(true);
    try {
      await apiRequest('PATCH', `/budgets/${activeBudget.id}/confirm`);
      setSuccessMsg('Budget confirmed successfully!');
      await fetchBudgets();
      handleOpenFormById(activeBudget.id);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to confirm budget.');
    } finally {
      setSaving(false);
    }
  };

  // Revise budget (calls backend revision endpoint)
  const handleRevise = async () => {
    if (!activeBudget) return;
    if (activeBudget.isNew) {
      setErrorMsg('Please save the budget first before creating a revision.');
      return;
    }
    setSaving(true);
    try {
      const res = await apiRequest('POST', `/budgets/${activeBudget.id}/revise`);
      const newId = res?.data?.id;
      setSuccessMsg('Created budget revision successfully!');
      await fetchBudgets();
      if (newId) {
        handleOpenFormById(newId);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create budget revision.');
    } finally {
      setSaving(false);
    }
  };

  // Cancel budget
  const handleCancelBudget = async () => {
    if (!activeBudget) return;
    if (activeBudget.isNew) {
      setView('list');
      return;
    }
    setSaving(true);
    try {
      await apiRequest('PATCH', `/budgets/${activeBudget.id}/cancel`);
      setSuccessMsg('Budget cancelled.');
      await fetchBudgets();
      handleOpenFormById(activeBudget.id);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to cancel budget.');
    } finally {
      setSaving(false);
    }
  };

  // Status Change directly from Pipeline
  const handlePipelineStatusChange = async (newStatus) => {
    if (!activeBudget) return;
    const lower = newStatus.toLowerCase();
    if (activeBudget.isNew) {
      setActiveBudget({ ...activeBudget, status: lower });
      return;
    }
    setSaving(true);
    try {
      await apiRequest('PATCH', `/budgets/${activeBudget.id}/status`, { status: lower });
      setSuccessMsg(`Status updated to ${newStatus}`);
      await fetchBudgets();
      handleOpenFormById(activeBudget.id);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update status.');
    } finally {
      setSaving(false);
    }
  };

  // Budget line modifications
  const handleUpdateLine = (index, field, value) => {
    if (!activeBudget) return;
    const updatedLines = [...activeBudget.lines];
    if (field === 'analyticAccountId') {
      const selectedAa = analyticAccounts.find(a => a.id === value);
      updatedLines[index] = {
        ...updatedLines[index],
        analyticAccountId: value,
        analytic: selectedAa ? selectedAa.name : updatedLines[index].analytic,
        type: selectedAa ? (selectedAa.type === 'income' ? 'Income' : 'Expense') : updatedLines[index].type
      };
      setActiveBudget({
        ...activeBudget,
        analyticAccountId: value,
        analyticName: selectedAa ? selectedAa.name : activeBudget.analyticName,
        analyticType: selectedAa ? selectedAa.type : activeBudget.analyticType,
        lines: updatedLines
      });
      return;
    }

    const numVal = (field === 'committedAmount' || field === 'achievedAmount') ? Number(value) || 0 : value;
    updatedLines[index] = {
      ...updatedLines[index],
      [field]: numVal
    };

    // Recalculate line metrics
    const comm = field === 'committedAmount' ? numVal : updatedLines[index].committedAmount;
    const ach = field === 'achievedAmount' ? numVal : updatedLines[index].achievedAmount;
    updatedLines[index].achievedPercent = comm > 0 ? Number(((ach / comm) * 100).toFixed(1)) : 0;
    updatedLines[index].amountToAchieve = comm - ach;

    setActiveBudget({
      ...activeBudget,
      committedAmount: updatedLines[0]?.committedAmount || activeBudget.committedAmount,
      lines: updatedLines
    });
  };

  // Open Pie Chart modal
  const handleOpenChart = (budget, e) => {
    if (e) e.stopPropagation();
    setSelectedChartBudget(budget);
    setShowChartModal(true);
  };

  // Status Badge Helper
  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'draft':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700';
      case 'confirm':
      case 'confirmed':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60';
      case 'revised':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/60';
      case 'cancelled':
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300';
    }
  };

  // Status steps for Odoo pipeline header
  const statusPipeline = [
    { label: 'Draft', value: 'draft' },
    { label: 'Confirm', value: 'confirmed' },
    { label: 'Revised', value: 'revised' },
    { label: 'Cancelled', value: 'cancelled' }
  ];

  // Calculations for active budget totals
  const totalCommitted = activeBudget?.lines?.reduce((sum, l) => sum + (Number(l.committedAmount) || 0), 0) || 0;
  const totalAchieved = activeBudget?.lines?.reduce((sum, l) => sum + (Number(l.achievedAmount) || 0), 0) || 0;
  const totalAchievedPct = totalCommitted > 0 ? ((totalAchieved / totalCommitted) * 100).toFixed(1) : '0.0';
  const totalToAchieve = totalCommitted - totalAchieved;

  return (
    <div className="space-y-6">

      {/* Messages */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="p-1 cursor-pointer hover:opacity-70"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="p-1 cursor-pointer hover:opacity-70"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 1: BUDGET REPORT (LIST VIEW)                                         */}
      {/* ========================================================================= */}
      {view === 'list' && (
        <div className="space-y-4">
          
          {/* Header Title */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-1">
            <div>
              <h2 className="font-heading font-bold text-2xl text-[#2C221E] dark:text-[#F5EFE6]">
                Budget Report (List View)
              </h2>
              <p className="text-xs text-[#6B5E55] dark:text-[#A89B91] mt-0.5">
                Financial budget management & live PostgreSQL ledger progress tracking
              </p>
            </div>
          </div>

          {/* Top Control Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#1C1613] p-4 rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] shadow-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={handleNewBudget}
                className="bg-[#B45309] hover:bg-[#92400E] text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New</span>
              </button>

              <div className="relative flex-1 sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B5E55] dark:text-[#A89B91]" />
                <input
                  type="text"
                  placeholder="Search budget, responsible, status..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6] focus:ring-2 focus:ring-[#B45309] outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              {loading && <Loader2 className="w-4 h-4 text-[#B45309] animate-spin" />}
              <span className="text-xs text-[#6B5E55] dark:text-[#A89B91] font-medium mr-1">
                {filteredBudgets.length} {filteredBudgets.length === 1 ? 'Budget' : 'Budgets'}
              </span>
              <button 
                onClick={fetchBudgets}
                title="Refresh Live Data"
                className="p-2 rounded-xl border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-xs font-semibold text-[#6B5E55] dark:text-[#A89B91] hover:text-[#B45309] transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List View Table */}
          <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#2C221E] dark:text-[#F5EFE6]">
                <thead className="bg-[#FAF6EE] dark:bg-[#29211D] text-[#6B5E55] dark:text-[#A89B91] font-bold uppercase tracking-wider border-b border-[#E6DFD5] dark:border-[#382D27]">
                  <tr>
                    <th className="px-6 py-4">Budget</th>
                    <th className="px-6 py-4">Start Date</th>
                    <th className="px-6 py-4">End Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Pie Chart</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DFD5] dark:divide-[#382D27]">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-[#6B5E55] dark:text-[#A89B91]">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-[#B45309]" />
                          <span>Connecting to Supabase PostgreSQL ledger...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredBudgets.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-[#6B5E55] dark:text-[#A89B91]">
                        No budgets found. Click <strong>New</strong> to create a budget.
                      </td>
                    </tr>
                  ) : (
                    filteredBudgets.map((b) => (
                      <tr 
                        key={b.id}
                        onClick={() => handleOpenForm(b)}
                        className="hover:bg-[#FAF6EE]/70 dark:hover:bg-[#29211D]/60 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-sm text-[#2C221E] dark:text-[#F5EFE6] group-hover:text-[#B45309] transition-colors flex items-center gap-2">
                            <span>{b.name}</span>
                            {b.revisionOfId && (
                              <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded font-medium">
                                Rev
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#6B5E55] dark:text-[#A89B91] mt-0.5 flex items-center gap-2">
                            <span>Responsible: {b.responsible || 'None'}</span>
                            <span>•</span>
                            <span className="font-semibold text-[#B45309]">{b.analyticName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-[#6B5E55] dark:text-[#A89B91] font-medium">
                          {b.startDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-[#6B5E55] dark:text-[#A89B91] font-medium">
                          {b.endDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${getStatusBadge(b.status)}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={(e) => handleOpenChart(b, e)}
                            title="View Budget Pie Chart"
                            className="inline-flex items-center justify-center p-2 rounded-xl border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#B45309] hover:bg-[#B45309] hover:text-white transition-all cursor-pointer shadow-xs"
                          >
                            <PieChartIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: BUDGET FORM VIEW (REVISED / DETAILS)                              */}
      {/* ========================================================================= */}
      {view === 'form' && activeBudget && (
        <div className="space-y-5">
          
          {/* Header Title */}
          <div className="flex items-center justify-between pb-1">
            <div>
              <h2 className="font-heading font-bold text-2xl text-[#2C221E] dark:text-[#F5EFE6]">
                {activeBudget.status === 'revised' || activeBudget.revisionOfId ? 'Budget (Revised)' : 'Budget'}
              </h2>
              <p className="text-xs text-[#6B5E55] dark:text-[#A89B91] mt-0.5">
                {activeBudget.name || 'New Budget Plan'}
              </p>
            </div>
          </div>

          {/* Top Action & Status Pipeline Header */}
          <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Action Buttons Left */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setView('list')}
                className="px-3 py-2 rounded-xl border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] text-[#2C221E] dark:text-[#F5EFE6] hover:bg-[#FAF6EE] dark:hover:bg-[#29211D] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                onClick={handleNewBudget}
                className="px-3.5 py-2 rounded-xl border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6] hover:bg-[#E6DFD5] dark:hover:bg-[#382D27] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#B45309]" />
                <span>New</span>
              </button>

              <button
                onClick={handleConfirm}
                disabled={saving || activeBudget.status === 'confirmed'}
                className="bg-[#714B67] hover:bg-[#5C3A53] text-white disabled:opacity-50 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm</span>
              </button>

              <button
                onClick={handleRevise}
                disabled={saving || activeBudget.isNew}
                className="px-3.5 py-2 rounded-xl border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] text-[#2C221E] dark:text-[#F5EFE6] hover:bg-[#FAF6EE] dark:hover:bg-[#29211D] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4 text-amber-600" />
                <span>Revise</span>
              </button>

              <button
                onClick={handleCancelBudget}
                disabled={saving || activeBudget.status === 'cancelled'}
                className="px-3.5 py-2 rounded-xl border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Ban className="w-4 h-4" />
                <span>Cancel</span>
              </button>

              <button
                onClick={handleSaveBudget}
                disabled={saving}
                className="bg-[#B45309] hover:bg-[#92400E] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ml-auto sm:ml-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save</span>
              </button>
            </div>

            {/* Odoo Style Status Pipeline Right */}
            <div className="flex items-center self-end md:self-auto bg-[#FAF6EE] dark:bg-[#29211D] p-1 rounded-xl border border-[#E6DFD5] dark:border-[#382D27]">
              {statusPipeline.map((step) => {
                const isActive = (activeBudget.status || '').toLowerCase() === step.value;
                return (
                  <button
                    key={step.value}
                    onClick={() => handlePipelineStatusChange(step.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#B45309] text-white shadow-xs'
                        : 'text-[#6B5E55] dark:text-[#A89B91] hover:text-[#2C221E] dark:hover:text-[#F5EFE6]'
                    }`}
                  >
                    {step.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Header Info Card */}
          <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 shadow-sm space-y-6">
            
            {/* Top Row: Budget Name & Revision Link */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* Left Column: Budget Name & Period */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#B45309] mb-1.5">
                    Budget Name
                  </label>
                  <input
                    type="text"
                    value={activeBudget.name || ''}
                    onChange={(e) => setActiveBudget({ ...activeBudget, name: e.target.value })}
                    placeholder="e.g. January 2026"
                    className="w-full text-lg font-bold font-heading px-3 py-2 rounded-xl border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6] focus:ring-2 focus:ring-[#B45309] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#B45309] mb-1.5">
                    Budget Period
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={activeBudget.startDate || ''}
                      onChange={(e) => setActiveBudget({ ...activeBudget, startDate: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-xl border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-xs font-medium text-[#2C221E] dark:text-[#F5EFE6] focus:ring-2 focus:ring-[#B45309] outline-none"
                    />
                    <span className="text-xs font-semibold text-[#6B5E55] dark:text-[#A89B91]">To</span>
                    <input
                      type="date"
                      value={activeBudget.endDate || ''}
                      onChange={(e) => setActiveBudget({ ...activeBudget, endDate: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-xl border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-xs font-medium text-[#2C221E] dark:text-[#F5EFE6] focus:ring-2 focus:ring-[#B45309] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Revision Of & Responsible */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#714B67] dark:text-purple-400 mb-1.5">
                    Revision Of
                  </label>
                  {activeBudget.revisionOfId ? (
                    <button
                      type="button"
                      onClick={() => handleOpenFormById(activeBudget.revisionOfId)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B45309] hover:underline cursor-pointer py-2 px-3 bg-[#FAF6EE] dark:bg-[#29211D] rounded-xl border border-[#E6DFD5] dark:border-[#382D27]"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{activeBudget.revisionOfName || 'Original Budget'} (Clickable Link)</span>
                    </button>
                  ) : (
                    <div className="text-xs text-[#6B5E55] dark:text-[#A89B91] py-2 px-3 bg-[#FAF6EE]/50 dark:bg-[#29211D]/50 rounded-xl border border-dashed border-[#E6DFD5] dark:border-[#382D27]">
                      Original Budget (None)
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#714B67] dark:text-purple-400 mb-1.5">
                    Responsible
                  </label>
                  <select
                    value={activeBudget.responsibleContactId || ''}
                    onChange={(e) => {
                      const selectedC = contacts.find(c => c.id === e.target.value);
                      setActiveBudget({
                        ...activeBudget,
                        responsibleContactId: e.target.value || null,
                        responsible: selectedC ? selectedC.name : 'None'
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-xs font-medium text-[#2C221E] dark:text-[#F5EFE6] focus:ring-2 focus:ring-[#B45309] outline-none"
                  >
                    <option value="">-- Select Contact / Responsible --</option>
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            {/* Budget Lines Table */}
            <div className="pt-4 border-t border-[#E6DFD5] dark:border-[#382D27]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold font-heading text-[#2C221E] dark:text-[#F5EFE6]">
                  Budget Lines
                </h3>
              </div>

              <div className="overflow-x-auto rounded-xl border border-[#E6DFD5] dark:border-[#382D27]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF6EE] dark:bg-[#29211D] text-[#6B5E55] dark:text-[#A89B91] font-bold uppercase tracking-wider border-b border-[#E6DFD5] dark:border-[#382D27]">
                    <tr>
                      <th className="px-4 py-3">Analytic</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3 text-right">Committed Amount</th>
                      <th className="px-4 py-3 text-right">Achieved Amount</th>
                      <th className="px-4 py-3 text-right">Achieved %</th>
                      <th className="px-4 py-3 text-right">Amount To Achieve</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DFD5] dark:divide-[#382D27]">
                    {activeBudget.lines.map((line, idx) => {
                      const committed = Number(line.committedAmount) || 0;
                      const achieved = Number(line.achievedAmount) || 0;
                      const pct = committed > 0 ? ((achieved / committed) * 100).toFixed(1) : '0.0';
                      const toAchieve = committed - achieved;

                      return (
                        <tr key={line.id || idx} className="hover:bg-[#FAF6EE]/50 dark:hover:bg-[#29211D]/40 transition-colors">
                          <td className="px-4 py-2.5 min-w-[200px]">
                            <select
                              value={line.analyticAccountId || ''}
                              onChange={(e) => handleUpdateLine(idx, 'analyticAccountId', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] text-xs font-semibold text-[#2C221E] dark:text-[#F5EFE6] focus:ring-1 focus:ring-[#B45309] outline-none"
                            >
                              {analyticAccounts.map(opt => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.name} ({opt.type})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-2.5 min-w-[110px]">
                            <span className={`px-2 py-1 rounded text-[11px] font-bold ${
                              line.type === 'Income' 
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            }`}>
                              {line.type || 'Expense'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 min-w-[130px] text-right">
                            <input
                              type="number"
                              value={line.committedAmount}
                              onChange={(e) => handleUpdateLine(idx, 'committedAmount', e.target.value)}
                              className="w-full text-right px-2.5 py-1.5 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] text-xs font-semibold text-[#2C221E] dark:text-[#F5EFE6] focus:ring-1 focus:ring-[#B45309] outline-none"
                            />
                          </td>
                          <td className="px-4 py-2.5 min-w-[130px] text-right font-bold text-emerald-600 dark:text-emerald-400">
                            ₹{achieved.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold">
                            <span className={`px-2 py-0.5 rounded ${
                              Number(pct) >= 100 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                                : 'text-[#6B5E55] dark:text-[#A89B91]'
                            }`}>
                              {pct}%
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-[#2C221E] dark:text-[#F5EFE6]">
                            ₹{toAchieve.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Totals Summary Footer */}
                  <tfoot className="bg-[#FAF6EE] dark:bg-[#29211D] font-bold border-t border-[#E6DFD5] dark:border-[#382D27] text-[#2C221E] dark:text-[#F5EFE6]">
                    <tr>
                      <td colSpan="2" className="px-4 py-3 text-right uppercase tracking-wider text-[#6B5E55] dark:text-[#A89B91]">
                        Total
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-[#B45309]">
                        ₹{totalCommitted.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-emerald-600 dark:text-emerald-400">
                        ₹{totalAchieved.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        {totalAchievedPct}%
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-purple-700 dark:text-purple-400">
                        ₹{totalToAchieve.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PIE CHART MODAL                                                           */}
      {/* ========================================================================= */}
      {showChartModal && selectedChartBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#E6DFD5] dark:border-[#382D27] pb-3">
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-[#B45309]" />
                <h3 className="font-heading font-bold text-base text-[#2C221E] dark:text-[#F5EFE6]">
                  {selectedChartBudget.name} — Budget Progress
                </h3>
              </div>
              <button
                onClick={() => setShowChartModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual SVG Donut / Pie Chart */}
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <path
                    className="text-[#FAF6EE] dark:text-[#29211D]"
                    strokeWidth="4"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {(() => {
                    const committed = selectedChartBudget.committedAmount || 1;
                    const achieved = selectedChartBudget.achievedAmount || 0;
                    const pct = Math.min(100, (achieved / committed) * 100);
                    return (
                      <path
                        className="text-emerald-500"
                        strokeDasharray={`${pct}, 100`}
                        strokeWidth="4"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    );
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-bold font-heading text-[#2C221E] dark:text-[#F5EFE6]">
                    {selectedChartBudget.achievedPercent || 0}%
                  </span>
                  <span className="text-[10px] uppercase font-bold text-[#6B5E55] dark:text-[#A89B91]">
                    Achieved
                  </span>
                </div>
              </div>

              {/* Chart Legend */}
              <div className="space-y-3 text-xs w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="text-[#6B5E55] dark:text-[#A89B91]">Achieved:</span>
                  <span className="font-bold text-[#2C221E] dark:text-[#F5EFE6]">
                    ₹{Number(selectedChartBudget.achievedAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#FAF6EE] dark:bg-[#29211D] border border-[#E6DFD5] dark:border-[#382D27] shrink-0"></span>
                  <span className="text-[#6B5E55] dark:text-[#A89B91]">Committed:</span>
                  <span className="font-bold text-[#2C221E] dark:text-[#F5EFE6]">
                    ₹{Number(selectedChartBudget.committedAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500 shrink-0"></span>
                  <span className="text-[#6B5E55] dark:text-[#A89B91]">Remaining:</span>
                  <span className="font-bold text-[#2C221E] dark:text-[#F5EFE6]">
                    ₹{Number(selectedChartBudget.amountToAchieve || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Analytic Details */}
            <div className="pt-2 border-t border-[#E6DFD5] dark:border-[#382D27] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#6B5E55] dark:text-[#A89B91]">Analytic Account:</span>
                <span className="font-bold text-[#2C221E] dark:text-[#F5EFE6]">{selectedChartBudget.analyticName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B5E55] dark:text-[#A89B91]">Target Type:</span>
                <span className="font-bold uppercase text-[#B45309]">{selectedChartBudget.analyticType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B5E55] dark:text-[#A89B91]">Responsible:</span>
                <span className="font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{selectedChartBudget.responsible}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowChartModal(false)}
                className="bg-[#B45309] hover:bg-[#92400E] text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
