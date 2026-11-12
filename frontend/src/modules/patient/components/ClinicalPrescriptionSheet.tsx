import React from 'react';
import {
  FlaskConical,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Stethoscope,
} from 'lucide-react';
import type { Appointment, Patient, Prescription } from '../../../shared/types';
import { cn } from '@/lib/utils';

export interface ClinicalPrescriptionSheetProps {
  prescription: Prescription;
  appointment?: Appointment | null;
  patientProfile?: Patient | null;
  onPrintSingle?: () => void;
  isPrintMode?: boolean;
}

export const ClinicalPrescriptionSheet: React.FC<ClinicalPrescriptionSheetProps> = ({
  prescription,
  appointment,
  patientProfile,
  onPrintSingle,
  isPrintMode = false,
}) => {
  const docObj = prescription.doctor || appointment?.doctor;
  const aptDoc = appointment?.doctor;

  const docFirstName = docObj?.user?.firstName || aptDoc?.user?.firstName || '';
  const docLastName = docObj?.user?.lastName || aptDoc?.user?.lastName || '';
  const doctorFullName = [docFirstName, docLastName].filter(Boolean).join(' ').trim();
  const formattedDoctorName = doctorFullName ? `Dr. ${doctorFullName}` : 'Attending Physician';

  const specialization =
    docObj?.specialization || aptDoc?.specialization || 'Medical Consultant';
  const departmentName =
    docObj?.department?.name || aptDoc?.department?.name || 'Clinical Outpatient Department';
  const qualifications =
    docObj?.qualifications && docObj.qualifications.length > 0
      ? docObj.qualifications
      : aptDoc?.qualifications || [];
  const licenseNumber = docObj?.licenseNumber || aptDoc?.licenseNumber;
  const roomNumber = docObj?.roomNumber || aptDoc?.roomNumber;

  const consultDate =
    appointment?.appointmentDate || prescription.appointment?.appointmentDate;
  const consultSlot = appointment?.timeSlot || prescription.appointment?.timeSlot;
  const consultReason = appointment?.reason;

  const patientUser =
    prescription.patient?.user || appointment?.patient?.user || patientProfile?.user;
  const patientName = patientUser
    ? [patientUser.firstName, patientUser.lastName].filter(Boolean).join(' ').trim()
    : 'Registered Patient';
  const patientIdShort = (
    prescription.patientId ||
    patientProfile?.id ||
    appointment?.patientId ||
    ''
  )
    .slice(-8)
    .toUpperCase();
  const patientGender = appointment?.patient?.gender || patientProfile?.gender;
  const patientBloodGroup =
    appointment?.patient?.bloodGroup || patientProfile?.bloodGroup;

  const issuedAtDate = new Date(prescription.createdAt);
  const formattedIssuedTimestamp = issuedAtDate.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const formattedConsultDate = consultDate
    ? new Date(consultDate).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      })
    : null;

  return (
    <article
      className={cn(
        'rx-sheet-print-item bg-white text-slate-900 border border-slate-300 border-t-4 border-t-emerald-700 rounded-md overflow-hidden',
        isPrintMode ? '' : 'shadow-md',
      )}
    >
      {/* 1. Hospital & Prescribing Doctor Letterhead Header */}
      <header className="px-5 sm:px-7 pt-5 pb-4 bg-white border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          {/* Left: Hospital Branding & Doctor Credentials */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-800">
              <Stethoscope size={15} className="shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]">
                AURA SPECIALTY HOSPITAL &bull; CLINICAL PRESCRIPTION PAD
              </span>
            </div>

            <div className="pt-0.5">
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-slate-950">
                {formattedDoctorName}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-emerald-800">
                {specialization}
                {departmentName ? ` • ${departmentName}` : ''}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-slate-600 pt-0.5">
              {qualifications.length > 0 && (
                <span>Qual: {qualifications.join(', ')}</span>
              )}
              {licenseNumber && (
                <span>Reg No: {licenseNumber}</span>
              )}
              {roomNumber && <span>Clinic: {roomNumber}</span>}
            </div>
          </div>

          {/* Right: Prescription Identifier, Status Seal & Consultation Timestamp */}
          <div className="sm:text-right flex flex-col sm:items-end gap-1.5 shrink-0 bg-slate-50 border border-slate-200 rounded-md px-3.5 py-2.5">
            <div className="flex items-center gap-2 flex-wrap sm:justify-end">
              <span className="font-mono text-sm font-bold text-slate-950 tracking-tight">
                {prescription.prescriptionNo}
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border',
                  prescription.status === 'DISPENSED'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-sky-50 text-sky-900 border-sky-300',
                )}
              >
                {prescription.status.replace(/_/g, ' ')}
              </span>
              {prescription.isFinalized && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-400">
                  <ShieldCheck size={10} />
                  FINALIZED
                </span>
              )}
            </div>

            <div className="text-[11px] font-mono text-slate-700 space-y-0.5">
              {formattedConsultDate && (
                <div className="flex items-center sm:justify-end gap-1.5 font-semibold text-slate-900">
                  <Calendar size={11} className="text-emerald-700 shrink-0" />
                  <span>
                    Consult: {formattedConsultDate}
                    {consultSlot ? ` (${consultSlot})` : ''}
                  </span>
                </div>
              )}
              <div className="flex items-center sm:justify-end gap-1.5 text-slate-600">
                <Clock size={11} className="text-slate-500 shrink-0" />
                <span>Rx Issued: {formattedIssuedTimestamp}</span>
              </div>
            </div>

            {onPrintSingle && !isPrintMode && (
              <button
                type="button"
                onClick={onPrintSingle}
                className="print:hidden mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 text-[11px] font-mono font-semibold text-slate-800 transition-colors cursor-pointer"
              >
                <Printer size={11} />
                <span>Print Sheet</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Patient & Consultation Demographics Strip */}
      <div className="px-5 sm:px-7 py-2.5 bg-slate-50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
            Patient Name & ID
          </span>
          <span className="font-semibold text-slate-900">
            {patientName}
            {patientIdShort ? (
              <span className="font-mono text-[11px] text-slate-600 ml-1.5">
                (PT-{patientIdShort})
              </span>
            ) : null}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
            Demographics
          </span>
          <span className="font-mono text-[11px] text-slate-800">
            Gender: {patientGender || 'N/A'} • Blood:{' '}
            {patientBloodGroup && patientBloodGroup !== 'UNKNOWN'
              ? patientBloodGroup.replace('_POSITIVE', '+').replace('_NEGATIVE', '-')
              : 'On File'}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">
            Chief Complaint / Indication
          </span>
          <span className="text-slate-800 line-clamp-1" title={consultReason || undefined}>
            {consultReason || 'Outpatient Clinical Consultation'}
          </span>
        </div>
      </div>

      {/* 3. Formal Clinical Body */}
      <div className="px-5 sm:px-7 py-5 space-y-5 bg-white">
        {/* Section A: Prescribed Medications */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="font-serif text-xl font-bold leading-none text-emerald-800 select-none">
                ℞
              </span>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
                Prescribed Medications ({prescription.items?.length || 0})
              </h4>
            </div>
            <span className="text-[10px] font-mono uppercase text-slate-500">
              Therapeutic Regimen
            </span>
          </div>

          {prescription.items && prescription.items.length > 0 ? (
            <div className="w-full max-w-full min-w-0 overflow-x-auto scrollbar-hidden border border-slate-200 rounded">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-mono uppercase tracking-wider text-slate-600">
                    <th className="py-2 px-3 w-8">#</th>
                    <th className="py-2 px-3">Medication Name</th>
                    <th className="py-2 px-3">Dosage</th>
                    <th className="py-2 px-3">Frequency / Regimen</th>
                    <th className="py-2 px-3">Duration</th>
                    <th className="py-2 px-3">Directions / Instructions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {prescription.items.map((item, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}
                    >
                      <td className="py-2.5 px-3 font-mono text-slate-500 align-top">
                        {idx + 1}.
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-950 align-top">
                        {item.medicineName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-800 align-top whitespace-nowrap">
                        {item.dosage}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 align-top">
                        {item.frequency}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 align-top whitespace-nowrap">
                        {item.durationDays} {item.durationDays === 1 ? 'day' : 'days'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 align-top">
                        {item.instructions || 'Take as directed by physician'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs italic text-slate-500 py-1">
              No pharmacological medications prescribed in this order (diagnostic orders only).
            </p>
          )}
        </section>

        {/* Section B: Ordered Lab / Diagnostic Tests */}
        {prescription.labTests && prescription.labTests.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <div className="flex items-center gap-2">
                <FlaskConical size={15} className="text-sky-700 shrink-0" />
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
                  Ordered Lab & Diagnostic Tests ({prescription.labTests.length})
                </h4>
              </div>
              <span className="text-[10px] font-mono uppercase text-slate-500">
                Diagnostic Workup
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {prescription.labTests.map((test, idx) => {
                const urgencyNorm = (test.urgency || 'Routine').toUpperCase();
                const urgencyClass =
                  urgencyNorm === 'STAT'
                    ? 'bg-rose-50 text-rose-800 border-rose-300'
                    : urgencyNorm === 'URGENT'
                    ? 'bg-amber-50 text-amber-900 border-amber-300'
                    : 'bg-slate-100 text-slate-700 border-slate-300';

                return (
                  <div
                    key={idx}
                    className="p-3 rounded border border-slate-200 border-l-4 border-l-sky-700 bg-slate-50/70 flex items-start justify-between gap-2.5"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-slate-950">
                        {idx + 1}. {test.testName}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {test.instructions || 'Standard laboratory collection protocol'}
                      </div>
                    </div>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded border text-[10px] font-mono font-bold uppercase shrink-0',
                        urgencyClass,
                      )}
                    >
                      {test.urgency || 'Routine'}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Section C: Doctor Remarks & Clinical Advice */}
        {prescription.doctorNotes && (
          <section className="space-y-1.5">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
              Doctor Remarks & Clinical Instructions
            </h4>
            <div className="p-3.5 rounded border border-slate-200 bg-slate-50 text-xs text-slate-800 leading-relaxed whitespace-pre-line">
              {prescription.doctorNotes}
            </div>
          </section>
        )}
      </div>

      {/* 4. Official Digital Verification & Physician Signature Footer */}
      <footer className="px-5 sm:px-7 py-3 bg-slate-50 border-t border-dashed border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-1.5 font-mono text-slate-600">
          <CheckCircle2 size={13} className="text-emerald-700 shrink-0" />
          <span>
            Verified Digital Prescription &bull; {prescription.prescriptionNo}
            {prescription.isFinalized ? ' (Locked / Issued)' : ''}
          </span>
        </div>

        <div className="sm:text-right">
          <div className="font-semibold text-slate-900">{formattedDoctorName}</div>
          <div className="text-[10px] font-mono text-slate-500">
            {specialization}
            {licenseNumber ? ` • Lic: ${licenseNumber}` : ''} &bull; Authorized Electronic Signature
          </div>
        </div>
      </footer>
    </article>
  );
};

export default ClinicalPrescriptionSheet;

