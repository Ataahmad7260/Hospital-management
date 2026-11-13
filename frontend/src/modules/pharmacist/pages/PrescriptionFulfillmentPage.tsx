import React, { useEffect, useState } from 'react';
import {
  Pill,
  CheckCircle2,
  Receipt,
  Lock,
  Clock,
  ArrowRight,
  PackageCheck,
  RefreshCw,
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
  StatusPill,
  Button,
  Modal,
  FormGroup,
  FormRow,
} from '../../../shared/ui';
import { Badge } from '@/components/ui/badge';
import { api } from '../../../shared/api';
import type { Prescription, Bill, PharmacyBillPreview } from '../../../shared/types';
import { useAuth } from '../../../shared/context/AuthContext';

export const PrescriptionFulfillmentPage: React.FC<{
  onNavigateToBilling?: () => void;
  initialBillingRxId?: string | null;
  onClearInitialBillingRxId?: () => void;
}> = ({ initialBillingRxId, onClearInitialBillingRxId }) => {
  const { showToast, currentUser } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ISSUED' | 'DISPENSED'>('ALL');
  const [loading, setLoading] = useState(false);

  // Stage 2 Medicine Bill Generation Modal State (pulled from Inventory)
  const [billingPreview, setBillingPreview] = useState<PharmacyBillPreview | null>(null);
  const [editableQuantities, setEditableQuantities] = useState<Record<string, number>>({});
  const [taxRate, setTaxRate] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null);
  const [submittingBill, setSubmittingBill] = useState(false);
  const [dispensingRxId, setDispensingRxId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (initialBillingRxId) {
      handleOpenBillingPreview(initialBillingRxId);
      onClearInitialBillingRxId?.();
    }
  }, [initialBillingRxId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rxData, billData] = await Promise.all([
        api.getPrescriptions(),
        api.getBills(),
      ]);
      setPrescriptions(rxData);
      setBills(billData);
    } catch (err: any) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const getPharmacyBillForRx = (rx: Prescription): Bill | null => {
    if (rx.pharmacyBill && rx.pharmacyBill.billType === 'PHARMACY') {
      return rx.pharmacyBill;
    }
    return (
      bills.find(
        (b) =>
          b.billType === 'PHARMACY' &&
          b.prescriptionId === rx.id &&
          b.status !== 'CANCELLED' &&
          b.status !== 'REFUNDED',
      ) || null
    );
  };

  const handleOpenBillingPreview = async (rxId: string) => {
    setLoadingPreviewId(rxId);
    try {
      const preview = await api.previewPharmacyBill(rxId);
      if (preview.existingBill) {
        showToast(
          `Pharmacy Bill ${preview.existingBill.invoiceNumber} is already generated ($${preview.existingBill.totalAmount.toFixed(2)})`,
        );
        loadData();
        return;
      }
      if (!preview.items || preview.items.length === 0) {
        showToast('This prescription has no prescribed medications to bill.', true);
        return;
      }
      const initialQtys: Record<string, number> = {};
      for (const item of preview.items) {
        initialQtys[item.medicineName] = item.quantity;
      }
      setEditableQuantities(initialQtys);
      setTaxRate(0);
      setDiscountAmount(0);
      setBillingPreview(preview);
    } catch (err: any) {
      showToast(err.message || 'Unable to load inventory pricing preview', true);
    } finally {
      setLoadingPreviewId(null);
    }
  };

  const handleGenerateMedicineBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingPreview) return;

    setSubmittingBill(true);
    try {
      const itemOverrides = billingPreview.items.map((item) => ({
        medicineName: item.medicineName,
        quantity: Math.max(1, Number(editableQuantities[item.medicineName] ?? item.quantity)),
      }));

      const createdBill = await api.generatePharmacyBill(billingPreview.prescriptionId, {
        taxRate: Number(taxRate) || 0,
        discountAmount: Number(discountAmount) || 0,
        items: itemOverrides,
      });

      showToast(
        `Medicine Bill ${createdBill.invoiceNumber} ($${createdBill.totalAmount.toFixed(
          2,
        )}) generated! Patient must pay in Patient Portal before medicines can be dispensed.`,
      );
      setBillingPreview(null);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to generate medicine bill', true);
    } finally {
      setSubmittingBill(false);
    }
  };

  const handleDispense = async (rx: Prescription, pharmacyBill: Bill | null) => {
    if (!pharmacyBill) {
      showToast('Please click "Generate Medicine Bill" before dispensing medicines.', true);
      return;
    }
    if (pharmacyBill.status !== 'PAID') {
      showToast(
        `Dispensing blocked: Patient must settle Pharmacy Bill ${pharmacyBill.invoiceNumber} ($${pharmacyBill.totalAmount.toFixed(
          2,
        )}) in their Patient Portal first.`,
        true,
      );
      return;
    }

    setDispensingRxId(rx.id);
    try {
      const itemNames = rx.items.map((i) => i.medicineName);
      await api.dispensePrescription(
        rx.id,
        currentUser?.id || '',
        itemNames,
        `Handed over after Pharmacy Bill ${pharmacyBill.invoiceNumber} settlement`,
      );
      showToast(`Medicines handed over & prescription ${rx.prescriptionNo} marked as DISPENSED`);
      loadData();
    } catch (err: any) {
      showToast(err.message, true);
    } finally {
      setDispensingRxId(null);
    }
  };

  const filtered =
    filter === 'ALL'
      ? prescriptions
      : prescriptions.filter((r) => r.status === filter);

  const awaitingBillGenCount = prescriptions.filter(
    (rx) => rx.status !== 'DISPENSED' && (rx.items?.length || 0) > 0 && !getPharmacyBillForRx(rx),
  ).length;
  const awaitingPatientPayCount = prescriptions.filter((rx) => {
    const b = getPharmacyBillForRx(rx);
    return rx.status !== 'DISPENSED' && b && b.status !== 'PAID';
  }).length;
  const readyToHandoverCount = prescriptions.filter((rx) => {
    const b = getPharmacyBillForRx(rx);
    return rx.status !== 'DISPENSED' && b && b.status === 'PAID';
  }).length;

  const previewSubtotal = billingPreview
    ? billingPreview.items.reduce((acc, item) => {
        const qty = Math.max(1, Number(editableQuantities[item.medicineName] ?? item.quantity));
        return acc + qty * item.unitPrice;
      }, 0)
    : 0;
  const previewTax = (previewSubtotal * (Number(taxRate) || 0)) / 100;
  const previewTotal = Math.max(0, previewSubtotal + previewTax - (Number(discountAmount) || 0));

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      {/* Stage 2 Pharmacy Pipeline Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 min-w-0">
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="text-[0.68rem] font-mono uppercase text-muted-foreground flex items-center gap-1.5">
            <Receipt size={13} className="text-sky-400" />
            <span>Step 1: Needs Medicine Bill</span>
          </div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">{awaitingBillGenCount}</div>
          <div className="text-[0.65rem] text-muted-foreground mt-0.5">
            Pull inventory unit prices via Generate Medicine Bill
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="text-[0.68rem] font-mono uppercase text-muted-foreground flex items-center gap-1.5">
            <Clock size={13} className="text-amber-400" />
            <span>Step 2: Awaiting Patient Payment</span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{awaitingPatientPayCount}</div>
          <div className="text-[0.65rem] text-muted-foreground mt-0.5">
            Dispensing locked until patient pays in Patient Portal
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
          <div className="text-[0.68rem] font-mono uppercase text-muted-foreground flex items-center gap-1.5">
            <PackageCheck size={13} className="text-emerald-400" />
            <span>Step 3: Paid & Ready to Dispense</span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{readyToHandoverCount}</div>
          <div className="text-[0.65rem] text-muted-foreground mt-0.5">
            Pharmacy bill settled — ready for handover
          </div>
        </div>
      </div>

      <Card
        title="Pharmacist Dispensary Queue & Stage 2 Medicine Billing"
        subtitle="Generate itemized Medicine Bills from live inventory prices; Hand Over / Dispense unlocks strictly after patient payment"
        icon={<Pill size={18} />}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-muted-foreground text-xs">Filter Status:</span>
            {(['ALL', 'ISSUED', 'DISPENSED'] as const).map((st) => (
              <button
                key={st}
                className={`px-2.5 py-1 rounded-full text-xs font-mono font-semibold uppercase border transition-colors cursor-pointer ${
                  filter === st
                    ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                    : 'bg-card text-muted-foreground hover:text-foreground border-border'
                }`}
                onClick={() => setFilter(st)}
              >
                {st}
              </button>
            ))}
            <Button variant="outline" size="sm" onClick={loadData} icon={<RefreshCw size={12} className={loading ? 'animate-spin' : ''} />}>
              Refresh
            </Button>
          </div>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rx Identifier</TableHead>
              <TableHead>Patient Name</TableHead>
              <TableHead>Prescribing Physician</TableHead>
              <TableHead>Medications & Regimen</TableHead>
              <TableHead>Dispense Status</TableHead>
              <TableHead>Pharmacy Bill Status</TableHead>
              <TableHead>Stage 2 Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((rx) => {
              const pharmacyBill = getPharmacyBillForRx(rx);
              const isBillPaid = pharmacyBill?.status === 'PAID';
              const hasMedicines = (rx.items?.length || 0) > 0;
              const isDispensed = rx.status === 'DISPENSED';

              return (
                <TableRow key={rx.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell>
                    <span className="font-mono font-semibold text-primary">{rx.prescriptionNo}</span>
                    <div className="text-[0.65rem] text-muted-foreground font-mono">
                      {new Date(rx.createdAt).toLocaleDateString()}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="font-semibold text-foreground">
                      {rx.patient?.user
                        ? `${rx.patient.user.firstName} ${rx.patient.user.lastName}`.trim()
                        : 'Patient'}
                    </div>
                  </TableCell>

                  <TableCell>
                    {rx.doctor?.user
                      ? `Dr. ${[rx.doctor.user.firstName, rx.doctor.user.lastName].filter(Boolean).join(' ')}`
                      : 'Physician'}
                  </TableCell>

                  <TableCell>
                    {rx.items?.map((it, idx) => (
                      <div key={idx} className="mb-1 text-xs">
                        <span className="font-semibold text-primary">{it.medicineName}</span>
                        <span className="text-muted-foreground text-[0.7rem]">
                          {' '}
                          &bull; {it.dosage} &bull; {it.frequency} &bull; {it.durationDays} days
                        </span>
                      </div>
                    ))}
                    {(!rx.items || rx.items.length === 0) && (
                      <div className="text-xs text-muted-foreground italic">Lab orders only (no medications)</div>
                    )}
                    {rx.labTests && rx.labTests.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {rx.labTests.map((t, idx) => (
                          <Badge key={idx} variant="outline" className="text-[0.62rem] font-mono">
                            Lab: {t.testName}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {rx.doctorNotes && (
                      <div className="text-xs text-muted-foreground italic mt-1 font-mono">
                        Notes: {rx.doctorNotes}
                      </div>
                    )}
                  </TableCell>

                  {/* Dispense Status */}
                  <TableCell>
                    <StatusPill status={rx.status} />
                  </TableCell>

                  {/* Stage 2 Pharmacy Bill Status */}
                  <TableCell>
                    {pharmacyBill ? (
                      <div className="font-mono text-xs space-y-1">
                        <div className="font-bold text-foreground flex items-center gap-1.5 flex-wrap">
                          <span>${pharmacyBill.totalAmount.toFixed(2)}</span>
                          <Badge
                            variant={isBillPaid ? 'success' : 'warning'}
                            className="text-[0.62rem] font-mono uppercase"
                          >
                            {isBillPaid ? 'PAID' : 'PENDING'}
                          </Badge>
                        </div>
                        <div className="text-[0.65rem] text-muted-foreground">
                          {pharmacyBill.invoiceNumber}
                          {!isBillPaid ? ' • Awaiting Patient Payment' : ` • ${pharmacyBill.paymentMethod}`}
                        </div>
                      </div>
                    ) : isDispensed ? (
                      <span className="text-[0.7rem] font-mono text-muted-foreground">
                        Historical Dispensed
                      </span>
                    ) : !hasMedicines ? (
                      <span className="text-[0.7rem] font-mono text-muted-foreground">
                        No pharmacy items
                      </span>
                    ) : (
                      <div className="space-y-0.5">
                        <Badge variant="outline" className="text-[0.62rem] font-mono border-amber-500/40 bg-amber-500/10 text-amber-400">
                          UNBILLED
                        </Badge>
                        <div className="text-[0.65rem] text-muted-foreground font-mono">
                          Generate Medicine Bill required
                        </div>
                      </div>
                    )}
                  </TableCell>

                  {/* Two-Stage Pharmacy Actions */}
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      {isDispensed ? (
                        <span className="inline-flex items-center gap-1 text-[0.72rem] font-mono font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-md">
                          <CheckCircle2 size={12} /> Handed Over / Dispensed
                        </span>
                      ) : !hasMedicines ? (
                        <span className="text-xs text-muted-foreground font-mono">N/A (No meds)</span>
                      ) : !pharmacyBill ? (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            icon={<Receipt size={12} />}
                            disabled={loadingPreviewId === rx.id}
                            onClick={() => handleOpenBillingPreview(rx.id)}
                          >
                            {loadingPreviewId === rx.id ? 'Pricing...' : 'Generate Medicine Bill'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            icon={<Lock size={12} />}
                            title="Generate Medicine Bill & wait for Patient payment before dispensing"
                            className="opacity-50"
                          >
                            Hand Over / Dispense Medicines
                          </Button>
                        </>
                      ) : !isBillPaid ? (
                        <>
                          <span className="inline-flex items-center gap-1 text-[0.7rem] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-md">
                            <Clock size={11} /> Patient Payment Pending
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled
                            icon={<Lock size={12} />}
                            title={`Locked until patient settles Pharmacy Bill ${pharmacyBill.invoiceNumber} in Patient Portal`}
                            className="opacity-55"
                          >
                            Hand Over / Dispense Medicines
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<PackageCheck size={13} />}
                          disabled={dispensingRxId === rx.id}
                          onClick={() => handleDispense(rx, pharmacyBill)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500"
                        >
                          {dispensingRxId === rx.id
                            ? 'Dispensing...'
                            : 'Hand Over / Dispense Medicines'}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8 font-mono text-xs">
                  {loading ? 'Loading dispensary orders...' : 'No orders match the selected filter'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Generate Medicine Bill Modal (Inventory Price Sync) */}
      {billingPreview && (
        <Modal
          isOpen={true}
          onClose={() => setBillingPreview(null)}
          title={`Stage 2: Generate Medicine Bill — ${billingPreview.prescriptionNo}`}
        >
          <form onSubmit={handleGenerateMedicineBill} className="space-y-4">
            <div className="p-3 bg-muted/30 rounded-lg border border-border text-xs font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Patient:</span>
                <strong className="text-foreground">{billingPreview.patientName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prescribing Physician:</span>
                <span className="text-foreground">{billingPreview.doctorName}</span>
              </div>
              <div className="text-[0.68rem] text-sky-400 pt-1 border-t border-border/50 flex items-center gap-1.5">
                <AlertCircle size={12} />
                <span>Unit prices pulled live from Pharmacy Inventory; generated bill will be sent to Patient Portal as PENDING.</span>
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-muted/40 border-b border-border flex items-center justify-between text-[0.68rem] font-mono uppercase text-muted-foreground">
                <span>Prescribed Medicine & Inventory Match</span>
                <span>Qty × Inventory Price</span>
              </div>
              <div className="divide-y divide-border text-xs">
                {billingPreview.items.map((item, idx) => {
                  const qty = Math.max(
                    1,
                    Number(editableQuantities[item.medicineName] ?? item.quantity),
                  );
                  const lineTotal = qty * item.unitPrice;
                  const lowStock =
                    item.inInventory &&
                    item.stockQuantity !== null &&
                    item.stockQuantity !== undefined &&
                    qty > item.stockQuantity;

                  return (
                    <div key={idx} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="font-semibold text-foreground">
                          {item.medicineName}{' '}
                          <span className="text-muted-foreground font-normal">
                            ({item.dosage} • {item.frequency} • {item.durationDays}d)
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap text-[0.65rem] font-mono">
                          {item.inInventory ? (
                            <Badge variant="success" className="text-[0.6rem]">
                              Inventory: {item.matchedMedicineName} (${item.unitPrice.toFixed(2)}/unit • Stock:{' '}
                              {item.stockQuantity})
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="text-[0.6rem]">
                              Unlisted in Inventory • Standard Rate ${item.unitPrice.toFixed(2)}
                            </Badge>
                          )}
                          {lowStock && (
                            <span className="text-rose-400 font-semibold">
                              Qty exceeds current stock!
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 font-mono shrink-0 self-end sm:self-center">
                        <label className="text-[0.65rem] text-muted-foreground">Qty:</label>
                        <input
                          type="number"
                          min={1}
                          max={1000}
                          value={qty}
                          onChange={(e) =>
                            setEditableQuantities((prev) => ({
                              ...prev,
                              [item.medicineName]: Math.max(1, Number(e.target.value) || 1),
                            }))
                          }
                          className="w-16 bg-background border border-border rounded px-2 py-1 text-xs text-foreground text-center"
                        />
                        <span className="text-muted-foreground text-[0.7rem]">
                          × ${item.unitPrice.toFixed(2)} =
                        </span>
                        <span className="font-bold text-foreground min-w-[64px] text-right">
                          ${lineTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <FormRow columns={3}>
              <FormGroup label="Dispensing Tax (%)">
                <input
                  type="number"
                  min={0}
                  max={30}
                  step="0.5"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
                />
              </FormGroup>

              <FormGroup label="Discount ($)">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                />
              </FormGroup>

              <div className="p-3 bg-muted/30 rounded-lg border border-border flex flex-col justify-center font-mono text-right">
                <div className="text-[0.68rem] text-muted-foreground">Pharmacy Bill Total:</div>
                <div className="text-lg font-bold text-foreground">${previewTotal.toFixed(2)}</div>
              </div>
            </FormRow>

            <div className="modal-footer flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-3 border-t border-border">
              <Button variant="ghost" type="button" size="md" onClick={() => setBillingPreview(null)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={submittingBill}
                icon={<ArrowRight size={14} />}
                className="w-full sm:w-auto"
              >
                {submittingBill ? 'Generating...' : 'Generate Medicine Bill (Send to Patient)'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
