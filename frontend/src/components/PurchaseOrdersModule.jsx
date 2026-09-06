import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ShoppingCart, Plus, Search, FileText, CheckCircle, ArrowLeft, Trash2, XCircle, LayoutGrid, List, Send, FileCheck2, Calendar, User, Package } from 'lucide-react';

export default function PurchaseOrdersModule() {
  const { user } = useAuth();
  
  const [view, setView] = useState('list'); // 'list' | 'detail'
  const [displayMode, setDisplayMode] = useState('kanban'); // 'kanban' | 'table'
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal & Selection
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [poDetail, setPoDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [message, setMessage] = useState(null);

  const [formData, setFormData] = useState({
    vendorId: '',
    expectedDate: '',
    notes: '',
    lines: []
  });

  useEffect(() => {
    if (view === 'list') {
      fetchPurchaseOrders();
      fetchVendors();
      fetchProducts();
    }
  }, [view]);

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

  const loadPODetail = async (id) => {
    setLoadingDetail(true);
    try {
      const res = await apiRequest('GET', `/purchase-orders/${id}`);
      setPoDetail(res);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to load PO details' });
    } finally {
      setLoadingDetail(false);
    }
  };

  const openDetail = (id) => {
    setSelectedId(id);
    setView('detail');
    loadPODetail(id);
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
      openDetail(created.id);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleConfirm = async (id) => {
    try {
      await apiRequest('POST', `/purchase-orders/${id}/confirm`);
      setMessage({ type: 'success', text: 'Purchase Order confirmed!' });
      if (view === 'detail') {
        loadPODetail(id);
      } else {
        fetchPurchaseOrders();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleCreateBill = async (id) => {
    try {
      const bill = await apiRequest('POST', `/purchase-orders/${id}/create-bill`, { billDate: new Date().toISOString().split('T')[0] });
      setMessage({ type: 'success', text: `Vendor Bill created successfully from PO!` });
      if (view === 'detail') {
        loadPODetail(id);
      } else {
        fetchPurchaseOrders();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this purchase order?')) return;
    try {
      await apiRequest('DELETE', `/purchase-orders/${id}`);
      setMessage({ type: 'success', text: 'Purchase order deleted successfully.' });
      if (view === 'detail') {
        setView('list');
      } else {
        fetchPurchaseOrders();
      }
      setSelectedId(null);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const filteredPOs = purchaseOrders.filter(po => 
    po.number?.toLowerCase().includes(search.toLowerCase()) ||
    po.vendorName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {view === 'detail' ? (
        <div className="space-y-6">
          {/* Navigation Breadcrumb / Top Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E6DFD5] dark:border-[#382D27] pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setView('list'); setSelectedId(null); setPoDetail(null); }}
                className="p-2 rounded-xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] text-[#6B5E55] dark:text-[#A89B91] hover:text-[#B45309] hover:border-[#B45309]/50 transition-all cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#6B5E55] dark:text-[#A89B91]">Purchase Orders</span>
                  <span className="text-xs text-[#6B5E55]">/</span>
                  <span className="text-xs font-bold text-[#B45309]">{poDetail?.number || 'PO View'}</span>
                </div>
                <h2 className="font-heading font-bold text-2xl text-[#2C221E] dark:text-[#F5EFE6] flex items-center gap-3">
                  <span>{poDetail?.number || 'Loading...'}</span>
                  {poDetail && (
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border uppercase ${
                      poDetail.status === 'draft' ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300' :
                      poDetail.status === 'confirmed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300' :
                      poDetail.status === 'done' ? 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300' :
                      'bg-red-50 text-red-800 border-red-200'
                    }`}>
                      {poDetail.status}
                    </span>
                  )}
                </h2>
              </div>
            </div>

            {['admin', 'accountant'].includes(user?.role) && poDetail && (
              <div className="flex items-center gap-2 flex-wrap">
                {poDetail.status === 'draft' && (
                  <button
                    onClick={() => handleConfirm(poDetail.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm Order</span>
                  </button>
                )}

                {poDetail.status === 'confirmed' && (
                  <button
                    onClick={() => handleCreateBill(poDetail.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#714B67] hover:bg-[#593950] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Create Bill</span>
                  </button>
                )}

                {poDetail.status === 'draft' && (
                  <button
                    onClick={() => handleDelete(poDetail.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold hover:bg-red-100 transition-all cursor-pointer shadow-xs"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
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

          {loadingDetail || !poDetail ? (
            <div className="text-center py-16 text-xs text-[#6B5E55]">Loading PO details...</div>
          ) : (
            <div className="space-y-6">
              
              {/* Top Summary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] shadow-sm">
                  <span className="text-[11px] text-[#6B5E55] dark:text-[#A89B91] block mb-1">Vendor Partner</span>
                  <div className="font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6] flex items-center gap-2">
                    <User className="w-4 h-4 text-[#B45309]" />
                    <span>{poDetail.vendorName || 'N/A'}</span>
                  </div>
                  {poDetail.vendorEmail && <span className="text-[10px] text-[#6B5E55] font-mono block mt-0.5">{poDetail.vendorEmail}</span>}
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] shadow-sm">
                  <span className="text-[11px] text-[#6B5E55] dark:text-[#A89B91] block mb-1">Order Date</span>
                  <div className="font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6] flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#B45309]" />
                    <span>{new Date(poDetail.orderDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] shadow-sm">
                  <span className="text-[11px] text-[#6B5E55] dark:text-[#A89B91] block mb-1">Total Value</span>
                  <div className="font-mono font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6]">
                    ₹{Number(poDetail.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Main Card & Line Items Table */}
              <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 shadow-sm space-y-6">
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E6DFD5]/60 dark:border-[#382D27] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-[#FAF6EE] dark:bg-[#29211D] text-[#B45309]">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-base text-[#2C221E] dark:text-[#F5EFE6]">
                        Order Line Items
                      </h3>
                      <p className="text-xs text-[#6B5E55] dark:text-[#A89B91]">
                        Detailed breakdown of goods and services requested
                      </p>
                    </div>
                  </div>
                </div>

                {/* Line Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#FAF6EE] dark:bg-[#29211D] text-[#6B5E55] dark:text-[#A89B91]">
                      <tr>
                        <th className="px-4 py-3 font-semibold rounded-l-lg">#</th>
                        <th className="px-4 py-3 font-semibold">Product</th>
                        <th className="px-4 py-3 font-semibold text-right">Quantity</th>
                        <th className="px-4 py-3 font-semibold text-right">Unit Price</th>
                        <th className="px-4 py-3 font-semibold text-right rounded-r-lg">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6DFD5] dark:divide-[#382D27]">
                      {poDetail.lines && poDetail.lines.length > 0 ? (
                        poDetail.lines.map((line, idx) => (
                          <tr key={line.id || idx} className="hover:bg-[#FAF6EE]/50 dark:hover:bg-[#29211D]/40">
                            <td className="px-4 py-3 font-mono text-[#6B5E55]">{idx + 1}</td>
                            <td className="px-4 py-3 font-bold text-[#2C221E] dark:text-[#F5EFE6]">{line.productName}</td>
                            <td className="px-4 py-3 text-right font-mono">{line.quantity}</td>
                            <td className="px-4 py-3 text-right font-mono">₹{Number(line.unitPrice).toFixed(2)}</td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-[#2C221E] dark:text-[#F5EFE6]">
                              ₹{Number(line.total).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center py-6 text-[#6B5E55]">No itemized lines recorded on this order.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Total Summary Footer */}
                <div className="pt-4 border-t border-[#E6DFD5]/60 dark:border-[#382D27] flex justify-end">
                  <div className="w-full sm:w-64 space-y-2 text-xs bg-[#FAF6EE] dark:bg-[#29211D] p-4 rounded-xl border border-[#E6DFD5] dark:border-[#382D27]">
                    <div className="flex justify-between text-[#6B5E55]">
                      <span>Subtotal:</span>
                      <span className="font-mono font-semibold text-[#2C221E] dark:text-[#F5EFE6]">₹{Number(poDetail.total).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[#6B5E55]">
                      <span>Taxes:</span>
                      <span className="font-mono font-semibold text-[#2C221E] dark:text-[#F5EFE6]">₹0.00</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-[#B45309] pt-2 border-t border-[#E6DFD5] dark:border-[#382D27]">
                      <span>Total Amount:</span>
                      <span className="font-mono">₹{Number(poDetail.total).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Action Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-heading font-bold text-xl text-[#2C221E] dark:text-[#F5EFE6]">
                Purchase Orders
              </h2>
              <p className="text-xs text-[#6B5E55] dark:text-[#A89B91]">
                Manage vendor purchases, budgets, and bill conversions (Click any PO for full details)
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
          <div className="flex items-center justify-between gap-3">
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
            
            {/* View Toggles */}
            <div className="flex items-center bg-[#FAF6EE] dark:bg-[#29211D] rounded-lg border border-[#E6DFD5] dark:border-[#382D27] p-1 shrink-0">
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
                title="Kanban View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* POs Display */}
          {loading ? (
            <div className="text-center py-12 text-xs text-[#6B5E55]">Loading Purchase Orders...</div>
          ) : filteredPOs.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#6B5E55]">No purchase orders found.</div>
          ) : displayMode === 'table' ? (
            <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] overflow-hidden shadow-sm flex flex-col flex-1">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#FAF6EE] dark:bg-[#29211D] text-[#6B5E55] dark:text-[#A89B91]">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Order Number</th>
                      <th className="px-6 py-4 font-semibold">Vendor</th>
                      <th className="px-6 py-4 font-semibold">Order Date</th>
                      <th className="px-6 py-4 font-semibold text-right">Total Amount</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DFD5] dark:divide-[#382D27]">
                    {filteredPOs.map((po) => (
                      <tr 
                        key={po.id} 
                        onClick={() => openDetail(po.id)}
                        className="group hover:bg-[#FAF6EE]/50 dark:hover:bg-[#29211D]/50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <span className="font-bold text-[#2C221E] dark:text-[#F5EFE6]">{po.number || 'Draft'}</span>
                        </td>
                        <td className="px-6 py-4 text-[#6B5E55] dark:text-[#A89B91]">
                          {po.vendorName}
                        </td>
                        <td className="px-6 py-4 text-[#6B5E55] dark:text-[#A89B91]">
                          {new Date(po.orderDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-[#2C221E] dark:text-[#F5EFE6]">
                          ₹{Number(po.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase ${
                            po.status === 'draft' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                            po.status === 'confirmed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                            po.status === 'done' ? 'bg-purple-50 text-purple-800 border-purple-200' :
                            'bg-red-50 text-red-800 border-red-200'
                          }`}>
                            {po.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 flex-1 items-start min-h-[500px]">
              {/* Draft Column */}
              <div className="w-80 shrink-0 bg-[#FAF6EE]/50 dark:bg-[#1C1613]/50 rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] flex flex-col h-full max-h-full">
                <div className="p-4 border-b border-[#E6DFD5]/50 dark:border-[#382D27] flex items-center justify-between sticky top-0 bg-[#FAF6EE]/90 dark:bg-[#1C1613]/90 backdrop-blur-sm rounded-t-2xl z-10">
                  <h3 className="font-heading font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-600" />
                    Request for Quotation
                  </h3>
                  <span className="text-[10px] font-bold bg-[#E6DFD5] dark:bg-[#382D27] text-[#6B5E55] px-2 py-0.5 rounded-full">
                    {filteredPOs.filter(po => po.status === 'draft').length}
                  </span>
                </div>
                <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                  {filteredPOs.filter(po => po.status === 'draft').map(po => (
                    <div key={po.id} onClick={() => openDetail(po.id)} className="bg-white dark:bg-[#29211D] p-4 rounded-xl border border-[#E6DFD5] dark:border-[#382D27] shadow-sm hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6] group-hover:text-amber-600 transition-colors">{po.number || 'Draft PO'}</span>
                        <span className="font-mono font-bold text-[#2C221E] dark:text-[#F5EFE6] text-xs">₹{Number(po.total).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="text-xs text-[#6B5E55] dark:text-[#A89B91] mb-3 line-clamp-1">{po.vendorName}</div>
                      <div className="flex items-center justify-between border-t border-[#E6DFD5]/60 dark:border-[#382D27] pt-2">
                        <span className="text-[10px] font-mono text-[#A89B91]">{new Date(po.orderDate).toLocaleDateString()}</span>
                        <span className="text-[10px] font-bold text-amber-600">Draft</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirmed Column */}
              <div className="w-80 shrink-0 bg-[#FAF6EE]/50 dark:bg-[#1C1613]/50 rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] flex flex-col h-full max-h-full">
                <div className="p-4 border-b border-[#E6DFD5]/50 dark:border-[#382D27] flex items-center justify-between sticky top-0 bg-[#FAF6EE]/90 dark:bg-[#1C1613]/90 backdrop-blur-sm rounded-t-2xl z-10">
                  <h3 className="font-heading font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6] flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-600" />
                    Purchase Order
                  </h3>
                  <span className="text-[10px] font-bold bg-[#E6DFD5] dark:bg-[#382D27] text-[#6B5E55] px-2 py-0.5 rounded-full">
                    {filteredPOs.filter(po => po.status === 'confirmed').length}
                  </span>
                </div>
                <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                  {filteredPOs.filter(po => po.status === 'confirmed').map(po => (
                    <div key={po.id} onClick={() => openDetail(po.id)} className="bg-white dark:bg-[#29211D] p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6] group-hover:text-emerald-600 transition-colors">{po.number}</span>
                        <span className="font-mono font-bold text-[#2C221E] dark:text-[#F5EFE6] text-xs">₹{Number(po.total).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="text-xs text-[#6B5E55] dark:text-[#A89B91] mb-3 line-clamp-1">{po.vendorName}</div>
                      <div className="flex items-center justify-between border-t border-[#E6DFD5]/60 dark:border-[#382D27] pt-2">
                        <span className="text-[10px] font-mono text-[#A89B91]">{new Date(po.orderDate).toLocaleDateString()}</span>
                        <span className="text-[10px] font-bold text-emerald-600">Confirmed</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Done / Billed Column */}
              <div className="w-80 shrink-0 bg-[#FAF6EE]/50 dark:bg-[#1C1613]/50 rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] flex flex-col h-full max-h-full">
                <div className="p-4 border-b border-[#E6DFD5]/50 dark:border-[#382D27] flex items-center justify-between sticky top-0 bg-[#FAF6EE]/90 dark:bg-[#1C1613]/90 backdrop-blur-sm rounded-t-2xl z-10">
                  <h3 className="font-heading font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6] flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-purple-600" />
                    Locked / Done
                  </h3>
                  <span className="text-[10px] font-bold bg-[#E6DFD5] dark:bg-[#382D27] text-[#6B5E55] px-2 py-0.5 rounded-full">
                    {filteredPOs.filter(po => po.status === 'done').length}
                  </span>
                </div>
                <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                  {filteredPOs.filter(po => po.status === 'done').map(po => (
                    <div key={po.id} onClick={() => openDetail(po.id)} className="bg-white dark:bg-[#29211D] p-4 rounded-xl border border-purple-200 dark:border-purple-900/50 shadow-sm hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6] group-hover:text-purple-600 transition-colors">{po.number}</span>
                        <span className="font-mono font-bold text-[#2C221E] dark:text-[#F5EFE6] text-xs">₹{Number(po.total).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="text-xs text-[#6B5E55] dark:text-[#A89B91] mb-3 line-clamp-1">{po.vendorName}</div>
                      <div className="flex items-center justify-between border-t border-[#E6DFD5]/60 dark:border-[#382D27] pt-2">
                        <span className="text-[10px] font-mono text-[#A89B91]">{new Date(po.orderDate).toLocaleDateString()}</span>
                        <span className="text-[10px] font-bold text-purple-600 flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Done</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
                          <span className="text-[#6B5E55]">₹</span>
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
    </>
  );
}
