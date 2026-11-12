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
      <div className="flex gap-1.5 border-b border-border pb-3 overflow-x-auto">
        <button
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          <LayoutDashboard size={15} />
          <span>Hospital Overview</span>
        </button>
        <button
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'staff'
              ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
          onClick={() => setActiveTab('staff')}
        >
          <Users size={15} />
          <span>Staff & RBAC Control</span>
        </button>
        <button
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'financials'
              ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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
