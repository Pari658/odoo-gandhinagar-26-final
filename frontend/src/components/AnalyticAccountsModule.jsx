import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PieChart, Plus, ArrowLeft, Edit3, Trash2, CheckCircle2, DollarSign, Calendar, Layers, AlertTriangle } from 'lucide-react';

export default function AnalyticAccountsModule() {
  const { user } = useAuth();
  const [analyticAccounts, setAnalyticAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'detail'
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'income'
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    type: 'income'
  });

  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchAnalyticAccounts();
  }, []);

  const fetchAnalyticAccounts = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('GET', '/analytic-accounts');
      setAnalyticAccounts(data || []);
    } catch (err) {
      console.error('Failed to load analytic accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const created = await apiRequest('POST', '/analytic-accounts', formData);
      setMessage({ type: 'success', text: `Analytic Account '${created.name}' created successfully!` });
      setShowCreateModal(false);
      setFormData({ name: '', type: 'income' });
      fetchAnalyticAccounts();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedAccount) return;
    try {
      const updated = await apiRequest('PUT', `/analytic-accounts/${selectedAccount.id}`, editFormData);
      setMessage({ type: 'success', text: `Analytic Account '${updated.name}' updated successfully!` });
      setSelectedAccount(updated);
      setShowEditModal(false);
      fetchAnalyticAccounts();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async () => {
    if (!selectedAccount) return;
    try {
      await apiRequest('DELETE', `/analytic-accounts/${selectedAccount.id}`);
      setMessage({ type: 'success', text: `Analytic Account '${selectedAccount.name}' deleted!` });
      setShowDeleteModal(false);
      setSelectedAccount(null);
      setView('list');
      fetchAnalyticAccounts();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      setShowDeleteModal(false);
    }
  };

  const openDetail = (acc) => {
    setSelectedAccount(acc);
    setEditFormData({ name: acc.name, type: acc.type });
    setView('detail');
  };

  const openEdit = () => {
    setEditFormData({ name: selectedAccount.name, type: selectedAccount.type });
    setShowEditModal(true);
  };

  // DETAIL / BIG VIEW
  if (view === 'detail' && selectedAccount) {
    return (
      <div className="space-y-6">
        {/* Navigation Breadcrumb / Top Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E6DFD5] dark:border-[#382D27] pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setView('list'); setSelectedAccount(null); }}
              className="p-2 rounded-xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] text-[#6B5E55] dark:text-[#A89B91] hover:text-[#B45309] hover:border-[#B45309]/50 transition-all cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#6B5E55] dark:text-[#A89B91]">Analytic Accounts</span>
                <span className="text-xs text-[#6B5E55]">/</span>
                <span className="text-xs font-bold text-[#B45309]">{selectedAccount.name}</span>
              </div>
              <h2 className="font-heading font-bold text-2xl text-[#2C221E] dark:text-[#F5EFE6] flex items-center gap-3">
                <span>{selectedAccount.name}</span>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full border uppercase ${
                  selectedAccount.type === 'income' 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300' 
                    : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  {selectedAccount.type}
                </span>
              </h2>
            </div>
          </div>

          {['admin', 'accountant'].includes(user?.role) && (
            <div className="flex items-center gap-2">
              <button
                onClick={openEdit}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] text-slate-700 dark:text-slate-200 text-xs font-bold hover:border-[#B45309] transition-all cursor-pointer shadow-xs"
              >
                <Edit3 className="w-4 h-4 text-[#B45309]" />
                <span>Edit Account</span>
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold hover:bg-red-100 transition-all cursor-pointer shadow-xs"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-xs font-medium border flex items-center justify-between ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="font-bold cursor-pointer">✕</button>
          </div>
        )}

        {/* Big View Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Account Overview Card */}
          <div className="md:col-span-2 bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-[#E6DFD5]/60 dark:border-[#382D27] pb-4">
              <div className="p-3 rounded-2xl bg-[#FAF6EE] dark:bg-[#29211D] text-[#B45309]">
                <PieChart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-base text-[#2C221E] dark:text-[#F5EFE6]">
                  Analytic Master Specifications
                </h3>
                <p className="text-xs text-[#6B5E55] dark:text-[#A89B91]">
                  System identifiers, category rules, and ledger assignment
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#FAF6EE]/50 dark:bg-[#29211D]/40 border border-[#E6DFD5]/60 dark:border-[#382D27]">
                <span className="text-[#6B5E55] dark:text-[#A89B91] block mb-1">System Account ID</span>
                <span className="font-mono font-bold text-[#2C221E] dark:text-[#F5EFE6] text-sm">{selectedAccount.id}</span>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF6EE]/50 dark:bg-[#29211D]/40 border border-[#E6DFD5]/60 dark:border-[#382D27]">
                <span className="text-[#6B5E55] dark:text-[#A89B91] block mb-1">Analytic Category / Type</span>
                <span className="font-bold text-[#2C221E] dark:text-[#F5EFE6] text-sm uppercase">{selectedAccount.type}</span>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF6EE]/50 dark:bg-[#29211D]/40 border border-[#E6DFD5]/60 dark:border-[#382D27]">
                <span className="text-[#6B5E55] dark:text-[#A89B91] block mb-1">Allowed Operations</span>
                <span className="font-medium text-[#2C221E] dark:text-[#F5EFE6]">
                  {selectedAccount.type === 'income' ? 'Sales Orders, Customer Invoices, Revenue Accounts' : 'Purchase Orders, Vendor Bills, Cost Expenses'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF6EE]/50 dark:bg-[#29211D]/40 border border-[#E6DFD5]/60 dark:border-[#382D27]">
                <span className="text-[#6B5E55] dark:text-[#A89B91] block mb-1">Database Sync Status</span>
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" /> Live Supabase Connected
                </span>
              </div>
            </div>

            {/* Analytical Budget Metrics */}
            <div className="pt-4 border-t border-[#E6DFD5]/60 dark:border-[#382D27]">
              <h4 className="font-heading font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6] mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#B45309]" />
                <span>Analytic Budget & Line Items Summary</span>
              </h4>
              <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                This analytic account is configured as a cost center. Any invoices or bills tagged with <strong>{selectedAccount.name}</strong> will automatically update real-time project profitability metrics in reports.
              </div>
            </div>

          </div>

          {/* Quick Actions & Metadata Card */}
          <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 shadow-sm space-y-4">
            <h3 className="font-heading font-bold text-base text-[#2C221E] dark:text-[#F5EFE6] border-b border-[#E6DFD5]/60 dark:border-[#382D27] pb-3">
              Management Controls
            </h3>

            <div className="space-y-3 text-xs">
              <button
                onClick={openEdit}
                className="w-full py-2.5 px-4 rounded-xl bg-[#B45309] hover:bg-[#92400E] text-white font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Account Details</span>
              </button>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold border border-red-200 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>Delete Analytic Account</span>
              </button>

              <button
                onClick={() => { setView('list'); setSelectedAccount(null); }}
                className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] text-slate-700 dark:text-slate-300 font-semibold hover:border-[#B45309] transition-all cursor-pointer"
              >
                <span>Back to Master List</span>
              </button>
            </div>
          </div>

        </div>

        {/* EDIT MODAL IN BIG VIEW */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 max-w-md w-full shadow-xl space-y-4">
              <h3 className="font-heading font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6]">
                Edit Analytic Account
              </h3>

              <form onSubmit={handleUpdate} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Account Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Analytic Type *</label>
                  <select
                    value={editFormData.type}
                    onChange={e => setEditFormData({ ...editFormData, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6]"
                  >
                    <option value="income">Income (Used on Sales/Invoices)</option>
                    <option value="expense">Expense (Used on POs/Bills)</option>
                  </select>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#B45309] hover:bg-[#92400E] text-white px-4 py-2 rounded-lg font-semibold cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 max-w-md w-full shadow-xl space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="font-heading font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6]">
                  Delete Analytic Account?
                </h3>
              </div>
              <p className="text-xs text-[#6B5E55] dark:text-[#A89B91]">
                Are you sure you want to delete <strong>{selectedAccount.name}</strong>? This action will permanently remove it from the Supabase database.
              </p>
              <div className="pt-2 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold cursor-pointer"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-xl text-[#2C221E] dark:text-[#F5EFE6]">
            Analytic Accounts Master
          </h2>
          <p className="text-xs text-[#6B5E55] dark:text-[#A89B91]">
            Financial markers for tracking budgets across project lines, departments & cost centers (Click any card for full view & actions)
          </p>
        </div>

        {['admin', 'accountant'].includes(user?.role) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#B45309] hover:bg-[#92400E] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Analytic Account</span>
          </button>
        )}
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-xs font-medium border flex items-center justify-between ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="font-bold cursor-pointer">✕</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-xs text-[#6B5E55]">Loading Analytic Accounts...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {analyticAccounts.map(a => (
            <div
              key={a.id}
              onClick={() => openDetail(a)}
              className="p-4 rounded-xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] shadow-sm hover:shadow-md hover:border-[#B45309]/50 transition-all cursor-pointer space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#FAF6EE] dark:bg-[#29211D] text-[#B45309] group-hover:bg-[#B45309] group-hover:text-white transition-all">
                    <PieChart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6] group-hover:text-[#B45309] transition-colors">{a.name}</h3>
                    <span className="font-mono text-[10px] text-[#6B5E55]">ID: {a.id}</span>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border uppercase ${
                  a.type === 'income' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {a.type}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[#6B5E55] pt-1 border-t border-[#E6DFD5]/40 dark:border-[#382D27]">
                <span>Click to view details & actions</span>
                <span className="font-bold text-[#B45309]">View →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="font-heading font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6]">
              Create Analytic Account
            </h3>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Analytic Account Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Office Furniture Line"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6]"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Analytic Type *</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6]"
                >
                  <option value="income">Income (Used on Sales/Invoices)</option>
                  <option value="expense">Expense (Used on POs/Bills)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#B45309] hover:bg-[#92400E] text-white px-4 py-2 rounded-lg font-semibold cursor-pointer"
                >
                  Create Analytic Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
