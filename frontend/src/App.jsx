import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import ContactsModule from './components/ContactsModule.jsx';
import ProductsModule from './components/ProductsModule.jsx';
import AccountsModule from './components/AccountsModule.jsx';
import JournalsModule from './components/JournalsModule.jsx';
import TaxRatesModule from './components/TaxRatesModule.jsx';
import AnalyticAccountsModule from './components/AnalyticAccountsModule.jsx';
import AuthPage from './components/AuthPage.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { Users, Package, BookOpen, BookMarked, Percent, PieChart, ShieldCheck } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('uf_theme') || 'light');
  const [activeTab, setActiveTab] = useState('contacts');
  const { user } = useAuth();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('uf_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  if (!user) {
    return <AuthPage />;
  }

  const tabs = [
    { id: 'contacts', label: 'Contact Master', icon: Users },
    { id: 'products', label: 'Product Master', icon: Package },
    { id: 'accounts', label: 'Chart of Accounts', icon: BookOpen },
    { id: 'journals', label: 'Journals Master', icon: BookMarked },
    { id: 'tax-rates', label: 'Tax Rates', icon: Percent },
    { id: 'analytic-accounts', label: 'Analytic Accounts', icon: PieChart },
  ];

  return (
    <div className="min-h-screen bg-[#FAF6EE] dark:bg-[#120E0C] text-[#2C221E] dark:text-[#F5EFE6] transition-colors duration-200">
      <Navbar theme={theme} toggleTheme={toggleTheme} activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Module Status Header */}
        <div className="p-4 rounded-xl border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#B45309] text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-sm text-[#2C221E] dark:text-[#F5EFE6]">
                Dev 1 Architect Engine Active
              </h2>
              <p className="text-xs text-[#6B5E55] dark:text-[#A89B91]">
                Master Data Management, 2-Way JWT Auth & Supabase PostgreSQL Database Integration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
              ● Supabase DB Connected
            </span>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E6DFD5] dark:border-[#382D27]">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#B45309] text-white shadow-sm'
                    : 'bg-white dark:bg-[#1C1613] text-[#6B5E55] dark:text-[#A89B91] hover:text-[#2C221E] dark:hover:text-white border border-[#E6DFD5] dark:border-[#382D27]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Module Panel */}
        <div className="pt-2">
          {activeTab === 'contacts' && <ContactsModule />}
          {activeTab === 'products' && <ProductsModule />}
          {activeTab === 'accounts' && <AccountsModule />}
          {activeTab === 'journals' && <JournalsModule />}
          {activeTab === 'tax-rates' && <TaxRatesModule />}
          {activeTab === 'analytic-accounts' && <AnalyticAccountsModule />}
        </div>
      </main>
    </div>
  );
}
