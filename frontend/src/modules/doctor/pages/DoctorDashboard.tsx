import React, { useEffect, useState } from 'react';
import { Calendar, Users, FileText, CheckCircle2, Clock, Check, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '../../../shared/ui';
import { api } from '../../../shared/api';
import type { Appointment, Prescription } from '../../../shared/types';
import { useAuth } from '../../../shared/context/AuthContext';

export const DoctorDashboard: React.FC<{ onNavigateToPrescriptions?: () => void }> = ({
  onNavigateToPrescriptions,
}) => {
  const { showToast } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [apts, pres] = await Promise.all([
        api.getAppointments(),
        api.getPrescriptions(),
      ]);
      setAppointments(apts);
      setPrescriptions(pres);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: any) => {
    try {
      await api.updateAppointmentStatus(id, status);
      showToast(`Appointment status changed to ${status}`);
      loadData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const pendingAppointments = appointments.filter((a) => a.status === 'PENDING').length;
  const confirmedAppointments = appointments.filter((a) => a.status === 'CONFIRMED').length;

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'CONFIRMED') {
      return (
        <Badge variant="info" className="gap-1 uppercase font-mono text-[0.65rem]">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
          Confirmed
        </Badge>
      );
    }
    if (s === 'COMPLETED') {
      return (
        <Badge variant="success" className="gap-1 uppercase font-mono text-[0.65rem]">
          <CheckCircle2 size={11} />
          Completed
        </Badge>
      );
    }
    if (s === 'PENDING') {
      return (
        <Badge variant="warning" className="gap-1 uppercase font-mono text-[0.65rem]">
          <Clock size={11} />
          Pending
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1 uppercase font-mono text-[0.65rem]">
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0">
        <Card className="hover:border-primary/50 transition-all duration-300 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/10 before:via-transparent before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:pointer-events-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Today's Consultations
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-xs">
              <Calendar size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground tracking-tight">
              {appointments.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              Patient bookings scheduled
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-all duration-300 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/10 before:via-transparent before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:pointer-events-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pending Review
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0 shadow-xs">
              <Users size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground tracking-tight">
              {pendingAppointments}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              Awaiting doctor confirmation
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-all duration-300 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/10 before:via-transparent before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:pointer-events-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Confirmed & In Progress
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground tracking-tight">
              {confirmedAppointments}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              Ready for clinical examination
            </p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-all duration-300 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/10 before:via-transparent before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:pointer-events-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Issued Prescriptions
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-xs">
              <FileText size={16} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-foreground tracking-tight">
              {prescriptions.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              Digital medical orders signed
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
        {/* Today's Schedule */}
        <Card className="hover:border-primary/50 transition-all duration-300">
          <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                <Calendar size={16} />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Clinical Consultations Queue</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Patient queue and assigned examination slots
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {appointments.length} Total
            </Badge>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-xs text-muted-foreground font-mono">
                Loading consultations queue...
              </div>
            ) : appointments.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={<Calendar size={24} />}
                  title="No Consultations Scheduled"
                  description="There are currently no patient consultations in the doctor queue today."
                />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                    <TableHead className="font-semibold text-muted-foreground">Slot & Date</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Patient</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Reason</TableHead>
                    <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                    <TableHead className="font-semibold text-muted-foreground text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.slice(0, 6).map((apt) => (
                    <TableRow
                      key={apt.id}
                      className="border-b border-border/60 hover:bg-muted/40 transition-colors"
                    >
                      <TableCell className="py-3">
                        <div className="font-semibold text-foreground text-xs">{apt.timeSlot}</div>
                        <div className="font-mono text-[0.68rem] text-muted-foreground">
                          {new Date(apt.appointmentDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-xs text-foreground font-medium">
                        {apt.patient?.user
                          ? `${apt.patient.user.firstName} ${apt.patient.user.lastName}`
                          : 'Patient'}
                      </TableCell>
                      <TableCell className="py-3 text-xs text-muted-foreground max-w-[140px] truncate">
                        {apt.reason || 'General Consultation'}
                      </TableCell>
                      <TableCell className="py-3">
                        {getStatusBadge(apt.status)}
                      </TableCell>
                      <TableCell className="py-3 text-right">
                        {apt.status === 'PENDING' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 text-xs px-2.5 cursor-pointer"
                            onClick={() => handleUpdateStatus(apt.id, 'CONFIRMED')}
                          >
                            Accept
                          </Button>
                        )}
                        {apt.status === 'CONFIRMED' && (
                          <Button
                            size="sm"
                            className="h-7 text-xs px-2.5 cursor-pointer"
                            onClick={() => handleUpdateStatus(apt.id, 'COMPLETED')}
                          >
                            Complete
                          </Button>
                        )}
                        {apt.status === 'COMPLETED' && (
                          <span className="inline-flex items-center gap-1 text-[0.68rem] font-mono text-emerald-400 font-semibold">
                            <Check size={12} /> Done
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Digital Prescriptions */}
        <Card className="hover:border-primary/50 transition-all duration-300">
          <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                <FileText size={16} />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Recent Prescriptions</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Signed medical orders & prescriptions
                </CardDescription>
              </div>
            </div>
            {onNavigateToPrescriptions && (
              <Button
                variant="outline"
                size="sm"
                onClick={onNavigateToPrescriptions}
                className="gap-1.5 cursor-pointer"
              >
                <span>Write Rx</span>
                <ArrowRight size={12} />
              </Button>
            )}
          </CardHeader>

          <CardContent className="p-4">
            {prescriptions.length === 0 ? (
              <EmptyState
                icon={<FileText size={24} />}
                title="No Prescriptions Issued"
                description="No digital medical prescriptions have been signed today yet."
              />
            ) : (
              <div className="space-y-3">
                {prescriptions.slice(0, 5).map((rx) => (
                  <div
                    key={rx.id}
                    className="p-3 rounded-lg border border-border bg-card/60 hover:border-primary/40 transition-colors flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-primary text-xs">
                        {rx.prescriptionNo}
                      </div>
                      <div className="text-[0.7rem] text-muted-foreground mt-0.5">
                        Patient:{' '}
                        <span className="text-foreground font-medium">
                          {rx.patient?.user
                            ? `${rx.patient.user.firstName} ${rx.patient.user.lastName}`
                            : 'Patient Record'}
                        </span>
                      </div>
                      <div className="text-xs text-foreground font-medium mt-1">
                        {rx.items?.map((i) => `${i.medicineName} (${i.dosage})`).join(', ')}
                      </div>
                      {rx.labTests && rx.labTests.length > 0 && (
                        <div className="text-[0.68rem] font-mono text-muted-foreground mt-0.5">
                          Labs: {rx.labTests.map((t) => t.testName).join(', ')}
                        </div>
                      )}
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
