import React, { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import {
  Calendar,
  FileText,
  CreditCard,
  Stethoscope,
  Plus,
  RefreshCw,
  Activity,
  Shield,
  Pill,
  Users,
  CalendarX,
  Receipt,
  Check,
} from 'lucide-react';

import { api } from '../../shared/api';
import type { Appointment, Doctor, Bill, Prescription, Patient } from '../../shared/types';
import { useAuth } from '../../shared/context/AuthContext';
import { ThemeToggle } from '../../shared/components/ThemeToggle';
import { cn } from '@/lib/utils';

interface Props {
  onNavigate?: (portal: string) => void;
}

export const MasterHospitalDashboard: React.FC<Props> = ({ onNavigate }) => {
  const { role, currentUser, switchRole, showToast } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [myProfile, setMyProfile] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'bookings' | 'prescriptions' | 'invoices'>('overview');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    doctorId: '',
    patientId: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '09:30 - 10:00 AM',
    reason: '',
    payUpfront: true,
    paymentMethod: 'CARD' as 'CARD' | 'UPI' | 'ONLINE' | 'CASH',
  });

  useEffect(() => {
    loadData();
    // Track dashboard telemetry
    api.recordPageHit({
      pageUrl: '/dashboard',
      pageTitle: 'Hospital Dashboard',
      userRole: role,
      userId: currentUser?.id,
    }).catch(() => {});
  }, [role, currentUser?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [apts, pres, bls, docs, profile] = await Promise.all([
        api.getAppointments().catch(() => []),
        api.getPrescriptions().catch(() => []),
        role === 'DOCTOR' ? Promise.resolve([]) : api.getBills().catch(() => []),
        api.getDoctors().catch(() => []),
        role === 'PATIENT' ? api.getMyPatientProfile().catch(() => null) : Promise.resolve(null),
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
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.doctorId || !bookingForm.patientId) {
      showToast?.('Please pick an attending specialist physician', true);
      return;
    }
    try {
      const created = await api.createAppointment(bookingForm);
      showToast?.(
        created.status === 'CONFIRMED'
          ? 'Consultation fee settled — appointment CONFIRMED!'
          : 'Consultation booked as PENDING — settle Consultation Fee to confirm.',
      );
      setIsBookingModalOpen(false);
      setBookingForm((prev) => ({ ...prev, reason: '' }));
      loadData();
    } catch (err: any) {
      showToast?.(err.message, true);
    }
  };

  const handlePayBill = async (billId: string, amount: number) => {
    try {
      await api.recordPayment(billId, amount);
      showToast?.('Payment recorded successfully!');
      loadData();
    } catch (err: any) {
      showToast?.(err.message, true);
    }
  };

  const handlePortalSwitch = (newRole: 'ADMIN' | 'DOCTOR' | 'PHARMACIST' | 'PATIENT') => {
    if (role === 'ADMIN') {
      if (newRole === 'ADMIN') onNavigate?.('admin/dashboard');
      else if (newRole === 'DOCTOR') onNavigate?.('admin/doctors');
      else if (newRole === 'PHARMACIST') onNavigate?.('admin/staff');
      else if (newRole === 'PATIENT') onNavigate?.('admin/patients');
      return;
    }
    switchRole(newRole);
    if (newRole === 'ADMIN') onNavigate?.('admin/dashboard');
    else if (newRole === 'DOCTOR') onNavigate?.('doctor/dashboard');
    else if (newRole === 'PHARMACIST') onNavigate?.('pharmacist/dashboard');
    else if (newRole === 'PATIENT') onNavigate?.('patient/dashboard');
  };

  const pendingBills = bills.filter((b) => b.status !== 'PAID');
  const outstandingTotal = pendingBills.reduce((sum, b) => sum + (b.totalAmount - (b.paidAmount || 0)), 0);
  const totalSettled = bills.filter((b) => b.status === 'PAID').reduce((sum, b) => sum + b.totalAmount, 0);

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'CONFIRMED' || s === 'COMPLETED' || s === 'DISPENSED' || s === 'PAID') {
      return (
        <Badge
          variant="outline"
          className="gap-1.5 font-mono text-[0.68rem] border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold uppercase tracking-wider shrink-0 whitespace-nowrap py-0.5 px-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          {status}
        </Badge>
      );
    }
    if (s === 'PENDING' || s === 'SCHEDULED' || s === 'ISSUED' || s === 'IN_PROGRESS') {
      return (
        <Badge
          variant="outline"
          className="gap-1.5 font-mono text-[0.68rem] border-amber-500/30 bg-amber-500/10 text-amber-400 font-semibold uppercase tracking-wider shrink-0 whitespace-nowrap py-0.5 px-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
          {status}
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="gap-1.5 font-mono text-[0.68rem] border-border bg-secondary text-muted-foreground font-semibold uppercase tracking-wider shrink-0 whitespace-nowrap py-0.5 px-2"
      >
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-background text-foreground flex flex-col font-sans antialiased">
      {/* 1. Sleek, Fixed Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md w-full max-w-full min-w-0">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4 min-w-0">
          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold shadow-xs shrink-0">
              <Activity size={18} strokeWidth={2.4} />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-foreground text-base leading-none">AURA</span>
              <span className="hidden sm:inline text-xs text-muted-foreground font-medium leading-none border-l border-border pl-2">
                Hospital System
              </span>
            </div>
          </div>

          {/* Grouped Portal Switches */}
          <div className="flex items-center bg-secondary border border-border rounded-lg p-1 text-xs gap-1 min-w-0 max-w-full overflow-x-auto scrollbar-hidden shrink">
            <button
              onClick={() => handlePortalSwitch('ADMIN')}
              className={cn(
                'px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-2 cursor-pointer select-none leading-none whitespace-nowrap shrink-0',
                role === 'ADMIN'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Shield size={13} strokeWidth={2.2} className={cn('shrink-0', role === 'ADMIN' ? 'text-primary' : 'text-muted-foreground')} />
              <span>Admin</span>
            </button>
            <button
              onClick={() => handlePortalSwitch('DOCTOR')}
              className={cn(
                'px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-2 cursor-pointer select-none leading-none whitespace-nowrap shrink-0',
                role === 'DOCTOR'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Stethoscope size={13} strokeWidth={2.2} className={cn('shrink-0', role === 'DOCTOR' ? 'text-primary' : 'text-muted-foreground')} />
              <span>Doctor</span>
            </button>
            <button
              onClick={() => handlePortalSwitch('PHARMACIST')}
              className={cn(
                'px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-2 cursor-pointer select-none leading-none whitespace-nowrap shrink-0',
                role === 'PHARMACIST'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Pill size={13} strokeWidth={2.2} className={cn('shrink-0', role === 'PHARMACIST' ? 'text-primary' : 'text-muted-foreground')} />
              <span>Pharmacist</span>
            </button>
            <button
              onClick={() => handlePortalSwitch('PATIENT')}
              className={cn(
                'px-3 py-1.5 rounded-md font-medium transition-all flex items-center gap-2 cursor-pointer select-none leading-none whitespace-nowrap shrink-0',
                role === 'PATIENT'
                  ? 'bg-card text-foreground shadow-xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Users size={13} strokeWidth={2.2} className={cn('shrink-0', role === 'PATIENT' ? 'text-primary' : 'text-muted-foreground')} />
              <span>Patient</span>
            </button>
          </div>

          {/* Quick Actions & Live DB Status */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-secondary text-[0.68rem] font-mono text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span>MongoDB rs0 Live</span>
            </div>

            <ThemeToggle />

            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              className="gap-1.5 cursor-pointer"
              title="Refresh telemetry"
            >
              <RefreshCw size={13} className={cn('shrink-0', loading && 'animate-spin')} />
              <span className="hidden md:inline">Sync</span>
            </Button>
          </div>
        </div>

        {/* Secondary Sub-Navigation Bar */}
        <div className="border-t border-border bg-muted/20 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-7xl mx-auto">
            <Tabs
              value={activeSubTab}
              onValueChange={(val: string) => setActiveSubTab(val as 'overview' | 'bookings' | 'prescriptions' | 'invoices')}
              className="w-full"
            >
              <TabsList className="bg-transparent border-0 gap-4 sm:gap-6 md:gap-8 p-0 h-12 flex justify-start rounded-none overflow-x-auto scrollbar-hidden w-full max-w-full min-w-0">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-1.5 py-0 text-muted-foreground hover:text-foreground font-medium text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-none transition-none shrink-0 whitespace-nowrap"
                >
                  <Activity size={15} className={cn('shrink-0', activeSubTab === 'overview' ? 'text-primary' : 'text-muted-foreground')} />
                  <span>Overview</span>
                </TabsTrigger>
                <TabsTrigger
                  value="bookings"
                  className="data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-1.5 py-0 text-muted-foreground hover:text-foreground font-medium text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-none transition-none shrink-0 whitespace-nowrap"
                >
                  <Calendar size={15} className={cn('shrink-0', activeSubTab === 'bookings' ? 'text-primary' : 'text-muted-foreground')} />
                  <span>Bookings</span>
                  <span className="ml-0.5 text-[0.68rem] font-mono px-2 py-0.5 rounded-full bg-secondary text-muted-foreground leading-none shrink-0">
                    {appointments.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="prescriptions"
                  className="data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-1.5 py-0 text-muted-foreground hover:text-foreground font-medium text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-none transition-none shrink-0 whitespace-nowrap"
                >
                  <FileText size={15} className={cn('shrink-0', activeSubTab === 'prescriptions' ? 'text-primary' : 'text-muted-foreground')} />
                  <span>Prescriptions</span>
                  <span className="ml-0.5 text-[0.68rem] font-mono px-2 py-0.5 rounded-full bg-secondary text-muted-foreground leading-none shrink-0">
                    {prescriptions.length}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="invoices"
                  className="data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-1.5 py-0 text-muted-foreground hover:text-foreground font-medium text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-none transition-none shrink-0 whitespace-nowrap"
                >
                  <CreditCard size={15} className={cn('shrink-0', activeSubTab === 'invoices' ? 'text-primary' : 'text-muted-foreground')} />
                  <span>Invoices</span>
                  {pendingBills.length > 0 && (
                    <span className="ml-0.5 text-[0.68rem] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 leading-none shrink-0">
                      {pendingBills.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      {/* Main Workspace Container with Consistent Margins */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 min-w-0">
        <Tabs
          value={activeSubTab}
          onValueChange={(val: string) => setActiveSubTab(val as 'overview' | 'bookings' | 'prescriptions' | 'invoices')}
          className="w-full"
        >
          {/* VIEW 1: OVERVIEW */}
          <TabsContent value="overview" className="mt-0 space-y-8 min-w-0">
            {/* Patient Clinical Greeting Banner */}
            {myProfile && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-xl border border-border bg-card min-w-0 shadow-sm">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold shrink-0">
                    <Users size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm sm:text-base font-semibold text-foreground leading-snug truncate">
                      Welcome back, {myProfile.user.firstName} {myProfile.user.lastName}
                    </h2>
                    <p className="text-xs text-muted-foreground leading-normal truncate mt-0.5">
                      Patient Reference: <span className="font-mono text-primary font-semibold">PAT-{myProfile.id.slice(0, 8).toUpperCase()}</span> &bull; Blood Group: {myProfile.bloodGroup || 'O+'} &bull; Gender: {myProfile.gender || 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
                  <Button
                    size="sm"
                    onClick={() => setIsBookingModalOpen(true)}
                    className="gap-1.5 cursor-pointer"
                  >
                    <Plus size={14} className="shrink-0" />
                    <span>+ Book Visit</span>
                  </Button>
                </div>
              </div>
            )}

            {/* 2. Metric Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 min-w-0">
              {/* Card 1: Scheduled Visits */}
              <Card className="flex flex-col justify-between min-w-0">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate flex-1">
                    Scheduled Visits
                  </CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                    <Calendar size={16} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono text-foreground tracking-tight leading-none truncate my-1">
                    {appointments.length}
                  </div>
                  <div className="text-xs text-muted-foreground leading-tight truncate mt-1">
                    Upcoming clinical visits
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Active Prescriptions */}
              <Card className="flex flex-col justify-between min-w-0">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate flex-1">
                    Active Prescriptions
                  </CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                    <FileText size={16} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono text-foreground tracking-tight leading-none truncate my-1">
                    {prescriptions.length}
                  </div>
                  <div className="text-xs text-muted-foreground leading-tight truncate mt-1">
                    Authorized medical regimens
                  </div>
                </CardContent>
              </Card>

              {/* Card 3: Outstanding Balance */}
              <Card className="flex flex-col justify-between min-w-0">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate flex-1">
                    Outstanding Balance
                  </CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                    <CreditCard size={16} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono text-foreground tracking-tight leading-none truncate my-1">
                    ${outstandingTotal.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground leading-tight truncate mt-1">
                    Settled: ${totalSettled.toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              {/* Card 4: Specialist Doctors */}
              <Card className="flex flex-col justify-between min-w-0">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate flex-1">
                    Hospital Specialists
                  </CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                    <Stethoscope size={16} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono text-foreground tracking-tight leading-none truncate my-1">
                    {doctors.length}
                  </div>
                  <div className="text-xs text-muted-foreground leading-tight truncate mt-1">
                    Attending physicians available
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 3. Streamlined Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
              {/* Left Column: My Clinical Consultations */}
              <Card className="overflow-hidden flex flex-col justify-between min-w-0">
                <CardHeader className="p-6 pb-4 border-b border-border flex flex-row items-center justify-between gap-4 min-w-0">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base font-semibold text-foreground leading-snug truncate">
                      My Clinical Consultations
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-1 leading-normal truncate">
                      Scheduled physician appointments & checkups
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setIsBookingModalOpen(true)}
                    className="gap-1.5 cursor-pointer shrink-0"
                  >
                    <Plus size={14} className="shrink-0" />
                    <span>+ Book Visit</span>
                  </Button>
                </CardHeader>

                <CardContent className="p-0 flex-1 min-w-0">
                  {appointments.length === 0 ? (
                    <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-secondary border border-border text-muted-foreground flex items-center justify-center mb-3.5 shrink-0">
                        <CalendarX size={22} />
                      </div>
                      <div className="text-sm font-semibold text-foreground leading-snug">
                        No Consultations Scheduled
                      </div>
                      <div className="text-xs text-muted-foreground max-w-xs mt-1.5 leading-relaxed">
                        You currently have no specialist appointments on your schedule. Reserve a consultation with an attending physician.
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setIsBookingModalOpen(true)}
                        className="mt-5 gap-1.5 cursor-pointer"
                      >
                        <Plus size={14} className="shrink-0" />
                        <span>+ Book Visit</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto scrollbar-hidden w-full max-w-full min-w-0">
                      <Table className="bg-transparent w-full border-0 rounded-none shadow-none">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs px-4 py-3 whitespace-nowrap">
                              Slot & Date
                            </TableHead>
                            <TableHead className="text-xs px-3 py-3 whitespace-nowrap">
                              Physician
                            </TableHead>
                            <TableHead className="text-xs px-3 py-3">
                              Reason
                            </TableHead>
                            <TableHead className="text-xs px-4 py-3 text-right whitespace-nowrap">
                              Status
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {appointments.slice(0, 5).map((apt) => (
                            <TableRow key={apt.id}>
                              <TableCell className="px-4 py-3 whitespace-nowrap">
                                <div className="font-semibold text-foreground text-xs leading-snug">
                                  {apt.timeSlot}
                                </div>
                                <div className="font-mono text-[0.68rem] text-muted-foreground leading-none mt-0.5">
                                  {new Date(apt.appointmentDate).toLocaleDateString()}
                                </div>
                              </TableCell>
                              <TableCell className="px-3 py-3 text-xs text-foreground font-medium whitespace-nowrap">
                                {apt.doctor?.user ? `Dr. ${apt.doctor.user.lastName}` : 'Physician'}
                              </TableCell>
                              <TableCell className="px-3 py-3 text-xs text-muted-foreground max-w-[130px] truncate">
                                {apt.reason || 'General Consultation'}
                              </TableCell>
                              <TableCell className="px-4 py-3 text-right whitespace-nowrap">
                                {getStatusBadge(apt.status)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Right Column: My Medications */}
              <Card className="overflow-hidden flex flex-col justify-between min-w-0">
                <CardHeader className="p-6 pb-4 border-b border-border flex flex-row items-center justify-between gap-4 min-w-0">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base font-semibold text-foreground leading-snug truncate">
                      My Medications
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-1 leading-normal truncate">
                      Active regimens prescribed by hospital specialists
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-muted-foreground font-mono text-xs shrink-0 py-0.5 px-2 leading-none">
                    {prescriptions.length} Regimens
                  </Badge>
                </CardHeader>

                <CardContent className="p-6 flex-1 min-w-0">
                  {prescriptions.length === 0 ? (
                    <div className="py-8 sm:py-12 text-center flex flex-col items-center justify-center min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-secondary border border-border text-muted-foreground flex items-center justify-center mb-3.5 shrink-0">
                        <FileText size={22} />
                      </div>
                      <div className="text-sm font-semibold text-foreground leading-snug">
                        No Active Prescriptions
                      </div>
                      <div className="text-xs text-muted-foreground max-w-xs mt-1.5 leading-relaxed">
                        You have no medical prescriptions on record. Following a doctor consultation, orders will appear here automatically.
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setIsBookingModalOpen(true)}
                        className="mt-5 gap-1.5 cursor-pointer"
                      >
                        <Plus size={14} className="shrink-0" />
                        <span>+ Book Visit</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3 min-w-0">
                      {prescriptions.slice(0, 4).map((rx) => (
                        <div
                          key={rx.id}
                          className="p-3.5 rounded-xl border border-border bg-card/60 hover:bg-muted/40 transition-colors flex items-center justify-between gap-3 min-w-0 shadow-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap min-w-0">
                              <span className="font-mono font-bold text-primary text-xs leading-none shrink-0">
                                {rx.prescriptionNo}
                              </span>
                              <span className="text-muted-foreground text-xs leading-none shrink-0">&bull;</span>
                              <span className="text-[0.7rem] text-muted-foreground leading-none truncate">
                                Dr. {rx.doctor?.user?.lastName || 'Consultant'} &bull; {new Date(rx.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div
                              className="text-xs text-foreground font-medium mt-1.5 truncate leading-snug"
                              title={rx.items?.map((it) => `${it.medicineName} (${it.frequency})`).join(', ')}
                            >
                              {rx.items?.map((it) => `${it.medicineName} (${it.frequency})`).join(', ')}
                            </div>
                          </div>
                          <div className="shrink-0">{getStatusBadge(rx.status)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* VIEW 2: BOOKINGS */}
          <TabsContent value="bookings" className="mt-0 min-w-0">
            <Card className="overflow-hidden min-w-0">
              <CardHeader className="p-6 border-b border-border flex flex-row items-center justify-between gap-4 min-w-0">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base font-semibold text-foreground leading-snug truncate">
                    Consultation Bookings
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-1 leading-normal truncate">
                    Track and manage specialist appointments
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsBookingModalOpen(true)}
                  className="gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus size={14} className="shrink-0" />
                  <span>+ Book Visit</span>
                </Button>
              </CardHeader>
              <CardContent className="p-0 min-w-0">
                {appointments.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center min-w-0">
                    <CalendarX size={26} className="text-muted-foreground mb-3 shrink-0" />
                    <div className="text-sm font-semibold text-foreground leading-snug">
                      No Consultations Scheduled
                    </div>
                    <div className="text-xs text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
                      Schedule a consultation with an attending hospital physician.
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setIsBookingModalOpen(true)}
                      className="mt-4"
                    >
                      + Book Visit
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto scrollbar-hidden w-full max-w-full min-w-0">
                    <Table className="bg-transparent w-full border-0 rounded-none shadow-none">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs px-6 py-3 whitespace-nowrap">
                            Slot & Date
                          </TableHead>
                          <TableHead className="text-xs py-3 whitespace-nowrap">
                            Physician
                          </TableHead>
                          <TableHead className="text-xs py-3 whitespace-nowrap">
                            Specialization
                          </TableHead>
                          <TableHead className="text-xs py-3">
                            Reason
                          </TableHead>
                          <TableHead className="text-xs px-6 py-3 text-right whitespace-nowrap">
                            Status
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {appointments.map((apt) => (
                          <TableRow key={apt.id}>
                            <TableCell className="px-6 py-3.5 whitespace-nowrap">
                              <div className="font-semibold text-foreground text-xs leading-snug">
                                {apt.timeSlot}
                              </div>
                              <div className="font-mono text-[0.68rem] text-muted-foreground leading-none mt-0.5">
                                {new Date(apt.appointmentDate).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell className="py-3.5 text-xs text-foreground font-medium whitespace-nowrap">
                              {apt.doctor?.user ? `Dr. ${apt.doctor.user.firstName} ${apt.doctor.user.lastName}` : 'Physician'}
                            </TableCell>
                            <TableCell className="py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                              {apt.doctor?.specialization || 'Clinical Care'}
                            </TableCell>
                            <TableCell className="py-3.5 text-xs text-muted-foreground max-w-[200px] truncate">
                              {apt.reason || 'General Consultation'}
                            </TableCell>
                            <TableCell className="px-6 py-3.5 text-right whitespace-nowrap">
                              {getStatusBadge(apt.status)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* VIEW 3: PRESCRIPTIONS */}
          <TabsContent value="prescriptions" className="mt-0 min-w-0">
            <Card className="overflow-hidden min-w-0">
              <CardHeader className="p-6 border-b border-border flex flex-row items-center justify-between gap-4 min-w-0">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base font-semibold text-foreground leading-snug truncate">
                    Medical Prescriptions
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-1 leading-normal truncate">
                    Official medication orders signed by hospital doctors
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-muted-foreground font-mono text-xs shrink-0 py-0.5 px-2 leading-none">
                  {prescriptions.length} Records
                </Badge>
              </CardHeader>
              <CardContent className="p-0 min-w-0">
                {prescriptions.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center min-w-0">
                    <FileText size={26} className="text-muted-foreground mb-3 shrink-0" />
                    <div className="text-sm font-semibold text-foreground leading-snug">
                      No Prescriptions On Record
                    </div>
                    <div className="text-xs text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
                      Orders will appear here once prescribed by a physician.
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto scrollbar-hidden w-full max-w-full min-w-0">
                    <Table className="bg-transparent w-full border-0 rounded-none shadow-none">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs px-6 py-3 whitespace-nowrap">
                            Prescription No
                          </TableHead>
                          <TableHead className="text-xs py-3 whitespace-nowrap">
                            Physician
                          </TableHead>
                          <TableHead className="text-xs py-3">
                            Regimen Details
                          </TableHead>
                          <TableHead className="text-xs py-3 whitespace-nowrap">
                            Date
                          </TableHead>
                          <TableHead className="text-xs px-6 py-3 text-right whitespace-nowrap">
                            Status
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {prescriptions.map((rx) => (
                          <TableRow key={rx.id}>
                            <TableCell className="px-6 py-3.5 font-mono text-xs text-primary font-bold whitespace-nowrap">
                              {rx.prescriptionNo}
                            </TableCell>
                            <TableCell className="py-3.5 text-xs text-foreground whitespace-nowrap">
                              {rx.doctor?.user ? `Dr. ${rx.doctor.user.lastName}` : 'Physician'}
                            </TableCell>
                            <TableCell className="py-3.5 text-xs max-w-[280px]">
                              {rx.items?.map((it, idx) => (
                                <div key={idx} className="text-foreground truncate">
                                  <span className="font-semibold">{it.medicineName}</span>
                                  <span className="text-muted-foreground ml-1.5 font-mono text-[0.7rem]">
                                    ({it.dosage} &bull; {it.frequency} &bull; {it.durationDays}d)
                                  </span>
                                </div>
                              ))}
                            </TableCell>
                            <TableCell className="py-3.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(rx.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="px-6 py-3.5 text-right whitespace-nowrap">
                              {getStatusBadge(rx.status)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* VIEW 4: INVOICES */}
          <TabsContent value="invoices" className="mt-0 min-w-0">
            <Card className="overflow-hidden min-w-0">
              <CardHeader className="p-6 border-b border-border flex flex-row items-center justify-between gap-4 min-w-0">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base font-semibold text-foreground leading-snug truncate">
                    Hospital Invoices & Payments
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-1 leading-normal truncate">
                    Review statements, charges, and settle pending invoices
                  </CardDescription>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs text-muted-foreground uppercase font-mono mr-2">Due:</span>
                  <span className="text-sm font-mono font-bold text-foreground leading-none">${outstandingTotal.toFixed(2)}</span>
                </div>
              </CardHeader>
              <CardContent className="p-0 min-w-0">
                {bills.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center min-w-0">
                    <Receipt size={26} className="text-muted-foreground mb-3 shrink-0" />
                    <div className="text-sm font-semibold text-foreground leading-snug">
                      No Invoices On Record
                    </div>
                    <div className="text-xs text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
                      Consultation Fee bills are created on booking; Pharmacy bills are generated by the pharmacist.
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto scrollbar-hidden w-full max-w-full min-w-0">
                    <Table className="bg-transparent w-full border-0 rounded-none shadow-none">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs px-6 py-3 whitespace-nowrap">
                            Invoice No
                          </TableHead>
                          <TableHead className="text-xs py-3 whitespace-nowrap">
                            Stage
                          </TableHead>
                          <TableHead className="text-xs py-3">
                            Description
                          </TableHead>
                          <TableHead className="text-xs py-3 whitespace-nowrap">
                            Date
                          </TableHead>
                          <TableHead className="text-xs py-3 whitespace-nowrap">
                            Total
                          </TableHead>
                          <TableHead className="text-xs py-3 whitespace-nowrap">
                            Status
                          </TableHead>
                          <TableHead className="text-xs px-6 py-3 text-right whitespace-nowrap">
                            Payment
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bills.map((b) => (
                          <TableRow key={b.id}>
                            <TableCell className="px-6 py-3.5 font-mono text-xs text-primary font-bold whitespace-nowrap">
                              {b.invoiceNumber}
                            </TableCell>
                            <TableCell className="py-3.5 whitespace-nowrap">
                              <Badge variant="outline" className="font-mono text-[0.65rem] uppercase">
                                {b.billType || 'CONSULTATION'}
                              </Badge>
                            </TableCell>
                            <TableCell className="py-3.5 text-xs text-foreground max-w-[200px] truncate">
                              {b.items?.[0]?.description || 'Clinical Care & Pharmacy'}
                            </TableCell>
                            <TableCell className="py-3.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(b.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="py-3.5 font-mono font-bold text-xs text-foreground whitespace-nowrap">
                              ${b.totalAmount.toFixed(2)}
                            </TableCell>
                            <TableCell className="py-3.5 whitespace-nowrap">
                              {getStatusBadge(b.status)}
                            </TableCell>
                            <TableCell className="px-6 py-3.5 text-right whitespace-nowrap">
                              {b.status !== 'PAID' ? (
                                role !== 'DOCTOR' ? (
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handlePayBill(
                                        b.id,
                                        Math.max(0.01, Number((b.totalAmount - (b.paidAmount || 0)).toFixed(2))),
                                      )
                                    }
                                    className="text-xs h-7 px-3 cursor-pointer shrink-0"
                                  >
                                    Pay Now
                                  </Button>
                                ) : (
                                  <span className="text-[0.68rem] font-mono text-amber-400 font-semibold">
                                    Patient Pending
                                  </span>
                                )
                              ) : (
                                <span className="text-[0.68rem] font-mono text-emerald-400 font-semibold inline-flex items-center gap-1 shrink-0">
                                  <Check size={12} className="shrink-0" /> Settled
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* 4. Booking Consultation Modal with Clean Spacing & Proper Alignments */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-card text-card-foreground border border-border rounded-xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="text-base font-semibold text-foreground flex items-center gap-2.5">
                <Calendar size={17} className="text-primary shrink-0" />
                <span>Book Specialist Consultation</span>
              </div>
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm p-1 cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {myProfile && (
              <div className="p-3 rounded-lg bg-secondary border border-border text-muted-foreground text-xs flex items-center justify-between gap-2 min-w-0">
                <span className="truncate">
                  Patient: <strong className="text-foreground">{myProfile.user.firstName} {myProfile.user.lastName}</strong>
                </span>
                <span className="font-mono text-muted-foreground shrink-0">
                  ID: PAT-{myProfile.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
            )}

            <form onSubmit={handleBookAppointment} className="space-y-4 text-xs">
              <div>
                <label className="block text-foreground mb-1.5 font-medium leading-none">
                  Select Specialist Physician
                </label>
                <select
                  value={bookingForm.doctorId}
                  onChange={(e) => setBookingForm({ ...bookingForm, doctorId: e.target.value })}
                  required
                  className="w-full bg-background border border-input rounded-md px-3 py-2 min-h-[44px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
                <label className="block text-foreground mb-1.5 font-medium leading-none">
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={bookingForm.appointmentDate}
                  onChange={(e) => setBookingForm({ ...bookingForm, appointmentDate: e.target.value })}
                  required
                  className="w-full bg-background border border-input rounded-md px-3 py-2 min-h-[44px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-foreground mb-1.5 font-medium leading-none">
                  Time Slot
                </label>
                <select
                  value={bookingForm.timeSlot}
                  onChange={(e) => setBookingForm({ ...bookingForm, timeSlot: e.target.value })}
                  required
                  className="w-full bg-background border border-input rounded-md px-3 py-2 min-h-[44px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
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
                <label className="block text-foreground mb-1.5 font-medium leading-none">
                  Reason for Consultation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Routine checkup, mild chest pain"
                  value={bookingForm.reason}
                  onChange={(e) => setBookingForm({ ...bookingForm, reason: e.target.value })}
                  required
                  className="w-full bg-background border border-input rounded-md px-3 py-2 min-h-[44px] text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>

              <div className="p-2.5 rounded-lg border border-border bg-secondary/50 space-y-1.5">
                <div className="text-[0.68rem] font-mono uppercase text-muted-foreground font-semibold">
                  Consultation Booking Payment
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dashPayUpfront"
                    checked={bookingForm.payUpfront}
                    onChange={() => setBookingForm({ ...bookingForm, payUpfront: true })}
                  />
                  <span>Pay Consultation Fee upfront & confirm immediately</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="dashPayUpfront"
                    checked={!bookingForm.payUpfront}
                    onChange={() => setBookingForm({ ...bookingForm, payUpfront: false })}
                  />
                  <span>Book as PENDING (pay later)</span>
                </label>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  size="md"
                  className="w-full sm:w-auto gap-1.5"
                >
                  {loading ? 'Confirming...' : 'Confirm Appointment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterHospitalDashboard;
