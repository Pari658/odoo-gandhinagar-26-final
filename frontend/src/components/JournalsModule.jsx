import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { BookMarked, Plus, ArrowRight } from 'lucide-react';

export default function JournalsModule() {
  const { user } = useAuth();
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'sales',
    defaultDebitAccountId: '',
    defaultCreditAccountId: ''
  });

  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('GET', '/journals');
      setJournals(data || []);
    } catch (err) {
      console.error('Failed to load journals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const created = await apiRequest('POST', '/journals', formData);
      setMessage({ type: 'success', text: `Journal '${created.name}' created!` });
      setShowModal(false);
      setFormData({ name: '', type: 'sales', defaultDebitAccountId: '', defaultCreditAccountId: '' });
      fetchJournals();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-xl text-[#2C221E] dark:text-[#F5EFE6]">
            Journals Master
          </h2>
          <p className="text-xs text-[#6B5E55] dark:text-[#A89B91]">
            Define transaction journals (Sales, Purchase, Bank, Cash) and default ledger accounts
          </p>
        </div>

        {['admin', 'accountant'].includes(user?.role) && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#B45309] hover:bg-[#92400E] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Journal</span>
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
        <div className="text-center py-12 text-xs text-[#6B5E55]">Loading Journals...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {journals.map(j => (
            <div key={j.id} className="p-5 rounded-xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#FAF6EE] dark:bg-[#29211D] text-[#B45309]">
                    <BookMarked className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6]">{j.name}</h3>
                    <span className="font-mono text-[10px] text-[#6B5E55]">ID: {j.id}</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full border uppercase bg-purple-50 text-purple-800 border-purple-200">
                  {j.type}
                </span>
              </div>

              <div className="pt-2 border-t border-[#E6DFD5]/50 dark:border-[#382D27] space-y-1.5 text-xs text-[#6B5E55]">
                <div className="flex items-center justify-between">
                  <span>Default Debit Account:</span>
                  <span className="font-mono font-medium text-[#2C221E] dark:text-[#F5EFE6]">
                    {j.defaultDebitAccountId || 'Not Set'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Default Credit Account:</span>
                  <span className="font-mono font-medium text-[#2C221E] dark:text-[#F5EFE6]">
                    {j.defaultCreditAccountId || 'Not Set'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="font-heading font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6]">
              Create Journal Master
            </h3>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Journal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sales Journal"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Journal Type *</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
                >
                  <option value="sales">Sales Journal</option>
                  <option value="purchase">Purchase Journal</option>
                  <option value="bank">Bank Journal</option>
                  <option value="cash">Cash Journal</option>
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
                  Create Journal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
