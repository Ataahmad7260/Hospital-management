import React, { useEffect, useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  DollarSign,
  CheckCircle2,
  Clock,
  Eye,
  CreditCard,
  HeartPulse,
  Receipt,
  RefreshCw,
  Plus,
  Activity,
  AlertCircle,
} from 'lucide-react';
import {
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Modal,
  FormGroup,
} from '../../../shared/ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { api } from '../../../shared/api';
import type { PatientOverviewRecord } from '../../../shared/types';
import { useAuth } from '../../../shared/context/AuthContext';

export const PatientOverviewPage: React.FC<{ onAdmitClick?: () => void }> = ({ onAdmitClick }) => {
  const { showToast, currentUser } = useAuth();
  const [records, setRecords] = useState<PatientOverviewRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PAID' | 'UNPAID' | 'PRESCRIBED'>('ALL');
  const [selectedCase, setSelectedCase] = useState<PatientOverviewRecord | null>(null);

  // Payment modal state
  const [payingBill, setPayingBill] = useState<{
    billId: string;
    invoiceNumber: string;
    patientName: string;
    totalAmount: number;
    paidAmount: number;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'CASH' | 'UPI' | 'ONLINE' | 'INSURANCE'>('CARD');
  const [payAmountInput, setPayAmountInput] = useState<number>(0);

  useEffect(() => {
    loadOverview();
  }, [currentUser?.id]);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const data = await api.getPatientOverview();
      setRecords(data);
    } catch (err: any) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const openPaymentModal = (record: PatientOverviewRecord) => {
    if (!record.billing) return;
    const remaining = record.billing.totalAmount - (record.billing.paidAmount || 0);
    setPayingBill({
      billId: record.billing.id,
      invoiceNumber: record.billing.invoiceNumber,
      patientName: `${record.patient.firstName} ${record.patient.lastName}`,
      totalAmount: record.billing.totalAmount,
      paidAmount: record.billing.paidAmount || 0,
    });
    setPayAmountInput(remaining > 0 ? remaining : record.billing.totalAmount);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingBill) return;

    try {
      await api.recordPayment(payingBill.billId, Number(payAmountInput), paymentMethod);
      showToast(`Invoice ${payingBill.invoiceNumber} payment of $${Number(payAmountInput).toFixed(2)} recorded successfully!`);
      setPayingBill(null);
      loadOverview();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  // Filtered records
  const filtered = records.filter((r) => {
    const fullName = `${r.patient.firstName} ${r.patient.lastName}`.toLowerCase();
    const doctorName = `${r.attendingDoctor.firstName} ${r.attendingDoctor.lastName}`.toLowerCase();
    const condition = (r.reason || '').toLowerCase();
    const matchesSearch =
      fullName.includes(search.toLowerCase()) ||
      doctorName.includes(search.toLowerCase()) ||
      condition.includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'PAID') {
      return r.billing?.status === 'PAID';
    }
    if (filterStatus === 'UNPAID') {
      return r.billing?.status === 'PENDING' || r.billing?.status === 'PARTIALLY_PAID';
    }
    if (filterStatus === 'PRESCRIBED') {
      return r.prescriptions.length > 0;
    }
    return true;
  });

  const totalCollected = records.reduce((sum, r) => sum + (r.billing?.paidAmount || 0), 0);
  const totalOutstanding = records.reduce((sum, r) => {
    if (r.billing && r.billing.status !== 'PAID') {
      return sum + (r.billing.totalAmount - (r.billing.paidAmount || 0));
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-6 w-full">
      {/* Top Ledger Header & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="text-[0.68rem] text-muted-foreground uppercase font-medium flex items-center gap-1.5">
            <Activity size={13} className="text-primary" />
            <span>Total Admissions</span>
          </div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">{records.length}</div>
          <div className="text-[0.65rem] text-muted-foreground mt-0.5">Chronological case history</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="text-[0.68rem] text-muted-foreground uppercase font-medium flex items-center gap-1.5">
            <FileText size={13} className="text-sky-400" />
            <span>Prescriptions Issued</span>
          </div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">
            {records.reduce((acc, r) => acc + r.prescriptions.length, 0)}
          </div>
          <div className="text-[0.65rem] text-muted-foreground mt-0.5">By attending doctors</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="text-[0.68rem] text-muted-foreground uppercase font-medium flex items-center gap-1.5">
            <DollarSign size={13} className="text-emerald-400" />
            <span>Total Money Paid</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            ${totalCollected.toFixed(2)}
          </div>
          <div className="text-[0.65rem] text-muted-foreground mt-0.5">Settled hospital revenue</div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="text-[0.68rem] text-muted-foreground uppercase font-medium flex items-center gap-1.5">
            <AlertCircle size={13} className="text-amber-400" />
            <span>Outstanding Invoices</span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            ${totalOutstanding.toFixed(2)}
          </div>
          <div className="text-[0.65rem] text-muted-foreground mt-0.5">Pending billing balance</div>
        </div>
      </div>

      <Card
        title="Patient Admission Overview & Master Case Ledger"
        subtitle="Complete chronological directory of patient admissions, attending physicians, prescribed medications, and paid billing"
        icon={<FileText size={18} className="text-primary" />}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={loadOverview}
              title="Refresh ledger"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </Button>
            {onAdmitClick && (
              <Button size="sm" onClick={onAdmitClick}>
                <Plus size={14} />
                <span>Admit New Patient</span>
              </Button>
            )}
          </div>
        }
      >
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-border">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by patient name, attending doctor, symptoms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground mr-1 flex items-center gap-1">
              <Filter size={11} /> Filter:
            </span>
            {(['ALL', 'PAID', 'UNPAID', 'PRESCRIBED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-md text-xs transition-all cursor-pointer ${
                  filterStatus === st
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Master Case Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Admission Date</TableHead>
              <TableHead>Patient Details</TableHead>
              <TableHead>Condition / Symptoms</TableHead>
              <TableHead>Attending Doctor</TableHead>
              <TableHead>Prescribed Medications</TableHead>
              <TableHead>Money Paid / Bill</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => {
              const admissionDateStr = new Date(item.admissionDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              const isPaid = item.billing?.status === 'PAID';
              const hasOutstanding = item.billing && item.billing.status !== 'PAID';

              return (
                <TableRow key={item.id}>
                  {/* Date Column */}
                  <TableCell>
                    <div className="font-mono font-medium text-foreground text-xs">{admissionDateStr}</div>
                    <div className="text-[0.68rem] font-mono text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock size={10} />
                      <span>{item.timeSlot}</span>
                    </div>
                  </TableCell>

                  {/* Patient Info */}
                  <TableCell>
                    <div className="font-semibold text-foreground text-xs">
                      {item.patient.firstName} {item.patient.lastName}
                    </div>
                    <div className="text-[0.68rem] text-muted-foreground font-mono mt-0.5">
                      {item.patient.gender} &bull; Blood: {item.patient.bloodGroup || 'UNKNOWN'}
                    </div>
                    {item.patient.phoneNumber && (
                      <div className="text-[0.65rem] text-muted-foreground font-mono">
                        {item.patient.phoneNumber}
                      </div>
                    )}
                  </TableCell>

                  {/* Condition & Symptoms */}
                  <TableCell>
                    <div className="text-xs text-foreground line-clamp-2 max-w-[200px]" title={item.reason}>
                      {item.reason || 'General Health Intake'}
                    </div>
                    {item.medicalRecord?.vitals?.bloodPressure && (
                      <div className="text-[0.65rem] font-mono text-muted-foreground mt-1 flex items-center gap-1">
                        <HeartPulse size={10} className="text-rose-400" />
                        <span>BP: {item.medicalRecord.vitals.bloodPressure}</span>
                        {item.medicalRecord.vitals.temperature && (
                          <span>&bull; {item.medicalRecord.vitals.temperature}°C</span>
                        )}
                      </div>
                    )}
                  </TableCell>

                  {/* Attending Doctor */}
                  <TableCell>
                    <div className="font-semibold text-foreground text-xs">
                      Dr. {item.attendingDoctor.firstName} {item.attendingDoctor.lastName}
                    </div>
                    <div className="text-[0.68rem] text-muted-foreground font-mono">
                      {item.attendingDoctor.specialization}
                    </div>
                    <div className="text-[0.65rem] text-muted-foreground font-mono">
                      Consultation: ${item.attendingDoctor.consultationFee.toFixed(2)}
                    </div>
                  </TableCell>

                  {/* Prescribed Medications */}
                  <TableCell>
                    {item.prescriptions.length > 0 ? (
                      <div className="space-y-1">
                        {item.prescriptions.map((rx) => (
                          <div key={rx.id} className="text-xs">
                            <span className="font-mono text-[0.68rem] text-primary">
                              {rx.prescriptionNo}:{' '}
                            </span>
                            <span className="font-medium text-foreground">
                              {rx.items.map((i) => i.medicineName).join(', ')}
                            </span>
                            <div className="text-[0.65rem] text-muted-foreground font-mono">
                              Status: <strong className={rx.status === 'DISPENSED' ? 'text-emerald-400' : 'text-amber-400'}>{rx.status}</strong>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs italic">Awaiting Doctor Rx</span>
                    )}
                  </TableCell>

                  {/* Money Paid / Billing */}
                  <TableCell>
                    {item.billing ? (
                      <div>
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="text-xs font-bold text-foreground">
                            ${(item.billing.paidAmount || 0).toFixed(2)}
                          </span>
                          <span className="text-muted-foreground text-[0.68rem]">
                            / ${(item.billing.totalAmount).toFixed(2)}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-1">
                          <Badge
                            variant={isPaid ? 'success' : 'warning'}
                            className="font-mono text-[0.62rem]"
                          >
                            {isPaid && <CheckCircle2 size={9} className="mr-0.5" />}
                            {item.billing.status}
                          </Badge>
                          <span className="text-[0.65rem] text-muted-foreground font-mono">
                            {item.billing.paymentMethod}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-xs font-mono">
                        <span>No bill generated</span>
                      </div>
                    )}
                  </TableCell>

                  {/* Action Column */}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCase(item)}
                        title="View Full Case File"
                      >
                        <Eye size={12} />
                        <span>Case</span>
                      </Button>

                      {hasOutstanding && (
                        <Button
                          size="sm"
                          onClick={() => openPaymentModal(item)}
                          title="Pay / Settle Outstanding Bill"
                        >
                          <CreditCard size={12} />
                          <span>Pay</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                  No patient clinical records match your search criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Case Details Modal */}
      {selectedCase && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedCase(null)}
          title={`Clinical Case File: ${selectedCase.patient.firstName} ${selectedCase.patient.lastName}`}
        >
          <div className="space-y-4 text-xs">
            {/* Timeline banner */}
            <div className="p-3 bg-muted/40 rounded-lg border border-border flex flex-wrap items-center justify-between gap-2 font-mono">
              <div>
                <span className="text-muted-foreground">Admission Date: </span>
                <strong className="text-foreground">
                  {new Date(selectedCase.admissionDate).toLocaleString()}
                </strong>
              </div>
              <div>
                <span className="text-muted-foreground">Consultation Slot: </span>
                <span className="text-foreground">{selectedCase.timeSlot}</span>
              </div>
            </div>

            {/* Patient & Doctor details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/30 rounded-lg border border-border">
                <div className="text-[0.68rem] text-muted-foreground uppercase font-medium mb-1">Patient Details</div>
                <div className="text-sm font-bold text-foreground">
                  {selectedCase.patient.firstName} {selectedCase.patient.lastName}
                </div>
                <div className="text-muted-foreground mt-1 font-mono text-[0.7rem]">
                  Gender: {selectedCase.patient.gender} &bull; Blood: {selectedCase.patient.bloodGroup}
                </div>
                <div className="text-muted-foreground font-mono text-[0.7rem]">{selectedCase.patient.email}</div>
                {selectedCase.patient.phoneNumber && (
                  <div className="text-muted-foreground font-mono text-[0.7rem]">
                    {selectedCase.patient.phoneNumber}
                  </div>
                )}
              </div>

              <div className="p-3 bg-muted/30 rounded-lg border border-border">
                <div className="text-[0.68rem] text-muted-foreground uppercase font-medium mb-1">Attending Physician</div>
                <div className="text-sm font-bold text-foreground">
                  Dr. {selectedCase.attendingDoctor.firstName} {selectedCase.attendingDoctor.lastName}
                </div>
                <div className="text-primary font-mono text-[0.7rem] mt-1">
                  {selectedCase.attendingDoctor.specialization}
                </div>
                <div className="text-muted-foreground font-mono text-[0.7rem]">
                  Department: {selectedCase.attendingDoctor.department}
                </div>
                <div className="text-muted-foreground font-mono text-[0.7rem]">
                  Consultation Fee: ${selectedCase.attendingDoctor.consultationFee.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Condition & Symptoms */}
            <div className="p-3 bg-muted/30 rounded-lg border border-border">
              <div className="text-[0.68rem] text-muted-foreground uppercase font-medium mb-1">
                Admitted Symptoms & Condition
              </div>
              <div className="text-foreground">{selectedCase.reason || 'Routine consultation'}</div>
              {selectedCase.medicalRecord?.vitals && (
                <div className="mt-2 pt-2 border-t border-border grid grid-cols-4 gap-2 font-mono text-[0.68rem]">
                  <div>
                    <span className="text-muted-foreground">BP: </span>
                    <span className="text-foreground font-semibold">{selectedCase.medicalRecord.vitals.bloodPressure || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Temp: </span>
                    <span className="text-foreground font-semibold">
                      {selectedCase.medicalRecord.vitals.temperature ? `${selectedCase.medicalRecord.vitals.temperature}°C` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">HR: </span>
                    <span className="text-foreground font-semibold">
                      {selectedCase.medicalRecord.vitals.heartRate ? `${selectedCase.medicalRecord.vitals.heartRate} bpm` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">SpO2: </span>
                    <span className="text-foreground font-semibold">
                      {selectedCase.medicalRecord.vitals.oxygenSaturation ? `${selectedCase.medicalRecord.vitals.oxygenSaturation}%` : 'N/A'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Prescriptions */}
            <div className="p-3 bg-muted/30 rounded-lg border border-border">
              <div className="text-[0.68rem] text-muted-foreground uppercase font-medium mb-2 flex items-center justify-between">
                <span>Doctor Prescriptions & Dispensary Regimen</span>
                <Badge variant="secondary">
                  {selectedCase.prescriptions.length} order(s)
                </Badge>
              </div>
              {selectedCase.prescriptions.length > 0 ? (
                <div className="space-y-3">
                  {selectedCase.prescriptions.map((rx) => (
                    <div key={rx.id} className="p-2.5 bg-card rounded-md border border-border">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-primary text-[0.75rem]">
                          {rx.prescriptionNo}
                        </span>
                        <Badge variant={rx.status === 'DISPENSED' ? 'success' : 'warning'}>
                          {rx.status}
                        </Badge>
                      </div>
                      <div className="mt-2 space-y-1">
                        {rx.items.map((it, idx) => (
                          <div key={idx} className="text-foreground flex items-center justify-between">
                            <span>
                              &bull; <strong>{it.medicineName}</strong> ({it.dosage}) - {it.frequency}
                            </span>
                            <span className="text-muted-foreground font-mono text-[0.68rem]">{it.durationDays} days</span>
                          </div>
                        ))}
                      </div>
                      {rx.doctorNotes && (
                        <div className="mt-1.5 text-muted-foreground italic text-[0.68rem]">
                          Doctor Remarks: {rx.doctorNotes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground italic py-2">No prescriptions issued yet</div>
              )}
            </div>

            {/* Billing Breakdown */}
            <div className="p-3 bg-muted/30 rounded-lg border border-border">
              <div className="text-[0.68rem] text-muted-foreground uppercase font-medium mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Receipt size={13} className="text-primary" /> Hospital Billing & Money Paid
                </span>
                {selectedCase.billing && (
                  <Badge variant="outline" className="font-mono">
                    {selectedCase.billing.invoiceNumber}
                  </Badge>
                )}
              </div>
              {selectedCase.billing ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-mono text-muted-foreground">
                    <span>Subtotal Charges:</span>
                    <span>${selectedCase.billing.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-muted-foreground">
                    <span>Tax & Clinical Fees:</span>
                    <span>${selectedCase.billing.taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-foreground font-bold text-sm pt-1 border-t border-border">
                    <span>Total Invoiced:</span>
                    <span>${selectedCase.billing.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-foreground text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <DollarSign size={13} className="text-emerald-400" /> Paid Amount:
                    </span>
                    <span className="font-bold text-emerald-400">
                      ${(selectedCase.billing.paidAmount || 0).toFixed(2)} ({selectedCase.billing.status})
                    </span>
                  </div>
                  {selectedCase.billing.paidAt && (
                    <div className="text-muted-foreground font-mono text-[0.65rem] text-right">
                      Settled on: {new Date(selectedCase.billing.paidAt).toLocaleString()} ({selectedCase.billing.paymentMethod})
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-muted-foreground italic py-2">No invoice billed for this case yet</div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setSelectedCase(null)}>
                Close Case
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Payment Processing Modal */}
      {payingBill && (
        <Modal
          isOpen={true}
          onClose={() => setPayingBill(null)}
          title={`Process Payment for ${payingBill.invoiceNumber}`}
        >
          <form onSubmit={handleProcessPayment} className="space-y-4">
            <div className="p-3 bg-muted/40 rounded-lg border border-border font-mono text-xs space-y-1.5">
              <div className="text-muted-foreground">
                Patient: <strong className="text-foreground">{payingBill.patientName}</strong>
              </div>
              <div className="text-muted-foreground">
                Total Invoiced: <strong className="text-foreground">${payingBill.totalAmount.toFixed(2)}</strong>
              </div>
              <div className="text-muted-foreground">
                Previously Paid: <strong className="text-foreground">${payingBill.paidAmount.toFixed(2)}</strong>
              </div>
              <div className="text-foreground font-bold pt-1.5 border-t border-border flex justify-between">
                <span>Remaining Balance:</span>
                <span className="text-amber-400">${(payingBill.totalAmount - payingBill.paidAmount).toFixed(2)}</span>
              </div>
            </div>

            <FormGroup label="Payment Method">
              <select
                value={paymentMethod}
                onChange={(e: any) => setPaymentMethod(e.target.value)}
                required
              >
                <option value="CARD">Credit / Debit Card</option>
                <option value="CASH">Cash at Dispensary Counter</option>
                <option value="UPI">UPI / Instant QR Payment</option>
                <option value="ONLINE">Online Portal Gateway</option>
                <option value="INSURANCE">Health Insurance Coverage</option>
              </select>
            </FormGroup>

            <FormGroup label="Amount to Pay ($)">
              <Input
                type="number"
                step="0.01"
                min="1"
                max={payingBill.totalAmount}
                value={payAmountInput}
                onChange={(e) => setPayAmountInput(Number(e.target.value))}
                required
              />
            </FormGroup>

            <div className="modal-footer flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setPayingBill(null)}>
                Cancel
              </Button>
              <Button type="submit">
                Record Payment of ${Number(payAmountInput).toFixed(2)}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
