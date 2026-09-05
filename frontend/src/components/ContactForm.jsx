import React, { useState } from 'react';

export default function ContactForm({ initialData, onSave, onCancel }) {
  const [formData, setFormData] = useState(
    initialData || {
      name: '',
      type: 'customer',
      email: '',
      mobile: '',
      city: '',
      state: '',
      pincode: '',
      profileImageUrl: ''
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading font-bold text-xl text-[#2C221E] dark:text-[#F5EFE6]">
          {initialData ? 'Edit Contact Master' : 'Create New Contact Master'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div>
          <label htmlFor="contactName" className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Contact Name *</label>
          <input
            id="contactName"
            name="contactName"
            type="text"
            required
            placeholder="e.g. Azure Furniture Ltd."
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contactType" className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Contact Type *</label>
            <select
              id="contactType"
              name="contactType"
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
            <label htmlFor="mobile" className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Mobile Number</label>
            <input
              id="mobile"
              name="mobile"
              type="text"
              placeholder="9876543210"
              value={formData.mobile}
              onChange={e => setFormData({ ...formData, mobile: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
            Email Address <span className="text-emerald-600 font-normal">(Auto-provisions Portal Login)</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="contact@company.com"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="city" className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">City</label>
            <input
              id="city"
              name="city"
              type="text"
              placeholder="Ahmedabad"
              value={formData.city}
              onChange={e => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
            />
          </div>
          <div>
            <label htmlFor="state" className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">State</label>
            <input
              id="state"
              name="state"
              type="text"
              placeholder="Gujarat"
              value={formData.state}
              onChange={e => setFormData({ ...formData, state: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
            />
          </div>
          <div>
            <label htmlFor="pincode" className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Pincode</label>
            <input
              id="pincode"
              name="pincode"
              type="text"
              placeholder="380001"
              value={formData.pincode}
              onChange={e => setFormData({ ...formData, pincode: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="profileImageUrl" className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Profile Image URL</label>
          <input
            id="profileImageUrl"
            name="profileImageUrl"
            type="text"
            placeholder="https://..."
            value={formData.profileImageUrl}
            onChange={e => setFormData({ ...formData, profileImageUrl: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
          />
        </div>

        <div className="pt-6 flex items-center justify-end gap-3 border-t border-[#E6DFD5] dark:border-[#382D27]">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl border border-[#E6DFD5] dark:border-[#382D27] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#29211D] font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-[#B45309] hover:bg-[#92400E] text-white px-6 py-2.5 rounded-xl font-semibold transition-colors cursor-pointer shadow-sm"
          >
            {initialData ? 'Update Contact' : 'Create Contact'}
          </button>
        </div>
      </form>
    </div>
  );
}
