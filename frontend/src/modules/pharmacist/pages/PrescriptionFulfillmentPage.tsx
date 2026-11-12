import React, { useEffect, useState } from 'react';
import {
  Pill,
  CheckCircle2,
  Receipt,
  CreditCard,
  Check,
  Clock,
  ArrowRight,
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
import type { Prescription, Bill } from '../../../shared/types';
import { useAuth } from '../../../shared/context/AuthContext';

export const PrescriptionFulfillmentPage: React.FC<{ onNavigateToBilling?: () => void }> = () => {
  const { showToast, currentUser } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ISSUED' | 'DISPENSED'>('ALL');

  // Billing Modal State
  const [billingRx, setBillingRx] = useState<Prescription | null>(null);
  const [billItems, setBillItems] = useState<{ description: string; quantity: number; unitPrice: number; total: number }[]>([]);
  const [taxRate, setTaxRate] = useState<number>(5);

  // Payment Option Modal State
  const [payingBill, setPayingBill] = useState<{
    billId: string;
    invoiceNumber: string;
    patientName: string;
    totalAmount: number;
    paidAmount: number;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI' | 'ONLINE' | 'INSURANCE'>('CASH');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rxData, billData] = await Promise.all([
        api.getPrescriptions(),
        api.getBills(),
      ]);
      setPrescriptions(rxData);
      setBills(billData);
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleDispense = async (rx: Prescription) => {
    try {
      const itemNames = rx.items.map((i) => i.medicineName);
      await api.dispensePrescription(
        rx.id,
        currentUser?.id || '6adf77ce6db62658693e3198',
        itemNames,
        'Full fulfillment dispensed by clinical pharmacist',
      );
      showToast(`Prescription ${rx.prescriptionNo} marked as dispensed`);
      loadData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleOpenBilling = (rx: Prescription) => {
    setBillingRx(rx);
    // Pre-calculate items: doctor consultation + prescribed medicines
    const items = [
      {
        description: `Physician Consultation Fee — ${rx.doctor?.user ? `Dr. ${rx.doctor.user.lastName}` : 'Physician'}`,
        quantity: 1,
        unitPrice: 75.0,
        total: 75.0,
      },
    ];

    for (const item of rx.items) {
      const price = 25.0; // default medication charge
      items.push({
        description: `${item.medicineName} (${item.dosage}) &bull; ${item.durationDays} days supply`,
        quantity: 1,
        unitPrice: price,
        total: price,
      });
    }

    setBillItems(items);
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingRx) return;

    try {
      const subtotal = billItems.reduce((acc, it) => acc + it.total, 0);
      const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));

      const newBill = await api.createBill({
        patientId: billingRx.patientId,
        items: billItems,
        subtotal,
        taxAmount,
        discountAmount: 0,
        paymentMethod: 'CASH',
      });

      showToast(`Hospital invoice ${newBill.invoiceNumber} generated! Payment option now available.`);
      setBillingRx(null);
      await loadData();

      // Immediately open payment option modal for this generated bill
      setPayingBill({
        billId: newBill.id,
        invoiceNumber: newBill.invoiceNumber,
        patientName: billingRx.patient?.user
          ? `${billingRx.patient.user.firstName} ${billingRx.patient.user.lastName}`
          : 'Patient',
        totalAmount: newBill.totalAmount,
        paidAmount: 0,
      });
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingBill) return;

    try {
      await api.recordPayment(payingBill.billId, payingBill.totalAmount, paymentMethod);
      showToast(`Payment of $${payingBill.totalAmount.toFixed(2)} recorded for ${payingBill.invoiceNumber} via ${paymentMethod}! Status: PAID`);
      setPayingBill(null);
      loadData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const filtered =
    filter === 'ALL'
      ? prescriptions
      : prescriptions.filter((r) => r.status === filter);

  return (
    <div className="space-y-6 w-full">
      <Card
        title="Pharmacist Dispensary Queue, Billing & Invoicing"
        subtitle="Validate physician prescription orders, dispense medications, generate hospital bills, and process payments"
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
              <TableHead>Hospital Bill & Payment</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((rx) => {
              // Find if this patient has a generated bill
              const patientBill = bills.find((b) => b.patientId === rx.patientId);
              const isBillPaid = patientBill?.status === 'PAID';

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
                        ? `${rx.patient.user.firstName} ${rx.patient.user.lastName}`
                        : 'Patient'}
                    </div>
                  </TableCell>

                  <TableCell>
                    {rx.doctor?.user ? `Dr. ${rx.doctor.user.lastName}` : 'Physician'}
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

                  {/* Hospital Bill & Payment Status */}
                  <TableCell>
                    {patientBill ? (
                      <div className="font-mono text-xs">
                        <div className="font-bold text-foreground flex items-center gap-1.5">
                          <span>${patientBill.totalAmount.toFixed(2)}</span>
                          <Badge
                            variant={isBillPaid ? 'success' : 'warning'}
                            className="text-[0.62rem]"
                          >
                            {patientBill.status}
                          </Badge>
                        </div>
                        <div className="text-[0.65rem] text-muted-foreground mt-0.5">
                          {patientBill.invoiceNumber} &bull; {patientBill.paymentMethod}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs italic font-mono">Bill not created</span>
                    )}
                  </TableCell>

                  {/* Actions Column */}
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Dispense action */}
                      {rx.status !== 'DISPENSED' ? (
                        <Button variant="primary" size="sm" onClick={() => handleDispense(rx)}>
                          Dispense
                        </Button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[0.7rem] font-medium text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-md">
                          <CheckCircle2 size={11} /> Dispensed
                        </span>
                      )}

                      {/* Make Bill action */}
                      {!patientBill ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Receipt size={12} />}
                          onClick={() => handleOpenBilling(rx)}
                        >
                          Make Bill
                        </Button>
                      ) : !isBillPaid ? (
                        /* Payment option shown */
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<CreditCard size={12} />}
                          onClick={() =>
                            setPayingBill({
                              billId: patientBill.id,
                              invoiceNumber: patientBill.invoiceNumber,
                              patientName: rx.patient?.user
                                ? `${rx.patient.user.firstName} ${rx.patient.user.lastName}`
                                : 'Patient',
                              totalAmount: patientBill.totalAmount,
                              paidAmount: patientBill.paidAmount || 0,
                            })
                          }
                        >
                          Pay Now
                        </Button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[0.7rem] font-medium text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-md">
                          <Check size={11} /> Settled
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted py-8">
                  No orders match the selected filter
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Make Bill Modal */}
      {billingRx && (
        <Modal
          isOpen={true}
          onClose={() => setBillingRx(null)}
          title={`Generate Hospital Bill for ${
            billingRx.patient?.user
              ? `${billingRx.patient.user.firstName} ${billingRx.patient.user.lastName}`
              : 'Patient'
          }`}
        >
          <form onSubmit={handleCreateBill} className="space-y-4">
            <div className="p-3 bg-muted/30 rounded-lg border border-border text-xs font-mono">
              <div className="text-muted-foreground">
                Prescription: <strong className="text-foreground">{billingRx.prescriptionNo}</strong>
              </div>
              <div className="text-muted-foreground">
                Physician: Dr. {billingRx.doctor?.user?.lastName || 'Consultant'}
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-muted/40 border-b border-border flex items-center justify-between text-xs font-mono uppercase text-muted-foreground">
                <span>Bill Item Description</span>
                <span>Amount ($)</span>
              </div>
              <div className="divide-y divide-border text-xs">
                {billItems.map((item, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between">
                    <span className="text-foreground">{item.description}</span>
                    <span className="font-mono text-foreground">${item.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <FormRow columns={2}>
              <FormGroup label="Tax / Dispensing Fee (%)">
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                />
              </FormGroup>

              <div className="p-3 bg-muted/30 rounded-lg border border-border flex flex-col justify-center font-mono text-right">
                <div className="text-[0.68rem] text-muted-foreground">Total Billed:</div>
                <div className="text-lg font-bold text-foreground">
                  ${(
                    billItems.reduce((acc, it) => acc + it.total, 0) * (1 + taxRate / 100)
                  ).toFixed(2)}
                </div>
              </div>
            </FormRow>

            <div className="modal-footer pt-3 border-t border-border">
              <Button variant="ghost" onClick={() => setBillingRx(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" icon={<ArrowRight size={14} />}>
                Generate Invoice & Show Payment Option
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Payment Option Modal */}
      {payingBill && (
        <Modal
          isOpen={true}
          onClose={() => setPayingBill(null)}
          title={`Hospital Cashier: Settle Payment for ${payingBill.invoiceNumber}`}
        >
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="p-3 bg-muted/30 rounded-lg border border-border font-mono text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Number:</span>
                <strong className="text-foreground">{payingBill.invoiceNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Patient:</span>
                <span className="text-foreground">{payingBill.patientName}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-border">
                <span>Total Amount Due:</span>
                <span className="text-emerald-400">${payingBill.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <FormGroup label="Select Payment Method">
              <select
                value={paymentMethod}
                onChange={(e: any) => setPaymentMethod(e.target.value)}
                required
              >
                <option value="CASH">Cash (Dispensary Counter)</option>
                <option value="CARD">Credit / Debit Card</option>
                <option value="UPI">UPI / Instant QR Scan</option>
                <option value="ONLINE">Online Portal Payment</option>
                <option value="INSURANCE">Health Insurance</option>
              </select>
            </FormGroup>

            <div className="p-3 bg-muted/40 border border-border rounded-lg flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <Clock size={13} className="text-primary" />
              <span>Full amount of ${payingBill.totalAmount.toFixed(2)} will be marked as paid.</span>
            </div>

            <div className="modal-footer pt-3 border-t border-border">
              <Button variant="ghost" onClick={() => setPayingBill(null)}>
                Pay Later
              </Button>
              <Button type="submit" variant="primary" icon={<CheckCircle2 size={14} />}>
                Confirm & Mark Invoice PAID
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
