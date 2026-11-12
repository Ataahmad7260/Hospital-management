import React, { useEffect, useState } from 'react';
import { Users, Calendar, CreditCard, Building2, ShieldCheck } from 'lucide-react';
import { Card, KPICard, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, StatusPill } from '../../../shared/ui';
import { api } from '../../../shared/api';
import type { Appointment, Doctor, Patient, Bill, HospitalStaffStats } from '../../../shared/types';

export const AdminDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [userStats, setUserStats] = useState<{
    totalUsers: number;
    admins: number;
    doctors: number;
    patients: number;
    pharmacists: number;
  }>({ totalUsers: 0, admins: 0, doctors: 0, patients: 0, pharmacists: 0 });
  const [hospitalStaffStats, setHospitalStaffStats] = useState<HospitalStaffStats | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [apts, docs, pats, bls, stats, staffStats] = await Promise.all([
        api.getAppointments(),
        api.getDoctors(),
        api.getPatients(),
        api.getBills(),
        api.getUserStats().catch(() => ({ totalUsers: 0, admins: 0, doctors: 0, patients: 0, pharmacists: 0 })),
        api.getHospitalStaffStats().catch(() => null),
      ]);
      setAppointments(apts);
      setDoctors(docs);
      setPatients(pats);
      setBills(bls);
      setUserStats(stats);
      setHospitalStaffStats(staffStats);
    } catch (e) {
      console.error(e);
    }
  };

  const totalRevenue = bills.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
  const pendingAppointments = appointments.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      {/* Hospital Staff Role Collections Overview (Patients handled separately in Patients Registry) */}
      <div className="bg-card border border-border p-4 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-4 min-w-0">
        <div>
          <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground font-semibold">
            Hospital Staff Role Directory Ledger
          </h2>
          <p className="text-xs text-foreground/80 mt-0.5">
            Active institutional staff accounts across clinical and dispensary departments:
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/40 font-mono text-xs">
            <span className="text-muted-foreground">Hospital Staff / Admins:</span>
            <span className="font-bold text-foreground">{userStats.admins}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/40 font-mono text-xs">
            <span className="text-muted-foreground">Doctors:</span>
            <span className="font-bold text-foreground">{userStats.doctors}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/40 font-mono text-xs">
            <span className="text-muted-foreground">Pharmacists:</span>
            <span className="font-bold text-foreground">{userStats.pharmacists}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/40 font-mono text-xs">
            <span className="text-muted-foreground">Nurses / Ward / Support:</span>
            <span className="font-bold text-foreground">{hospitalStaffStats?.total ?? 0}</span>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          label="Registered Patients"
          value={patients.length}
          subtext="Managed in Patients Registry"
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
          label="Total Collected Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          subtext="Settled hospital invoices"
          icon={<CreditCard size={16} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
        {/* Recent Appointments */}
        <Card
          title="Recent Clinical Consultations"
          subtitle="Hospital-wide appointments across all departments"
          icon={<Calendar size={18} />}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time &amp; Date</TableHead>
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
