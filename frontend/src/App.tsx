import { useState, useEffect } from 'react';
import {
  Activity,
  Shield,
  Stethoscope,
  Pill,
  Users,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { AuthProvider, useAuth } from './shared/context/AuthContext';
import { AdminPortal } from './modules/admin/AdminPortal';
import { DoctorPortal } from './modules/doctor/DoctorPortal';
import { PharmacistPortal } from './modules/pharmacist/PharmacistPortal';
import { PatientPortal } from './modules/patient/PatientPortal';
import { Toast } from './shared/ui';
import { api } from './shared/api';

function MainLayout() {
  const { currentUser, role, switchRole, logout, toast, loading } = useAuth();
  const [isDbOnline, setIsDbOnline] = useState<boolean | null>(null);

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      await api.getHealth();
      setIsDbOnline(true);
    } catch {
      setIsDbOnline(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-mono-black text-white font-sans antialiased selection:bg-mono-800 selection:text-white">
      {/* Top Application Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 py-2.5 bg-mono-950 border-b border-mono-800">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-white text-black flex items-center justify-center shrink-0">
            <Activity size={16} strokeWidth={2.2} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-sm font-bold tracking-wider text-white">AURA</span>
            <span className="text-[0.68rem] text-mono-400 font-medium tracking-normal hidden md:inline border-l border-mono-800 pl-2">
              Hospital Management
            </span>
          </div>
          <div className="hidden sm:inline-flex items-center gap-1.5 text-[0.7rem] text-mono-300 bg-mono-900 px-2.5 py-0.5 rounded-full border border-mono-800 font-mono">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isDbOnline ? 'bg-white' : 'bg-mono-500'
              }`}
            />
            <span>{isDbOnline ? 'MongoDB (rs0) Live' : 'Connecting DB...'}</span>
          </div>
        </div>

        {/* User Identity & Logout */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {currentUser && (
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-white leading-tight">
                {currentUser.firstName} {currentUser.lastName}
              </div>
              <div className="text-[0.68rem] text-mono-400 font-mono leading-tight">{currentUser.email}</div>
            </div>
          )}
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[0.68rem] font-mono font-medium tracking-wide bg-mono-850 text-mono-200 border border-mono-700">
            {role}
          </span>
          <button
            className="p-1.5 rounded-md text-mono-400 hover:text-white hover:bg-mono-850 border border-transparent hover:border-mono-800 cursor-pointer transition-colors"
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Role Portal Switcher Bar */}
      <nav className="flex items-center gap-3 px-4 sm:px-6 py-2 bg-mono-900 border-b border-mono-800 overflow-x-auto">
        <span className="text-[0.68rem] font-medium text-mono-400 uppercase font-mono tracking-wider whitespace-nowrap hidden lg:inline">
          Active Portal:
        </span>
        <div className="flex items-center gap-1.5">
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
              role === 'ADMIN'
                ? 'bg-white text-black border-white font-semibold'
                : 'bg-mono-900 border-mono-800 text-mono-300 hover:text-white hover:bg-mono-850 hover:border-mono-700'
            }`}
            onClick={() => switchRole('ADMIN')}
          >
            <Shield size={13} />
            <span>Administrator Portal</span>
          </button>
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
              role === 'DOCTOR'
                ? 'bg-white text-black border-white font-semibold'
                : 'bg-mono-900 border-mono-800 text-mono-300 hover:text-white hover:bg-mono-850 hover:border-mono-700'
            }`}
            onClick={() => switchRole('DOCTOR')}
          >
            <Stethoscope size={13} />
            <span>Doctor Portal</span>
          </button>
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
              role === 'PHARMACIST'
                ? 'bg-white text-black border-white font-semibold'
                : 'bg-mono-900 border-mono-800 text-mono-300 hover:text-white hover:bg-mono-850 hover:border-mono-700'
            }`}
            onClick={() => switchRole('PHARMACIST')}
          >
            <Pill size={13} />
            <span>Pharmacist Portal</span>
          </button>
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
              role === 'PATIENT'
                ? 'bg-white text-black border-white font-semibold'
                : 'bg-mono-900 border-mono-800 text-mono-300 hover:text-white hover:bg-mono-850 hover:border-mono-700'
            }`}
            onClick={() => switchRole('PATIENT')}
          >
            <Users size={13} />
            <span>Patient Portal</span>
          </button>
        </div>

        <button
          className="ml-auto flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-mono-400 hover:text-white bg-mono-900 hover:bg-mono-850 border border-mono-800 hover:border-mono-700 rounded-md cursor-pointer transition-colors shrink-0"
          onClick={() => {
            checkHealth();
            window.location.reload();
          }}
          title="Refresh portal data"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          <span>Sync</span>
        </button>
      </nav>

      {/* Active Role Portal View */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
        {role === 'ADMIN' && <AdminPortal />}
        {role === 'DOCTOR' && <DoctorPortal />}
        {role === 'PHARMACIST' && <PharmacistPortal />}
        {role === 'PATIENT' && <PatientPortal />}
      </main>

      {/* Notification Toast */}
      {toast && <Toast message={toast.message} isError={toast.isError} />}
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

export default App;
