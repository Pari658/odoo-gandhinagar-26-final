import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Plus, Search, ChevronRight, CheckCircle2, ChevronLeft } from 'lucide-react';
import { fetchSalesOrders, confirmSalesOrder } from '../api/salesOrders.js';
import SalesOrderForm from './SalesOrderForm.jsx';
import SalesOrderDetail from './SalesOrderDetail.jsx';

export default function SalesOrdersModule() {
  const [view, setView] = useState('list'); // 'list' | 'create' | 'edit' | 'detail'
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Pagination & Search State
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  
  // Selection State
  const [selectedId, setSelectedId] = useState(null);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    if (view === 'list') {
      loadSalesOrders();
    }
  }, [view, page]);

  // Debounced Search
  useEffect(() => {
    if (view === 'list') {
      const timer = setTimeout(() => {
        setPage(1);
        loadSalesOrders();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [search]);

  const loadSalesOrders = async () => {
    setLoading(true);
    try {
      const res = await fetchSalesOrders(page, pageSize, search);
      setSalesOrders(res?.items || []);
      setTotalCount(res?.totalCount || 0);
      setErrorMsg(null);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load Sales Orders');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id, e) => {
    e.stopPropagation();
    try {
      await confirmSalesOrder(id);
      loadSalesOrders();
    } catch (err) {
      alert(err.message || 'Failed to confirm order');
    }
  };

  const openDetail = (id) => {
    setSelectedId(id);
    setView('detail');
  };

  const openEdit = (order) => {
    setEditData(order);
    setView('edit');
  };

  if (view === 'create') {
    return (
      <SalesOrderForm 
        onCancel={() => setView('list')} 
        onSuccess={() => setView('list')} 
      />
    );
  }

  if (view === 'edit') {
    return (
      <SalesOrderForm 
        initialData={editData}
        onCancel={() => setView(selectedId ? 'detail' : 'list')} 
        onSuccess={() => setView(selectedId ? 'detail' : 'list')} 
      />
    );
  }

  if (view === 'detail') {
    return (
      <SalesOrderDetail
        id={selectedId}
        onBack={() => setView('list')}
        onEdit={(order) => openEdit(order)}
        onStatusChange={() => {}} // Will refresh on list load
      />
    );
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  // LIST VIEW
  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B5E55]" />
          <input 
            id="search-orders"
            name="search"
            type="text" 
            placeholder="Search orders by number or customer..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] focus:outline-none focus:ring-2 focus:ring-[#B45309] text-sm"
          />
        </div>
        <button 
          onClick={() => { setEditData(null); setView('create'); }}
          className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-[#B45309] hover:bg-[#92400e] text-white text-sm font-bold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          New Order
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 text-red-800 border border-red-200 text-sm">
          {errorMsg}
        </div>
      )}

      {/* List / Table */}
      <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] overflow-hidden shadow-sm flex flex-col">
        {loading ? (
          <div className="p-8 text-center text-[#6B5E55] dark:text-[#A89B91]">Loading orders...</div>
        ) : salesOrders.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-[#FAF6EE] dark:bg-[#2C221E] rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-[#B45309]" />
            </div>
            <h3 className="font-heading font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6] mb-1">No Sales Orders</h3>
            <p className="text-sm text-[#6B5E55] dark:text-[#A89B91] max-w-sm">
              Create your first sales order to start processing customer requests.
            </p>
            <button 
              onClick={() => { setEditData(null); setView('create'); }}
              className="mt-6 px-6 py-2 rounded-full border border-[#B45309] text-[#B45309] text-sm font-semibold hover:bg-[#B45309] hover:text-white transition-all"
            >
              Create Order
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#FAF6EE] dark:bg-[#29211D] text-[#6B5E55] dark:text-[#A89B91]">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Order Number</th>
                    <th className="px-6 py-4 font-semibold">Customer</th>
                    <th className="px-6 py-4 font-semibold">Date</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DFD5] dark:divide-[#382D27]">
                  {salesOrders.map((so) => (
                    <tr 
                      key={so.id} 
                      onClick={() => openDetail(so.id)}
                      className="group hover:bg-[#FAF6EE]/50 dark:hover:bg-[#29211D]/50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <span className="font-bold text-[#2C221E] dark:text-[#F5EFE6]">{so.number}</span>
                      </td>
                      <td className="px-6 py-4 text-[#6B5E55] dark:text-[#A89B91]">
                        {so.customerName}
                      </td>
                      <td className="px-6 py-4 text-[#6B5E55] dark:text-[#A89B91]">
                        {new Date(so.orderDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        {so.status === 'invoiced' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Invoiced
                          </span>
                        ) : so.status === 'confirmed' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Confirmed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          {so.status === 'draft' && (
                            <button
                              onClick={(e) => handleConfirm(so.id, e)}
                              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
                            >
                              Confirm
                            </button>
                          )}
                          <ChevronRight className="w-5 h-5 text-[#9E9085]" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613]">
                <div className="text-xs text-[#6B5E55]">
                  Showing <span className="font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{(page - 1) * pageSize + 1}</span> to <span className="font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{Math.min(page * pageSize, totalCount)}</span> of <span className="font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{totalCount}</span> orders
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] hover:bg-[#FAF6EE] dark:hover:bg-[#2C221E] disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#6B5E55]" />
                  </button>
                  <span className="text-xs font-semibold text-[#2C221E] dark:text-[#F5EFE6] min-w-[32px] text-center">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] hover:bg-[#FAF6EE] dark:hover:bg-[#2C221E] disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-[#6B5E55]" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
