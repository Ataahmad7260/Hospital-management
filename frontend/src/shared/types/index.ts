// Shared Domain and API Types

export type Role = 'ADMIN' | 'DOCTOR' | 'PATIENT' | 'PHARMACIST';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  phoneNumber?: string;
  avatarUrl?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface Doctor {
  id: string;
  userId: string;
  specialization: string;
  licenseNumber: string;
  qualifications?: string[];
  consultationFee: number;
  roomNumber?: string;
  availableDays: string[];
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    avatarUrl?: string;
  };
  department?: Department;
}

export interface Patient {
  id: string;
  userId: string;
  gender: string;
  bloodGroup: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  allergies: string[];
  chronicDiseases: string[];
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
  };
}

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'REVIEW'
  | 'FOLLOW_UP'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface MedicalReport {
  id: string;
  patientId: string;
  appointmentId?: string | null;
  title: string;
  reportType: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  notes?: string | null;
  uploadedById: string;
  createdAt: string;
  updatedAt?: string;
  appointment?: {
    id: string;
    appointmentDate: string;
    timeSlot: string;
    status: AppointmentStatus;
  } | null;
  patient?: {
    id: string;
    user?: { firstName: string; lastName: string };
  };
}

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  appointmentDate: string;
  timeSlot: string;
  status: AppointmentStatus;
  reason?: string;
  doctorNotes?: string;
  doctor?: {
    id: string;
    specialization: string;
    licenseNumber?: string;
    qualifications?: string[];
    roomNumber?: string;
    consultationFee?: number;
    department?: { name: string; code: string } | null;
    user: { firstName: string; lastName: string; email?: string };
  };
  patient?: {
    id: string;
    gender?: string;
    bloodGroup?: string;
    user: { firstName: string; lastName: string; email?: string; phoneNumber?: string };
  };
  prescriptions?: Prescription[];
  medicalReports?: MedicalReport[];
  profileReports?: MedicalReport[];
  consultationFeePaid?: boolean;
  bills?: Bill[];
  bill?: Bill | null;
  consultationBill?: Bill | null;
  pharmacyBills?: Bill[];
}

export interface PrescriptionItem {
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions?: string;
  dispensed?: boolean;
}

export interface LabTestItem {
  testName: string;
  urgency?: string;
  instructions?: string;
}

export type PrescriptionStatus =
  | 'ISSUED'
  | 'DISPENSED'
  | 'PARTIALLY_DISPENSED'
  | 'CANCELLED';

export interface Prescription {
  id: string;
  prescriptionNo: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string | null;
  doctorNotes?: string;
  status: PrescriptionStatus;
  isFinalized?: boolean;
  createdAt: string;
  items: PrescriptionItem[];
  labTests?: LabTestItem[];
  patient?: {
    id: string;
    user: { firstName: string; lastName: string };
  };
  doctor?: {
    id: string;
    specialization?: string;
    licenseNumber?: string;
    qualifications?: string[];
    roomNumber?: string;
    consultationFee?: number;
    department?: { name: string; code: string } | null;
    user: { firstName: string; lastName: string };
  };
  appointment?: {
    id: string;
    appointmentDate: string;
    timeSlot: string;
    status: AppointmentStatus;
  } | null;
  bills?: Bill[];
  pharmacyBill?: Bill | null;
}

export interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  category: string;
  manufacturer?: string;
  batchNumber: string;
  stockQuantity: number;
  reorderLevel: number;
  unitPrice: number;
  expiryDate: string;
  isActive?: boolean;
}

export interface BillItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type BillStatus = 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED' | 'REFUNDED';

export type BillCategory = 'CONSULTATION' | 'PHARMACY' | 'OTHER';

export interface Bill {
  id: string;
  invoiceNumber: string;
  billType: BillCategory;
  patientId: string;
  appointmentId?: string | null;
  prescriptionId?: string | null;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: BillStatus;
  paymentMethod: string;
  createdAt: string;
  paidAt?: string | null;
  patient?: {
    user: { firstName: string; lastName: string; email?: string };
  };
  appointment?: {
    id: string;
    appointmentDate: string;
    timeSlot: string;
    status: AppointmentStatus;
    reason?: string;
    doctor?: {
      id: string;
      specialization: string;
      consultationFee?: number;
      user: { firstName: string; lastName: string };
    };
  } | null;
  prescription?: {
    id: string;
    prescriptionNo: string;
    status: PrescriptionStatus;
    createdAt?: string;
    items?: PrescriptionItem[];
    doctor?: {
      id: string;
      specialization?: string;
      user: { firstName: string; lastName: string };
    };
  } | null;
  items: BillItem[];
}

