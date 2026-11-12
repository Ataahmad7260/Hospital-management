import React, { useState, useEffect, useRef } from 'react';
import {
  Stethoscope,
  FileText,
  Clock,
  CheckCircle2,
  Send,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Plus,
  Trash2,
  Pill,
  FlaskConical,
  Paperclip,
  Eye,
  Download,
  X,
  RotateCcw,
} from 'lucide-react';
import { api } from '../../shared/api';
import type {
  Appointment,
  AppointmentStatus,
  Prescription,
  Patient,
  MedicalReport,
} from '../../shared/types';
import { useAuth } from '../../shared/context/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface MedicationDraft {
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions: string;
}

interface LabTestDraft {
  testName: string;
  urgency: string;
  instructions: string;
}

const createEmptyMedication = (): MedicationDraft => ({
  medicineName: '',
  dosage: '',
  frequency: '',
  durationDays: 7,
  instructions: '',
});

const createEmptyLabTest = (testName = ''): LabTestDraft => ({
  testName,
  urgency: 'Routine',
  instructions: '',
});

const COMMON_LAB_TESTS = ['CBC', 'Blood Sugar', 'X-Ray', 'Lipid Profile', 'LFT', 'ECG', 'Urinalysis'];

const formatFileSize = (bytes: number) => {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const getCombinedReportsForAppointment = (
  apt: Appointment,
): Array<MedicalReport & { scopeLabel: string }> => {
  const result = new Map<string, MedicalReport & { scopeLabel: string }>();
  for (const rep of apt.medicalReports || []) {
    result.set(rep.id, { ...rep, scopeLabel: 'Consultation Attachment' });
  }
  for (const rep of apt.profileReports || []) {
    if (!result.has(rep.id)) {
      result.set(rep.id, { ...rep, scopeLabel: 'Patient Profile' });
    }
  }
  return Array.from(result.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

export const DoctorPortal: React.FC<{ initialTab?: 'today-patients' | 'prescription-writer' }> = ({
  initialTab = 'today-patients',
}) => {
  const { currentUser, showToast } = useAuth();
  const [activeTab, setActiveTab] = useState<'today-patients' | 'prescription-writer'>(initialTab);

  // Live Data States
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [queueViewMode, setQueueViewMode] = useState<'ACTIVE' | 'COMPLETED'>('ACTIVE');
  const [loading, setLoading] = useState(true);
  const [submittingRx, setSubmittingRx] = useState(false);
  const [completingAptId, setCompletingAptId] = useState<string | null>(null);

  // Dynamic Prescription Form State
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>('');
  const [patientReportsInWriter, setPatientReportsInWriter] = useState<MedicalReport[]>([]);
  const [medications, setMedications] = useState<MedicationDraft[]>([createEmptyMedication()]);
  const [labTests, setLabTests] = useState<LabTestDraft[]>([]);
  const [doctorNotes, setDoctorNotes] = useState('');

  // Review / Follow-Up Modal State
  const [statusModalApt, setStatusModalApt] = useState<Appointment | null>(null);
  const [statusModalValue, setStatusModalValue] = useState<'REVIEW' | 'FOLLOW_UP' | 'IN_PROGRESS'>('REVIEW');
  const [statusModalNotes, setStatusModalNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Uploaded Reports Modal & Secure Blob Preview State
  const [reportsModalApt, setReportsModalApt] = useState<Appointment | null>(null);
  const [previewReport, setPreviewReport] = useState<{
    report: MedicalReport;
    blobUrl: string;
    mimeType: string;
  } | null>(null);
  const [loadingReportId, setLoadingReportId] = useState<string | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    loadDoctorData();
    return () => {
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
      }
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!selectedPatientId) {
      setPatientReportsInWriter([]);
      return;
    }
    api
      .getMedicalReports({ patientId: selectedPatientId })
      .then((list) => setPatientReportsInWriter(list))
      .catch(() => setPatientReportsInWriter([]));
  }, [selectedPatientId, todayAppointments]);

  const loadDoctorData = async () => {
    setLoading(true);
    try {
      const [todayApts, rxList, patientList] = await Promise.all([
        api.getTodayAppointments().catch(() => []),
        api.getPrescriptions().catch(() => []),
        api.getPatients().catch(() => []),
      ]);
      setTodayAppointments(todayApts);
      setPrescriptions(rxList);
      setPatients(patientList);

      const firstActive = todayApts.find(
        (a) =>
          !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status) &&
          !(a.status === 'PENDING' && a.consultationFeePaid === false),
      );
      if (firstActive && !selectedPatientId) {
        setSelectedPatientId(firstActive.patientId);
        setSelectedAppointmentId(firstActive.id);
      } else if (todayApts.length > 0 && !selectedPatientId) {
        setSelectedPatientId(todayApts[0].patientId);
        setSelectedAppointmentId(todayApts[0].id);
      } else if (patientList.length > 0 && !selectedPatientId) {
        setSelectedPatientId(patientList[0].id);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load doctor clinical records', true);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStatusModal = (apt: Appointment, preset?: 'REVIEW' | 'FOLLOW_UP' | 'IN_PROGRESS') => {
    setStatusModalApt(apt);
    setStatusModalValue(
      preset ||
        (apt.status === 'FOLLOW_UP'
          ? 'FOLLOW_UP'
          : apt.status === 'REVIEW'
          ? 'REVIEW'
          : 'REVIEW'),
    );
    setStatusModalNotes(
      apt.doctorNotes ||
        (preset === 'FOLLOW_UP'
          ? 'Follow-up scheduled. Patient does not need to re-book or pay again.'
          : 'Awaiting lab test results for physician review.'),
    );
  };

  const handleSubmitStatusModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalApt) return;
    setUpdatingStatus(true);
    try {
      await api.updateAppointmentStatus(
        statusModalApt.id,
        statusModalValue as AppointmentStatus,
        statusModalNotes.trim() || undefined,
      );
      showToast(
        statusModalValue === 'REVIEW'
          ? 'Consultation moved to Under Review (stays active for patient)'
          : statusModalValue === 'FOLLOW_UP'
          ? 'Consultation marked as Follow-Up Active (no re-booking needed)'
          : `Consultation status updated to ${statusModalValue}`,
      );
      setStatusModalApt(null);
      loadDoctorData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update consultation status', true);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleCompleteConsultation = async (apt: Appointment) => {
    setCompletingAptId(apt.id);
    try {
      await api.completeConsultation(apt.id);
      showToast(
        'Consultation completed, removed from live queue, and prescriptions finalized as Issued (routed to Pharmacist Portal)',
      );
      if (selectedAppointmentId === apt.id) {
        setSelectedAppointmentId('');
      }
      loadDoctorData();
    } catch (err: any) {
      showToast(err.message || 'Failed to complete consultation', true);
    } finally {
      setCompletingAptId(null);
    }
  };

  const handleSelectPatientForRx = (patientId: string, appointmentId?: string) => {
    setSelectedPatientId(patientId);
    if (appointmentId) {
      setSelectedAppointmentId(appointmentId);
    } else {
      const matchingActive = todayAppointments.find(
        (a) =>
          a.patientId === patientId &&
          !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status),
      );
      setSelectedAppointmentId(matchingActive?.id || '');
    }
    setActiveTab('prescription-writer');
    showToast('Consultation & patient loaded into Prescription Writer');
  };

  const handleWriterPatientChange = (newPatientId: string) => {
    setSelectedPatientId(newPatientId);
    const matchingActive =
      todayAppointments.find(
        (a) =>
          a.patientId === newPatientId &&
          !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status) &&
          !(a.status === 'PENDING' && a.consultationFeePaid === false),
      ) ||
      todayAppointments.find(
        (a) =>
          a.patientId === newPatientId &&
          !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status),
      );
    setSelectedAppointmentId(matchingActive?.id || '');
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
      showToast(err.message || 'Unable to load medical report preview', true);
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
      showToast(err.message || 'Unable to download medical report', true);
    } finally {
      setLoadingReportId(null);
    }
  };

  const closePreviewModal = () => {
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }
    setPreviewReport(null);
  };

  const handleMedicationChange = <K extends keyof MedicationDraft>(
    index: number,
    field: K,
    value: MedicationDraft[K],
  ) => {
    setMedications((prev) =>
      prev.map((med, i) => (i === index ? { ...med, [field]: value } : med)),
    );
  };

  const handleAddMedication = () => {
    setMedications((prev) => [...prev, createEmptyMedication()]);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications((prev) => {
      if (prev.length === 1 && labTests.length === 0) {
        return prev;
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleLabTestChange = <K extends keyof LabTestDraft>(
    index: number,
    field: K,
    value: LabTestDraft[K],
  ) => {
    setLabTests((prev) =>
      prev.map((test, i) => (i === index ? { ...test, [field]: value } : test)),
    );
  };

  const handleAddLabTest = (presetName = '') => {
    setLabTests((prev) => {
      if (
        presetName &&
        prev.some((t) => t.testName.trim().toLowerCase() === presetName.toLowerCase())
      ) {
        return prev;
      }
      return [...prev, createEmptyLabTest(presetName)];
    });
  };

  const handleRemoveLabTest = (index: number) => {
    setLabTests((prev) => prev.filter((_, i) => i !== index));
  };

  const handleIssuePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      showToast('Please select a patient to issue the prescription to', true);
      return;
    }

    const preparedItems = medications
      .filter(
        (m) =>
          m.medicineName.trim() ||
          m.dosage.trim() ||
          m.frequency.trim() ||
          m.instructions.trim(),
      )
      .map((m) => ({
        medicineName: m.medicineName.trim(),
        dosage: m.dosage.trim(),
        frequency: m.frequency.trim(),
        durationDays: Number(m.durationDays) || 1,
        instructions: m.instructions.trim() || undefined,
      }));

    const incompleteMedIndex = preparedItems.findIndex(
      (m) => !m.medicineName || !m.dosage || !m.frequency || m.durationDays < 1,
    );
    if (incompleteMedIndex !== -1) {
      showToast(
        `Please complete medicine name, dosage, frequency, and duration for Medication #${incompleteMedIndex + 1}`,
        true,
      );
      return;
    }

    const preparedLabTests = labTests
      .filter((t) => t.testName.trim() || t.instructions.trim())
      .map((t) => ({
        testName: t.testName.trim(),
        urgency: t.urgency || 'Routine',
        instructions: t.instructions.trim() || undefined,
      }));

    const incompleteTestIndex = preparedLabTests.findIndex((t) => !t.testName);
    if (incompleteTestIndex !== -1) {
      showToast(`Please enter a test name for Lab Test #${incompleteTestIndex + 1}`, true);
      return;
    }

    if (preparedItems.length === 0 && preparedLabTests.length === 0) {
      showToast('Please add at least one medication or lab/diagnostic test order', true);
      return;
    }

    setSubmittingRx(true);
    try {
      await api.createPrescription({
        patientId: selectedPatientId,
        appointmentId: selectedAppointmentId || undefined,
        doctorNotes: doctorNotes.trim() || undefined,
        items: preparedItems,
        labTests: preparedLabTests,
      });

      showToast(
        'Digital prescription signed, issued, and routed to Pharmacist Portal for medicine billing',
      );
      loadDoctorData();
      setMedications([createEmptyMedication()]);
      setLabTests([]);
      setDoctorNotes('');
    } catch (err: any) {
      showToast(err.message || 'Failed to issue prescription', true);
    } finally {
      setSubmittingRx(false);
    }
  };

  // Queue partitioning & Metrics
  const liveQueue = todayAppointments.filter(
    (a) => !['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(a.status),
  );
  const completedQueue = todayAppointments.filter((a) => a.status === 'COMPLETED');
  const displayedQueue = queueViewMode === 'ACTIVE' ? liveQueue : completedQueue;

  const reviewOrFollowUpCount = liveQueue.filter(
    (a) => a.status === 'REVIEW' || a.status === 'FOLLOW_UP',
  ).length;
  const activeExamCount = liveQueue.filter(
    (a) => a.status === 'PENDING' || a.status === 'IN_PROGRESS' || a.status === 'CONFIRMED',
  ).length;

  const patientConsultOptions = todayAppointments.filter(
    (a) => a.patientId === selectedPatientId && !['CANCELLED', 'NO_SHOW'].includes(a.status),
  );
  const selectedAppointmentObj = selectedAppointmentId
    ? todayAppointments.find((a) => a.id === selectedAppointmentId) || null
    : null;
  const isSelectedAptUnpaidPending = Boolean(
    selectedAppointmentObj &&
      selectedAppointmentObj.status === 'PENDING' &&
      selectedAppointmentObj.consultationFeePaid === false,
  );

  return (
    <div className="space-y-6 w-full max-w-full min-w-0 select-none">
      {/* Top Header & Role Clearance Badge */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-4 min-w-0 max-w-full">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
              Clinical Workspace
            </span>
            <Badge variant="outline" className="border-sky-500/30 bg-sky-500/10 text-sky-400 font-mono text-[10px]">
              Attending Physician: Dr. {currentUser?.lastName || 'Consultant'}
            </Badge>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground mt-1">
            Doctor Clinical Desk
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage Live Consultation Queue, Review/Follow-Up Cases, Patient Lab Reports, and Digital Prescriptions.
          </p>
        </div>

        {/* 2 Exclusive Doctor Tab Selectors */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-muted/60 border border-border rounded-lg text-xs font-mono max-w-full min-w-0 overflow-x-auto scrollbar-hidden">
          <button
            onClick={() => setActiveTab('today-patients')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md transition-all cursor-pointer font-medium whitespace-nowrap',
              activeTab === 'today-patients'
                ? 'bg-foreground text-background font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Stethoscope size={13} />
            <span>Live Consultation Queue ({liveQueue.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('prescription-writer')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md transition-all cursor-pointer font-medium whitespace-nowrap',
              activeTab === 'prescription-writer'
                ? 'bg-foreground text-background font-bold shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <FileText size={13} />
            <span>Prescription Writer Interface</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: LIVE CONSULTATION QUEUE                                 */}
      {/* ============================================================== */}
      {activeTab === 'today-patients' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Real-time KPI Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-mono uppercase text-muted-foreground font-semibold">
                  Active Live Queue
                </CardTitle>
                <Clock size={16} className="text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono text-foreground">{liveQueue.length}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Patients in active care</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-mono uppercase text-muted-foreground font-semibold">
                  Pending / In Consult
                </CardTitle>
                <Stethoscope size={16} className="text-sky-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono text-sky-400">{activeExamCount}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Awaiting initial assessment or Rx</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-mono uppercase text-muted-foreground font-semibold">
                  Review / Follow-Up
                </CardTitle>
                <AlertCircle size={16} className="text-amber-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono text-amber-400">{reviewOrFollowUpCount}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Open for lab results / return visit</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-mono uppercase text-muted-foreground font-semibold">
                  Completed Consults
                </CardTitle>
                <CheckCircle2 size={16} className="text-emerald-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono text-emerald-400">{completedQueue.length}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Closed & finalized cases</p>
              </CardContent>
            </Card>
          </div>

          {/* Consultation Queue Table */}
          <Card className="border-border bg-card">
            <CardHeader className="border-b border-border/60 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Stethoscope size={16} className="text-primary" />
                  <span>
                    {queueViewMode === 'ACTIVE'
                      ? 'Real-Time Active Consultation Queue'
                      : 'Completed & Closed Consultation Cases'}
                  </span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {queueViewMode === 'ACTIVE'
                    ? 'Inspect uploaded patient reports, set Review/Follow-Up status, issue prescriptions, or complete consultation to close.'
                    : 'Concluded consultations removed from the live queue with finalized issued prescriptions.'}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 p-0.5 rounded-md border border-border bg-muted/40">
                  <button
                    type="button"
                    onClick={() => setQueueViewMode('ACTIVE')}
                    className={cn(
                      'px-2.5 py-1 rounded text-[11px] font-mono cursor-pointer transition-colors',
                      queueViewMode === 'ACTIVE'
                        ? 'bg-foreground text-background font-bold'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    Live Queue ({liveQueue.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueueViewMode('COMPLETED')}
                    className={cn(
                      'px-2.5 py-1 rounded text-[11px] font-mono cursor-pointer transition-colors',
                      queueViewMode === 'COMPLETED'
                        ? 'bg-foreground text-background font-bold'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    Completed ({completedQueue.length})
                  </button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadDoctorData}
                  className="gap-1 text-xs font-mono h-8 cursor-pointer"
                >
                  <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead className="text-xs font-mono">Time Slot</TableHead>
                    <TableHead className="text-xs font-mono">Patient Name & Demographics</TableHead>
                    <TableHead className="text-xs font-mono">Clinical Reason & Reports</TableHead>
                    <TableHead className="text-xs font-mono">Status & Linked Rx</TableHead>
                    <TableHead className="text-xs font-mono text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedQueue.map((apt) => {
                    const patientUser = apt.patient?.user;
                    const isCompleted = apt.status === 'COMPLETED';
                    const isUnpaidPending =
                      apt.status === 'PENDING' && apt.consultationFeePaid === false;
                    const combinedReports = getCombinedReportsForAppointment(apt);
                    const linkedRx = apt.prescriptions || [];

                    return (
                      <TableRow key={apt.id} className="border-border/40 hover:bg-muted/30 transition-colors align-top">
                        <TableCell className="font-mono text-xs py-3.5">
                          <div className="font-semibold text-foreground">{apt.timeSlot}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {new Date(apt.appointmentDate).toLocaleDateString()}
                          </div>
                        </TableCell>

                        <TableCell className="py-3.5">
                          <div className="font-semibold text-foreground text-xs">
                            {patientUser ? `${patientUser.firstName} ${patientUser.lastName}` : 'Walk-in Patient'}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono mt-0.5 flex-wrap">
                            <span>Gender: {apt.patient?.gender || 'N/A'}</span>
                            <span>•</span>
                            <span>Blood: {apt.patient?.bloodGroup?.replace('_', '+') || 'N/A'}</span>
                            {patientUser?.phoneNumber && (
                              <>
                                <span>•</span>
                                <span>{patientUser.phoneNumber}</span>
                              </>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-xs text-foreground/90 max-w-xs py-3.5 space-y-1.5">
                          <p className="font-medium" title={apt.reason}>
                            {apt.reason || 'General clinical consultation'}
                          </p>
                          {apt.doctorNotes && (
                            <p className="text-[11px] text-muted-foreground bg-muted/40 px-2 py-1 rounded border border-border/50">
                              {apt.doctorNotes}
                            </p>
                          )}
                          {isUnpaidPending && (
                            <div className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-300">
                              <AlertCircle size={10} />
                              <span>Awaiting patient Consultation Booking Payment</span>
                            </div>
                          )}
                          {combinedReports.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setReportsModalApt(apt)}
                              className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border border-sky-500/40 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 cursor-pointer transition-colors"
                            >
                              <Paperclip size={10} />
                              <span>
                                {combinedReports.length} Uploaded Report
                                {combinedReports.length > 1 ? 's' : ''} — View
                              </span>
                            </button>
                          )}
                        </TableCell>

                        <TableCell className="py-3.5">
                          <div className="flex flex-col items-start gap-1">
                            <Badge
                              variant="outline"
                              className={cn(
                                'font-mono text-[10px] uppercase',
                                apt.status === 'IN_PROGRESS' && 'border-sky-500/40 bg-sky-500/10 text-sky-400',
                                apt.status === 'REVIEW' && 'border-amber-500/40 bg-amber-500/15 text-amber-300',
                                apt.status === 'FOLLOW_UP' && 'border-sky-500/40 bg-sky-500/15 text-sky-300',
                                apt.status === 'COMPLETED' && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
                                apt.status === 'CONFIRMED' && 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400',
                                apt.status === 'PENDING' && 'border-amber-500/40 bg-amber-500/10 text-amber-400',
                              )}
                            >
                              {apt.status.replace(/_/g, ' ')}
                            </Badge>
                            {typeof apt.consultationFeePaid === 'boolean' && (
                              <span
                                className={cn(
                                  'text-[10px] font-mono',
                                  apt.consultationFeePaid ? 'text-emerald-400' : 'text-amber-400',
                                )}
                              >
                                {apt.consultationFeePaid
                                  ? 'Booking Fee: Settled'
                                  : 'Booking Fee: Unpaid'}
                              </span>
                            )}
                            {linkedRx.length > 0 && (
                              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                                <ShieldCheck size={10} />
                                {linkedRx.map((r) => r.prescriptionNo).join(', ')}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-right py-3.5">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setReportsModalApt(apt)}
                              className="gap-1 text-xs font-mono h-7 px-2 cursor-pointer"
                              title="View uploaded patient lab/imaging reports"
                            >
                              <Paperclip size={11} />
                              <span>Reports ({combinedReports.length})</span>
                            </Button>

                            {!isCompleted && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  disabled={isUnpaidPending}
                                  onClick={() => handleSelectPatientForRx(apt.patientId, apt.id)}
                                  className="gap-1 text-xs font-semibold h-7 px-2.5 cursor-pointer shadow-xs"
                                  title={
                                    isUnpaidPending
                                      ? 'Locked: Patient must pay Consultation Fee first to confirm booking'
                                      : 'Write prescription for this consultation'
                                  }
                                >
                                  <FileText size={12} />
                                  <span>Write Prescription</span>
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isUnpaidPending}
                                  onClick={() => handleOpenStatusModal(apt)}
                                  className="gap-1 text-xs font-mono h-7 px-2 border-amber-500/40 text-amber-400 hover:bg-amber-500/10 cursor-pointer"
                                  title={
                                    isUnpaidPending
                                      ? 'Locked: Awaiting upfront Consultation Booking Payment'
                                      : 'Set Review or Follow-Up status instead of closing'
                                  }
                                >
                                  <RotateCcw size={11} />
                                  <span>Review / Follow-Up</span>
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isUnpaidPending || completingAptId === apt.id}
                                  onClick={() => handleCompleteConsultation(apt)}
                                  className="gap-1 text-xs font-mono h-7 px-2.5 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/15 cursor-pointer"
                                  title={
                                    isUnpaidPending
                                      ? 'Locked: Awaiting upfront Consultation Booking Payment'
                                      : 'Complete consultation, remove from live queue, and lock Rx as Issued'
                                  }
                                >
                                  <CheckCircle2 size={12} />
                                  <span>
                                    {completingAptId === apt.id ? 'Closing...' : 'Complete Consultation'}
                                  </span>
                                </Button>
                              </>
                            )}

                            {isCompleted && (
                              <span className="text-[10px] font-mono text-emerald-400 font-semibold px-2 py-1 inline-flex items-center gap-1">
                                <ShieldCheck size={12} />
                                Case Closed • Rx Issued
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {displayedQueue.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-xs font-mono">
                        {queueViewMode === 'ACTIVE'
                          ? 'No active consultations currently in the live queue.'
                          : 'No completed consultations recorded yet.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: PRESCRIPTION WRITER INTERFACE                           */}
      {/* ============================================================== */}
      {activeTab === 'prescription-writer' && (
        <div className="space-y-6 animate-in fade-in duration-300 min-w-0 w-full max-w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
            {/* Form Column (7 cols) */}
            <div className="lg:col-span-7 space-y-4 min-w-0">
              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="border-b border-border/60 pb-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <FileText size={16} className="text-primary" />
                        <span>Digital Prescription Writer</span>
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground">
                        Link directly to an active consultation, review uploaded lab reports, and issue multi-medicine & diagnostic orders.
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedAppointmentId && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isSelectedAptUnpaidPending || completingAptId === selectedAppointmentId}
                          title={
                            isSelectedAptUnpaidPending
                              ? 'Blocked: Patient must pay Consultation Fee first to confirm booking'
                              : 'Close & Complete this consultation'
                          }
                          onClick={() => {
                            if (selectedAppointmentObj) handleCompleteConsultation(selectedAppointmentObj);
                          }}
                          className="h-7 px-2.5 text-xs font-mono border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/15 gap-1 cursor-pointer"
                        >
                          <CheckCircle2 size={12} />
                          <span>Close & Complete Case</span>
                        </Button>
                      )}
                      <Badge variant="outline" className="border-foreground/30 bg-muted text-[10px] font-mono">
                        Rx Generator v2.0
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <form onSubmit={handleIssuePrescription} className="space-y-4">
                    {/* Patient & Linked Consultation Selectors */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                          Select Registered Patient *
                        </label>
                        <select
                          required
                          value={selectedPatientId}
                          onChange={(e) => handleWriterPatientChange(e.target.value)}
                          className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors cursor-pointer"
                        >
                          <option value="">-- Choose Patient --</option>
                          {patients.map((p) => {
                            const name = p.user
                              ? `${p.user.firstName} ${p.user.lastName}`
                              : `Patient #${p.id.slice(-4)}`;
                            const isQueuedToday = liveQueue.some((a) => a.patientId === p.id);
                            return (
                              <option key={p.id} value={p.id}>
                                {name} ({p.gender || 'Patient'} • Blood: {p.bloodGroup || 'N/A'})
                                {isQueuedToday ? ' [Active Queue]' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                          Link Consultation Record
                        </label>
                        <select
                          value={selectedAppointmentId}
                          onChange={(e) => setSelectedAppointmentId(e.target.value)}
                          className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors cursor-pointer"
                        >
                          <option value="">Auto-link Active Consultation</option>
                          {patientConsultOptions.map((apt) => (
                            <option key={apt.id} value={apt.id}>
                              {new Date(apt.appointmentDate).toLocaleDateString()} • {apt.timeSlot} [
                              {apt.status.replace(/_/g, ' ')}
                              {apt.status === 'PENDING' && apt.consultationFeePaid === false
                                ? ' — FEE UNPAID'
                                : ''}
                              ]
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {isSelectedAptUnpaidPending && (
                      <div className="p-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs font-mono flex items-center gap-2">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>
                          Prescription locked: patient must settle the Consultation Booking Fee before the visit is confirmed.
                        </span>
                      </div>
                    )}

                    {/* Uploaded Medical Reports for Selected Patient / Consultation */}
                    <div className="border border-border/80 bg-muted/20 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-sky-400 font-semibold">
                          <Paperclip size={12} />
                          <span>
                            Patient Uploaded Medical Reports ({patientReportsInWriter.length})
                          </span>
                        </div>
                        {patientReportsInWriter.length > 0 && (
                          <span className="text-[10px] font-mono text-muted-foreground">
                            Review before prescribing
                          </span>
                        )}
                      </div>

                      {patientReportsInWriter.length > 0 ? (
                        <div className="space-y-1.5">
                          {patientReportsInWriter.map((rep) => (
                            <div
                              key={rep.id}
                              className="flex items-center justify-between gap-2 p-2 rounded bg-background/70 border border-border/60 text-xs"
                            >
                              <div className="min-w-0">
                                <div className="font-semibold text-foreground truncate">
                                  {rep.title}
                                </div>
                                <div className="text-[10px] font-mono text-muted-foreground truncate">
                                  {rep.reportType} • {rep.fileName} ({formatFileSize(rep.fileSize)})
                                  {rep.appointmentId ? ' • Attached to Consult' : ' • Profile Record'}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={loadingReportId === rep.id}
                                  onClick={() => handlePreviewReport(rep)}
                                  className="h-6 px-2 text-[10px] font-mono gap-1 cursor-pointer"
                                >
                                  <Eye size={11} />
                                  <span>{loadingReportId === rep.id ? '...' : 'View'}</span>
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  disabled={loadingReportId === rep.id}
                                  onClick={() => handleDownloadReport(rep)}
                                  className="h-6 px-1.5 text-[10px] cursor-pointer"
                                  title="Download file"
                                >
                                  <Download size={11} />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] font-mono text-muted-foreground">
                          No PDF or image medical reports uploaded by this patient yet.
                        </div>
                      )}
                    </div>

                    {/* Dynamic Medications Section */}
                    <div className="space-y-3 pt-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                          <Pill size={13} className="text-primary" />
                          <span>Prescribed Medications ({medications.length})</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddMedication}
                          className="h-7 px-2.5 text-xs font-mono gap-1 cursor-pointer"
                        >
                          <Plus size={12} />
                          <span>Add Another Medicine</span>
                        </Button>
                      </div>

                      {medications.length === 0 ? (
                        <div className="border border-dashed border-border rounded-lg p-3 text-center text-xs text-muted-foreground font-mono">
                          No medications added. Click "Add Another Medicine" if medication is required.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {medications.map((med, idx) => (
                            <div
                              key={idx}
                              className="border border-border/80 bg-muted/20 rounded-lg p-3.5 space-y-3"
                            >
                              <div className="flex items-center justify-between border-b border-border/50 pb-2">
                                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-foreground">
                                  Medicine #{idx + 1}
                                </span>
                                {(medications.length > 1 || labTests.length > 0) && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMedication(idx)}
                                    className="text-[11px] font-mono text-muted-foreground hover:text-destructive flex items-center gap-1 cursor-pointer transition-colors"
                                    title={`Remove Medicine #${idx + 1}`}
                                  >
                                    <Trash2 size={12} />
                                    <span>Remove</span>
                                  </button>
                                )}
                              </div>

                              {/* Medication Name & Dosage */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                                    Medicine Brand or Generic Name *
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    value={med.medicineName}
                                    onChange={(e) =>
                                      handleMedicationChange(idx, 'medicineName', e.target.value)
                                    }
                                    placeholder="e.g. Amoxicillin 500mg, Paracetamol"
                                    className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                                    Dosage Specification *
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    value={med.dosage}
                                    onChange={(e) =>
                                      handleMedicationChange(idx, 'dosage', e.target.value)
                                    }
                                    placeholder="e.g. 500mg, 10ml, 1 tab"
                                    className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors"
                                  />
                                </div>
                              </div>

                              {/* Frequency & Duration */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                                    Frequency Regimen *
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    value={med.frequency}
                                    onChange={(e) =>
                                      handleMedicationChange(idx, 'frequency', e.target.value)
                                    }
                                    placeholder="e.g. 1-0-1 (twice daily after meals)"
                                    className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                                    Duration (Days) *
                                  </label>
                                  <input
                                    type="number"
                                    required
                                    min={1}
                                    max={365}
                                    value={med.durationDays}
                                    onChange={(e) =>
                                      handleMedicationChange(idx, 'durationDays', Number(e.target.value))
                                    }
                                    className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors"
                                  />
                                </div>
                              </div>

                              {/* Instructions */}
                              <div className="space-y-1">
                                <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                                  Pharmacy Dispensation & Intake Instructions
                                </label>
                                <input
                                  type="text"
                                  value={med.instructions}
                                  onChange={(e) =>
                                    handleMedicationChange(idx, 'instructions', e.target.value)
                                  }
                                  placeholder="e.g. Take with warm water after meals, avoid dairy"
                                  className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Dynamic Lab / Diagnostic Tests Section */}
                    <div className="space-y-3 pt-2 border-t border-border/60">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                          <FlaskConical size={13} className="text-sky-400" />
                          <span>Lab / Diagnostic Tests ({labTests.length})</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddLabTest('')}
                          className="h-7 px-2.5 text-xs font-mono gap-1 cursor-pointer"
                        >
                          <Plus size={12} />
                          <span>{labTests.length > 0 ? 'Add Another Test' : 'Add Lab Test'}</span>
                        </Button>
                      </div>

                      {/* Quick-add Diagnostic Presets */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-mono text-muted-foreground mr-1">
                          Quick Add:
                        </span>
                        {COMMON_LAB_TESTS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => handleAddLabTest(preset)}
                            className="text-[10px] font-mono px-2 py-0.5 rounded border border-border bg-muted/40 hover:bg-muted hover:border-foreground/50 text-foreground transition-colors cursor-pointer"
                          >
                            + {preset}
                          </button>
                        ))}
                      </div>

                      {labTests.length > 0 && (
                        <div className="space-y-2.5">
                          {labTests.map((test, idx) => (
                            <div
                              key={idx}
                              className="border border-border/80 bg-muted/20 rounded-lg p-3 space-y-2.5"
                            >
                              <div className="flex items-center justify-between border-b border-border/50 pb-1.5">
                                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-foreground">
                                  Diagnostic Order #{idx + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveLabTest(idx)}
                                  className="text-[11px] font-mono text-muted-foreground hover:text-destructive flex items-center gap-1 cursor-pointer transition-colors"
                                  title={`Remove Lab Test #${idx + 1}`}
                                >
                                  <Trash2 size={12} />
                                  <span>Remove</span>
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                <div className="sm:col-span-2 space-y-1">
                                  <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                                    Lab / Diagnostic Test Name *
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    value={test.testName}
                                    onChange={(e) =>
                                      handleLabTestChange(idx, 'testName', e.target.value)
                                    }
                                    placeholder="e.g. CBC, Fasting Blood Sugar, Chest X-Ray"
                                    className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-1.5 text-xs rounded-lg text-foreground transition-colors"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                                    Urgency
                                  </label>
                                  <select
                                    value={test.urgency}
                                    onChange={(e) =>
                                      handleLabTestChange(idx, 'urgency', e.target.value)
                                    }
                                    className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-2.5 py-1.5 text-xs rounded-lg text-foreground transition-colors cursor-pointer"
                                  >
                                    <option value="Routine">Routine</option>
                                    <option value="Urgent">Urgent</option>
                                    <option value="STAT">STAT (Immediate)</option>
                                  </select>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                                  Preparation / Collection Notes
                                </label>
                                <input
                                  type="text"
                                  value={test.instructions}
                                  onChange={(e) =>
                                    handleLabTestChange(idx, 'instructions', e.target.value)
                                  }
                                  placeholder="e.g. Fasting 8-10 hours prior to blood draw"
                                  className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-1.5 text-xs rounded-lg text-foreground transition-colors"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Doctor Clinical Remarks */}
                    <div className="space-y-1">
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                        Doctor Remarks & Clinical Notes
                      </label>
                      <textarea
                        rows={2}
                        value={doctorNotes}
                        onChange={(e) => setDoctorNotes(e.target.value)}
                        placeholder="Doctor advice, follow-up schedule, dietary restrictions..."
                        className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors resize-none"
                      />
                    </div>

                    {/* Electronic Signature Badge */}
                    <div className="border border-border/80 bg-muted/30 p-3 rounded-lg flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-emerald-400" />
                        <div>
                          <div className="font-semibold text-foreground text-xs">
                            Cryptographic Signature Ready
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            Signed by Dr. {currentUser?.firstName} {currentUser?.lastName} ({currentUser?.email})
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold border border-emerald-500/30 px-2 py-0.5 rounded bg-emerald-500/10">
                        VERIFIED
                      </span>
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={submittingRx || isSelectedAptUnpaidPending}
                      className="w-full bg-foreground text-background font-semibold text-xs py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      {submittingRx ? (
                        <div className="w-4 h-4 border-2 border-background/20 border-t-background rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send size={13} />
                          <span>Electronically Sign & Issue Prescription</span>
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Issued Prescriptions Ledger Column (5 cols) */}
            <div className="lg:col-span-5 space-y-4 min-w-0">
              <Card className="border-border bg-card">
                <CardHeader className="border-b border-border/60 pb-3">
                  <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold flex items-center justify-between">
                    <span>Issued Prescriptions Ledger</span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {prescriptions.length} Records
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-[560px] overflow-y-auto overflow-x-hidden divide-y divide-border/60">
                  {prescriptions.map((rx) => {
                    const patientName = rx.patient?.user
                      ? `${rx.patient.user.firstName} ${rx.patient.user.lastName}`
                      : 'Registered Patient';

                    return (
                      <div key={rx.id} className="p-3.5 space-y-2 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {rx.prescriptionNo}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {rx.isFinalized && (
                              <Badge
                                variant="outline"
                                className="text-[10px] font-mono uppercase border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                              >
                                FINALIZED
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] font-mono uppercase',
                                rx.status === 'DISPENSED'
                                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                  : 'border-sky-500/30 bg-sky-500/10 text-sky-400'
                              )}
                            >
                              {rx.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="text-xs text-foreground font-medium">
                          Patient: <span className="font-semibold">{patientName}</span>
                          {rx.appointment && (
                            <span className="ml-2 text-[10px] font-mono text-muted-foreground">
                              • {rx.appointment.timeSlot}
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] font-mono text-muted-foreground">
                          {rx.items?.map((item, idx) => (
                            <div key={idx} className="bg-muted/40 p-1.5 rounded mt-1 border border-border/40">
                              <span className="font-semibold text-foreground">{item.medicineName}</span>
                              <span className="ml-1 text-muted-foreground">
                                ({item.dosage} • {item.frequency} • {item.durationDays}d)
                              </span>
                            </div>
                          ))}
                        </div>

                        {rx.labTests && rx.labTests.length > 0 && (
                          <div className="space-y-1 pt-1">
                            <div className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-semibold flex items-center gap-1">
                              <FlaskConical size={11} />
                              <span>Lab / Diagnostic Tests</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {rx.labTests.map((test, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] font-mono px-2 py-0.5 rounded border border-sky-500/30 bg-sky-500/10 text-sky-300"
                                  title={test.instructions || undefined}
                                >
                                  {test.testName}
                                  {test.urgency && test.urgency !== 'Routine' ? ` (${test.urgency})` : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {rx.doctorNotes && (
                          <p className="text-[10px] text-muted-foreground italic">
                            "{rx.doctorNotes}"
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {prescriptions.length === 0 && (
                    <div className="p-8 text-center text-xs text-muted-foreground">
                      No prescriptions recorded yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Set Review / Follow-Up Status Modal */}
      {statusModalApt && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="border border-border bg-card p-6 rounded-xl max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-3">
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <RotateCcw size={15} className="text-amber-400" />
                  <span>Manage Review / Follow-Up Status</span>
                </h2>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {statusModalApt.patient?.user
                    ? `${statusModalApt.patient.user.firstName} ${statusModalApt.patient.user.lastName}`
                    : 'Patient'}{' '}
                  • {statusModalApt.timeSlot}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setStatusModalApt(null)}
                className="h-7 w-7 cursor-pointer"
              >
                <X size={15} />
              </Button>
            </div>

            <form onSubmit={handleSubmitStatusModal} className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Consultation Hold / Follow-Up Mode *
                </label>
                <div className="space-y-2">
                  {[
                    {
                      value: 'REVIEW' as const,
                      title: 'REVIEW — Delayed Test / Case Assessment',
                      desc: 'Keep case open (e.g., reviewing CBC or X-ray results after 1 hour) without closing.',
                    },
                    {
                      value: 'FOLLOW_UP' as const,
                      title: 'FOLLOW-UP — Active Follow-Up Consultation',
                      desc: 'Visible in Patient Portal as active so the patient knows no re-booking or extra fee is needed.',
                    },
                    {
                      value: 'IN_PROGRESS' as const,
                      title: 'IN PROGRESS — Active Examination',
                      desc: 'Return consultation to active in-chair assessment.',
                    },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={cn(
                        'block p-2.5 rounded-lg border cursor-pointer transition-colors',
                        statusModalValue === opt.value
                          ? 'border-foreground bg-muted/50'
                          : 'border-border bg-background/60 hover:border-foreground/40',
                      )}
                    >
                      <div className="flex items-center gap-2 font-semibold text-foreground">
                        <input
                          type="radio"
                          name="consultStatus"
                          checked={statusModalValue === opt.value}
                          onChange={() => setStatusModalValue(opt.value)}
                          className="accent-foreground"
                        />
                        <span>{opt.title}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 pl-5">{opt.desc}</p>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Instructions / Reason Visible to Patient
                </label>
                <textarea
                  rows={3}
                  value={statusModalNotes}
                  onChange={(e) => setStatusModalNotes(e.target.value)}
                  placeholder="e.g. Please upload CBC lab report within 1 hour; Dr. Ahmed will review without re-booking..."
                  className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusModalApt(null)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updatingStatus}
                  size="sm"
                  className="bg-foreground text-background font-semibold cursor-pointer shadow-xs"
                >
                  {updatingStatus ? 'Updating...' : `Save Status: ${statusModalValue.replace('_', ' ')}`}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Uploaded Medical Reports Modal */}
      {reportsModalApt && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="border border-border bg-card p-6 rounded-xl max-w-xl w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-xl">
            <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-3">
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Paperclip size={15} className="text-sky-400" />
                  <span>Uploaded Medical Reports</span>
                </h2>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {reportsModalApt.patient?.user
                    ? `${reportsModalApt.patient.user.firstName} ${reportsModalApt.patient.user.lastName}`
                    : 'Patient'}{' '}
                  • Consultation {new Date(reportsModalApt.appointmentDate).toLocaleDateString()} (
                  {reportsModalApt.timeSlot})
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setReportsModalApt(null)}
                className="h-7 w-7 cursor-pointer"
              >
                <X size={15} />
              </Button>
            </div>

            {(() => {
              const reports = getCombinedReportsForAppointment(reportsModalApt);
              if (reports.length === 0) {
                return (
                  <div className="py-10 text-center text-xs text-muted-foreground font-mono border border-dashed border-border rounded-lg">
                    No PDF or image medical reports uploaded for this patient/consultation yet.
                  </div>
                );
              }
              return (
                <div className="space-y-2.5">
                  {reports.map((rep) => (
                    <div
                      key={rep.id}
                      className="border border-border/80 bg-background/60 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-xs text-foreground truncate">
                            {rep.title}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {rep.scopeLabel}
                          </Badge>
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground truncate">
                          {rep.fileName} • {formatFileSize(rep.fileSize)} •{' '}
                          {new Date(rep.createdAt).toLocaleString()}
                        </div>
                        {rep.notes && (
                          <div className="text-[11px] text-muted-foreground italic">{rep.notes}</div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          type="button"
                          size="sm"
                          variant="default"
                          disabled={loadingReportId === rep.id}
                          onClick={() => handlePreviewReport(rep)}
                          className="h-7 px-2.5 text-xs font-mono gap-1 cursor-pointer"
                        >
                          <Eye size={12} />
                          <span>{loadingReportId === rep.id ? 'Loading...' : 'Preview'}</span>
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
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              {reportsModalApt.status !== 'COMPLETED' ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const apt = reportsModalApt;
                    setReportsModalApt(null);
                    handleSelectPatientForRx(apt.patientId, apt.id);
                  }}
                  className="text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  <FileText size={12} />
                  <span>Proceed to Prescription Writer</span>
                </Button>
              ) : (
                <span />
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReportsModalApt(null)}
                className="cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Medical Report Secure File Preview Modal */}
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
    </div>
  );
};

export default DoctorPortal;
