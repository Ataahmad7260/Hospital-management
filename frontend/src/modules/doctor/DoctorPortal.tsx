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
          <span>Doctor Overview</span>
        </button>
        <button
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'appointments'
              ? 'text-white bg-mono-800 border border-mono-700 font-bold'
              : 'text-mono-400 hover:text-white hover:bg-mono-900 border border-transparent'
          }`}
          onClick={() => setActiveTab('appointments')}
        >
          <Calendar size={15} />
          <span>Consultation Schedule</span>
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
