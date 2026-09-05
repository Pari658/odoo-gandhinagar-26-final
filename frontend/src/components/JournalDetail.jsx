import React from 'react';
import { BookMarked, ArrowLeft, Edit2, Trash2, ArrowRightLeft, Database } from 'lucide-react';

export default function JournalDetail({ journal, accounts, onBack, onEdit, onDelete }) {
  if (!journal) {
    return <div className="text-center py-12 text-[#6B5E55]">Journal not found</div>;
  }

  const typeBadgeColors = {
    sales: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    purchase: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    bank: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    cash: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
  };

  const badgeClass = typeBadgeColors[journal.type?.toLowerCase()] || 'bg-purple-50 text-purple-800 border-purple-200';
  const debitDisplayName = journal.defaultDebitAccountName || accounts.find(a => a.id === journal.defaultDebitAccountId)?.name || journal.defaultDebitAccountId;
  const creditDisplayName = journal.defaultCreditAccountName || accounts.find(a => a.id === journal.defaultCreditAccountId)?.name || journal.defaultCreditAccountId;

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
              <BookMarked className="w-6 h-6 text-[#B45309]" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-2xl text-[#2C221E] dark:text-[#F5EFE6]">
                {journal.name}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-mono text-[#6B5E55]">ID: {journal.id}</span>
                <span className="text-[#E6DFD5] dark:text-[#382D27]">|</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wider ${badgeClass}`}>
                  {journal.type}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(journal)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#29211D] text-xs font-medium cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(journal.id)}
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
              Default Posting Accounts
            </h3>
            <div className="space-y-4 text-sm text-[#2C221E] dark:text-[#F5EFE6]">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#FAF6EE] dark:bg-[#120E0C] border border-[#E6DFD5] dark:border-[#382D27]">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-[#B45309]" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Default Debit Account</span>
                </div>
                <span className="font-mono text-sm">
                  {debitDisplayName ? debitDisplayName : <span className="text-[#A89B91] italic">Not Set</span>}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#FAF6EE] dark:bg-[#120E0C] border border-[#E6DFD5] dark:border-[#382D27]">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-[#B45309]" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Default Credit Account</span>
                </div>
                <span className="font-mono text-sm">
                  {creditDisplayName ? creditDisplayName : <span className="text-[#A89B91] italic">Not Set</span>}
                </span>
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
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-[#B45309]" />
                <div className="flex flex-col">
                  <span className="text-[#6B5E55] dark:text-[#A89B91] text-[10px] uppercase">Data Source</span>
                  <span className="font-medium text-[#2C221E] dark:text-[#F5EFE6]">Live Backend DB</span>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-[#E6DFD5]/50 dark:border-[#382D27] pt-4 mt-2">
                <div className="flex flex-col">
                  <span className="text-[#6B5E55] dark:text-[#A89B91] text-xs">Record Creation Date</span>
                  <span className="font-medium text-[#2C221E] dark:text-[#F5EFE6]">
                    {journal.created_at ? new Date(journal.created_at).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
