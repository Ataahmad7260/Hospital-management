import React, { useEffect, useState } from 'react';
import {
  UserPlus,
  ArrowRight,
  HeartPulse,
  CheckCircle2,
  Stethoscope,
  AlertCircle,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { Card, Button, FormGroup, FormRow, Modal } from '../../../shared/ui';
import { api } from '../../../shared/api';
import type { Doctor } from '../../../shared/types';
import { useAuth } from '../../../shared/context/AuthContext';

interface Props {
  onAdmittedSuccess?: (doctorId: string) => void;
  onNavigateToOverview?: () => void;
}

export const AdmitPatientPage: React.FC<Props> = ({ onAdmittedSuccess, onNavigateToOverview }) => {
  const { showToast, switchRole, role } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'CASH' | 'UPI' | 'ONLINE'>('CARD');
  const [lastAdmitted, setLastAdmitted] = useState<{
    id: string;
    patientName: string;
    doctorName: string;
    doctorId: string;
  } | null>(null);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gender: 'MALE',
    bloodGroup: 'O_POSITIVE',
    dateOfBirth: '1990-01-01',
    doctorId: '',
    reason: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Priority Admission`,
    bloodPressure: '120/80 mmHg',
    temperature: 37.2,
    heartRate: 78,
    oxygenSaturation: 98,
    allergies: 'None',
  });

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    try {
      const list = await api.getDoctors();
      setDoctors(list);
      if (list.length > 0 && !form.doctorId) {
        setForm((prev) => ({ ...prev, doctorId: list[0].id }));
      }
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const selectedDoctor = doctors.find((d) => d.id === form.doctorId) || null;
  const consultationFee = Number(selectedDoctor?.consultationFee ?? 0);

  // Step 1: Cannot save without upfront consultation fee settlement — open Payment Modal
  const handleAdmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      showToast('Please write the patient first and last name', true);
      return;
    }
    if (!form.doctorId || !selectedDoctor) {
      showToast('Please assign an attending doctor', true);
      return;
    }
    if (!form.reason.trim()) {
      showToast('Please state the symptoms or reason for admission', true);
      return;
    }

    setIsPaymentModalOpen(true);
  };

  // Step 2: Settle Consultation Fee Upfront & Confirm Admission
  const handleConfirmPaidAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;

    setLoading(true);
    try {
      const allergiesList =
        form.allergies && form.allergies.toLowerCase() !== 'none'
          ? form.allergies.split(',').map((s) => s.trim()).filter(Boolean)
          : [];

      const res = await api.admitPatient({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || undefined,
        phoneNumber: form.phoneNumber.trim() || undefined,
        gender: form.gender,
        bloodGroup: form.bloodGroup,
        dateOfBirth: form.dateOfBirth || undefined,
        doctorId: form.doctorId,
        reason: form.reason.trim(),
        appointmentDate: form.appointmentDate,
        timeSlot: form.timeSlot,
        bloodPressure: form.bloodPressure,
        temperature: Number(form.temperature),
        heartRate: Number(form.heartRate),
        oxygenSaturation: Number(form.oxygenSaturation),
        allergies: allergiesList,
        paymentStatus: 'PAID',
        paymentMethod,
        paidAmount: consultationFee,
      });

      const doctorFullName = `Dr. ${selectedDoctor.user.firstName} ${selectedDoctor.user.lastName}`;

      setLastAdmitted({
        id: res.admission.id,
        patientName: `${form.firstName.trim()} ${form.lastName.trim()}`,
        doctorName: doctorFullName,
        doctorId: form.doctorId,
      });

      setIsPaymentModalOpen(false);
      showToast(
        `Consultation fee ($${consultationFee.toFixed(2)}) PAID — Patient ${form.firstName} ${form.lastName} admitted & routed to doctor queue!`,
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to admit patient', true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDoctor = () => {
    if (role !== 'ADMIN') {
      switchRole('DOCTOR');
    }
    if (onAdmittedSuccess && lastAdmitted) {
      onAdmittedSuccess(lastAdmitted.doctorId);
    }
  };

  const resetForm = () => {
    setLastAdmitted(null);
    setForm((prev) => ({
      ...prev,
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      reason: '',
      allergies: 'None',
    }));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full min-w-0">
      {/* Success Notification Banner when patient is admitted */}
      {lastAdmitted && (
        <div className="bg-card border border-emerald-500/30 rounded-xl p-5 mb-6 shadow-sm animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div className="min-w-0">
                <div className="text-base font-bold text-foreground flex flex-wrap items-center gap-2">
                  <span>Patient Admitted: {lastAdmitted.patientName}</span>
                  <span className="text-[0.65rem] font-medium px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    STATUS: ROUTED TO DOCTOR
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Assigned Attending Physician: <strong className="text-foreground">{lastAdmitted.doctorName}</strong>. Case is now live in the Doctor Portal consultation queue.
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetForm}>
                Admit Another
              </Button>
              {onNavigateToOverview && (
                <Button variant="outline" size="sm" onClick={onNavigateToOverview}>
                  {role === 'ADMIN' ? 'View in Patients Registry' : 'View All in Overview'}
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                icon={<Stethoscope size={14} />}
                onClick={handleGoToDoctor}
              >
                {role === 'ADMIN' ? 'View Patient Records' : 'Go to Doctor Portal Now'} <ArrowRight size={13} className="ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card
        title="Patient Admission & Clinical Intake"
        subtitle="Write a new patient name, record condition & vital signs, and immediately route to the Doctor Portal"
        icon={<UserPlus size={18} className="text-primary" />}
      >
        <form onSubmit={handleAdmit} className="space-y-5">
          {/* Section 1: Patient Identity */}
          <div className="bg-muted/30 p-4 rounded-lg border border-border min-w-0 max-w-full">
            <div className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <span>1. Patient Identity & Contact Details</span>
            </div>

            <FormRow columns={2}>
              <FormGroup label="Patient First Name *">
                <input
                  type="text"
                  placeholder="Write first name (e.g. David)"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                  className="w-full"
                />
              </FormGroup>

              <FormGroup label="Patient Last Name *">
                <input
                  type="text"
                  placeholder="Write last name (e.g. Miller)"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                  className="w-full"
                />
              </FormGroup>
            </FormRow>

            <FormRow columns={2}>
              <FormGroup label="Email Address (Optional)">
                <input
                  type="email"
                  placeholder="e.g. david.miller@example.com (auto-generated if empty)"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </FormGroup>

              <FormGroup label="Phone Number">
                <input
                  type="tel"
                  placeholder="e.g. +1-555-0188"
                  value={form.phoneNumber}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                />
              </FormGroup>
            </FormRow>

            <FormRow columns={3}>
              <FormGroup label="Gender">
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other / Non-Binary</option>
                </select>
              </FormGroup>

              <FormGroup label="Blood Group">
                <select
                  value={form.bloodGroup}
                  onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                >
                  <option value="A_POSITIVE">A Positive (A+)</option>
                  <option value="A_NEGATIVE">A Negative (A-)</option>
                  <option value="B_POSITIVE">B Positive (B+)</option>
                  <option value="B_NEGATIVE">B Negative (B-)</option>
                  <option value="AB_POSITIVE">AB Positive (AB+)</option>
                  <option value="AB_NEGATIVE">AB Negative (AB-)</option>
                  <option value="O_POSITIVE">O Positive (O+)</option>
                  <option value="O_NEGATIVE">O Negative (O-)</option>
                  <option value="UNKNOWN">Unknown</option>
                </select>
              </FormGroup>

              <FormGroup label="Date of Birth">
                <input
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                />
              </FormGroup>
            </FormRow>
          </div>

          {/* Section 2: Clinical Assignment & Reason */}
          <div className="bg-muted/30 p-4 rounded-lg border border-border min-w-0 max-w-full">
            <div className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <span>2. Attending Physician Assignment & Clinical Symptoms</span>
            </div>

            <FormGroup label="Assigned Attending Doctor *">
              <select
                value={form.doctorId}
                onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                required
                className="w-full max-w-full min-w-0 truncate"
              >
                <option value="">Select Doctor who conducts this patient...</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.user.firstName} {d.user.lastName} &bull; {d.specialization} &bull; Fee: ${d.consultationFee.toFixed(2)}
                  </option>
                ))}
              </select>
            </FormGroup>

            {selectedDoctor && (
              <div className="mb-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Stethoscope size={16} className="text-amber-400 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-foreground">
                      Dr. {selectedDoctor.user.firstName} {selectedDoctor.user.lastName} ({selectedDoctor.specialization})
                    </div>
                    <div className="text-[11px] font-mono text-muted-foreground">
                      Upfront consultation fee must be paid before admitting &amp; routing to queue
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-mono uppercase text-amber-300">Consultation Fee</div>
                  <div className="text-base font-bold font-mono text-foreground">
                    ${consultationFee.toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            <FormGroup label="Patient Condition / Symptoms for Admission *">
              <textarea
                rows={3}
                placeholder="Describe current patient condition, symptoms, and urgency (e.g. Acute chest discomfort, high fever 39°C, breathlessness for 2 days)"
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                required
                className="w-full bg-background border border-input rounded-md p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
              />
            </FormGroup>

            <FormRow columns={2}>
              <FormGroup label="Admission Date">
                <input
                  type="date"
                  value={form.appointmentDate}
                  onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
                  required
                />
              </FormGroup>

              <FormGroup label="Intake Time Slot">
                <input
                  type="text"
                  value={form.timeSlot}
                  onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                  required
                />
              </FormGroup>
            </FormRow>
          </div>

          {/* Section 3: Vitals at Admission */}
          <div className="bg-muted/30 p-4 rounded-lg border border-border min-w-0">
            <div className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <HeartPulse size={14} className="text-rose-400" />
                <span>3. Initial Vital Signs Recorded at Intake</span>
              </div>
              <span className="text-[0.65rem] text-muted-foreground font-normal">Sent directly to Doctor</span>
            </div>

            <FormRow columns={4}>
              <FormGroup label="Blood Pressure">
                <input
                  type="text"
                  placeholder="120/80 mmHg"
                  value={form.bloodPressure}
                  onChange={(e) => setForm({ ...form, bloodPressure: e.target.value })}
                />
              </FormGroup>

              <FormGroup label="Temperature (°C)">
                <input
                  type="number"
                  step="0.1"
                  placeholder="37.2"
                  value={form.temperature}
                  onChange={(e) => setForm({ ...form, temperature: Number(e.target.value) })}
                />
              </FormGroup>

              <FormGroup label="Heart Rate (BPM)">
                <input
                  type="number"
                  placeholder="78"
                  value={form.heartRate}
                  onChange={(e) => setForm({ ...form, heartRate: Number(e.target.value) })}
                />
              </FormGroup>

              <FormGroup label="Oxygen SpO2 (%)">
                <input
                  type="number"
                  placeholder="98"
                  value={form.oxygenSaturation}
                  onChange={(e) => setForm({ ...form, oxygenSaturation: Number(e.target.value) })}
                />
              </FormGroup>
            </FormRow>

            <FormGroup label="Known Allergies (Comma separated)">
              <input
                type="text"
                placeholder="e.g. Penicillin, Sulfa drugs, Peanuts (or None)"
                value={form.allergies}
                onChange={(e) => setForm({ ...form, allergies: e.target.value })}
              />
            </FormGroup>
          </div>

          {/* Submission footer */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AlertCircle size={14} />
              <span>
                Upfront consultation fee (${consultationFee.toFixed(2)}) required before routing to the Doctor queue.
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              icon={<CreditCard size={15} />}
              className="w-full sm:w-auto max-w-full"
            >
              Admit Patient (${consultationFee.toFixed(2)} Payment Step)
            </Button>
          </div>
        </form>
      </Card>

      {/* Upfront Consultation Fee Payment Modal */}
      {isPaymentModalOpen && selectedDoctor && (
        <Modal
          isOpen={true}
          onClose={() => !loading && setIsPaymentModalOpen(false)}
          title="Upfront Consultation Fee Payment"
        >
          <form onSubmit={handleConfirmPaidAdmission} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-lg border border-border bg-muted/40 space-y-2 font-mono">
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Patient:</span>
                <strong className="text-foreground">
                  {form.firstName} {form.lastName}
                </strong>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted-foreground">Attending Doctor:</span>
                <span className="text-foreground">
                  Dr. {selectedDoctor.user.firstName} {selectedDoctor.user.lastName}
                </span>
              </div>
              <div className="flex justify-between gap-2 pt-2 border-t border-border text-sm">
                <span className="font-semibold text-foreground">Consultation Fee Due:</span>
                <strong className="text-emerald-400">${consultationFee.toFixed(2)}</strong>
              </div>
            </div>

            <FormGroup label="Payment Method *">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                required
              >
                <option value="CARD">Debit / Credit Card</option>
                <option value="CASH">Cash at Admission Desk</option>
                <option value="UPI">UPI / Instant QR</option>
                <option value="ONLINE">Online Gateway</option>
              </select>
            </FormGroup>

            <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 flex items-center gap-2 font-mono text-[11px]">
              <ShieldCheck size={15} className="shrink-0 text-emerald-400" />
              <span>
                Confirming payment creates the patient record, settles the consultation bill, and routes to Dr. {selectedDoctor.user.firstName}&apos;s queue.
              </span>
            </div>

            <div className="modal-footer flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => setIsPaymentModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading
                  ? 'Processing Payment & Admitting...'
                  : `Pay $${consultationFee.toFixed(2)} & Admit Patient`}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
