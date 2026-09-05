import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  CreditCard,
  Plus,
  RefreshCw,
  Search,
  X
} from 'lucide-react';

const today = () => new Date().toISOString().slice(0, 10);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emptyForm = () => ({
  targetType: 'vendor',
  targetId: '',
  partnerId: '',
  partnerName: '',
  amount: '',
  method: 'bank',
  paymentDate: today(),
  note: ''
});

function money(value) {
  return Number(value || 0).toFixed(2);
}

function statusClass(status) {
  if (status === 'confirmed') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  if (status === 'cancelled') return 'bg-red-50 text-red-800 border-red-200';
  return 'bg-amber-50 text-amber-800 border-amber-200';
}

function targetPartnerId(target, type) {
  return target?.partnerId || target?.partner_id || (type === 'vendor'
    ? target?.vendorId || target?.vendor_id
    : target?.customerId || target?.customer_id);
}

export default function PaymentsModule() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [vendorBills, setVendorBills] = useState([]);
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [filters, setFilters] = useState({ direction: '', status: '' });
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [message, setMessage] = useState(null);
  const isStaff = ['admin', 'accountant'].includes(user?.role);

  useEffect(() => {
    loadPayments();
  }, [filters.direction, filters.status]);

  useEffect(() => {
    loadPaymentTargets();
  }, []);

  async function loadPayments() {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page: '1' });
      if (filters.direction) query.set('direction', filters.direction);
      if (filters.status) query.set('status', filters.status);
      const data = await apiRequest('GET', `/payments?${query.toString()}`);
      setPayments(data.items || []);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function loadPaymentTargets() {
    try {
      const data = await apiRequest('GET', '/payments/targets');
      setVendorBills(data.vendorBills || []);
      setCustomerInvoices(data.customerInvoices || []);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  }

  function updateForm(field, value) {
    setForm(current => ({ ...current, [field]: value }));
  }

  function selectVendorBill(id) {
    const bill = vendorBills.find(item => item.id === id);
    setForm(current => ({
      ...current,
      targetId: id,
      partnerId: targetPartnerId(bill, 'vendor') || bill?.partnerId || '',
      partnerName: bill?.partnerName || bill?.vendorName || '',
      amount: bill ? money(bill.amountDue) : ''
    }));
  }

  function selectCustomerInvoice(id) {
    const invoice = customerInvoices.find(item => item.id === id);
    setForm(current => ({
      ...current,
      targetId: id,
      partnerId: targetPartnerId(invoice, 'customer') || invoice?.partnerId || '',
      partnerName: invoice?.partnerName || invoice?.customerName || '',
      amount: invoice ? money(invoice.amountDue) : ''
    }));
  }

  function resetForm() {
    setForm(emptyForm());
    setShowForm(false);
  }

  async function handleCreate(event) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const isVendorPayment = form.targetType === 'vendor';
    try {
      const selectedTarget = isVendorPayment
        ? vendorBills.find(bill => bill.id === form.targetId)
        : customerInvoices.find(invoice => invoice.id === form.targetId);
      const targetId = selectedTarget?.id;
      if (!targetId || !uuidPattern.test(targetId)) {
        throw new Error(`Select a valid ${isVendorPayment ? 'vendor bill' : 'customer invoice'}.`);
      }

      await apiRequest('POST', '/payments', {
        direction: isVendorPayment ? 'outbound' : 'inbound',
        vendorBillId: isVendorPayment ? targetId : null,
        customerInvoiceId: isVendorPayment ? null : targetId,
        amount: Number(form.amount),
        method: form.method,
        paymentDate: form.paymentDate,
        note: form.note || null
      });
      setMessage({ type: 'success', text: 'Draft payment created. Confirm it when the ledger should be posted.' });
      resetForm();
      await loadPayments();
    } catch (error) {
      const detail = error.details?.[0];
      setMessage({ type: 'error', text: detail ? `${detail.field}: ${detail.message}` : error.message });
    } finally {
      setSaving(false);
    }
  }

  async function runAction(id, action) {
    setActionId(id);
    setMessage(null);
    try {
      await apiRequest('POST', `/payments/${id}/${action}`);
      setMessage({ type: 'success', text: action === 'confirm' ? 'Payment confirmed and posted.' : 'Draft payment cancelled.' });
      await loadPayments();
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-xl text-[#2C221E] dark:text-[#F5EFE6]">Payments</h2>
          <p className="text-xs text-[#6B5E55] dark:text-[#A89B91]">Create draft payments, then confirm them to post the ledger entry.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadPayments}
            title="Refresh payments"
            className="p-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] text-[#6B5E55] hover:text-[#B45309] cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => { setForm(emptyForm()); setShowForm(true); }}
            className="bg-[#B45309] hover:bg-[#92400E] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Payment
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-xs font-medium border flex items-center justify-between ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage(null)} className="font-bold cursor-pointer">X</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#9E9085]" />
          <input disabled placeholder="Payment IDs are shown in the table" className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] text-[#9E9085]" />
        </div>
        <select value={filters.direction} onChange={event => setFilters({ ...filters, direction: event.target.value })} className="px-3 py-2 text-xs rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] text-[#2C221E] dark:text-[#F5EFE6]">
          <option value="">All directions</option>
          <option value="outbound">Outbound</option>
          <option value="inbound">Inbound</option>
        </select>
        <select value={filters.status} onChange={event => setFilters({ ...filters, status: event.target.value })} className="px-3 py-2 text-xs rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] text-[#2C221E] dark:text-[#F5EFE6]">
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-[#6B5E55]">Loading Payments...</div>
      ) : payments.length === 0 ? (
        <div className="p-10 text-center rounded-xl bg-white dark:bg-[#1C1613] border border-dashed border-[#E6DFD5] dark:border-[#382D27] text-sm text-[#6B5E55]">No payments match these filters.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613]">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E6DFD5] dark:border-[#382D27] text-[#6B5E55] dark:text-[#A89B91]">
              <tr>
                <th className="px-4 py-3 font-semibold">Target</th>
                <th className="px-4 py-3 font-semibold">Direction</th>
                <th className="px-4 py-3 font-semibold">Partner</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6DFD5]/70 dark:divide-[#382D27]">
              {payments.map(payment => {
                const isDraft = payment.status === 'draft';
                return (
                  <tr key={payment.id} className="hover:bg-[#FAF6EE] dark:hover:bg-[#29211D]">
                    <td className="px-4 py-3 font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{payment.targetNumber || 'Payment'}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 font-semibold">
                        {payment.direction === 'outbound' ? <ArrowUpRight className="w-3.5 h-3.5 text-[#B45309]" /> : <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-700" />}
                        {payment.direction}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#6B5E55]">{payment.partnerName || 'Unknown partner'}</td>
                    <td className="px-4 py-3 font-mono font-bold text-[#2C221E] dark:text-[#F5EFE6]">${money(payment.amount)}</td>
                    <td className="px-4 py-3 text-[#6B5E55]">{payment.paymentDate}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full border text-[10px] font-semibold uppercase ${statusClass(payment.status)}`}>{payment.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {isStaff && isDraft && (
                          <>
                            <button type="button" disabled={actionId === payment.id} onClick={() => runAction(payment.id, 'confirm')} className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50">
                              <Check className="w-3.5 h-3.5" /> Confirm
                            </button>
                            <button type="button" disabled={actionId === payment.id} onClick={() => runAction(payment.id, 'cancel')} className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50">
                              <X className="w-3.5 h-3.5" /> Cancel
                            </button>
                          </>
                        )}
                        {!isDraft && <span className="text-[10px] text-[#9E9085] flex items-center gap-1"><CreditCard className="w-3 h-3" /> Locked</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 max-w-lg w-full shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6]">New Draft Payment</h3>
                <p className="text-xs text-[#6B5E55] dark:text-[#A89B91]">This does not post to the ledger until confirmed.</p>
              </div>
              <button type="button" onClick={resetForm} className="p-2 text-[#6B5E55] hover:text-[#2C221E] cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="block font-semibold text-[#6B5E55] dark:text-[#A89B91]">Payment target</span>
                  <select value={form.targetType} onChange={event => setForm({ ...form, targetType: event.target.value, targetId: '', partnerId: '', partnerName: '', amount: '' })} className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]">
                    <option value="vendor">Vendor bill</option>
                    <option value="customer">Customer invoice</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="block font-semibold text-[#6B5E55] dark:text-[#A89B91]">Method</span>
                  <select value={form.method} onChange={event => updateForm('method', event.target.value)} className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]">
                    <option value="bank">Bank</option>
                    <option value="cash">Cash</option>
                  </select>
                </label>
              </div>

              {form.targetType === 'vendor' ? (
                <label className="block space-y-1">
                  <span className="block font-semibold text-[#6B5E55] dark:text-[#A89B91]">Vendor bill</span>
                  <select required value={form.targetId} onChange={event => selectVendorBill(event.target.value)} className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]">
                    <option value="">Select an unpaid bill...</option>
                    {vendorBills.map(bill => <option key={bill.id} value={bill.id}>{bill.number} - {bill.partnerName} - Due ${money(bill.amountDue)}</option>)}
                  </select>
                </label>
              ) : (
                <label className="block space-y-1">
                  <span className="block font-semibold text-[#6B5E55] dark:text-[#A89B91]">Customer invoice</span>
                  <select required value={form.targetId} onChange={event => selectCustomerInvoice(event.target.value)} className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]">
                    <option value="">Select an unpaid invoice...</option>
                    {customerInvoices.map(invoice => <option key={invoice.id} value={invoice.id}>{invoice.number} - {invoice.partnerName} - Due ${money(invoice.amountDue)}</option>)}
                  </select>
                </label>
              )}

              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="block font-semibold text-[#6B5E55] dark:text-[#A89B91]">Partner</span>
                  <input required readOnly value={form.partnerName} placeholder="Select a bill or invoice first" className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#F3ECE0] dark:bg-[#29211D] text-[#6B5E55]" />
                </label>
                <label className="space-y-1">
                  <span className="block font-semibold text-[#6B5E55] dark:text-[#A89B91]">Amount</span>
                  <input required min="0.01" step="0.01" type="number" value={form.amount} onChange={event => updateForm('amount', event.target.value)} className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] font-mono" />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1">
                  <span className="block font-semibold text-[#6B5E55] dark:text-[#A89B91]">Payment date</span>
                  <input required type="date" value={form.paymentDate} onChange={event => updateForm('paymentDate', event.target.value)} className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]" />
                </label>
                <label className="space-y-1">
                  <span className="block font-semibold text-[#6B5E55] dark:text-[#A89B91]">Note</span>
                  <input value={form.note} onChange={event => updateForm('note', event.target.value)} placeholder="Optional memo" className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]" />
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E6DFD5] dark:border-[#382D27]">
                <button type="button" onClick={resetForm} disabled={saving} className="px-4 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] text-[#6B5E55] cursor-pointer">Close</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-[#B45309] hover:bg-[#92400E] text-white font-semibold cursor-pointer disabled:opacity-50">{saving ? 'Creating...' : 'Create Draft'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
