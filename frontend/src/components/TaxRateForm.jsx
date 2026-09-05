import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';

export default function TaxRateForm({ initialData, onSave, onCancel }) {
  const [accounts, setAccounts] = useState([]);
  
  const [formData, setFormData] = useState(
    initialData || {
      name: '',
      ratePercent: 18.00,
      linkedAccountId: ''
    }
  );

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const data = await apiRequest('GET', '/accounts');
      setAccounts(data.items || []);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      ratePercent: Number(formData.ratePercent)
    });
  };

  return (
    <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading font-bold text-xl text-[#2C221E] dark:text-[#F5EFE6]">
          {initialData ? 'Edit Tax Rate' : 'Create Tax Rate'}
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
            {initialData ? 'Update Tax Rate' : 'Create Tax Rate'}
          </button>
        </div>
      </form>
    </div>
  );
}
