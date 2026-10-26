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
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

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
    user: { firstName: string; lastName: string; email?: string };
  };
  patient?: {
    id: string;
    user: { firstName: string; lastName: string; email?: string };
  };
}

export interface PrescriptionItem {
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions?: string;
  dispensed?: boolean;
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
  doctorNotes?: string;
  status: PrescriptionStatus;
  createdAt: string;
  items: PrescriptionItem[];
  patient?: {
    id: string;
    user: { firstName: string; lastName: string };
  };
  doctor?: {
    id: string;
    specialization?: string;
    user: { firstName: string; lastName: string };
  };
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

export type BillStatus = 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED';

export interface Bill {
  id: string;
  invoiceNumber: string;
  patientId: string;
  appointmentId?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: BillStatus;
  paymentMethod: string;
  createdAt: string;
  paidAt?: string;
  patient?: {
    user: { firstName: string; lastName: string; email?: string };
  };
  items: BillItem[];
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
