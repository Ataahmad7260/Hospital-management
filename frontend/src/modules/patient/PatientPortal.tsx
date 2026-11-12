import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  CreditCard,
  UserPlus,
  FolderKanban,
  Search,
  Bell,
  MessageSquare,
  Plus,
  MoreHorizontal,
  ArrowUpRight,
  Filter,
  ArrowUpDown,
  ChevronRight,
  Share2,
  MessageCircle,
  ChevronDown,
  Activity,
  CheckCircle2,
  Users,
} from 'lucide-react';

import { PatientOverviewPage } from './pages/PatientOverviewPage';
import { BookAppointmentPage } from './pages/BookAppointmentPage';
import { AdmitPatientPage } from './pages/AdmitPatientPage';
import { PatientPrescriptionsPage } from './pages/PatientPrescriptionsPage';
import { PatientBillingPage } from './pages/PatientBillingPage';
import { api } from '../../shared/api';
import type { Appointment, Prescription, Bill, Doctor, Patient } from '../../shared/types';
import { useAuth } from '../../shared/context/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '../../shared/components/ThemeToggle';

export type PatientPortalTab = 'dashboard' | 'overview' | 'book' | 'prescriptions' | 'billing' | 'admit';

export const PatientPortal: React.FC<{ initialTab?: PatientPortalTab }> = ({ initialTab = 'dashboard' }) => {
  const { currentUser, role, showToast } = useAuth();
  const [activeTab, setActiveTab] = useState<PatientPortalTab>(initialTab);
  const [metricTab, setMetricTab] = useState<'completion' | 'team'>('completion');
  const [boardView, setBoardView] = useState<'board' | 'list' | 'calendar'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState<'Week' | 'Month' | 'Year'>('Week');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Live domain data
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [myProfile, setMyProfile] = useState<Patient | null>(null);

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    doctorId: '',
    patientId: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '09:30 - 10:00 AM',
    reason: '',
  });

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    loadPortalData();
  }, []);

  const loadPortalData = async () => {
    try {
      const [apts, pres, bls, docs, profile] = await Promise.all([
        api.getAppointments().catch(() => []),
        api.getPrescriptions().catch(() => []),
        api.getBills().catch(() => []),
        api.getDoctors().catch(() => []),
        api.getMyPatientProfile().catch(() => null),
      ]);
      setAppointments(apts);
      setPrescriptions(pres);
      setBills(bls);
      setDoctors(docs);
      if (profile) {
        setMyProfile(profile);
        setBookingForm((prev) => ({ ...prev, patientId: profile.id }));
      }
      if (docs.length > 0) {
        setBookingForm((prev) => ({ ...prev, doctorId: prev.doctorId || docs[0].id }));
      }
    } catch (e) {
      console.error('Failed to load portal data', e);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.doctorId || !bookingForm.patientId) {
      showToast?.('Please select a physician', true);
      return;
    }
    try {
      await api.createAppointment(bookingForm);
      showToast?.('Consultation booked successfully!');
      setIsBookingModalOpen(false);
      setBookingForm((prev) => ({ ...prev, reason: '' }));
      loadPortalData();
    } catch (err: any) {
      showToast?.(err.message, true);
    }
  };

  // Fallback appointments for clinical reference
  const displayAppointments = appointments.length > 0 ? appointments.slice(0, 3) : [
    {
      id: 'demo-1',
      patientId: 'p1',
      doctorId: 'd1',
      appointmentDate: '2026-01-14T10:30:00.000Z',
      timeSlot: '10:30 AM',
      status: 'CONFIRMED' as const,
      reason: 'Routine health assessment with Dr. Smith to ensure overall wellness.',
      doctor: { user: { firstName: 'Sarah', lastName: 'Smith' }, specialization: 'Cardiology' } as any,
    },
    {
      id: 'demo-2',
      patientId: 'p2',
      doctorId: 'd1',
      appointmentDate: '2026-01-14T15:15:00.000Z',
      timeSlot: '3:15 PM',
      status: 'PENDING' as const,
      reason: 'Review treatment progress for knee injury and adjust therapy as needed.',
      doctor: { user: { firstName: 'Sarah', lastName: 'Smith' }, specialization: 'Orthopedics' } as any,
    },
    {
      id: 'demo-3',
      patientId: 'p3',
      doctorId: 'd1',
      appointmentDate: '2026-01-14T17:00:00.000Z',
      timeSlot: '5:00 PM',
      status: 'SCHEDULED' as const,
      reason: 'This appointment is a follow-up with Dr. Smith to review diagnostic results.',
      doctor: { user: { firstName: 'Sarah', lastName: 'Smith' }, specialization: 'General Practice' } as any,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased flex flex-col">
      {/* 1. TOP HEADER BAR: Single unified bar adapting to shadcn theme */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto w-full px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Search pill */}
          <div className="relative w-full max-w-xs sm:max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search clinical records, tasks, doctors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border text-foreground placeholder:text-muted-foreground rounded-full pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring transition-all"
            />
          </div>

          {/* Right Utility: Chat, Bell, Date Pill & User Profile */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => showToast?.('No unread clinical messages')}
              className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              title="Messages"
            >
              <MessageSquare size={15} />
            </button>

            <button
              onClick={() => showToast?.('Telemetry alerts are healthy')}
              className="relative w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell size={15} />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
            </button>

            {/* Date Pill */}
            <div className="hidden sm:flex items-center gap-2 bg-card border border-border px-3.5 py-1.5 rounded-full text-xs text-muted-foreground font-medium">
              <Calendar size={13} className="text-primary" />
              <span>Thursday, 29 Oct 2026</span>
            </div>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2.5 bg-card border border-border pl-1.5 pr-3 py-1 rounded-full shrink-0">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-xs">
                {currentUser?.firstName?.[0] || 'E'}
              </div>
              <div className="text-left text-xs leading-none">
                <div className="font-semibold text-foreground flex items-center gap-1">
                  <span>{currentUser?.firstName || 'Elisabeth'} {currentUser?.lastName || 'Beck'}</span>
                  <ChevronDown size={11} className="text-muted-foreground" />
                </div>
                <div className="text-[0.65rem] text-muted-foreground font-mono mt-0.5">
                  {role || 'Administrator'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. SUB-NAVIGATION PILL BAR: Clean spacing below header */}
        <div className="border-t border-border bg-muted/20 px-6 lg:px-8 py-2.5">
          <div className="max-w-7xl mx-auto w-full flex items-center gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap',
                activeTab === 'dashboard'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border'
              )}
            >
              <LayoutDashboard size={13} />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('overview')}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap',
                activeTab === 'overview'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border'
              )}
            >
              <FolderKanban size={13} />
              <span>Patient Ledger</span>
            </button>

            <button
              onClick={() => setActiveTab('book')}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap',
                activeTab === 'book'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border'
              )}
            >
              <Calendar size={13} />
              <span>Book Consultation</span>
            </button>

            <button
              onClick={() => setActiveTab('prescriptions')}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap',
                activeTab === 'prescriptions'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border'
              )}
            >
              <FileText size={13} />
              <span>Prescriptions ({prescriptions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('billing')}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap',
                activeTab === 'billing'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border'
              )}
            >
              <CreditCard size={13} />
              <span>Invoices & Billing</span>
            </button>

            <button
              onClick={() => setActiveTab('admit')}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap',
                activeTab === 'admit'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border'
              )}
            >
              <UserPlus size={13} />
              <span>Admit Patient</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. MAIN WORKSPACE CANVAS: Proper, spacious margins and clean layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-8 py-8 space-y-8 min-w-0">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* ROW 1: 3-COLUMN METRICS GRID (Appointments, Performance Chart, Stacked Stats) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 min-w-0">
              {/* WIDGET 1: Appointments Overview (Left) */}
              <div className="xl:col-span-4 bg-card border border-border rounded-xl p-6 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold text-foreground text-sm tracking-tight">Appointments overview</h3>
                    <button
                      onClick={() => setIsBookingModalOpen(true)}
                      className="w-8 h-8 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-all cursor-pointer shadow-sm"
                      title="Book New Appointment"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    {displayAppointments.map((apt, idx) => {
                      const dateObj = new Date(apt.appointmentDate);
                      const day = dateObj.getDate();
                      const month = dateObj.toLocaleString('en-US', { month: 'short' });
                      const time = apt.timeSlot || '10:30 AM';
                      const isConfirmed = apt.status === 'CONFIRMED' || apt.status === 'COMPLETED';

                      return (
                        <div
                          key={apt.id || idx}
                          className="bg-secondary/40 border border-border rounded-xl p-4 flex items-start gap-3.5 hover:border-primary/40 transition-colors"
                        >
                          {/* Date badge box */}
                          <div className="w-14 h-14 rounded-xl bg-secondary border border-border flex flex-col items-center justify-center text-center shrink-0">
                            <Calendar size={13} className="text-primary mb-0.5" />
                            <span className="text-[0.68rem] font-bold text-foreground leading-none">{day} {month}</span>
                            <span className="text-[0.58rem] font-mono text-muted-foreground leading-none mt-1">{time.split(' ')[0]} {time.split(' ')[1]}</span>
                          </div>

                          {/* Middle Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-semibold text-foreground truncate">
                                {apt.doctor?.user ? `Dr. ${apt.doctor.user.lastName}` : (idx === 0 ? 'John Doe' : idx === 1 ? 'Jane Smith' : 'Michael Johnson')}
                              </h4>
                              <button className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer">
                                <MoreHorizontal size={14} />
                              </button>
                            </div>
                            <p className="text-[0.68rem] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                              {apt.reason || 'Routine clinical assessment to evaluate patient condition.'}
                            </p>
                            <div className="mt-2.5">
                              <span
                                className={cn(
                                  'text-[0.65rem] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 border font-mono',
                                  isConfirmed
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                )}
                              >
                                <span className={cn('w-1.5 h-1.5 rounded-full', isConfirmed ? 'bg-emerald-400' : 'bg-amber-400')} />
                                {isConfirmed ? 'Confirmed' : 'Pending'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-border mt-5 text-center">
                  <button
                    onClick={() => setActiveTab('book')}
                    className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>See all appointments</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>

              {/* WIDGET 2: Performance Metrics & Neon Chart (Center) */}
              <div className="xl:col-span-5 bg-card border border-border rounded-xl p-6 flex flex-col justify-between shadow-sm">
                <div>
                  {/* Header with Title and Create a Report button */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground text-sm tracking-tight">Performance metrics</h3>
                    <Button
                      size="sm"
                      onClick={() => setIsReportModalOpen(true)}
                      className="cursor-pointer"
                    >
                      Create a report
                    </Button>
                  </div>

                  {/* Segmented Switch: Task completion rate vs Team performance */}
                  <div className="flex items-center bg-secondary/50 border border-border rounded-lg p-1 text-xs gap-1 w-fit mb-4">
                    <button
                      onClick={() => setMetricTab('completion')}
                      className={cn(
                        'px-3.5 py-1.5 rounded-md transition-all font-medium flex items-center gap-1.5 cursor-pointer',
                        metricTab === 'completion'
                          ? 'bg-card text-foreground border border-border shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <CheckCircle2 size={12} className="text-emerald-400" />
                      <span>Task completion rate</span>
                    </button>
                    <button
                      onClick={() => setMetricTab('team')}
                      className={cn(
                        'px-3.5 py-1.5 rounded-md transition-all font-medium flex items-center gap-1.5 cursor-pointer',
                        metricTab === 'team'
                          ? 'bg-card text-foreground border border-border shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Activity size={12} className="text-primary" />
                      <span>Team performance</span>
                    </button>
                  </div>

                  {/* Big Metric Display + Timeframe Dropdown */}
                  <div className="flex items-baseline justify-between mb-2">
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-3xl lg:text-4xl font-extrabold text-foreground font-mono tracking-tight">
                        {appointments.length > 0 ? (appointments.length * 15 + 120) : '180'}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">Completed tasks</span>
                    </div>

                    <div className="relative">
                      <select
                        value={timeframe}
                        onChange={(e) => setTimeframe(e.target.value as any)}
                        className="bg-secondary border border-border text-xs text-foreground rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer appearance-none pr-7"
                      >
                        <option value="Week">Week</option>
                        <option value="Month">Month</option>
                        <option value="Year">Year</option>
                      </select>
                      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  {/* Bezier Curve SVG Chart inheriting theme variables */}
                  <div className="relative w-full h-48 mt-3">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 500 160">
                      <defs>
                        <linearGradient id="themeCurveGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
                          <stop offset="60%" stopColor="var(--primary)" stopOpacity="0.08" />
                          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      {/* Gradient Area Fill */}
                      <path
                        d="M 10 140 C 40 120, 50 30, 80 40 C 110 50, 130 140, 160 145 C 190 150, 210 70, 240 60 C 270 50, 290 145, 320 145 C 350 145, 370 30, 400 35 C 430 40, 450 140, 480 140 L 480 155 L 10 155 Z"
                        fill="url(#themeCurveGradient)"
                      />

                      {/* Stroke Curve */}
                      <path
                        d="M 10 140 C 40 120, 50 30, 80 40 C 110 50, 130 140, 160 145 C 190 150, 210 70, 240 60 C 270 50, 290 145, 320 145 C 350 145, 370 30, 400 35 C 430 40, 450 140, 480 140"
                        fill="none"
                        stroke="var(--primary)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />

                      {/* Vertical marker line */}
                      <line
                        x1="240"
                        y1="60"
                        x2="240"
                        y2="155"
                        stroke="var(--primary)"
                        strokeWidth="1.2"
                        strokeDasharray="3 3"
                        opacity="0.6"
                      />

                      {/* Indicator Circle Dot at (240, 60) */}
                      <circle
                        cx="240"
                        cy="60"
                        r="5"
                        fill="var(--primary)"
                        stroke="var(--card)"
                        strokeWidth="2.5"
                      />

                      {/* X-Axis bottom dot */}
                      <circle
                        cx="240"
                        cy="155"
                        r="6"
                        fill="var(--primary)"
                      />
                      <text x="240" y="158" textAnchor="middle" fontSize="8" fontWeight="bold" fill="var(--primary-foreground)">
                        11
                      </text>

                      {/* Axis Labels */}
                      <text x="5" y="20" fontSize="8" fill="var(--muted-foreground)" fontFamily="monospace">40</text>
                      <text x="5" y="60" fontSize="8" fill="var(--muted-foreground)" fontFamily="monospace">30</text>
                      <text x="5" y="100" fontSize="8" fill="var(--muted-foreground)" fontFamily="monospace">20</text>
                      <text x="5" y="140" fontSize="8" fill="var(--muted-foreground)" fontFamily="monospace">10</text>
                      <text x="5" y="158" fontSize="8" fill="var(--muted-foreground)" fontFamily="monospace">0</text>
                    </svg>

                    {/* Tooltip Overlay */}
                    <div
                      className="absolute bg-card border border-border rounded-xl px-2.5 py-1.5 shadow-xl flex flex-col text-[0.68rem] text-foreground pointer-events-none"
                      style={{ left: '46%', top: '10%' }}
                    >
                      <span className="text-[0.62rem] text-muted-foreground">14 January</span>
                      <div className="flex items-center gap-1.5 font-bold text-foreground mt-0.5">
                        <span>18 tasks</span>
                        <span className="bg-primary/10 text-primary border border-primary/20 text-[0.58rem] px-1 py-0.2 rounded font-mono font-bold flex items-center">
                          &darr; 19%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[0.68rem] font-mono text-muted-foreground pt-2 border-t border-border">
                    <span>01</span>
                    <span>14 Jan</span>
                    <span>21 Jan</span>
                    <span>October</span>
                  </div>
                </div>
              </div>

              {/* WIDGET 3: Stacked Stat Cards (Right) */}
              <div className="xl:col-span-3 flex flex-col justify-between gap-4">
                {/* Card 1: Appointments */}
                <div className="bg-card border border-border rounded-xl p-5 relative shadow-sm hover:border-primary/40 transition-colors flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                        <Calendar size={13} className="text-primary" />
                        <span>Appointments</span>
                      </div>
                      <div className="text-2xl font-bold font-mono text-foreground mt-1">
                        {appointments.length > 0 ? appointments.length : 78}
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('book')}
                      className="w-8 h-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-transform hover:scale-105 shadow-sm cursor-pointer"
                    >
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                  <div className="mt-3.5 flex items-center gap-1.5 text-[0.65rem]">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                      &darr; 4%
                    </span>
                    <span className="text-muted-foreground">vs last month</span>
                  </div>
                </div>

                {/* Card 2: Tasks */}
                <div className="bg-card border border-border rounded-xl p-5 relative shadow-sm hover:border-primary/40 transition-colors flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                        <CheckCircle2 size={13} className="text-emerald-400" />
                        <span>Tasks & Regimens</span>
                      </div>
                      <div className="text-2xl font-bold font-mono text-foreground mt-1">
                        {prescriptions.length > 0 ? (prescriptions.length * 12 + 180) : 235}
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('prescriptions')}
                      className="w-8 h-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-transform hover:scale-105 shadow-sm cursor-pointer"
                    >
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                  <div className="mt-3.5 flex items-center gap-1.5 text-[0.65rem]">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                      &uarr; 12%
                    </span>
                    <span className="text-muted-foreground">vs last month</span>
                  </div>
                </div>

                {/* Card 3: Patients */}
                <div className="bg-card border border-border rounded-xl p-5 relative shadow-sm hover:border-primary/40 transition-colors flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                        <Users size={13} className="text-primary" />
                        <span>Active Patients</span>
                      </div>
                      <div className="text-2xl font-bold font-mono text-foreground mt-1">
                        {myProfile ? '1' : '78'}
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('overview')}
                      className="w-8 h-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-transform hover:scale-105 shadow-sm cursor-pointer"
                    >
                      <ArrowUpRight size={15} />
                    </button>
                  </div>
                  <div className="mt-3.5 flex items-center gap-1.5 text-[0.65rem]">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                      &uarr; 3%
                    </span>
                    <span className="text-muted-foreground">vs last month</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 2: TASKS OVERVIEW / CLINICAL KANBAN BOARD */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
              {/* Board Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                <div className="flex items-center gap-3.5">
                  <h3 className="font-semibold text-foreground text-sm tracking-tight">Tasks overview</h3>
                  <div className="flex items-center bg-secondary/50 border border-border rounded-lg p-0.5 text-xs">
                    <button
                      onClick={() => setBoardView('board')}
                      className={cn(
                        'px-3 py-1 rounded-md font-medium transition-all cursor-pointer text-xs',
                        boardView === 'board' ? 'bg-card text-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Board
                    </button>
                    <button
                      onClick={() => setBoardView('list')}
                      className={cn(
                        'px-3 py-1 rounded-md font-medium transition-all cursor-pointer text-xs',
                        boardView === 'list' ? 'bg-card text-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      List
                    </button>
                    <button
                      onClick={() => setBoardView('calendar')}
                      className={cn(
                        'px-3 py-1 rounded-md font-medium transition-all cursor-pointer text-xs',
                        boardView === 'calendar' ? 'bg-card text-foreground font-semibold shadow-xs' : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      Calendar
                    </button>
                  </div>
                </div>

                {/* Action Buttons: View All, Plus, Filter, Sort */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className="bg-secondary hover:bg-secondary/80 border border-border text-xs text-foreground font-medium px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    View all
                  </button>
                  <button
                    onClick={() => setIsBookingModalOpen(true)}
                    className="w-8 h-8 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                    title="Add Task / Consultation"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    onClick={() => showToast?.('Filter applied: Active cases')}
                    className="flex items-center gap-1.5 bg-secondary hover:bg-secondary/80 border border-border text-xs text-foreground font-medium px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Filter size={13} className="text-muted-foreground" />
                    <span>Filter</span>
                  </button>
                  <button
                    onClick={() => showToast?.('Sorted by Priority')}
                    className="flex items-center gap-1.5 bg-secondary hover:bg-secondary/80 border border-border text-xs text-foreground font-medium px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <ArrowUpDown size={13} className="text-muted-foreground" />
                    <span>Sort</span>
                  </button>
                </div>
              </div>

              {/* 4-Column Clinical Workflow Board */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                {/* Column 1: Upcoming */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs px-1 mb-1">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <span>Upcoming</span>
                      <span className="w-5 h-5 rounded-full bg-secondary border border-border flex items-center justify-center text-[0.65rem] text-muted-foreground font-mono">
                        5
                      </span>
                    </div>
                    <button className="text-muted-foreground hover:text-foreground cursor-pointer">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>

                  <div className="bg-secondary/40 border border-border rounded-xl p-4 space-y-3.5 hover:border-primary/40 transition-colors">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar size={13} />
                      <span>Sa, 11 Jan</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-foreground leading-snug">Update Patient Records</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Review and update profiles with complete clinical diagnostics by tomorrow.
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[0.6rem] font-bold">
                          JD
                        </div>
                        <span className="text-xs text-muted-foreground">+ Add</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          Low
                        </span>
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground font-mono">
                          <Share2 size={12} /> 6
                        </span>
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground font-mono">
                          <MessageCircle size={12} /> 3
                        </span>
                      </div>
                    </div>
                    <div className="text-right pt-1">
                      <button
                        onClick={() => setActiveTab('overview')}
                        className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>See more</span> &gt;
                      </button>
                    </div>
                  </div>
                </div>

                {/* Column 2: In Progress */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs px-1 mb-1">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <span>In progress</span>
                      <span className="w-5 h-5 rounded-full bg-secondary border border-border flex items-center justify-center text-[0.65rem] text-muted-foreground font-mono">
                        12
                      </span>
                    </div>
                    <button className="text-muted-foreground hover:text-foreground cursor-pointer">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>

                  <div className="bg-secondary/40 border border-border rounded-xl p-4 space-y-3.5 hover:border-primary/40 transition-colors">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar size={13} />
                      <span>Tu, 14 Jan</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-foreground leading-snug">Schedule Team Meeting</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Confirm specialist doctor slots with the dispensary staff today.
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center -space-x-1.5">
                        <div className="w-6 h-6 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-[0.6rem] font-bold">
                          DR
                        </div>
                        <div className="w-6 h-6 rounded-full bg-secondary text-foreground border border-border flex items-center justify-center text-[0.6rem] font-bold">
                          PH
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          Medium
                        </span>
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground font-mono">
                          <Share2 size={12} /> 5
                        </span>
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground font-mono">
                          <MessageCircle size={12} /> 1
                        </span>
                      </div>
                    </div>
                    <div className="text-right pt-1">
                      <button
                        onClick={() => setActiveTab('book')}
                        className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>See more</span> &gt;
                      </button>
                    </div>
                  </div>
                </div>

                {/* Column 3: Completed */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs px-1 mb-1">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <span>Completed</span>
                      <span className="w-5 h-5 rounded-full bg-secondary border border-border flex items-center justify-center text-[0.65rem] text-muted-foreground font-mono">
                        6
                      </span>
                    </div>
                    <button className="text-muted-foreground hover:text-foreground cursor-pointer">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>

                  <div className="bg-secondary/40 border border-border rounded-xl p-4 space-y-3.5 hover:border-primary/40 transition-colors">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar size={13} />
                      <span>Mo, 13 Jan</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-foreground leading-snug">Submit Monthly Report</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        All clinical intake records sent to department hospital management.
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[0.6rem] font-bold">
                          AD
                        </div>
                        <span className="text-xs text-muted-foreground">+ Add</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          Complete
                        </span>
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground font-mono">
                          <Share2 size={12} /> 3
                        </span>
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground font-mono">
                          <MessageCircle size={12} /> 3
                        </span>
                      </div>
                    </div>
                    <div className="text-right pt-1">
                      <button
                        onClick={() => setActiveTab('billing')}
                        className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>See more</span> &gt;
                      </button>
                    </div>
                  </div>
                </div>

                {/* Column 4: Attention Required */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs px-1 mb-1">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <span>Attention required</span>
                      <span className="w-5 h-5 rounded-full bg-secondary border border-border flex items-center justify-center text-[0.65rem] text-muted-foreground font-mono">
                        12
                      </span>
                    </div>
                    <button className="text-muted-foreground hover:text-foreground cursor-pointer">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>

                  <div className="bg-secondary/40 border border-border rounded-xl p-4 space-y-3.5 hover:border-primary/40 transition-colors">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar size={13} />
                      <span>Th, 9 Jan</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-foreground leading-snug">Reschedule Appointment</h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        Patient requested a new doctor consultation time slot.
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-destructive/20 text-destructive border border-destructive/30 flex items-center justify-center text-[0.6rem] font-bold">
                          PT
                        </div>
                        <span className="text-xs text-muted-foreground">+ Add</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/30">
                          High
                        </span>
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground font-mono">
                          <Share2 size={12} /> 5
                        </span>
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground font-mono">
                          <MessageCircle size={12} /> 2
                        </span>
                      </div>
                    </div>
                    <div className="text-right pt-1">
                      <button
                        onClick={() => setActiveTab('book')}
                        className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>See more</span> &gt;
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. SUB-PAGES INTEGRATION */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <PatientOverviewPage onAdmitClick={() => setActiveTab('admit')} />
          </div>
        )}

        {activeTab === 'book' && (
          <div className="space-y-6">
            <BookAppointmentPage />
          </div>
        )}

        {activeTab === 'prescriptions' && (
          <div className="space-y-6">
            <PatientPrescriptionsPage />
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6">
            <PatientBillingPage />
          </div>
        )}

        {activeTab === 'admit' && (
          <div className="space-y-6">
            <AdmitPatientPage
              onNavigateToOverview={() => setActiveTab('overview')}
              onAdmittedSuccess={() => setActiveTab('overview')}
            />
          </div>
        )}
      </main>

      {/* 5. CONSULTATION BOOKING MODAL */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-card text-card-foreground border border-border rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Calendar size={16} className="text-primary" />
                <span>Book Specialist Consultation</span>
              </div>
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-4 text-xs">
              <div>
                <label className="block text-foreground mb-1.5 font-medium">Physician</label>
                <select
                  value={bookingForm.doctorId}
                  onChange={(e) => setBookingForm({ ...bookingForm, doctorId: e.target.value })}
                  required
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Select a physician...</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      Dr. {d.user.firstName} {d.user.lastName} ({d.specialization}) - ${d.consultationFee.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-foreground mb-1.5 font-medium">Preferred Date</label>
                <input
                  type="date"
                  value={bookingForm.appointmentDate}
                  onChange={(e) => setBookingForm({ ...bookingForm, appointmentDate: e.target.value })}
                  required
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                </input>
              </div>

              <div>
                <label className="block text-foreground mb-1.5 font-medium">Time Slot</label>
                <select
                  value={bookingForm.timeSlot}
                  onChange={(e) => setBookingForm({ ...bookingForm, timeSlot: e.target.value })}
                  required
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="09:00 - 09:30 AM">09:00 - 09:30 AM</option>
                  <option value="09:30 - 10:00 AM">09:30 - 10:00 AM</option>
                  <option value="10:30 - 11:00 AM">10:30 - 11:00 AM</option>
                  <option value="11:30 - 12:00 PM">11:30 - 12:00 PM</option>
                  <option value="02:00 - 02:30 PM">02:00 - 02:30 PM</option>
                  <option value="03:30 - 04:00 PM">03:30 - 04:00 PM</option>
                </select>
              </div>

              <div>
                <label className="block text-foreground mb-1.5 font-medium">Reason for Consultation</label>
                <input
                  type="text"
                  placeholder="e.g. Health assessment, knee rehabilitation"
                  value={bookingForm.reason}
                  onChange={(e) => setBookingForm({ ...bookingForm, reason: e.target.value })}
                  required
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsBookingModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                >
                  Confirm Booking
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. CREATE REPORT MODAL */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-card text-card-foreground border border-border rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText size={16} className="text-primary" />
                <span>Generate Clinical Report</span>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-muted-foreground space-y-2">
              <p>Download comprehensive PDF telemetry covering appointments, medication adherence, and department performance metrics.</p>
              <div className="p-3 bg-secondary rounded-lg border border-border space-y-1 font-mono text-[0.7rem] text-foreground">
                <div>Period: Last 30 Days</div>
                <div>Completed Tasks: 180</div>
                <div>Active Consultations: {appointments.length}</div>
                <div>Settled Invoices: {bills.length}</div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReportModalOpen(false)}
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  showToast?.('Report exported successfully as PDF');
                  setIsReportModalOpen(false);
                }}
              >
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientPortal;
