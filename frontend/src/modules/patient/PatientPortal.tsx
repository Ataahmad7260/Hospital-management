import React, { useState } from 'react';
import { LayoutDashboard, Calendar, FileText, CreditCard } from 'lucide-react';
import { PatientDashboard } from './pages/PatientDashboard';
import { BookAppointmentPage } from './pages/BookAppointmentPage';
import { PatientPrescriptionsPage } from './pages/PatientPrescriptionsPage';
import { PatientBillingPage } from './pages/PatientBillingPage';

export const PatientPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'book' | 'prescriptions' | 'billing'>('overview');

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
          <span>Patient Overview</span>
        </button>
        <button
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'book'
              ? 'text-white bg-mono-800 border border-mono-700 font-bold'
              : 'text-mono-400 hover:text-white hover:bg-mono-900 border border-transparent'
          }`}
          onClick={() => setActiveTab('book')}
        >
          <Calendar size={15} />
          <span>Book Consultation</span>
        </button>
        <button
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'prescriptions'
              ? 'text-white bg-mono-800 border border-mono-700 font-bold'
              : 'text-mono-400 hover:text-white hover:bg-mono-900 border border-transparent'
          }`}
          onClick={() => setActiveTab('prescriptions')}
        >
          <FileText size={15} />
          <span>My Prescriptions</span>
        </button>
        <button
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'billing'
              ? 'text-white bg-mono-800 border border-mono-700 font-bold'
              : 'text-mono-400 hover:text-white hover:bg-mono-900 border border-transparent'
          }`}
          onClick={() => setActiveTab('billing')}
        >
          <CreditCard size={15} />
          <span>Invoices & Payments</span>
        </button>
      </div>

      <div>
        {activeTab === 'overview' && (
          <PatientDashboard
            onBookAppointment={() => setActiveTab('book')}
            onViewPrescriptions={() => setActiveTab('prescriptions')}
            onViewBilling={() => setActiveTab('billing')}
          />
        )}
        {activeTab === 'book' && <BookAppointmentPage />}
        {activeTab === 'prescriptions' && <PatientPrescriptionsPage />}
        {activeTab === 'billing' && <PatientBillingPage />}
      </div>
    </div>
  );
};
