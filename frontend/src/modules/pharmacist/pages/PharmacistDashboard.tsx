import React, { useEffect, useState } from 'react';
import {
  Pill,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Receipt,
  Lock,
  Clock,
  PackageCheck,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { Card, KPICard, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Button, Badge } from '../../../shared/ui';
import { api } from '../../../shared/api';
import type { Bill, Medicine, PharmacySalesLedger, Prescription } from '../../../shared/types';
import { useAuth } from '../../../shared/context/AuthContext';

export const PharmacistDashboard: React.FC<{
  onNavigateToFulfillment?: (rxId?: string) => void;
  onNavigateToSales?: () => void;
  onNavigateToInventory?: () => void;
  onAddMedicineClick?: () => void;
  refreshTrigger?: number;
}> = ({
  onNavigateToFulfillment,
  onNavigateToSales,
  onNavigateToInventory,
  onAddMedicineClick,
  refreshTrigger = 0,
}) => {
  const { showToast, currentUser } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [salesLedger, setSalesLedger] = useState<PharmacySalesLedger | null>(null);

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = async () => {
    try {
      const [meds, rxList, billList, ledger] = await Promise.all([
        api.getMedicines(),
        api.getPrescriptions(),
        api.getBills(),
        api.getPharmacySalesLedger().catch(() => null),
      ]);
      setMedicines(meds);
      setPrescriptions(rxList);
      setBills(billList);
      setSalesLedger(ledger);
    } catch (e) {
      console.error(e);
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

  const handleDispense = async (rx: Prescription, pharmacyBill: Bill | null) => {
    if (!pharmacyBill || pharmacyBill.status !== 'PAID') {
      showToast(
        'Cannot dispense yet: Generate Medicine Bill and wait for patient settlement in Patient Portal.',
        true,
      );
      return;
    }
    try {
      const items = rx.items.map((i) => i.medicineName);
      await api.dispensePrescription(
        rx.id,
        currentUser?.id || '',
        items,
        `Handed over after Pharmacy Bill ${pharmacyBill.invoiceNumber} settlement`,
      );
      showToast(`Prescription ${rx.prescriptionNo} fulfilled & handed over`);
      loadData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const pendingFulfillments = prescriptions.filter((r) => r.status !== 'DISPENSED').length;
  const lowStockItems = medicines.filter((m) => m.stockQuantity <= m.reorderLevel);
  const totalStockUnits = medicines.reduce((acc, m) => acc + m.stockQuantity, 0);
  const lastMonthRev = salesLedger?.summary.lastMonth.totalRevenue ?? 0;
  const overallRev = salesLedger?.summary.overall.totalRevenue ?? 0;

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      {/* Sales & Exclusive Medicine Management Highlights Strip */}
      <div className="border border-border bg-card p-4 rounded-xl shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 min-w-0">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <div className="text-[0.65rem] font-mono uppercase tracking-wider text-muted-foreground">
              Last Month Medicine Sales (30d)
            </div>
            <div className="text-xl font-bold font-mono text-emerald-400">
              ${lastMonthRev.toFixed(2)}
            </div>
          </div>
          <div className="h-8 w-px bg-border hidden sm:block" />
          <div>
            <div className="text-[0.65rem] font-mono uppercase tracking-wider text-muted-foreground">
              Overall Pharmacy Revenue
            </div>
            <div className="text-xl font-bold font-mono text-foreground">
              ${overallRev.toFixed(2)}
            </div>
          </div>
          <div className="h-8 w-px bg-border hidden sm:block" />
          <div>
            <div className="text-[0.65rem] font-mono uppercase tracking-wider text-muted-foreground">
              Units Sold (Overall / 30d)
            </div>
            <div className="text-base font-bold font-mono text-sky-400">
              {salesLedger?.summary.overall.totalUnitsSold ?? 0} total &bull;{' '}
              {salesLedger?.summary.lastMonth.totalUnitsSold ?? 0} last 30d
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onNavigateToSales && (
            <Button
              variant="outline"
              size="sm"
              icon={<TrendingUp size={13} />}
              onClick={onNavigateToSales}
            >
              Sales &amp; Revenue Ledger
            </Button>
          )}
          {onAddMedicineClick && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={13} />}
              onClick={onAddMedicineClick}
            >
              Add New Medicine
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          label="Total Catalog Items"
          value={medicines.length}
          subtext="Exclusive pharmacist catalog"
          icon={<Pill size={16} />}
        />
        <KPICard
          label="Pending Prescription Orders"
          value={pendingFulfillments}
          subtext="Awaiting Stage 2 billing / handover"
          icon={<FileText size={16} />}
        />
        <KPICard
          label="Low Stock Alerts"
          value={lowStockItems.length}
          subtext="Below reorder minimum threshold"
          icon={<AlertTriangle size={16} />}
        />
        <KPICard
          label="Total Units in Stock"
          value={totalStockUnits}
          subtext="Available dispensary inventory"
          icon={<CheckCircle2 size={16} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
        {/* Pending Dispensation Orders */}
        <Card
          title="Medication Orders & Stage 2 Billing Gate"
          subtitle="Generate Medicine Bills from inventory; Hand Over unlocks once patient pays"
          icon={<FileText size={18} />}
          action={
            onNavigateToFulfillment && (
              <Button variant="outline" size="sm" onClick={() => onNavigateToFulfillment()}>
                View All Orders
              </Button>
            )
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rx Identifier</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Pharmacy Bill</TableHead>
                <TableHead>Fulfillment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prescriptions.slice(0, 6).map((rx) => {
                const pharmacyBill = getPharmacyBillForRx(rx);
                const isPaid = pharmacyBill?.status === 'PAID';
                const hasMeds = (rx.items?.length || 0) > 0;

                return (
                  <TableRow key={rx.id}>
                    <TableCell>
                      <div className="font-mono font-semibold text-primary">{rx.prescriptionNo}</div>
                      <div className="text-[0.65rem] text-muted-foreground">
                        {rx.items?.[0] ? `${rx.items[0].medicineName}` : 'No meds'}
                        {(rx.items?.length || 0) > 1 ? ` +${rx.items.length - 1} more` : ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      {rx.patient?.user
                        ? `${rx.patient.user.firstName} ${rx.patient.user.lastName}`.trim()
                        : 'Patient'}
                    </TableCell>
                    <TableCell>
                      {pharmacyBill ? (
                        <span
                          className={`inline-flex items-center gap-1 text-[0.68rem] font-mono px-2 py-0.5 rounded border ${
                            isPaid
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                              : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {isPaid ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                          ${pharmacyBill.totalAmount.toFixed(2)} • {isPaid ? 'PAID' : 'PENDING'}
                        </span>
                      ) : rx.status === 'DISPENSED' ? (
                        <span className="text-[0.68rem] font-mono text-muted-foreground">Historical</span>
                      ) : (
                        <span className="text-[0.68rem] font-mono text-amber-400">Not Generated</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {rx.status === 'DISPENSED' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400">
                          <CheckCircle2 size={12} /> Dispensed
                        </span>
                      ) : !hasMeds ? (
                        <span className="text-xs text-muted-foreground font-mono">Lab Only</span>
                      ) : !pharmacyBill ? (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<Receipt size={12} />}
                          onClick={() => onNavigateToFulfillment?.(rx.id)}
                        >
                          Generate Medicine Bill
                        </Button>
                      ) : !isPaid ? (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          icon={<Lock size={12} />}
                          title="Locked until patient settles Pharmacy Bill in Patient Portal"
                          className="opacity-55"
                        >
                          Awaiting Payment
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<PackageCheck size={12} />}
                          onClick={() => handleDispense(rx, pharmacyBill)}
                        >
                          Hand Over / Dispense
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              {prescriptions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted py-8">
                    No prescription orders awaiting fulfillment
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Low Stock Watchlist */}
        <Card
          title="Critical Reorder Watchlist"
          subtitle="Medicines requiring stock replenishment"
          icon={<AlertTriangle size={18} />}
          action={
            onNavigateToInventory && (
              <Button variant="outline" size="sm" onClick={onNavigateToInventory}>
                Manage Inventory
              </Button>
            )
          }
        >
          <div className="space-y-3">
            {lowStockItems.map((med) => (
              <div key={med.id} className="list-item-card">
                <div>
                  <div className="font-semibold text-primary">{med.name}</div>
                  <div className="text-muted text-xs">
                    {med.category} &bull; Batch: {med.batchNumber}
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="solid" size="sm">
                    {med.stockQuantity} / min {med.reorderLevel}
                  </Badge>
                </div>
              </div>
            ))}
            {lowStockItems.length === 0 && (
              <div className="text-center text-muted py-8">
                All medicines are adequately stocked above threshold
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
