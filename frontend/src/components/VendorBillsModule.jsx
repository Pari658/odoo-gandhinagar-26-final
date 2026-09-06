import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { FileText, Plus, Search, CheckCircle, XCircle, DollarSign, Check, AlertCircle, ArrowLeft, Trash2, Calendar, User, ShoppingBag, Layers, AlertTriangle, LayoutGrid, List } from 'lucide-react';
import PaymentModal from './PaymentModal.jsx';

export default function VendorBillsModule() {
  const { user } = useAuth();
  const [vendorBills, setVendorBills] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [analyticAccounts, setAnalyticAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [view, setView] = useState('list'); // 'list' | 'detail'
  const [displayMode, setDisplayMode] = useState('kanban'); // 'kanban' | 'table'
  const [selectedBillId, setSelectedBillId] = useState(null);
  const [billDetail, setBillDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentBill, setPaymentBill] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
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
    fetchAnalyticAccounts();
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

  const fetchAnalyticAccounts = async () => {
    try {
      const data = await apiRequest('GET', '/analytic-accounts');
      setAnalyticAccounts(data || []);
    } catch (err) {
      console.error('Failed to load analytic accounts:', err);
    }
  };

  const loadBillDetail = async (id) => {
    setLoadingDetail(true);
    try {
      const res = await apiRequest('GET', `/vendor-bills/${id}`);
      setBillDetail(res);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to load bill details' });
    } finally {
      setLoadingDetail(false);
    }
  };

  const openDetail = (id) => {
    setSelectedBillId(id);
    setView('detail');
    loadBillDetail(id);
  };

  const handleAddLine = () => {
    setFormData({
      ...formData,
      lines: [...formData.lines, { productId: '', accountId: '', analyticAccountId: '', quantity: 1, unitPrice: 0 }]
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
        accountId: product?.expenseAccountId || accounts[0]?.id || '',
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
      openDetail(created.id);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleConfirm = async (id) => {
    try {
      await apiRequest('POST', `/vendor-bills/${id}/confirm`);
      setMessage({ type: 'success', text: 'Vendor Bill confirmed and posted to ledger!' });
      fetchVendorBills();
      if (view === 'detail' && selectedBillId === id) {
        loadBillDetail(id);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteBill = async () => {
    if (!selectedBillId) return;
    try {
      await apiRequest('DELETE', `/vendor-bills/${selectedBillId}`);
      setMessage({ type: 'success', text: 'Vendor bill deleted successfully!' });
      setShowDeleteModal(false);
      setView('list');
      setSelectedBillId(null);
      setBillDetail(null);
      fetchVendorBills();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      setShowDeleteModal(false);
    }
  };

  const openPaymentModal = (bill) => {
    if (bill && bill.id) {
      setSelectedBillId(bill.id);
      setPaymentBill(bill);
    }
    setShowPaymentModal(true);
  };

  const filteredBills = vendorBills.filter(bill => 
    bill.number?.toLowerCase().includes(search.toLowerCase()) ||
    bill.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
    bill.billReference?.toLowerCase().includes(search.toLowerCase())
  );

  const currentBillForPayment = paymentBill || ((billDetail && selectedBillId && billDetail.id === selectedBillId)
    ? billDetail
    : vendorBills.find(b => b.id === selectedBillId));

  const billDocument = currentBillForPayment ? {
    id: currentBillForPayment.id,
    vendorId: currentBillForPayment.vendorId,
    vendorName: currentBillForPayment.vendorName,
    billNumber: currentBillForPayment.number || currentBillForPayment.billNumber || 'Bill',
    amountDue: currentBillForPayment.amountDue !== undefined
      ? currentBillForPayment.amountDue
      : (Number(currentBillForPayment.totalAmount || 0) - Number(currentBillForPayment.amountPaid || 0)),
    totalAmount: currentBillForPayment.totalAmount,
    amountPaid: currentBillForPayment.amountPaid
  } : null;

  // VENDOR BILL BIG VIEW (DETAIL VIEW)
  if (view === 'detail') {
    return (
      <div className="space-y-6">
        {/* Navigation Breadcrumb / Top Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E6DFD5] dark:border-[#382D27] pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setView('list'); setSelectedBillId(null); setBillDetail(null); }}
              className="p-2 rounded-xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] text-[#6B5E55] dark:text-[#A89B91] hover:text-[#B45309] hover:border-[#B45309]/50 transition-all cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#6B5E55] dark:text-[#A89B91]">Vendor Bills</span>
                <span className="text-xs text-[#6B5E55]">/</span>
                <span className="text-xs font-bold text-[#B45309]">{billDetail?.number || 'Bill View'}</span>
              </div>
              <h2 className="font-heading font-bold text-2xl text-[#2C221E] dark:text-[#F5EFE6] flex items-center gap-3">
                <span>{billDetail?.number || 'Loading Bill...'}</span>
                {billDetail && (
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border uppercase ${
                    billDetail.status === 'paid'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : billDetail.status === 'partially_paid'
                      ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300'
                      : billDetail.status === 'unpaid'
                      ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {billDetail.status?.replace('_', ' ')}
                  </span>
                )}
              </h2>
            </div>
          </div>

          {['admin', 'accountant'].includes(user?.role) && billDetail && (
            <div className="flex items-center gap-2 flex-wrap">
              {(!billDetail.journalEntryId && billDetail.status !== 'paid') && (
                <button
                  onClick={() => handleConfirm(billDetail.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirm Bill</span>
                </button>
              )}

              {billDetail.amountDue > 0 && (
                <button
                  onClick={() => openPaymentModal(billDetail)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#B45309] hover:bg-[#92400E] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Register Payment</span>
                </button>
              )}

              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-bold hover:bg-red-100 transition-all cursor-pointer shadow-xs"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>Delete</span>
              </button>
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

        {loadingDetail || !billDetail ? (
          <div className="text-center py-16 text-xs text-[#6B5E55]">Loading vendor bill details...</div>
        ) : (
          <div className="space-y-6">
            
            {/* Big View Summary Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] shadow-sm">
                <span className="text-[11px] text-[#6B5E55] dark:text-[#A89B91] block mb-1">Vendor Partner</span>
                <div className="font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6] flex items-center gap-2">
                  <User className="w-4 h-4 text-[#B45309]" />
                  <span>{billDetail.vendorName || 'Vendor Partner'}</span>
                </div>
                {billDetail.vendorEmail && <span className="text-[10px] text-[#6B5E55] font-mono block mt-0.5">{billDetail.vendorEmail}</span>}
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] shadow-sm">
                <span className="text-[11px] text-[#6B5E55] dark:text-[#A89B91] block mb-1">Bill Reference & PO</span>
                <div className="font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6] flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#B45309]" />
                  <span>{billDetail.billReference || billDetail.purchaseOrderNumber || 'N/A'}</span>
                </div>
                <span className="text-[10px] text-[#6B5E55] block mt-0.5">Ref / Purchase Order</span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] shadow-sm">
                <span className="text-[11px] text-[#6B5E55] dark:text-[#A89B91] block mb-1">Total Bill Amount</span>
                <div className="font-mono font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6]">
                  ₹{Number(billDetail.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-emerald-600 block mt-0.5">Paid: ₹{Number(billDetail.amountPaid).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] shadow-sm">
                <span className="text-[11px] text-[#6B5E55] dark:text-[#A89B91] block mb-1">Balance Due</span>
                <div className="font-mono font-bold text-lg text-[#B45309]">
                  ₹{Number(billDetail.amountDue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-[#6B5E55] block mt-0.5">Due: {new Date(billDetail.dueDate).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Main Bill Card & Line Items Table */}
            <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 shadow-sm space-y-6">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E6DFD5]/60 dark:border-[#382D27] pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-[#FAF6EE] dark:bg-[#29211D] text-[#B45309]">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-[#2C221E] dark:text-[#F5EFE6]">
                      Invoice Line Breakdown
                    </h3>
                    <p className="text-xs text-[#6B5E55] dark:text-[#A89B91]">
                      Detailed cost items, expense chart of accounts & quantity totals
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="text-[#6B5E55] block">Invoice Date: <strong className="text-[#2C221E] dark:text-[#F5EFE6]">{new Date(billDetail.invoiceDate).toLocaleDateString()}</strong></span>
                  <span className="text-[#6B5E55] block">Payment Term Due: <strong className="text-[#B45309]">{new Date(billDetail.dueDate).toLocaleDateString()}</strong></span>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-[#FAF6EE] dark:bg-[#29211D] text-[#6B5E55] dark:text-[#A89B91]">
                    <tr>
                      <th className="px-4 py-3 font-semibold rounded-l-lg">#</th>
                      <th className="px-4 py-3 font-semibold">Product / Item</th>
                      <th className="px-4 py-3 font-semibold">Chart Account</th>
                      <th className="px-4 py-3 font-semibold">Analytic Account</th>
                      <th className="px-4 py-3 font-semibold text-right">Quantity</th>
                      <th className="px-4 py-3 font-semibold text-right">Unit Price</th>
                      <th className="px-4 py-3 font-semibold text-right rounded-r-lg">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DFD5] dark:divide-[#382D27]">
                    {billDetail.lines && billDetail.lines.length > 0 ? (
                      billDetail.lines.map((line, idx) => (
                        <tr key={line.id || idx} className="hover:bg-[#FAF6EE]/50 dark:hover:bg-[#29211D]/40">
                          <td className="px-4 py-3 font-mono text-[#6B5E55]">{idx + 1}</td>
                          <td className="px-4 py-3 font-bold text-[#2C221E] dark:text-[#F5EFE6]">{line.productName}</td>
                          <td className="px-4 py-3 text-[#6B5E55]">{line.accountName}</td>
                          <td className="px-4 py-3 text-[#6B5E55]">
                            {line.analyticAccountName ? (
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-medium">
                                {line.analyticAccountName}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">{line.quantity}</td>
                          <td className="px-4 py-3 text-right font-mono">₹{Number(line.unitPrice).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-[#2C221E] dark:text-[#F5EFE6]">
                            ₹{Number(line.total).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-[#6B5E55]">No itemized lines recorded on this bill.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Total Summary Footer */}
              <div className="pt-4 border-t border-[#E6DFD5]/60 dark:border-[#382D27] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="text-xs text-[#6B5E55] space-y-1">
                  <div>Journal Entry ID: <strong className="font-mono text-[#2C221E] dark:text-[#F5EFE6]">{billDetail.journalEntryId || 'Unposted (Draft)'}</strong></div>
                  <div>Created Timestamp: <span>{new Date(billDetail.createdAt).toLocaleString()}</span></div>
                </div>

                <div className="w-full sm:w-64 space-y-2 text-xs bg-[#FAF6EE] dark:bg-[#29211D] p-4 rounded-xl border border-[#E6DFD5] dark:border-[#382D27]">
                  <div className="flex justify-between text-[#6B5E55]">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold text-[#2C221E] dark:text-[#F5EFE6]">₹{Number(billDetail.totalAmount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Amount Paid:</span>
                    <span className="font-mono font-semibold">₹{Number(billDetail.amountPaid).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-[#B45309] pt-2 border-t border-[#E6DFD5] dark:border-[#382D27]">
                    <span>Amount Due:</span>
                    <span className="font-mono">₹{Number(billDetail.amountDue).toFixed(2)}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* PAYMENT MODAL */}
        {showPaymentModal && billDocument && (
          <PaymentModal
            document={billDocument}
            type="outbound"
            onClose={() => setShowPaymentModal(false)}
            onSuccess={() => {
              setMessage({ type: 'success', text: 'Payment registered, confirmed and posted to ledger!' });
              setShowPaymentModal(false);
              fetchVendorBills();
              if (selectedBillId) {
                loadBillDetail(selectedBillId);
              }
            }}
          />
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 max-w-md w-full shadow-xl space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="font-heading font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6]">
                  Delete Vendor Bill?
                </h3>
              </div>
              <p className="text-xs text-[#6B5E55] dark:text-[#A89B91]">
                Are you sure you want to delete bill <strong>{billDetail?.number}</strong>? This action will permanently remove it from Supabase.
              </p>
              <div className="pt-2 flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteBill}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold cursor-pointer"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading font-bold text-xl text-[#2C221E] dark:text-[#F5EFE6]">
            Vendor Bills
          </h2>
          <p className="text-xs text-[#6B5E55] dark:text-[#A89B91]">
            Manage vendor invoices and register outgoing payments (Click any bill for full details)
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
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#9E9085]" />
          <input
            type="text"
            placeholder="Search by Bill #, Vendor, or Ref..."
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

      {/* Bills Display */}
      {loading ? (
        <div className="text-center py-12 text-xs text-[#6B5E55]">Loading Vendor Bills...</div>
      ) : filteredBills.length === 0 ? (
        <div className="text-center py-12 text-xs text-[#6B5E55]">No vendor bills found.</div>
      ) : displayMode === 'table' ? (
        <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] overflow-hidden shadow-sm flex flex-col flex-1">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#FAF6EE] dark:bg-[#29211D] text-[#6B5E55] dark:text-[#A89B91]">
                <tr>
                  <th className="px-6 py-4 font-semibold">Bill Number</th>
                  <th className="px-6 py-4 font-semibold">Vendor</th>
                  <th className="px-6 py-4 font-semibold">Due Date</th>
                  <th className="px-6 py-4 font-semibold text-right">Total Amount</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DFD5] dark:divide-[#382D27]">
                {filteredBills.map((bill) => (
                  <tr 
                    key={bill.id} 
                    onClick={() => openDetail(bill.id)}
                    className="group hover:bg-[#FAF6EE]/50 dark:hover:bg-[#29211D]/50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <span className="font-bold text-[#2C221E] dark:text-[#F5EFE6]">{bill.number || bill.billNumber}</span>
                    </td>
                    <td className="px-6 py-4 text-[#6B5E55] dark:text-[#A89B91]">
                      {bill.vendorName}
                    </td>
                    <td className="px-6 py-4 text-[#6B5E55] dark:text-[#A89B91]">
                      {new Date(bill.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-[#2C221E] dark:text-[#F5EFE6]">
                      ₹{Number(bill.totalAmount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border uppercase ${
                        bill.status === 'paid'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : bill.status === 'partially_paid'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : bill.status === 'unpaid'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {bill.status?.replace('_', ' ')}
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
          {/* Unpaid Column */}
          <div className="w-80 shrink-0 bg-[#FAF6EE]/50 dark:bg-[#1C1613]/50 rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] flex flex-col h-full max-h-full">
            <div className="p-4 border-b border-[#E6DFD5]/50 dark:border-[#382D27] flex items-center justify-between sticky top-0 bg-[#FAF6EE]/90 dark:bg-[#1C1613]/90 backdrop-blur-sm rounded-t-2xl z-10">
              <h3 className="font-heading font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Unpaid
              </h3>
              <span className="text-[10px] font-bold bg-[#E6DFD5] dark:bg-[#382D27] text-[#6B5E55] px-2 py-0.5 rounded-full">
                {filteredBills.filter(b => b.status === 'unpaid' || b.status === 'draft').length}
              </span>
            </div>
            <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
              {filteredBills.filter(b => b.status === 'unpaid' || b.status === 'draft').map(bill => (
                <div key={bill.id} onClick={() => openDetail(bill.id)} className="bg-white dark:bg-[#29211D] p-4 rounded-xl border border-[#E6DFD5] dark:border-[#382D27] shadow-sm hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6] group-hover:text-amber-600 transition-colors">{bill.number || bill.billNumber}</span>
                    <span className="font-mono font-bold text-[#2C221E] dark:text-[#F5EFE6] text-xs">₹{Number(bill.totalAmount).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-xs text-[#6B5E55] dark:text-[#A89B91] mb-3 line-clamp-1">{bill.vendorName}</div>
                  <div className="flex items-center justify-between border-t border-[#E6DFD5]/60 dark:border-[#382D27] pt-2">
                    <span className="text-[10px] font-mono text-amber-600 font-bold">Due: {new Date(bill.dueDate).toLocaleDateString()}</span>
                    <span className="text-[10px] font-bold text-amber-600 uppercase">Unpaid</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Partially Paid Column */}
          <div className="w-80 shrink-0 bg-[#FAF6EE]/50 dark:bg-[#1C1613]/50 rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] flex flex-col h-full max-h-full">
            <div className="p-4 border-b border-[#E6DFD5]/50 dark:border-[#382D27] flex items-center justify-between sticky top-0 bg-[#FAF6EE]/90 dark:bg-[#1C1613]/90 backdrop-blur-sm rounded-t-2xl z-10">
              <h3 className="font-heading font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6] flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                Partially Paid
              </h3>
              <span className="text-[10px] font-bold bg-[#E6DFD5] dark:bg-[#382D27] text-[#6B5E55] px-2 py-0.5 rounded-full">
                {filteredBills.filter(b => b.status === 'partially_paid').length}
              </span>
            </div>
            <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
              {filteredBills.filter(b => b.status === 'partially_paid').map(bill => (
                <div key={bill.id} onClick={() => openDetail(bill.id)} className="bg-white dark:bg-[#29211D] p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6] group-hover:text-blue-600 transition-colors">{bill.number || bill.billNumber}</span>
                    <span className="font-mono font-bold text-[#2C221E] dark:text-[#F5EFE6] text-xs">₹{Number(bill.totalAmount).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-xs text-[#6B5E55] dark:text-[#A89B91] mb-3 line-clamp-1">{bill.vendorName}</div>
                  <div className="flex items-center justify-between border-t border-[#E6DFD5]/60 dark:border-[#382D27] pt-2">
                    <span className="text-[10px] font-mono text-[#A89B91]">Due: {new Date(bill.dueDate).toLocaleDateString()}</span>
                    <span className="text-[10px] font-bold text-blue-600 uppercase">Bal: ₹{Number(bill.amountDue).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Paid Column */}
          <div className="w-80 shrink-0 bg-[#FAF6EE]/50 dark:bg-[#1C1613]/50 rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] flex flex-col h-full max-h-full">
            <div className="p-4 border-b border-[#E6DFD5]/50 dark:border-[#382D27] flex items-center justify-between sticky top-0 bg-[#FAF6EE]/90 dark:bg-[#1C1613]/90 backdrop-blur-sm rounded-t-2xl z-10">
              <h3 className="font-heading font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6] flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Paid
              </h3>
              <span className="text-[10px] font-bold bg-[#E6DFD5] dark:bg-[#382D27] text-[#6B5E55] px-2 py-0.5 rounded-full">
                {filteredBills.filter(b => b.status === 'paid').length}
              </span>
            </div>
            <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
              {filteredBills.filter(b => b.status === 'paid').map(bill => (
                <div key={bill.id} onClick={() => openDetail(bill.id)} className="bg-white dark:bg-[#29211D] p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6] group-hover:text-emerald-600 transition-colors">{bill.number || bill.billNumber}</span>
                    <span className="font-mono font-bold text-[#2C221E] dark:text-[#F5EFE6] text-xs">₹{Number(bill.totalAmount).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-xs text-[#6B5E55] dark:text-[#A89B91] mb-3 line-clamp-1">{bill.vendorName}</div>
                  <div className="flex items-center justify-between border-t border-[#E6DFD5]/60 dark:border-[#382D27] pt-2">
                    <span className="text-[10px] font-mono text-[#A89B91]">Paid</span>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1"><Check className="w-3 h-3"/> Paid</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CREATE BILL MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 max-w-2xl w-full shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-heading font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6]">
              Create Vendor Bill
            </h3>

            <form onSubmit={handleCreateBill} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Vendor *</label>
                  <select
                    required
                    value={formData.vendorId}
                    onChange={e => setFormData({ ...formData, vendorId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6]"
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Bill Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-9901"
                    value={formData.billReference}
                    onChange={e => setFormData({ ...formData, billReference: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Invoice Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.invoiceDate}
                    onChange={e => setFormData({ ...formData, invoiceDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6]"
                  />
                </div>
              </div>

              {/* Bill Lines */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-[#2C221E] dark:text-[#F5EFE6]">Bill Lines</h4>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-[#B45309] hover:underline font-semibold text-xs cursor-pointer"
                  >
                    + Add Line
                  </button>
                </div>

                {formData.lines.map((line, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE]/50 dark:bg-[#29211D]/40 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] text-[#6B5E55]">Product</label>
                        <select
                          required
                          value={line.productId}
                          onChange={e => handleLineChange(idx, 'productId', e.target.value)}
                          className="w-full px-2 py-1 rounded border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] text-[#2C221E] dark:text-[#F5EFE6]"
                        >
                          <option value="">Select Product</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-[#6B5E55]">Chart Account</label>
                        <select
                          required
                          value={line.accountId}
                          onChange={e => handleLineChange(idx, 'accountId', e.target.value)}
                          className="w-full px-2 py-1 rounded border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] text-[#2C221E] dark:text-[#F5EFE6]"
                        >
                          <option value="">Select Account</option>
                          {accounts.map(a => (
                            <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-[#6B5E55]">Analytic Account</label>
                        <select
                          value={line.analyticAccountId}
                          onChange={e => handleLineChange(idx, 'analyticAccountId', e.target.value)}
                          className="w-full px-2 py-1 rounded border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] text-[#2C221E] dark:text-[#F5EFE6]"
                        >
                          <option value="">None</option>
                          {analyticAccounts.map(aa => (
                            <option key={aa.id} value={aa.id}>{aa.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-1">
                        <div>
                          <label className="block text-[10px] text-[#6B5E55]">Qty</label>
                          <input
                            type="number"
                            min="1"
                            value={line.quantity}
                            onChange={e => handleLineChange(idx, 'quantity', e.target.value)}
                            className="w-full px-2 py-1 rounded border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] text-[#2C221E] dark:text-[#F5EFE6]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-[#6B5E55]">Price</label>
                          <input
                            type="number"
                            step="0.01"
                            value={line.unitPrice}
                            onChange={e => handleLineChange(idx, 'unitPrice', e.target.value)}
                            className="w-full px-2 py-1 rounded border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] text-[#2C221E] dark:text-[#F5EFE6]"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        className="text-red-500 hover:underline text-[10px] font-semibold cursor-pointer"
                      >
                        Remove Line
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#B45309] hover:bg-[#92400E] text-white px-4 py-2 rounded-lg font-semibold cursor-pointer"
                >
                  Create Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL FOR LIST VIEW */}
      {showPaymentModal && billDocument && (
        <PaymentModal
          document={billDocument}
          type="outbound"
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setMessage({ type: 'success', text: 'Payment registered, confirmed and posted to ledger!' });
            setShowPaymentModal(false);
            fetchVendorBills();
            if (selectedBillId) {
              loadBillDetail(selectedBillId);
            }
          }}
        />
      )}
    </div>
  );
}
