import React, { useEffect, useState } from 'react';
import { Calendar, Plus, Clock, Stethoscope, CalendarX } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState, Modal, FormGroup, FormRow } from '../../../shared/ui';
import { api } from '../../../shared/api';
import type { Appointment, Doctor, Patient } from '../../../shared/types';
import { useAuth } from '../../../shared/context/AuthContext';

export const BookAppointmentPage: React.FC = () => {
  const { showToast, currentUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [myProfile, setMyProfile] = useState<Patient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    doctorId: '',
    patientId: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '09:30 - 10:00 AM',
    reason: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [apts, dList, profile] = await Promise.all([
        api.getAppointments(),
        api.getDoctors(),
        api.getMyPatientProfile().catch(() => null),
      ]);
      setAppointments(apts);
      setDoctors(dList);
      setMyProfile(profile);

      if (profile?.id) {
        setForm((prev) => ({ ...prev, patientId: profile.id }));
      }
      if (dList.length > 0 && !form.doctorId) {
        setForm((prev) => ({ ...prev, doctorId: dList[0].id }));
      }
    } catch (err: any) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.doctorId || !form.patientId) {
      showToast('Please select a physician', true);
      return;
    }

    try {
      await api.createAppointment(form);
      showToast('Appointment successfully scheduled!');
      setIsModalOpen(false);
      setForm((prev) => ({ ...prev, reason: '' }));
      loadData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'CONFIRMED' || s === 'COMPLETED') {
      return (
        <Badge variant="success" className="gap-1.5 uppercase font-mono text-[0.65rem]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          {status}
        </Badge>
      );
    }
    if (s === 'PENDING' || s === 'SCHEDULED') {
      return (
        <Badge variant="warning" className="gap-1.5 uppercase font-mono text-[0.65rem]">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          {status}
        </Badge>
      );
    }
    if (s === 'CANCELLED') {
      return (
        <Badge variant="destructive" className="gap-1.5 uppercase font-mono text-[0.65rem]">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          {status}
        </Badge>
      );
    }
    return (
      <Badge variant="info" className="gap-1.5 uppercase font-mono text-[0.65rem]">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="hover:border-primary/50 transition-all duration-300">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/60">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-xs">
              <Calendar size={20} />
            </div>
            <div>
              <CardTitle className="text-lg font-bold tracking-tight">Clinical Consultations & Visits</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Book and manage upcoming specialist consultations and clinical checkups
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            size="sm"
            className="gap-2 shrink-0 cursor-pointer shadow-xs"
          >
            <Plus size={15} />
            <span>Book Consultation</span>
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-xs text-muted-foreground font-mono">
              Loading scheduled appointments...
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<CalendarX size={26} />}
                title="No Consultations Scheduled"
                description="You currently have no upcoming specialist visits on your schedule. Reserve an appointment with a hospital physician below."
                action={
                  <Button
                    onClick={() => setIsModalOpen(true)}
                    size="sm"
                    className="gap-2 shadow-xs cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Book Your First Consultation</span>
                  </Button>
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-semibold text-muted-foreground">Date & Slot</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Physician</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Specialization</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Reason for Visit</TableHead>
                  <TableHead className="font-semibold text-muted-foreground text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((apt) => (
                  <TableRow
                    key={apt.id}
                    className="border-b border-border/60 hover:bg-muted/40 transition-colors"
                  >
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-primary shrink-0" />
                        <div>
                          <div className="font-semibold text-foreground text-xs">{apt.timeSlot}</div>
                          <div className="font-mono text-[0.68rem] text-muted-foreground">
                            {new Date(apt.appointmentDate).toLocaleDateString(undefined, {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-[0.68rem] text-foreground shrink-0">
                          <Stethoscope size={13} className="text-primary" />
                        </div>
                        <div className="font-medium text-xs text-foreground">
                          {apt.doctor?.user
                            ? `Dr. ${apt.doctor.user.firstName} ${apt.doctor.user.lastName}`
                            : 'Hospital Physician'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 text-xs text-muted-foreground">
                      <Badge variant="outline" className="font-normal text-[0.68rem]">
                        {apt.doctor?.specialization || 'Clinical Medicine'}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3.5 text-xs text-foreground">
                      {apt.reason || 'General Consultation & Examination'}
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

      {/* Booking Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Specialist Consultation"
      >
        <form onSubmit={handleBook} className="space-y-4">
          <FormGroup label="Select Clinical Specialist">
            <select
              value={form.doctorId}
              onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
              required
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Choose a specialist...</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.user.firstName} {d.user.lastName} — {d.specialization} (${d.consultationFee.toFixed(2)})
                </option>
              ))}
            </select>
          </FormGroup>

          <FormGroup label="Patient Reference">
            <Input
              type="text"
              value={
                myProfile?.user
                  ? `${myProfile.user.firstName} ${myProfile.user.lastName} (${myProfile.user.email})`
                  : currentUser
                  ? `${currentUser.firstName} ${currentUser.lastName} (${currentUser.email})`
                  : 'Authenticated Patient'
              }
              disabled
              className="opacity-80 cursor-not-allowed bg-muted/40 font-mono text-xs"
            />
          </FormGroup>

          <FormRow columns={2}>
            <FormGroup label="Preferred Consultation Date">
              <Input
                type="date"
                value={form.appointmentDate}
                onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
                required
              />
            </FormGroup>

            <FormGroup label="Preferred Time Slot">
              <select
                value={form.timeSlot}
                onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                required
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="09:00 - 09:30 AM">09:00 - 09:30 AM</option>
                <option value="09:30 - 10:00 AM">09:30 - 10:00 AM</option>
                <option value="10:30 - 11:00 AM">10:30 - 11:00 AM</option>
                <option value="11:30 - 12:00 PM">11:30 - 12:00 PM</option>
                <option value="02:00 - 02:30 PM">02:00 - 02:30 PM</option>
                <option value="03:30 - 04:00 PM">03:30 - 04:00 PM</option>
                <option value="04:30 - 05:00 PM">04:30 - 05:00 PM</option>
              </select>
            </FormGroup>
          </FormRow>

          <FormGroup label="Reason for Visit / Primary Symptoms">
            <Input
              type="text"
              placeholder="e.g., Persistent mild cough, annual physical checkup"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              required
            />
          </FormGroup>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Confirm Consultation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
