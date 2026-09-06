import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client.js';
import { FileText, ReceiptText, Search, X, Plus, Calendar, DollarSign, User, Briefcase, FileCheck2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const money = value => Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });

export default function BillsInvoicesModule() {
  const { user } = useAuth();
  const [tab, setTab] = useState('bills');
  const [bills, setBills] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    Promise.all([loadBills(), loadInvoices()]).finally(() => setLoading(false));

    const handleOpenEvent = async (e) => {
      const { type, id } = e.detail;
      setTab(type);
      setLoadingDetail(true);
      setSelected({ id });
      try {
        const fullDetail = await apiRequest('GET', `/${type === 'bills' ? 'vendor-bills' : 'customer-invoices'}/${id}`);
        setSelected(fullDetail);
      } catch (err) {
        setError(err.message);
        setSelected(null);
      }
      setLoadingDetail(false);
    };

    window.addEventListener('OPEN_BILL_INVOICE', handleOpenEvent);
    return () => window.removeEventListener('OPEN_BILL_INVOICE', handleOpenEvent);
  }, []);

  async function loadBills() {
    try {
      const data = await apiRequest('GET', '/vendor-bills?page=1&limit=100');
      setBills(data.items || []);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadInvoices() {
    try {
      const data = await apiRequest('GET', '/customer-invoices?page=1&limit=100');
      setInvoices(data.items || []);
    } catch (err) {
      setError(err.message);
    }
  }

  const records = (tab === 'bills' ? bills : invoices).filter(record => {
    const term = search.toLowerCase();
    return !term || record.number?.toLowerCase().includes(term) ||
      (record.vendorName || record.customerName || '').toLowerCase().includes(term);
  });

  async function openRecord(record) {
    setLoadingDetail(true);
    setSelected(record);
    if (tab === 'bills') {
      try {
        const fullDetail = await apiRequest('GET', `/vendor-bills/${record.id}`);
        setSelected(fullDetail);
      } catch (err) {
        setError(err.message);
      }
    } else {
      try {
        const fullDetail = await apiRequest('GET', `/customer-invoices/${record.id}`);
        setSelected(fullDetail);
      } catch (err) {
        setError(err.message);
      }
    }
    setLoadingDetail(false);
  }

  // Summary stats
  const totalBillsAmount = bills.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
  const totalInvoicesAmount = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
  const totalBillsDue = bills.reduce((sum, b) => sum + Number(b.amountDue || (b.totalAmount - b.amountPaid) || 0), 0);
  const totalInvoicesDue = invoices.reduce((sum, inv) => sum + Number(inv.amountDue || inv.balanceDue || (inv.totalAmount - inv.amountPaid) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
        <div>
          <h2 className="font-heading font-bold text-2xl text-[#2C221E] dark:text-[#F5EFE6] flex items-center gap-2">
            <ReceiptText className="w-6 h-6 text-[#B45309]" />
            Bills & Invoices
          </h2>
          <p className="text-sm text-[#6B5E55] dark:text-[#A89B91] mt-1">A unified view of your payables and receivables.</p>
        </div>

        {/* Generate New Buttons */}
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => {
              // Note: For a fully integrated solution, these could open their respective creation modals.
              // We dispatch a custom event to navigate or just alert if navigation isn't plumbed.
              const tabId = 'vendor-bills';
              const navBtn = document.querySelector(`button span`, Array.from(document.querySelectorAll('button span')).find(s => s.textContent === 'Vendor Bills'));
              if(navBtn) navBtn.click();
              else alert('Navigate to Vendor Bills to create a new bill');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#FAF6EE] dark:bg-[#29211D] border border-[#B45309] text-[#B45309] rounded-xl hover:bg-[#B45309] hover:text-white transition-colors text-sm font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Vendor Bill
          </button>
          <button 
            onClick={() => {
              const tabId = 'sales-orders';
              const navBtn = document.querySelector(`button span`, Array.from(document.querySelectorAll('button span')).find(s => s.textContent === 'Sales Orders'));
              if(navBtn) navBtn.click();
              else alert('Navigate to Sales Orders to create a new invoice');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#FAF6EE] dark:bg-[#29211D] border border-[#714B67] text-[#714B67] rounded-xl hover:bg-[#714B67] hover:text-white transition-colors text-sm font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Sales Invoice
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#6B5E55] dark:text-[#A89B91] font-semibold">Total Vendor Bills</div>
            <div className="font-heading font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6]">₹{money(totalBillsAmount)}</div>
            <div className="text-[10px] text-amber-600 font-medium">₹{money(totalBillsDue)} pending</div>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600">
            <ReceiptText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[#6B5E55] dark:text-[#A89B91] font-semibold">Total Sales Invoices</div>
            <div className="font-heading font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6]">₹{money(totalInvoicesAmount)}</div>
            <div className="text-[10px] text-purple-600 font-medium">₹{money(totalInvoicesDue)} outstanding</div>
          </div>
        </div>
      </div>

      {error && <div className="p-4 rounded-xl bg-red-50 text-red-800 border border-red-200 text-sm flex items-center gap-2"><X className="w-4 h-4 cursor-pointer" onClick={() => setError(null)} /> {error}</div>}

      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center bg-white dark:bg-[#1C1613] p-2 rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] shadow-sm">
        <div className="flex p-1 bg-[#FAF6EE] dark:bg-[#29211D] rounded-xl">
          <button onClick={() => setTab('bills')} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'bills' ? 'bg-white dark:bg-[#1C1613] text-[#B45309] shadow-sm' : 'text-[#6B5E55] dark:text-[#A89B91] hover:text-[#2C221E]'}`}>
            <FileText className="w-4 h-4" /> Vendor Bills
            <span className="bg-[#E6DFD5] dark:bg-[#382D27] text-[10px] px-2 py-0.5 rounded-full">{bills.length}</span>
          </button>
          <button onClick={() => setTab('invoices')} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'invoices' ? 'bg-white dark:bg-[#1C1613] text-[#714B67] shadow-sm' : 'text-[#6B5E55] dark:text-[#A89B91] hover:text-[#2C221E]'}`}>
            <ReceiptText className="w-4 h-4" /> Sales Invoices
            <span className="bg-[#E6DFD5] dark:bg-[#382D27] text-[10px] px-2 py-0.5 rounded-full">{invoices.length}</span>
          </button>
        </div>
        <div className="relative flex-1 max-w-md ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9085]" />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder={`Search ${tab === 'bills' ? 'vendor bills' : 'sales invoices'}...`} className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-sm focus:outline-none focus:ring-2 focus:ring-[#B45309]" />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-sm text-[#6B5E55]">
          <div className="w-8 h-8 border-4 border-[#B45309] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          Loading financial documents...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {records.map(record => {
            const isBill = tab === 'bills';
            const partner = record.vendorName || record.customerName || 'Partner';
            const amountDue = record.amountDue ?? record.balanceDue ?? (record.totalAmount - record.amountPaid);
            
            return (
              <div 
                key={record.id} 
                onClick={() => openRecord(record)} 
                className="group flex flex-col p-5 rounded-2xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] shadow-sm hover:shadow-md hover:border-[#B45309] transition-all cursor-pointer relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rounded-full opacity-10 ${isBill ? 'bg-amber-500' : 'bg-purple-500'}`}></div>
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-heading font-bold text-base text-[#2C221E] dark:text-[#F5EFE6] group-hover:text-[#B45309] transition-colors">
                      {record.number}
                    </h3>
                    <p className="text-xs text-[#6B5E55] dark:text-[#A89B91] flex items-center gap-1 mt-1">
                      <Briefcase className="w-3 h-3" /> {partner}
                    </p>
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border ${record.status === 'paid' || record.status === 'posted' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {record.status}
                  </span>
                </div>
                
                <div className="mt-auto space-y-2">
                  <div className="flex justify-between text-xs items-center p-2 bg-[#FAF6EE] dark:bg-[#29211D] rounded-lg">
                    <span className="text-[#6B5E55] flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Due</span>
                    <strong className="text-[#2C221E] dark:text-[#F5EFE6]">{new Date(record.dueDate).toLocaleDateString()}</strong>
                  </div>
                  <div className="flex justify-between items-end pt-2 border-t border-[#E6DFD5] dark:border-[#382D27]">
                    <div>
                      <div className="text-[10px] text-[#6B5E55] uppercase tracking-wider font-semibold">Total</div>
                      <div className="font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6]">₹{money(record.totalAmount)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-amber-600 uppercase tracking-wider font-semibold">Balance Due</div>
                      <div className="font-bold text-sm text-amber-600">₹{money(amountDue)}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {!records.length && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-center bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] border-dashed">
              <div className="w-16 h-16 bg-[#FAF6EE] dark:bg-[#29211D] rounded-full flex items-center justify-center mb-4 text-[#B45309]/50">
                {tab === 'bills' ? <FileText className="w-8 h-8" /> : <ReceiptText className="w-8 h-8" />}
              </div>
              <h3 className="font-heading font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6]">No {tab === 'bills' ? 'vendor bills' : 'sales invoices'} found</h3>
              <p className="text-sm text-[#6B5E55] dark:text-[#A89B91] mt-1 max-w-sm">
                Try adjusting your search criteria or create a new document to get started.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Full Document View Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1C1613] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl text-white shadow-inner ${tab === 'bills' ? 'bg-gradient-to-br from-amber-500 to-amber-700' : 'bg-gradient-to-br from-purple-500 to-purple-700'}`}>
                  {tab === 'bills' ? <FileText className="w-6 h-6" /> : <ReceiptText className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="font-heading font-bold text-2xl text-[#2C221E] dark:text-[#F5EFE6] leading-none">
                    {selected.number || 'Loading...'}
                  </h3>
                  <p className="text-sm text-[#6B5E55] dark:text-[#A89B91] mt-1 font-medium">
                    {tab === 'bills' ? 'Vendor Bill' : 'Customer Invoice'} 
                    {selected.status && ` • ${selected.status.toUpperCase()}`}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 bg-white dark:bg-[#1C1613] rounded-full text-[#6B5E55] hover:text-[#B45309] shadow-sm transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
              {loadingDetail ? (
                <div className="py-20 text-center text-sm text-[#6B5E55]">
                  <div className="w-8 h-8 border-4 border-[#B45309] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  Loading document details...
                </div>
              ) : (
                <div className="space-y-8">
                  
                  {/* Top info grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-[#6B5E55] uppercase tracking-wider">{tab === 'bills' ? 'Vendor Information' : 'Customer Information'}</h4>
                      <div className="p-4 rounded-xl border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] flex items-start gap-3 shadow-sm">
                        <div className="p-2 bg-[#FAF6EE] dark:bg-[#29211D] rounded-lg text-[#B45309]">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-[#2C221E] dark:text-[#F5EFE6] text-base">{selected.vendorName || selected.customerName || 'Partner Name'}</div>
                          <div className="text-sm text-[#6B5E55] mt-0.5">{selected.vendorEmail || selected.customerEmail || 'No email provided'}</div>
                          {selected.purchaseOrderNumber && (
                            <div className="mt-2 text-xs inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-md border border-amber-200">
                              <FileCheck2 className="w-3 h-3" /> PO: {selected.purchaseOrderNumber}
                            </div>
                          )}
                          {selected.salesOrderNumber && (
                            <div className="mt-2 text-xs inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded-md border border-purple-200">
                              <FileCheck2 className="w-3 h-3" /> SO: {selected.salesOrderNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-[#6B5E55] uppercase tracking-wider">Document Details</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]">
                          <div className="text-xs text-[#6B5E55] font-semibold mb-1 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Issue Date</div>
                          <div className="font-bold text-[#2C221E] dark:text-[#F5EFE6]">{new Date(selected.invoiceDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</div>
                        </div>
                        <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10">
                          <div className="text-xs text-red-600 font-semibold mb-1 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Due Date</div>
                          <div className="font-bold text-red-700 dark:text-red-400">{new Date(selected.dueDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Line Items */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-[#6B5E55] uppercase tracking-wider">Line Items</h4>
                    <div className="border border-[#E6DFD5] dark:border-[#382D27] rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-[#FAF6EE] dark:bg-[#29211D] border-b border-[#E6DFD5] dark:border-[#382D27]">
                          <tr>
                            <th className="p-4 font-semibold text-[#6B5E55] dark:text-[#A89B91]">Description</th>
                            <th className="p-4 font-semibold text-[#6B5E55] dark:text-[#A89B91] text-right w-24">Qty</th>
                            <th className="p-4 font-semibold text-[#6B5E55] dark:text-[#A89B91] text-right w-32">Unit Price</th>
                            <th className="p-4 font-semibold text-[#6B5E55] dark:text-[#A89B91] text-right w-32">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E6DFD5] dark:divide-[#382D27] bg-white dark:bg-[#1C1613]">
                          {(selected.lines || []).length > 0 ? (
                            selected.lines.map((line) => (
                              <tr key={line.id} className="hover:bg-[#FAF6EE]/50 dark:hover:bg-[#29211D]/50 transition-colors">
                                <td className="p-4">
                                  <div className="font-medium text-[#2C221E] dark:text-[#F5EFE6]">{line.productName || 'Custom Item'}</div>
                                  {line.accountName && <div className="text-xs text-[#6B5E55] mt-1">{line.accountName}</div>}
                                </td>
                                <td className="p-4 text-right text-[#6B5E55]">{line.quantity}</td>
                                <td className="p-4 text-right text-[#6B5E55]">₹{money(line.unitPrice)}</td>
                                <td className="p-4 text-right font-semibold text-[#2C221E] dark:text-[#F5EFE6]">₹{money(line.total)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="p-8 text-center text-[#6B5E55] italic">No line items found for this document.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Totals & Payment Summary */}
                  <div className="flex flex-col md:flex-row justify-between gap-6 items-start">
                    <div className="w-full md:w-1/2 p-4 rounded-xl border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]">
                      <h4 className="text-xs font-bold text-[#6B5E55] uppercase tracking-wider mb-3">Payment Info</h4>
                      {selected.journalEntryId ? (
                        <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold mb-2">
                          <FileCheck2 className="w-4 h-4" /> Posted to Ledger (JE: {selected.journalEntryId.substring(0,8)}...)
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-amber-600 font-semibold mb-2">
                          Not posted to ledger
                        </div>
                      )}
                      {selected.billReference && (
                        <div className="text-sm mt-3 pt-3 border-t border-[#E6DFD5] dark:border-[#382D27]">
                          <span className="text-[#6B5E55] font-semibold">Reference:</span> {selected.billReference}
                        </div>
                      )}
                    </div>

                    <div className="w-full md:w-80 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[#6B5E55] font-semibold">Subtotal / Total Amount</span>
                        <span className="font-bold text-[#2C221E] dark:text-[#F5EFE6]">₹{money(selected.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[#6B5E55] font-semibold">Amount Paid</span>
                        <span className="font-bold text-emerald-600">- ₹{money(selected.amountPaid)}</span>
                      </div>
                      <div className="flex justify-between items-center text-lg pt-3 border-t-2 border-[#E6DFD5] dark:border-[#382D27]">
                        <span className="font-bold text-[#2C221E] dark:text-[#F5EFE6]">Balance Due</span>
                        <span className="font-black text-amber-600">₹{money(selected.amountDue ?? selected.balanceDue ?? (selected.totalAmount - selected.amountPaid))}</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] flex justify-end gap-3 rounded-b-2xl">
              <button 
                onClick={() => setSelected(null)}
                className="px-6 py-2.5 rounded-xl border border-[#E6DFD5] dark:border-[#382D27] text-[#6B5E55] font-semibold hover:bg-[#FAF6EE] dark:hover:bg-[#2C221E] transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
