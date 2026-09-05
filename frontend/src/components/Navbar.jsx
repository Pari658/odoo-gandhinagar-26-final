import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Sun, Moon, LogOut, LogIn, Shield, User, Armchair, Key } from 'lucide-react';

export default function Navbar({ theme, toggleTheme }) {
  const { user, login, logout, loading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);

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

  const handleQuickPresetLogin = async (presetEmail, presetPass) => {
    setErrorMsg(null);
    try {
      await login(presetEmail, presetPass);
      setShowLoginModal(false);
    } catch (err) {
      setErrorMsg(err.message || 'Login failed');
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#FAF6EE]/90 dark:bg-[#120E0C]/90 border-b border-[#E6DFD5] dark:border-[#382D27] px-4 sm:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B45309] to-[#714B67] flex items-center justify-center text-white font-heading font-bold text-xl shadow-md shadow-[#B45309]/20">
              <Armchair className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6] leading-tight">
                  Urban Furniture
                </h1>
                <span className="bg-[#B45309]/10 text-[#B45309] dark:text-amber-400 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-[#B45309]/20">
                  Dev 1 Architect Engine
                </span>
              </div>
              <p className="text-xs text-[#6B5E55] dark:text-[#A89B91]">Foundation & Master Data Hub</p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="md:hidden p-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] text-[#2C221E] dark:text-[#F5EFE6]"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#786C62]" />}
          </button>
        </div>

        {/* User Session Profile & Theme Controls */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3 bg-white dark:bg-[#1C1613] px-3 py-1.5 rounded-xl border border-[#E6DFD5] dark:border-[#382D27] text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#FAF6EE] dark:bg-[#29211D] border border-[#E6DFD5] dark:border-[#382D27] flex items-center justify-center text-[#B45309] font-bold">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-[#2C221E] dark:text-[#F5EFE6]">{user.email}</div>
                  <span className="text-[10px] uppercase font-bold text-[#B45309] dark:text-amber-400">
                    Role: {user.role}
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                title="Logout"
                className="p-1.5 text-[#6B5E55] hover:text-red-600 dark:text-[#A89B91] dark:hover:text-red-400 transition-colors cursor-pointer ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="bg-[#B45309] hover:bg-[#92400E] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] text-xs font-medium text-[#2C221E] dark:text-[#F5EFE6] hover:bg-[#FAF6EE] dark:hover:bg-[#29211D] transition-all cursor-pointer shadow-sm"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-[#786C62]" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 max-w-md w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6] flex items-center gap-2">
                <Key className="w-5 h-5 text-[#B45309]" />
                <span>Sign In</span>
              </h3>
              <button onClick={() => setShowLoginModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 text-red-800 border border-red-200 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Login ID / Email Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. adminuser or admin@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D]"
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
    </header>
  );
}
