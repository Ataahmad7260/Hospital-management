import React, { useEffect, useState } from 'react';
import { Users, Calendar, Pill, CreditCard, Building2, ShieldCheck } from 'lucide-react';
import { Card, KPICard, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, StatusPill } from '../../../shared/ui';
import { api } from '../../../shared/api';
import type { Appointment, Doctor, Patient, Bill, Medicine } from '../../../shared/types';

export const AdminDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [apts, docs, pats, bls, meds] = await Promise.all([
        api.getAppointments(),
        api.getDoctors(),
        api.getPatients(),
        api.getBills(),
        api.getMedicines(),
      ]);
      setAppointments(apts);
      setDoctors(docs);
      setPatients(pats);
      setBills(bls);
      setMedicines(meds);
    } catch (e) {
      console.error(e);
    }
  };

  const totalRevenue = bills.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
  const pendingAppointments = appointments.filter((a) => a.status === 'PENDING').length;
  const lowStockMedicines = medicines.filter((m) => m.stockQuantity <= m.reorderLevel).length;

  return (
    <div className="portal-page">
      {/* KPI Grid */}
      <div className="kpi-grid">
        <KPICard
          label="Registered Patients"
          value={patients.length}
          subtext="Active hospital medical records"
          icon={<Users size={16} />}
        />
        <KPICard
          label="Clinical Doctors"
          value={doctors.length}
          subtext="Specialists across departments"
          icon={<ShieldCheck size={16} />}
        />
        <KPICard
          label="Pending Consultations"
          value={pendingAppointments}
          subtext="Awaiting doctor review"
          icon={<Calendar size={16} />}
        />
        <KPICard
          label="Pharmacy Items"
          value={medicines.length}
          subtext={`${lowStockMedicines} below reorder threshold`}
          icon={<Pill size={16} />}
        />
        <KPICard
          label="Total Collected Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          subtext="Settled hospital invoices"
          icon={<CreditCard size={16} />}
        />
      </div>

      <div className="grid-2-col">
        {/* Recent Appointments */}
        <Card
          title="Recent Clinical Consultations"
          subtitle="Hospital-wide appointments across all departments"
          icon={<Calendar size={18} />}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time & Date</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.slice(0, 5).map((apt) => (
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
                  <TableCell>
                    {apt.doctor?.user ? `Dr. ${apt.doctor.user.lastName}` : 'Doctor'}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={apt.status} />
                  </TableCell>
                </TableRow>
              ))}
              {appointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted py-8">
                    No appointments recorded
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Clinical Departments & Doctors */}
        <Card
          title="Medical Staff & Departments"
          subtitle="Registered physicians and specializations"
          icon={<Building2 size={18} />}
        >
          <div className="space-y-3">
            {doctors.map((doc) => (
              <div key={doc.id} className="list-item-card">
                <div>
                  <div className="font-semibold text-primary">
                    Dr. {doc.user.firstName} {doc.user.lastName}
                  </div>
                  <div className="text-muted text-xs">
                    {doc.specialization} &bull; {doc.department?.name || 'General Medicine'}
                  </div>
                </div>
                <div className="font-mono text-sm text-primary">
                  ${doc.consultationFee.toFixed(2)}
                </div>
              </div>
            ))}
            {doctors.length === 0 && (
              <div className="text-center text-muted py-8">No doctors registered</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
