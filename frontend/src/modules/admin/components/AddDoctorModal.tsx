import React, { useState } from 'react';
import { X, Stethoscope, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../../shared/api';
import { useAuth } from '../../../shared/context/AuthContext';
import type { CreateDoctorPayload } from '../../../shared/types';

interface AddDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDoctorAdded?: () => void;
}

export const AddDoctorModal: React.FC<AddDoctorModalProps> = ({
  isOpen,
  onClose,
  onDoctorAdded,
}) => {
  const { showToast } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Hospital123!');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [specialization, setSpecialization] = useState('Cardiology');
  const [departmentName, setDepartmentName] = useState('Cardiology');
  const [consultationFee, setConsultationFee] = useState(75);
  const [roomNumber, setRoomNumber] = useState('Suite 301');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSpecializationChange = (spec: string) => {
    setSpecialization(spec);
    setDepartmentName(spec);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload: CreateDoctorPayload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password: password || 'Hospital123!',
        phoneNumber: phoneNumber.trim() || undefined,
        specialization: specialization.trim(),
        departmentName: departmentName.trim(),
        consultationFee: Number(consultationFee),
        roomNumber: roomNumber.trim() || undefined,
        licenseNumber: licenseNumber.trim() || undefined,
        availableDays: selectedDays,
      };

      await api.createDoctor(payload);
      showToast(`Dr. ${firstName} ${lastName} successfully registered in roster`);
      onDoctorAdded?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create doctor profile');
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
              <Stethoscope size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Add Doctor Entry
              </h2>
              <p className="text-xs text-muted-foreground">
                Register a new physician & clinical department
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="text-xs font-mono border border-destructive/40 bg-destructive/10 text-destructive p-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Marcus"
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
                placeholder="Vance"
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors"
              />
            </div>
          </div>

          {/* Credentials Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dr.vance@hospital.com"
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Initial Password
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Hospital123!"
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground font-mono transition-colors"
              />
            </div>
          </div>

          {/* Specialization & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Specialization *
              </label>
              <select
                value={specialization}
                onChange={(e) => handleSpecializationChange(e.target.value)}
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors cursor-pointer"
              >
                <option value="Cardiology">Cardiology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Neurology">Neurology</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Oncology">Oncology</option>
                <option value="Pulmonology">Pulmonology</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Department Name
              </label>
              <input
                type="text"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                placeholder="Cardiology"
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors"
              />
            </div>
          </div>

          {/* Consultation Fee, Room, License & Phone */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Fee ($)
              </label>
              <input
                type="number"
                min="0"
                value={consultationFee}
                onChange={(e) => setConsultationFee(Number(e.target.value))}
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Room / Suite
              </label>
              <input
                type="text"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="Suite 302"
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                License No.
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="MD-CARD-1234"
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Contact Phone
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1-555-0199"
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors"
              />
            </div>
          </div>

          {/* Available Days */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Consultation Schedule Days
            </label>
            <div className="flex flex-wrap gap-1.5">
              {weekDays.map((day) => {
                const active = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors cursor-pointer border ${
                      active
                        ? 'bg-foreground text-background border-foreground font-semibold'
                        : 'bg-muted/40 text-muted-foreground hover:text-foreground border-border'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-lg text-xs hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-foreground text-background font-semibold rounded-lg text-xs hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {isSubmitting ? (
                'Registering...'
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Register Doctor</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
