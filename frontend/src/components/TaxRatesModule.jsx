import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Percent, Plus, Edit3, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function TaxRatesModule() {
  const { user } = useAuth();
  const [taxRates, setTaxRates] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTaxRate, setSelectedTaxRate] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    ratePercent: 18.00,
    linkedAccountId: ''
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    ratePercent: 18.00,
    linkedAccountId: ''
  });

  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchTaxRates();
    fetchAccounts();
  }, []);

  const fetchTaxRates = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('GET', '/tax-rates');
      setTaxRates(data || []);
    } catch (err) {
      console.error('Failed to load tax rates:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const data = await apiRequest('GET', '/accounts');
      setAccounts(data.items || []);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const created = await apiRequest('POST', '/tax-rates', {
        ...formData,
        ratePercent: Number(formData.ratePercent)
      });
      setMessage({ type: 'success', text: `Tax Rate '${created.name}' created!` });
      setShowCreateModal(false);
      setFormData({ name: '', ratePercent: 18.00, linkedAccountId: '' });
      fetchTaxRates();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const openEdit = (t) => {
    setSelectedTaxRate(t);
    setEditFormData({
      name: t.name,
      ratePercent: t.ratePercent,
      linkedAccountId: t.linkedAccountId || ''
    });
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedTaxRate) return;
    try {
      const updated = await apiRequest('PUT', `/tax-rates/${selectedTaxRate.id}`, {
        ...editFormData,
        ratePercent: Number(editFormData.ratePercent)
      });
      setMessage({ type: 'success', text: `Tax Rate '${updated.name}' updated successfully!` });
      setShowEditModal(false);
      setSelectedTaxRate(null);
      fetchTaxRates();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const openDelete = (t) => {
    setSelectedTaxRate(t);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selectedTaxRate) return;
    try {
      await apiRequest('DELETE', `/tax-rates/${selectedTaxRate.id}`);
      setMessage({ type: 'success', text: `Tax Rate '${selectedTaxRate.name}' deleted!` });
      setShowDeleteModal(false);
      setSelectedTaxRate(null);
      fetchTaxRates();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-xl text-[#2C221E] dark:text-[#F5EFE6]">
            Tax Rates Master
          </h2>
          <p className="text-xs text-[#6B5E55] dark:text-[#A89B91]">
            Manage GST and tax rates linked to Chart of Accounts with real Supabase DB persistence
          </p>
        </div>

        {['admin', 'accountant'].includes(user?.role) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#B45309] hover:bg-[#92400E] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Tax Rate</span>
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
        <div className="text-center py-12 text-xs text-[#6B5E55]">Loading Tax Rates...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {taxRates.map(t => {
            const linkedAcc = accounts.find(a => a.id === t.linkedAccountId);
            return (
              <div key={t.id} className="p-4 rounded-xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] shadow-sm hover:shadow-md transition-shadow space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-[#FAF6EE] dark:bg-[#29211D] text-[#B45309]">
                      <Percent className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6]">{t.name}</h3>
                      <span className="font-mono text-[10px] text-[#6B5E55]">ID: {t.id}</span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-base text-[#B45309]">
                    {Number(t.ratePercent).toFixed(2)}%
                  </span>
                </div>

                <div className="pt-2 border-t border-[#E6DFD5]/50 dark:border-[#382D27] flex items-center justify-between text-xs">
                  <span className="text-[10px] text-[#6B5E55]">
                    Account: <strong className="text-[#2C221E] dark:text-[#F5EFE6]">{linkedAcc ? `${linkedAcc.code} - ${linkedAcc.name}` : 'Unlinked'}</strong>
                  </span>

                  {['admin', 'accountant'].includes(user?.role) && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(t)}
                        className="p-1.5 rounded-lg hover:bg-amber-50 text-[#B45309] transition-colors cursor-pointer"
                        title="Edit Tax Rate"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openDelete(t)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                        title="Delete Tax Rate"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="font-heading font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6]">
              Create Tax Rate
            </h3>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Tax Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GST 18%"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6]"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Rate Percent (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.ratePercent}
                  onChange={e => setFormData({ ...formData, ratePercent: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6] font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Linked Account</label>
                <select
                  value={formData.linkedAccountId}
                  onChange={e => setFormData({ ...formData, linkedAccountId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6]"
                >
                  <option value="">None (Unlinked)</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                  ))}
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
                  Create Tax Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="font-heading font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6]">
              Edit Tax Rate
            </h3>

            <form onSubmit={handleUpdate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Tax Name *</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6]"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Rate Percent (%) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editFormData.ratePercent}
                  onChange={e => setEditFormData({ ...editFormData, ratePercent: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6] font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Linked Account</label>
                <select
                  value={editFormData.linkedAccountId}
                  onChange={e => setEditFormData({ ...editFormData, linkedAccountId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6]"
                >
                  <option value="">None (Unlinked)</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                  ))}
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

      {/* DELETE MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-heading font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6]">
                Delete Tax Rate?
              </h3>
            </div>
            <p className="text-xs text-[#6B5E55] dark:text-[#A89B91]">
              Are you sure you want to delete <strong>{selectedTaxRate?.name}</strong> ({selectedTaxRate?.ratePercent}%)? This action will permanently remove it from Supabase.
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
