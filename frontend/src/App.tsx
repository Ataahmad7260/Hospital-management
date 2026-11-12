import { useState, useEffect } from 'react';
import {
  RefreshCw,
  LogOut,
  ExternalLink,
  ChevronRight,
  Shield,
  Stethoscope,
  Users,
  FileText,
  CreditCard,
  ChevronDown,
  Activity,
  BookOpen,
} from 'lucide-react';
import { AuthProvider, useAuth } from './shared/context/AuthContext';
import { ThemeProvider } from './shared/context/ThemeContext';
import { ThemeToggle } from './shared/components/ThemeToggle';
import { Sidebar } from './shared/layout/Sidebar';
import { MasterHospitalDashboard } from './modules/dashboard/MasterHospitalDashboard';
import { DailyPatientAdmissionsGraph } from './modules/dashboard/components/DailyPatientAdmissionsGraph';
import { AdmitPatientPage } from './modules/patient/pages/AdmitPatientPage';
import { PatientOverviewPage } from './modules/patient/pages/PatientOverviewPage';
import { BookAppointmentPage } from './modules/patient/pages/BookAppointmentPage';
import { PatientPrescriptionsPage } from './modules/patient/pages/PatientPrescriptionsPage';
import { PatientBillingPage } from './modules/patient/pages/PatientBillingPage';
import { PatientPortal } from './modules/patient/PatientPortal';
import { DoctorPortal } from './modules/doctor/DoctorPortal';
import { PharmacistPortal } from './modules/pharmacist/PharmacistPortal';
import { AdminPortal } from './modules/admin/AdminPortal';
import { ExpressPageTracker } from './modules/telemetry/ExpressPageTracker';
import { SwaggerDocsView } from './modules/docs/SwaggerDocsView';
import { Toast } from './shared/ui';
import { api, API_ORIGIN } from './shared/api';
import type { DailyAdmissionsStats } from './shared/types';
import { AuthPage } from './modules/auth/AuthPage';
import { ProtectedRoute } from './shared/components/ProtectedRoute';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from './lib/utils';

