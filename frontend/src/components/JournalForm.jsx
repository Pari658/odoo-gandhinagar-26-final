import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';

export default function JournalForm({ initialData, onSave, onCancel }) {
  const [accounts, setAccounts] = useState([]);
  
  const [formData, setFormData] = useState({
    id: initialData?.id || undefined,
    name: initialData?.name || '',
    type: initialData?.type || 'sales',
    defaultAccountId: initialData?.defaultDebitAccountId || initialData?.defaultCreditAccountId || ''
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await apiRequest('GET', '/accounts');
      const items = res?.items || (Array.isArray(res) ? res : []);
      setAccounts(items);
    } catch (err) {
      console.error('Failed to load chart of accounts:', err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      defaultDebitAccountId: formData.defaultAccountId,
      defaultCreditAccountId: formData.defaultAccountId
    });
  };

  return (
    <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading font-bold text-xl text-[#2C221E] dark:text-[#F5EFE6]">
          {initialData ? 'Edit Journal Master' : 'Create Journal Master'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
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
            Default Account
          </label>
          <select
            value={formData.defaultAccountId}
            onChange={e => setFormData({ ...formData, defaultAccountId: e.target.value })}
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

        <div className="pt-6 flex items-center justify-end gap-3 border-t border-[#E6DFD5] dark:border-[#382D27]">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl border border-[#E6DFD5] dark:border-[#382D27] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#29211D] font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-[#B45309] hover:bg-[#92400E] text-white px-6 py-2.5 rounded-xl font-semibold transition-colors cursor-pointer shadow-sm"
          >
            {initialData ? 'Update Journal' : 'Create Journal'}
          </button>
        </div>
      </form>
    </div>
  );
}
