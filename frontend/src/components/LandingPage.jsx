import React from 'react';
import { ArrowRight, LayoutTemplate, PackagePlus, ShoppingCart, TrendingUp } from 'lucide-react';

export default function LandingPage({ onEnter }) {
  return (
    <div className="min-h-screen bg-[#FAF6EE] dark:bg-[#120E0C] text-[#2C221E] dark:text-[#F5EFE6] selection:bg-[#B45309] selection:text-white transition-colors duration-300 flex flex-col">
      
      {/* Navbar */}
      <nav className="w-full px-6 py-4 flex items-center justify-between border-b border-[#E6DFD5] dark:border-[#382D27] bg-white/50 dark:bg-[#1C1613]/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#B45309] to-[#92400e] rounded-xl flex items-center justify-center shadow-lg shadow-[#B45309]/20">
            <LayoutTemplate className="text-white w-6 h-6" />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight">Urban<span className="text-[#B45309]">Furniture</span></span>
        </div>
        <button 
          onClick={onEnter}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2C221E] dark:bg-white text-white dark:text-[#120E0C] font-semibold text-sm hover:bg-[#B45309] dark:hover:bg-[#B45309] dark:hover:text-white transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5"
        >
          Sign In / Sign Up
          <ArrowRight className="w-4 h-4" />
        </button>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        
        {/* Background glow effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-[#B45309]/10 to-[#714B67]/10 dark:from-[#B45309]/20 dark:to-[#714B67]/20 blur-3xl rounded-full -z-10 animate-pulse-slow"></div>

        <div className="max-w-4xl mx-auto text-center space-y-6 z-10 py-10">
          
          <h1 className="text-4xl md:text-6xl font-bold font-heading tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-br from-[#2C221E] to-[#6B5E55] dark:from-white dark:to-[#A89B91]">
            Next-Gen ERP for <br /> Modern Furniture Retail.
          </h1>
          
          <p className="text-lg md:text-xl text-[#6B5E55] dark:text-[#A89B91] max-w-2xl mx-auto leading-relaxed">
            Manage your inventory, sales, and accounting all in one place with a simple, integrated system built for growing furniture businesses.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button 
              onClick={onEnter}
              className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#B45309] to-[#92400e] text-white font-semibold text-lg hover:shadow-[0_0_40px_rgba(180,83,9,0.4)] transition-all hover:-translate-y-1 w-full sm:w-auto justify-center"
            >
              Access Portal
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* How it Works Section */}
        <div className="max-w-5xl mx-auto w-full px-4 pb-12 z-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-[#2C221E] dark:text-[#F5EFE6]">
              How it works
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-transparent via-[#B45309]/30 to-transparent -z-10"></div>
            
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-20 h-20 rounded-full bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] flex items-center justify-center shadow-lg relative">
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#B45309] text-white flex items-center justify-center font-bold text-xs border-2 border-[#FAF6EE] dark:border-[#120E0C]">1</div>
                <PackagePlus className="w-8 h-8 text-[#B45309]" />
              </div>
              <h3 className="font-heading font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6]">Add Inventory</h3>
              <p className="text-[#6B5E55] dark:text-[#A89B91] text-xs leading-relaxed max-w-xs">
                Easily input your raw materials and finished furniture into the smart catalog.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-20 h-20 rounded-full bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] flex items-center justify-center shadow-lg relative">
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#B45309] text-white flex items-center justify-center font-bold text-xs border-2 border-[#FAF6EE] dark:border-[#120E0C]">2</div>
                <ShoppingCart className="w-8 h-8 text-[#B45309]" />
              </div>
              <h3 className="font-heading font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6]">Make Sales</h3>
              <p className="text-[#6B5E55] dark:text-[#A89B91] text-xs leading-relaxed max-w-xs">
                Process customer orders quickly with our intuitive Sales Kanban board.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-20 h-20 rounded-full bg-white dark:bg-[#1C1613] border border-[#E6DFD5] dark:border-[#382D27] flex items-center justify-center shadow-lg relative">
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#B45309] text-white flex items-center justify-center font-bold text-xs border-2 border-[#FAF6EE] dark:border-[#120E0C]">3</div>
                <TrendingUp className="w-8 h-8 text-[#B45309]" />
              </div>
              <h3 className="font-heading font-bold text-lg text-[#2C221E] dark:text-[#F5EFE6]">Track Profit</h3>
              <p className="text-[#6B5E55] dark:text-[#A89B91] text-xs leading-relaxed max-w-xs">
                Watch your accounting ledgers and budgets update in real-time.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full py-4 text-center border-t border-[#E6DFD5] dark:border-[#382D27] text-xs text-[#6B5E55] dark:text-[#A89B91] bg-white/50 dark:bg-[#1C1613]/50 backdrop-blur-sm z-10">
        &copy; {new Date().getFullYear()} UrbanFurniture ERP. All rights reserved.
      </footer>
    </div>
  );
}
