import React, { useEffect, useState } from 'react';
import { UserPlus, ArrowRight, HeartPulse, CheckCircle2, Stethoscope, AlertCircle } from 'lucide-react';
import { Card, Button, FormGroup, FormRow } from '../../../shared/ui';
import { api } from '../../../shared/api';
import type { Doctor } from '../../../shared/types';
import { useAuth } from '../../../shared/context/AuthContext';

interface Props {
  onAdmittedSuccess?: (doctorId: string) => void;
  onNavigateToOverview?: () => void;
}

export const AdmitPatientPage: React.FC<Props> = ({ onAdmittedSuccess, onNavigateToOverview }) => {
  const { showToast, switchRole } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
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

  const handleAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      showToast('Please write the patient first and last name', true);
      return;
    }
    if (!form.doctorId) {
      showToast('Please assign an attending doctor', true);
      return;
    }
    if (!form.reason.trim()) {
      showToast('Please state the symptoms or reason for admission', true);
      return;
    }

    setLoading(true);
    try {
      const allergiesList = form.allergies && form.allergies.toLowerCase() !== 'none'
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
      });

      const assignedDoctor = doctors.find((d) => d.id === form.doctorId);
      const doctorFullName = assignedDoctor
        ? `Dr. ${assignedDoctor.user.firstName} ${assignedDoctor.user.lastName}`
        : 'Doctor';

      setLastAdmitted({
        id: res.admission.id,
        patientName: `${form.firstName.trim()} ${form.lastName.trim()}`,
        doctorName: doctorFullName,
        doctorId: form.doctorId,
      });

      showToast(`Patient ${form.firstName} ${form.lastName} admitted successfully! Sent to doctor portal queue.`);
    } catch (err: any) {
      showToast(err.message || 'Failed to admit patient', true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDoctor = () => {
    switchRole('DOCTOR');
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
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      {/* Success Notification Banner when patient is admitted */}
      {lastAdmitted && (
        <div className="bg-card border border-emerald-500/30 rounded-xl p-5 mb-6 shadow-sm animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div className="text-base font-bold text-foreground flex items-center gap-2">
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

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetForm}>
                Admit Another
              </Button>
              {onNavigateToOverview && (
                <Button variant="outline" size="sm" onClick={onNavigateToOverview}>
                  View All in Overview
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                icon={<Stethoscope size={14} />}
                onClick={handleGoToDoctor}
              >
                Go to Doctor Portal Now <ArrowRight size={13} className="ml-1" />
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
          <div className="bg-muted/30 p-4 rounded-lg border border-border">
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
          <div className="bg-muted/30 p-4 rounded-lg border border-border">
            <div className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <span>2. Attending Physician Assignment & Clinical Symptoms</span>
            </div>

            <FormGroup label="Assign Attending Doctor *">
              <select
                value={form.doctorId}
                onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                required
              >
                <option value="">Select Doctor who conducts this patient...</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.user.firstName} {d.user.lastName} &bull; {d.specialization} &bull; Fee: ${d.consultationFee.toFixed(2)}
                  </option>
                ))}
              </select>
            </FormGroup>

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
          <div className="bg-muted/30 p-4 rounded-lg border border-border">
            <div className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center justify-between">
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
              <span>Patient record will be created and forwarded directly to the Doctor Portal.</span>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              icon={<UserPlus size={15} />}
            >
              {loading ? 'Admitting Patient...' : 'Complete Admission & Send to Doctor Portal'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
