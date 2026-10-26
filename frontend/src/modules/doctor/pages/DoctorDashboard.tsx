import React, { useEffect, useState } from 'react';
import { Calendar, Users, FileText, CheckCircle2 } from 'lucide-react';
import { Card, KPICard, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, StatusPill, Button } from '../../../shared/ui';
import { api } from '../../../shared/api';
import type { Appointment, Prescription } from '../../../shared/types';
import { useAuth } from '../../../shared/context/AuthContext';

export const DoctorDashboard: React.FC<{ onNavigateToPrescriptions?: () => void }> = ({ onNavigateToPrescriptions }) => {
  const { showToast } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [apts, pres] = await Promise.all([
        api.getAppointments(),
        api.getPrescriptions(),
      ]);
      setAppointments(apts);
      setPrescriptions(pres);
    } catch (e) {
      console.error(e);
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

  return (
    <div className="portal-page">
      <div className="kpi-grid">
        <KPICard
          label="Today's Consultations"
          value={appointments.length}
          subtext="Patient bookings scheduled"
          icon={<Calendar size={16} />}
        />
        <KPICard
          label="Pending Review"
          value={pendingAppointments}
          subtext="Awaiting doctor confirmation"
          icon={<Users size={16} />}
        />
        <KPICard
          label="Confirmed & In Progress"
          value={confirmedAppointments}
          subtext="Ready for examination"
          icon={<CheckCircle2 size={16} />}
        />
        <KPICard
          label="Issued Prescriptions"
          value={prescriptions.length}
          subtext="Digital medical orders"
          icon={<FileText size={16} />}
        />
      </div>

      <div className="grid-2-col">
        {/* Today's Schedule */}
        <Card
          title="Clinical Consultations Queue"
          subtitle="Patient queue and assigned appointment slots"
          icon={<Calendar size={18} />}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time Slot</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.slice(0, 6).map((apt) => (
                <TableRow key={apt.id}>
                  <TableCell>
                    <div className="font-semibold text-primary">{apt.timeSlot}</div>
                    <div className="font-mono text-muted text-xs">
                      {new Date(apt.appointmentDate).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {apt.patient?.user
                      ? `${apt.patient.user.firstName} ${apt.patient.user.lastName}`
                      : 'Patient'}
                  </TableCell>
                  <TableCell>{apt.reason || 'General Health Consultation'}</TableCell>
                  <TableCell>
                    <StatusPill status={apt.status} />
                  </TableCell>
                  <TableCell>
                    {apt.status === 'PENDING' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUpdateStatus(apt.id, 'CONFIRMED')}
                      >
                        Accept
                      </Button>
                    )}
                    {apt.status === 'CONFIRMED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUpdateStatus(apt.id, 'COMPLETED')}
                      >
                        Complete
                      </Button>
                    )}
                    {apt.status === 'COMPLETED' && (
                      <span className="badge badge-white text-xs">Done</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {appointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted py-8">
                    No consultations scheduled today
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Recent Digital Prescriptions */}
        <Card
          title="Recent Prescriptions"
          subtitle="Medications prescribed to patients"
          icon={<FileText size={18} />}
          action={
            onNavigateToPrescriptions && (
              <Button variant="outline" size="sm" onClick={onNavigateToPrescriptions}>
                View All
              </Button>
            )
          }
        >
          <div className="space-y-3">
            {prescriptions.slice(0, 5).map((rx) => (
              <div key={rx.id} className="list-item-card">
                <div>
                  <div className="font-mono font-semibold text-primary text-sm">
                    {rx.prescriptionNo}
                  </div>
                  <div className="text-muted text-xs">
                    Patient:{' '}
                    {rx.patient?.user
                      ? `${rx.patient.user.firstName} ${rx.patient.user.lastName}`
                      : 'Patient'}
                  </div>
                  <div className="text-xs text-primary mt-1 font-medium">
                    {rx.items?.map((i) => `${i.medicineName} (${i.dosage})`).join(', ')}
                  </div>
                </div>
                <div>
                  <StatusPill status={rx.status} />
                </div>
              </div>
            ))}
            {prescriptions.length === 0 && (
              <div className="text-center text-muted py-8">No prescriptions issued yet</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
