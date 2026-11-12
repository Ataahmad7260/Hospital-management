import React, { useState } from 'react';
import { LayoutDashboard, Calendar, FileText } from 'lucide-react';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { AppointmentsSchedulePage } from './pages/AppointmentsSchedulePage';
import { IssuePrescriptionPage } from './pages/IssuePrescriptionPage';

export const DoctorPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'prescriptions'>('overview');

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
          <span>Doctor Overview</span>
        </button>
        <button
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'appointments'
              ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
          onClick={() => setActiveTab('appointments')}
        >
          <Calendar size={15} />
          <span>Consultation Schedule</span>
        </button>
        <button
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'prescriptions'
              ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
          onClick={() => setActiveTab('prescriptions')}
        >
          <FileText size={15} />
          <span>Prescriptions Registry</span>
        </button>
      </div>

      <div>
        {activeTab === 'overview' && (
          <DoctorDashboard onNavigateToPrescriptions={() => setActiveTab('prescriptions')} />
        )}
        {activeTab === 'appointments' && <AppointmentsSchedulePage />}
        {activeTab === 'prescriptions' && <IssuePrescriptionPage />}
      </div>
    </div>
  );
};
