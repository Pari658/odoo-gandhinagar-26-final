import React, { useState } from 'react';
import { apiRequest } from '../api/client.js';
import { DollarSign, CheckCircle, AlertCircle } from 'lucide-react';

export default function PaymentModal({ document, type = 'outbound', onClose, onSuccess }) {
  if (!document) return null;

  const initialAmountDue = Number(
    document.amountDue !== undefined
      ? document.amountDue
      : (Number(document.totalAmount || 0) - Number(document.amountPaid || 0))
  );

  const [paymentData, setPaymentData] = useState({
    amount: initialAmountDue > 0 ? initialAmountDue.toFixed(2) : '0.00',
    method: 'bank',
    paymentDate: new Date().toISOString().split('T')[0],
    note: `Payment for ${type === 'outbound' ? (document.billNumber || document.number || 'Bill') : (document.invoiceNumber || document.number || 'Invoice')}`
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRegisterPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // 1. Create Draft Payment
      const paymentPayload = {
        direction: type,
        partnerId: type === 'outbound' ? document.vendorId : document.customerId,
        amount: Number(paymentData.amount),
        method: paymentData.method,
        paymentDate: paymentData.paymentDate,
        note: paymentData.note
      };

      if (type === 'outbound') {
        paymentPayload.vendorBillId = document.id;
      } else {
        paymentPayload.customerInvoiceId = document.id;
      }

      const createdPayment = await apiRequest('POST', '/payments', paymentPayload);

      // 2. Automatically confirm the payment to post ledger entries & update bill status to paid / partially_paid
      if (createdPayment && createdPayment.id) {
        await apiRequest('POST', `/payments/${createdPayment.id}/confirm`);
      }

      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 max-w-md w-full shadow-xl space-y-4">
        <h3 className="font-heading font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6] flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-[#B45309]" />
          Register {type === 'outbound' ? 'Outgoing' : 'Incoming'} Payment
        </h3>
        
        <div className="bg-[#FAF6EE] dark:bg-[#29211D] p-3 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] text-xs">
          <div className="flex justify-between mb-1">
            <span className="text-[#6B5E55]">{type === 'outbound' ? 'Vendor' : 'Customer'}</span>
            <span className="font-semibold text-[#2C221E] dark:text-[#F5EFE6]">
              {type === 'outbound' ? (document.vendorName || 'Vendor') : (document.customerName || 'Customer')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6B5E55]">Amount Due</span>
            <span className="font-mono font-bold text-[#B91C1C] dark:text-[#F87171]">
              ₹{initialAmountDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg text-xs font-medium border bg-red-50 text-red-800 border-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegisterPayment} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Payment Amount *</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-[#9E9085] font-mono">₹</span>
              <input
                type="number"
                step="0.01"
                required
                max={initialAmountDue}
                value={paymentData.amount}
                onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })}
                className="w-full pl-8 pr-4 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] font-mono text-sm text-[#2C221E] dark:text-[#F5EFE6]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Payment Method *</label>
              <select
                value={paymentData.method}
                onChange={e => setPaymentData({ ...paymentData, method: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6]"
              >
                <option value="bank">Bank / Wire Transfer</option>
                <option value="cash">Cash</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Payment Date *</label>
              <input
                type="date"
                required
                value={paymentData.paymentDate}
                onChange={e => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6]"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Memo / Note</label>
            <input
              type="text"
              value={paymentData.note}
              onChange={e => setPaymentData({ ...paymentData, note: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6]"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#E6DFD5] dark:border-[#382D27]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-[#F3ECE0] dark:hover:bg-[#382D27]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#15803D] hover:bg-[#166534] text-white px-4 py-2 rounded-lg font-semibold cursor-pointer shadow-sm flex items-center gap-2"
            >
              {loading ? 'Processing...' : <><CheckCircle className="w-4 h-4" /> Validate & Post Payment</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