export interface PharmacyBillPreviewItem {
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  matchedMedicineId?: string | null;
  matchedMedicineName?: string | null;
  category?: string | null;
  stockQuantity?: number | null;
  inInventory: boolean;
  quantity: number;
  unitPrice: number;
  total: number;
  description: string;
}

export interface PharmacyBillPreview {
  prescriptionId: string;
  prescriptionNo: string;
  prescriptionStatus: PrescriptionStatus;
  patientId: string;
  patientName: string;
  doctorName: string;
  appointmentId?: string | null;
  existingBill?: Bill | null;
  items: PharmacyBillPreviewItem[];
  subtotal: number;
}

export interface BillingCategorySliceSummary {
  totalBilled: number;
  totalPaid: number;
  remainingDue: number;
  count: number;
  paidCount: number;
  pendingCount: number;
}

export interface BillingSummaryResponse {
  totalBilled: number;
  totalPaid: number;
  remainingDue: number;
  invoiceCount: number;
  consultationSummary: BillingCategorySliceSummary;
  pharmacySummary: BillingCategorySliceSummary;
  consultationBills: Bill[];
  pharmacyBills: Bill[];
  otherBills?: Bill[];
  bills: Bill[];
}

export interface HealthStatus {
  name: string;
  status: string;
  version: string;
  database: string;
  documentation: string;
  roles: string[];
  timestamp: string;
}

export interface AdmitPatientPayload {
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  gender?: string;
  bloodGroup?: string;
  dateOfBirth?: string;
  doctorId: string;
  reason: string;
  timeSlot?: string;
  appointmentDate?: string;
  bloodPressure?: string;
  temperature?: number;
  heartRate?: number;
  oxygenSaturation?: number;
  allergies?: string[];
  paymentStatus?: 'PAID' | 'PENDING' | 'UNPAID';
  paymentMethod?: 'CARD' | 'CASH' | 'UPI' | 'ONLINE' | 'INSURANCE';
  paidAmount?: number;
}

export interface PatientOverviewRecord {
  id: string;
  admissionDate: string;
  timeSlot: string;
  status: AppointmentStatus;
  reason: string;
  doctorNotes?: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    gender: string;
    bloodGroup: string;
  };
  attendingDoctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
    department: string;
    consultationFee: number;
  };
  medicalRecord?: {
    diagnosis: string;
    symptoms: string[];
    clinicalNotes?: string;
    vitals?: {
      bloodPressure?: string;
      temperature?: number;
      heartRate?: number;
      oxygenSaturation?: number;
    };
  } | null;
  prescriptions: Array<{
    id: string;
    prescriptionNo: string;
    appointmentId?: string | null;
    status: PrescriptionStatus;
    isFinalized?: boolean;
    doctorNotes?: string;
    createdAt: string;
    items: PrescriptionItem[];
    labTests?: LabTestItem[];
    dispensedLogs?: any[];
  }>;
  billing?: {
    id: string;
    invoiceNumber: string;
    billType?: BillCategory;
    totalAmount: number;
    paidAmount: number;
    subtotal: number;
    taxAmount: number;
    status: BillStatus;
    paymentMethod: string;
    paidAt?: string;
    items: BillItem[];
  } | null;
  consultationBill?: Bill | null;
  pharmacyBills?: Bill[];
}

export interface DailyAdmissionsStats {
  dailyData: Array<{
    date: string;
    formattedDate: string;
    count: number;
    patients: string[];
  }>;
  summary: {
    totalAdmissions: number;
    todayCount: number;
    averageDaily: string;
    peakDay: {
      date: string;
      formattedDate: string;
      count: number;
    };
  };
}

export interface PageTrackingStats {
  totalViews: number;
  uniquePages: number;
  viewsByPage: Record<string, number>;
  viewsByRole: Record<string, number>;
  viewsByDay: Record<string, number>;
  topPages: Array<{ url: string; count: number }>;
  recentViews: Array<{
    id: string;
    pageUrl: string;
    pageTitle: string;
    userRole: string;
    userId?: string;
    ipAddress: string;
    userAgent: string;
    timestamp: string;
  }>;
  timestamp: string;
}

export interface CreateDoctorPayload {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  specialization: string;
  licenseNumber?: string;
  consultationFee?: number;
  roomNumber?: string;
  departmentName?: string;
  departmentId?: string;
  qualifications?: string[];
  availableDays?: string[];
}

