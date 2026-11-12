import type { HospitalStaffCategory, StaffShift } from '../../../shared/types';

export interface StaffRoleOption {
  category: HospitalStaffCategory;
  label: string;
  shortLabel: string;
  group: 'Nursing & Maternity' | 'Ward Attendants' | 'Diagnostics & Technical' | 'Front Desk & Operations';
  defaultDepartment: string;
  defaultWard: string;
  defaultGender: 'MALE' | 'FEMALE' | 'OTHER';
  defaultQualification: string;
}

export const HOSPITAL_STAFF_ROLE_OPTIONS: StaffRoleOption[] = [
  {
    category: 'NURSE',
    label: 'Staff Nurse (RN)',
    shortLabel: 'Nurse',
    group: 'Nursing & Maternity',
    defaultDepartment: 'General Nursing & Inpatient Care',
    defaultWard: 'General Ward A',
    defaultGender: 'FEMALE',
    defaultQualification: 'B.Sc Nursing / GNM',
  },
  {
    category: 'HEAD_NURSE',
    label: 'Head Nurse / Nursing Supervisor',
    shortLabel: 'Head Nurse',
    group: 'Nursing & Maternity',
    defaultDepartment: 'ICU / Critical Care',
    defaultWard: 'ICU & Nursing Station',
    defaultGender: 'FEMALE',
    defaultQualification: 'M.Sc Nursing / Senior RN',
  },
  {
    category: 'MIDWIFE',
    label: 'Midwife / Maternity Nurse',
    shortLabel: 'Midwife',
    group: 'Nursing & Maternity',
    defaultDepartment: 'Maternity & Pediatrics',
    defaultWard: 'Maternity & NICU Wing',
    defaultGender: 'FEMALE',
    defaultQualification: 'ANM / Midwifery Certified',
  },
  {
    category: 'WARD_BOY',
    label: 'Ward Boy (Male Ward Attendant)',
    shortLabel: 'Ward Boy',
    group: 'Ward Attendants',
    defaultDepartment: 'General Ward & Patient Transport',
    defaultWard: 'Male General Ward',
    defaultGender: 'MALE',
    defaultQualification: 'High School / BLS Certified',
  },
  {
    category: 'WARD_GIRL',
    label: 'Ward Girl (Female Ward Attendant)',
    shortLabel: 'Ward Girl',
    group: 'Ward Attendants',
    defaultDepartment: 'General Ward & Patient Care',
    defaultWard: 'Female & Maternity Ward',
    defaultGender: 'FEMALE',
    defaultQualification: 'High School / Patient Care Trained',
  },
  {
    category: 'LAB_TECHNICIAN',
    label: 'Lab Technician / Phlebotomist',
    shortLabel: 'Lab Tech',
    group: 'Diagnostics & Technical',
    defaultDepartment: 'Pathology & Clinical Lab',
    defaultWard: 'Diagnostic Lab Block',
    defaultGender: 'OTHER',
    defaultQualification: 'DMLT / B.Sc MLT',
  },
  {
    category: 'RADIOLOGY_TECHNICIAN',
    label: 'Radiology / X-Ray / MRI Technician',
    shortLabel: 'Radiology Tech',
    group: 'Diagnostics & Technical',
    defaultDepartment: 'Radiology & Imaging',
    defaultWard: 'Imaging & CT Suite',
    defaultGender: 'OTHER',
    defaultQualification: 'DRIT / Radiology Diploma',
  },
  {
    category: 'OT_TECHNICIAN',
    label: 'Operation Theatre (OT) Technician',
    shortLabel: 'OT Tech',
    group: 'Diagnostics & Technical',
    defaultDepartment: 'Surgical & Operation Theatre',
    defaultWard: 'Main OT Complex',
    defaultGender: 'OTHER',
    defaultQualification: 'Diploma in OT Technology',
  },
  {
    category: 'PHARMACY_ASSISTANT',
    label: 'Pharmacy Assistant / Dispenser',
    shortLabel: 'Pharmacy Asst',
    group: 'Diagnostics & Technical',
    defaultDepartment: 'Dispensary & Pharmacy Support',
    defaultWard: 'Central Pharmacy Desk',
    defaultGender: 'OTHER',
    defaultQualification: 'D.Pharm',
  },
  {
    category: 'PARAMEDIC',
    label: 'Paramedic / Ambulance EMT',
    shortLabel: 'Paramedic',
    group: 'Diagnostics & Technical',
    defaultDepartment: 'Emergency & Trauma',
    defaultWard: 'ER & Ambulance Bay',
    defaultGender: 'OTHER',
    defaultQualification: 'EMT / Trauma Life Support',
  },
  {
    category: 'PHYSIOTHERAPIST',
    label: 'Physiotherapist / Rehab Specialist',
    shortLabel: 'Physiotherapist',
    group: 'Diagnostics & Technical',
    defaultDepartment: 'Physiotherapy & Rehabilitation',
    defaultWard: 'Rehab & Ortho Wing',
    defaultGender: 'OTHER',
    defaultQualification: 'BPT / MPT',
  },
  {
    category: 'RECEPTIONIST',
    label: 'Receptionist / Front Desk Executive',
    shortLabel: 'Receptionist',
    group: 'Front Desk & Operations',
    defaultDepartment: 'OPD & Front Desk',
    defaultWard: 'Main Reception Lobby',
    defaultGender: 'OTHER',
    defaultQualification: 'Hospital Front Office',
  },
  {
    category: 'BILLING_CLERK',
    label: 'Billing & Insurance Coordinator',
    shortLabel: 'Billing Clerk',
    group: 'Front Desk & Operations',
    defaultDepartment: 'Billing & Insurance Accounts',
    defaultWard: 'Billing Counter 1',
    defaultGender: 'OTHER',
    defaultQualification: 'Accounting / Medical Billing',
  },
  {
    category: 'HOUSEKEEPING',
    label: 'Housekeeping / Sanitation & CSSD',
    shortLabel: 'Housekeeping',
    group: 'Front Desk & Operations',
    defaultDepartment: 'Housekeeping & Sterilization',
    defaultWard: 'All Inpatient Floors',
    defaultGender: 'OTHER',
    defaultQualification: 'Hospital Hygiene Trained',
  },
  {
    category: 'SECURITY',
    label: 'Hospital Security Officer / Guard',
    shortLabel: 'Security',
    group: 'Front Desk & Operations',
    defaultDepartment: 'Facility Security & Gate Control',
    defaultWard: 'Main Gate & ER Entry',
    defaultGender: 'MALE',
    defaultQualification: 'Certified Security Personnel',
  },
  {
    category: 'ADMIN_STAFF',
    label: 'Hospital Administrative / Coordinator',
    shortLabel: 'Admin Staff',
    group: 'Front Desk & Operations',
    defaultDepartment: 'Hospital Administration',
    defaultWard: 'Admin Block',
    defaultGender: 'OTHER',
    defaultQualification: 'MHA / Hospital Operations',
  },
  {
    category: 'OTHER',
    label: 'Other Hospital Staff (Custom Role)',
    shortLabel: 'Other Staff',
    group: 'Front Desk & Operations',
    defaultDepartment: 'Hospital Operations',
    defaultWard: 'Assigned Wing',
    defaultGender: 'OTHER',
    defaultQualification: 'Certified Staff',
  },
];

