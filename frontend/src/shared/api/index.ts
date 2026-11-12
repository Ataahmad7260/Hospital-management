// Shared Typed API Service
import type {
  User,
  Doctor,
  Patient,
  Appointment,
  AppointmentStatus,
  Prescription,
  MedicalReport,
  Medicine,
  Bill,
  BillCategory,
  PharmacyBillPreview,
  PharmacySalesLedger,
  BillingSummaryResponse,
  HealthStatus,
  Role,
  AdmitPatientPayload,
  PatientOverviewRecord,
  DailyAdmissionsStats,
  PageTrackingStats,
  CreateDoctorPayload,
  CreateMedicinePayload,
  HospitalStaff,
  HospitalStaffCategory,
  HospitalStaffStatus,
  StaffShift,
  CreateHospitalStaffPayload,
  UpdateHospitalStaffPayload,
  HospitalStaffStats,
} from '../types';

export const PRODUCTION_API_URL = 'https://hospital-management-73fq.onrender.com/api/v1';

function normalizeApiBaseUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim().replace(/\/+$/, '');
  if (!trimmed) return PRODUCTION_API_URL;
  if (trimmed === '/api/v1' || trimmed.endsWith('/api/v1')) {
    return trimmed;
  }
  if (trimmed.endsWith('/api')) {
    return `${trimmed}/v1`;
  }
  if (/^https?:\/\/[^/]+$/i.test(trimmed)) {
    return `${trimmed}/api/v1`;
  }
  return trimmed;
}

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
export const API_BASE_URL = normalizeApiBaseUrl(
  configuredApiUrl || (import.meta.env.DEV ? '/api/v1' : PRODUCTION_API_URL),
);

export const API_ORIGIN = /^https?:\/\//i.test(API_BASE_URL)
  ? new URL(API_BASE_URL).origin
  : import.meta.env.DEV
  ? 'http://localhost:4000'
  : new URL(PRODUCTION_API_URL).origin;

const TAB_LOGOUT_KEY = 'aura_tab_logged_out';