export interface CreateMedicinePayload {
  name: string;
  genericName?: string;
  category: string;
  manufacturer?: string;
  batchNumber: string;
  stockQuantity: number;
  reorderLevel?: number;
  unitPrice: number;
  expiryDate: string;
}

export interface PharmacySalesPeriodSummary {
  windowStart?: string;
  windowEnd?: string;
  monthStart?: string;
  totalRevenue: number;
  totalBilled?: number;
  paidTransactionsCount: number;
  totalUnitsSold?: number;
  averageOrderValue?: number;
}

export interface PharmacySalesMedicineBreakdown {
  medicineName: string;
  catalogName: string | null;
  transactionsCount: number;
  totalUnitsSold: number;
  totalRevenue: number;
  lastMonthUnitsSold: number;
  lastMonthRevenue: number;
  averageUnitPrice: number;
  lastSoldAt: string;
}

export interface PharmacySalesPaymentMethodSummary {
  paymentMethod: string;
  transactionsCount: number;
  totalRevenue: number;
}

export interface PharmacySalesTransactionItem {
  description: string;
  medicineName: string;
  catalogName: string | null;
  regimenDetails: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PharmacySalesTransaction {
  id: string;
  invoiceNumber: string;
  status: BillStatus;
  paymentMethod: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingDue: number;
  paidAt: string | null;
  createdAt: string;
  isLastMonth: boolean;
  dispensedAt: string | null;
  patient: {
    id: string;
    name: string;
    email?: string;
  };
  prescription: {
    id: string;
    prescriptionNo: string;
    status: PrescriptionStatus;
    doctorName: string;
  } | null;
  items: PharmacySalesTransactionItem[];
}

export interface PharmacySalesLedger {
  summary: {
    lastMonth: PharmacySalesPeriodSummary;
    currentCalendarMonth: PharmacySalesPeriodSummary;
    overall: {
      totalRevenue: number;
      totalBilled: number;
      pendingRevenue: number;
      paidTransactionsCount: number;
      pendingTransactionsCount: number;
      totalTransactionsCount: number;
      totalUnitsSold: number;
      averageOrderValue: number;
    };
  };
  medicineBreakdown: PharmacySalesMedicineBreakdown[];
  paymentMethodBreakdown: PharmacySalesPaymentMethodSummary[];
  transactions: PharmacySalesTransaction[];
}

export type HospitalStaffCategory =
  | 'NURSE'
  | 'HEAD_NURSE'
  | 'MIDWIFE'
  | 'WARD_BOY'
  | 'WARD_GIRL'
  | 'LAB_TECHNICIAN'
  | 'RADIOLOGY_TECHNICIAN'
  | 'OT_TECHNICIAN'
  | 'PHARMACY_ASSISTANT'
  | 'PARAMEDIC'
  | 'PHYSIOTHERAPIST'
  | 'RECEPTIONIST'
  | 'BILLING_CLERK'
  | 'HOUSEKEEPING'
  | 'SECURITY'
  | 'ADMIN_STAFF'
  | 'OTHER';

export type StaffShift = 'MORNING' | 'EVENING' | 'NIGHT' | 'ROTATIONAL';

export type HospitalStaffStatus = 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';

export interface HospitalStaff {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  category: HospitalStaffCategory;
  designation: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phoneNumber: string;
  email?: string | null;
  department: string;
  assignedWard?: string | null;
  shift: StaffShift;
  qualification?: string | null;
  monthlySalary?: number | null;
  emergencyContact?: string | null;
  joiningDate: string;
  status: HospitalStaffStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHospitalStaffPayload {
  employeeCode?: string;
  firstName: string;
  lastName: string;
  category: HospitalStaffCategory;
  designation?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  phoneNumber: string;
  email?: string;
  department: string;
  assignedWard?: string;
  shift?: StaffShift;
  qualification?: string;
  monthlySalary?: number;
  emergencyContact?: string;
  joiningDate?: string;
  status?: HospitalStaffStatus;
  notes?: string;
}

export type UpdateHospitalStaffPayload = Partial<CreateHospitalStaffPayload>;

export interface HospitalStaffStats {
  total: number;
  active: number;
  onLeave: number;
  inactive: number;
  groups: {
    nurses: number;
    wardAttendants: number;
    wardBoys: number;
    wardGirls: number;
    techniciansAndAllied: number;
    supportAndOperations: number;
  };
  byCategory: Record<string, number>;
  byShift: Record<string, number>;
}
