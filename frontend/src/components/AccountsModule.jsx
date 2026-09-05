import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { BookOpen, Plus, FileText, CheckCircle2 } from 'lucide-react';

export default function AccountsModule() {
  const { user } = useAuth();
  const [groupedAccounts, setGroupedAccounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'asset',
    reportGroup: 'balance_sheet'
  });

  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('GET', '/accounts');
      setGroupedAccounts(data.grouped || {});
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const created = await apiRequest('POST', '/accounts', formData);
      setMessage({ type: 'success', text: `Account '${created.name}' created!` });
      setShowModal(false);
      setFormData({ name: '', type: 'asset', reportGroup: 'balance_sheet' });
      fetchAccounts();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const accountTypeLabels = {
    asset: { label: 'Assets', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    bank: { label: 'Bank Accounts', bg: 'bg-blue-50 text-blue-800 border-blue-200' },
    cash: { label: 'Cash Accounts', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
    liability: { label: 'Liabilities', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
    capital: { label: 'Capital / Equity', bg: 'bg-purple-50 text-purple-800 border-purple-200' },
    income: { label: 'Sales Income', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    expense: { label: 'Purchase Expenses', bg: 'bg-rose-50 text-rose-800 border-rose-200' },
    other_expense: { label: 'Other Operating Expenses', bg: 'bg-slate-100 text-slate-800 border-slate-300' }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-xl text-[#2C221E] dark:text-[#F5EFE6]">
            Chart of Accounts Master
          </h2>
          <p className="text-xs text-[#6B5E55] dark:text-[#A89B91]">
            Ledger accounts grouped by financial classification (Balance Sheet vs Profit & Loss)
          </p>
        </div>

        {['admin', 'accountant'].includes(user?.role) && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#B45309] hover:bg-[#92400E] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Ledger Account</span>
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

      {/* Accounts Grouped Display */}
      {loading ? (
        <div className="text-center py-12 text-xs text-[#6B5E55]">Loading Chart of Accounts...</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(accountTypeLabels).map(([typeKey, config]) => {
            const list = groupedAccounts[typeKey] || [];
            if (list.length === 0) return null;

            return (
              <div key={typeKey} className="rounded-xl border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] overflow-hidden shadow-sm space-y-2 p-4">
                <div className="flex items-center justify-between border-b border-[#E6DFD5]/50 dark:border-[#382D27] pb-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#B45309]" />
                    <h3 className="font-heading font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6]">
                      {config.label}
                    </h3>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${config.bg}`}>
                    {list.length} Account(s)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                  {list.map(acc => (
                    <div key={acc.id} className="p-3 rounded-lg bg-[#FAF6EE] dark:bg-[#29211D] border border-[#E6DFD5] dark:border-[#382D27] flex items-center justify-between">
                      <div>
                        <div className="font-medium text-xs text-[#2C221E] dark:text-[#F5EFE6]">{acc.name}</div>
                        <span className="font-mono text-[10px] text-[#6B5E55]">ID: {acc.id}</span>
                      </div>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white dark:bg-[#1C1613] text-[#6B5E55] border border-[#E6DFD5] capitalize">
                        {acc.reportGroup.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Account Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="font-heading font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6]">
              Create Chart of Account
            </h3>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Account Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales Income Account"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Account Type *</label>
                <select
                  value={formData.type}
                  onChange={e => {
                    const newType = e.target.value;
                    const reportGroup = ['asset', 'liability', 'bank', 'cash', 'capital'].includes(newType) ? 'balance_sheet' : 'profit_and_loss';
                    setFormData({ ...formData, type: newType, reportGroup });
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
                >
                  <option value="asset">Asset</option>
                  <option value="bank">Bank Account</option>
                  <option value="cash">Cash Account</option>
                  <option value="liability">Liability</option>
                  <option value="capital">Capital / Equity</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                  <option value="other_expense">Other Operating Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Report Group *</label>
                <select
                  value={formData.reportGroup}
                  onChange={e => setFormData({ ...formData, reportGroup: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
                >
                  <option value="balance_sheet">Balance Sheet</option>
                  <option value="profit_and_loss">Profit & Loss</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#B45309] hover:bg-[#92400E] text-white px-4 py-2 rounded-lg font-semibold cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
