import React, { useEffect, useState } from 'react';
import { X, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../../shared/api';
import { useAuth } from '../../../shared/context/AuthContext';
import type {
  CreateHospitalStaffPayload,
  HospitalStaff,
  HospitalStaffCategory,
  HospitalStaffStatus,
  StaffShift,
} from '../../../shared/types';
import {
  HOSPITAL_STAFF_ROLE_OPTIONS,
  STAFF_DEPARTMENTS,
  STAFF_SHIFT_LABELS,
  getStaffRoleMeta,
} from '../constants/hospitalStaffCategories';

interface AddHospitalStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  editingStaff?: HospitalStaff | null;
}

const QUICK_ROLE_PRESETS: HospitalStaffCategory[] = [
  'NURSE',
  'HEAD_NURSE',
  'WARD_BOY',
  'WARD_GIRL',
  'LAB_TECHNICIAN',
  'OT_TECHNICIAN',
  'RADIOLOGY_TECHNICIAN',
  'PARAMEDIC',
  'RECEPTIONIST',
  'HOUSEKEEPING',
  'SECURITY',
  'OTHER',
];

export const AddHospitalStaffModal: React.FC<AddHospitalStaffModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  editingStaff = null,
}) => {
  const { showToast } = useAuth();
  const initialMeta = getStaffRoleMeta('NURSE');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [category, setCategory] = useState<HospitalStaffCategory>('NURSE');
  const [designation, setDesignation] = useState(initialMeta.label);
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>(initialMeta.defaultGender);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState(initialMeta.defaultDepartment);
  const [customDepartment, setCustomDepartment] = useState('');
  const [assignedWard, setAssignedWard] = useState(initialMeta.defaultWard);
  const [shift, setShift] = useState<StaffShift>('MORNING');
  const [qualification, setQualification] = useState(initialMeta.defaultQualification);
  const [monthlySalary, setMonthlySalary] = useState('2200');
  const [employeeCode, setEmployeeCode] = useState('');
  const [joiningDate, setJoiningDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [emergencyContact, setEmergencyContact] = useState('');
  const [status, setStatus] = useState<HospitalStaffStatus>('ACTIVE');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);

    if (editingStaff) {
      setFirstName(editingStaff.firstName);
      setLastName(editingStaff.lastName);
      setCategory(editingStaff.category);
      setDesignation(editingStaff.designation);
      setGender(editingStaff.gender);
      setPhoneNumber(editingStaff.phoneNumber);
      setEmail(editingStaff.email || '');
      if (STAFF_DEPARTMENTS.includes(editingStaff.department)) {
        setDepartment(editingStaff.department);
        setCustomDepartment('');
      } else {
        setDepartment('__CUSTOM__');
        setCustomDepartment(editingStaff.department);
      }
      setAssignedWard(editingStaff.assignedWard || '');
      setShift(editingStaff.shift);
      setQualification(editingStaff.qualification || '');
      setMonthlySalary(
        editingStaff.monthlySalary !== undefined && editingStaff.monthlySalary !== null
          ? String(editingStaff.monthlySalary)
          : '',
      );
      setEmployeeCode(editingStaff.employeeCode);
      setJoiningDate(
        editingStaff.joiningDate
          ? new Date(editingStaff.joiningDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
      );
      setEmergencyContact(editingStaff.emergencyContact || '');
      setStatus(editingStaff.status);
      setNotes(editingStaff.notes || '');
    } else {
      const meta = getStaffRoleMeta('NURSE');
      setFirstName('');
      setLastName('');
      setCategory('NURSE');
      setDesignation(meta.label);
      setGender(meta.defaultGender);
      setPhoneNumber('');
      setEmail('');
      setDepartment(meta.defaultDepartment);
      setCustomDepartment('');
      setAssignedWard(meta.defaultWard);
      setShift('MORNING');
      setQualification(meta.defaultQualification);
      setMonthlySalary('2200');
      setEmployeeCode('');
      setJoiningDate(new Date().toISOString().split('T')[0]);
      setEmergencyContact('');
      setStatus('ACTIVE');
      setNotes('');
    }
  }, [isOpen, editingStaff]);

  if (!isOpen) return null;

  const handleCategoryChange = (nextCategory: HospitalStaffCategory) => {
    const prevMeta = getStaffRoleMeta(category);
    const nextMeta = getStaffRoleMeta(nextCategory);
    setCategory(nextCategory);

    // Smartly update untouched defaults when switching roles
    if (!editingStaff || designation === prevMeta.label || !designation.trim()) {
      setDesignation(nextCategory === 'OTHER' ? '' : nextMeta.label);
    }
    if (!editingStaff || department === prevMeta.defaultDepartment) {
      setDepartment(nextMeta.defaultDepartment);
      setCustomDepartment('');
    }
    if (!editingStaff || assignedWard === prevMeta.defaultWard) {
      setAssignedWard(nextMeta.defaultWard);
    }
    if (!editingStaff || qualification === prevMeta.defaultQualification) {
      setQualification(nextMeta.defaultQualification);
    }
    if (!editingStaff) {
      setGender(nextMeta.defaultGender);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const resolvedDepartment =
      department === '__CUSTOM__' ? customDepartment.trim() : department.trim();

    if (!firstName.trim() || !lastName.trim()) {
      setError('First name and last name are required.');
      return;
    }
    if (!phoneNumber.trim()) {
      setError('Contact phone number is required.');
      return;
    }
    if (!resolvedDepartment) {
      setError('Department or wing assignment is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateHospitalStaffPayload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        category,
        designation: designation.trim() || getStaffRoleMeta(category).label,
        gender,
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || undefined,
        department: resolvedDepartment,
        assignedWard: assignedWard.trim() || undefined,
        shift,
        qualification: qualification.trim() || undefined,
        monthlySalary:
          monthlySalary.trim() !== '' && !Number.isNaN(Number(monthlySalary))
            ? Number(monthlySalary)
            : undefined,
        employeeCode: employeeCode.trim() || undefined,
        joiningDate: joiningDate || undefined,
        emergencyContact: emergencyContact.trim() || undefined,
        status,
        notes: notes.trim() || undefined,
      };

      if (editingStaff) {
        await api.updateHospitalStaff(editingStaff.id, payload);
        showToast(
          `Updated ${payload.designation}: ${payload.firstName} ${payload.lastName}`,
        );
      } else {
        const created = await api.createHospitalStaff(payload);
        showToast(
          `Added ${created.designation}: ${created.firstName} ${created.lastName} (${created.employeeCode})`,
        );
      }

      onSaved?.();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save hospital staff member');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl border border-border bg-card text-card-foreground p-6 rounded-xl shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto overflow-x-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg border border-border bg-muted flex items-center justify-center text-foreground">
              <Users size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                {editingStaff ? 'Edit Hospital Staff Member' : 'Add Hospital Staff Member'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Onboard Nurse, Head Nurse, Ward Boy, Ward Girl, Technician, Reception, Housekeeping, Security, or custom role
              </p>
            </div>
          </div>
          <button
            type="button"
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
          {/* Quick Role Presets */}
          <div className="space-y-2 p-3 rounded-lg border border-border bg-muted/20">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              Quick Hospital Staff Role Select *
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_ROLE_PRESETS.map((cat) => {
                const meta = getStaffRoleMeta(cat);
                const selected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold border transition-colors cursor-pointer ${
                      selected
                        ? 'bg-foreground text-background border-foreground shadow-xs'
                        : 'bg-card text-muted-foreground hover:text-foreground border-border'
                    }`}
                  >
                    {meta.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Full Category & Custom Designation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Staff Role Category *
              </label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as HospitalStaffCategory)}
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors cursor-pointer"
              >
                <optgroup label="Nursing &amp; Maternity">
                  {HOSPITAL_STAFF_ROLE_OPTIONS.filter((o) => o.group === 'Nursing & Maternity').map((o) => (
                    <option key={o.category} value={o.category}>
                      {o.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Ward Attendants">
                  {HOSPITAL_STAFF_ROLE_OPTIONS.filter((o) => o.group === 'Ward Attendants').map((o) => (
                    <option key={o.category} value={o.category}>
                      {o.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Diagnostics &amp; Technical">
                  {HOSPITAL_STAFF_ROLE_OPTIONS.filter((o) => o.group === 'Diagnostics & Technical').map((o) => (
                    <option key={o.category} value={o.category}>
                      {o.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Front Desk, Support &amp; Custom">
                  {HOSPITAL_STAFF_ROLE_OPTIONS.filter((o) => o.group === 'Front Desk & Operations').map((o) => (
                    <option key={o.category} value={o.category}>
                      {o.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Exact Title / Designation *
              </label>
              <input
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. ICU Nurse, Night Ward Boy, Ward Girl, Stretcher Attendant"
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors"
              />
            </div>
          </div>

          {/* Name & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                First Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Sunita"
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
                placeholder="e.g. Verma"
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE' | 'OTHER')}
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors cursor-pointer"
              >
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
                <option value="OTHER">Other / Prefer not to say</option>
              </select>
            </div>
          </div>

          {/* Contact & Employee Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1-555-0148"
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Email (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff.member@hospital.com"
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Employee ID (Auto if blank)
              </label>
              <input
                type="text"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                placeholder="STF-NUR-1024"
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground font-mono transition-colors"
              />
            </div>
          </div>

          {/* Department, Assigned Ward & Shift */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Hospital Department / Wing *
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors cursor-pointer"
              >
                {STAFF_DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
                <option value="__CUSTOM__">Other / Custom Department...</option>
              </select>
              {department === '__CUSTOM__' && (
                <input
                  type="text"
                  required
                  value={customDepartment}
                  onChange={(e) => setCustomDepartment(e.target.value)}
                  placeholder="Enter department / wing name"
                  className="mt-1.5 w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-1.5 text-xs rounded-lg text-foreground"
                />
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Assigned Ward / Station
              </label>
              <input
                type="text"
                value={assignedWard}
                onChange={(e) => setAssignedWard(e.target.value)}
                placeholder="e.g. Ward B / Floor 2 / ER Bay"
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Duty Shift *
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as StaffShift)}
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors cursor-pointer"
              >
                {(Object.keys(STAFF_SHIFT_LABELS) as StaffShift[]).map((s) => (
                  <option key={s} value={s}>
                    {STAFF_SHIFT_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Qualification, Salary, Joining Date & Duty Status */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Qualification / Cert
              </label>
              <input
                type="text"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                placeholder="GNM / BLS / DMLT"
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Monthly Salary ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(e.target.value)}
                placeholder="2200"
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground font-mono transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Joining Date
              </label>
              <input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-2.5 py-1.5 text-xs rounded-lg text-foreground transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Duty Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as HospitalStaffStatus)}
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors cursor-pointer"
              >
                <option value="ACTIVE">Active Duty</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {/* Emergency Contact & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Emergency Contact (Optional)
              </label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="Relative name &amp; phone"
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Duty Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Assigned to Pediatric ICU night rotation"
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
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
                'Saving Staff Member...'
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>{editingStaff ? 'Save Changes' : 'Add Staff Member'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

