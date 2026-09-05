import React, { useState, useEffect } from 'react';
import { apiRequest } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Users, Plus, Search, Filter, Mail, Phone, MapPin, CheckCircle, ShieldAlert, Image as ImageIcon } from 'lucide-react';

export default function ContactsModule() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'customer',
    email: '',
    mobile: '',
    city: '',
    state: '',
    pincode: '',
    profileImageUrl: ''
  });

  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchContacts();
  }, [filterType, search]);

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

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const created = await apiRequest('POST', '/contacts', formData);
      setMessage({
        type: 'success',
        text: `Contact '${created.name}' created! ${created.autoProvisionedUser ? '(Auto-provisioned login user)' : ''}`
      });
      setShowModal(false);
      setFormData({ name: '', type: 'customer', email: '', mobile: '', city: '', state: '', pincode: '', profileImageUrl: '' });
      fetchContacts();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
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
            onClick={() => setShowModal(true)}
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
            type="text"
            placeholder="Search contacts by name, email, or city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] text-[#2C221E] dark:text-[#F5EFE6] focus:outline-none focus:ring-2 focus:ring-[#B45309]"
          />
        </div>

        <select
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
            <div key={c.id} className="p-4 rounded-xl bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] shadow-sm hover:shadow-md transition-shadow space-y-3">
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

      {/* Add Contact Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="font-heading font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6]">
              Create New Contact Master
            </h3>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Azure Furniture Ltd."
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Contact Type *</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
                  >
                    <option value="customer">Customer</option>
                    <option value="vendor">Vendor</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Mobile Number</label>
                  <input
                    type="text"
                    placeholder="9876543210"
                    value={formData.mobile}
                    onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Email Address <span className="text-emerald-600 font-normal">(Auto-provisions Portal Login)</span>
                </label>
                <input
                  type="email"
                  placeholder="contact@company.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Ahmedabad"
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">State</label>
                  <input
                    type="text"
                    placeholder="Gujarat"
                    value={formData.state}
                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Pincode</label>
                  <input
                    type="text"
                    placeholder="380001"
                    value={formData.pincode}
                    onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Profile Image URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={formData.profileImageUrl}
                  onChange={e => setFormData({ ...formData, profileImageUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#B45309] hover:bg-[#92400E] text-white px-4 py-2 rounded-lg font-semibold cursor-pointer"
                >
                  Create Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
