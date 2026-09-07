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
import CustomerBillsModule from './components/CustomerBillsModule.jsx';
import PaymentsModule from './components/PaymentsModule.jsx';
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
  Scale, 
  LayoutDashboard,
  ShoppingCart,
  FileText,
  CreditCard,
  WalletCards
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

  // If role is contact, restrict default tab to 'my-bills'
  useEffect(() => {
    if (user && !isStaff) {
      if (activeTab !== 'my-bills') {
        setActiveTab('my-bills');
      }
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

  const allTabs = isStaff ? [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'sales-orders', label: 'Sales Orders', icon: ShoppingCart },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: ShoppingCart },
    { id: 'contacts', label: 'Contact Master', icon: Users },
    { id: 'products', label: 'Product Master', icon: Package },
    { id: 'accounts', label: 'Chart of Accounts', icon: BookOpen },
    { id: 'journals', label: 'Journals Master', icon: BookMarked },
    { id: 'tax-rates', label: 'Tax Rates', icon: Percent },
    { id: 'analytic-accounts', label: 'Analytic Accounts', icon: PieChart },
    { id: 'budgets', label: 'Budgets', icon: WalletCards },
    { id: 'vendor-bills', label: 'Vendor Bills', icon: FileText },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'reports', label: 'Reports & Statements', icon: Scale }
  ] : [
    { id: 'my-bills', label: 'My Purchases & Bills', icon: FileText }
  ];

  return (
    <div className="min-h-screen bg-[#FAF6EE] dark:bg-[#120E0C] text-[#2C221E] dark:text-[#F5EFE6] transition-colors duration-200 flex flex-col md:flex-row">
      <Sidebar theme={theme} toggleTheme={toggleTheme} activeTab={activeTab} setActiveTab={setActiveTab} allTabs={allTabs} />

      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6 md:h-screen overflow-y-auto">
        
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
          {activeTab === 'budgets' && <BudgetModule />}
          {activeTab === 'purchase-orders' && <PurchaseOrdersModule />}
          {activeTab === 'vendor-bills' && <VendorBillsModule />}
          {activeTab === 'payments' && <PaymentsModule />}
          {activeTab === 'my-bills' && <CustomerBillsModule />}
        </div>
      </main>
    </div>
  );
}