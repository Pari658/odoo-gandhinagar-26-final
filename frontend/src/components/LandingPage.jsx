import React from 'react';
import { ArrowRight, ShieldCheck, Database, LayoutDashboard, LayoutTemplate } from 'lucide-react';

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

        <div className="max-w-4xl mx-auto text-center space-y-8 z-10 py-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#B45309]/10 dark:bg-[#B45309]/20 text-[#B45309] dark:text-[#F3A358] border border-[#B45309]/20 font-medium text-sm mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B45309] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B45309]"></span>
            </span>
            System v2.0 Live
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold font-heading tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-br from-[#2C221E] to-[#6B5E55] dark:from-white dark:to-[#A89B91]">
            Next-Gen ERP for <br /> Modern Furniture Retail.
          </h1>
          
          <p className="text-lg md:text-xl text-[#6B5E55] dark:text-[#A89B91] max-w-2xl mx-auto leading-relaxed">
            Experience the Warm Timber & Sand Birch aesthetic. A completely integrated double-entry accounting engine with lightning-fast PostgreSQL backend and React frontend.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <button 
              onClick={onEnter}
              className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#B45309] to-[#92400e] text-white font-semibold text-lg hover:shadow-[0_0_40px_rgba(180,83,9,0.4)] transition-all hover:-translate-y-1 w-full sm:w-auto justify-center"
            >
              Access Portal
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white dark:bg-[#1C1613] text-[#2C221E] dark:text-white font-semibold text-lg border border-[#E6DFD5] dark:border-[#382D27] hover:bg-[#FAF6EE] dark:hover:bg-[#2C221E] transition-all w-full sm:w-auto justify-center">
              View Architecture
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-12 mb-20 z-10 w-full px-4">
          <FeatureCard 
            icon={Database} 
            title="Supabase PostgreSQL" 
            description="Bulletproof relational data integrity with native JSONB support."
          />
          <FeatureCard 
            icon={LayoutDashboard} 
            title="React + Vite + Tailwind" 
            description="Blazing fast interactive dashboards with Warm Timber design system."
          />
          <FeatureCard 
            icon={ShieldCheck} 
            title="RBAC & JWT Security" 
            description="Enterprise-grade stateless authentication and role-based access control."
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="p-6 rounded-2xl bg-white/60 dark:bg-[#1C1613]/60 backdrop-blur-xl border border-[#E6DFD5] dark:border-[#382D27] hover:border-[#B45309]/50 transition-colors group shadow-sm hover:shadow-xl">
      <div className="w-12 h-12 rounded-xl bg-[#FAF6EE] dark:bg-[#2C221E] flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[#B45309] transition-all duration-300">
        <Icon className="w-6 h-6 text-[#B45309] group-hover:text-white transition-colors" />
      </div>
      <h3 className="font-heading font-bold text-lg mb-2">{title}</h3>
      <p className="text-sm text-[#6B5E55] dark:text-[#A89B91] leading-relaxed">
        {description}
      </p>
    </div>
  );
}
