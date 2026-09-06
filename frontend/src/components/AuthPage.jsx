import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../api/client.js';
import { Armchair, Key, UserPlus, ArrowRight, CheckCircle2, HelpCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function AuthPage({ onBack }) {
  const { login, signup, loading } = useAuth();
  
  // View Modes: 'login' | 'signup' | 'forgot' | 'reset'
  const [mode, setMode] = useState('login');

  // Form Fields
  const [loginInput, setLoginInput] = useState(''); // Email or Login ID for sign in / forgot password
  const [name, setName] = useState('');
  const [loginId, setLoginId] = useState('');       // 6-12 characters for signup
  const [email, setEmail] = useState('');           // Email for signup
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState('customer');     // customer | vendor | both
  const [resetToken, setResetToken] = useState(''); // Store the reset token

  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const resetMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const switchMode = (newMode) => {
    resetMessages();
    setMode(newMode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetMessages();

    if (mode === 'signup') {
      // 1. Login Id Validation: 6-12 characters
      const cleanLoginId = loginId.trim();
      if (!cleanLoginId || cleanLoginId.length < 6 || cleanLoginId.length > 12) {
        setErrorMsg('Login Id Should be unique and must be in between 6-12 characters.');
        return;
      }

      // 2. Email check
      const cleanEmail = email.trim();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        setErrorMsg('Please enter a valid email address.');
        return;
      }

      // 3. Password Complexity Check (small case, large case, special char, length > 8)
      const hasSmall = /[a-z]/.test(password);
      const hasLarge = /[A-Z]/.test(password);
      const hasSpecial = /[^A-Za-z0-9]/.test(password);
      const isMoreThan8 = password.length > 8;

      if (!hasSmall || !hasLarge || !hasSpecial || !isMoreThan8) {
        setErrorMsg('password must be unique and must contain a small case, a large case and a special character and length should be more than 8 characters');
        return;
      }

      // 4. Confirm Password match
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match');
        return;
      }

      try {
        await signup({
          name,
          loginId: cleanLoginId,
          email: cleanEmail,
          password,
          role
        });
        setSuccessMsg('Account created successfully!');
      } catch (err) {
        setErrorMsg(err.message || 'Signup failed');
      }
    } else if (mode === 'login') {
      if (!loginInput) {
        setErrorMsg('Please enter your Login ID or Email Address');
        return;
      }
      if (!password) {
        setErrorMsg('Please enter your Password');
        return;
      }

      try {
        await login(loginInput.trim(), password);
      } catch (err) {
        setErrorMsg(err.message || 'Invalid Login Id or Password');
      }
    } else if (mode === 'forgot') {
      if (!loginInput) {
        setErrorMsg('Please enter your registered Login ID or Email Address');
        return;
      }
      try {
        const res = await apiRequest('POST', '/auth/forgot-password', { loginId: loginInput, email: loginInput });
        if (res.devToken) {
          setSuccessMsg(`Dev Mode: Token generated successfully! Please copy it if needed. Auto-filled below.`);
          setResetToken(res.devToken);
          setMode('reset');
        } else {
          setSuccessMsg('If an account exists, a reset link was generated.');
        }
      } catch (err) {
        setErrorMsg(err.message || 'Failed to request password reset');
      }
    } else if (mode === 'reset') {
      if (!resetToken || !password || !confirmPassword) {
        setErrorMsg('Please fill in all fields');
        return;
      }
      
      const hasSmall = /[a-z]/.test(password);
      const hasLarge = /[A-Z]/.test(password);
      const hasSpecial = /[^A-Za-z0-9]/.test(password);
      const isMoreThan8 = password.length > 8;

      if (!hasSmall || !hasLarge || !hasSpecial || !isMoreThan8) {
        setErrorMsg('Password must be unique and must contain a small case, a large case and a special character and length should be more than 8 characters');
        return;
      }

      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match');
        return;
      }

      try {
        await apiRequest('POST', '/auth/reset-password', { token: resetToken, newPassword: password });
        setSuccessMsg('Password has been reset successfully! You can now log in.');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      } catch (err) {
        setErrorMsg(err.message || 'Failed to reset password');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE] dark:bg-[#120E0C] text-[#2C221E] dark:text-[#F5EFE6] flex flex-col items-center justify-center p-4 relative">
      
      {/* Back Button */}
      {onBack && (
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#1C1613] text-[#6B5E55] dark:text-[#A89B91] font-semibold text-sm hover:text-[#B45309] dark:hover:text-[#B45309] border border-[#E6DFD5] dark:border-[#382D27] hover:border-[#B45309]/50 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
      )}

      <div className="max-w-md w-full space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#B45309] to-[#714B67] text-white shadow-lg shadow-[#B45309]/20 mb-2">
            <Armchair className="w-7 h-7 text-amber-100" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-[#2C221E] dark:text-[#F5EFE6] tracking-tight">
            Urban Furniture System
          </h1>
          <p className="text-xs text-[#6B5E55] dark:text-[#A89B91]">
            Accounting & Master Data Portal
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-[#1C1613] rounded-2xl border border-[#E6DFD5] dark:border-[#382D27] p-6 shadow-xl space-y-5">
          
          {/* Card Header Title */}
          <div className="flex items-center justify-between border-b border-[#E6DFD5]/60 dark:border-[#382D27] pb-3">
            <h2 className="font-heading font-bold text-base text-[#2C221E] dark:text-[#F5EFE6] flex items-center gap-2">
              {mode === 'signup' && <UserPlus className="w-5 h-5 text-[#714B67]" />}
              {mode === 'login' && <Key className="w-5 h-5 text-[#B45309]" />}
              {mode === 'forgot' && <HelpCircle className="w-5 h-5 text-amber-600" />}
              {mode === 'reset' && <Key className="w-5 h-5 text-amber-600" />}
              <span>
                {mode === 'signup' && 'Create Account'}
                {mode === 'login' && 'Sign In'}
                {mode === 'forgot' && 'Reset Password'}
                {mode === 'reset' && 'Set New Password'}
              </span>
            </h2>
            <span className="text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
              {mode === 'signup' && 'Invoicing User Signup'}
              {mode === 'login' && 'User Portal'}
              {mode === 'forgot' && 'Password Recovery'}
              {mode === 'reset' && 'Account Recovery'}
            </span>
          </div>

          {/* Feedback Banners */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 text-red-800 border border-red-200 text-xs font-medium leading-relaxed">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium flex items-center gap-1.5 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* LOGIN MODE */}
            {mode === 'login' && (
              <>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Login ID / Email Address *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your Login ID or Email"
                    value={loginInput}
                    onChange={e => setLoginInput(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6] focus:outline-none focus:ring-2 focus:ring-[#B45309]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold">
                      Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-[11px] font-semibold text-[#B45309] hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-3 py-2.5 pr-10 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6] focus:outline-none focus:ring-2 focus:ring-[#B45309]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B5E55] dark:text-[#A89B91] hover:text-[#B45309] cursor-pointer"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* SIGNUP MODE */}
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Full Name / Business Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Nimesh Pathak"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6] focus:outline-none focus:ring-2 focus:ring-[#B45309]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Login ID * <span className="text-[10px] text-[#6B5E55] font-normal">(6-12 characters, unique)</span>
                  </label>
                  <input
                    type="text"
                    required
                    minLength={6}
                    maxLength={12}
                    placeholder="e.g. nimesh123"
                    value={loginId}
                    onChange={e => setLoginId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6] focus:outline-none focus:ring-2 focus:ring-[#B45309]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Email Address * <span className="text-[10px] text-[#6B5E55] font-normal">(Must be unique)</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6] focus:outline-none focus:ring-2 focus:ring-[#B45309]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={e => {
                          setPassword(e.target.value);
                          if (errorMsg) setErrorMsg(null);
                        }}
                        className="w-full px-3 py-2.5 pr-9 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6] focus:outline-none focus:ring-2 focus:ring-[#B45309]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B5E55] dark:text-[#A89B91] hover:text-[#B45309] cursor-pointer"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 flex items-center justify-between">
                      <span>Re-enter Password *</span>
                      {confirmPassword && (
                        password === confirmPassword ? (
                          <span className="text-[10px] text-emerald-600 font-bold">✓ Match</span>
                        ) : (
                          <span className="text-[10px] text-red-500 font-bold">✕ Mismatch</span>
                        )
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={e => {
                          setConfirmPassword(e.target.value);
                          if (errorMsg) setErrorMsg(null);
                        }}
                        className={`w-full px-3 py-2.5 pr-9 rounded-lg border bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6] focus:outline-none focus:ring-2 ${
                          confirmPassword ? (
                            password === confirmPassword 
                              ? 'border-emerald-500 focus:ring-emerald-500' 
                              : 'border-red-500 focus:ring-red-500'
                          ) : 'border-[#E6DFD5] dark:border-[#382D27] focus:ring-[#B45309]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B5E55] dark:text-[#A89B91] hover:text-[#B45309] cursor-pointer"
                        title={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg border border-[#E6DFD5]/70 dark:border-[#382D27] bg-[#FAF6EE]/50 dark:bg-[#29211D]/40 text-[10px] space-y-1">
                  <span className="font-semibold block text-[#6B5E55] dark:text-[#A89B91]">Password Requirements:</span>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                    <span className={password.length > 8 ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                      {password.length > 8 ? '✓' : '•'} Length &gt; 8 chars
                    </span>
                    <span className={/[a-z]/.test(password) ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                      {/[a-z]/.test(password) ? '✓' : '•'} Lowercase letter (a-z)
                    </span>
                    <span className={/[A-Z]/.test(password) ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                      {/[A-Z]/.test(password) ? '✓' : '•'} Uppercase letter (A-Z)
                    </span>
                    <span className={/[^A-Za-z0-9]/.test(password) ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                      {/[^A-Za-z0-9]/.test(password) ? '✓' : '•'} Special char (!@#...)
                    </span>
                  </div>
                </div>

                {/* Account Category Selection */}
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
                    Account Category *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('customer')}
                      className={`p-2 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                        role === 'customer'
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'border-[#E6DFD5] dark:border-[#382D27] text-[#6B5E55]'
                      }`}
                    >
                      🛒 Customer
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('vendor')}
                      className={`p-2 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                        role === 'vendor'
                          ? 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'border-[#E6DFD5] dark:border-[#382D27] text-[#6B5E55]'
                      }`}
                    >
                      🚚 Vendor
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('both')}
                      className={`p-2 rounded-xl border text-center font-semibold transition-all cursor-pointer ${
                        role === 'both'
                          ? 'bg-purple-50 text-purple-900 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300'
                          : 'border-[#E6DFD5] dark:border-[#382D27] text-[#6B5E55]'
                      }`}
                    >
                      🤝 Both
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* FORGOT PASSWORD MODE */}
            {mode === 'forgot' && (
              <>
                <p className="text-xs text-[#6B5E55] dark:text-[#A89B91]">
                  Enter your registered Login ID or Email address below to receive password recovery instructions.
                </p>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Login ID / Email Address *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your Login ID or Email"
                    value={loginInput}
                    onChange={e => setLoginInput(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6] focus:outline-none focus:ring-2 focus:ring-[#B45309]"
                  />
                </div>
              </>
            )}

            {/* RESET PASSWORD MODE */}
            {mode === 'reset' && (
              <>
                <p className="text-xs text-[#6B5E55] dark:text-[#A89B91]">
                  Enter the reset token (auto-filled for this demo) and your new password.
                </p>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Reset Token *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter reset token"
                    value={resetToken}
                    onChange={e => setResetToken(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6] focus:outline-none focus:ring-2 focus:ring-[#B45309]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                      New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={e => {
                          setPassword(e.target.value);
                          if (errorMsg) setErrorMsg(null);
                        }}
                        className="w-full px-3 py-2.5 pr-9 rounded-lg border border-[#E6DFD5] dark:border-[#382D27] bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6] focus:outline-none focus:ring-2 focus:ring-[#B45309]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B5E55] dark:text-[#A89B91] hover:text-[#B45309] cursor-pointer"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 flex items-center justify-between">
                      <span>Confirm New Password *</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={e => {
                          setConfirmPassword(e.target.value);
                          if (errorMsg) setErrorMsg(null);
                        }}
                        className={`w-full px-3 py-2.5 pr-9 rounded-lg border bg-[#FAF6EE] dark:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6] focus:outline-none focus:ring-2 ${
                          confirmPassword ? (
                            password === confirmPassword 
                              ? 'border-emerald-500 focus:ring-emerald-500' 
                              : 'border-red-500 focus:ring-red-500'
                          ) : 'border-[#E6DFD5] dark:border-[#382D27] focus:ring-[#B45309]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B5E55] dark:text-[#A89B91] hover:text-[#B45309] cursor-pointer"
                        title={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg border border-[#E6DFD5]/70 dark:border-[#382D27] bg-[#FAF6EE]/50 dark:bg-[#29211D]/40 text-[10px] space-y-1">
                  <span className="font-semibold block text-[#6B5E55] dark:text-[#A89B91]">Password Requirements:</span>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                    <span className={password.length > 8 ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                      {password.length > 8 ? '✓' : '•'} Length &gt; 8 chars
                    </span>
                    <span className={/[a-z]/.test(password) ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                      {/[a-z]/.test(password) ? '✓' : '•'} Lowercase letter (a-z)
                    </span>
                    <span className={/[A-Z]/.test(password) ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                      {/[A-Z]/.test(password) ? '✓' : '•'} Uppercase letter (A-Z)
                    </span>
                    <span className={/[^A-Za-z0-9]/.test(password) ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                      {/[^A-Za-z0-9]/.test(password) ? '✓' : '•'} Special char (!@#...)
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-lg text-xs font-bold text-white shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-[#714B67] hover:bg-[#593950]'
                  : 'bg-[#B45309] hover:bg-[#92400E]'
              }`}
            >
              {loading ? 'Processing...' : (
                mode === 'signup' ? 'Create Account' : (
                  mode === 'forgot' ? 'Send Password Reset Link' : (
                    mode === 'reset' ? 'Reset Password' : 'Sign In'
                  )
                )
              )}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Bottom View Switcher Links */}
          <div className="pt-3 border-t border-[#E6DFD5]/60 dark:border-[#382D27] text-center text-xs">
            {mode === 'signup' && (
              <p className="text-[#6B5E55] dark:text-[#A89B91]">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="font-bold text-[#B45309] hover:underline cursor-pointer"
                >
                  Log in
                </button>
              </p>
            )}

            {mode === 'login' && (
              <p className="text-[#6B5E55] dark:text-[#A89B91]">
                Haven't signed up yet?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="font-bold text-[#714B67] hover:underline cursor-pointer"
                >
                  Sign up
                </button>
              </p>
            )}

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="inline-flex items-center gap-1 font-bold text-[#B45309] hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}