class ApiService {
  private hydrateTabSession() {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(TAB_LOGOUT_KEY) === '1') return;
    if (!sessionStorage.getItem('aura_token')) {
      const localToken = localStorage.getItem('aura_token');
      if (localToken) {
        sessionStorage.setItem('aura_token', localToken);
        const localRefresh = localStorage.getItem('aura_refresh_token');
        if (localRefresh) sessionStorage.setItem('aura_refresh_token', localRefresh);
        const localUser = localStorage.getItem('aura_user');
        if (localUser) sessionStorage.setItem('aura_user', localUser);
      }
    }
  }

  getToken(): string | null {
    this.hydrateTabSession();
    return sessionStorage.getItem('aura_token');
  }

  setToken(token: string, syncShared = true) {
    sessionStorage.removeItem(TAB_LOGOUT_KEY);
    sessionStorage.setItem('aura_token', token);
    if (syncShared) {
      localStorage.setItem('aura_token', token);
    }
  }

  getRefreshToken(): string | null {
    this.hydrateTabSession();
    return sessionStorage.getItem('aura_refresh_token');
  }

  setRefreshToken(token: string, syncShared = true) {
    sessionStorage.setItem('aura_refresh_token', token);
    if (syncShared) {
      localStorage.setItem('aura_refresh_token', token);
    }
  }

  setSavedUser(user: User, syncShared = true) {
    const serialized = JSON.stringify(user);
    sessionStorage.setItem('aura_user', serialized);
    if (syncShared) {
      localStorage.setItem('aura_user', serialized);
    }
  }

  clearToken() {
    sessionStorage.setItem(TAB_LOGOUT_KEY, '1');
    sessionStorage.removeItem('aura_token');
    sessionStorage.removeItem('aura_refresh_token');
    sessionStorage.removeItem('aura_user');
    localStorage.removeItem('aura_token');
    localStorage.removeItem('aura_refresh_token');
    localStorage.removeItem('aura_user');
  }

  getSavedUser(): User | null {
    this.hydrateTabSession();
    const raw = sessionStorage.getItem('aura_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle token expiration: attempt automatic refresh once
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/register')) {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const tokens = refreshData.data || refreshData;
            if (tokens.accessToken) {
              const tabUser = this.getSavedUser();
              let sameLocalUser = false;
              try {
                const localRaw = localStorage.getItem('aura_user');
                const localParsed = localRaw ? JSON.parse(localRaw) : null;
                sameLocalUser = !localParsed || !tabUser || localParsed.id === tabUser.id;
              } catch {
                sameLocalUser = true;
              }
              this.setToken(tokens.accessToken, sameLocalUser);
              if (tokens.refreshToken) {
                this.setRefreshToken(tokens.refreshToken, sameLocalUser);
              }
              headers['Authorization'] = `Bearer ${tokens.accessToken}`;
              response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers,
              });
            }
          } else {
            this.clearToken();
          }
        } catch {
          this.clearToken();
        }
      }
    }

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
  async login(email: string, password = 'Hospital123!'): Promise<{ user: User; accessToken: string; refreshToken?: string }> {
    const res = await this.request<{ user: User; accessToken: string; refreshToken?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.accessToken);
    if (res.refreshToken) {
      this.setRefreshToken(res.refreshToken);
    }
    this.setSavedUser(res.user);
    return res;
  }

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: Role;
    phoneNumber?: string;
    gender?: string;
    bloodGroup?: string;
    dateOfBirth?: string;
  }): Promise<{ user: User; accessToken: string; refreshToken?: string }> {
    const res = await this.request<{ user: User; accessToken: string; refreshToken?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.setToken(res.accessToken);
    if (res.refreshToken) {
      this.setRefreshToken(res.refreshToken);
    }
    this.setSavedUser(res.user);
    return res;
  }

  getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // User Management (Admin)
  getUsers(role?: Role, staffOnly = false): Promise<User[]> {
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (staffOnly) params.set('staffOnly', 'true');
    const qs = params.toString();
    return this.request<User[]>(`/users${qs ? `?${qs}` : ''}`);
  }

  getUserStats(): Promise<{ totalUsers: number; admins: number; doctors: number; patients: number; pharmacists: number }> {
    return this.request<{ totalUsers: number; admins: number; doctors: number; patients: number; pharmacists: number }>('/users/stats');
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

  getAvailableDoctorsToday(): Promise<Doctor[]> {
    return this.request<Doctor[]>('/doctors/available-today');
  }

  createDoctor(data: CreateDoctorPayload): Promise<Doctor> {
    return this.request<Doctor>('/doctors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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

  admitPatient(
    data: AdmitPatientPayload,
  ): Promise<{ message: string; admission: Appointment; consultationBill?: Bill | null }> {
    return this.request<{ message: string; admission: Appointment; consultationBill?: Bill | null }>(
      '/patients/admit',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    );
  }

  getPatientOverview(): Promise<PatientOverviewRecord[]> {
    return this.request<PatientOverviewRecord[]>('/patients/overview');
  }

  getDailyAdmissionsStats(): Promise<DailyAdmissionsStats> {
    return this.request<DailyAdmissionsStats>('/patients/admissions/daily-stats');
  }

  // Appointments
  getAppointments(): Promise<Appointment[]> {
    return this.request<Appointment[]>('/appointments');
  }

  getTodayAppointments(): Promise<Appointment[]> {
    return this.request<Appointment[]>('/appointments/today');
  }

  createAppointment(data: {
    doctorId: string;
    patientId: string;
    appointmentDate: string;
    timeSlot: string;
    reason?: string;
    payUpfront?: boolean;
    paymentMethod?: string;
  }): Promise<Appointment> {
    return this.request<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateAppointmentStatus(
    id: string,
    status: AppointmentStatus,
    doctorNotes?: string,
  ): Promise<Appointment> {
    return this.request<Appointment>(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, ...(doctorNotes !== undefined ? { doctorNotes } : {}) }),
    });
  }

  completeConsultation(
    id: string,
    doctorNotes?: string,
  ): Promise<Appointment> {
    return this.request<Appointment>(`/appointments/${id}/complete`, {
      method: 'PATCH',
      body: JSON.stringify({ ...(doctorNotes !== undefined ? { doctorNotes } : {}) }),
    });
  }

  // Medical Reports (Patient PDF / Image Uploads)
  getMedicalReports(filters?: { appointmentId?: string; patientId?: string }): Promise<MedicalReport[]> {
    const params = new URLSearchParams();
    if (filters?.appointmentId) params.set('appointmentId', filters.appointmentId);
    if (filters?.patientId) params.set('patientId', filters.patientId);
    const qs = params.toString();
    return this.request<MedicalReport[]>(`/medical-reports${qs ? `?${qs}` : ''}`);
  }

  uploadMedicalReport(payload: {
    file: File;
    title?: string;
    reportType?: string;
    appointmentId?: string;
    patientId?: string;
    notes?: string;
  }): Promise<MedicalReport> {
    const formData = new FormData();
    formData.append('file', payload.file);
    if (payload.title) formData.append('title', payload.title);
    if (payload.reportType) formData.append('reportType', payload.reportType);
    if (payload.appointmentId) formData.append('appointmentId', payload.appointmentId);
    if (payload.patientId) formData.append('patientId', payload.patientId);
    if (payload.notes) formData.append('notes', payload.notes);

    return this.request<MedicalReport>('/medical-reports/upload', {
      method: 'POST',
      body: formData,
    });
  }

  deleteMedicalReport(id: string): Promise<{ deleted: boolean; id: string }> {
    return this.request<{ deleted: boolean; id: string }>(`/medical-reports/${id}`, {
      method: 'DELETE',
    });
  }

  async fetchMedicalReportBlobUrl(id: string): Promise<{ blobUrl: string; mimeType: string }> {
    let token = this.getToken();
    const doFetch = (authToken: string | null) =>
      fetch(`${API_BASE_URL}/medical-reports/${id}/file`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });

    let response = await doFetch(token);
    if (response.status === 401) {
      const refreshToken = this.getRefreshToken();
      if (refreshToken) {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const tokens = refreshData.data || refreshData;
          if (tokens.accessToken) {
            this.setToken(tokens.accessToken);
            if (tokens.refreshToken) this.setRefreshToken(tokens.refreshToken);
            token = tokens.accessToken;
            response = await doFetch(token);
          }
        }
      }
    }

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.message || `Failed to load medical report (${response.status})`);
    }

    const blob = await response.blob();
    return {
      blobUrl: URL.createObjectURL(blob),
      mimeType: blob.type || response.headers.get('content-type') || 'application/octet-stream',
    };
  }

  // Prescriptions
  getPrescriptions(): Promise<Prescription[]> {
    return this.request<Prescription[]>('/prescriptions');
  }

  createPrescription(data: {
    doctorId?: string;
    patientId: string;
    appointmentId?: string;
    doctorNotes?: string;
    items: {
      medicineName: string;
      dosage: string;
      frequency: string;
      durationDays: number;
      instructions?: string;
    }[];
    labTests?: {
      testName: string;
      urgency?: string;
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

  createMedicine(data: CreateMedicinePayload | Omit<Medicine, 'id'>): Promise<Medicine> {
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

  getPharmacySalesLedger(): Promise<PharmacySalesLedger> {
    return this.request<PharmacySalesLedger>('/pharmacy/sales-ledger');
  }

  // Billing & Invoicing (Two-Stage Consultation & Pharmacy Flow)
  getBills(): Promise<Bill[]> {
    return this.request<Bill[]>('/billing');
  }

  getMyBillingSummary(): Promise<BillingSummaryResponse> {
    return this.request<BillingSummaryResponse>('/billing/my-summary');
  }

  previewPharmacyBill(prescriptionId: string): Promise<PharmacyBillPreview> {
    return this.request<PharmacyBillPreview>(
      `/billing/pharmacy/prescription/${prescriptionId}/preview`,
    );
  }

  generatePharmacyBill(
    prescriptionId: string,
    data?: {
      taxRate?: number;
      discountAmount?: number;
      items?: { medicineName: string; quantity?: number }[];
    },
  ): Promise<Bill> {
    return this.request<Bill>(`/billing/pharmacy/prescription/${prescriptionId}`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  createBill(data: {
    patientId: string;
    appointmentId?: string;
    prescriptionId?: string;
    billType?: BillCategory;
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

  recordPayment(id: string, paidAmount: number, paymentMethod?: string): Promise<Bill> {
    return this.request<Bill>(`/billing/${id}/pay`, {
      method: 'PATCH',
      body: JSON.stringify({ paidAmount, paymentMethod }),
    });
  }

  // Express Page Tracking & Telemetry
  recordPageHit(data: {
    pageUrl: string;
    pageTitle?: string;
    userRole?: string;
    userId?: string;
    referrer?: string;
  }): Promise<{ success: boolean; recordedAt: string; pageUrl: string }> {
    return this.request<{ success: boolean; recordedAt: string; pageUrl: string }>('/page-tracking/hit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getPageTrackingStats(): Promise<PageTrackingStats> {
    return this.request<PageTrackingStats>('/page-tracking/stats');
  }

  clearPageTrackingStats(): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/page-tracking/clear', {
      method: 'DELETE',
    });
  }

  // Hospital Staff Management (Nurses, Ward Boys, Ward Girls, Technicians & Support)
  getHospitalStaff(filters?: {
    category?: HospitalStaffCategory;
    status?: HospitalStaffStatus;
    shift?: StaffShift;
    search?: string;
  }): Promise<HospitalStaff[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.set('category', filters.category);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.shift) params.set('shift', filters.shift);
    if (filters?.search) params.set('search', filters.search);
    const qs = params.toString();
    return this.request<HospitalStaff[]>(`/staff${qs ? `?${qs}` : ''}`);
  }

  getHospitalStaffStats(): Promise<HospitalStaffStats> {
    return this.request<HospitalStaffStats>('/staff/stats');
  }

  createHospitalStaff(data: CreateHospitalStaffPayload): Promise<HospitalStaff> {
    return this.request<HospitalStaff>('/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateHospitalStaff(id: string, data: UpdateHospitalStaffPayload): Promise<HospitalStaff> {
    return this.request<HospitalStaff>(`/staff/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  updateHospitalStaffStatus(id: string, status: HospitalStaffStatus): Promise<HospitalStaff> {
    return this.request<HospitalStaff>(`/staff/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  deleteHospitalStaff(id: string): Promise<{ deleted: boolean; id: string }> {
    return this.request<{ deleted: boolean; id: string }>(`/staff/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiService();
