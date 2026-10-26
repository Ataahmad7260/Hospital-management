// Shared Typed API Service
import type {
  User,
  Doctor,
  Patient,
  Appointment,
  AppointmentStatus,
  Prescription,
  Medicine,
  Bill,
  HealthStatus,
  Role,
} from '../types';

const API_BASE_URL = '/api/v1';

class ApiService {
  getToken(): string | null {
    return localStorage.getItem('aura_token');
  }

  setToken(token: string) {
    localStorage.setItem('aura_token', token);
  }

  clearToken() {
    localStorage.removeItem('aura_token');
    localStorage.removeItem('aura_user');
  }

  getSavedUser(): User | null {
    const raw = localStorage.getItem('aura_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
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

    return result.data !== undefined ? result.data : result;
  }

  // System Health
  getHealth(): Promise<HealthStatus> {
    return this.request<HealthStatus>('');
  }

  // Authentication
  async login(email: string, password = 'Hospital123!'): Promise<{ user: User; accessToken: string }> {
    const res = await this.request<{ user: User; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.accessToken);
    localStorage.setItem('aura_user', JSON.stringify(res.user));
    return res;
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: Role;
    phoneNumber?: string;
  }): Promise<{ user: User; accessToken: string }> {
    const res = await this.request<{ user: User; accessToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(res.accessToken);
    localStorage.setItem('aura_user', JSON.stringify(res.user));
    return res;
  }

  getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // User Management (Admin)
  getUsers(role?: Role): Promise<User[]> {
    return this.request<User[]>(`/users${role ? `?role=${role}` : ''}`);
  }

  toggleUserStatus(id: string, isActive: boolean): Promise<User> {
    return this.request<User>(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  // Doctors
  getDoctors(): Promise<Doctor[]> {
    return this.request<Doctor[]>('/doctors');
  }

  getDoctor(id: string): Promise<Doctor> {
    return this.request<Doctor>(`/doctors/${id}`);
  }

  // Patients
  getPatients(): Promise<Patient[]> {
    return this.request<Patient[]>('/patients');
  }

  getMyPatientProfile(): Promise<Patient> {
    return this.request<Patient>('/patients/me');
  }

  getPatient(id: string): Promise<Patient> {
    return this.request<Patient>(`/patients/${id}`);
  }

  // Appointments
  getAppointments(): Promise<Appointment[]> {
    return this.request<Appointment[]>('/appointments');
  }

  createAppointment(data: {
    doctorId: string;
    patientId: string;
    appointmentDate: string;
    timeSlot: string;
    reason?: string;
  }): Promise<Appointment> {
    return this.request<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    return this.request<Appointment>(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Prescriptions
  getPrescriptions(): Promise<Prescription[]> {
    return this.request<Prescription[]>('/prescriptions');
  }

  createPrescription(data: {
    doctorId: string;
    patientId: string;
    doctorNotes?: string;
    items: {
      medicineName: string;
      dosage: string;
      frequency: string;
      durationDays: number;
      instructions?: string;
    }[];
  }): Promise<Prescription> {
    return this.request<Prescription>('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  dispensePrescription(
    prescriptionId: string,
    pharmacistId: string,
    itemsDispensed: string[],
    notes?: string,
  ): Promise<Prescription> {
    return this.request<Prescription>(`/prescriptions/${prescriptionId}/dispense`, {
      method: 'PATCH',
      body: JSON.stringify({ pharmacistId, itemsDispensed, notes }),
    });
  }

  // Pharmacy & Inventory
  getMedicines(): Promise<Medicine[]> {
    return this.request<Medicine[]>('/pharmacy/medicines');
  }

  getLowStockMedicines(): Promise<Medicine[]> {
    return this.request<Medicine[]>('/pharmacy/medicines/low-stock');
  }

  createMedicine(data: Omit<Medicine, 'id'>): Promise<Medicine> {
    return this.request<Medicine>('/pharmacy/medicines', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateMedicineStock(id: string, quantityDelta: number): Promise<Medicine> {
    return this.request<Medicine>(`/pharmacy/medicines/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ quantityDelta }),
    });
  }

  // Billing & Invoicing
  getBills(): Promise<Bill[]> {
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
  }): Promise<Bill> {
    return this.request<Bill>('/billing', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  recordPayment(id: string, paidAmount: number): Promise<Bill> {
    return this.request<Bill>(`/billing/${id}/pay`, {
      method: 'PATCH',
      body: JSON.stringify({ paidAmount }),
    });
  }
}

export const api = new ApiService();
