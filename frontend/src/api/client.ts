// API Client for AURA Hospital Management Backend

const API_BASE_URL = '/api/v1';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'DOCTOR' | 'PATIENT' | 'PHARMACIST';
  phoneNumber?: string;
  isActive?: boolean;
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
  };
  department?: {
    id: string;
    name: string;
    code: string;
  };
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

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  appointmentDate: string;
  timeSlot: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  reason?: string;
  doctor?: {
    user: { firstName: string; lastName: string };
  };
  patient?: {
    user: { firstName: string; lastName: string };
  };
}

export interface Prescription {
  id: string;
  prescriptionNo: string;
  patientId: string;
  doctorId: string;
  doctorNotes?: string;
  status: 'ISSUED' | 'DISPENSED' | 'PARTIALLY_DISPENSED' | 'CANCELLED';
  createdAt: string;
  items: {
    medicineName: string;
    dosage: string;
    frequency: string;
    durationDays: number;
    instructions?: string;
    dispensed: boolean;
  }[];
  patient?: {
    user: { firstName: string; lastName: string };
  };
  doctor?: {
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
}

export interface Bill {
  id: string;
  invoiceNumber: string;
  patientId: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED';
  paymentMethod: string;
  createdAt: string;
  patient?: {
    user: { firstName: string; lastName: string };
  };
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('aura_token');
  }

  setToken(token: string) {
    localStorage.setItem('aura_token', token);
  }

  clearToken() {
    localStorage.removeItem('aura_token');
    localStorage.removeItem('aura_user');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = result.message || `Request failed with status ${response.status}`;
      throw new Error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    }

    // Unpack TransformInterceptor response envelope if present
    return result.data !== undefined ? result.data : result;
  }

  // Health
  getHealth() {
    return this.request<{ status: string; database: string }>('');
  }

  // Auth
  async login(email: string, password: string) {
    const res = await this.request<{ user: User; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.accessToken);
    localStorage.setItem('aura_user', JSON.stringify(res.user));
    return res;
  }

  async register(data: { email: string; password: string; firstName: string; lastName: string; role?: string; phoneNumber?: string }) {
    const res = await this.request<{ user: User; accessToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(res.accessToken);
    localStorage.setItem('aura_user', JSON.stringify(res.user));
    return res;
  }

  getMe() {
    return this.request<User>('/auth/me');
  }

  // Users
  getUsers(role?: string) {
    return this.request<User[]>(`/users${role ? `?role=${role}` : ''}`);
  }

  toggleUserStatus(id: string, isActive: boolean) {
    return this.request<User>(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  // Doctors
  getDoctors() {
    return this.request<Doctor[]>('/doctors');
  }

  // Patients
  getPatients() {
    return this.request<Patient[]>('/patients');
  }

  // Appointments
  getAppointments() {
    return this.request<Appointment[]>('/appointments');
  }

  createAppointment(data: { doctorId: string; patientId: string; appointmentDate: string; timeSlot: string; reason?: string }) {
    return this.request<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateAppointmentStatus(id: string, status: string) {
    return this.request<Appointment>(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Prescriptions
  getPrescriptions() {
    return this.request<Prescription[]>('/prescriptions');
  }

  createPrescription(data: {
    patientId: string;
    doctorId: string;
    doctorNotes?: string;
    items: { medicineName: string; dosage: string; frequency: string; durationDays: number; instructions?: string }[];
  }) {
    return this.request<Prescription>('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  dispensePrescription(id: string, pharmacistId: string, itemsDispensed: string[], notes?: string) {
    return this.request<Prescription>(`/prescriptions/${id}/dispense`, {
      method: 'PATCH',
      body: JSON.stringify({ pharmacistId, itemsDispensed, notes }),
    });
  }

  // Pharmacy
  getMedicines() {
    return this.request<Medicine[]>('/pharmacy/medicines');
  }

  getLowStock() {
    return this.request<Medicine[]>('/pharmacy/medicines/low-stock');
  }

  createMedicine(data: Omit<Medicine, 'id'>) {
    return this.request<Medicine>('/pharmacy/medicines', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateMedicineStock(id: string, quantityDelta: number) {
    return this.request<Medicine>(`/pharmacy/medicines/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ quantityDelta }),
    });
  }

  // Billing
  getBills() {
    return this.request<Bill[]>('/billing');
  }

  createBill(data: {
    patientId: string;
    appointmentId?: string;
    items: { description: string; quantity: number; unitPrice: number; total: number }[];
    subtotal: number;
    taxAmount?: number;
    discountAmount?: number;
    paymentMethod?: string;
  }) {
    return this.request<Bill>('/billing', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  recordPayment(id: string, paidAmount: number) {
    return this.request<Bill>(`/billing/${id}/pay`, {
      method: 'PATCH',
      body: JSON.stringify({ paidAmount }),
    });
  }
}

export const api = new ApiService();
