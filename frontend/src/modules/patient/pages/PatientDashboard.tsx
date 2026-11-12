import React, { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Calendar,
  FileText,
  CreditCard,
  Stethoscope,
  Plus,
  HeartPulse,
  ShieldAlert,
  Phone,
  CalendarX,
  ExternalLink,
} from 'lucide-react';
import { EmptyState } from '../../../shared/ui';
import { api } from '../../../shared/api';
import type { Appointment, Prescription, Bill, Doctor, Patient } from '../../../shared/types';

export const PatientDashboard: React.FC<{
  onBookAppointment?: () => void;
  onViewPrescriptions?: () => void;
  onViewBilling?: () => void;
}> = ({ onBookAppointment, onViewPrescriptions, onViewBilling: _onViewBilling }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [myProfile, setMyProfile] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [apts, rxList, bls, docs, profile] = await Promise.all([
        api.getAppointments(),
        api.getPrescriptions(),
        api.getBills(),
        api.getDoctors(),
        api.getMyPatientProfile().catch(() => null),
      ]);
      setAppointments(apts);
      setPrescriptions(rxList);
      setBills(bls);
      setDoctors(docs);
      if (profile) setMyProfile(profile);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const nextAppointment = appointments[0];
  const pendingBills = bills.filter((b) => b.status !== 'PAID');
  const outstandingTotal = pendingBills.reduce(
    (acc, b) => acc + (b.totalAmount - (b.paidAmount || 0)),
    0
  );

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'CONFIRMED' || s === 'COMPLETED' || s === 'DISPENSED' || s === 'PAID') {
      return (
        <Badge
          variant="outline"
          className="gap-1.5 uppercase font-mono text-[0.68rem] border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          {status}
        </Badge>
      );
    }
    if (s === 'PENDING' || s === 'SCHEDULED' || s === 'ISSUED') {
      return (
        <Badge
          variant="outline"
          className="gap-1.5 uppercase font-mono text-[0.68rem] border-amber-500/30 bg-amber-500/10 text-amber-400 font-semibold"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          {status}
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="gap-1.5 uppercase font-mono text-[0.68rem] border-border bg-secondary text-muted-foreground font-semibold"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      {/* Patient Profile Header Banner */}
      {myProfile && (
        <div className="bg-card text-card-foreground border border-border rounded-xl p-6 flex flex-wrap items-center justify-between gap-6 shadow-sm min-w-0 max-w-full overflow-hidden">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar className="w-12 h-12 border border-border">
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                {myProfile.user?.firstName?.[0]}
                {myProfile.user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-base font-semibold text-foreground flex items-center gap-2.5">
                <span>
                  {myProfile.user?.firstName} {myProfile.user?.lastName}
                </span>
                <Badge variant="outline" className="font-mono text-xs">
                  PAT-{myProfile.id.slice(0, 8).toUpperCase()}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground font-mono flex items-center gap-2 mt-1">
                <span>Blood: {myProfile.bloodGroup || 'UNKNOWN'}</span>
                <span>&bull;</span>
                <span>Gender: {myProfile.gender || 'OTHER'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            {myProfile.emergencyContactPhone && (
              <div className="flex items-center gap-2 bg-secondary px-3.5 py-1.5 rounded-md border border-border text-foreground">
                <Phone size={14} className="text-muted-foreground" />
                <span>ICE: {myProfile.emergencyContactPhone}</span>
              </div>
            )}
            {myProfile.allergies && myProfile.allergies.length > 0 && (
              <div className="flex items-center gap-2 bg-amber-500/10 text-amber-400 px-3.5 py-1.5 rounded-md border border-amber-500/20">
                <ShieldAlert size={14} />
                <span>Allergies: {myProfile.allergies.join(', ')}</span>
              </div>
            )}
            {myProfile.chronicDiseases && myProfile.chronicDiseases.length > 0 && (
              <div className="flex items-center gap-2 bg-rose-500/10 text-rose-400 px-3.5 py-1.5 rounded-md border border-rose-500/20">
                <HeartPulse size={14} />
                <span>Regimen: {myProfile.chronicDiseases.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Metric Cards (4 Cards adapting completely to shadcn theme tokens) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Scheduled Visits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Scheduled Visits
            </CardTitle>
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <Calendar size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground tracking-tight">
              {appointments.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {nextAppointment ? `Next: ${nextAppointment.timeSlot}` : 'No upcoming visits'}
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: Prescriptions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Prescriptions
            </CardTitle>
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <FileText size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground tracking-tight">
              {prescriptions.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              Active medical regimens on file
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: Outstanding Balance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Outstanding Balance
            </CardTitle>
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <CreditCard size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground tracking-tight">
              ${outstandingTotal.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {pendingBills.length} unpaid hospital invoice(s)
            </p>
          </CardContent>
        </Card>

        {/* Metric 4: Specialists */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Specialists
            </CardTitle>
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <Stethoscope size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground tracking-tight">
              {doctors.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              Specialist physicians on active duty
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout: Clinical Consultations & Prescriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
        {/* Next Visit / Upcoming appointments */}
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                <Calendar size={16} />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Clinical Consultations
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Scheduled physician appointments
                </CardDescription>
              </div>
            </div>
            {onBookAppointment && (
              <Button size="sm" onClick={onBookAppointment} className="gap-1.5 cursor-pointer">
                <Plus size={14} />
                <span>Book Visit</span>
              </Button>
            )}
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-xs text-muted-foreground font-mono">
                Loading clinical consultations...
              </div>
            ) : appointments.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={<CalendarX size={24} />}
                  title="No Scheduled Visits"
                  description="You currently have no doctor consultations scheduled. Pick a specialist to schedule a visit."
                  action={
                    onBookAppointment && (
                      <Button size="sm" onClick={onBookAppointment} className="gap-1.5 cursor-pointer">
                        <Plus size={14} />
                        <span>Book Visit</span>
                      </Button>
                    )
                  }
                />
              </div>
            ) : (
              <Table className="border-0 rounded-none shadow-none">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Time Slot</TableHead>
                    <TableHead className="text-xs">Physician</TableHead>
                    <TableHead className="text-xs">Purpose</TableHead>
                    <TableHead className="text-xs text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.slice(0, 5).map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell className="py-3.5">
                        <div className="font-semibold text-foreground text-xs">{apt.timeSlot}</div>
                        <div className="font-mono text-[0.68rem] text-muted-foreground mt-0.5">
                          {new Date(apt.appointmentDate).toDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 text-xs text-foreground font-medium">
                        {apt.doctor?.user ? `Dr. ${apt.doctor.user.lastName}` : 'Physician'}
                      </TableCell>
                      <TableCell className="py-3.5 text-xs text-muted-foreground">
                        {apt.reason || 'General Consultation'}
                      </TableCell>
                      <TableCell className="py-3.5 text-right">
                        {getStatusBadge(apt.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Active Prescriptions */}
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                <FileText size={16} />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  My Medications & Regimens
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Prescription regimens from your physician
                </CardDescription>
              </div>
            </div>
            {onViewPrescriptions && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewPrescriptions}
                className="cursor-pointer gap-1.5"
              >
                <span>View All</span>
                <ExternalLink size={13} />
              </Button>
            )}
          </CardHeader>

          <CardContent className="p-6">
            {prescriptions.length === 0 ? (
              <EmptyState
                icon={<FileText size={24} />}
                title="No Prescriptions on Record"
                description="Your medical record currently contains no prescriptions. Issued regimens will be displayed here."
              />
            ) : (
              <div className="space-y-3">
                {prescriptions.slice(0, 4).map((rx) => (
                  <div
                    key={rx.id}
                    className="p-4 rounded-xl border border-border bg-card/60 hover:bg-muted/40 transition-colors flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 shadow-xs min-w-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-mono font-bold text-primary text-xs">
                        {rx.prescriptionNo}
                      </div>
                      <div className="text-[0.7rem] text-muted-foreground mt-0.5">
                        Dr. {rx.doctor?.user?.lastName || 'Consultant'} &bull; Issued{' '}
                        {new Date(rx.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-foreground font-medium mt-1.5">
                        {rx.items?.map((it) => `${it.medicineName} (${it.frequency})`).join(', ')}
                      </div>
                    </div>
                    <div>{getStatusBadge(rx.status)}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PatientDashboard;
