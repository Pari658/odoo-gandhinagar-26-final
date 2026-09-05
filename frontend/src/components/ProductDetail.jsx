import React from 'react';
import { Package, ArrowLeft, Edit2, Trash2, Tag, DollarSign, Layers } from 'lucide-react';

export default function ProductDetail({ product, onBack, onEdit, onDelete }) {
  if (!product) {
    return <div className="text-center py-12 text-[#6B5E55]">Product not found</div>;
  }

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
            <div className="w-16 h-16 rounded-xl bg-[#FAF6EE] dark:bg-[#29211D] border border-[#E6DFD5] dark:border-[#382D27] overflow-hidden flex items-center justify-center font-bold text-lg text-[#B45309]">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <Package className="w-8 h-8 text-[#B45309]" />
              )}
            </div>
            <div>
              <h2 className="font-heading font-bold text-2xl text-[#2C221E] dark:text-[#F5EFE6]">
                {product.name}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-mono text-[#6B5E55]">ID: {product.id}</span>
                <span className="text-[#E6DFD5] dark:text-[#382D27]">|</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200">
                  {product.category}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase bg-amber-50 text-amber-800 border-amber-200">
                  {product.type}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(product)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#29211D] text-xs font-medium cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(product.id)}
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
              Pricing Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#FAF6EE] dark:bg-[#120E0C] border border-[#E6DFD5] dark:border-[#382D27]">
                <div className="text-[10px] text-[#6B5E55] uppercase tracking-wider font-semibold mb-1">Sales Price</div>
                <div className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  ${Number(product.salesPrice).toFixed(2)}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#FAF6EE] dark:bg-[#120E0C] border border-[#E6DFD5] dark:border-[#382D27]">
                <div className="text-[10px] text-[#6B5E55] uppercase tracking-wider font-semibold mb-1">Cost Price</div>
                <div className="text-2xl font-mono font-bold text-rose-600 dark:text-rose-400">
                  ${Number(product.costPrice).toFixed(2)}
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
              <div className="flex items-center gap-3">
                <Tag className="w-4 h-4 text-[#B45309]" />
                <div className="flex flex-col">
                  <span className="text-[#6B5E55] dark:text-[#A89B91] text-[10px] uppercase">Category</span>
                  <span className="font-medium text-[#2C221E] dark:text-[#F5EFE6]">{product.category}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4 text-[#B45309]" />
                <div className="flex flex-col">
                  <span className="text-[#6B5E55] dark:text-[#A89B91] text-[10px] uppercase">Product Type</span>
                  <span className="font-medium text-[#2C221E] dark:text-[#F5EFE6] uppercase">{product.type}</span>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-[#E6DFD5]/50 dark:border-[#382D27] pt-4 mt-2">
                <div className="flex flex-col">
                  <span className="text-[#6B5E55] dark:text-[#A89B91] text-xs">Record Creation Date</span>
                  <span className="font-medium text-[#2C221E] dark:text-[#F5EFE6]">
                    {new Date(product.created_at).toLocaleString()}
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
