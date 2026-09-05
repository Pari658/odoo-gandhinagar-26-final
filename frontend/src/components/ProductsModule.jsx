import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Package, Plus, Search, Tag, DollarSign, Layers } from 'lucide-react';

export default function ProductsModule() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Dynamic category entry flag
  const [isNewCategoryMode, setIsNewCategoryMode] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    type: 'goods',
    salesPrice: 1000,
    costPrice: 600,
    category: 'Seating',
    imageUrl: ''
  });

  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [filterCategory, search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = '?';
      if (filterCategory) query += `category=${encodeURIComponent(filterCategory)}&`;
      if (search) query += `search=${encodeURIComponent(search)}&`;

      const data = await apiRequest('GET', `/products${query}`);
      setProducts(data.items || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await apiRequest('GET', '/products/categories');
      setCategories(data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const finalCategory = isNewCategoryMode ? customCategory : formData.category;
      const created = await apiRequest('POST', '/products', {
        ...formData,
        category: finalCategory,
        salesPrice: Number(formData.salesPrice),
        costPrice: Number(formData.costPrice)
      });

      setMessage({ type: 'success', text: `Product '${created.name}' created under '${created.category}'!` });
      setShowModal(false);
      setFormData({ name: '', type: 'goods', salesPrice: 1000, costPrice: 600, category: 'Seating', imageUrl: '' });
      setIsNewCategoryMode(false);
      setCustomCategory('');
      fetchProducts();
      fetchCategories();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-xl text-[#2C221E] dark:text-[#F5EFE6]">
            Product Master
          </h2>
          <p className="text-xs text-[#6B5E55] dark:text-[#A89B91]">
            Goods, Services & Combos with dynamic category creation
          </p>
        </div>

        {['admin', 'accountant'].includes(user?.role) && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#B45309] hover:bg-[#92400E] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
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

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#9E9085]" />
          <input
            type="text"
            placeholder="Search products by name or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] text-[#2C221E] dark:text-[#F5EFE6] focus:outline-none focus:ring-2 focus:ring-[#B45309]"
          />
        </div>

        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 text-xs rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] text-[#2C221E] dark:text-[#F5EFE6]"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs text-[#6B5E55]">Loading Products...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(p => (
            <div key={p.id} className="p-4 rounded-xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] shadow-sm hover:shadow-md transition-shadow space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#FAF6EE] dark:bg-[#29211D] border border-[#E6DFD5] dark:border-[#382D27] overflow-hidden flex items-center justify-center font-bold text-[#B45309]">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 text-[#B45309]" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6]">{p.name}</h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200">
                      {p.category}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase bg-amber-50 text-amber-800 border-amber-200">
                  {p.type}
                </span>
              </div>

              <div className="pt-2 border-t border-[#E6DFD5]/50 dark:border-[#382D27] grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-[#6B5E55] block">Sales Price</span>
                  <span className="font-mono font-bold text-[#2C221E] dark:text-[#F5EFE6] text-sm">
                    ${Number(p.salesPrice).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#6B5E55] block">Cost Price</span>
                  <span className="font-mono font-medium text-[#6B5E55] dark:text-[#A89B91]">
                    ${Number(p.costPrice).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="font-heading font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6]">
              Create New Product Master
            </h3>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
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

              <div className="grid grid-cols-2 gap-3">
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

              <div className="grid grid-cols-2 gap-3">
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

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#B45309] hover:bg-[#92400E] text-white px-4 py-2 rounded-lg font-semibold cursor-pointer"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
