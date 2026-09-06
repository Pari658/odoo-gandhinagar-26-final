import React from 'react';
import { Mail, Phone, MapPin, CheckCircle, ArrowLeft, Edit2, Trash2 } from 'lucide-react';

export default function ContactDetail({ contact, onBack, onEdit, onDelete }) {
  if (!contact) {
    return <div className="text-center py-12 text-[#6B5E55]">Contact not found</div>;
  }

  return (
    <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-[#E6DFD5] dark:border-[#382D27] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-[#FAF6EE] dark:hover:bg-[#29211D] text-[#6B5E55] dark:text-[#A89B91] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#FAF6EE] dark:bg-[#29211D] border border-[#E6DFD5] dark:border-[#382D27] overflow-hidden flex items-center justify-center font-bold text-lg text-[#B45309]">
              {contact.profileImageUrl ? (
                <img src={contact.profileImageUrl} alt={contact.name} className="w-full h-full object-cover" />
              ) : (
                <span>{contact.name.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h2 className="font-heading font-bold text-xl text-[#2C221E] dark:text-[#F5EFE6]">
                {contact.name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono text-[#6B5E55]">ID: {contact.id}</span>
                <span className="text-[#E6DFD5] dark:text-[#382D27]">|</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase ${
                  contact.type === 'vendor' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                  contact.type === 'customer' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                  'bg-purple-50 text-purple-800 border-purple-200'
                }`}>
                  {contact.type}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(contact)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#29211D] text-xs font-medium cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit</span>
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(contact.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20 text-xs font-medium cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-bold text-[#6B5E55] dark:text-[#A89B91] uppercase tracking-wider mb-4 border-b border-[#E6DFD5] dark:border-[#382D27] pb-2">
              Contact Information
            </h3>
            <div className="space-y-4 text-sm text-[#2C221E] dark:text-[#F5EFE6]">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#B45309]" />
                <span className="font-medium">{contact.email || 'No email provided'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#B45309]" />
                <span className="font-medium">{contact.mobile || 'No mobile provided'}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-[#6B5E55] dark:text-[#A89B91] uppercase tracking-wider mb-4 border-b border-[#E6DFD5] dark:border-[#382D27] pb-2">
              Address Information
            </h3>
            <div className="space-y-2 text-sm text-[#2C221E] dark:text-[#F5EFE6]">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#B45309] mt-0.5" />
                <div>
                  <div className="font-medium">{contact.city || 'No city provided'}</div>
                  <div className="text-[#6B5E55] dark:text-[#A89B91]">
                    {contact.state || ''} {contact.pincode || ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-bold text-[#6B5E55] dark:text-[#A89B91] uppercase tracking-wider mb-4 border-b border-[#E6DFD5] dark:border-[#382D27] pb-2">
              System Details
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-[#6B5E55] dark:text-[#A89B91] text-xs">Portal Access</span>
                <span className={`font-medium flex items-center gap-1 ${contact.userId ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                  <CheckCircle className="w-4 h-4" />
                  {contact.userId ? 'Portal Login Provisioned' : 'Not Provisioned'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[#6B5E55] dark:text-[#A89B91] text-xs">Record Creation Date</span>
                <span className="font-medium text-[#2C221E] dark:text-[#F5EFE6]">
                  {new Date(contact.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
