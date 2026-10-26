import React, { useEffect, useState } from 'react';
import { Calendar, FileText, CreditCard, Stethoscope, Plus } from 'lucide-react';
import {
  Card,
  KPICard,
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
import type { Appointment, Prescription, Bill, Doctor } from '../../../shared/types';
export const PatientDashboard: React.FC<{
  onBookAppointment?: () => void;
  onViewPrescriptions?: () => void;
  onViewBilling?: () => void;
}> = ({ onBookAppointment, onViewPrescriptions, onViewBilling: _onViewBilling }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [apts, rxList, bls, docs] = await Promise.all([
        api.getAppointments(),
        api.getPrescriptions(),
        api.getBills(),
        api.getDoctors(),
      ]);
      setAppointments(apts);
      setPrescriptions(rxList);
      setBills(bls);
      setDoctors(docs);
    } catch (e) {
      console.error(e);
    }
  };

  const nextAppointment = appointments[0];
  const pendingBills = bills.filter((b) => b.status !== 'PAID');
  const outstandingTotal = pendingBills.reduce((acc, b) => acc + (b.totalAmount - (b.paidAmount || 0)), 0);

  return (
    <div className="portal-page">
      <div className="kpi-grid">
        <KPICard
          label="My Scheduled Visits"
          value={appointments.length}
          subtext={nextAppointment ? `Next: ${nextAppointment.timeSlot}` : 'No upcoming visits'}
          icon={<Calendar size={16} />}
        />
        <KPICard
          label="Prescriptions on File"
          value={prescriptions.length}
          subtext="Active medical regimens"
          icon={<FileText size={16} />}
        />
        <KPICard
          label="Outstanding Balance"
          value={`$${outstandingTotal.toFixed(2)}`}
          subtext={`${pendingBills.length} unpaid invoice(s)`}
          icon={<CreditCard size={16} />}
        />
        <KPICard
          label="Hospital Specialists"
          value={doctors.length}
          subtext="Available for consultation"
          icon={<Stethoscope size={16} />}
        />
      </div>

      <div className="grid-2-col">
        {/* Next Visit / Upcoming appointments */}
        <Card
          title="My Clinical Consultations"
          subtitle="Scheduled doctor appointments"
          icon={<Calendar size={18} />}
          action={
            onBookAppointment && (
              <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={onBookAppointment}>
                Book Visit
              </Button>
            )
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time Slot</TableHead>
                <TableHead>Physician</TableHead>
                <TableHead>Visit Purpose</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.slice(0, 5).map((apt) => (
                <TableRow key={apt.id}>
                  <TableCell>
                    <div className="font-semibold text-primary">{apt.timeSlot}</div>
                    <div className="font-mono text-muted text-xs">
                      {new Date(apt.appointmentDate).toDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {apt.doctor?.user ? `Dr. ${apt.doctor.user.lastName}` : 'Physician'}
                  </TableCell>
                  <TableCell>{apt.reason || 'General Consultation'}</TableCell>
                  <TableCell>
                    <StatusPill status={apt.status} />
                  </TableCell>
                </TableRow>
              ))}
              {appointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted py-8">
                    You have no scheduled appointments
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Active Prescriptions */}
        <Card
          title="My Medications & Prescriptions"
          subtitle="Instructions from your physician"
          icon={<FileText size={18} />}
          action={
            onViewPrescriptions && (
              <Button variant="outline" size="sm" onClick={onViewPrescriptions}>
                View All
              </Button>
            )
          }
        >
          <div className="space-y-3">
            {prescriptions.slice(0, 4).map((rx) => (
              <div key={rx.id} className="list-item-card">
                <div>
                  <div className="font-mono font-semibold text-primary text-sm">
                    {rx.prescriptionNo}
                  </div>
                  <div className="text-muted text-xs">
                    By Dr. {rx.doctor?.user?.lastName || 'Consultant'} &bull; Issued{' '}
                    {new Date(rx.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-primary font-medium mt-1">
                    {rx.items?.map((it) => `${it.medicineName} (${it.frequency})`).join(', ')}
                  </div>
                </div>
                <div>
                  <StatusPill status={rx.status} />
                </div>
              </div>
            ))}
            {prescriptions.length === 0 && (
              <div className="text-center text-muted py-8">No prescriptions on record</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
