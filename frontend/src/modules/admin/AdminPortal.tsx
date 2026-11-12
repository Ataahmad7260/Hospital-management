import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  CreditCard,
  UserPlus,
  Stethoscope,
  HeartHandshake,
  Shield,
  Users,
} from 'lucide-react';
import { AdminDashboard } from './pages/AdminDashboard';
import { StaffDirectoryPage } from './pages/StaffDirectoryPage';
import { HospitalStaffManagementPage } from './pages/HospitalStaffManagementPage';
import { HospitalFinancialsPage } from './pages/HospitalFinancialsPage';
import { PatientOverviewPage } from '../patient/pages/PatientOverviewPage';
import { DoctorsManagementPage } from './pages/DoctorsManagementPage';
import { AddDoctorModal } from './components/AddDoctorModal';
import { AddPatientModal } from './components/AddPatientModal';
import { AddHospitalStaffModal } from './components/AddHospitalStaffModal';

export type AdminTab =
  | 'overview'
  | 'doctors'
  | 'patients'
  | 'hospital-staff'
  | 'staff'
  | 'financials';

interface AdminPortalProps {
  initialTab?: AdminTab;
  onNavigate?: (route: string) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  initialTab = 'overview',
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  // Sync internal active tab if prop changes
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Modal Open States
  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

  // Counter to trigger data refetch across child tabs
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    const routeMap: Record<AdminTab, string> = {
      overview: 'admin/dashboard',
      doctors: 'admin/doctors',
      patients: 'admin/patients',
      'hospital-staff': 'admin/hospital-staff',
      staff: 'admin/staff',
      financials: 'admin/financials',
    };
    const targetRoute = routeMap[tab];
    if (onNavigate) {
      onNavigate(targetRoute);
    } else {
      window.location.hash = `#/${targetRoute}`;
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-full min-w-0">
      {/* Top Header Strip with Subnavigation and Quick Admin Actions */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-border pb-3 min-w-0 max-w-full">
        {/* Navigation Tabs - Purely inside Admin Master Panel */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto scrollbar-hidden min-w-0 max-w-full select-none">
          <button
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${activeTab === 'overview'
                ? 'bg-foreground text-background shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            onClick={() => handleTabChange('overview')}
          >
            <LayoutDashboard size={14} />
            <span>Master Overview</span>
          </button>

          <button
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${activeTab === 'doctors'
                ? 'bg-foreground text-background shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            onClick={() => handleTabChange('doctors')}
          >
            <Stethoscope size={14} />
            <span>Doctors Management</span>
          </button>

          <button
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${activeTab === 'patients'
                ? 'bg-foreground text-background shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            onClick={() => handleTabChange('patients')}
          >
            <HeartHandshake size={14} />
            <span>Patients Registry</span>
          </button>

          <button
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${activeTab === 'hospital-staff'
                ? 'bg-foreground text-background shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            onClick={() => handleTabChange('hospital-staff')}
          >
            <Users size={14} />
            <span>Hospital Staff</span>
          </button>

          <button
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${activeTab === 'staff'
                ? 'bg-foreground text-background shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            onClick={() => handleTabChange('staff')}
          >
            <Shield size={14} />
            <span>Staff &amp; RBAC</span>
          </button>

          <button
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${activeTab === 'financials'
                ? 'bg-foreground text-background shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            onClick={() => handleTabChange('financials')}
          >
            <CreditCard size={14} />
            <span>Financials</span>
          </button>
        </div>

        {/* Quick Admin Action Creation Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => setIsDoctorModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            <Stethoscope size={13} />
            <span>+ Add Doctor</span>
          </button>

          <button
            onClick={() => setIsStaffModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border bg-card hover:bg-muted text-foreground rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <Users size={13} />
            <span>+ Add Staff</span>
          </button>

          <button
            onClick={() => setIsPatientModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border bg-card hover:bg-muted text-foreground rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-xs"
          >
            <UserPlus size={13} />
            <span>+ Add Patient</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content Rendered inside Admin Master Layout */}
      <div key={refreshKey} className="w-full max-w-full min-w-0">
        {activeTab === 'overview' && <AdminDashboard />}

        {activeTab === 'doctors' && <DoctorsManagementPage />}
        {activeTab === 'patients' && <PatientOverviewPage onAdmitClick={() => setIsPatientModalOpen(true)} />}
        {activeTab === 'hospital-staff' && (
          <HospitalStaffManagementPage refreshTrigger={refreshKey} />
        )}
        {activeTab === 'staff' && (
          <StaffDirectoryPage onOpenHospitalStaff={() => handleTabChange('hospital-staff')} />
        )}
        {activeTab === 'financials' && <HospitalFinancialsPage />}
      </div>

      {/* Admin Action Creation Modals */}
      <AddDoctorModal
        isOpen={isDoctorModalOpen}
        onClose={() => setIsDoctorModalOpen(false)}
        onDoctorAdded={triggerRefresh}
      />

      <AddHospitalStaffModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        onSaved={triggerRefresh}
      />

      <AddPatientModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onPatientAdded={triggerRefresh}
      />
    </div>
  );
};
