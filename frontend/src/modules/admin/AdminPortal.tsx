import React, { useState } from 'react';
import { LayoutDashboard, Users, CreditCard } from 'lucide-react';
import { AdminDashboard } from './pages/AdminDashboard';
import { StaffDirectoryPage } from './pages/StaffDirectoryPage';
import { HospitalFinancialsPage } from './pages/HospitalFinancialsPage';

export const AdminPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'staff' | 'financials'>('overview');

  return (
    <div className="flex flex-col gap-6">
      {/* Subnavigation */}
      <div className="flex gap-1.5 border-b border-mono-800 pb-2 overflow-x-auto">
        <button
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'text-white bg-mono-800 border border-mono-700 font-bold'
              : 'text-mono-400 hover:text-white hover:bg-mono-900 border border-transparent'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          <LayoutDashboard size={15} />
          <span>Hospital Overview</span>
        </button>
        <button
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'staff'
              ? 'text-white bg-mono-800 border border-mono-700 font-bold'
              : 'text-mono-400 hover:text-white hover:bg-mono-900 border border-transparent'
          }`}
          onClick={() => setActiveTab('staff')}
        >
          <Users size={15} />
          <span>Staff & RBAC Control</span>
        </button>
        <button
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'financials'
              ? 'text-white bg-mono-800 border border-mono-700 font-bold'
              : 'text-mono-400 hover:text-white hover:bg-mono-900 border border-transparent'
          }`}
          onClick={() => setActiveTab('financials')}
        >
          <CreditCard size={15} />
          <span>Billing & Financials</span>
        </button>
      </div>

      <div>
        {activeTab === 'overview' && <AdminDashboard />}
        {activeTab === 'staff' && <StaffDirectoryPage />}
        {activeTab === 'financials' && <HospitalFinancialsPage />}
      </div>
    </div>
  );
};
