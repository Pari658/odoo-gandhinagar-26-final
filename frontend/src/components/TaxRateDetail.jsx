import React from 'react';
import { Percent, ArrowLeft, Edit2, Trash2, Database, Link } from 'lucide-react';

export default function TaxRateDetail({ taxRate, accounts, onBack, onEdit, onDelete }) {
  if (!taxRate) {
    return <div className="text-center py-12 text-[#6B5E55]">Tax Rate not found</div>;
  }

  const linkedAcc = accounts.find(a => a.id === taxRate.linkedAccountId);

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
              <Percent className="w-6 h-6 text-[#B45309]" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-2xl text-[#2C221E] dark:text-[#F5EFE6]">
                {taxRate.name}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-mono text-[#6B5E55]">ID: {taxRate.id}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(taxRate)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#29211D] text-xs font-medium cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(taxRate.id)}
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
              Tax Rate Information
            </h3>
            
            <div className="p-6 rounded-xl bg-[#FAF6EE] dark:bg-[#120E0C] border border-[#E6DFD5] dark:border-[#382D27] flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300 font-semibold">Rate Percent</span>
              <span className="text-3xl font-mono font-bold text-[#B45309]">
                {Number(taxRate.ratePercent).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-bold text-[#6B5E55] dark:text-[#A89B91] uppercase tracking-wider mb-4 border-b border-[#E6DFD5] dark:border-[#382D27] pb-2">
              Accounting Integration
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#FAF6EE] dark:bg-[#120E0C] border border-[#E6DFD5] dark:border-[#382D27]">
                <div className="flex items-center gap-2">
                  <Link className="w-4 h-4 text-[#B45309]" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Linked Account</span>
                </div>
                <span className="font-medium text-[#2C221E] dark:text-[#F5EFE6]">
                  {linkedAcc ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border border-[#E6DFD5]/60 dark:border-[#382D27] bg-white dark:bg-[#1C1613]">
                      {linkedAcc.code} - {linkedAcc.name}
                    </span>
                  ) : (
                    <span className="text-[#A89B91] italic text-[11px]">Unlinked</span>
                  )}
                </span>
              </div>
            </div>
            
            <div className="mt-8 space-y-4 text-sm">
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
                    {taxRate.created_at ? new Date(taxRate.created_at).toLocaleString() : 'N/A'}
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
