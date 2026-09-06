import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { FileText, Search, CheckCircle, Clock, AlertCircle, ShieldAlert, Eye, DollarSign } from 'lucide-react';

export default function CustomerBillsModule() {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBill, setSelectedBill] = useState(null);

  useEffect(() => {
    fetchMyBills();
  }, []);

  const fetchMyBills = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('GET', '/customer-invoices/my-bills');
      setBills(data.items || []);
    } catch (err) {
      console.error('Failed to load customer bills:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredBills = bills.filter(b => {
    const matchesSearch = search === '' || 
      b.number?.toLowerCase().includes(search.toLowerCase()) ||
      b.customerName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === '' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalUnpaid = bills.filter(b => b.status !== 'paid').reduce((sum, b) => sum + (b.balanceDue || (b.totalAmount - b.amountPaid)), 0);
  const totalPaid = bills.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.totalAmount, 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle className="w-3 h-3 text-emerald-600" /> Fully Paid
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300">
            <Clock className="w-3 h-3 text-amber-600" /> Partially Paid
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/60 dark:text-red-300">
            <AlertCircle className="w-3 h-3 text-red-600" /> Overdue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-yellow-50 text-yellow-800 border border-yellow-200 dark:bg-yellow-950/60 dark:text-yellow-300">
            <Clock className="w-3 h-3 text-yellow-600" /> Unpaid
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-xl text-[#2C221E] dark:text-[#F5EFE6] flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#B45309]" />
            <span>My Bills & Invoices</span>
          </h2>
          <p className="text-xs text-[#6B5E55] dark:text-[#A89B91]">
            View your customer invoices, payment statuses, and balance breakdown
          </p>
        </div>

        <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300">
          Customer Portal Logged In: {user?.email}
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] shadow-xs space-y-1">
          <span className="text-xs text-[#6B5E55] dark:text-[#A89B91]">Total Customer Invoices</span>
          <div className="text-2xl font-bold font-heading text-[#2C221E] dark:text-[#F5EFE6]">
            {bills.length}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/30 shadow-xs space-y-1">
          <span className="text-xs text-amber-800 dark:text-amber-300 font-semibold">Total Outstanding Balance</span>
          <div className="text-2xl font-bold font-heading text-amber-900 dark:text-amber-200">
            ₹{totalUnpaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-xs space-y-1">
          <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">Total Cleared / Paid</span>
          <div className="text-2xl font-bold font-heading text-emerald-900 dark:text-emerald-200">
            ₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#9E9085]" />
          <input
            type="text"
            placeholder="Search by Bill Number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg text-xs border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] text-[#2C221E] dark:text-[#F5EFE6] focus:outline-none focus:ring-2 focus:ring-[#B45309]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer border ${
              statusFilter === '' ? 'bg-[#B45309] text-white border-[#B45309]' : 'bg-white dark:bg-[#1C1613] border-[#E6DFD5] dark:border-[#382D27] text-[#6B5E55]'
            }`}
          >
            All Bills
          </button>
          <button
            onClick={() => setStatusFilter('unpaid')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer border ${
              statusFilter === 'unpaid' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white dark:bg-[#1C1613] border-[#E6DFD5] dark:border-[#382D27] text-[#6B5E55]'
            }`}
          >
            Unpaid
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer border ${
              statusFilter === 'paid' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-[#1C1613] border-[#E6DFD5] dark:border-[#382D27] text-[#6B5E55]'
            }`}
          >
            Paid
          </button>
        </div>
      </div>

      {/* Bills Table */}
      {loading ? (
        <div className="p-8 text-center text-xs text-[#6B5E55] dark:text-[#A89B91]">
          Loading your bills & invoices...
        </div>
      ) : filteredBills.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-[#E6DFD5] dark:border-[#382D27] rounded-xl bg-white dark:bg-[#1C1613] text-xs text-[#6B5E55] dark:text-[#A89B91] space-y-1">
          <FileText className="w-8 h-8 mx-auto text-amber-600 opacity-60" />
          <p className="font-semibold text-sm text-[#2C221E] dark:text-[#F5EFE6]">No Customer Bills Found</p>
          <p>You have no bills matching the current search filter.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1C1613] rounded-xl border border-[#E6DFD5] dark:border-[#382D27] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#FAF6EE] dark:bg-[#29211D] text-[#6B5E55] dark:text-[#A89B91] font-semibold border-b border-[#E6DFD5] dark:border-[#382D27]">
                <tr>
                  <th className="p-3.5">Bill Number</th>
                  <th className="p-3.5">Linked Order</th>
                  <th className="p-3.5">Invoice Date</th>
                  <th className="p-3.5">Due Date</th>
                  <th className="p-3.5 text-right">Total Amount</th>
                  <th className="p-3.5 text-right">Amount Paid</th>
                  <th className="p-3.5 text-right">Balance Due</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DFD5]/60 dark:divide-[#382D27]">
                {filteredBills.map(bill => (
                  <tr key={bill.id} className="hover:bg-[#FAF6EE]/50 dark:hover:bg-[#29211D]/40 transition-colors">
                    <td className="p-3.5 font-bold text-[#B45309] dark:text-amber-400">
                      {bill.number}
                    </td>
                    <td className="p-3.5 font-medium text-[#6B5E55] dark:text-[#A89B91]">
                      {bill.salesOrderNumber || 'Direct Invoice'}
                    </td>
                    <td className="p-3.5 text-[#6B5E55] dark:text-[#A89B91]">
                      {bill.invoiceDate}
                    </td>
                    <td className="p-3.5 text-[#6B5E55] dark:text-[#A89B91]">
                      {bill.dueDate}
                    </td>
                    <td className="p-3.5 text-right font-semibold text-[#2C221E] dark:text-[#F5EFE6]">
                      ₹{bill.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3.5 text-right font-medium text-emerald-700 dark:text-emerald-400">
                      ₹{bill.amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3.5 text-right font-bold text-amber-800 dark:text-amber-300">
                      ₹{(bill.balanceDue || (bill.totalAmount - bill.amountPaid)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3.5 text-center">
                      {getStatusBadge(bill.status)}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedBill(bill)}
                        className="px-2.5 py-1 rounded-md bg-[#FAF6EE] dark:bg-[#29211D] text-[#B45309] border border-[#E6DFD5] dark:border-[#382D27] hover:bg-[#B45309] hover:text-white transition-all text-xs font-semibold flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bill Detail Modal */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6DFD5] dark:border-[#382D27] pb-3">
              <div>
                <h3 className="font-heading font-bold text-base text-[#2C221E] dark:text-[#F5EFE6]">
                  Invoice {selectedBill.number}
                </h3>
                <p className="text-xs text-[#6B5E55] dark:text-[#A89B91]">
                  Issued to: {selectedBill.customerName} ({selectedBill.customerEmail || 'Customer'})
                </p>
              </div>
              <button onClick={() => setSelectedBill(null)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs p-3 rounded-xl bg-[#FAF6EE] dark:bg-[#29211D]">
              <div>
                <span className="text-[#6B5E55] dark:text-[#A89B91]">Invoice Date:</span>
                <div className="font-semibold">{selectedBill.invoiceDate}</div>
              </div>
              <div>
                <span className="text-[#6B5E55] dark:text-[#A89B91]">Due Date:</span>
                <div className="font-semibold">{selectedBill.dueDate}</div>
              </div>
              <div>
                <span className="text-[#6B5E55] dark:text-[#A89B91]">Linked Sales Order:</span>
                <div className="font-semibold text-[#B45309]">{selectedBill.salesOrderNumber || 'N/A'}</div>
              </div>
              <div>
                <span className="text-[#6B5E55] dark:text-[#A89B91]">Current Status:</span>
                <div className="mt-0.5">{getStatusBadge(selectedBill.status)}</div>
              </div>
              <div className="col-span-2">
                <span className="text-[#6B5E55] dark:text-[#A89B91]">Balance Due:</span>
                <div className="font-bold text-amber-800 dark:text-amber-300">
                  ₹{(selectedBill.balanceDue || (selectedBill.totalAmount - selectedBill.amountPaid)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Invoice Line Items */}
            {selectedBill.lines && selectedBill.lines.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[#6B5E55] dark:text-[#A89B91]">Purchased Items & Line Details:</span>
                <div className="border border-[#E6DFD5] dark:border-[#382D27] rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#FAF6EE] dark:bg-[#29211D] text-[#6B5E55] font-semibold">
                      <tr>
                        <th className="p-2">Item</th>
                        <th className="p-2 text-center">Qty</th>
                        <th className="p-2 text-right">Price</th>
                        <th className="p-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6DFD5]/60">
                      {selectedBill.lines.map((line, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-medium">{line.productName}</td>
                          <td className="p-2 text-center">{line.quantity}</td>
                          <td className="p-2 text-right">₹{line.unitPrice.toLocaleString('en-IN')}</td>
                          <td className="p-2 text-right font-semibold">₹{line.total.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedBill(null)}
                className="px-4 py-2 bg-[#B45309] text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-[#92400E]"
              >
                Close Bill Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
