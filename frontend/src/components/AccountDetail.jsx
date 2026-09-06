import React from 'react';
import { BookOpen, ArrowLeft, Edit2, Trash2, FileText, CheckCircle2 } from 'lucide-react';

export default function AccountDetail({ account, onBack, onEdit, onDelete }) {
  if (!account) {
    return <div className="text-center py-12 text-[#6B5E55]">Account not found</div>;
  }

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

  const config = accountTypeLabels[account.type] || { label: account.type, bg: 'bg-slate-100 text-slate-800 border-slate-300' };

  return (
    <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[#E6DFD5] dark:border-[#382D27] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-[#FAF6EE] dark:hover:bg-[#29211D] text-[#6B5E55] dark:text-[#A89B91] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#FAF6EE] dark:bg-[#29211D] border border-[#E6DFD5] dark:border-[#382D27] overflow-hidden flex items-center justify-center font-bold text-lg text-[#B45309]">
              <BookOpen className="w-6 h-6 text-[#B45309]" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-2xl text-[#2C221E] dark:text-[#F5EFE6]">
                {account.name}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-mono text-[#6B5E55]">ID: {account.id}</span>
                <span className="text-[#E6DFD5] dark:text-[#382D27]">|</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${config.bg}`}>
                  {config.label}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white dark:bg-[#1C1613] text-[#6B5E55] border border-[#E6DFD5] capitalize">
                  {account.reportGroup.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(account)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#29211D] text-xs font-medium cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(account.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20 text-xs font-medium cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-bold text-[#6B5E55] dark:text-[#A89B91] uppercase tracking-wider mb-4 border-b border-[#E6DFD5] dark:border-[#382D27] pb-2">
              Classification
            </h3>
            <div className="space-y-4 text-sm text-[#2C221E] dark:text-[#F5EFE6]">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-[#B45309]" />
                <div className="flex flex-col">
                  <span className="text-[#6B5E55] dark:text-[#A89B91] text-[10px] uppercase">Financial Statement</span>
                  <span className="font-medium text-[#2C221E] dark:text-[#F5EFE6] capitalize">
                    {account.reportGroup.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-[#B45309]" />
                <div className="flex flex-col">
                  <span className="text-[#6B5E55] dark:text-[#A89B91] text-[10px] uppercase">Ledger Group</span>
                  <span className="font-medium text-[#2C221E] dark:text-[#F5EFE6]">{config.label}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-bold text-[#6B5E55] dark:text-[#A89B91] uppercase tracking-wider mb-4 border-b border-[#E6DFD5] dark:border-[#382D27] pb-2">
              System Details
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-[#6B5E55] dark:text-[#A89B91] text-xs">Record Creation Date</span>
                <span className="font-medium text-[#2C221E] dark:text-[#F5EFE6]">
                  {account.createdAt ? new Date(account.createdAt).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
