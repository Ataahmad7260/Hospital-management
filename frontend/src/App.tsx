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
    <div className="flex flex-col min-h-screen bg-mono-black text-white font-sans selection:bg-mono-700 selection:text-white">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-mono-950 border-b border-mono-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-white text-black flex items-center justify-center font-bold">
            <Activity size={18} />
          </div>
          <div className="flex items-center">
            <span className="font-mono text-base font-extrabold tracking-wider text-white mr-2">AURA</span>
            <span className="text-[0.7rem] text-mono-400 font-mono border-l border-mono-700 pl-2 hidden sm:inline uppercase tracking-wider">
              CLINICAL MONOCHROME
            </span>
          </div>
          <div className="inline-flex items-center gap-1.5 text-xs text-mono-300 bg-mono-900 px-2.5 py-1 rounded-full border border-mono-800 font-mono">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isDbOnline ? 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.7)]' : 'bg-mono-500'
              }`}
            />
            <span className="text-[0.7rem]">{isDbOnline ? 'MongoDB (rs0) Live' : 'Connecting DB...'}</span>
          </div>
        </div>

        {/* User Identity & Logout */}
        <div className="flex items-center gap-3">
          {currentUser && (
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white">
                {currentUser.firstName} {currentUser.lastName}
              </div>
              <div className="text-[0.7rem] text-mono-400 font-mono">{currentUser.email}</div>
            </div>
          )}
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-white text-black border border-white">
            {role}
          </span>
          <button
            className="p-1.5 rounded text-mono-400 hover:text-white hover:bg-mono-850 cursor-pointer transition-colors"
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Role Portal Switcher Bar */}
      <nav className="flex items-center gap-3 px-6 py-2 bg-mono-900 border-b border-mono-800 overflow-x-auto">
        <span className="text-[0.7rem] font-semibold text-mono-400 uppercase font-mono whitespace-nowrap">
          Select Active Portal:
        </span>
        <div className="flex gap-1.5">
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-all cursor-pointer whitespace-nowrap ${
              role === 'ADMIN'
                ? 'bg-white text-black border-white font-bold'
                : 'border-mono-700 text-mono-300 hover:text-white hover:border-mono-500 hover:bg-mono-800'
            }`}
            onClick={() => switchRole('ADMIN')}
          >
            <Shield size={14} />
            <span>Administrator Portal</span>
          </button>
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-all cursor-pointer whitespace-nowrap ${
              role === 'DOCTOR'
                ? 'bg-white text-black border-white font-bold'
                : 'border-mono-700 text-mono-300 hover:text-white hover:border-mono-500 hover:bg-mono-800'
            }`}
            onClick={() => switchRole('DOCTOR')}
          >
            <Stethoscope size={14} />
            <span>Doctor Portal</span>
          </button>
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-all cursor-pointer whitespace-nowrap ${
              role === 'PHARMACIST'
                ? 'bg-white text-black border-white font-bold'
                : 'border-mono-700 text-mono-300 hover:text-white hover:border-mono-500 hover:bg-mono-800'
            }`}
            onClick={() => switchRole('PHARMACIST')}
          >
            <Pill size={14} />
            <span>Pharmacist Portal</span>
          </button>
          <button
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-all cursor-pointer whitespace-nowrap ${
              role === 'PATIENT'
                ? 'bg-white text-black border-white font-bold'
                : 'border-mono-700 text-mono-300 hover:text-white hover:border-mono-500 hover:bg-mono-800'
            }`}
            onClick={() => switchRole('PATIENT')}
          >
            <Users size={14} />
            <span>Patient Portal</span>
          </button>
        </div>

        <button
          className="ml-auto flex items-center gap-1.5 px-2.5 py-1 text-xs text-mono-400 hover:text-white hover:bg-mono-850 rounded cursor-pointer transition-colors"
          onClick={() => {
            checkHealth();
            window.location.reload();
          }}
          title="Refresh portal data"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Sync</span>
        </button>
      </nav>

      {/* Active Role Portal View */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
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
