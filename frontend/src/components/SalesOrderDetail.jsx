import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, FileText, Calendar, User, IndianRupee } from 'lucide-react';
import { fetchSalesOrderById, confirmSalesOrder, invoiceSalesOrder } from '../api/salesOrders.js';

export default function SalesOrderDetail({ id, onBack, onEdit, onStatusChange }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [invoicing, setInvoicing] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    setLoading(true);
    try {
      const res = await fetchSalesOrderById(id);
      setOrder(res);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load Sales Order details');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const updated = await confirmSalesOrder(id);
      setOrder(updated);
      if (onStatusChange) onStatusChange();
    } catch (err) {
      alert(err.message || 'Failed to confirm order');
    } finally {
      setConfirming(false);
    }
  };

  const handleInvoice = async () => {
    setInvoicing(true);
    try {
      const updated = await invoiceSalesOrder(id);
      setOrder(updated);
      if (onStatusChange) onStatusChange();
    } catch (err) {
      alert(err.message || 'Failed to create invoice from sales order');
    } finally {
      setInvoicing(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-[#6B5E55]">Loading details...</div>;
  }

  if (errorMsg || !order) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="text-red-600">{errorMsg || 'Order not found'}</div>
        <button onClick={onBack} className="text-[#B45309] font-bold hover:underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] shadow-sm overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 border-b border-[#E6DFD5] dark:border-[#382D27] gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 rounded-lg hover:bg-[#FAF6EE] dark:hover:bg-[#2C221E] text-[#6B5E55] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-heading font-bold text-xl text-[#2C221E] dark:text-[#F5EFE6]">
              {order.number}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              {order.status === 'invoiced' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Invoiced
                </span>
              ) : order.status === 'confirmed' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Confirmed
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                  Draft
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {order.status === 'draft' && (
            <>
              <button 
                onClick={() => onEdit(order)}
                className="px-4 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] text-slate-700 dark:text-slate-300 font-semibold hover:bg-[#FAF6EE] dark:hover:bg-[#2C221E] transition-colors text-sm"
              >
                Edit Order
              </button>
              <button 
                onClick={handleConfirm}
                disabled={confirming}
                className="flex items-center justify-center gap-2 px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {confirming ? 'Confirming...' : 'Confirm Order'}
              </button>
            </>
          )}

          {order.status === 'confirmed' && (
            <button 
              onClick={handleInvoice}
              disabled={invoicing}
              className="flex items-center justify-center gap-2 px-6 py-2 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-sm font-bold shadow-sm transition-all disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              {invoicing ? 'Creating Invoice...' : 'Create Invoice / Mark as Invoiced'}
            </button>
          )}

          {order.status === 'invoiced' && order.invoiceId && (
            <button 
              onClick={() => {
                // Find and click the Bills & Invoices tab to redirect
                const spans = Array.from(document.querySelectorAll('button span'));
                const targetSpan = spans.find(s => s.textContent === 'Bills & Invoices');
                if (targetSpan && targetSpan.parentElement) {
                  targetSpan.parentElement.click();
                  
                  // Dispatch event for BillsInvoicesModule to catch and open the exact invoice
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('OPEN_BILL_INVOICE', {
                      detail: { type: 'invoices', id: order.invoiceId }
                    }));
                  }, 50);
                } else {
                  alert('Navigate to Bills & Invoices to view this document.');
                }
              }}
              className="flex items-center justify-center gap-2 px-6 py-2 rounded-lg bg-[#714B67] hover:bg-[#5a3b52] text-white text-sm font-bold shadow-sm transition-all"
            >
              <FileText className="w-4 h-4" />
              View Generated Invoice
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#6B5E55] dark:text-[#A89B91] uppercase tracking-wider">Customer Details</h3>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-[#FAF6EE] dark:bg-[#29211D] border border-[#E6DFD5] dark:border-[#382D27]">
              <div className="p-2 rounded-lg bg-white dark:bg-[#1C1613] text-[#B45309]">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-[#2C221E] dark:text-[#F5EFE6] text-base">{order.customerName}</div>
                <div className="text-sm text-[#6B5E55] dark:text-[#A89B91] mt-0.5">ID: {order.customerId}</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#6B5E55] dark:text-[#A89B91] uppercase tracking-wider">Order Info</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col p-4 rounded-xl bg-[#FAF6EE] dark:bg-[#29211D] border border-[#E6DFD5] dark:border-[#382D27]">
                <span className="text-xs text-[#6B5E55] dark:text-[#A89B91] font-semibold mb-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Order Date</span>
                <span className="font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{new Date(order.orderDate).toLocaleDateString()}</span>
              </div>
              <div className="flex flex-col p-4 rounded-xl bg-[#FAF6EE] dark:bg-[#29211D] border border-[#E6DFD5] dark:border-[#382D27]">
                <span className="text-xs text-[#6B5E55] dark:text-[#A89B91] font-semibold mb-1 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Created</span>
                <span className="font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lines */}
        <div className="space-y-4">
          <h3 className="font-heading font-bold text-[#2C221E] dark:text-[#F5EFE6] border-b border-[#E6DFD5] dark:border-[#382D27] pb-2">
            Order Lines
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#FAF6EE] dark:bg-[#29211D] text-[#6B5E55] dark:text-[#A89B91]">
                <tr>
                  <th className="px-4 py-3 font-semibold rounded-tl-lg">Product</th>
                  <th className="px-4 py-3 font-semibold text-right">Quantity</th>
                  <th className="px-4 py-3 font-semibold text-right">Unit Price</th>
                  <th className="px-4 py-3 font-semibold text-right">Taxes</th>
                  <th className="px-4 py-3 font-semibold text-right rounded-tr-lg">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DFD5] dark:divide-[#382D27]">
                {order.lines.map((line) => (
                  <tr key={line.id} className="hover:bg-[#FAF6EE]/30 dark:hover:bg-[#29211D]/30 transition-colors">
                    <td className="px-4 py-4 font-medium text-[#2C221E] dark:text-[#F5EFE6]">{line.productName}</td>
                    <td className="px-4 py-4 text-right">{line.quantity}</td>
                    <td className="px-4 py-4 text-right">₹{line.unitPrice.toFixed(2)}</td>
                    <td className="px-4 py-4 text-right text-[#6B5E55]">
                      {line.taxRatePercent ? `${line.taxRatePercent}%` : '-'}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-[#2C221E] dark:text-[#F5EFE6]">
                      ₹{line.subtotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals Section */}
        <div className="flex justify-end pt-8">
          <div className="w-full sm:w-64 space-y-3 text-sm bg-[#FAF6EE] dark:bg-[#29211D] p-5 rounded-xl border border-[#E6DFD5] dark:border-[#382D27]">
            <div className="flex justify-between text-[#6B5E55] dark:text-[#A89B91]">
              <span>Untaxed Amount:</span>
              <span className="font-medium text-[#2C221E] dark:text-[#F5EFE6]">
                ₹{order.untaxedTotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-[#6B5E55] dark:text-[#A89B91]">
              <span>Taxes:</span>
              <span className="font-medium text-[#2C221E] dark:text-[#F5EFE6]">
                ₹{order.totalTax.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-[#B45309] dark:text-[#F3A358] pt-3 border-t border-[#E6DFD5] dark:border-[#382D27]">
              <span>Total:</span>
              <span className="flex items-center gap-1">₹{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
