import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  ShieldCheck,
  ArrowLeft,
  Stethoscope,
} from 'lucide-react';
import { api } from '../../../shared/api';
import { useAuth } from '../../../shared/context/AuthContext';
import type { Doctor, AdmitPatientPayload } from '../../../shared/types';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientAdded?: () => void;
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({
  isOpen,
  onClose,
  onPatientAdded,
}) => {
  const { showToast } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [bloodGroup, setBloodGroup] = useState('O_POSITIVE');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [reason, setReason] = useState('');
  const [bloodPressure, setBloodPressure] = useState('120/80 mmHg');
  const [temperature, setTemperature] = useState<number>(36.8);
  const [heartRate, setHeartRate] = useState<number>(75);
  const [oxygenSaturation, setOxygenSaturation] = useState<number>(99);
  const [allergies, setAllergies] = useState('');

  // Upfront Payment Step Enforcement State
  const [step, setStep] = useState<'form' | 'payment'>('form');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'CASH' | 'UPI' | 'ONLINE'>('CARD');
  const [paymentReference, setPaymentReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setError(null);
      loadDoctors();
    }
  }, [isOpen]);

  const loadDoctors = async () => {
    try {
      const data = await api.getDoctors();
      setDoctors(data);
      if (data.length > 0 && !doctorId) {
        setDoctorId(data[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load doctors for patient intake:', err);
    }
  };

  if (!isOpen) return null;

  const selectedDoctor = doctors.find((d) => d.id === doctorId) || null;
  const consultationFee = Number(selectedDoctor?.consultationFee ?? 0);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhoneNumber('');
    setReason('');
    setAllergies('');
    setPaymentReference('');
    setStep('form');
    setError(null);
  };

  // Step 1: Clicking "Admit Patient" cannot save directly — opens Upfront Payment Step
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter patient first name and last name');
      return;
    }
    if (!doctorId || !selectedDoctor) {
      setError('Please select an attending doctor for admission');
      return;
    }
    if (!reason.trim()) {
      setError('Please enter the admission reason and symptoms');
      return;
    }

    setError(null);
    setStep('payment');
  };

  // Step 2: Confirm Upfront Consultation Fee Payment & Admit Patient
  const handleConfirmPaymentAndAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId || !selectedDoctor) {
      setError('Please select an attending doctor for admission');
      setStep('form');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const payload: AdmitPatientPayload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        gender,
        bloodGroup: bloodGroup as any,
        dateOfBirth: dateOfBirth || undefined,
        doctorId,
        reason: reason.trim() || 'General medical examination & consultation',
        bloodPressure: bloodPressure.trim() || undefined,
        temperature: temperature ? Number(temperature) : undefined,
        heartRate: heartRate ? Number(heartRate) : undefined,
        oxygenSaturation: oxygenSaturation ? Number(oxygenSaturation) : undefined,
        allergies: allergies
          ? allergies.split(',').map((a) => a.trim()).filter(Boolean)
          : undefined,
        paymentStatus: 'PAID',
        paymentMethod,
        paidAmount: consultationFee,
      };

      const res = await api.admitPatient(payload);
      showToast(
        `Consultation fee ($${consultationFee.toFixed(2)} ${paymentMethod}) PAID — Patient ${firstName} ${lastName} admitted & routed to Dr. ${selectedDoctor.user.firstName} ${selectedDoctor.user.lastName}'s queue${res.consultationBill?.invoiceNumber ? ` (${res.consultationBill.invoiceNumber})` : ''}`,
      );
      onPatientAdded?.();
      resetForm();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to admit patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg border border-border bg-card text-card-foreground p-6 rounded-xl shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg border border-border bg-muted flex items-center justify-center text-foreground">
              {step === 'payment' ? <CreditCard size={18} /> : <UserPlus size={18} />}
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                {step === 'payment'
                  ? 'Consultation Fee Payment Required'
                  : 'Register & Admit Patient'}
              </h2>
              <p className="text-xs text-muted-foreground">
                {step === 'payment'
                  ? 'Confirm upfront fee settlement before saving record & routing to doctor queue'
                  : 'Create patient record & route to attending doctor'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-wider">
          <span
            className={`px-2 py-0.5 rounded border ${
              step === 'form'
                ? 'border-primary/40 bg-primary/15 text-primary font-semibold'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            }`}
          >
            1. Intake & Doctor
          </span>
          <span className="text-muted-foreground">&rarr;</span>
          <span
            className={`px-2 py-0.5 rounded border ${
              step === 'payment'
                ? 'border-amber-500/40 bg-amber-500/15 text-amber-300 font-semibold'
                : 'border-border bg-muted/40 text-muted-foreground'
            }`}
          >
            2. Upfront Fee Payment (${consultationFee.toFixed(2)})
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="text-xs font-mono border border-destructive/40 bg-destructive/10 text-destructive p-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 'form' ? (
          <form onSubmit={handleProceedToPayment} className="space-y-4">
          {/* Name Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                First Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Eleanor"
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Rigby"
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors"
              />
            </div>
          </div>

          {/* Contact Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="eleanor@example.com"
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1-555-0988"
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors"
              />
            </div>
          </div>

          {/* Demographics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors cursor-pointer"
              >
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Blood Group
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors cursor-pointer"
              >
                <option value="O_POSITIVE">O+</option>
                <option value="O_NEGATIVE">O-</option>
                <option value="A_POSITIVE">A+</option>
                <option value="A_NEGATIVE">A-</option>
                <option value="B_POSITIVE">B+</option>
                <option value="B_NEGATIVE">B-</option>
                <option value="AB_POSITIVE">AB+</option>
                <option value="AB_NEGATIVE">AB-</option>
                <option value="UNKNOWN">Unknown</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Date of Birth
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-2 py-1.5 text-xs rounded-lg text-foreground transition-colors"
              />
            </div>
          </div>

          {/* Attending Doctor + Dynamic Consultation Fee Display */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Assigned Attending Doctor *
            </label>
            <select
              required
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors cursor-pointer"
            >
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.user.firstName} {d.user.lastName} ({d.specialization} &bull; {d.department?.name || 'General'}) — Fee: ${d.consultationFee.toFixed(2)}
                </option>
              ))}
            </select>

            {selectedDoctor && (
              <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Stethoscope size={15} className="text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">
                      Dr. {selectedDoctor.user.firstName} {selectedDoctor.user.lastName}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground truncate">
                      {selectedDoctor.specialization} &bull; Upfront fee required to route to queue
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] font-mono uppercase text-amber-300">Consultation Fee</div>
                  <div className="text-base font-bold font-mono text-foreground">
                    ${consultationFee.toFixed(2)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Condition / Reason */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Admission Reason & Symptoms *
            </label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Primary symptoms, onset date, clinical presentation..."
              className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors resize-none"
            />
          </div>

          {/* Initial Vitals Grid */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Initial Baseline Vitals (Optional)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <span className="text-[9px] text-muted-foreground uppercase font-mono">BP</span>
                <input
                  type="text"
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                  placeholder="120/80"
                  className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-2 py-1 text-[11px] rounded text-foreground font-mono"
                />
              </div>
              <div>
                <span className="text-[9px] text-muted-foreground uppercase font-mono">Temp (°C)</span>
                <input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  placeholder="36.8"
                  className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-2 py-1 text-[11px] rounded text-foreground font-mono"
                />
              </div>
              <div>
                <span className="text-[9px] text-muted-foreground uppercase font-mono">Heart Rate</span>
                <input
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(Number(e.target.value))}
                  placeholder="75"
                  className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-2 py-1 text-[11px] rounded text-foreground font-mono"
                />
              </div>
              <div>
                <span className="text-[9px] text-muted-foreground uppercase font-mono">SpO2 (%)</span>
                <input
                  type="number"
                  value={oxygenSaturation}
                  onChange={(e) => setOxygenSaturation(Number(e.target.value))}
                  placeholder="99"
                  className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-2 py-1 text-[11px] rounded text-foreground font-mono"
                />
              </div>
            </div>
          </div>

          {/* Known Allergies */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Known Allergies (Comma separated)
            </label>
            <input
              type="text"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="e.g. Penicillin, Peanuts, Latex"
              className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-1.5 text-xs rounded-lg text-foreground transition-colors"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono text-amber-300">
              Payment required next: ${consultationFee.toFixed(2)}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="px-4 py-2 border border-border rounded-lg text-xs hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-foreground text-background font-semibold rounded-lg text-xs hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <CreditCard size={14} />
                <span>Admit Patient</span>
              </button>
            </div>
          </div>
        </form>
        ) : (
          <form onSubmit={handleConfirmPaymentAndAdmit} className="space-y-4">
            <div className="p-4 rounded-xl border border-border bg-muted/40 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-border/70 pb-2">
                <span className="font-mono uppercase text-[10px] text-muted-foreground">
                  Admission Fee Checkout
                </span>
                <span className="px-2 py-0.5 rounded font-mono text-[10px] uppercase border border-amber-500/40 bg-amber-500/15 text-amber-300 font-semibold">
                  Stage 1 Upfront Gate
                </span>
              </div>

              <div className="space-y-1.5 font-mono">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Patient:</span>
                  <strong className="text-foreground">{firstName} {lastName}</strong>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Attending Doctor:</span>
                  <span className="text-foreground">
                    Dr. {selectedDoctor?.user.firstName} {selectedDoctor?.user.lastName}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Specialization:</span>
                  <span className="text-foreground">{selectedDoctor?.specialization}</span>
                </div>
                <div className="flex justify-between gap-2 pt-2 border-t border-border/70 text-sm">
                  <span className="font-semibold text-foreground">Consultation Fee Due:</span>
                  <span className="font-bold text-emerald-400">${consultationFee.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground font-mono cursor-pointer"
              >
                <option value="CARD">Debit / Credit Card</option>
                <option value="CASH">Cash Collected at Admission Desk</option>
                <option value="UPI">UPI / Instant QR Payment</option>
                <option value="ONLINE">Online Payment Gateway</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Receipt / Transaction Reference (Optional)
              </label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="e.g. TXN-984210 / Desk Receipt"
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground font-mono"
              />
            </div>

            <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-[11px] font-mono text-emerald-300 flex items-center gap-2">
              <ShieldCheck size={15} className="shrink-0 text-emerald-400" />
              <span>
                Recording payment marks the Consultation Invoice as <strong>PAID</strong> and immediately routes the patient to Dr. {selectedDoctor?.user.firstName}&apos;s active queue.
              </span>
            </div>

            <div className="pt-3 border-t border-border flex justify-between gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setError(null);
                  setStep('form');
                }}
                className="px-3.5 py-2 border border-border rounded-lg text-xs hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
              >
                <ArrowLeft size={13} />
                <span>Back to Details</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-foreground text-background font-semibold rounded-lg text-xs hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isSubmitting ? (
                  'Processing Payment & Admitting...'
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Pay ${consultationFee.toFixed(2)} & Admit Patient</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
