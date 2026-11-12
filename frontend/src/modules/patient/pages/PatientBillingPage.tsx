import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  DollarSign,
  Receipt,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Pill,
  Lock,
  PackageCheck,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '../../../shared/ui';
import { api } from '../../../shared/api';
import type { Bill, BillingSummaryResponse } from '../../../shared/types';
import { useAuth } from '../../../shared/context/AuthContext';

export const PatientBillingPage: React.FC = () => {
  const { showToast, role, currentUser } = useAuth();
  const [summary, setSummary] = useState<BillingSummaryResponse | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);

  useEffect(() => {
    loadBills();
  }, [currentUser?.id, role]);

  const loadBills = async () => {
    setLoading(true);
    try {
      if (role === 'PATIENT') {
        const data = await api.getMyBillingSummary();
        setSummary(data);
        setBills(data.bills || []);
        setExpandedBillId(
          (prev) =>
            prev ||
            data.bills?.find((b) => b.status !== 'PAID')?.id ||
            data.bills?.[0]?.id ||
            null,
        );
      } else {
        setSummary(null);
        const list = await api.getBills();
        setBills(list);
        setExpandedBillId(
          (prev) =>
            prev ||
            list.find((b) => b.status !== 'PAID')?.id ||
            list[0]?.id ||
            null,
        );
      }
    } catch (err: any) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (bill: Bill) => {
    setPayingId(bill.id);
    try {
      const remaining = Math.max(0.01, Number((bill.totalAmount - (bill.paidAmount || 0)).toFixed(2)));
      await api.recordPayment(bill.id, remaining);
      if (bill.billType === 'CONSULTATION') {
        showToast(`Consultation Fee ${bill.invoiceNumber} PAID — booking confirmed!`);
      } else if (bill.billType === 'PHARMACY') {
        showToast(`Pharmacy Bill ${bill.invoiceNumber} PAID — dispensary handover unlocked!`);
      } else {
        showToast(`Invoice ${bill.invoiceNumber} paid in full`);
      }
      loadBills();
    } catch (err: any) {
      showToast(err.message, true);
    } finally {
      setPayingId(null);
    }
  };

  const consultationBills =
    summary?.consultationBills || bills.filter((b) => b.billType === 'CONSULTATION' || !b.billType);
  const pharmacyBills =
    summary?.pharmacyBills || bills.filter((b) => b.billType === 'PHARMACY');
  const otherBills =
    summary?.otherBills || bills.filter((b) => b.billType === 'OTHER');

  const pendingTotal =
    summary?.remainingDue ??
    bills
      .filter((b) => b.status !== 'PAID')
      .reduce((sum, b) => sum + (b.totalAmount - (b.paidAmount || 0)), 0);

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'PAID') {
      return (
        <Badge variant="success" className="gap-1.5 uppercase font-mono text-[0.65rem]">
          <CheckCircle2 size={11} />
          PAID
        </Badge>
      );
    }
    if (s === 'PARTIALLY_PAID') {
      return (
        <Badge variant="info" className="gap-1.5 uppercase font-mono text-[0.65rem]">
          <Clock size={11} />
          PARTIAL
        </Badge>
      );
    }
    return (
      <Badge variant="warning" className="gap-1.5 uppercase font-mono text-[0.65rem]">
        <Clock size={11} />
        PENDING
      </Badge>
    );
  };

  const renderBillSection = (
    title: string,
    description: string,
    icon: React.ReactNode,
    sectionBills: Bill[],
    emptyText: string,
    stageTag: 'CONSULTATION' | 'PHARMACY' | 'OTHER',
  ) => (
    <Card className="hover:border-primary/40 transition-all duration-300">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div>
            <CardTitle className="text-base font-bold tracking-tight flex items-center gap-2">
              <span>{title}</span>
              <Badge variant="outline" className="font-mono text-[0.65rem]">
                {sectionBills.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              {description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {sectionBills.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground font-mono">
            {emptyText}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                <TableHead className="font-semibold text-muted-foreground">Invoice No</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Description</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Date</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Total Due</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Gate State</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Payment Status</TableHead>
                <TableHead className="font-semibold text-muted-foreground text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sectionBills.map((b) => {
                const isExpanded = expandedBillId === b.id;
                const docUser = b.prescription?.doctor?.user || b.appointment?.doctor?.user;
                const docName = docUser ? `Dr. ${docUser.firstName} ${docUser.lastName}` : null;
                const isPaid = b.status === 'PAID';
                const isDispensed = b.prescription?.status === 'DISPENSED';

                return (
                  <React.Fragment key={b.id}>
                    <TableRow className="border-b border-border/60 hover:bg-muted/40 transition-colors">
                      <TableCell className="py-3.5">
                        <span className="font-mono font-bold text-primary text-xs px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                          {b.invoiceNumber}
                        </span>
                      </TableCell>
                      <TableCell className="py-3.5 text-xs text-foreground font-medium">
                        <div>
                          {stageTag === 'PHARMACY'
                            ? `${b.prescription?.prescriptionNo || 'Rx'} • ${docName || 'Dispensary Medications'}`
                            : docName
                            ? `${docName} • Consultation Fee`
                            : b.items?.[0]?.description || 'Clinical Service'}
                        </div>
                        <div className="text-[0.65rem] text-muted-foreground font-mono">
                          {b.items?.length || 0} line {(b.items?.length || 0) === 1 ? 'item' : 'items'}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 font-mono text-[0.7rem] text-muted-foreground">
                        {new Date(b.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="py-3.5 font-mono font-bold text-xs text-foreground">
                        ${b.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="py-3.5 text-xs">
                        {stageTag === 'CONSULTATION' ? (
                          <Badge variant={isPaid ? 'success' : 'warning'} className="font-mono text-[0.65rem]">
                            {isPaid ? 'Confirmed' : 'Awaiting Payment'}
                          </Badge>
                        ) : stageTag === 'PHARMACY' ? (
                          isDispensed ? (
                            <Badge variant="success" className="gap-1 font-mono text-[0.65rem]">
                              <PackageCheck size={10} /> Handed Over
                            </Badge>
                          ) : isPaid ? (
                            <Badge variant="info" className="font-mono text-[0.65rem]">
                              Ready for Handover
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="gap-1 font-mono text-[0.65rem]">
                              <Lock size={10} /> Dispense Locked
                            </Badge>
                          )
                        ) : (
                          <span className="text-[0.68rem] font-mono text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3.5">{getStatusBadge(b.status)}</TableCell>
                      <TableCell className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setExpandedBillId(isExpanded ? null : b.id)}
                            className="gap-1 text-xs font-mono cursor-pointer"
                          >
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            <span>Items ({b.items?.length || 0})</span>
                          </Button>
                          {!isPaid ? (
                            <Button
                              size="sm"
                              className="gap-1.5 shadow-xs cursor-pointer"
                              disabled={payingId === b.id}
                              onClick={() => handlePay(b)}
                            >
                              <DollarSign size={13} />
                              <span>{payingId === b.id ? 'Processing...' : 'Pay Now'}</span>
                            </Button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[0.68rem] font-mono text-emerald-400 font-semibold px-2">
                              <CheckCircle2 size={12} />
                              Settled
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-muted/20 hover:bg-muted/20">
                        <TableCell colSpan={7} className="p-3.5">
                          <div className="rounded-lg border border-border/70 bg-background/70 divide-y divide-border/50 text-xs">
                            {(b.items || []).map((item, idx) => (
                              <div key={idx} className="px-3 py-2 flex items-center justify-between gap-4">
                                <span className="text-foreground">{item.description}</span>
                                <span className="font-mono text-muted-foreground shrink-0">
                                  {item.quantity} × ${item.unitPrice.toFixed(2)} ={' '}
                                  <strong className="text-foreground">${item.total.toFixed(2)}</strong>
                                </span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-xs">
              <CreditCard size={20} />
            </div>
            <div>
              <CardTitle className="text-lg font-bold tracking-tight">Two-Stage Billing & Payment Ledger</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Stage 1 Consultation Fees confirm appointment bookings; Stage 2 Pharmacy Dues unlock dispensary medicine handover
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[0.68rem] text-muted-foreground uppercase font-mono">Total Unpaid Dues</div>
              <div className="text-sm font-mono font-bold text-foreground">
                ${pendingTotal.toFixed(2)}
              </div>
            </div>
            <Badge variant="outline" className="font-mono text-xs px-2.5 py-1">
              {bills.length} Bills
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <Card className="p-8 text-center text-xs text-muted-foreground font-mono">
          Loading hospital billing statements...
        </Card>
      ) : bills.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={<Receipt size={26} />}
            title="No Billing Invoices"
            description="Consultation Fee bills are created when you book a doctor, and Pharmacy bills are generated by the Pharmacist when preparing prescriptions."
          />
        </Card>
      ) : (
        <>
          {renderBillSection(
            'Stage 1 • Consultation Fees',
            'Upfront consultation fee charges required before pending bookings confirm',
            <Stethoscope size={18} />,
            consultationBills,
            'No Consultation Fee invoices on record.',
            'CONSULTATION',
          )}
          {renderBillSection(
            'Stage 2 • Pharmacy Dues',
            'Prescription medication invoices from dispensary inventory — must be PAID before medicine handover',
            <Pill size={18} />,
            pharmacyBills,
            'No Pharmacy medication bills issued yet.',
            'PHARMACY',
          )}
          {otherBills.length > 0 &&
            renderBillSection(
              'Other Hospital Invoices',
              'Additional hospital charges & adjustments',
              <Receipt size={18} />,
              otherBills,
              '',
              'OTHER',
            )}
        </>
      )}
    </div>
  );
};
