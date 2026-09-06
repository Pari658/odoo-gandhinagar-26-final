import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';

export default function ProductForm({ initialData, onSave, onCancel }) {
  const [categories, setCategories] = useState([]);
  const [isNewCategoryMode, setIsNewCategoryMode] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  const [formData, setFormData] = useState(
    initialData || {
      name: '',
      type: 'goods',
      salesPrice: 1000,
      costPrice: 600,
      category: 'Seating',
      imageUrl: ''
    }
  );

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await apiRequest('GET', '/products/categories');
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalCategory = isNewCategoryMode ? customCategory : formData.category;
    onSave({
      ...formData,
      category: finalCategory,
      salesPrice: Number(formData.salesPrice),
      costPrice: Number(formData.costPrice)
    });
  };

  return (
    <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading font-bold text-xl text-[#2C221E] dark:text-[#F5EFE6]">
          {initialData ? 'Edit Product Master' : 'Create New Product Master'}
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
          <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Product Name *</label>
          <input
            type="text"
            required
            placeholder="e.g. Oak Dining Chair"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Product Type *</label>
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
            >
              <option value="goods">Goods</option>
              <option value="service">Service</option>
              <option value="combo">Combo</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Category *</label>
            {isNewCategoryMode ? (
              <input
                type="text"
                required
                placeholder="New category..."
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
              />
            ) : (
              <select
                value={formData.category}
                onChange={e => {
                  if (e.target.value === '__NEW__') {
                    setIsNewCategoryMode(true);
                  } else {
                    setFormData({ ...formData, category: e.target.value });
                  }
                }}
                className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="__NEW__">+ Create New Category...</option>
              </select>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Sales Price ($) *</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.salesPrice}
              onChange={e => setFormData({ ...formData, salesPrice: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Cost Price ($) *</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.costPrice}
              onChange={e => setFormData({ ...formData, costPrice: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Product Image URL</label>
          <input
            type="text"
            placeholder="https://..."
            value={formData.imageUrl}
            onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
          />
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
            {initialData ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
