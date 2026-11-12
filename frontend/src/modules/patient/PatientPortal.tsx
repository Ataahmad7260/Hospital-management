import React, { useState, useEffect, useRef } from 'react';
import { createPortal, flushSync } from 'react-dom';
import {
  Stethoscope,
  FileText,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  CalendarPlus,
  Calendar,
  Clock,
  Search,
  FlaskConical,
  Upload,
  Eye,
  Trash2,
  Download,
  ShieldCheck,
  X,
  Paperclip,
  Info,
  Printer,
  ChevronDown,
  ChevronUp,
  Receipt,
  Pill,
  Lock,
  PackageCheck,
} from 'lucide-react';
import { ClinicalPrescriptionSheet } from './components/ClinicalPrescriptionSheet';
import { api } from '../../shared/api';
import type {
  Appointment,
  Doctor,
  Patient,
  Prescription,
  Bill,
  BillingSummaryResponse,
  MedicalReport,
} from '../../shared/types';
import { useAuth } from '../../shared/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type PatientPortalTab = 'available-doctors' | 'my-prescriptions' | 'billing-status';

const REPORT_TYPE_LABELS: Record<string, string> = {
  LAB_REPORT: 'Lab Report (CBC / Blood)',
  IMAGING_XRAY: 'Imaging / X-Ray / Scan',
  PATHOLOGY: 'Pathology / Biopsy',
  PRESCRIPTION_SCAN: 'Prior Prescription',
  DISCHARGE_SUMMARY: 'Discharge Summary',
  OTHER: 'Clinical Document',
};

