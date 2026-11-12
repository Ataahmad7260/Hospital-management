import { useState, useEffect } from 'react';
import {
  RefreshCw,
  LogOut,
  ExternalLink,
  ChevronRight,
  Shield,
  Stethoscope,
  Pill,
  Users,
  FolderKanban,
  Calendar,
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
import { api } from './shared/api';
import type { DailyAdmissionsStats } from './shared/types';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

function MainLayout() {
  const { currentUser, role, switchRole, logout, toast, loading } = useAuth();
  const [activeView, setActiveView] = useState<string>(() => {
    const hash = window.location.hash.replace(/^#\/?/, '');
    return hash || 'dashboard';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isDbOnline, setIsDbOnline] = useState<boolean | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyAdmissionsStats | null>(null);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (hash) setActiveView(hash);
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    checkHealth();
    loadDailyStats();
  }, []);

  // Track page hit via Express on activeView or role change
  useEffect(() => {
    const titleMap: Record<string, string> = {
      dashboard: 'Hospital Master Dashboard',
      'daily-graph': 'Daily Patient Admissions Graph',
      'admit-patient': 'Patient Admission & Clinical Intake',
      'patient-overview': 'Patient Overview & Master Case Ledger',
      'book-consultation': 'Book Consultation & Specialists',
      'my-prescriptions': 'My Prescriptions & Regimens',
      'invoices-payments': 'Invoices & Clinical Billing Statements',
      'patient-portal': 'Patient Portal Workspace',
      'doctor-portal': 'Doctor Clinical Portal',
      'pharmacist-portal': 'Pharmacist Dispensary & Invoicing Portal',
      'admin-portal': 'Administrator System Portal',
      telemetry: 'Express.js Page Tracking Telemetry',
      swagger: 'Swagger OpenAPI 3.0 Documentation',
    };

    const title = titleMap[activeView] || activeView;
    api.recordPageHit({
      pageUrl: `/${activeView}`,
      pageTitle: title,
      userRole: role,
      userId: currentUser?.id,
    }).catch(() => {});
  }, [activeView, role, currentUser?.id]);

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
    setActiveView(view);
    window.location.hash = `#/${view}`;
    // Auto-sync role when opening a dedicated portal view
    if (view === 'doctor-portal' && role !== 'DOCTOR') {
      switchRole('DOCTOR');
    } else if (view === 'pharmacist-portal' && role !== 'PHARMACIST') {
      switchRole('PHARMACIST');
    } else if (view === 'admin-portal' && role !== 'ADMIN') {
      switchRole('ADMIN');
    } else if (
      ['patient-overview', 'book-consultation', 'my-prescriptions', 'invoices-payments', 'admit-patient', 'patient-portal'].includes(view) &&
      role !== 'PATIENT'
    ) {
      switchRole('PATIENT');
    }
  };

  // Determine active portal scope
  const getActivePortal = (): 'admin' | 'doctor' | 'pharmacist' | 'patient' => {
    if (activeView === 'admin-portal' || role === 'ADMIN') return 'admin';
    if (activeView === 'doctor-portal' || role === 'DOCTOR') return 'doctor';
    if (activeView === 'pharmacist-portal' || role === 'PHARMACIST') return 'pharmacist';
    return 'patient';
  };

  const activePortal = getActivePortal();

  const handlePortalChange = (portal: string) => {
    if (portal === 'admin') {
      switchRole('ADMIN');
      handleNavigate('admin-portal');
    } else if (portal === 'doctor') {
      switchRole('DOCTOR');
      handleNavigate('doctor-portal');
    } else if (portal === 'pharmacist') {
      switchRole('PHARMACIST');
      handleNavigate('pharmacist-portal');
    } else if (portal === 'patient') {
      switchRole('PATIENT');
      handleNavigate('patient-overview');
    }
  };

  const isPatientPortalActive =
    activePortal === 'patient' ||
    ['patient-overview', 'book-consultation', 'my-prescriptions', 'invoices-payments', 'admit-patient', 'patient-portal'].includes(activeView);

  const getViewTitle = () => {
    switch (activeView) {
      case 'dashboard':
        return 'Hospital Master Dashboard';
      case 'daily-graph':
        return 'Daily Patient Admissions Graph';
      case 'admit-patient':
        return 'Patient Admission & Intake';
      case 'patient-overview':
        return 'Patient Overview & Clinical Ledger';
      case 'book-consultation':
        return 'Book Specialist Consultation';
      case 'my-prescriptions':
        return 'My Medical Prescriptions';
      case 'invoices-payments':
        return 'Invoices & Payment Statements';
      case 'patient-portal':
        return 'Patient Clinical Portal';
      case 'doctor-portal':
        return 'Doctor Clinical Portal';
      case 'pharmacist-portal':
        return 'Pharmacist Dispensary & Billing';
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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground font-sans antialiased selection:bg-primary/20 selection:text-foreground">
      {/* Modern Collapsible Sidebar */}
      <Sidebar
        activeView={activeView}
        onSelectView={handleNavigate}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isDbOnline={isDbOnline}
      />

      {/* Main App Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-background">
        {/* Sticky, Glassmorphic Header (rendered for sub-pages, dashboard and patient-portal have dedicated sleek headers) */}
        {!['dashboard', 'patient-portal'].includes(activeView) && (
          <header className="sticky top-0 z-30 flex flex-col bg-background/95 backdrop-blur-md border-b border-border shrink-0 shadow-xs">
          {/* Main Header Bar */}
          <div className="flex items-center justify-between px-6 lg:px-8 h-16 gap-4">
            {/* Left: Breadcrumbs & Current View Title */}
            <div className="flex items-center gap-2 overflow-hidden shrink-0">
              <span className="font-mono text-xs text-primary font-bold uppercase hidden sm:inline tracking-wider">
                Aura
              </span>
              <ChevronRight size={13} className="text-muted-foreground hidden sm:inline" />
              <h1 className="text-xs sm:text-sm font-bold text-foreground truncate tracking-tight">
                {getViewTitle()}
              </h1>
            </div>

            {/* Center: Portal Switcher Tabs */}
            <div className="hidden md:flex items-center justify-center flex-1 max-w-xl mx-2">
              <Tabs value={activePortal} onValueChange={handlePortalChange}>
                <TabsList className="bg-muted/60 border border-border/60 h-8 p-0.5">
                  <TabsTrigger
                    value="admin"
                    className="text-xs px-2.5 py-1 gap-1.5 cursor-pointer data-[state=active]:bg-card data-[state=active]:text-foreground"
                  >
                    <Shield size={12} className="text-indigo-400" />
                    <span className="hidden lg:inline">Administrator</span>
                    <span className="lg:hidden">Admin</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="doctor"
                    className="text-xs px-2.5 py-1 gap-1.5 cursor-pointer data-[state=active]:bg-card data-[state=active]:text-foreground"
                  >
                    <Stethoscope size={12} className="text-sky-400" />
                    <span>Doctor</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="pharmacist"
                    className="text-xs px-2.5 py-1 gap-1.5 cursor-pointer data-[state=active]:bg-card data-[state=active]:text-foreground"
                  >
                    <Pill size={12} className="text-emerald-400" />
                    <span className="hidden lg:inline">Pharmacist</span>
                    <span className="lg:hidden">Pharma</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="patient"
                    className="text-xs px-2.5 py-1 gap-1.5 cursor-pointer data-[state=active]:bg-card data-[state=active]:text-foreground"
                  >
                    <Users size={12} className="text-purple-400" />
                    <span>Patient</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Right: DB Status Indicator, API Docs, Sync & Profile Dropdown */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* Polished DB Connection Status Indicator (pulsing green Badge) */}
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
                href="http://localhost:4000/api/docs/swagger"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 text-[0.68rem] font-mono text-muted-foreground hover:text-foreground bg-secondary/80 hover:bg-secondary border border-border rounded-md transition-colors shadow-xs"
                title="Open OpenAPI 3.0 Interactive Docs on port 4000"
              >
                <ExternalLink size={11} className="text-primary" />
                <span>Swagger</span>
              </a>

              {/* Theme Toggle (Light / True Black) */}
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

              {/* User Profile Dropdown using shadcn DropdownMenu */}
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
                          Active Scope: {role}
                        </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1 text-[0.62rem] font-mono uppercase text-muted-foreground font-semibold">
                    Switch Portal Scope
                  </div>
                  <DropdownMenuItem
                    onClick={() => {
                      switchRole('ADMIN');
                      handleNavigate('admin-portal');
                    }}
                  >
                    <Shield size={13} className="text-indigo-400" />
                    <span>Administrator Scope</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      switchRole('DOCTOR');
                      handleNavigate('doctor-portal');
                    }}
                  >
                    <Stethoscope size={13} className="text-sky-400" />
                    <span>Doctor Clinical Scope</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      switchRole('PHARMACIST');
                      handleNavigate('pharmacist-portal');
                    }}
                  >
                    <Pill size={13} className="text-emerald-400" />
                    <span>Pharmacist Dispensary</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      switchRole('PATIENT');
                      handleNavigate('patient-overview');
                    }}
                  >
                    <Users size={13} className="text-purple-400" />
                    <span>Patient Care Scope</span>
                  </DropdownMenuItem>
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

          {/* Sub-Navigation View Strip (Patient Overview, Book Consultation, My Prescriptions, Invoices & Payments) */}
          {isPatientPortalActive && (
            <div className="flex items-center gap-1.5 px-6 lg:px-8 py-2 border-t border-border bg-muted/20 overflow-x-auto select-none">
              <span className="text-[0.65rem] font-mono uppercase tracking-wider text-muted-foreground mr-2 font-semibold hidden md:inline">
                Patient Views:
              </span>
              <button
                onClick={() => handleNavigate('patient-overview')}
                className={cn(
                  'px-3.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap',
                  activeView === 'patient-overview'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                <FolderKanban size={13} />
                <span>Patient Overview</span>
              </button>
              <button
                onClick={() => handleNavigate('book-consultation')}
                className={cn(
                  'px-3.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap',
                  activeView === 'book-consultation'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                <Calendar size={13} />
                <span>Book Consultation</span>
              </button>
              <button
                onClick={() => handleNavigate('my-prescriptions')}
                className={cn(
                  'px-3.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap',
                  activeView === 'my-prescriptions'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                <FileText size={13} />
                <span>My Prescriptions</span>
              </button>
              <button
                onClick={() => handleNavigate('invoices-payments')}
                className={cn(
                  'px-3.5 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap',
                  activeView === 'invoices-payments'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
              >
                <CreditCard size={13} />
                <span>Invoices & Payments</span>
              </button>
            </div>
          )}
        </header>
        )}

        {/* Scrollable Main Content Container */}
        <main
          className={cn(
            'flex-1 overflow-y-auto',
            ['dashboard', 'patient-portal'].includes(activeView)
              ? 'p-0'
              : 'p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6'
          )}
        >
          {activeView === 'dashboard' && (
            <MasterHospitalDashboard onNavigate={handleNavigate} />
          )}

          {activeView === 'daily-graph' && (
            <div className="space-y-6">
              <DailyPatientAdmissionsGraph
                stats={dailyStats}
                loading={loading}
                onAdmitPatientClick={() => handleNavigate('admit-patient')}
              />
            </div>
          )}

          {activeView === 'admit-patient' && (
            <AdmitPatientPage
              onAdmittedSuccess={() => handleNavigate('doctor-portal')}
              onNavigateToOverview={() => handleNavigate('patient-overview')}
            />
          )}

          {activeView === 'patient-overview' && (
            <PatientOverviewPage onAdmitClick={() => handleNavigate('admit-patient')} />
          )}

          {activeView === 'book-consultation' && <BookAppointmentPage />}

          {activeView === 'my-prescriptions' && <PatientPrescriptionsPage />}

          {activeView === 'invoices-payments' && <PatientBillingPage />}

          {activeView === 'patient-portal' && <PatientPortal />}

          {activeView === 'doctor-portal' && <DoctorPortal />}

          {activeView === 'pharmacist-portal' && <PharmacistPortal />}

          {activeView === 'admin-portal' && <AdminPortal />}

          {activeView === 'telemetry' && <ExpressPageTracker />}

          {activeView === 'swagger' && <SwaggerDocsView />}
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