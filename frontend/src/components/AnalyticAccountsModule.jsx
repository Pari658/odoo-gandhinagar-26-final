import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PieChart, Plus, BarChart3 } from 'lucide-react';

export default function AnalyticAccountsModule() {
  const { user } = useAuth();
  const [analyticAccounts, setAnalyticAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
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
      setMessage({ type: 'success', text: `Analytic Account '${created.name}' created!` });
      setShowModal(false);
      setFormData({ name: '', type: 'income' });
      fetchAnalyticAccounts();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-xl text-[#2C221E] dark:text-[#F5EFE6]">
            Analytic Accounts Master
          </h2>
          <p className="text-xs text-[#6B5E55] dark:text-[#A89B91]">
            Financial markers for tracking budgets across project lines, departments & cost centers
          </p>
        </div>

        {['admin', 'accountant'].includes(user?.role) && (
          <button
            onClick={() => setShowModal(true)}
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
            <div key={a.id} className="p-4 rounded-xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#FAF6EE] dark:bg-[#29211D] text-[#B45309]">
                    <PieChart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6]">{a.name}</h3>
                    <span className="font-mono text-[10px] text-[#6B5E55]">ID: {a.id}</span>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border uppercase ${
                  a.type === 'income' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {a.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
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
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Analytic Type *</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
                >
                  <option value="income">Income (Used on Sales/Invoices)</option>
                  <option value="expense">Expense (Used on POs/Bills)</option>
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
