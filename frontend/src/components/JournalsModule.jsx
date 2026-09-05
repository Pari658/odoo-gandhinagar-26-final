import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { BookMarked, Plus, Pencil, Trash2, X, AlertTriangle, RefreshCw, Layers } from 'lucide-react';

export default function JournalsModule() {
  const { user } = useAuth();
  const [journals, setJournals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingJournal, setEditingJournal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const emptyForm = {
    name: '',
    type: 'sales',
    defaultDebitAccountId: '',
    defaultCreditAccountId: ''
  };

  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchJournals();
    fetchAccounts();
  }, []);

  const fetchJournals = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('GET', '/journals');
      setJournals(data || []);
    } catch (err) {
      console.error('Failed to load journals from backend:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to load journals from backend' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await apiRequest('GET', '/accounts');
      const items = res?.items || (Array.isArray(res) ? res : []);
      setAccounts(items);
    } catch (err) {
      console.error('Failed to load chart of accounts:', err);
    }
  };

  const openCreateModal = () => {
    setEditingJournal(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (journal) => {
    setEditingJournal(journal);
    setFormData({
      name: journal.name || '',
      type: journal.type || 'sales',
      defaultDebitAccountId: journal.defaultDebitAccountId || '',
      defaultCreditAccountId: journal.defaultCreditAccountId || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingJournal(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Journal name is required' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        type: formData.type,
        defaultDebitAccountId: formData.defaultDebitAccountId || null,
        defaultCreditAccountId: formData.defaultCreditAccountId || null
      };

      if (editingJournal) {
        const updated = await apiRequest('PUT', `/journals/${editingJournal.id}`, payload);
        setMessage({ type: 'success', text: `Journal '${updated.name}' updated successfully in database!` });
      } else {
        const created = await apiRequest('POST', '/journals', payload);
        setMessage({ type: 'success', text: `Journal '${created.name}' created successfully in database!` });
      }

      closeModal();
      await fetchJournals();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Operation failed' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiRequest('DELETE', `/journals/${deleteTarget.id}`);
      setMessage({ type: 'success', text: `Journal '${deleteTarget.name}' deleted successfully!` });
      setDeleteTarget(null);
      await fetchJournals();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete journal' });
    } finally {
      setDeleting(false);
    }
  };

  const isPrivileged = ['admin', 'accountant'].includes(user?.role);

  const typeBadgeColors = {
    sales: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    purchase: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    bank: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    cash: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-heading font-bold text-xl text-[#2C221E] dark:text-[#F5EFE6]">
              Journals Master
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-[#FAF6EE] dark:bg-[#29211D] text-[#B45309] border border-[#E6DFD5] dark:border-[#382D27]">
              Live Backend DB
            </span>
          </div>
          <p className="text-xs text-[#6B5E55] dark:text-[#A89B91] mt-1">
            Define transaction journals (Sales, Purchase, Bank, Cash) and their linked ledger accounts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchJournals}
            title="Refresh list"
            className="p-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] hover:bg-[#FAF6EE] dark:hover:bg-[#29211D] text-[#6B5E55] dark:text-[#A89B91] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#B45309]' : ''}`} />
          </button>

          {isPrivileged && (
            <button
              onClick={openCreateModal}
              className="bg-[#B45309] hover:bg-[#92400E] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Journal</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Notifications */}
      {message && (
        <div className={`p-3 rounded-lg text-xs font-medium border flex items-center justify-between ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800' 
            : 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="font-bold cursor-pointer text-sm leading-none ml-2">✕</button>
        </div>
      )}

      {/* Journals List / Cards */}
      {loading ? (
        <div className="text-center py-16 text-xs text-[#6B5E55] flex flex-col items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-[#B45309]" />
          <span>Fetching real journals from backend database...</span>
        </div>
      ) : journals.length === 0 ? (
        <div className="text-center py-16 space-y-3 bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-8">
          <BookMarked className="w-12 h-12 mx-auto text-[#C4B5A6]" />
          <p className="text-sm font-medium text-[#2C221E] dark:text-[#F5EFE6]">No journals found in database</p>
          <p className="text-xs text-[#6B5E55] dark:text-[#A89B91]">Create your first accounting journal to start recording transactions.</p>
          {isPrivileged && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 text-xs text-white bg-[#B45309] hover:bg-[#92400E] px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Journal</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {journals.map(j => {
            const badgeClass = typeBadgeColors[j.type?.toLowerCase()] || 'bg-purple-50 text-purple-800 border-purple-200';
            const debitDisplayName = j.defaultDebitAccountName || accounts.find(a => a.id === j.defaultDebitAccountId)?.name || j.defaultDebitAccountId;
            const creditDisplayName = j.defaultCreditAccountName || accounts.find(a => a.id === j.defaultCreditAccountId)?.name || j.defaultCreditAccountId;

            return (
              <div 
                key={j.id} 
                className="p-5 rounded-xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] shadow-sm space-y-3 hover:border-[#B45309]/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-lg bg-[#FAF6EE] dark:bg-[#29211D] text-[#B45309]">
                      <BookMarked className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6]">
                        {j.name}
                      </h3>
                      <span className="font-mono text-[10px] text-[#8C7E74] block truncate max-w-[220px]" title={j.id}>
                        {j.id}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${badgeClass}`}>
                      {j.type}
                    </span>

                    {isPrivileged && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(j)}
                          className="p-1.5 rounded-md hover:bg-[#FAF6EE] dark:hover:bg-[#29211D] text-[#6B5E55] hover:text-[#B45309] transition-colors cursor-pointer"
                          title="Edit journal"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(j)}
                          className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-[#6B5E55] hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete journal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E6DFD5]/50 dark:border-[#382D27] space-y-1.5 text-xs text-[#6B5E55] dark:text-[#A89B91]">
                  <div className="flex items-center justify-between">
                    <span>Default Debit Account:</span>
                    <span className="font-medium text-[#2C221E] dark:text-[#F5EFE6] text-right">
                      {debitDisplayName ? (
                        <span className="inline-flex items-center gap-1 bg-[#FAF6EE] dark:bg-[#29211D] px-2 py-0.5 rounded text-[11px] font-mono border border-[#E6DFD5]/60 dark:border-[#382D27]">
                          {debitDisplayName}
                        </span>
                      ) : (
                        <span className="text-[#A89B91] italic text-[11px]">Not Set</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span>Default Credit Account:</span>
                    <span className="font-medium text-[#2C221E] dark:text-[#F5EFE6] text-right">
                      {creditDisplayName ? (
                        <span className="inline-flex items-center gap-1 bg-[#FAF6EE] dark:bg-[#29211D] px-2 py-0.5 rounded text-[11px] font-mono border border-[#E6DFD5]/60 dark:border-[#382D27]">
                          {creditDisplayName}
                        </span>
                      ) : (
                        <span className="text-[#A89B91] italic text-[11px]">Not Set</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6]">
                {editingJournal ? 'Edit Journal Master' : 'Create Journal Master'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 rounded-md hover:bg-[#FAF6EE] dark:hover:bg-[#29211D] text-[#6B5E55] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#2C221E] dark:text-[#F5EFE6] font-semibold mb-1">
                  Journal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Customer Sales Journal"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6] focus:outline-none focus:border-[#B45309]"
                />
              </div>

              <div>
                <label className="block text-[#2C221E] dark:text-[#F5EFE6] font-semibold mb-1">
                  Journal Type *
                </label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6] focus:outline-none focus:border-[#B45309]"
                >
                  <option value="sales">Sales Journal</option>
                  <option value="purchase">Purchase Journal</option>
                  <option value="bank">Bank Journal</option>
                  <option value="cash">Cash Journal</option>
                </select>
              </div>

              <div>
                <label className="block text-[#2C221E] dark:text-[#F5EFE6] font-semibold mb-1">
                  Default Debit Account
                </label>
                <select
                  value={formData.defaultDebitAccountId}
                  onChange={e => setFormData({ ...formData, defaultDebitAccountId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6] focus:outline-none focus:border-[#B45309]"
                >
                  <option value="">-- None (Optional) --</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#2C221E] dark:text-[#F5EFE6] font-semibold mb-1">
                  Default Credit Account
                </label>
                <select
                  value={formData.defaultCreditAccountId}
                  onChange={e => setFormData({ ...formData, defaultCreditAccountId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6] focus:outline-none focus:border-[#B45309]"
                >
                  <option value="">-- None (Optional) --</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#E6DFD5]/50 dark:border-[#382D27]">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] text-[#6B5E55] dark:text-[#A89B91] hover:bg-[#FAF6EE] dark:hover:bg-[#29211D] cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#B45309] hover:bg-[#92400E] disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold cursor-pointer transition-colors shadow-sm"
                >
                  {submitting
                    ? (editingJournal ? 'Updating...' : 'Creating...')
                    : (editingJournal ? 'Save Changes' : 'Create Journal')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-heading font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6]">
                Delete Journal
              </h3>
            </div>

            <p className="text-xs text-[#6B5E55] dark:text-[#A89B91] leading-relaxed">
              Are you sure you want to delete <strong className="text-[#2C221E] dark:text-[#F5EFE6]">"{deleteTarget.name}"</strong>?
              This will remove the journal from the database permanently.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6DFD5]/50 dark:border-[#382D27]">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] text-[#6B5E55] dark:text-[#A89B91] text-xs cursor-pointer hover:bg-[#FAF6EE] dark:hover:bg-[#29211D] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete Journal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
