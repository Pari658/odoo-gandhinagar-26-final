import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { FileText, Plus, Search, CheckCircle, XCircle, DollarSign, Check, AlertCircle } from 'lucide-react';
import PaymentModal from './PaymentModal.jsx';

export default function VendorBillsModule() {
  const { user } = useAuth();
  const [vendorBills, setVendorBills] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  
  const [message, setMessage] = useState(null);

  // Create Bill Form state
  const [formData, setFormData] = useState({
    vendorId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    billReference: '',
    lines: []
  });

  // Payment Form state
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    method: 'bank',
    paymentDate: new Date().toISOString().split('T')[0],
    note: ''
  });

  useEffect(() => {
    fetchVendorBills();
    fetchVendors();
    fetchProducts();
    fetchAccounts();
  }, []);

  const fetchVendorBills = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('GET', '/vendor-bills');
      setVendorBills(data.items || []);
    } catch (err) {
      console.error('Failed to load vendor bills:', err);
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

  const fetchAccounts = async () => {
    try {
      const data = await apiRequest('GET', '/accounts');
      setAccounts(data.items || []);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  };

  const handleAddLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { productId: '', accountId: '', quantity: 1, unitPrice: 0 }]
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
        accountId: product?.expenseAccountId || '',
        unitPrice: product ? product.costPrice : 0
      };
    } else {
      newLines[index] = { ...newLines[index], [field]: value };
    }
    setFormData({ ...formData, lines: newLines });
  };

  const handleCreateBill = async (e) => {
    e.preventDefault();
    if (formData.lines.length === 0) {
      setMessage({ type: 'error', text: 'Please add at least one bill line.' });
      return;
    }
    try {
      const cleanedData = {
        ...formData,
        lines: formData.lines.map(l => ({
          ...l,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice)
        }))
      };
      
      const created = await apiRequest('POST', '/vendor-bills', cleanedData);
      setMessage({ type: 'success', text: `Vendor Bill ${created.number} created successfully!` });
      setShowCreateModal(false);
      setFormData({
        vendorId: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        billReference: '',
        lines: []
      });
      fetchVendorBills();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleConfirm = async (id) => {
    try {
      await apiRequest('POST', `/vendor-bills/${id}/confirm`);
      setMessage({ type: 'success', text: 'Vendor Bill confirmed and posted to ledger!' });
      fetchVendorBills();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const openPaymentModal = (bill) => {
    setSelectedBill(bill);
    setPaymentData({
      amount: Number(bill.amountDue).toFixed(2),
      method: 'bank',
      paymentDate: new Date().toISOString().split('T')[0],
      note: `Payment for ${bill.billNumber}`
    });
    setShowPaymentModal(true);
  };

  const handleRegisterPayment = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('POST', '/payments', {
        direction: 'outbound',
        vendorBillId: selectedBill.id,
        partnerId: selectedBill.vendorId,
        amount: Number(paymentData.amount),
        method: paymentData.method,
        paymentDate: paymentData.paymentDate,
        note: paymentData.note
      });
      setMessage({ type: 'success', text: 'Payment registered successfully!' });
      setShowPaymentModal(false);
      fetchVendorBills();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const filteredBills = vendorBills.filter(bill => 
    bill.billNumber?.toLowerCase().includes(search.toLowerCase()) ||
    bill.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
    bill.purchaseOrderNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-xl text-[#2C221E] dark:text-[#F5EFE6]">
            Vendor Bills
          </h2>
          <p className="text-xs text-[#6B5E55] dark:text-[#A89B91]">
            Manage vendor invoices and register outgoing payments
          </p>
        </div>

        {['admin', 'accountant'].includes(user?.role) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#B45309] hover:bg-[#92400E] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Bill</span>
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
            placeholder="Search by Bill #, Vendor, or PO..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] text-[#2C221E] dark:text-[#F5EFE6] focus:outline-none focus:ring-2 focus:ring-[#B45309]"
          />
        </div>
      </div>

      {/* Bills Grid */}
      {loading ? (
        <div className="text-center py-12 text-xs text-[#6B5E55]">Loading Vendor Bills...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBills.map(bill => (
            <div key={bill.id} className="p-4 rounded-xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] shadow-sm hover:shadow-md transition-shadow space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FAF6EE] dark:bg-[#29211D] border border-[#E6DFD5] dark:border-[#382D27] flex items-center justify-center text-[#B45309]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6]">{bill.billNumber || 'Draft'}</h3>
                    <span className="text-[10px] font-mono text-[#6B5E55]">{bill.vendorName}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 items-end">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase ${
                    bill.state === 'draft' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    bill.state === 'posted' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    'bg-red-50 text-red-800 border-red-200'
                  }`}>
                    {bill.state}
                  </span>
                  {bill.state === 'posted' && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase ${
                      bill.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                      bill.paymentStatus === 'partial' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                      'bg-gray-50 text-gray-800 border-gray-200'
                    }`}>
                      {bill.paymentStatus}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-[#6B5E55] dark:text-[#A89B91]">
                <div>
                  <p className="font-medium">Total Amount</p>
                  <p className="font-mono tabular-nums text-[#2C221E] dark:text-[#F5EFE6] font-bold">
                    ${Number(bill.totalAmount).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="font-medium">Amount Due</p>
                  <p className="font-mono tabular-nums text-[#B91C1C] dark:text-[#F87171] font-bold">
                    ${Number(bill.amountDue).toFixed(2)}
                  </p>
                </div>
                {bill.purchaseOrderNumber && (
                  <div className="col-span-2">
                    <p className="font-medium">Originating PO</p>
                    <p className="text-[#2C221E] dark:text-[#F5EFE6]">{bill.purchaseOrderNumber}</p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#E6DFD5]/50 dark:border-[#382D27] flex flex-wrap items-center gap-2">
                {bill.state === 'draft' && ['admin', 'accountant'].includes(user?.role) && (
                  <button
                    onClick={() => handleConfirm(bill.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Confirm Bill
                  </button>
                )}
                {bill.state === 'posted' && bill.paymentStatus !== 'paid' && ['admin', 'accountant'].includes(user?.role) && (
                  <button
                    onClick={() => openPaymentModal(bill)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#B45309] text-white hover:bg-[#92400E] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Register Payment
                  </button>
                )}
              </div>
            </div>
          ))}
          {filteredBills.length === 0 && !loading && (
            <div className="col-span-full py-8 text-center text-sm text-[#6B5E55]">
              No vendor bills found.
            </div>
          )}
        </div>
      )}

      {/* Create Bill Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl space-y-4">
            <h3 className="font-heading font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6]">
              Create Vendor Bill
            </h3>

            <form onSubmit={handleCreateBill} className="space-y-4 text-xs">
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
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Bill Reference</label>
                  <input
                    type="text"
                    value={formData.billReference}
                    onChange={e => setFormData({ ...formData, billReference: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Invoice Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.invoiceDate}
                    onChange={e => setFormData({ ...formData, invoiceDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold">Bill Lines *</label>
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
                      <div key={index} className="flex flex-col gap-2 bg-[#FAF6EE] dark:bg-[#29211D] p-3 rounded-lg border border-[#E6DFD5] dark:border-[#382D27]">
                        <div className="flex items-center gap-2">
                          <select
                            required
                            value={line.productId}
                            onChange={e => handleLineChange(index, 'productId', e.target.value)}
                            className="flex-1 px-2 py-1.5 rounded border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613]"
                          >
                            <option value="">Select Product...</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                          <select
                            required
                            value={line.accountId}
                            onChange={e => handleLineChange(index, 'accountId', e.target.value)}
                            className="flex-1 px-2 py-1.5 rounded border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613]"
                          >
                            <option value="">Select Account (Expense)...</option>
                            {accounts.map(a => (
                              <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
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
                          <div className="flex-1"></div>
                          <button
                            type="button"
                            onClick={() => handleRemoveLine(index)}
                            className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#E6DFD5] dark:border-[#382D27]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-[#F3ECE0] dark:hover:bg-[#382D27]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#B45309] hover:bg-[#92400E] text-white px-4 py-2 rounded-lg font-semibold cursor-pointer shadow-sm"
                >
                  Create Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedBill && (
        <PaymentModal
          document={selectedBill}
          type="outbound"
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            setMessage({ type: 'success', text: 'Payment registered successfully!' });
            fetchVendorBills();
          }}
        />
      )}
    </div>
  );
}
