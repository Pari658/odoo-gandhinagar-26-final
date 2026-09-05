import React, { useState } from 'react';
import { apiRequest } from '../api/client.js';

export default function AccountForm({ initialData, onSave, onCancel }) {
  const [formData, setFormData] = useState(
    initialData || {
      name: '',
      type: 'asset',
      reportGroup: 'balance_sheet'
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading font-bold text-xl text-[#2C221E] dark:text-[#F5EFE6]">
          {initialData ? 'Edit Chart of Account' : 'Create Chart of Account'}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            {initialData ? 'Update Account' : 'Create Account'}
          </button>
        </div>
      </form>
    </div>
  );
}
