import React, { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import {
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  StatusPill,
  Button,
} from '../../../shared/ui';
import { api } from '../../../shared/api';
import type { Appointment, AppointmentStatus } from '../../../shared/types';
import { useAuth } from '../../../shared/context/AuthContext';

export const AppointmentsSchedulePage: React.FC = () => {
  const { showToast } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const data = await api.getAppointments();
      setAppointments(data);
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleUpdateStatus = async (id: string, status: AppointmentStatus) => {
    try {
      await api.updateAppointmentStatus(id, status);
      showToast(`Appointment status updated to ${status}`);
      loadAppointments();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const filtered =
    statusFilter === 'ALL'
      ? appointments
      : appointments.filter((a) => a.status === statusFilter);

  return (
    <div className="portal-page">
      <Card
        title="Consultation Schedule & Appointment Queue"
        subtitle="Manage upcoming clinical visits, patient check-ins, and consultation outcomes"
        icon={<Calendar size={18} />}
        action={
          <div className="flex-row-gap">
            <span className="text-muted text-xs">Filter:</span>
            {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                className={`filter-chip ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time Slot</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Patient Name</TableHead>
              <TableHead>Reason for Visit</TableHead>
              <TableHead>Current Status</TableHead>
              <TableHead>Clinical Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((apt) => (
              <TableRow key={apt.id}>
                <TableCell>
                  <div className="font-semibold text-primary">{apt.timeSlot}</div>
                </TableCell>
                <TableCell>
                  <div className="font-mono text-muted text-xs">
                    {new Date(apt.appointmentDate).toDateString()}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-primary">
                    {apt.patient?.user
                      ? `${apt.patient.user.firstName} ${apt.patient.user.lastName}`
                      : 'Registered Patient'}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-muted text-sm">{apt.reason || 'Routine Consultation'}</span>
                </TableCell>
                <TableCell>
                  <StatusPill status={apt.status} />
                </TableCell>
                <TableCell>
                  <div className="flex-row-gap">
                    {apt.status === 'PENDING' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUpdateStatus(apt.id, 'CONFIRMED')}
                      >
                        Confirm
                      </Button>
                    )}
                    {apt.status === 'CONFIRMED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUpdateStatus(apt.id, 'COMPLETED')}
                      >
                        Complete Visit
                      </Button>
                    )}
                    {apt.status !== 'CANCELLED' && apt.status !== 'COMPLETED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(apt.id, 'CANCELLED')}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted py-8">
                  No appointments match the selected filter
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