export const STAFF_DEPARTMENTS: string[] = [
  'General Nursing & Inpatient Care',
  'General Ward & Patient Care',
  'General Ward & Patient Transport',
  'ICU / Critical Care',
  'Emergency & Trauma',
  'Maternity & Pediatrics',
  'Surgical & Operation Theatre',
  'Pathology & Clinical Lab',
  'Radiology & Imaging',
  'Dispensary & Pharmacy Support',
  'Physiotherapy & Rehabilitation',
  'OPD & Front Desk',
  'Billing & Insurance Accounts',
  'Housekeeping & Sterilization',
  'Facility Security & Gate Control',
  'Hospital Administration',
  'Hospital Operations',
];

export const STAFF_SHIFT_LABELS: Record<StaffShift, string> = {
  MORNING: 'Morning (07:00 - 15:00)',
  EVENING: 'Evening (15:00 - 23:00)',
  NIGHT: 'Night (23:00 - 07:00)',
  ROTATIONAL: 'Rotational Shifts',
};

export function getStaffRoleMeta(category: HospitalStaffCategory): StaffRoleOption {
  return (
    HOSPITAL_STAFF_ROLE_OPTIONS.find((opt) => opt.category === category) ||
    HOSPITAL_STAFF_ROLE_OPTIONS[HOSPITAL_STAFF_ROLE_OPTIONS.length - 1]
  );
}