const formatFileSize = (bytes: number) => {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

type BillCategoryKey = 'CONSULTATION' | 'MEDICATION' | 'LAB_TEST';

const classifyBillItem = (
  description: string,
): { key: BillCategoryKey; label: string; badgeClass: string } => {
  const lower = (description || '').toLowerCase();
  if (lower.startsWith('consultation fee') || lower.includes('consultation')) {
    return {
      key: 'CONSULTATION',
      label: 'Consultation Fee',
      badgeClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    };
  }
  if (lower.startsWith('lab test:') || lower.includes('diagnostic') || lower.includes('x-ray')) {
    return {
      key: 'LAB_TEST',
      label: 'Lab / Diagnostic',
      badgeClass: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
    };
  }
  return {
    key: 'MEDICATION',
    label: 'Medication',
    badgeClass: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
  };
};

const summarizeBillCategories = (bill: Bill) => {
  let consultation = 0;
  let medication = 0;
  let lab = 0;
  for (const item of bill.items || []) {
    const cat = classifyBillItem(item.description);
    if (cat.key === 'CONSULTATION') consultation += item.total || 0;
    else if (cat.key === 'LAB_TEST') lab += item.total || 0;
    else medication += item.total || 0;
  }
  return { consultation, medication, lab };
};

const EMPTY_BILLING_SUMMARY: BillingSummaryResponse = {
  totalBilled: 0,
  totalPaid: 0,
  remainingDue: 0,
  invoiceCount: 0,
  consultationSummary: {
    totalBilled: 0,
    totalPaid: 0,
    remainingDue: 0,
    count: 0,
    paidCount: 0,
    pendingCount: 0,
  },
  pharmacySummary: {
    totalBilled: 0,
    totalPaid: 0,
    remainingDue: 0,
    count: 0,
    paidCount: 0,
    pendingCount: 0,
  },
  consultationBills: [],
  pharmacyBills: [],
  otherBills: [],
  bills: [],
};

export const PatientPortal: React.FC<{ initialTab?: PatientPortalTab }> = ({
  initialTab = 'available-doctors',
}) => {
  const { currentUser, showToast } = useAuth();
  const [activeTab, setActiveTab] = useState<PatientPortalTab>(initialTab);

  // Live Data States
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [myProfile, setMyProfile] = useState<Patient | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [medicalReports, setMedicalReports] = useState<MedicalReport[]>([]);
  const [billingSummary, setBillingSummary] = useState<BillingSummaryResponse>(EMPTY_BILLING_SUMMARY);

  const [loading, setLoading] = useState(true);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [consultFilter, setConsultFilter] = useState<'ALL' | 'ACTIVE_FOLLOW_UP' | 'COMPLETED'>('ALL');

  // Book Consultation Modal (Stage 1: Upfront Consultation Fee Settlement)
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookingCondition, setBookingCondition] = useState('');
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [bookingTimeSlot, setBookingTimeSlot] = useState('09:30 - 10:00 AM');
  const [bookingPayUpfront, setBookingPayUpfront] = useState(true);
  const [bookingPaymentMethod, setBookingPaymentMethod] = useState<'CARD' | 'UPI' | 'ONLINE' | 'CASH'>('CARD');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Consultation-linked Prescription Viewer Modal
  const [viewingConsultRx, setViewingConsultRx] = useState<{
    appointment?: Appointment | null;
    prescriptions: Prescription[];
  } | null>(null);
  const [printSubsetIds, setPrintSubsetIds] = useState<string[] | null>(null);

  // Medical Report Upload Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTargetAppointmentId, setUploadTargetAppointmentId] = useState<string>('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadReportType, setUploadReportType] = useState('LAB_REPORT');
  const [uploadNotes, setUploadNotes] = useState('');
  const [isUploadingReport, setIsUploadingReport] = useState(false);

  // Medical Report Secure Blob Preview Modal
  const [previewReport, setPreviewReport] = useState<{
    report: MedicalReport;
    blobUrl: string;
    mimeType: string;
  } | null>(null);
  const [loadingReportId, setLoadingReportId] = useState<string | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);

  // Billing Payment Modal & Expandable Itemized Breakdown
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);
  const [isPayingModalOpen, setIsPayingModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'CARD' | 'UPI' | 'ONLINE' | 'CASH'>('CARD');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (activeTab === 'billing-status') {
      api
        .getMyBillingSummary()
        .then((summary) => {
          setBillingSummary(summary);
          setExpandedBillId((prev) => {
            if (prev && summary.bills?.some((b) => b.id === prev)) return prev;
            const firstPending = summary.bills?.find((b) => b.status !== 'PAID');
            return firstPending?.id || summary.bills?.[0]?.id || null;
          });
        })
        .catch(() => {});
    }
  }, [activeTab, currentUser?.id]);

  useEffect(() => {
    loadPatientData();
    return () => {
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
      }
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (viewingConsultRx && viewingConsultRx.prescriptions.length > 0) {
      document.body.classList.add('has-rx-print-portal');
    } else {
      document.body.classList.remove('has-rx-print-portal');
    }
    const handleAfterPrint = () => {
      setPrintSubsetIds(null);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('afterprint', handleAfterPrint);
      document.body.classList.remove('has-rx-print-portal');
    };
  }, [viewingConsultRx]);

  const handlePrintPrescriptionSheets = (rxIds?: string[]) => {
    flushSync(() => {
      setPrintSubsetIds(rxIds && rxIds.length > 0 ? rxIds : null);
    });
    window.print();
  };

  const loadPatientData = async () => {
    setLoading(true);
    try {
      const [docs, apts, profile, rxList, reports, billing] = await Promise.all([
        api.getAvailableDoctorsToday().catch(() => api.getDoctors()),
        api.getAppointments().catch(() => []),
        api.getMyPatientProfile().catch(() => null),
        api.getPrescriptions().catch(() => []),
        api.getMedicalReports().catch(() => []),
        api.getMyBillingSummary().catch(() => EMPTY_BILLING_SUMMARY),
      ]);

      setDoctors(docs);
      setAppointments(apts);
      setMyProfile(profile);
      setPrescriptions(rxList);
      setMedicalReports(reports);
      setBillingSummary(billing);
      setExpandedBillId((prev) => {
        if (prev && billing.bills?.some((b) => b.id === prev)) return prev;
        const firstPending = billing.bills?.find((b) => b.status !== 'PAID');
        return firstPending?.id || billing.bills?.[0]?.id || null;
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to load patient records', true);
    } finally {
      setLoading(false);
    }
  };

  const getLinkedPrescriptions = (apt: Appointment): Prescription[] => {
    const map = new Map<string, Prescription>();
    for (const rx of apt.prescriptions || []) {
      map.set(rx.id, rx);
    }
    for (const rx of prescriptions) {
      if (rx.appointmentId === apt.id) {
        map.set(rx.id, rx);
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  };

  const getLinkedReportsCount = (apt: Appointment): number => {
    const ids = new Set<string>();
    for (const rep of apt.medicalReports || []) {
      ids.add(rep.id);
    }
    for (const rep of medicalReports) {
      if (rep.appointmentId === apt.id) {
        ids.add(rep.id);
      }
    }
    return ids.size;
  };

  const handleOpenConsultModal = (doc: Doctor) => {
    setSelectedDoctor(doc);
    setBookingCondition('');
    setBookingDate(new Date().toISOString().split('T')[0]);
    setBookingTimeSlot('09:30 - 10:00 AM');
    setBookingPayUpfront(true);
    setBookingPaymentMethod('CARD');
    setIsConsultModalOpen(true);
  };

  const handleBookConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;
    if (!bookingCondition.trim()) {
      showToast('Please enter your condition or symptoms for consultation', true);
      return;
    }

    setIsSubmittingBooking(true);
    try {
      let patientId = myProfile?.id;
      if (!patientId) {
        const profile = await api.getMyPatientProfile().catch(() => null);
        patientId = profile?.id;
        if (profile) setMyProfile(profile);
      }

      if (!patientId) {
        showToast('Patient clinical profile not found. Please sign in again.', true);
        return;
      }

      const appointmentDateIso = new Date(`${bookingDate}T12:00:00`).toISOString();
      const createdApt = await api.createAppointment({
        doctorId: selectedDoctor.id,
        patientId,
        appointmentDate: appointmentDateIso,
        timeSlot: bookingTimeSlot,
        reason: bookingCondition.trim(),
        payUpfront: bookingPayUpfront,
        paymentMethod: bookingPaymentMethod,
      });

      const docName = selectedDoctor.user
        ? `Dr. ${[selectedDoctor.user.firstName, selectedDoctor.user.lastName].filter(Boolean).join(' ')}`
        : 'selected specialist';

      if (createdApt.status === 'CONFIRMED') {
        showToast(
          `Consultation fee ($${selectedDoctor.consultationFee.toFixed(
            2,
          )}) settled! Appointment with ${docName} is CONFIRMED.`,
        );
      } else {
        showToast(
          `Appointment booked with ${docName} as PENDING. Pay the $${selectedDoctor.consultationFee.toFixed(
            2,
          )} consultation fee to confirm.`,
        );
      }
      setIsConsultModalOpen(false);
      setSelectedDoctor(null);
      setBookingCondition('');
      loadPatientData();
    } catch (err: any) {
      showToast(err.message || 'Failed to schedule consultation', true);
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleOpenUploadModal = (appointmentId = '') => {
    setUploadTargetAppointmentId(appointmentId);
    setUploadFile(null);
    setUploadTitle('');
    setUploadReportType('LAB_REPORT');
    setUploadNotes('');
    setIsUploadModalOpen(true);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setUploadFile(file);
    if (file && !uploadTitle.trim()) {
      setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUploadMedicalReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      showToast('Please select a PDF or image report file to upload', true);
      return;
    }

    setIsUploadingReport(true);
    try {
      await api.uploadMedicalReport({
        file: uploadFile,
        title: uploadTitle.trim() || undefined,
        reportType: uploadReportType,
        appointmentId: uploadTargetAppointmentId || undefined,
        notes: uploadNotes.trim() || undefined,
      });

      showToast(
        uploadTargetAppointmentId
          ? 'Medical report uploaded and attached to your consultation'
          : 'Medical report uploaded to your patient profile',
      );
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadNotes('');
      loadPatientData();
    } catch (err: any) {
      showToast(err.message || 'Failed to upload medical report', true);
    } finally {
      setIsUploadingReport(false);
    }
  };

  const handlePreviewReport = async (report: MedicalReport) => {
    setLoadingReportId(report.id);
    try {
      const { blobUrl, mimeType } = await api.fetchMedicalReportBlobUrl(report.id);
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
      }
      activeBlobUrlRef.current = blobUrl;
      setPreviewReport({ report, blobUrl, mimeType });
    } catch (err: any) {
      showToast(err.message || 'Unable to preview report', true);
    } finally {
      setLoadingReportId(null);
    }
  };

  const handleDownloadReport = async (report: MedicalReport) => {
    setLoadingReportId(report.id);
    try {
      const { blobUrl } = await api.fetchMedicalReportBlobUrl(report.id);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = report.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
    } catch (err: any) {
      showToast(err.message || 'Unable to download report', true);
    } finally {
      setLoadingReportId(null);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      await api.deleteMedicalReport(reportId);
      showToast('Medical report removed');
      loadPatientData();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove report', true);
    }
  };

  const closePreviewModal = () => {
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }
    setPreviewReport(null);
  };

  const filteredDoctors = doctors.filter((doc) => {
    const q = doctorSearch.trim().toLowerCase();
    if (!q) return true;
    const fullName = `${doc.user?.firstName || ''} ${doc.user?.lastName || ''}`.toLowerCase();
    const spec = (doc.specialization || '').toLowerCase();
    const dept = (doc.department?.name || '').toLowerCase();
    return fullName.includes(q) || spec.includes(q) || dept.includes(q);
  });

  const filteredAppointments = appointments.filter((apt) => {
    if (consultFilter === 'ACTIVE_FOLLOW_UP') {
      return ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'REVIEW', 'FOLLOW_UP'].includes(apt.status);
    }
    if (consultFilter === 'COMPLETED') {
      return apt.status === 'COMPLETED';
    }
    return true;
  });

  const activeFollowUpCount = appointments.filter(
    (a) => a.status === 'FOLLOW_UP' || a.status === 'REVIEW',
  ).length;

  const handleOpenPayModal = (bill: Bill) => {
    setSelectedBill(bill);
    const balance = Math.max(0, bill.totalAmount - bill.paidAmount);
    setPayAmount(balance);
    setIsPayingModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;

    setIsSubmittingPayment(true);
    try {
      const updated = await api.recordPayment(selectedBill.id, Number(payAmount), payMethod);

      if (updated.status === 'PAID' && selectedBill.billType === 'CONSULTATION') {
        showToast(
          `Consultation Fee (${selectedBill.invoiceNumber}) PAID — your appointment is now CONFIRMED!`,
        );
      } else if (updated.status === 'PAID' && selectedBill.billType === 'PHARMACY') {
        showToast(
          `Pharmacy Bill (${selectedBill.invoiceNumber}) PAID — the pharmacist can now Hand Over / Dispense your medicines!`,
        );
      } else {
        showToast(`Payment of $${payAmount.toFixed(2)} recorded successfully`);
      }
      setIsPayingModalOpen(false);
      loadPatientData();
    } catch (err: any) {
      showToast(err.message || 'Payment recording failed', true);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full min-w-0 select-none font-sans">
      {/* Top Header & Patient Identity Badge */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-border pb-4 min-w-0 max-w-full">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Patient Health Portal
            </span>
            <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-400 font-mono text-[10px]">
              Patient ID: {currentUser?.firstName} {currentUser?.lastName}
            </Badge>
            {activeFollowUpCount > 0 && (
              <Badge variant="outline" className="border-sky-500/40 bg-sky-500/10 text-sky-400 font-mono text-[10px]">
                {activeFollowUpCount} Active Review / Follow-Up
              </Badge>
            )}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground mt-1">
            Personal Health Ledger
          </h1>
          <p className="text-xs text-muted-foreground">
            Consultations, Linked Prescriptions, Diagnostic Report Uploads, and Billing Summary.
          </p>
        </div>

        {/* 3 Exclusive Patient Feature Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/60 border border-border rounded-lg text-xs font-mono max-w-full min-w-0 overflow-x-auto scrollbar-hidden">
          <button
            onClick={() => setActiveTab('available-doctors')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md transition-all cursor-pointer font-medium whitespace-nowrap',
              activeTab === 'available-doctors'
                ? 'bg-foreground text-background font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Stethoscope size={13} />
            <span>Available Doctors & Visits ({appointments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('my-prescriptions')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md transition-all cursor-pointer font-medium whitespace-nowrap',
              activeTab === 'my-prescriptions'
                ? 'bg-foreground text-background font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <FileText size={13} />
            <span>My Prescriptions ({prescriptions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('billing-status')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md transition-all cursor-pointer font-medium whitespace-nowrap',
              activeTab === 'billing-status'
                ? 'bg-foreground text-background font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <CreditCard size={13} />
            <span>
              Billing & Payment Status
              {billingSummary.invoiceCount > 0 ? ` (${billingSummary.invoiceCount})` : ''}
            </span>
            {billingSummary.remainingDue > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                ${billingSummary.remainingDue.toFixed(2)} Due
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* FEATURE 1: AVAILABLE DOCTORS, CONSULTATIONS & REPORT UPLOADS   */}
      {/* ============================================================== */}
      {activeTab === 'available-doctors' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className="border-border bg-card">
            <CardHeader className="border-b border-border/60 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Stethoscope size={16} className="text-primary" />
                  <span>Doctors Available for Consultation Today</span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Select an available specialist matching your medical condition to request a consultation.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto min-w-0">
                <div className="relative flex-1 sm:flex-initial min-w-0 w-full sm:w-56">
                  <Search size={13} className="absolute left-2.5 top-2 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                    placeholder="Filter by specialty or name..."
                    className="bg-background border border-border focus:border-foreground focus:outline-none pl-8 pr-3 py-1 text-xs rounded-md text-foreground placeholder:text-muted-foreground h-8 w-full sm:w-56"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadPatientData}
                  className="gap-1 text-xs font-mono h-8 cursor-pointer shrink-0"
                >
                  <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                  <span>Refresh Schedule</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 min-w-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-w-0">
                {filteredDoctors.map((doc) => {
                  const docUser = doc.user;
                  const dept = doc.department;

                  return (
                    <div
                      key={doc.id}
                      className="border border-border/80 bg-background/60 hover:border-foreground/40 rounded-xl p-4 flex flex-col justify-between gap-3 transition-all shadow-xs min-w-0 max-w-full overflow-hidden"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-foreground text-sm">
                              Dr. {docUser?.firstName} {docUser?.lastName}
                            </h3>
                            <p className="text-xs text-muted-foreground font-medium">
                              {doc.specialization}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shrink-0">
                            Available Today
                          </Badge>
                        </div>

                        <div className="text-xs space-y-1 pt-1 border-t border-border/40 font-mono text-muted-foreground">
                          <div className="flex justify-between">
                            <span>Department:</span>
                            <span className="font-semibold text-foreground">{dept?.name || 'General Clinic'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Suite / Room:</span>
                            <span className="text-foreground">{doc.roomNumber || 'Room 101'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Consultation Fee:</span>
                            <span className="font-semibold text-foreground">${doc.consultationFee.toFixed(2)}</span>
                          </div>
                        </div>

                        {doc.qualifications && doc.qualifications.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {doc.qualifications.map((q, i) => (
                              <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                {q}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-border/40">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleOpenConsultModal(doc)}
                          className="w-full bg-foreground text-background hover:opacity-90 font-semibold text-xs gap-1.5 cursor-pointer shadow-xs"
                        >
                          <CalendarPlus size={13} />
                          <span>Choose Doctor & Consult</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {filteredDoctors.length === 0 && !loading && (
                  <div className="col-span-full py-12 text-center text-xs text-muted-foreground font-mono">
                    {doctors.length === 0
                      ? 'No attending doctors currently scheduled for today.'
                      : 'No doctors match your search filter.'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Patient's Scheduled Consultations with Linked Prescriptions, Review/Follow-up & Report Uploads */}
          <Card className="border-border bg-card">
            <CardHeader className="border-b border-border/60 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Calendar size={16} className="text-primary" />
                  <span>My Scheduled Consultations ({appointments.length})</span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Track consultation status, view linked prescriptions directly per visit, follow active doctor reviews without re-booking, and attach lab reports.
                </CardDescription>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(
                  [
                    { id: 'ALL', label: `All (${appointments.length})` },
                    {
                      id: 'ACTIVE_FOLLOW_UP',
                      label: `Active / Follow-Up (${appointments.filter((a) => !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status)).length})`,
                    },
                    {
                      id: 'COMPLETED',
                      label: `Completed (${appointments.filter((a) => a.status === 'COMPLETED').length})`,
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setConsultFilter(tab.id)}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-[11px] font-mono border transition-colors cursor-pointer',
                      consultFilter === tab.id
                        ? 'bg-foreground text-background border-foreground font-bold'
                        : 'bg-background text-muted-foreground border-border hover:text-foreground',
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead className="text-xs font-mono">Date & Time Slot</TableHead>
                    <TableHead className="text-xs font-mono">Chosen Doctor</TableHead>
                    <TableHead className="text-xs font-mono">Condition & Clinical Notes</TableHead>
                    <TableHead className="text-xs font-mono">Status</TableHead>
                    <TableHead className="text-xs font-mono text-right">Prescriptions & Reports</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((apt) => {
                    const linkedRx = getLinkedPrescriptions(apt);
                    const hasRx = linkedRx.length > 0;
                    const hasFinalizedRx = linkedRx.some((rx) => rx.isFinalized);
                    const attachedReportsCount = getLinkedReportsCount(apt);
                    const consultBill =
                      apt.consultationBill ||
                      billingSummary.consultationBills.find((b) => b.appointmentId === apt.id) ||
                      (apt.bill && apt.bill.billType === 'CONSULTATION' ? apt.bill : null) ||
                      null;
                    const consultFeePaid =
                      apt.consultationFeePaid ?? (consultBill?.status === 'PAID');
                    const aptPharmacyBills =
                      apt.pharmacyBills && apt.pharmacyBills.length > 0
                        ? apt.pharmacyBills
                        : billingSummary.pharmacyBills.filter((b) => b.appointmentId === apt.id);
                    const pendingPharmacyBill =
                      aptPharmacyBills.find((b) => b.status !== 'PAID') || null;
                    const isReview = apt.status === 'REVIEW';
                    const isFollowUp = apt.status === 'FOLLOW_UP';
                    const isCompleted = apt.status === 'COMPLETED';
                    const isPendingPayment = apt.status === 'PENDING' && !consultFeePaid;

                    let badgeLabel: string = apt.status.replace(/_/g, ' ');
                    let badgeStyle = 'border-amber-500/40 bg-amber-500/10 text-amber-400';

                    if (isCompleted) {
                      badgeLabel = hasRx ? 'COMPLETED • RX ISSUED' : 'COMPLETED';
                      badgeStyle = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400';
                    } else if (isReview) {
                      badgeLabel = 'UNDER REVIEW';
                      badgeStyle = 'border-amber-500/40 bg-amber-500/15 text-amber-300';
                    } else if (isFollowUp) {
                      badgeLabel = 'FOLLOW-UP ACTIVE';
                      badgeStyle = 'border-sky-500/40 bg-sky-500/15 text-sky-400';
                    } else if (hasRx) {
                      badgeLabel = 'PRESCRIPTION ISSUED';
                      badgeStyle = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400';
                    } else if (apt.status === 'CONFIRMED') {
                      badgeStyle = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400';
                    } else if (isPendingPayment) {
                      badgeLabel = 'PENDING PAYMENT';
                      badgeStyle = 'border-amber-500/40 bg-amber-500/15 text-amber-300';
                    } else if (apt.status === 'IN_PROGRESS') {
                      badgeStyle = 'border-sky-500/40 bg-sky-500/10 text-sky-400';
                    } else if (apt.status === 'CANCELLED' || apt.status === 'NO_SHOW') {
                      badgeStyle = 'border-rose-500/40 bg-rose-500/10 text-rose-400';
                    }

                    return (
                      <TableRow key={apt.id} className="border-border/40 hover:bg-muted/30 align-top">
                        <TableCell className="text-xs py-3.5">
                          <div className="flex items-center gap-2">
                            <Clock size={13} className="text-primary shrink-0" />
                            <div>
                              <div className="font-semibold text-foreground">{apt.timeSlot}</div>
                              <div className="font-mono text-[10px] text-muted-foreground">
                                {new Date(apt.appointmentDate).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-xs py-3.5">
                          <div className="font-semibold text-foreground">
                            {apt.doctor?.user
                              ? `Dr. ${apt.doctor.user.firstName} ${apt.doctor.user.lastName}`
                              : 'Hospital Physician'}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                            {apt.doctor?.specialization || 'General Medicine'}
                          </div>
                        </TableCell>

                        <TableCell className="text-xs text-foreground py-3.5 max-w-xs space-y-1.5">
                          <div className="font-medium">{apt.reason || 'General Consultation'}</div>
                          {apt.doctorNotes && (
                            <div className="text-[11px] text-muted-foreground bg-muted/40 px-2.5 py-1.5 rounded-md border border-border/50">
                              <span className="font-mono uppercase text-[9px] font-semibold text-foreground block">
                                Doctor Note:
                              </span>
                              {apt.doctorNotes}
                            </div>
                          )}
                          {isPendingPayment && (
                            <div className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                              <CreditCard size={11} />
                              <span>Settle consultation fee upfront to confirm this appointment</span>
                            </div>
                          )}
                          {(isReview || isFollowUp) && (
                            <div className="inline-flex items-center gap-1 text-[10px] font-mono text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded">
                              <Info size={11} />
                              <span>
                                {isFollowUp
                                  ? 'Active Follow-Up — No re-booking or fee required'
                                  : 'Awaiting test/clinical review — case stays open'}
                              </span>
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="py-3.5">
                          <div className="flex flex-col items-start gap-1">
                            <Badge variant="outline" className={cn('text-[10px] font-mono uppercase', badgeStyle)}>
                              {badgeLabel}
                            </Badge>
                            {hasRx && (
                              <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                                {hasFinalizedRx && <ShieldCheck size={10} className="text-emerald-400" />}
                                {linkedRx.map((r) => r.prescriptionNo).join(', ')}
                              </span>
                            )}
                            {attachedReportsCount > 0 && (
                              <span className="text-[10px] font-mono text-sky-400 flex items-center gap-1">
                                <Paperclip size={10} />
                                {attachedReportsCount} report{attachedReportsCount > 1 ? 's' : ''} attached
                              </span>
                            )}
                            {consultBill && (
                              <span
                                className={cn(
                                  'text-[10px] font-mono flex items-center gap-1 px-1.5 py-0.5 rounded border',
                                  consultFeePaid
                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                    : 'border-amber-500/30 bg-amber-500/10 text-amber-400',
                                )}
                              >
                                <Stethoscope size={10} />
                                Consult Fee: ${consultBill.totalAmount.toFixed(2)} •{' '}
                                {consultFeePaid ? 'PAID' : 'PENDING'}
                              </span>
                            )}
                            {aptPharmacyBills.map((pb) => (
                              <span
                                key={pb.id}
                                className={cn(
                                  'text-[10px] font-mono flex items-center gap-1 px-1.5 py-0.5 rounded border',
                                  pb.status === 'PAID'
                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                    : 'border-purple-500/30 bg-purple-500/10 text-purple-300',
                                )}
                              >
                                <Pill size={10} />
                                Pharmacy ({pb.invoiceNumber}): ${pb.totalAmount.toFixed(2)} •{' '}
                                {pb.status === 'PAID' ? 'PAID' : 'PENDING'}
                              </span>
                            ))}
                          </div>
                        </TableCell>

                        <TableCell className="text-right py-3.5">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            {!consultFeePaid && consultBill && apt.status === 'PENDING' && (
                              <Button
                                type="button"
                                size="sm"
                                variant="default"
                                onClick={() => handleOpenPayModal(consultBill)}
                                className="h-7 px-2.5 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
                              >
                                <CreditCard size={12} />
                                <span>Pay Fee to Confirm (${consultBill.totalAmount.toFixed(2)})</span>
                              </Button>
                            )}

                            {pendingPharmacyBill && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenPayModal(pendingPharmacyBill)}
                                className="h-7 px-2.5 text-xs font-semibold gap-1 cursor-pointer border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                              >
                                <Pill size={12} />
                                <span>Pay Pharmacy (${pendingPharmacyBill.totalAmount.toFixed(2)})</span>
                              </Button>
                            )}

                            {hasRx && (
                              <Button
                                type="button"
                                size="sm"
                                variant="default"
                                onClick={() => setViewingConsultRx({ appointment: apt, prescriptions: linkedRx })}
                                className="h-7 px-2.5 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
                              >
                                <FileText size={12} />
                                <span>
                                  View Prescription{linkedRx.length > 1 ? ` (${linkedRx.length})` : ''}
                                </span>
                              </Button>
                            )}

                            {(consultBill || aptPharmacyBills.length > 0) && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setExpandedBillId(
                                    pendingPharmacyBill?.id || consultBill?.id || aptPharmacyBills[0]?.id || null,
                                  );
                                  setActiveTab('billing-status');
                                }}
                                className={cn(
                                  'h-7 px-2.5 text-xs font-mono gap-1 cursor-pointer',
                                  consultFeePaid && !pendingPharmacyBill
                                    ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                                    : 'border-amber-500/40 text-amber-400 hover:bg-amber-500/10',
                                )}
                              >
                                <Receipt size={12} />
                                <span>View Bills</span>
                              </Button>
                            )}

                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenUploadModal(apt.id)}
                              className="h-7 px-2.5 text-xs font-mono gap-1 cursor-pointer"
                              title="Upload PDF or image medical report for this consultation"
                            >
                              <Upload size={12} />
                              <span>Upload Report</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {filteredAppointments.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-xs font-mono">
                        {appointments.length === 0
                          ? 'No consultations scheduled yet. Choose a doctor above as per your condition.'
                          : 'No consultations match this filter.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Patient Medical Reports & Diagnostic Uploads Section */}
          <Card className="border-border bg-card">
            <CardHeader className="border-b border-border/60 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Paperclip size={16} className="text-primary" />
                  <span>Medical Report Uploads & Lab Documents ({medicalReports.length})</span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Upload CBC results, blood sugar panels, X-Rays, or PDFs directly to a consultation or your patient profile so your doctor can review them.
                </CardDescription>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => handleOpenUploadModal('')}
                className="gap-1.5 text-xs font-semibold h-8 cursor-pointer shrink-0 shadow-xs"
              >
                <Upload size={13} />
                <span>Upload Medical Report</span>
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              {medicalReports.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {medicalReports.map((rep) => {
                    const isPdf = rep.mimeType.toLowerCase().includes('pdf');
                    return (
                      <div
                        key={rep.id}
                        className="border border-border/80 bg-background/60 rounded-xl p-3.5 flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-foreground truncate" title={rep.title}>
                              {rep.title}
                            </div>
                            <div className="text-[10px] font-mono text-muted-foreground mt-0.5 truncate">
                              {rep.fileName} • {formatFileSize(rep.fileSize)} •{' '}
                              {new Date(rep.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] font-mono shrink-0',
                              isPdf
                                ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                                : 'border-sky-500/30 bg-sky-500/10 text-sky-400',
                            )}
                          >
                            {isPdf ? 'PDF' : 'IMAGE'}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                          <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/60">
                            {REPORT_TYPE_LABELS[rep.reportType] || rep.reportType}
                          </span>
                          {rep.appointment ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Consultation:{' '}
                              {new Date(rep.appointment.appointmentDate).toLocaleDateString()} (
                              {rep.appointment.timeSlot})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                              Attached to Patient Profile
                            </span>
                          )}
                        </div>

                        {rep.notes && (
                          <p className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded border border-border/40">
                            {rep.notes}
                          </p>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={loadingReportId === rep.id}
                            onClick={() => handlePreviewReport(rep)}
                            className="h-7 px-2.5 text-xs font-mono gap-1 cursor-pointer"
                          >
                            <Eye size={12} />
                            <span>{loadingReportId === rep.id ? 'Loading...' : 'View'}</span>
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={loadingReportId === rep.id}
                            onClick={() => handleDownloadReport(rep)}
                            className="h-7 px-2.5 text-xs font-mono gap-1 cursor-pointer"
                          >
                            <Download size={12} />
                            <span>Download</span>
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteReport(rep.id)}
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive cursor-pointer"
                            title="Delete uploaded report"
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center text-xs text-muted-foreground font-mono border border-dashed border-border rounded-lg">
                  No medical reports uploaded yet. Upload a PDF or image lab report so your physician can review it.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============================================================== */}
      {/* FEATURE 2: MY PRESCRIPTIONS                                    */}
      {/* ============================================================== */}
      {activeTab === 'my-prescriptions' && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <Card className="border-border bg-card">
            <CardHeader className="border-b border-border/60 pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FileText size={16} className="text-primary" />
                  <span>My Medical Prescriptions & Regimens</span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  History of verified electronic prescriptions issued to you by attending physicians.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadPatientData}
                className="gap-1 text-xs font-mono h-8 cursor-pointer"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {prescriptions.map((rx) => {
                const docName = rx.doctor?.user
                  ? `Dr. ${rx.doctor.user.firstName} ${rx.doctor.user.lastName}`
                  : 'Attending Physician';
                const pharmacyBill =
                  rx.pharmacyBill ||
                  billingSummary.pharmacyBills.find((b) => b.prescriptionId === rx.id) ||
                  null;
                const isPharmacyPaid = pharmacyBill?.status === 'PAID';

                return (
                  <div
                    key={rx.id}
                    className="border border-border/80 bg-background/50 rounded-xl p-4 space-y-3 shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold text-foreground">
                          {rx.prescriptionNo}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] font-mono uppercase',
                            rx.status === 'DISPENSED'
                              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                              : 'border-sky-500/40 bg-sky-500/10 text-sky-400'
                          )}
                        >
                          {rx.status}
                        </Badge>
                        {rx.isFinalized && (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono uppercase border-emerald-500/40 bg-emerald-500/10 text-emerald-400 gap-1"
                          >
                            <ShieldCheck size={10} />
                            Finalized Issued
                          </Badge>
                        )}
                        {rx.status === 'DISPENSED' ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono uppercase border-emerald-500/40 bg-emerald-500/10 text-emerald-400 gap-1"
                          >
                            <PackageCheck size={10} />
                            Handed Over / Dispensed
                          </Badge>
                        ) : pharmacyBill ? (
                          isPharmacyPaid ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-mono uppercase border-emerald-500/40 bg-emerald-500/10 text-emerald-400 gap-1"
                            >
                              <CheckCircle2 size={10} />
                              Pharmacy Bill: PAID (${pharmacyBill.totalAmount.toFixed(2)})
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-mono uppercase border-amber-500/40 bg-amber-500/15 text-amber-300 gap-1"
                            >
                              <Lock size={10} />
                              Pharmacy Bill: PENDING (${pharmacyBill.totalAmount.toFixed(2)})
                            </Badge>
                          )
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-mono uppercase border-border bg-muted/40 text-muted-foreground"
                          >
                            Awaiting Pharmacist Bill
                          </Badge>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground font-mono flex items-center flex-wrap gap-2">
                        <span>
                          Issued by: <span className="font-semibold text-foreground">{docName}</span> •{' '}
                          {new Date(rx.createdAt).toLocaleDateString()}
                          {rx.appointment && (
                            <span className="ml-2 text-sky-400">
                              • Consult: {new Date(rx.appointment.appointmentDate).toLocaleDateString()} (
                              {rx.appointment.timeSlot})
                            </span>
                          )}
                        </span>
                        {pharmacyBill && !isPharmacyPaid && rx.status !== 'DISPENSED' && (
                          <Button
                            type="button"
                            size="sm"
                            variant="default"
                            onClick={() => handleOpenPayModal(pharmacyBill)}
                            className="h-6 px-2.5 text-[10px] font-mono font-semibold gap-1 cursor-pointer"
                          >
                            <CreditCard size={11} />
                            <span>Pay Pharmacy (${pharmacyBill.totalAmount.toFixed(2)})</span>
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setViewingConsultRx({
                              appointment:
                                appointments.find((a) => a.id === rx.appointmentId) || null,
                              prescriptions: [rx],
                            })
                          }
                          className="h-6 px-2 text-[10px] font-mono gap-1 cursor-pointer inline-flex align-middle"
                        >
                          <Printer size={11} />
                          <span>Formal Sheet / Print</span>
                        </Button>
                      </div>
                    </div>

                    {/* Medications Table */}
                    {rx.items && rx.items.length > 0 && (
                      <div className="w-full max-w-full min-w-0 overflow-x-auto scrollbar-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-border/40 hover:bg-transparent">
                              <TableHead className="text-xs font-mono">Medication Name</TableHead>
                              <TableHead className="text-xs font-mono">Dosage</TableHead>
                              <TableHead className="text-xs font-mono">Frequency</TableHead>
                              <TableHead className="text-xs font-mono">Duration</TableHead>
                              <TableHead className="text-xs font-mono">Special Instructions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rx.items.map((item, idx) => (
                              <TableRow key={idx} className="border-border/30 hover:bg-muted/20">
                                <TableCell className="font-semibold text-foreground text-xs">
                                  {item.medicineName}
                                </TableCell>
                                <TableCell className="font-mono text-xs">{item.dosage}</TableCell>
                                <TableCell className="text-xs">{item.frequency}</TableCell>
                                <TableCell className="font-mono text-xs">{item.durationDays} days</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {item.instructions || 'As advised'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* Ordered Lab / Diagnostic Tests */}
                    {rx.labTests && rx.labTests.length > 0 && (
                      <div className="bg-muted/25 p-3 rounded-lg border border-border/50 space-y-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-sky-400 font-semibold">
                          <FlaskConical size={12} />
                          <span>Ordered Lab & Diagnostic Tests ({rx.labTests.length})</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {rx.labTests.map((test, idx) => (
                            <div
                              key={idx}
                              className="p-2 rounded border border-border/60 bg-background/60 text-xs flex items-start justify-between gap-2"
                            >
                              <div>
                                <div className="font-semibold text-foreground">{test.testName}</div>
                                {test.instructions && (
                                  <div className="text-[11px] text-muted-foreground mt-0.5">
                                    {test.instructions}
                                  </div>
                                )}
                              </div>
                              {test.urgency && (
                                <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                                  {test.urgency}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {rx.doctorNotes && (
                      <div className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/40">
                        <span className="font-semibold text-foreground font-mono text-[10px] uppercase block">
                          Doctor Remarks:
                        </span>
                        <p className="mt-0.5">{rx.doctorNotes}</p>
                      </div>
                    )}
                  </div>
                );
              })}

              {prescriptions.length === 0 && !loading && (
                <div className="py-12 text-center text-xs text-muted-foreground font-mono">
                  No medical prescriptions found on record.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============================================================== */}
      {/* FEATURE 3: TWO-STAGE BILLING & PAYMENT STATUS                  */}
      {/* ============================================================== */}
      {activeTab === 'billing-status' && (() => {
        const renderBillPaymentBadge = (bill: Bill) => {
          const balance = Math.max(0, bill.totalAmount - bill.paidAmount);
          const isPaid = bill.status === 'PAID' || balance <= 0.005;
          if (isPaid) {
            return (
              <Badge
                variant="outline"
                className="text-[10px] font-mono uppercase border-emerald-500/40 bg-emerald-500/10 text-emerald-400 gap-1"
              >
                <CheckCircle2 size={10} />
                PAID
              </Badge>
            );
          }
          if (bill.status === 'PARTIALLY_PAID') {
            return (
              <Badge
                variant="outline"
                className="text-[10px] font-mono uppercase border-sky-500/40 bg-sky-500/10 text-sky-400 gap-1"
              >
                <Clock size={10} />
                PARTIAL
              </Badge>
            );
          }
          return (
            <Badge
              variant="outline"
              className="text-[10px] font-mono uppercase border-amber-500/40 bg-amber-500/15 text-amber-300 gap-1"
            >
              <Clock size={10} />
              PENDING
            </Badge>
          );
        };

        const renderExpandedBillRow = (bill: Bill, colSpan: number) => {
          if (expandedBillId !== bill.id) return null;
          const balance = Math.max(0, bill.totalAmount - bill.paidAmount);
          const isPaid = bill.status === 'PAID' || balance <= 0.005;
          const catTotals = summarizeBillCategories(bill);

          return (
            <TableRow className="bg-muted/20 hover:bg-muted/20 border-border/60">
              <TableCell colSpan={colSpan} className="p-4">
                <div className="border border-border/80 rounded-xl bg-background/75 overflow-hidden">
                  <div className="px-4 py-3 bg-muted/40 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Receipt size={14} className="text-primary shrink-0" />
                      <span className="text-xs font-bold text-foreground font-mono">
                        Itemized Breakdown — {bill.invoiceNumber}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono uppercase">
                        {bill.billType}
                      </Badge>
                      {bill.appointment?.reason && (
                        <span className="text-[11px] text-muted-foreground">
                          • Visit: {bill.appointment.reason}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono">
                      {catTotals.consultation > 0 && (
                        <span className="px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                          Consultation: ${catTotals.consultation.toFixed(2)}
                        </span>
                      )}
                      {catTotals.medication > 0 && (
                        <span className="px-2 py-0.5 rounded border border-purple-500/30 bg-purple-500/10 text-purple-400">
                          Medications: ${catTotals.medication.toFixed(2)}
                        </span>
                      )}
                      {catTotals.lab > 0 && (
                        <span className="px-2 py-0.5 rounded border border-sky-500/30 bg-sky-500/10 text-sky-400">
                          Lab Tests: ${catTotals.lab.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="divide-y divide-border/40">
                    {(bill.items || []).length > 0 ? (
                      bill.items.map((item, idx) => {
                        const cat = classifyBillItem(item.description);
                        return (
                          <div
                            key={idx}
                            className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <Badge
                                variant="outline"
                                className={cn('text-[10px] font-mono shrink-0 gap-1', cat.badgeClass)}
                              >
                                {cat.key === 'CONSULTATION' && <Stethoscope size={10} />}
                                {cat.key === 'MEDICATION' && <Pill size={10} />}
                                {cat.key === 'LAB_TEST' && <FlaskConical size={10} />}
                                <span>{cat.label}</span>
                              </Badge>
                              <span className="text-foreground font-medium">{item.description}</span>
                            </div>
                            <div className="flex items-center gap-4 font-mono text-[11px] shrink-0 self-end sm:self-auto">
                              <span className="text-muted-foreground">
                                Qty: <strong className="text-foreground">{item.quantity}</strong>
                              </span>
                              <span className="text-muted-foreground">
                                Rate: <strong className="text-foreground">${item.unitPrice.toFixed(2)}</strong>
                              </span>
                              <span className="text-foreground font-bold min-w-[68px] text-right">
                                ${item.total.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-4 py-4 text-xs text-muted-foreground font-mono">
                        No line items recorded on this bill.
                      </div>
                    )}
                  </div>

                  <div className="px-4 py-3 bg-muted/30 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                    <div className="flex items-center gap-4 flex-wrap text-muted-foreground">
                      <span>
                        Subtotal: <strong className="text-foreground">${bill.subtotal.toFixed(2)}</strong>
                      </span>
                      {bill.taxAmount > 0 && (
                        <span>
                          Tax: <strong className="text-foreground">${bill.taxAmount.toFixed(2)}</strong>
                        </span>
                      )}
                      {bill.discountAmount > 0 && (
                        <span>
                          Discount: <strong className="text-emerald-400">-${bill.discountAmount.toFixed(2)}</strong>
                        </span>
                      )}
                      <span>
                        Paid: <strong className="text-emerald-400">${bill.paidAmount.toFixed(2)}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div>
                        <span className="text-muted-foreground mr-1.5">Total Bill:</span>
                        <strong className="text-sm text-foreground">${bill.totalAmount.toFixed(2)}</strong>
                      </div>
                      {!isPaid && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleOpenPayModal(bill)}
                          className="h-7 px-3 text-xs font-semibold cursor-pointer"
                        >
                          Pay ${balance.toFixed(2)}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          );
        };

        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Summary KPI Cards: Stage 1 Consultation Fees vs Stage 2 Pharmacy Dues */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-mono uppercase text-muted-foreground font-semibold">
                    Consultation Fees
                  </CardTitle>
                  <Stethoscope size={16} className="text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-foreground">
                    ${billingSummary.consultationSummary.totalBilled.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {billingSummary.consultationSummary.paidCount} PAID
                    </span>
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded border',
                        billingSummary.consultationSummary.pendingCount > 0
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-muted text-muted-foreground border-border',
                      )}
                    >
                      {billingSummary.consultationSummary.pendingCount} PENDING
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-mono uppercase text-muted-foreground font-semibold">
                    Pharmacy Dues
                  </CardTitle>
                  <Pill size={16} className="text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-foreground">
                    ${billingSummary.pharmacySummary.totalBilled.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {billingSummary.pharmacySummary.paidCount} PAID
                    </span>
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded border',
                        billingSummary.pharmacySummary.pendingCount > 0
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-muted text-muted-foreground border-border',
                      )}
                    >
                      {billingSummary.pharmacySummary.pendingCount} PENDING
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-mono uppercase text-muted-foreground font-semibold">
                    Total Amount Paid
                  </CardTitle>
                  <CheckCircle2 size={16} className="text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-emerald-400">
                    ${billingSummary.totalPaid.toFixed(2)}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5">Settled across both billing stages</p>
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-xs font-mono uppercase text-muted-foreground font-semibold">
                    Remaining Unpaid Dues
                  </CardTitle>
                  <AlertCircle
                    size={16}
                    className={billingSummary.remainingDue > 0 ? 'text-amber-400' : 'text-muted-foreground'}
                  />
                </CardHeader>
                <CardContent>
                  <div
                    className={cn(
                      'text-2xl font-bold font-mono',
                      billingSummary.remainingDue > 0 ? 'text-amber-400' : 'text-foreground',
                    )}
                  >
                    ${billingSummary.remainingDue.toFixed(2)}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    {billingSummary.remainingDue > 0
                      ? `$${billingSummary.consultationSummary.remainingDue.toFixed(
                          2,
                        )} consult • $${billingSummary.pharmacySummary.remainingDue.toFixed(2)} pharmacy`
                      : 'All Consultation & Pharmacy bills settled'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* STAGE 1: CONSULTATION FEES LEDGER */}
            <Card className="border-border bg-card">
              <CardHeader className="border-b border-border/60 pb-3 flex flex-row items-center justify-between gap-3 flex-wrap">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Stethoscope size={16} className="text-emerald-400" />
                    <span>
                      Stage 1 • Consultation Fees ({billingSummary.consultationBills.length})
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] font-mono uppercase',
                        billingSummary.consultationSummary.pendingCount > 0
                          ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                          : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
                      )}
                    >
                      {billingSummary.consultationSummary.pendingCount > 0
                        ? `${billingSummary.consultationSummary.pendingCount} PENDING`
                        : 'ALL PAID'}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Upfront consultation fee invoices required to move booked appointments from PENDING to CONFIRMED.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadPatientData}
                  className="gap-1 text-xs font-mono h-8 cursor-pointer"
                >
                  <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                  <span>Refresh Bills</span>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/60 hover:bg-transparent">
                      <TableHead className="text-xs font-mono">Invoice No.</TableHead>
                      <TableHead className="text-xs font-mono">Physician & Appointment</TableHead>
                      <TableHead className="text-xs font-mono">Date</TableHead>
                      <TableHead className="text-xs font-mono">Consultation Fee</TableHead>
                      <TableHead className="text-xs font-mono">Paid</TableHead>
                      <TableHead className="text-xs font-mono">Booking Gate</TableHead>
                      <TableHead className="text-xs font-mono">Payment Status</TableHead>
                      <TableHead className="text-xs font-mono text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billingSummary.consultationBills.map((bill) => {
                      const balance = Math.max(0, bill.totalAmount - bill.paidAmount);
                      const isPaid = bill.status === 'PAID' || balance <= 0.005;
                      const isExpanded = expandedBillId === bill.id;
                      const aptDoc = bill.appointment?.doctor;
                      const docLabel = aptDoc?.user
                        ? `Dr. ${[aptDoc.user.firstName, aptDoc.user.lastName].filter(Boolean).join(' ')}`
                        : 'Hospital Physician';
                      const aptStatus = bill.appointment?.status || (isPaid ? 'CONFIRMED' : 'PENDING');

                      return (
                        <React.Fragment key={bill.id}>
                          <TableRow className="border-border/40 hover:bg-muted/30">
                            <TableCell className="font-mono text-xs font-bold text-foreground">
                              {bill.invoiceNumber}
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="font-semibold text-foreground">{docLabel}</div>
                              <div className="text-[10px] font-mono text-muted-foreground">
                                {aptDoc?.specialization || 'Consultant'}
                                {bill.appointment?.timeSlot ? ` • ${bill.appointment.timeSlot}` : ''}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {new Date(bill.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-mono text-xs font-semibold text-foreground">
                              ${bill.totalAmount.toFixed(2)}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-emerald-400">
                              ${bill.paidAmount.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-[10px] font-mono uppercase',
                                  isPaid
                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                    : 'border-amber-500/30 bg-amber-500/10 text-amber-400',
                                )}
                              >
                                {aptStatus.replace(/_/g, ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>{renderBillPaymentBadge(bill)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setExpandedBillId(isExpanded ? null : bill.id)}
                                  className="h-7 px-2.5 text-xs font-mono gap-1 cursor-pointer"
                                >
                                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                  <span>{isExpanded ? 'Hide' : 'Details'}</span>
                                </Button>
                                {!isPaid ? (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleOpenPayModal(bill)}
                                    className="text-xs font-semibold h-7 px-3 cursor-pointer shadow-xs"
                                  >
                                    Pay Fee & Confirm
                                  </Button>
                                ) : (
                                  <span className="text-[10px] font-mono text-emerald-400 font-semibold px-2 py-1">
                                    Confirmed ✓
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                          {renderExpandedBillRow(bill, 8)}
                        </React.Fragment>
                      );
                    })}

                    {billingSummary.consultationBills.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs font-mono">
                          No Consultation Fee invoices yet. Booking a doctor creates a Stage 1 Consultation Fee bill automatically.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* STAGE 2: PHARMACY DUES LEDGER */}
            <Card className="border-border bg-card">
              <CardHeader className="border-b border-border/60 pb-3 flex flex-row items-center justify-between gap-3 flex-wrap">
                <div>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Pill size={16} className="text-purple-400" />
                    <span>
                      Stage 2 • Pharmacy Dues ({billingSummary.pharmacyBills.length})
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] font-mono uppercase',
                        billingSummary.pharmacySummary.pendingCount > 0
                          ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                          : billingSummary.pharmacyBills.length > 0
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                          : 'border-border bg-muted text-muted-foreground',
                      )}
                    >
                      {billingSummary.pharmacySummary.pendingCount > 0
                        ? `${billingSummary.pharmacySummary.pendingCount} PENDING`
                        : billingSummary.pharmacyBills.length > 0
                        ? 'ALL PAID'
                        : 'NONE ISSUED'}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Medicine bills generated by the Pharmacist from live inventory. You must settle Pharmacy Dues here before the pharmacist can Hand Over / Dispense your medicines.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/60 hover:bg-transparent">
                      <TableHead className="text-xs font-mono">Invoice No.</TableHead>
                      <TableHead className="text-xs font-mono">Prescription & Doctor</TableHead>
                      <TableHead className="text-xs font-mono">Billed Date</TableHead>
                      <TableHead className="text-xs font-mono">Medicine Total</TableHead>
                      <TableHead className="text-xs font-mono">Paid</TableHead>
                      <TableHead className="text-xs font-mono">Dispensary Release</TableHead>
                      <TableHead className="text-xs font-mono">Payment Status</TableHead>
                      <TableHead className="text-xs font-mono text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billingSummary.pharmacyBills.map((bill) => {
                      const balance = Math.max(0, bill.totalAmount - bill.paidAmount);
                      const isPaid = bill.status === 'PAID' || balance <= 0.005;
                      const isExpanded = expandedBillId === bill.id;
                      const rxDoc = bill.prescription?.doctor || bill.appointment?.doctor;
                      const docLabel = rxDoc?.user
                        ? `Dr. ${[rxDoc.user.firstName, rxDoc.user.lastName].filter(Boolean).join(' ')}`
                        : 'Attending Physician';
                      const isDispensed = bill.prescription?.status === 'DISPENSED';

                      return (
                        <React.Fragment key={bill.id}>
                          <TableRow className="border-border/40 hover:bg-muted/30">
                            <TableCell className="font-mono text-xs font-bold text-foreground">
                              <div>{bill.invoiceNumber}</div>
                              <div className="text-[10px] font-normal text-muted-foreground">
                                {bill.items?.length || 0} medicine {(bill.items?.length || 0) === 1 ? 'line' : 'lines'}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="font-mono font-semibold text-foreground">
                                {bill.prescription?.prescriptionNo || 'Prescription Order'}
                              </div>
                              <div className="text-[10px] font-mono text-muted-foreground">
                                Prescribed by {docLabel}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {new Date(bill.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="font-mono text-xs font-semibold text-foreground">
                              ${bill.totalAmount.toFixed(2)}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-emerald-400">
                              ${bill.paidAmount.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              {isDispensed ? (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-mono uppercase border-emerald-500/40 bg-emerald-500/10 text-emerald-400 gap-1"
                                >
                                  <PackageCheck size={10} />
                                  Handed Over
                                </Badge>
                              ) : isPaid ? (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-mono uppercase border-sky-500/40 bg-sky-500/10 text-sky-400 gap-1"
                                >
                                  <CheckCircle2 size={10} />
                                  Ready for Handover
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-mono uppercase border-amber-500/40 bg-amber-500/10 text-amber-400 gap-1"
                                >
                                  <Lock size={10} />
                                  Locked Until Paid
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{renderBillPaymentBadge(bill)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setExpandedBillId(isExpanded ? null : bill.id)}
                                  className="h-7 px-2.5 text-xs font-mono gap-1 cursor-pointer"
                                >
                                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                  <span>{isExpanded ? 'Hide' : `Items (${bill.items?.length || 0})`}</span>
                                </Button>
                                {!isPaid ? (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleOpenPayModal(bill)}
                                    className="text-xs font-semibold h-7 px-3 cursor-pointer shadow-xs"
                                  >
                                    Pay Pharmacy Bill
                                  </Button>
                                ) : (
                                  <span className="text-[10px] font-mono text-emerald-400 font-semibold px-2 py-1">
                                    Settled ✓
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                          {renderExpandedBillRow(bill, 8)}
                        </React.Fragment>
                      );
                    })}

                    {billingSummary.pharmacyBills.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs font-mono">
                          No Pharmacy bills generated yet. Once your doctor issues a prescription, the Pharmacist will generate an itemized Medicine Bill for settlement here.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* OTHER BILLS (Shown only when legacy/miscellaneous bills exist) */}
            {(billingSummary.otherBills?.length ?? 0) > 0 && (
              <Card className="border-border bg-card">
                <CardHeader className="border-b border-border/60 pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Receipt size={16} className="text-primary" />
                    <span>Other Clinical Invoices ({billingSummary.otherBills?.length || 0})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/60 hover:bg-transparent">
                        <TableHead className="text-xs font-mono">Invoice No.</TableHead>
                        <TableHead className="text-xs font-mono">Date</TableHead>
                        <TableHead className="text-xs font-mono">Total Billed</TableHead>
                        <TableHead className="text-xs font-mono">Paid</TableHead>
                        <TableHead className="text-xs font-mono">Balance</TableHead>
                        <TableHead className="text-xs font-mono">Status</TableHead>
                        <TableHead className="text-xs font-mono text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(billingSummary.otherBills || []).map((bill) => {
                        const balance = Math.max(0, bill.totalAmount - bill.paidAmount);
                        const isPaid = bill.status === 'PAID' || balance <= 0.005;
                        const isExpanded = expandedBillId === bill.id;
                        return (
                          <React.Fragment key={bill.id}>
                            <TableRow className="border-border/40 hover:bg-muted/30">
                              <TableCell className="font-mono text-xs font-bold text-foreground">
                                {bill.invoiceNumber}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-muted-foreground">
                                {new Date(bill.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="font-mono text-xs font-semibold text-foreground">
                                ${bill.totalAmount.toFixed(2)}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-emerald-400">
                                ${bill.paidAmount.toFixed(2)}
                              </TableCell>
                              <TableCell className="font-mono text-xs font-bold text-amber-400">
                                ${balance.toFixed(2)}
                              </TableCell>
                              <TableCell>{renderBillPaymentBadge(bill)}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setExpandedBillId(isExpanded ? null : bill.id)}
                                    className="h-7 px-2.5 text-xs font-mono gap-1 cursor-pointer"
                                  >
                                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    <span>Items</span>
                                  </Button>
                                  {!isPaid && (
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => handleOpenPayModal(bill)}
                                      className="text-xs font-semibold h-7 px-3 cursor-pointer"
                                    >
                                      Settle
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                            {renderExpandedBillRow(bill, 7)}
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        );
      })()}

      {/* Consultation Linked Clinical Prescription Sheet Modal */}
      {viewingConsultRx && (() => {
        const headerDoc =
          viewingConsultRx.appointment?.doctor || viewingConsultRx.prescriptions[0]?.doctor;
        const headerDocName = headerDoc?.user
          ? `Dr. ${[headerDoc.user.firstName, headerDoc.user.lastName].filter(Boolean).join(' ').trim()}`
          : 'Attending Physician';
        const headerSpec = headerDoc?.specialization || 'Medical Consultant';
        const headerConsultDate =
          viewingConsultRx.appointment?.appointmentDate ||
          viewingConsultRx.prescriptions[0]?.appointment?.appointmentDate;
        const headerConsultSlot =
          viewingConsultRx.appointment?.timeSlot ||
          viewingConsultRx.prescriptions[0]?.appointment?.timeSlot;
        const sheetsToPrint = printSubsetIds
          ? viewingConsultRx.prescriptions.filter((r) => printSubsetIds.includes(r.id))
          : viewingConsultRx.prescriptions;

        return (
          <>
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
              <div className="border border-border bg-card rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
                {/* Modal Top Control Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 bg-card border-b border-border shrink-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-primary shrink-0" />
                      <h2 className="text-sm font-bold text-foreground">
                        Clinical Prescription Sheet
                        {viewingConsultRx.prescriptions.length > 1
                          ? `s (${viewingConsultRx.prescriptions.length})`
                          : ''}
                      </h2>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {headerDocName} ({headerSpec})
                      {headerConsultDate
                        ? ` • ${new Date(headerConsultDate).toLocaleDateString()}${
                            headerConsultSlot ? ` (${headerConsultSlot})` : ''
                          }`
                        : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      type="button"
                      size="sm"
                      variant="default"
                      onClick={() => handlePrintPrescriptionSheets()}
                      className="h-8 px-3 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Printer size={13} />
                      <span>
                        {viewingConsultRx.prescriptions.length > 1
                          ? `Print / Save All (${viewingConsultRx.prescriptions.length})`
                          : 'Print / Save PDF'}
                      </span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingConsultRx(null)}
                      className="h-8 px-2.5 text-xs cursor-pointer gap-1"
                    >
                      <X size={14} />
                      <span>Close</span>
                    </Button>
                  </div>
                </div>

                {/* Light Paper Desk Container holding Formal White Clinical Sheets */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-200/85 dark:bg-zinc-900/95 space-y-6">
                  {viewingConsultRx.prescriptions.map((rx) => (
                    <ClinicalPrescriptionSheet
                      key={rx.id}
                      prescription={rx}
                      appointment={viewingConsultRx.appointment}
                      patientProfile={myProfile}
                      onPrintSingle={() => handlePrintPrescriptionSheets([rx.id])}
                    />
                  ))}
                </div>
              </div>
            </div>

            {createPortal(
              <div className="rx-print-portal">
                {sheetsToPrint.map((rx) => (
                  <ClinicalPrescriptionSheet
                    key={rx.id}
                    prescription={rx}
                    appointment={viewingConsultRx.appointment}
                    patientProfile={myProfile}
                    isPrintMode
                  />
                ))}
              </div>,
              document.body,
            )}
          </>
        );
      })()}

      {/* Upload Medical Report Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="border border-border bg-card p-6 rounded-xl max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Upload size={15} className="text-primary" />
                  <span>Upload Medical Report (PDF / Image)</span>
                </h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Attach lab results like CBC, Blood Sugar, or X-Ray images for physician review.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsUploadModalOpen(false)}
                className="h-7 w-7 cursor-pointer"
              >
                <X size={15} />
              </Button>
            </div>

            <form onSubmit={handleUploadMedicalReport} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Report File (PDF, PNG, JPG, WEBP • Max 10MB) *
                </label>
                <input
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  required
                  onChange={handleFileInputChange}
                  className="w-full bg-background border border-border px-3 py-2 text-xs rounded-lg text-foreground file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-mono file:bg-muted file:text-foreground cursor-pointer"
                />
                {uploadFile && (
                  <p className="text-[10px] font-mono text-emerald-400">
                    Selected: {uploadFile.name} ({formatFileSize(uploadFile.size)})
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Report Title *
                </label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Complete Blood Count (CBC) Lab Result"
                  className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Report Category
                  </label>
                  <select
                    value={uploadReportType}
                    onChange={(e) => setUploadReportType(e.target.value)}
                    className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-2.5 py-2 text-xs rounded-lg text-foreground cursor-pointer"
                  >
                    <option value="LAB_REPORT">Lab Report (CBC / Blood)</option>
                    <option value="IMAGING_XRAY">Imaging / X-Ray / Scan</option>
                    <option value="PATHOLOGY">Pathology Report</option>
                    <option value="PRESCRIPTION_SCAN">Prior Prescription</option>
                    <option value="OTHER">Other Clinical Document</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Attach To
                  </label>
                  <select
                    value={uploadTargetAppointmentId}
                    onChange={(e) => setUploadTargetAppointmentId(e.target.value)}
                    className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-2.5 py-2 text-xs rounded-lg text-foreground cursor-pointer"
                  >
                    <option value="">Patient Profile (General)</option>
                    {appointments.map((apt) => (
                      <option key={apt.id} value={apt.id}>
                        {new Date(apt.appointmentDate).toLocaleDateString()} —{' '}
                        {apt.doctor?.user ? `Dr. ${apt.doctor.user.lastName}` : 'Doctor'} (
                        {apt.status.replace(/_/g, ' ')})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Notes for Physician (Optional)
                </label>
                <textarea
                  rows={2}
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="e.g. Taken after 10 hours fasting at City Diagnostic Lab..."
                  className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUploadingReport}
                  size="sm"
                  className="bg-foreground text-background font-semibold cursor-pointer shadow-xs gap-1.5"
                >
                  <Upload size={13} />
                  <span>{isUploadingReport ? 'Uploading...' : 'Upload Report'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Medical Report Secure Preview Modal */}
      {previewReport && (
        <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="border border-border bg-card p-5 rounded-xl max-w-4xl w-full space-y-3 shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2.5">
              <div>
                <h2 className="text-sm font-bold text-foreground">{previewReport.report.title}</h2>
                <p className="text-[11px] font-mono text-muted-foreground">
                  {previewReport.report.fileName} • {formatFileSize(previewReport.report.fileSize)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownloadReport(previewReport.report)}
                  className="h-7 px-2.5 text-xs font-mono gap-1 cursor-pointer"
                >
                  <Download size={12} />
                  <span>Download</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={closePreviewModal}
                  className="h-7 w-7 cursor-pointer"
                >
                  <X size={15} />
                </Button>
              </div>
            </div>

            <div className="bg-muted/20 rounded-lg border border-border/60 p-2 flex items-center justify-center min-h-[300px]">
              {previewReport.mimeType.toLowerCase().includes('pdf') ? (
                <iframe
                  src={previewReport.blobUrl}
                  title={previewReport.report.title}
                  className="w-full h-[70vh] rounded bg-white"
                />
              ) : (
                <img
                  src={previewReport.blobUrl}
                  alt={previewReport.report.title}
                  className="max-h-[70vh] max-w-full rounded object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Choose Doctor & Book Consultation Modal */}
      {isConsultModalOpen && selectedDoctor && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="border border-border bg-card p-6 rounded-xl max-w-md w-full space-y-4 shadow-xl">
            <div className="space-y-1 border-b border-border/60 pb-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Stethoscope size={15} className="text-primary" />
                  <span>
                    Consult Dr. {selectedDoctor.user?.firstName} {selectedDoctor.user?.lastName}
                  </span>
                </h2>
                <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
                  ${selectedDoctor.consultationFee.toFixed(2)} Fee
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {selectedDoctor.specialization} • {selectedDoctor.department?.name || 'General Clinic'} •{' '}
                {selectedDoctor.roomNumber || 'Room 101'}
              </p>
            </div>

            <form onSubmit={handleBookConsultation} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Your Condition / Symptoms *
                </label>
                <textarea
                  rows={3}
                  required
                  value={bookingCondition}
                  onChange={(e) => setBookingCondition(e.target.value)}
                  placeholder="Describe your symptoms or condition (e.g. chest discomfort, joint pain, persistent fever)..."
                  className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground placeholder:text-muted-foreground resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Consultation Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    Preferred Time Slot *
                  </label>
                  <select
                    value={bookingTimeSlot}
                    onChange={(e) => setBookingTimeSlot(e.target.value)}
                    className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground cursor-pointer font-mono"
                  >
                    <option value="09:00 - 09:30 AM">09:00 - 09:30 AM</option>
                    <option value="09:30 - 10:00 AM">09:30 - 10:00 AM</option>
                    <option value="10:30 - 11:00 AM">10:30 - 11:00 AM</option>
                    <option value="11:30 - 12:00 PM">11:30 - 12:00 PM</option>
                    <option value="02:00 - 02:30 PM">02:00 - 02:30 PM</option>
                    <option value="03:30 - 04:00 PM">03:30 - 04:00 PM</option>
                    <option value="04:30 - 05:00 PM">04:30 - 05:00 PM</option>
                    <option value="Priority Consultation (Today)">Priority Consultation (Today)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-border/80 bg-muted/30 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                    Stage 1 • Consultation Booking Payment
                  </span>
                  <span className="font-mono font-bold text-xs text-emerald-400">
                    ${selectedDoctor.consultationFee.toFixed(2)} Fee
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label
                    className={cn(
                      'flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors',
                      bookingPayUpfront
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'border-border bg-background/60 hover:border-foreground/30',
                    )}
                  >
                    <input
                      type="radio"
                      name="bookingPaymentStage"
                      checked={bookingPayUpfront}
                      onChange={() => setBookingPayUpfront(true)}
                      className="mt-0.5 accent-emerald-500"
                    />
                    <div>
                      <div className="font-semibold text-foreground">
                        Pay Consultation Fee Now & Confirm Immediately
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Settles ${selectedDoctor.consultationFee.toFixed(2)} upfront so status becomes{' '}
                        <span className="font-mono text-emerald-400">CONFIRMED</span> right away.
                      </p>
                    </div>
                  </label>

                  <label
                    className={cn(
                      'flex items-start gap-2.5 p-2 rounded-lg border cursor-pointer transition-colors',
                      !bookingPayUpfront
                        ? 'border-amber-500/50 bg-amber-500/10'
                        : 'border-border bg-background/60 hover:border-foreground/30',
                    )}
                  >
                    <input
                      type="radio"
                      name="bookingPaymentStage"
                      checked={!bookingPayUpfront}
                      onChange={() => setBookingPayUpfront(false)}
                      className="mt-0.5 accent-amber-500"
                    />
                    <div>
                      <div className="font-semibold text-foreground">
                        Book as PENDING — Pay Later in Billing
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Appointment stays <span className="font-mono text-amber-400">PENDING</span> until
                        the Consultation Fee is paid.
                      </p>
                    </div>
                  </label>
                </div>

                {bookingPayUpfront && (
                  <div className="pt-1 space-y-1">
                    <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      Upfront Payment Method
                    </label>
                    <select
                      value={bookingPaymentMethod}
                      onChange={(e) => setBookingPaymentMethod(e.target.value as any)}
                      className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-1.5 text-xs rounded-lg text-foreground cursor-pointer font-mono"
                    >
                      <option value="CARD">Debit / Credit Card</option>
                      <option value="UPI">UPI Digital Payment</option>
                      <option value="ONLINE">Online Banking / Portal</option>
                      <option value="CASH">Cash at Desk</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsConsultModalOpen(false);
                    setSelectedDoctor(null);
                  }}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingBooking}
                  size="sm"
                  className="bg-foreground text-background font-semibold cursor-pointer shadow-xs gap-1.5"
                >
                  <CalendarPlus size={13} />
                  <span>
                    {isSubmittingBooking
                      ? 'Booking...'
                      : bookingPayUpfront
                      ? `Pay $${selectedDoctor.consultationFee.toFixed(2)} & Confirm`
                      : 'Book as Pending (Unpaid)'}
                  </span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {isPayingModalOpen && selectedBill && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="border border-border bg-card p-6 rounded-xl max-w-md w-full space-y-4 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-foreground">
                  {selectedBill.billType === 'PHARMACY'
                    ? 'Settle Stage 2 Pharmacy Bill'
                    : selectedBill.billType === 'CONSULTATION'
                    ? 'Settle Stage 1 Consultation Fee'
                    : 'Settle Invoice Balance'}
                </h2>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] font-mono uppercase',
                    selectedBill.billType === 'PHARMACY'
                      ? 'border-purple-500/40 bg-purple-500/10 text-purple-300'
                      : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
                  )}
                >
                  {selectedBill.billType || 'BILL'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                Invoice {selectedBill.invoiceNumber} • Total Due: ${(selectedBill.totalAmount - selectedBill.paidAmount).toFixed(2)}
              </p>
              {selectedBill.billType === 'CONSULTATION' && (
                <p className="text-[11px] text-emerald-400 font-mono">
                  Paying this fee confirms your pending consultation appointment immediately.
                </p>
              )}
              {selectedBill.billType === 'PHARMACY' && (
                <p className="text-[11px] text-purple-300 font-mono">
                  Paying this bill unlocks Pharmacist medicine handover / dispensing.
                </p>
              )}
            </div>

            {selectedBill.items && selectedBill.items.length > 0 && (
              <div className="max-h-36 overflow-y-auto overflow-x-hidden border border-border/70 rounded-lg divide-y divide-border/50 bg-background/60 text-[11px] font-mono">
                {selectedBill.items.map((item, idx) => (
                  <div key={idx} className="px-2.5 py-1.5 flex items-center justify-between gap-2">
                    <span className="text-foreground truncate" title={item.description}>
                      {item.description}
                    </span>
                    <span className="text-foreground font-semibold shrink-0">
                      ${item.total.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Payment Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min={0.01}
                  max={Number((selectedBill.totalAmount - selectedBill.paidAmount).toFixed(2))}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Payment Method
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground cursor-pointer font-mono"
                >
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="UPI">UPI Digital Payment</option>
                  <option value="ONLINE">Online Banking / Portal</option>
                  <option value="CASH">Cash at Desk</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPayingModalOpen(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingPayment}
                  size="sm"
                  className="bg-foreground text-background font-semibold cursor-pointer shadow-xs"
                >
                  {isSubmittingPayment ? 'Processing...' : 'Confirm Payment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientPortal;
