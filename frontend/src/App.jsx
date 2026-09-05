import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.jsx';
import ContactsModule from './components/ContactsModule.jsx';
import ProductsModule from './components/ProductsModule.jsx';
import AccountsModule from './components/AccountsModule.jsx';
import JournalsModule from './components/JournalsModule.jsx';
import TaxRatesModule from './components/TaxRatesModule.jsx';
import AnalyticAccountsModule from './components/AnalyticAccountsModule.jsx';
import PurchaseOrdersModule from './components/PurchaseOrdersModule.jsx';
import VendorBillsModule from './components/VendorBillsModule.jsx';
import SalesOrdersModule from './components/SalesOrdersModule.jsx';
import ReportsModule from './components/ReportsModule.jsx';
import BudgetModule from './components/BudgetModule.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import AuthPage from './components/AuthPage.jsx';
import LandingPage from './components/LandingPage.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { 
  Users, 
  Package, 
  BookOpen, 
  BookMarked, 
  Percent, 
  PieChart, 
  ShieldCheck, 
  Scale, 
  LayoutDashboard,
  ShoppingCart,
  Sun,
  Moon,
  FileText,
  Wallet
} from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('uf_theme') || 'light');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLanding, setShowLanding] = useState(true);
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

  const isStaff = user?.role === 'admin' || user?.role === 'accountant';

  // If role is contact and activeTab is reports or dashboard, fallback to contacts
  useEffect(() => {
    if (user && !isStaff && (activeTab === 'reports' || activeTab === 'dashboard')) {
      setActiveTab('contacts');
    }
  }, [user, isStaff, activeTab]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  if (!user) {
    if (showLanding) {
      return <LandingPage onEnter={() => setShowLanding(false)} />;
    }
    return <AuthPage onBack={() => setShowLanding(true)} />;
  }

  const allTabs = [
    ...(isStaff ? [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'reports', label: 'Reports & Statements', icon: Scale }
    ] : []),
    { id: 'sales-orders', label: 'Sales Orders', icon: ShoppingCart },
    { id: 'contacts', label: 'Contact Master', icon: Users },
    { id: 'products', label: 'Product Master', icon: Package },
    { id: 'accounts', label: 'Chart of Accounts', icon: BookOpen },
    { id: 'journals', label: 'Journals Master', icon: BookMarked },
    { id: 'tax-rates', label: 'Tax Rates', icon: Percent },
    { id: 'analytic-accounts', label: 'Analytic Accounts', icon: PieChart },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
    { id: 'vendor-bills', label: 'Vendor Bills', icon: FileText },
    { id: 'budget', label: 'Budget', icon: Wallet }
  ];

  return (
    <div className="min-h-screen bg-[#FAF6EE] dark:bg-[#120E0C] text-[#2C221E] dark:text-[#F5EFE6] transition-colors duration-200 flex flex-col md:flex-row">
      <Sidebar theme={theme} toggleTheme={toggleTheme} activeTab={activeTab} setActiveTab={setActiveTab} allTabs={allTabs} />

      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6 md:h-screen overflow-y-auto">
        
        {/* Top Action Bar */}
        <div className="flex items-center justify-end">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] text-xs font-semibold text-[#2C221E] dark:text-[#F5EFE6] hover:bg-[#FAF6EE] dark:hover:bg-[#29211D] transition-all cursor-pointer shadow-sm"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[#786C62]" />
                <span>Dark</span>
              </>
            )}
          </button>
            </div>





        {/* Active Module Panel */}
        <div className="pt-2">
          {activeTab === 'dashboard' && <AdminDashboard onNavigate={setActiveTab} />}
          {activeTab === 'reports' && <ReportsModule />}
          {activeTab === 'sales-orders' && <SalesOrdersModule />}
          {activeTab === 'contacts' && <ContactsModule />}
          {activeTab === 'products' && <ProductsModule />}
          {activeTab === 'accounts' && <AccountsModule />}
          {activeTab === 'journals' && <JournalsModule />}
          {activeTab === 'tax-rates' && <TaxRatesModule />}
          {activeTab === 'analytic-accounts' && <AnalyticAccountsModule />}
          {activeTab === 'purchase-orders' && <PurchaseOrdersModule />}
          {activeTab === 'vendor-bills' && <VendorBillsModule />}
          {activeTab === 'budget' && <BudgetModule />}
        </div>
      </main>
    </div>
  );
}