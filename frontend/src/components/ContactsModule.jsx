import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Users, Plus, Search, Filter, Mail, Phone, MapPin, CheckCircle, ShieldAlert, Image as ImageIcon } from 'lucide-react';
import ContactForm from './ContactForm.jsx';
import ContactDetail from './ContactDetail.jsx';

export default function ContactsModule() {
  const { user } = useAuth();
  const [view, setView] = useState('list'); // 'list' | 'detail'
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  
  // Modal & Selection State
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (view === 'list') {
      fetchContacts();
    }
  }, [filterType, search, view]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      let query = '?';
      if (filterType) query += `type=${filterType}&`;
      if (search) query += `search=${encodeURIComponent(search)}&`;

      const data = await apiRequest('GET', `/contacts${query}`);
      setContacts(data.items || []);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContact = async (formData) => {
    try {
      const isEdit = !!editData;
      const endpoint = isEdit ? `/contacts/${editData.id}` : '/contacts';
      const method = isEdit ? 'PUT' : 'POST';
      
      const saved = await apiRequest(method, endpoint, formData);
      setMessage({
        type: 'success',
        text: `Contact '${saved.name}' ${isEdit ? 'updated' : 'created'}! ${saved.autoProvisionedUser ? '(Auto-provisioned login user)' : ''}`
      });
      setShowModal(false);
      setEditData(null);
      if (view === 'list') {
        fetchContacts();
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleEdit = (contact) => {
    setEditData(contact);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return;
    try {
      await apiRequest('DELETE', `/contacts/${id}`);
      setMessage({ type: 'success', text: 'Contact deleted successfully.' });
      if (view === 'detail') {
        setView('list');
      } else {
        fetchContacts();
      }
      setSelectedId(null);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <>
      {view === 'detail' ? (
        <ContactDetail 
          contact={contacts.find(c => c.id === selectedId)}
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
                Contact Master
              </h2>
              <p className="text-xs text-[#6B5E55] dark:text-[#A89B91]">
                Manage Customers, Vendors, and auto-provisioned Contact Portal logins
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
                <span>Add New Contact</span>
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
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#9E9085]" />
              <input
                id="search-contacts"
                name="search-contacts"
                type="text"
                placeholder="Search contacts by name, email, or city..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] text-[#2C221E] dark:text-[#F5EFE6] focus:outline-none focus:ring-2 focus:ring-[#B45309]"
              />
            </div>

            <select
              id="filter-contacts"
              name="filter-contacts"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 text-xs rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] text-[#2C221E] dark:text-[#F5EFE6]"
            >
              <option value="">All Types (Customer & Vendor)</option>
              <option value="customer">Customers Only</option>
              <option value="vendor">Vendors Only</option>
              <option value="both">Both (Customer & Vendor)</option>
            </select>
          </div>

          {/* Contacts Grid */}
          {loading ? (
            <div className="text-center py-12 text-xs text-[#6B5E55]">Loading Contacts...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contacts.map(c => (
                <div 
                  key={c.id} 
                  onClick={() => {
                    setSelectedId(c.id);
                    setView('detail');
                  }}
                  className="p-4 rounded-xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] shadow-sm hover:shadow-md transition-shadow space-y-3 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#FAF6EE] dark:bg-[#29211D] border border-[#E6DFD5] dark:border-[#382D27] overflow-hidden flex items-center justify-center font-bold text-[#B45309]">
                        {c.profileImageUrl ? (
                          <img src={c.profileImageUrl} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{c.name.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6]">{c.name}</h3>
                        <span className="text-[10px] font-mono text-[#6B5E55]">ID: {c.id}</span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase ${
                      c.type === 'vendor' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                      c.type === 'customer' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                      'bg-purple-50 text-purple-800 border-purple-200'
                    }`}>
                      {c.type}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#6B5E55] dark:text-[#A89B91]">
                    {c.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-[#B45309]" />
                        <span>{c.email}</span>
                      </div>
                    )}
                    {c.mobile && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#B45309]" />
                        <span>{c.mobile}</span>
                      </div>
                    )}
                    {c.city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#B45309]" />
                        <span>{c.city}, {c.state || ''} {c.pincode || ''}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-[#E6DFD5]/50 dark:border-[#382D27] flex items-center justify-between text-[11px]">
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {c.userId ? 'Portal Login Provisioned' : 'Master Record'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pop-up Modal for Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl my-8">
            <ContactForm
              initialData={editData}
              onSave={handleSaveContact}
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