const normalizeView = (v: string): string => {
  return v.replace(/^#\/?/, '').replace(/^\//, '').trim();
};

function MainLayout() {
  const { currentUser, role, isAuthenticated, logout, toast, loading } = useAuth();
  const [activeView, setActiveView] = useState<string>(() => {
    const raw = window.location.hash.replace(/^#\/?/, '');
    const clean = normalizeView(raw);
    if (clean) return clean;
    if (role === 'DOCTOR') return 'doctor/dashboard';
    if (role === 'PHARMACIST') return 'pharmacist/dashboard';
    if (role === 'PATIENT') return 'patient/dashboard';
    return 'admin/dashboard';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isDbOnline, setIsDbOnline] = useState<boolean | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyAdmissionsStats | null>(null);

  useEffect(() => {
    const handleHash = () => {
      const clean = normalizeView(window.location.hash);
      if (clean) setActiveView(clean);
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      checkHealth();
      loadDailyStats();
    }
  }, [isAuthenticated]);

  const currentRoute = normalizeView(activeView);

  // Track page hit via Express on activeView or role change
  useEffect(() => {
    if (!isAuthenticated) return;
    const titleMap: Record<string, string> = {
      'admin/dashboard': 'Admin Master Dashboard',
      'admin/doctors': 'Admin Doctors Management Roster',
      'admin/patients': 'Admin Patients Registry & Ledger',
      'admin/hospital-staff': 'Admin Hospital Staff Management Roster',
      'admin/staff': 'Admin Hospital Staff & RBAC Directory',
      'admin/financials': 'Admin Hospital Financials & Statements',
      'admin-portal': 'Administrator System Portal',
      'doctor/dashboard': 'Doctor Clinical Workspace • Queue',
      'doctor/prescriptions': 'Doctor Prescription Writer Interface',
      'doctor-portal': 'Doctor Clinical Portal',
      'patient/dashboard': 'Patient Health Portal Workspace',
      'patient/prescriptions': 'Patient Prescriptions & Regimens',
      'patient/billing': 'Patient Invoices & Statements',
      'patient-portal': 'Patient Portal Workspace',
      'pharmacist/dashboard': 'Pharmacist Dispensary & Overview',
      'pharmacist/fulfillment': 'Pharmacist Dispensary Orders & Billing',
      'pharmacist/sales': 'Pharmacist Sales & Revenue Ledger',
      'pharmacist/inventory': 'Pharmacist Medicine Management & Inventory',
      'pharmacist-portal': 'Pharmacist Dispensary & Billing',
      dashboard: 'Hospital Master Dashboard',
      'daily-graph': 'Daily Patient Admissions Graph',
      'admit-patient': 'Patient Admission & Clinical Intake',
      'patient-overview': 'Patient Overview & Master Case Ledger',
      'book-consultation': 'Book Consultation & Specialists',
      'my-prescriptions': 'My Prescriptions & Regimens',
      'invoices-payments': 'Invoices & Clinical Billing Statements',
      telemetry: 'Express.js Page Tracking Telemetry',
      swagger: 'Swagger OpenAPI 3.0 Documentation',
    };

    const title = titleMap[currentRoute] || currentRoute;
    api.recordPageHit({
      pageUrl: `/${currentRoute}`,
      pageTitle: title,
      userRole: role || undefined,
      userId: currentUser?.id,
    }).catch(() => {});
  }, [currentRoute, role, currentUser?.id, isAuthenticated]);

  const checkHealth = async () => {
    try {
      await api.getHealth();
      setIsDbOnline(true);
    } catch {
      setIsDbOnline(false);
    }
  };

  const loadDailyStats = async () => {
    try {
      const stats = await api.getDailyAdmissionsStats();
      setDailyStats(stats);
    } catch {
      // non-blocking
    }
  };

  const handleNavigate = (view: string) => {
    const clean = normalizeView(view);
    setActiveView(clean);
    window.location.hash = `#/${clean}`;
  };

  // If unauthenticated or explicit login view, show clean monochrome auth screen
  if (!isAuthenticated || !currentUser || currentRoute === 'login') {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <AuthPage
          onSuccess={(redirectView) => {
            handleNavigate(redirectView);
          }}
        />
        {toast && <Toast message={toast.message} isError={toast.isError} />}
      </div>
    );
  }

  const getViewTitle = () => {
    switch (currentRoute) {
      case 'admin/dashboard':
      case 'dashboard':
        return 'Hospital Master Dashboard';
      case 'admin/doctors':
        return 'Admin • Doctors Management & Roster';
      case 'admin/patients':
        return 'Admin • Patients Master Registry & Ledger';
      case 'admin/hospital-staff':
        return 'Admin • Hospital Staff Roster (Nurses, Ward Staff & Support)';
      case 'admin/staff':
        return 'Admin • Hospital Staff RBAC Security';
      case 'admin/financials':
        return 'Admin • Hospital Financials & Revenue';
      case 'daily-graph':
        return 'Daily Patient Admissions Graph';
      case 'admit-patient':
        return 'Patient Admission & Intake';
      case 'patient-overview':
        return 'Patient Overview & Clinical Ledger';
      case 'book-consultation':
        return 'Book Specialist Consultation';
      case 'my-prescriptions':
      case 'patient/prescriptions':
        return 'My Medical Prescriptions';
      case 'invoices-payments':
      case 'patient/billing':
        return 'Invoices & Payment Statements';
      case 'patient/dashboard':
      case 'patient-portal':
        return 'Patient Clinical Portal';
      case 'doctor/dashboard':
      case 'doctor-portal':
        return 'Doctor Clinical Portal';
      case 'doctor/prescriptions':
      case 'doctor-prescriptions':
        return 'Prescription Writer Interface';
      case 'pharmacist/dashboard':
      case 'pharmacist-portal':
        return 'Pharmacist • Overview & Dispensary';
      case 'pharmacist/fulfillment':
        return 'Pharmacist • Dispensary Orders & Billing';
      case 'pharmacist/sales':
        return 'Pharmacist • Sales & Revenue Ledger';
      case 'pharmacist/inventory':
        return 'Pharmacist • Medicine Management & Inventory';
      case 'admin-portal':
        return 'Administrator Portal';
      case 'telemetry':
        return 'Express Page Tracking Telemetry';
      case 'swagger':
        return 'Swagger API Documentation';
      default:
        return 'Hospital Management Platform';
    }
  };

  const isFullBleedView = ['dashboard', 'patient-portal', 'patient/dashboard'].includes(currentRoute);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground font-sans antialiased selection:bg-primary/20 selection:text-foreground">
      {/* Modern Collapsible Sidebar */}
      <Sidebar
        activeView={currentRoute}
        onSelectView={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isDbOnline={isDbOnline}
      />

      {/* Main App Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-background">
        {/* Sticky, Glassmorphic Header */}
        {!isFullBleedView && (
          <header className="sticky top-0 z-30 flex flex-col w-full max-w-full min-w-0 bg-background/95 backdrop-blur-md border-b border-border shrink-0 shadow-xs">
            {/* Main Header Bar */}
            <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 gap-3 min-w-0 max-w-full overflow-hidden">
              {/* Left: Breadcrumbs & Current View Title */}
              <div className="flex items-center gap-2 min-w-0 flex-1 md:flex-initial md:max-w-[260px] lg:max-w-[340px]">
                <span className="font-mono text-xs text-primary font-bold uppercase hidden sm:inline tracking-wider shrink-0">
                  Aura
                </span>
                <ChevronRight size={13} className="text-muted-foreground hidden sm:inline shrink-0" />
                <h1 className="text-xs sm:text-sm font-bold text-foreground truncate tracking-tight">
                  {getViewTitle()}
                </h1>
              </div>

              {/* Center: Admin Master Navigation Links (Strictly restricted to Administrator, NO role switching) */}
              {role === 'ADMIN' && (
                <div className="hidden md:flex items-center justify-center flex-1 min-w-0 max-w-2xl mx-2">
                  <div className="flex items-center bg-muted/60 border border-border/60 rounded-lg p-0.5 text-xs gap-0.5 max-w-full overflow-x-auto scrollbar-hidden">
                    <button
                      onClick={() => handleNavigate('admin/dashboard')}
                      className={cn(
                        'px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer text-xs font-medium whitespace-nowrap shrink-0',
                        ['admin/dashboard', 'dashboard', 'admin', 'admin-portal'].includes(currentRoute)
                          ? 'bg-card text-foreground font-semibold shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Shield size={12} className="text-indigo-400 shrink-0" />
                      <span>Overview</span>
                    </button>

                    <button
                      onClick={() => handleNavigate('admin/doctors')}
                      className={cn(
                        'px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer text-xs font-medium whitespace-nowrap shrink-0',
                        currentRoute === 'admin/doctors'
                          ? 'bg-card text-foreground font-semibold shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Stethoscope size={12} className="text-sky-400 shrink-0" />
                      <span>Doctors</span>
                    </button>

                    <button
                      onClick={() => handleNavigate('admin/patients')}
                      className={cn(
                        'px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer text-xs font-medium whitespace-nowrap shrink-0',
                        currentRoute === 'admin/patients'
                          ? 'bg-card text-foreground font-semibold shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Users size={12} className="text-purple-400 shrink-0" />
                      <span>Patients</span>
                    </button>

                    <button
                      onClick={() => handleNavigate('admin/hospital-staff')}
                      className={cn(
                        'px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer text-xs font-medium whitespace-nowrap shrink-0',
                        currentRoute === 'admin/hospital-staff'
                          ? 'bg-card text-foreground font-semibold shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Users size={12} className="text-amber-400 shrink-0" />
                      <span>Hospital Staff</span>
                    </button>

                    <button
                      onClick={() => handleNavigate('admin/staff')}
                      className={cn(
                        'px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer text-xs font-medium whitespace-nowrap shrink-0',
                        currentRoute === 'admin/staff'
                          ? 'bg-card text-foreground font-semibold shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Shield size={12} className="text-emerald-400 shrink-0" />
                      <span>Staff RBAC</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Right: DB Status Indicator, API Docs, Sync & Profile Dropdown */}
              <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                {/* DB Connection Status Indicator */}
                <Badge
                  variant="outline"
                  className={cn(
                    'hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[0.68rem] tracking-wide select-none',
                    isDbOnline
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                  )}
                  title="Database health state"
                >
                  <span className="relative flex h-2 w-2">
                    {isDbOnline && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    )}
                    <span
                      className={cn(
                        'relative inline-flex rounded-full h-2 w-2',
                        isDbOnline ? 'bg-emerald-500' : 'bg-amber-500'
                      )}
                    ></span>
                  </span>
                  <span>{isDbOnline ? 'MongoDB Live' : 'Connecting...'}</span>
                </Badge>

                {/* Swagger API Docs Quick Action */}
                <a
                  href={`${API_ORIGIN}/api/docs/swagger`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 text-[0.68rem] font-mono text-muted-foreground hover:text-foreground bg-secondary/80 hover:bg-secondary border border-border rounded-md transition-colors shadow-xs"
                  title="Open OpenAPI 3.0 Interactive Docs"
                >
                  <ExternalLink size={11} className="text-primary" />
                  <span>Swagger</span>
                </a>

                {/* Theme Toggle */}
                <ThemeToggle />

                {/* State Sync & Refresh */}
                <button
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground bg-secondary/70 hover:bg-secondary border border-border rounded-md cursor-pointer transition-colors shadow-xs"
                  onClick={() => {
                    checkHealth();
                    loadDailyStats();
                    window.location.reload();
                  }}
                  title="Sync database & reload telemetry"
                >
                  <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">Sync</span>
                </button>

                {/* User Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full border border-border bg-card/60 hover:bg-secondary/70 hover:border-primary/40 transition-all cursor-pointer select-none shadow-xs">
                      <Avatar className="w-6 h-6 border border-border">
                        <AvatarFallback className="bg-primary/15 text-primary font-mono text-[0.65rem] font-bold">
                          {currentUser?.firstName?.[0] || 'A'}
                          {currentUser?.lastName?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden lg:flex flex-col text-left">
                        <span className="text-xs font-semibold text-foreground leading-none">
                          {currentUser?.firstName} {currentUser?.lastName}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'hidden sm:inline-flex text-[0.62rem] font-mono font-bold py-0.2 px-1.5',
                          role === 'ADMIN' && 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400',
                          role === 'DOCTOR' && 'border-sky-500/30 bg-sky-500/10 text-sky-400',
                          role === 'PHARMACIST' && 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
                          role === 'PATIENT' && 'border-purple-500/30 bg-purple-500/10 text-purple-400'
                        )}
                      >
                        {role}
                      </Badge>
                      <ChevronDown size={12} className="text-muted-foreground ml-0.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-xs font-bold leading-none text-foreground">
                          {currentUser?.firstName} {currentUser?.lastName}
                        </p>
                        <p className="text-[0.68rem] font-mono leading-none text-muted-foreground">
                          {currentUser?.email}
                        </p>
                        <div className="pt-1">
                          <Badge variant="outline" className="text-[0.62rem] font-mono">
                            Role: {role}
                          </Badge>
                        </div>
                      </div>
                    </DropdownMenuLabel>

                    {role === 'ADMIN' && (
                      <>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-1 text-[0.62rem] font-mono uppercase text-muted-foreground font-semibold">
                          Admin Quick Navigation
                        </div>
                        <DropdownMenuItem onClick={() => handleNavigate('admin/dashboard')}>
                          <Shield size={13} className="text-indigo-400" />
                          <span>Master Dashboard</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavigate('admin/doctors')}>
                          <Stethoscope size={13} className="text-sky-400" />
                          <span>Doctors Management</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavigate('admin/patients')}>
                          <Users size={13} className="text-purple-400" />
                          <span>Patients Registry</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavigate('admin/hospital-staff')}>
                          <Users size={13} className="text-amber-400" />
                          <span>Hospital Staff</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleNavigate('admin/staff')}>
                          <Shield size={13} className="text-emerald-400" />
                          <span>Staff &amp; RBAC</span>
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleNavigate('telemetry')}>
                      <Activity size={13} className="text-primary" />
                      <span>Express Telemetry</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleNavigate('swagger')}>
                      <BookOpen size={13} className="text-primary" />
                      <span>OpenAPI 3.0 Docs</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={logout}
                      className="text-destructive focus:text-destructive cursor-pointer"
                    >
                      <LogOut size={13} />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Doctor Sub-Navigation Strip */}
            {role === 'DOCTOR' && (
              <div className="flex flex-wrap items-center gap-1.5 px-4 sm:px-6 lg:px-8 py-2 border-t border-border bg-muted/20 overflow-x-auto scrollbar-hidden min-w-0 max-w-full select-none">
                <span className="text-[0.65rem] font-mono uppercase tracking-wider text-muted-foreground mr-2 font-semibold hidden md:inline">
                  Doctor Clinical Features:
                </span>
                <button
                  onClick={() => handleNavigate('doctor/dashboard')}
                  className={cn(
                    'px-3.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap',
                    ['doctor/dashboard', 'doctor-portal'].includes(currentRoute)
                      ? 'bg-foreground text-background font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )}
                >
                  <Stethoscope size={13} />
                  <span>Today's Registered Patients</span>
                </button>
                <button
                  onClick={() => handleNavigate('doctor/prescriptions')}
                  className={cn(
                    'px-3.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap',
                    ['doctor/prescriptions', 'doctor-prescriptions'].includes(currentRoute)
                      ? 'bg-foreground text-background font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )}
                >
                  <FileText size={13} />
                  <span>Prescription Writer Interface</span>
                </button>
              </div>
            )}

            {/* Patient Sub-Navigation Strip */}
            {role === 'PATIENT' && (
              <div className="flex flex-wrap items-center gap-1.5 px-4 sm:px-6 lg:px-8 py-2 border-t border-border bg-muted/20 overflow-x-auto scrollbar-hidden min-w-0 max-w-full select-none">
                <span className="text-[0.65rem] font-mono uppercase tracking-wider text-muted-foreground mr-2 font-semibold hidden md:inline">
                  Patient Features:
                </span>
                <button
                  onClick={() => handleNavigate('patient/dashboard')}
                  className={cn(
                    'px-3.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap',
                    ['patient/dashboard', 'patient-portal'].includes(currentRoute)
                      ? 'bg-foreground text-background font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )}
                >
                  <Stethoscope size={13} />
                  <span>Available Doctors Today</span>
                </button>
                <button
                  onClick={() => handleNavigate('patient/prescriptions')}
                  className={cn(
                    'px-3.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap',
                    ['patient/prescriptions', 'my-prescriptions'].includes(currentRoute)
                      ? 'bg-foreground text-background font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )}
                >
                  <FileText size={13} />
                  <span>My Prescriptions</span>
                </button>
                <button
                  onClick={() => handleNavigate('patient/billing')}
                  className={cn(
                    'px-3.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap',
                    ['patient/billing', 'invoices-payments'].includes(currentRoute)
                      ? 'bg-foreground text-background font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  )}
                >
                  <CreditCard size={13} />
                  <span>Billing & Payment Status</span>
                </button>
              </div>
            )}
          </header>
        )}

        {/* Scrollable Main Content Container */}
        <main
          className={cn(
            'flex-1 overflow-y-auto overflow-x-hidden min-w-0 w-full',
            isFullBleedView
              ? 'p-0'
              : 'p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6'
          )}
        >
          {/* Master Hospital Dashboard (Shared by Admin & Doctor) */}
          {currentRoute === 'dashboard' && (
            <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR']} onNavigate={handleNavigate}>
              <MasterHospitalDashboard onNavigate={handleNavigate} />
            </ProtectedRoute>
          )}

          {/* Daily Patient Admissions Graph */}
          {currentRoute === 'daily-graph' && (
            <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR']} onNavigate={handleNavigate}>
              <div className="space-y-6">
                <DailyPatientAdmissionsGraph
                  stats={dailyStats}
                  loading={loading}
                  onAdmitPatientClick={() => handleNavigate('admit-patient')}
                />
              </div>
            </ProtectedRoute>
          )}

          {/* Patient Admission & Clinical Intake Form */}
          {currentRoute === 'admit-patient' && (
            <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR']} onNavigate={handleNavigate}>
              <AdmitPatientPage
                onAdmittedSuccess={() =>
                  handleNavigate(role === 'ADMIN' ? 'admin/patients' : 'doctor/dashboard')
                }
                onNavigateToOverview={() =>
                  handleNavigate(role === 'ADMIN' ? 'admin/patients' : 'patient-overview')
                }
              />
            </ProtectedRoute>
          )}

          {/* Patient Overview & Master Case Ledger */}
          {currentRoute === 'patient-overview' && (
            <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'PATIENT']} onNavigate={handleNavigate}>
              <PatientOverviewPage
                onAdmitClick={() =>
                  handleNavigate(role === 'ADMIN' ? 'admin/patients' : 'admit-patient')
                }
              />
            </ProtectedRoute>
          )}

          {/* Specialist Consultation Booking */}
          {currentRoute === 'book-consultation' && (
            <ProtectedRoute allowedRoles={['ADMIN', 'PATIENT']} onNavigate={handleNavigate}>
              <BookAppointmentPage />
            </ProtectedRoute>
          )}

          {/* Prescriptions Page */}
          {['my-prescriptions', 'patient/prescriptions'].includes(currentRoute) && (
            <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'PHARMACIST', 'PATIENT']} onNavigate={handleNavigate}>
              {role === 'PATIENT' ? (
                <PatientPortal initialTab="my-prescriptions" />
              ) : (
                <PatientPrescriptionsPage />
              )}
            </ProtectedRoute>
          )}

          {/* Billing & Invoices Page */}
          {['invoices-payments', 'patient/billing'].includes(currentRoute) && (
            <ProtectedRoute allowedRoles={['ADMIN', 'PHARMACIST', 'PATIENT']} onNavigate={handleNavigate}>
              {role === 'PATIENT' ? (
                <PatientPortal initialTab="billing-status" />
              ) : (
                <PatientBillingPage />
              )}
            </ProtectedRoute>
          )}

          {/* 1. Distinct Admin Master Panel Routes (/admin/*) */}
          {['admin/dashboard', 'admin', 'admin-portal'].includes(currentRoute) && (
            <ProtectedRoute allowedRoles={['ADMIN']} onNavigate={handleNavigate}>
              <AdminPortal initialTab="overview" onNavigate={handleNavigate} />
            </ProtectedRoute>
          )}

          {currentRoute === 'admin/doctors' && (
            <ProtectedRoute allowedRoles={['ADMIN']} onNavigate={handleNavigate}>
              <AdminPortal initialTab="doctors" onNavigate={handleNavigate} />
            </ProtectedRoute>
          )}

          {currentRoute === 'admin/patients' && (
            <ProtectedRoute allowedRoles={['ADMIN']} onNavigate={handleNavigate}>
              <AdminPortal initialTab="patients" onNavigate={handleNavigate} />
            </ProtectedRoute>
          )}

          {currentRoute === 'admin/hospital-staff' && (
            <ProtectedRoute allowedRoles={['ADMIN']} onNavigate={handleNavigate}>
              <AdminPortal initialTab="hospital-staff" onNavigate={handleNavigate} />
            </ProtectedRoute>
          )}

          {currentRoute === 'admin/staff' && (
            <ProtectedRoute allowedRoles={['ADMIN']} onNavigate={handleNavigate}>
              <AdminPortal initialTab="staff" onNavigate={handleNavigate} />
            </ProtectedRoute>
          )}

          {currentRoute === 'admin/financials' && (
            <ProtectedRoute allowedRoles={['ADMIN']} onNavigate={handleNavigate}>
              <AdminPortal initialTab="financials" onNavigate={handleNavigate} />
            </ProtectedRoute>
          )}

          {/* 2. Distinct User Workspace Routes */}
          {/* Doctor Workspace */}
          {['doctor/dashboard', 'doctor-portal'].includes(currentRoute) && (
            <ProtectedRoute allowedRoles={['DOCTOR']} onNavigate={handleNavigate}>
              <DoctorPortal initialTab="today-patients" />
            </ProtectedRoute>
          )}

          {['doctor/prescriptions', 'doctor-prescriptions'].includes(currentRoute) && (
            <ProtectedRoute allowedRoles={['DOCTOR']} onNavigate={handleNavigate}>
              <DoctorPortal initialTab="prescription-writer" />
            </ProtectedRoute>
          )}

          {/* Patient Workspace */}
          {['patient/dashboard', 'patient-portal'].includes(currentRoute) && (
            <ProtectedRoute allowedRoles={['PATIENT']} onNavigate={handleNavigate}>
              <PatientPortal initialTab="available-doctors" />
            </ProtectedRoute>
          )}

          {/* Pharmacist Workspace (Exclusive Medicine Management, Sales Ledger & Dispensary) */}
          {['pharmacist/dashboard', 'pharmacist-portal'].includes(currentRoute) && (
            <ProtectedRoute allowedRoles={['PHARMACIST']} onNavigate={handleNavigate}>
              <PharmacistPortal initialTab="overview" onNavigate={handleNavigate} />
            </ProtectedRoute>
          )}

          {currentRoute === 'pharmacist/fulfillment' && (
            <ProtectedRoute allowedRoles={['PHARMACIST']} onNavigate={handleNavigate}>
              <PharmacistPortal initialTab="fulfillment" onNavigate={handleNavigate} />
            </ProtectedRoute>
          )}

          {currentRoute === 'pharmacist/sales' && (
            <ProtectedRoute allowedRoles={['PHARMACIST']} onNavigate={handleNavigate}>
              <PharmacistPortal initialTab="sales" onNavigate={handleNavigate} />
            </ProtectedRoute>
          )}

          {currentRoute === 'pharmacist/inventory' && (
            <ProtectedRoute allowedRoles={['PHARMACIST']} onNavigate={handleNavigate}>
              <PharmacistPortal initialTab="inventory" onNavigate={handleNavigate} />
            </ProtectedRoute>
          )}

          {/* Developer & Telemetry Routes */}
          {currentRoute === 'telemetry' && (
            <ProtectedRoute allowedRoles={['ADMIN']} onNavigate={handleNavigate}>
              <ExpressPageTracker />
            </ProtectedRoute>
          )}

          {currentRoute === 'swagger' && <SwaggerDocsView />}
        </main>
      </div>

      {/* Global Notification Toast */}
      {toast && <Toast message={toast.message} isError={toast.isError} />}
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;