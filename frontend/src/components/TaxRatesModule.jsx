import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Percent, Plus, Edit3, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import TaxRateForm from './TaxRateForm.jsx';
import TaxRateDetail from './TaxRateDetail.jsx';

export default function TaxRatesModule() {
  const { user } = useAuth();
  const [view, setView] = useState('list'); // 'list' | 'detail'
  const [taxRates, setTaxRates] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal & Selection State
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [editData, setEditData] = useState(null);
  
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (view === 'list') {
      fetchTaxRates();
      fetchAccounts();
    }
  }, [view]);

  const fetchTaxRates = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('GET', '/tax-rates');
      setTaxRates(data || []);
    } catch (err) {
      console.error('Failed to load tax rates:', err);
    } finally {
      setLoading(false);
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

  const handleSaveTaxRate = async (formData) => {
    try {
      const isEdit = !!editData;
      const endpoint = isEdit ? `/tax-rates/${editData.id}` : '/tax-rates';
      const method = isEdit ? 'PUT' : 'POST';
      
      const saved = await apiRequest(method, endpoint, formData);
      setMessage({ type: 'success', text: `Tax Rate '${saved.name}' ${isEdit ? 'updated' : 'created'} successfully!` });
      setShowModal(false);
      setEditData(null);
      if (view === 'list') {
        fetchTaxRates();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleEdit = (taxRate) => {
    setEditData(taxRate);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiRequest('DELETE', `/tax-rates/${deleteTarget.id}`);
      setMessage({ type: 'success', text: `Tax Rate '${deleteTarget.name}' deleted!` });
      setDeleteTarget(null);
      if (view === 'detail') {
        setView('list');
      } else {
        fetchTaxRates();
      }
      setSelectedId(null);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const isPrivileged = ['admin', 'accountant'].includes(user?.role);

  return (
    <>
      {view === 'detail' ? (
        <>
          <TaxRateDetail 
            taxRate={taxRates.find(t => t.id === selectedId)}
            accounts={accounts}
            onBack={() => setView('list')}
            onEdit={isPrivileged ? handleEdit : null}
            onDelete={isPrivileged ? (id) => setDeleteTarget(taxRates.find(t => t.id === selectedId)) : null}
          />
          
          {/* Detail View Delete Modal */}
          {deleteTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 max-w-md w-full shadow-xl space-y-4">
                <div className="flex items-center gap-3 text-red-600">
                  <AlertTriangle className="w-6 h-6" />
                  <h3 className="font-heading font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6]">
                    Delete Tax Rate?
                  </h3>
                </div>
                <p className="text-xs text-[#6B5E55] dark:text-[#A89B91]">
                  Are you sure you want to delete <strong>{deleteTarget?.name}</strong> ({deleteTarget?.ratePercent}%)? This action will permanently remove it from Supabase.
                </p>
                <div className="pt-2 flex items-center justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(null)}
                    className="px-4 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Delete Permanently'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-heading font-bold text-xl text-[#2C221E] dark:text-[#F5EFE6]">
                Tax Rates Master
              </h2>
              <p className="text-xs text-[#6B5E55] dark:text-[#A89B91]">
                Manage GST and tax rates linked to Chart of Accounts with real Supabase DB persistence
              </p>
            </div>

            {isPrivileged && (
              <button
                onClick={() => {
                  setEditData(null);
                  setShowModal(true);
                }}
                className="bg-[#B45309] hover:bg-[#92400E] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Tax Rate</span>
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

          {loading ? (
            <div className="text-center py-12 text-xs text-[#6B5E55]">Loading Tax Rates...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {taxRates.map(t => {
                const linkedAcc = accounts.find(a => a.id === t.linkedAccountId);
                return (
                  <div 
                    key={t.id} 
                    onClick={() => {
                      setSelectedId(t.id);
                      setView('detail');
                    }}
                    className="p-4 rounded-xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] shadow-sm hover:shadow-md transition-shadow space-y-3 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-[#FAF6EE] dark:bg-[#29211D] text-[#B45309]">
                          <Percent className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-heading font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6]">{t.name}</h3>
                          <span className="font-mono text-[10px] text-[#6B5E55]">ID: {t.id}</span>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-base text-[#B45309]">
                        {Number(t.ratePercent).toFixed(2)}%
                      </span>
                    </div>

                    <div className="pt-2 border-t border-[#E6DFD5]/50 dark:border-[#382D27] flex items-center justify-between text-xs">
                      <span className="text-[10px] text-[#6B5E55]">
                        Account: <strong className="text-[#2C221E] dark:text-[#F5EFE6]">{linkedAcc ? `${linkedAcc.code} - ${linkedAcc.name}` : 'Unlinked'}</strong>
                      </span>

                      {isPrivileged && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(t);
                            }}
                            className="p-1.5 rounded-lg hover:bg-amber-50 text-[#B45309] transition-colors cursor-pointer"
                            title="Edit Tax Rate"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(t);
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                            title="Delete Tax Rate"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* List View Delete Modal */}
          {deleteTarget && view === 'list' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 max-w-md w-full shadow-xl space-y-4">
                <div className="flex items-center gap-3 text-red-600">
                  <AlertTriangle className="w-6 h-6" />
                  <h3 className="font-heading font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6]">
                    Delete Tax Rate?
                  </h3>
                </div>
                <p className="text-xs text-[#6B5E55] dark:text-[#A89B91]">
                  Are you sure you want to delete <strong>{deleteTarget?.name}</strong> ({deleteTarget?.ratePercent}%)? This action will permanently remove it from Supabase.
                </p>
                <div className="pt-2 flex items-center justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(null)}
                    className="px-4 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Delete Permanently'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pop-up Modal for Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-xl my-8">
            <TaxRateForm
              initialData={editData}
              onSave={handleSaveTaxRate}
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
