import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Plus, Search, ChevronRight, CheckCircle2, ChevronLeft, LayoutGrid, List, FileCheck2, Send, CreditCard } from 'lucide-react';
import { fetchSalesOrders, confirmSalesOrder } from '../api/salesOrders.js';
import SalesOrderForm from './SalesOrderForm.jsx';
import SalesOrderDetail from './SalesOrderDetail.jsx';

export default function SalesOrdersModule() {
  const [view, setView] = useState('list'); // 'list' | 'create' | 'edit' | 'detail'
  const [displayMode, setDisplayMode] = useState('kanban'); // 'kanban' | 'table'
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Pagination & Search State
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50); // increased for kanban view to show more cards
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

  // Group by status for Kanban view
  const groupedOrders = {
    draft: salesOrders.filter(so => so.status === 'draft'),
    confirmed: salesOrders.filter(so => so.status === 'confirmed'),
    invoiced: salesOrders.filter(so => so.status === 'invoiced')
  };

  // LIST VIEW
  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 shrink-0">
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
        
        <div className="flex items-center gap-2">
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
              title="Kanban View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button 
            onClick={() => { setEditData(null); setView('create'); }}
            className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-[#B45309] hover:bg-[#92400e] text-white text-sm font-bold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            New Order
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 text-red-800 border border-red-200 text-sm shrink-0">
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-[#6B5E55] dark:text-[#A89B91] flex-1">Loading orders...</div>
      ) : salesOrders.length === 0 ? (
        <div className="p-12 flex flex-col items-center justify-center text-center bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] flex-1">
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
      ) : displayMode === 'kanban' ? (
        /* KANBAN VIEW */
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1 items-start min-h-[500px]">
          {/* Column: Draft */}
          <div className="w-80 shrink-0 bg-[#FAF6EE]/50 dark:bg-[#1C1613]/50 rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] flex flex-col h-full max-h-full">
            <div className="p-4 border-b border-[#E6DFD5]/50 dark:border-[#382D27] flex items-center justify-between sticky top-0 bg-[#FAF6EE]/90 dark:bg-[#1C1613]/90 backdrop-blur-sm rounded-t-2xl z-10">
              <h3 className="font-heading font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6] flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                Quotation / Draft
              </h3>
              <span className="text-[10px] font-bold bg-[#E6DFD5] dark:bg-[#382D27] text-[#6B5E55] px-2 py-0.5 rounded-full">{groupedOrders.draft.length}</span>
            </div>
            <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
              {groupedOrders.draft.map(so => (
                <div key={so.id} onClick={() => openDetail(so.id)} className="bg-white dark:bg-[#29211D] p-4 rounded-xl border border-[#E6DFD5] dark:border-[#382D27] shadow-sm hover:shadow-md hover:border-[#B45309]/50 transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6] group-hover:text-[#B45309] transition-colors">{so.number}</span>
                  </div>
                  <div className="text-xs text-[#6B5E55] dark:text-[#A89B91] mb-3 line-clamp-1">{so.customerName}</div>
                  <div className="flex items-center justify-between border-t border-[#E6DFD5]/60 dark:border-[#382D27] pt-2">
                    <span className="text-[10px] font-mono text-[#A89B91]">{new Date(so.orderDate).toLocaleDateString()}</span>
                    <button onClick={(e) => handleConfirm(so.id, e)} className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-900/20 opacity-0 group-hover:opacity-100 transition-opacity">
                      Confirm
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column: Confirmed */}
          <div className="w-80 shrink-0 bg-[#FAF6EE]/50 dark:bg-[#1C1613]/50 rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] flex flex-col h-full max-h-full">
            <div className="p-4 border-b border-[#E6DFD5]/50 dark:border-[#382D27] flex items-center justify-between sticky top-0 bg-[#FAF6EE]/90 dark:bg-[#1C1613]/90 backdrop-blur-sm rounded-t-2xl z-10">
              <h3 className="font-heading font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6] flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-500" />
                Sales Order
              </h3>
              <span className="text-[10px] font-bold bg-[#E6DFD5] dark:bg-[#382D27] text-[#6B5E55] px-2 py-0.5 rounded-full">{groupedOrders.confirmed.length}</span>
            </div>
            <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
              {groupedOrders.confirmed.map(so => (
                <div key={so.id} onClick={() => openDetail(so.id)} className="bg-white dark:bg-[#29211D] p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6] group-hover:text-blue-600 transition-colors">{so.number}</span>
                  </div>
                  <div className="text-xs text-[#6B5E55] dark:text-[#A89B91] mb-3 line-clamp-1">{so.customerName}</div>
                  <div className="flex items-center justify-between border-t border-[#E6DFD5]/60 dark:border-[#382D27] pt-2">
                    <span className="text-[10px] font-mono text-[#A89B91]">{new Date(so.orderDate).toLocaleDateString()}</span>
                    <span className="text-[10px] font-bold text-blue-600">To Invoice</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column: Invoiced */}
          <div className="w-80 shrink-0 bg-[#FAF6EE]/50 dark:bg-[#1C1613]/50 rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] flex flex-col h-full max-h-full">
            <div className="p-4 border-b border-[#E6DFD5]/50 dark:border-[#382D27] flex items-center justify-between sticky top-0 bg-[#FAF6EE]/90 dark:bg-[#1C1613]/90 backdrop-blur-sm rounded-t-2xl z-10">
              <h3 className="font-heading font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6] flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                Invoiced
              </h3>
              <span className="text-[10px] font-bold bg-[#E6DFD5] dark:bg-[#382D27] text-[#6B5E55] px-2 py-0.5 rounded-full">{groupedOrders.invoiced.length}</span>
            </div>
            <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
              {groupedOrders.invoiced.map(so => (
                <div key={so.id} onClick={() => openDetail(so.id)} className="bg-white dark:bg-[#29211D] p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6] group-hover:text-emerald-600 transition-colors">{so.number}</span>
                  </div>
                  <div className="text-xs text-[#6B5E55] dark:text-[#A89B91] mb-3 line-clamp-1">{so.customerName}</div>
                  <div className="flex items-center justify-between border-t border-[#E6DFD5]/60 dark:border-[#382D27] pt-2">
                    <span className="text-[10px] font-mono text-[#A89B91]">{new Date(so.orderDate).toLocaleDateString()}</span>
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Done</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] overflow-hidden shadow-sm flex flex-col flex-1">
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
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Invoiced
                        </span>
                      ) : so.status === 'confirmed' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold">
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
        </div>
      )}
    </div>
  );
}
