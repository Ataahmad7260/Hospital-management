import React, { useEffect, useState } from 'react';
import { Pill, CheckCircle2 } from 'lucide-react';
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
} from '../../../shared/ui';
import { api } from '../../../shared/api';
import type { Prescription } from '../../../shared/types';
import { useAuth } from '../../../shared/context/AuthContext';

export const PrescriptionFulfillmentPage: React.FC = () => {
  const { showToast, currentUser } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ISSUED' | 'DISPENSED'>('ALL');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await api.getPrescriptions();
      setPrescriptions(data);
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
        'Full fulfillment dispensed by clinical pharmacist'
      );
      showToast(`Prescription ${rx.prescriptionNo} marked as dispensed`);
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
    <div className="portal-page">
      <Card
        title="Dispensary Queue & Prescription Orders"
        subtitle="Validate physician orders, review patient dosage, and record dispensation"
        icon={<Pill size={18} />}
        action={
          <div className="flex-row-gap">
            <span className="text-muted text-xs">Filter Status:</span>
            {(['ALL', 'ISSUED', 'DISPENSED'] as const).map((st) => (
              <button
                key={st}
                className={`filter-chip ${filter === st ? 'active' : ''}`}
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
              <TableHead>Prescribed Medications & Regimen</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Fulfillment Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((rx) => (
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
                  {rx.doctor?.user ? `Dr. ${rx.doctor.user.lastName}` : 'Physician'}
                </TableCell>
                <TableCell>
                  {rx.items?.map((it, idx) => (
                    <div key={idx} className="mb-1">
                      <span className="font-semibold text-primary">{it.medicineName}</span>
                      <span className="text-muted text-xs">
                        {' '}
                        &bull; {it.dosage} &bull; {it.frequency} &bull; {it.durationDays} days
                      </span>
                    </div>
                  ))}
                  {rx.doctorNotes && (
                    <div className="text-xs text-muted italic mt-1 font-mono">
                      Notes: {rx.doctorNotes}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <StatusPill status={rx.status} />
                </TableCell>
                <TableCell>
                  {rx.status !== 'DISPENSED' ? (
                    <Button variant="primary" size="sm" onClick={() => handleDispense(rx)}>
                      Dispense Medication
                    </Button>
                  ) : (
                    <span className="badge badge-white text-xs">
                      <CheckCircle2 size={12} /> Dispensed
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted py-8">
                  No orders match the selected filter
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
