import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Sun, Moon, LogOut, LogIn, Armchair, Key, Menu, X, User } from 'lucide-react';

export default function Sidebar({ theme, toggleTheme, activeTab, setActiveTab, allTabs }) {
  const { user, login, logout, loading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await login(email, password);
      setShowLoginModal(false);
      setEmail('');
      setPassword('');
    } catch (err) {
      setErrorMsg(err.message || 'Login failed');
    }
  };

  return (
    <>
      {/* Mobile Header (visible only on small screens) */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-[#1C1613] border-b border-[#E6DFD5] dark:border-[#382D27] z-20 relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#B45309] to-[#714B67] flex items-center justify-center text-white shadow-sm">
            <Armchair className="w-4 h-4 text-amber-100" />
          </div>
          <h1 className="font-heading font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6]">
            Urban Furniture
          </h1>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 -mr-2 text-[#6B5E55] dark:text-[#A89B91]">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-[#1C1613] border-r border-[#E6DFD5] dark:border-[#382D27] transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0 mt-[65px] md:mt-0' : '-translate-x-full'} flex flex-col`}>
        
        {/* Brand Header (Desktop) */}
        <div className="hidden md:flex flex-col items-center p-6 border-b border-[#E6DFD5] dark:border-[#382D27]">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#B45309] to-[#714B67] flex items-center justify-center text-white shadow-md shadow-[#B45309]/20 mb-4">
            <Armchair className="w-7 h-7 text-amber-100" />
          </div>
          <h1 className="font-heading font-bold text-xl text-[#2C221E] dark:text-[#F5EFE6] text-center leading-tight">
            Urban Furniture
          </h1>
          <p className="text-xs text-[#6B5E55] dark:text-[#A89B91] mt-1 text-center font-medium">Accounting & ERP System</p>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 custom-scrollbar">
          {allTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#B45309] text-white shadow-sm'
                    : 'text-[#6B5E55] dark:text-[#A89B91] hover:bg-[#FAF6EE] dark:hover:bg-[#29211D] hover:text-[#2C221E] dark:hover:text-[#F5EFE6]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-amber-100' : 'opacity-70'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Profile & Theme Footer */}
        <div className="p-4 border-t border-[#E6DFD5] dark:border-[#382D27] space-y-3 bg-white dark:bg-[#1C1613]">
          


          {user ? (
            <div className="flex items-center justify-between bg-[#FAF6EE] dark:bg-[#29211D] px-3 py-3 rounded-xl border border-[#E6DFD5] dark:border-[#382D27]">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 shrink-0 rounded-full bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] flex items-center justify-center text-[#B45309]">
                  <User className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="font-semibold text-xs text-[#2C221E] dark:text-[#F5EFE6] truncate">{user.email}</div>
                  <div className="text-[10px] uppercase font-bold text-[#B45309] dark:text-amber-400 mt-0.5">
                    Role: {user.role}
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                title="Logout"
                className="p-2 text-[#6B5E55] hover:text-red-600 dark:text-[#A89B91] dark:hover:text-red-400 transition-colors shrink-0 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="w-full bg-[#B45309] hover:bg-[#92400E] text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden mt-[65px]"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6] flex items-center gap-2">
                <Key className="w-5 h-5 text-[#B45309]" />
                <span>Sign In</span>
              </h3>
              <button onClick={() => setShowLoginModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 text-red-800 border border-red-200 text-xs">
                {errorMsg}
              </div>
            )}
            <form onSubmit={handleLoginSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Login ID / Email</label>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] focus:ring-2 focus:ring-[#B45309] outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] focus:ring-2 focus:ring-[#B45309] outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#B45309] hover:bg-[#92400E] text-white py-2 rounded-lg font-semibold cursor-pointer"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
