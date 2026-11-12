import React, { useEffect, useMemo, useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Receipt,
  Pill,
  CreditCard,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Calendar,
  PackageCheck,
} from 'lucide-react';
import {
  Card,
  KPICard,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  StatusPill,
  Button,
  Modal,
} from '../../../shared/ui';
import { Badge } from '@/components/ui/badge';
import { api } from '../../../shared/api';
import type { PharmacySalesLedger, PharmacySalesTransaction } from '../../../shared/types';
import { useAuth } from '../../../shared/context/AuthContext';

export const SalesRevenueLedgerPage: React.FC = () => {
  const { showToast } = useAuth();
  const [ledger, setLedger] = useState<PharmacySalesLedger | null>(null);
  const [loading, setLoading] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'LAST_30_DAYS' | 'LAST_7_DAYS'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTxIds, setExpandedTxIds] = useState<Record<string, boolean>>({});
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<PharmacySalesTransaction | null>(null);

  useEffect(() => {
    loadSalesLedger();
  }, []);

  const loadSalesLedger = async () => {
    setLoading(true);
    try {
      const data = await api.getPharmacySalesLedger();
      setLedger(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load pharmacy sales ledger', true);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandTx = (id: string) => {
    setExpandedTxIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredTransactions = useMemo(() => {
    if (!ledger) return [];
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const q = searchQuery.trim().toLowerCase();

    return ledger.transactions.filter((tx) => {
      if (periodFilter === 'LAST_30_DAYS' && !tx.isLastMonth) return false;
      if (periodFilter === 'LAST_7_DAYS') {
        const refTs = new Date(tx.paidAt || tx.createdAt).getTime();
        if (now - refTs > sevenDaysMs) return false;
      }

      if (statusFilter === 'PAID' && tx.status !== 'PAID') return false;
      if (statusFilter === 'PENDING' && tx.status === 'PAID') return false;

      if (q) {
        const medText = tx.items
          .map((i) => `${i.medicineName} ${i.catalogName || ''} ${i.description}`)
          .join(' ')
          .toLowerCase();
        const hay = `${tx.invoiceNumber} ${tx.prescription?.prescriptionNo || ''} ${tx.patient.name} ${tx.patient.email || ''} ${tx.paymentMethod} ${medText}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [ledger, periodFilter, statusFilter, searchQuery]);

  const filteredRevenueSummary = useMemo(() => {
    const paid = filteredTransactions.filter((t) => t.status === 'PAID');
    const revenue = paid.reduce((sum, t) => sum + t.paidAmount, 0);
    const units = paid.reduce(
      (sum, t) => sum + t.items.reduce((s, it) => s + it.quantity, 0),
      0,
    );
    return {
      count: filteredTransactions.length,
      paidCount: paid.length,
      revenue,
      units,
    };
  }, [filteredTransactions]);

  const summary = ledger?.summary;
  const lastMonth = summary?.lastMonth;
  const overall = summary?.overall;

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      {/* Header Banner */}
      <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp size={17} className="text-emerald-400" />
            <h2 className="text-sm font-bold tracking-tight text-foreground">
              Pharmacy Sales &amp; Revenue Ledger
            </h2>
            <Badge variant="outline" className="text-[0.65rem] font-mono border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              PHARMACIST ANALYTICS
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Complete medicine payment history, itemized prescription billings, and last-month vs. overall sales performance.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadSalesLedger}
          icon={<RefreshCw size={13} className={loading ? 'animate-spin' : ''} />}
        >
          Refresh Ledger
        </Button>
      </div>

      {/* KPI Row: Last Month + Overall Sales Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard
          label="Last Month Sales (30d)"
          value={`$${(lastMonth?.totalRevenue ?? 0).toFixed(2)}`}
          subtext={`${lastMonth?.paidTransactionsCount ?? 0} settled orders • ${lastMonth?.totalUnitsSold ?? 0} units sold`}
          icon={<Calendar size={16} />}
        />
        <KPICard
          label="Overall Total Sales"
          value={`$${(overall?.totalRevenue ?? 0).toFixed(2)}`}
          subtext={`${overall?.paidTransactionsCount ?? 0} paid bills • Avg $${(overall?.averageOrderValue ?? 0).toFixed(2)}`}
          icon={<DollarSign size={16} />}
        />
        <KPICard
          label="Total Medicines Sold"
          value={overall?.totalUnitsSold ?? 0}
          subtext={`${lastMonth?.totalUnitsSold ?? 0} units in last 30 days`}
          icon={<Pill size={16} />}
        />
        <KPICard
          label="Pending Pharmacy Dues"
          value={`$${(overall?.pendingRevenue ?? 0).toFixed(2)}`}
          subtext={`${overall?.pendingTransactionsCount ?? 0} unpaid bills awaiting settlement`}
          icon={<Clock size={16} />}
        />
      </div>

      {/* Analytics Row: Medicine Breakdown & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-w-0">
        {/* Medicine-Wise Sales Breakdown */}
        <div className="lg:col-span-2 min-w-0">
          <Card
            title="Medicine-Wise Sales & Revenue Breakdown"
            subtitle="Settled dispensary revenue aggregated by medication across last 30 days and overall history"
            icon={<Pill size={18} />}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine Sold</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Units (30d / All)</TableHead>
                  <TableHead>Avg Unit Price</TableHead>
                  <TableHead>Last Month</TableHead>
                  <TableHead>Overall Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(ledger?.medicineBreakdown || []).map((med, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <div className="font-semibold text-foreground">{med.medicineName}</div>
                      <div className="text-[0.65rem] font-mono text-muted-foreground">
                        Last sold: {new Date(med.lastSoldAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{med.transactionsCount}</TableCell>
                    <TableCell className="font-mono text-xs">
                      <span className="text-emerald-400 font-semibold">{med.lastMonthUnitsSold}</span>
                      <span className="text-muted-foreground"> / {med.totalUnitsSold} units</span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      ${med.averageUnitPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-sky-400">
                      ${med.lastMonthRevenue.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-emerald-400">
                      ${med.totalRevenue.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                {(ledger?.medicineBreakdown || []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8 font-mono text-xs">
                      {loading ? 'Loading medicine sales analytics...' : 'No settled medicine sales recorded yet'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Payment Method & Collection Channels */}
        <div className="min-w-0">
          <Card
            title="Payment Channels & Totals"
            subtitle="Settled pharmacy payments by method"
            icon={<CreditCard size={18} />}
          >
            <div className="space-y-4">
              {(ledger?.paymentMethodBreakdown || []).map((pm) => {
                const overallRev = Math.max(0.01, overall?.totalRevenue || 0);
                const share = Math.min(100, Math.round((pm.totalRevenue / overallRev) * 100));
                return (
                  <div key={pm.paymentMethod} className="p-3 rounded-lg border border-border bg-muted/20 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-foreground">{pm.paymentMethod}</span>
                      <span className="font-bold text-emerald-400">${pm.totalRevenue.toFixed(2)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[0.65rem] font-mono text-muted-foreground">
                      <span>{pm.transactionsCount} paid invoices</span>
                      <span>{share}% share</span>
                    </div>
                  </div>
                );
              })}

              {(ledger?.paymentMethodBreakdown || []).length === 0 && (
                <div className="text-center text-muted-foreground py-6 font-mono text-xs">
                  No settled payment transactions yet
                </div>
              )}

              <div className="pt-3 border-t border-border space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Billed (All Invoices):</span>
                  <span className="font-semibold text-foreground">${(overall?.totalBilled ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Collected Revenue:</span>
                  <span className="font-bold text-emerald-400">${(overall?.totalRevenue ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pending Receivables:</span>
                  <span className="font-semibold text-amber-400">${(overall?.pendingRevenue ?? 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Complete Payment History & Itemized Transactions Ledger */}
      <Card
        title="Complete Medicine Payment History & Itemized Transactions"
        subtitle="Inspect every pharmacy invoice, settlement timestamp, payment method, and line-item medicine breakdown"
        icon={<Receipt size={18} />}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[0.7rem] font-mono text-muted-foreground">
              Showing {filteredRevenueSummary.count} invoices • Collected ${filteredRevenueSummary.revenue.toFixed(2)}
            </span>
          </div>
        }
      >
        {/* Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 mb-4 border-b border-border min-w-0 max-w-full">
          <div className="relative flex-1 min-w-0 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search invoice no, Rx number, patient, or medicine name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
            {/* Period Filter */}
            <div className="flex flex-wrap items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border max-w-full">
              {(
                [
                  { id: 'ALL', label: 'All Time' },
                  { id: 'LAST_30_DAYS', label: 'Last Month (30d)' },
                  { id: 'LAST_7_DAYS', label: 'Last 7 Days' },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriodFilter(p.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                    periodFilter === p.id
                      ? 'bg-foreground text-background shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex flex-wrap items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border max-w-full">
              {(['ALL', 'PAID', 'PENDING'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold cursor-pointer transition-colors ${
                    statusFilter === st
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice &amp; Date</TableHead>
              <TableHead>Patient &amp; Prescription</TableHead>
              <TableHead>Itemized Medicines Sold</TableHead>
              <TableHead>Payment Channel</TableHead>
              <TableHead>Amount Breakdown</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Breakdown</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((tx) => {
              const isExpanded = Boolean(expandedTxIds[tx.id]);
              const isPaid = tx.status === 'PAID';
              const txDate = tx.paidAt || tx.createdAt;

              return (
                <React.Fragment key={tx.id}>
                  <TableRow className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="font-mono font-bold text-primary text-xs">
                        {tx.invoiceNumber}
                      </div>
                      <div className="text-[0.68rem] font-mono text-muted-foreground mt-0.5">
                        {isPaid ? 'Paid: ' : 'Issued: '}
                        {new Date(txDate).toLocaleString()}
                      </div>
                      {tx.isLastMonth && (
                        <span className="inline-block mt-1 text-[0.6rem] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30">
                          Last 30d
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="font-semibold text-foreground text-xs">
                        {tx.patient.name}
                      </div>
                      {tx.prescription ? (
                        <div className="text-[0.68rem] font-mono text-muted-foreground mt-0.5 space-y-0.5">
                          <div>
                            <span className="text-primary font-semibold">
                              {tx.prescription.prescriptionNo}
                            </span>{' '}
                            &bull; {tx.prescription.doctorName}
                          </div>
                          {tx.dispensedAt && (
                            <div className="inline-flex items-center gap-1 text-emerald-400">
                              <PackageCheck size={10} />
                              Handed over {new Date(tx.dispensedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-[0.68rem] font-mono text-muted-foreground">
                          Direct Pharmacy Bill
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1 max-w-sm">
                        {tx.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="text-xs flex items-center justify-between gap-2 bg-muted/30 border border-border/60 rounded px-2 py-1"
                          >
                            <span className="truncate font-medium text-foreground">
                              {item.catalogName || item.medicineName}
                              {item.regimenDetails && (
                                <span className="text-muted-foreground font-normal ml-1 text-[0.65rem]">
                                  ({item.regimenDetails})
                                </span>
                              )}
                            </span>
                            <span className="font-mono text-[0.68rem] text-muted-foreground shrink-0">
                              {item.quantity} &times; ${item.unitPrice.toFixed(2)} ={' '}
                              <strong className="text-foreground">${item.total.toFixed(2)}</strong>
                            </span>
                          </div>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[0.65rem] uppercase">
                        {tx.paymentMethod}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="font-mono text-xs space-y-0.5">
                        <div className="font-bold text-foreground text-sm">
                          ${tx.totalAmount.toFixed(2)}
                        </div>
                        <div className="text-[0.65rem] text-muted-foreground">
                          Sub: ${tx.subtotal.toFixed(2)}
                          {tx.taxAmount > 0 ? ` • Tax: $${tx.taxAmount.toFixed(2)}` : ''}
                          {tx.discountAmount > 0 ? ` • Disc: -$${tx.discountAmount.toFixed(2)}` : ''}
                        </div>
                        <div
                          className={`text-[0.65rem] font-semibold ${
                            isPaid ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          Paid: ${tx.paidAmount.toFixed(2)}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <StatusPill status={tx.status} />
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleExpandTx(tx.id)}
                          icon={isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        >
                          {isExpanded ? 'Hide' : 'Items'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedReceiptTx(tx)}
                        >
                          Receipt
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Inline Expandable Itemized Transaction Breakdown */}
                  {isExpanded && (
                    <TableRow className="bg-muted/20">
                      <TableCell colSpan={7} className="p-4">
                        <div className="rounded-lg border border-border bg-card p-3 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono border-b border-border pb-2">
                            <span className="font-bold text-foreground">
                              Itemized Transaction Breakdown — {tx.invoiceNumber}
                            </span>
                            <span className="text-muted-foreground">
                              Patient: {tx.patient.name} ({tx.patient.email || '—'})
                            </span>
                          </div>

                          <div className="divide-y divide-border text-xs">
                            {tx.items.map((it, i) => (
                              <div key={i} className="py-2 flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <div className="font-semibold text-foreground">
                                    {it.catalogName || it.medicineName}
                                  </div>
                                  <div className="text-[0.68rem] font-mono text-muted-foreground">
                                    {it.description}
                                  </div>
                                </div>
                                <div className="font-mono text-right">
                                  <span className="text-muted-foreground">
                                    Qty {it.quantity} &times; ${it.unitPrice.toFixed(2)} ={' '}
                                  </span>
                                  <strong className="text-foreground">${it.total.toFixed(2)}</strong>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="pt-2 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                            <span className="text-muted-foreground">
                              Payment Method: <strong className="text-foreground">{tx.paymentMethod}</strong>
                              {tx.paidAt && ` • Settled on ${new Date(tx.paidAt).toLocaleString()}`}
                            </span>
                            <div className="flex items-center gap-4">
                              <span>Subtotal: ${tx.subtotal.toFixed(2)}</span>
                              <span>Tax: ${tx.taxAmount.toFixed(2)}</span>
                              {tx.discountAmount > 0 && <span>Discount: -${tx.discountAmount.toFixed(2)}</span>}
                              <strong className="text-emerald-400">
                                Total Paid: ${tx.paidAmount.toFixed(2)}
                              </strong>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}

            {filteredTransactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-10 font-mono text-xs">
                  {loading
                    ? 'Loading pharmacy sales transactions...'
                    : 'No medicine sales transactions match the selected filters'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Itemized Transaction Receipt Modal */}
      {selectedReceiptTx && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedReceiptTx(null)}
          title={`Pharmacy Sales Receipt — ${selectedReceiptTx.invoiceNumber}`}
        >
          <div className="space-y-4 text-xs font-mono">
            <div className="p-3 rounded-lg border border-border bg-muted/30 space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Patient:</span>
                <strong className="text-foreground">{selectedReceiptTx.patient.name}</strong>
              </div>
              {selectedReceiptTx.prescription && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prescription:</span>
                  <span className="text-foreground">
                    {selectedReceiptTx.prescription.prescriptionNo} ({selectedReceiptTx.prescription.doctorName})
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Status:</span>
                <span className={selectedReceiptTx.status === 'PAID' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {selectedReceiptTx.status} ({selectedReceiptTx.paymentMethod})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span className="text-foreground">
                  {new Date(selectedReceiptTx.paidAt || selectedReceiptTx.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <div className="px-3 py-2 bg-muted/40 border-b border-border flex justify-between text-[0.65rem] uppercase text-muted-foreground">
                <span>Medicine Line Item</span>
                <span>Qty &times; Price = Total</span>
              </div>
              <div className="divide-y divide-border">
                {selectedReceiptTx.items.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-foreground">
                        {item.catalogName || item.medicineName}
                      </div>
                      {item.regimenDetails && (
                        <div className="text-[0.65rem] text-muted-foreground">
                          {item.regimenDetails}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-muted-foreground">
                        {item.quantity} &times; ${item.unitPrice.toFixed(2)} ={' '}
                      </span>
                      <strong className="text-foreground">${item.total.toFixed(2)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-1 text-right">
              <div>Subtotal: ${selectedReceiptTx.subtotal.toFixed(2)}</div>
              <div>Tax: ${selectedReceiptTx.taxAmount.toFixed(2)}</div>
              {selectedReceiptTx.discountAmount > 0 && (
                <div>Discount: -${selectedReceiptTx.discountAmount.toFixed(2)}</div>
              )}
              <div className="text-sm font-bold text-foreground pt-1 border-t border-border">
                Total Invoice: ${selectedReceiptTx.totalAmount.toFixed(2)} &bull; Paid: $
                {selectedReceiptTx.paidAmount.toFixed(2)}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedReceiptTx(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<CheckCircle2 size={13} />}
                onClick={() => window.print()}
              >
                Print Receipt
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

