import React, { useEffect, useState } from 'react';
import { Calendar, Stethoscope, ArrowRight, CheckCircle2 } from 'lucide-react';
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
  Modal,
  FormGroup,
  FormRow,
} from '../../../shared/ui';
import { api } from '../../../shared/api';
import type { Appointment, AppointmentStatus, Medicine } from '../../../shared/types';
import { useAuth } from '../../../shared/context/AuthContext';

export const AppointmentsSchedulePage: React.FC = () => {
  const { showToast, currentUser } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Examine & Prescribe Modal state
  const [examineApt, setExamineApt] = useState<Appointment | null>(null);
  const [rxForm, setRxForm] = useState({
    medicineName: 'Amoxicillin 500mg',
    dosage: '500mg',
    frequency: '1-0-1 (twice daily after meals)',
    durationDays: 7,
    instructions: 'Take after meals with water',
    doctorNotes: 'Patient examined. Condition assessed and therapeutic regimen initiated.',
  });

  useEffect(() => {
    loadAppointments();
    loadMedicines();
  }, []);

  const loadAppointments = async () => {
    try {
      const data = await api.getAppointments();
      setAppointments(data);
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const loadMedicines = async () => {
    try {
      const list = await api.getMedicines();
      setMedicines(list);
    } catch {
      // non-blocking
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

  const handleOpenExamine = (apt: Appointment) => {
    setExamineApt(apt);
    setRxForm({
      medicineName: medicines[0]?.name || 'Amoxicillin 500mg',
      dosage: '500mg',
      frequency: '1-0-1 (twice daily after meals)',
      durationDays: 7,
      instructions: 'Take with warm water after meals',
      doctorNotes: `Examined patient regarding: ${apt.reason || 'General clinical consultation'}.`,
    });
  };

  const handleIssuePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examineApt) return;

    try {
      const doctorId = examineApt.doctorId || currentUser?.id || '';
      await api.createPrescription({
        doctorId,
        patientId: examineApt.patientId,
        doctorNotes: rxForm.doctorNotes,
        items: [
          {
            medicineName: rxForm.medicineName,
            dosage: rxForm.dosage,
            frequency: rxForm.frequency,
            durationDays: Number(rxForm.durationDays),
            instructions: rxForm.instructions,
          },
        ],
      });

      // Mark appointment as COMPLETED or CONFIRMED
      await api.updateAppointmentStatus(examineApt.id, 'COMPLETED');

      showToast(`Prescription issued successfully! Case sent to Pharmacist Portal for dispensary & billing.`);
      setExamineApt(null);
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
    <div className="space-y-6 w-full">
      <Card
        title="Doctor Consultation Schedule & Admitted Patient Queue"
        subtitle="Review admitted patient conditions, examine symptoms, and issue digital prescriptions to the pharmacy"
        icon={<Calendar size={18} />}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-muted-foreground text-xs">Filter:</span>
            {['ALL', 'IN_PROGRESS', 'PENDING', 'CONFIRMED', 'COMPLETED'].map((st) => (
              <button
                key={st}
                className={`px-2.5 py-1 rounded-full text-xs font-mono font-semibold uppercase border transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-card text-muted-foreground hover:text-foreground border-border'
                }`}
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
              <TableHead>Admitted Condition / Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Clinical Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((apt) => (
              <TableRow key={apt.id} className="hover:bg-muted/40 transition-colors">
                <TableCell>
                  <div className="font-semibold text-primary">{apt.timeSlot}</div>
                </TableCell>
                <TableCell>
                  <div className="font-mono text-muted-foreground text-xs">
                    {new Date(apt.appointmentDate).toDateString()}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-foreground">
                    {apt.patient?.user
                      ? `${apt.patient.user.firstName} ${apt.patient.user.lastName}`
                      : 'Admitted Patient'}
                  </div>
                  {apt.patient?.user?.email && (
                    <div className="text-[0.65rem] text-muted-foreground font-mono">
                      {apt.patient.user.email}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm text-foreground max-w-xs">{apt.reason || 'General Consultation'}</div>
                  {apt.status === 'IN_PROGRESS' && (
                    <span className="inline-block mt-1 text-[0.65rem] font-medium text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                      ⚡ Newly Admitted &bull; Awaiting Doctor Examination
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusPill status={apt.status} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {/* Primary Doctor Action: Check Condition & Prescribe */}
                    {apt.status !== 'COMPLETED' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Stethoscope size={13} />}
                        onClick={() => handleOpenExamine(apt)}
                      >
                        Examine & Prescribe
                      </Button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium px-2.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30">
                        <CheckCircle2 size={12} /> Prescribed
                      </span>
                    )}

                    {apt.status === 'PENDING' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUpdateStatus(apt.id, 'CONFIRMED')}
                      >
                        Confirm
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

      {/* Examine & Prescribe Medicine Modal */}
      {examineApt && (
        <Modal
          isOpen={true}
          onClose={() => setExamineApt(null)}
          title={`Clinical Examination & Prescription: ${
            examineApt.patient?.user
              ? `${examineApt.patient.user.firstName} ${examineApt.patient.user.lastName}`
              : 'Patient'
          }`}
        >
          <form onSubmit={handleIssuePrescription} className="space-y-4">
            {/* Condition Review Card */}
            <div className="p-3 bg-muted/30 rounded-lg border border-border text-xs">
              <div className="text-[0.68rem] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Admitted Patient Condition & Reported Symptoms
              </div>
              <div className="text-sm font-semibold text-foreground">
                {examineApt.reason || 'General health consultation and routine examination'}
              </div>
              <div className="text-[0.68rem] text-muted-foreground font-mono mt-1">
                Slot: {examineApt.timeSlot} &bull; Intake Date: {new Date(examineApt.appointmentDate).toDateString()}
              </div>
            </div>

            {/* Prescribing Medicine Form */}
            <div className="border-t border-border pt-3">
              <div className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>Prescribe Medication</span>
                <span className="text-[0.65rem] text-muted-foreground">Routes to Pharmacist Portal</span>
              </div>

              <FormGroup label="Select Medicine from Pharmacy Stock or Write Name">
                <input
                  type="text"
                  list="medicine-options"
                  value={rxForm.medicineName}
                  onChange={(e) => setRxForm({ ...rxForm, medicineName: e.target.value })}
                  required
                  placeholder="e.g. Amoxicillin 500mg, Paracetamol 650mg"
                />
                <datalist id="medicine-options">
                  {medicines.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name} ({m.category}) — ${m.unitPrice.toFixed(2)}
                    </option>
                  ))}
                </datalist>
              </FormGroup>

              <FormRow columns={2}>
                <FormGroup label="Dosage">
                  <input
                    type="text"
                    value={rxForm.dosage}
                    onChange={(e) => setRxForm({ ...rxForm, dosage: e.target.value })}
                    required
                    placeholder="e.g. 500mg / 1 tablet"
                  />
                </FormGroup>

                <FormGroup label="Regimen Frequency">
                  <input
                    type="text"
                    value={rxForm.frequency}
                    onChange={(e) => setRxForm({ ...rxForm, frequency: e.target.value })}
                    required
                    placeholder="e.g. 1-0-1 (twice daily after meals)"
                  />
                </FormGroup>
              </FormRow>

              <FormRow columns={2}>
                <FormGroup label="Duration (Days)">
                  <input
                    type="number"
                    min="1"
                    value={rxForm.durationDays}
                    onChange={(e) => setRxForm({ ...rxForm, durationDays: Number(e.target.value) })}
                    required
                  />
                </FormGroup>

                <FormGroup label="Patient Instructions">
                  <input
                    type="text"
                    value={rxForm.instructions}
                    onChange={(e) => setRxForm({ ...rxForm, instructions: e.target.value })}
                    placeholder="e.g. Take with warm water after meals"
                  />
                </FormGroup>
              </FormRow>

              <FormGroup label="Doctor Clinical Diagnosis & Remarks">
                <textarea
                  rows={2}
                  value={rxForm.doctorNotes}
                  onChange={(e) => setRxForm({ ...rxForm, doctorNotes: e.target.value })}
                  placeholder="Clinical assessment notes..."
                  className="w-full bg-background border border-input rounded-md p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
                />
              </FormGroup>
            </div>

            <div className="modal-footer pt-3 border-t border-border">
              <Button variant="ghost" onClick={() => setExamineApt(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" icon={<ArrowRight size={14} />}>
                Prescribe & Send to Pharmacist Portal
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
