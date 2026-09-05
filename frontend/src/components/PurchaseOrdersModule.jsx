import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ShoppingCart, Plus, Search, CheckCircle, XCircle, FileText, Check, AlertCircle } from 'lucide-react';

export default function PurchaseOrdersModule() {
  const { user } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({
    vendorId: '',
    expectedDate: '',
    notes: '',
    lines: []
  });

  useEffect(() => {
    fetchPurchaseOrders();
    fetchVendors();
    fetchProducts();
  }, []);

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('GET', '/purchase-orders');
      setPurchaseOrders(data.items || []);
    } catch (err) {
      console.error('Failed to load purchase orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const data = await apiRequest('GET', '/contacts?type=vendor');
      setVendors(data.items || []);
    } catch (err) {
      console.error('Failed to load vendors:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await apiRequest('GET', '/products');
      setProducts(data.items || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const handleAddLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { productId: '', quantity: 1, unitPrice: 0, taxRateId: null }]
    });
  };

  const handleRemoveLine = (index) => {
    const newLines = formData.lines.filter((_, i) => i !== index);
    setFormData({ ...formData, lines: newLines });
  };

  const handleLineChange = (index, field, value) => {
    const newLines = [...formData.lines];
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      newLines[index] = {
        ...newLines[index],
        productId: value,
        unitPrice: product ? product.costPrice : 0
      };
    } else {
      newLines[index] = { ...newLines[index], [field]: value };
    }
    setFormData({ ...formData, lines: newLines });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (formData.lines.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one line item.' });
      return;
    }
    try {
      const cleanedData = {
        vendorId: formData.vendorId,
        orderDate: formData.expectedDate || new Date().toISOString().split('T')[0],
        lines: formData.lines.map(l => ({
          productId: l.productId,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice)
        }))
      };
      
      const created = await apiRequest('POST', '/purchase-orders', cleanedData);
      setMessage({ type: 'success', text: `Purchase Order ${created.number} created successfully!` });
      setShowModal(false);
      setFormData({ vendorId: '', expectedDate: '', notes: '', lines: [] });
      fetchPurchaseOrders();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleConfirm = async (id) => {
    try {
      await apiRequest('POST', `/purchase-orders/${id}/confirm`);
      setMessage({ type: 'success', text: 'Purchase Order confirmed!' });
      fetchPurchaseOrders();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleCreateBill = async (id) => {
    try {
      const bill = await apiRequest('POST', `/purchase-orders/${id}/create-bill`, { billDate: new Date().toISOString().split('T')[0] });
      setMessage({ type: 'success', text: `Vendor Bill created successfully from PO!` });
      fetchPurchaseOrders();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const filteredPOs = purchaseOrders.filter(po => 
    po.number?.toLowerCase().includes(search.toLowerCase()) ||
    po.vendorName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-xl text-[#2C221E] dark:text-[#F5EFE6]">
            Purchase Orders
          </h2>
          <p className="text-xs text-[#6B5E55] dark:text-[#A89B91]">
            Manage vendor purchases, budgets, and bill conversions
          </p>
        </div>

        {['admin', 'accountant'].includes(user?.role) && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#B45309] hover:bg-[#92400E] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Purchase Order</span>
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

      {/* Filter and Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#9E9085]" />
          <input
            type="text"
            placeholder="Search POs by number or vendor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] text-[#2C221E] dark:text-[#F5EFE6] focus:outline-none focus:ring-2 focus:ring-[#B45309]"
          />
        </div>
      </div>

      {/* POs Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs text-[#6B5E55]">Loading Purchase Orders...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPOs.map(po => (
            <div key={po.id} className="p-4 rounded-xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FAF6EE] dark:bg-[#29211D] border border-[#E6DFD5] dark:border-[#382D27] flex items-center justify-center text-[#B45309]">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6]">{po.number || 'Draft'}</h3>
                    <span className="text-[10px] font-mono text-[#6B5E55]">{po.vendorName}</span>
                  </div>
                </div>

                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase ${
                  po.status === 'draft' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                  po.status === 'confirmed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                  po.status === 'done' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                  'bg-red-50 text-red-800 border-red-200'
                }`}>
                  {po.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-[#6B5E55] dark:text-[#A89B91]">
                <div>
                  <p className="font-medium">Total Amount</p>
                  <p className="font-mono tabular-nums text-[#2C221E] dark:text-[#F5EFE6] font-bold">
                    ${Number(po.total).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Order Date</p>
                  <p>{new Date(po.orderDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E6DFD5]/50 dark:border-[#382D27] flex flex-wrap items-center gap-2">
                {po.status === 'draft' && ['admin', 'accountant'].includes(user?.role) && (
                  <button
                    onClick={() => handleConfirm(po.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Confirm
                  </button>
                )}
                {po.status === 'confirmed' && ['admin', 'accountant'].includes(user?.role) && (
                  <button
                    onClick={() => handleCreateBill(po.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#714B67] text-white hover:bg-[#593950] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Create Bill
                  </button>
                )}
                {po.status === 'done' && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded-lg text-xs font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Billed
                  </span>
                )}
              </div>
            </div>
          ))}
          {filteredPOs.length === 0 && !loading && (
            <div className="col-span-full py-8 text-center text-sm text-[#6B5E55]">
              No purchase orders found.
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl space-y-4">
            <h3 className="font-heading font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6]">
              Create New Purchase Order
            </h3>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Vendor *</label>
                  <select
                    required
                    value={formData.vendorId}
                    onChange={e => setFormData({ ...formData, vendorId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
                  >
                    <option value="">Select a vendor...</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Expected Date</label>
                  <input
                    type="date"
                    value={formData.expectedDate}
                    onChange={e => setFormData({ ...formData, expectedDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold">Order Lines *</label>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-[#B45309] hover:text-[#92400E] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Line
                  </button>
                </div>
                
                {formData.lines.length === 0 ? (
                  <div className="text-center py-4 text-[#6B5E55] border border-dashed border-[#E6DFD5] dark:border-[#382D27] rounded-lg">
                    No lines added. Click "Add Line" to start.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.lines.map((line, index) => (
                      <div key={index} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-[#FAF6EE] dark:bg-[#29211D] p-3 rounded-lg border border-[#E6DFD5] dark:border-[#382D27]">
                        <select
                          required
                          value={line.productId}
                          onChange={e => handleLineChange(index, 'productId', e.target.value)}
                          className="flex-1 min-w-[200px] px-2 py-1.5 rounded border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613]"
                        >
                          <option value="">Select Product...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          required
                          placeholder="Qty"
                          value={line.quantity}
                          onChange={e => handleLineChange(index, 'quantity', e.target.value)}
                          className="w-20 px-2 py-1.5 rounded border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] text-center"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-[#6B5E55]">$</span>
                          <input
                            type="number"
                            step="0.01"
                            required
                            placeholder="Price"
                            value={line.unitPrice}
                            onChange={e => handleLineChange(index, 'unitPrice', e.target.value)}
                            className="w-24 px-2 py-1.5 rounded border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613]"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(index)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Notes</label>
                <textarea
                  rows="2"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
                ></textarea>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#E6DFD5] dark:border-[#382D27]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-[#F3ECE0] dark:hover:bg-[#382D27]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#B45309] hover:bg-[#92400E] text-white px-4 py-2 rounded-lg font-semibold cursor-pointer shadow-sm"
                >
                  Create PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
