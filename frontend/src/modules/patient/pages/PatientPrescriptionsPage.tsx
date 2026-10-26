import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import {
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  StatusPill,
} from '../../../shared/ui';
import { api } from '../../../shared/api';
import type { Prescription } from '../../../shared/types';
import { useAuth } from '../../../shared/context/AuthContext';

export const PatientPrescriptionsPage: React.FC = () => {
  const { showToast } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      const data = await api.getPrescriptions();
      setPrescriptions(data);
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  return (
    <div className="portal-page">
      <Card
        title="My Prescriptions & Regimens"
        subtitle="Medications prescribed by hospital physicians and fulfillment status"
        icon={<FileText size={18} />}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rx Identifier</TableHead>
              <TableHead>Prescribing Physician</TableHead>
              <TableHead>Medications & Dosage Regimen</TableHead>
              <TableHead>Date Issued</TableHead>
              <TableHead>Pharmacy Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prescriptions.map((rx) => (
              <TableRow key={rx.id}>
                <TableCell>
                  <span className="font-mono font-semibold text-primary">{rx.prescriptionNo}</span>
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
                        &bull; {it.dosage} ({it.frequency}) &bull; {it.durationDays} days
                      </span>
                      {it.instructions && (
                        <div className="text-xs text-muted font-mono mt-0.5">
                          Instructions: {it.instructions}
                        </div>
                      )}
                    </div>
                  ))}
                </TableCell>
                <TableCell className="font-mono text-muted text-xs">
                  {new Date(rx.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <StatusPill status={rx.status} />
                </TableCell>
              </TableRow>
            ))}
            {prescriptions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted py-8">
                  You have no active or past prescriptions on file
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
