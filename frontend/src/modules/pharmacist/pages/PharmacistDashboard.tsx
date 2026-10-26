import React, { useEffect, useState } from 'react';
import { Pill, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { Card, KPICard, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Button, Badge } from '../../../shared/ui';
import { api } from '../../../shared/api';
import type { Medicine, Prescription } from '../../../shared/types';
import { useAuth } from '../../../shared/context/AuthContext';

export const PharmacistDashboard: React.FC<{ onNavigateToFulfillment?: () => void }> = ({
  onNavigateToFulfillment,
}) => {
  const { showToast, currentUser } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [meds, rxList] = await Promise.all([
        api.getMedicines(),
        api.getPrescriptions(),
      ]);
      setMedicines(meds);
      setPrescriptions(rxList);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDispense = async (rx: Prescription) => {
    try {
      const items = rx.items.map((i) => i.medicineName);
      await api.dispensePrescription(
        rx.id,
        currentUser?.id || '6adf77ce6db62658693e3198',
        items,
        'Dispensed by central pharmacy'
      );
      showToast(`Prescription ${rx.prescriptionNo} fulfilled & dispensed`);
      loadData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const pendingFulfillments = prescriptions.filter((r) => r.status !== 'DISPENSED').length;
  const lowStockItems = medicines.filter((m) => m.stockQuantity <= m.reorderLevel);
  const totalStockUnits = medicines.reduce((acc, m) => acc + m.stockQuantity, 0);

  return (
    <div className="portal-page">
      <div className="kpi-grid">
        <KPICard
          label="Total Catalog Items"
          value={medicines.length}
          subtext="Formulations & medications"
          icon={<Pill size={16} />}
        />
        <KPICard
          label="Pending Prescription Orders"
          value={pendingFulfillments}
          subtext="Orders awaiting dispensing"
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

      <div className="grid-2-col">
        {/* Pending Dispensation Orders */}
        <Card
          title="Medication Orders Awaiting Dispensation"
          subtitle="Orders issued by physicians ready for patient fulfillment"
          icon={<FileText size={18} />}
          action={
            onNavigateToFulfillment && (
              <Button variant="outline" size="sm" onClick={onNavigateToFulfillment}>
                View All
              </Button>
            )
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rx Identifier</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Prescribed Item</TableHead>
                <TableHead>Fulfillment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {prescriptions.slice(0, 5).map((rx) => (
                <TableRow key={rx.id}>
                  <TableCell>
                    <span className="font-mono font-semibold text-primary">{rx.prescriptionNo}</span>
                  </TableCell>
                  <TableCell>
                    {rx.patient?.user
                      ? `${rx.patient.user.firstName} ${rx.patient.user.lastName}`
                      : 'Patient'}
                  </TableCell>
                  <TableCell>
                    {rx.items?.[0] ? `${rx.items[0].medicineName} (${rx.items[0].dosage})` : '—'}
                  </TableCell>
                  <TableCell>
                    {rx.status !== 'DISPENSED' ? (
                      <Button variant="secondary" size="sm" onClick={() => handleDispense(rx)}>
                        Dispense
                      </Button>
                    ) : (
                      <span className="badge badge-white text-xs">
                        <CheckCircle2 size={12} /> Fulfilled
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
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
