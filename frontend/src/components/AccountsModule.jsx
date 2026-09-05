import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { BookOpen, Plus, FileText, CheckCircle2 } from 'lucide-react';
import AccountForm from './AccountForm.jsx';
import AccountDetail from './AccountDetail.jsx';

export default function AccountsModule() {
  const { user } = useAuth();
  const [view, setView] = useState('list'); // 'list' | 'detail'
  const [groupedAccounts, setGroupedAccounts] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Modal & Selection State
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (view === 'list') {
      fetchAccounts();
    }
  }, [view]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('GET', '/accounts');
      setGroupedAccounts(data.grouped || {});
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAccount = async (formData) => {
    try {
      const isEdit = !!editData;
      const endpoint = isEdit ? `/accounts/${editData.id}` : '/accounts';
      const method = isEdit ? 'PUT' : 'POST';
      
      const saved = await apiRequest(method, endpoint, formData);
      setMessage({ type: 'success', text: `Account '${saved.name}' ${isEdit ? 'updated' : 'created'}!` });
      setShowModal(false);
      setEditData(null);
      if (view === 'list') {
        fetchAccounts();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleEdit = (account) => {
    setEditData(account);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    try {
      await apiRequest('DELETE', `/accounts/${id}`);
      setMessage({ type: 'success', text: 'Account deleted successfully.' });
      if (view === 'detail') {
        setView('list');
      } else {
        fetchAccounts();
      }
      setSelectedId(null);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const accountTypeLabels = {
    asset: { label: 'Assets', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    bank: { label: 'Bank Accounts', bg: 'bg-blue-50 text-blue-800 border-blue-200' },
    cash: { label: 'Cash Accounts', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
    liability: { label: 'Liabilities', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
    capital: { label: 'Capital / Equity', bg: 'bg-purple-50 text-purple-800 border-purple-200' },
    income: { label: 'Sales Income', bg: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
    expense: { label: 'Purchase Expenses', bg: 'bg-rose-50 text-rose-800 border-rose-200' },
    other_expense: { label: 'Other Operating Expenses', bg: 'bg-slate-100 text-slate-800 border-slate-300' }
  };

  return (
    <>
      {view === 'detail' ? (
        <AccountDetail 
          account={Object.values(groupedAccounts).flat().find(a => a.id === selectedId)}
          onBack={() => setView('list')}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      ) : (
        <div className="space-y-6">
          {/* Top Action Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-heading font-bold text-xl text-[#2C221E] dark:text-[#F5EFE6]">
                Chart of Accounts Master
              </h2>
              <p className="text-xs text-[#6B5E55] dark:text-[#A89B91]">
                Ledger accounts grouped by financial classification (Balance Sheet vs Profit & Loss)
              </p>
            </div>

            {['admin', 'accountant'].includes(user?.role) && (
              <button
                onClick={() => {
                  setEditData(null);
                  setShowModal(true);
                }}
                className="bg-[#B45309] hover:bg-[#92400E] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Ledger Account</span>
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

          {/* Accounts Grouped Display */}
          {loading ? (
            <div className="text-center py-12 text-xs text-[#6B5E55]">Loading Chart of Accounts...</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(accountTypeLabels).map(([typeKey, config]) => {
                const list = groupedAccounts[typeKey] || [];
                if (list.length === 0) return null;

                return (
                  <div key={typeKey} className="rounded-xl border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] overflow-hidden shadow-sm space-y-2 p-4">
                    <div className="flex items-center justify-between border-b border-[#E6DFD5]/50 dark:border-[#382D27] pb-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-[#B45309]" />
                        <h3 className="font-heading font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6]">
                          {config.label}
                        </h3>
                      </div>
                      <span className="text-[10px] font-semibold text-[#6B5E55] bg-[#FAF6EE] dark:bg-[#29211D] px-2 py-0.5 rounded-full border border-[#E6DFD5] dark:border-[#382D27]">
                        {list.length} accounts
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                      {list.map(a => (
                        <div 
                          key={a.id} 
                          onClick={() => {
                            setSelectedId(a.id);
                            setView('detail');
                          }}
                          className="p-3 rounded-lg bg-[#FAF6EE]/50 dark:bg-[#29211D]/50 border border-[#E6DFD5] dark:border-[#382D27] hover:border-[#B45309]/50 transition-colors cursor-pointer group flex items-start gap-3"
                        >
                          <div className={`p-2 rounded-lg text-xs font-bold font-mono min-w-[3rem] text-center ${config.bg}`}>
                            {a.code}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-[#2C221E] dark:text-[#F5EFE6] group-hover:text-[#B45309] transition-colors">{a.name}</h4>
                            <div className="flex items-center gap-1.5 mt-1">
                              {a.reconcile && (
                                <span className="flex items-center gap-0.5 text-[9px] font-semibold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-1 rounded border border-emerald-100">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> Recon
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pop-up Modal for Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl my-8">
            <AccountForm
              initialData={editData}
              onSave={handleSaveAccount}
              onCancel={() => {
                setShowModal(false);
                setEditData(null);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
