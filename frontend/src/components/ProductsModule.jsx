import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Package, Plus, Search, Tag, DollarSign, Layers, LayoutGrid, List } from 'lucide-react';
import ProductForm from './ProductForm.jsx';
import ProductDetail from './ProductDetail.jsx';

export default function ProductsModule() {
  const { user } = useAuth();
  const [view, setView] = useState('list'); // 'list' | 'detail'
  const [displayMode, setDisplayMode] = useState('kanban'); // 'kanban' (grid) | 'table'
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  
  // Modal & Selection State
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (view === 'list') {
      fetchProducts();
      fetchCategories();
    }
  }, [filterCategory, search, view]);

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

  const handleSaveProduct = async (formData) => {
    try {
      const isEdit = !!editData;
      const endpoint = isEdit ? `/products/${editData.id}` : '/products';
      const method = isEdit ? 'PUT' : 'POST';
      
      const saved = await apiRequest(method, endpoint, formData);
      setMessage({ type: 'success', text: `Product '${saved.name}' ${isEdit ? 'updated' : 'created'} under '${saved.category}'!` });
      setShowModal(false);
      setEditData(null);
      if (view === 'list') {
        fetchProducts();
        fetchCategories();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleEdit = (product) => {
    setEditData(product);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await apiRequest('DELETE', `/products/${id}`);
      setMessage({ type: 'success', text: 'Product deleted successfully.' });
      if (view === 'detail') {
        setView('list');
      } else {
        fetchProducts();
      }
      setSelectedId(null);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <>
      {view === 'detail' ? (
        <ProductDetail 
          product={products.find(p => p.id === selectedId)}
          onBack={() => setView('list')}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ) : (
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
                onClick={() => {
                  setEditData(null);
                  setShowModal(true);
                }}
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
              className="w-full sm:w-56 px-3 py-2 text-xs rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] text-[#2C221E] dark:text-[#F5EFE6]"
            >
              <option value="">All Categories</option>
              {categories.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>

            {/* View Toggles */}
            <div className="flex items-center bg-[#FAF6EE] dark:bg-[#29211D] rounded-lg border border-[#E6DFD5] dark:border-[#382D27] p-1">
              <button
                onClick={() => setDisplayMode('table')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${displayMode === 'table' ? 'bg-white dark:bg-[#1C1613] shadow-sm text-[#B45309]' : 'text-[#6B5E55] hover:text-[#2C221E] dark:hover:text-[#F5EFE6]'}`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDisplayMode('kanban')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${displayMode === 'kanban' ? 'bg-white dark:bg-[#1C1613] shadow-sm text-[#B45309]' : 'text-[#6B5E55] hover:text-[#2C221E] dark:hover:text-[#F5EFE6]'}`}
                title="Kanban/Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Products Display */}
          {loading ? (
            <div className="text-center py-12 text-xs text-[#6B5E55]">Loading Products...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#6B5E55]">No products found.</div>
          ) : displayMode === 'table' ? (
            <div className="bg-white dark:bg-[#1C1613] rounded-xl border border-[#E6DFD5] dark:border-[#382D27] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-[#FAF6EE] dark:bg-[#29211D] text-[#6B5E55] dark:text-[#A89B91]">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Product Name</th>
                      <th className="px-4 py-3 font-semibold">Type</th>
                      <th className="px-4 py-3 font-semibold">Category</th>
                      <th className="px-4 py-3 font-semibold text-right">Cost Price</th>
                      <th className="px-4 py-3 font-semibold text-right">Sales Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DFD5] dark:divide-[#382D27]">
                    {products.map(p => (
                      <tr 
                        key={p.id}
                        onClick={() => {
                          setSelectedId(p.id);
                          setView('detail');
                        }}
                        className="hover:bg-[#FAF6EE]/50 dark:hover:bg-[#29211D]/40 cursor-pointer"
                      >
                        <td className="px-4 py-3 font-bold text-[#2C221E] dark:text-[#F5EFE6]">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#FAF6EE] dark:bg-[#29211D] flex items-center justify-center text-[10px] font-bold text-[#B45309]">
                              {p.type === 'product' || p.type === 'goods' ? <Package className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
                            </div>
                            <span className="truncate max-w-[200px] block">{p.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border uppercase ${
                            p.type === 'service' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                            p.type === 'combo' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                            'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            {p.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#6B5E55] dark:text-[#A89B91]">{p.category}</td>
                        <td className="px-4 py-3 text-right font-mono text-[#6B5E55] dark:text-[#A89B91]">₹{Number(p.costPrice).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">₹{Number(p.salesPrice).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(p => (
                <div 
                  key={p.id}
                  onClick={() => {
                    setSelectedId(p.id);
                    setView('detail');
                  }}
                  className="p-4 rounded-xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] shadow-sm hover:shadow-md transition-shadow space-y-3 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#FAF6EE] dark:bg-[#29211D] border border-[#E6DFD5] dark:border-[#382D27] flex items-center justify-center text-[#B45309]">
                        {p.type === 'product' || p.type === 'goods' ? <Package className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6] truncate max-w-[150px]">{p.name}</h3>
                        <span className="text-[10px] font-mono text-[#6B5E55]">ID: {p.id}</span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase ${
                      p.type === 'service' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                      p.type === 'combo' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                      'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}>
                      {p.type}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#6B5E55] dark:text-[#A89B91]">
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-[#B45309]" />
                      <span>{p.category}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#E6DFD5]/50 dark:border-[#382D27]">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#A89B91]">Cost Price</span>
                        <span className="font-mono text-[#2C221E] dark:text-[#F5EFE6] font-medium">₹{Number(p.costPrice).toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-[#A89B91]">Sales Price</span>
                        <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">₹{Number(p.salesPrice).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pop-up Modal for Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl my-8">
            <ProductForm
              initialData={editData}
              onSave={handleSaveProduct}
              onCancel={() => {
                setShowModal(false);
                setEditData(null);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
