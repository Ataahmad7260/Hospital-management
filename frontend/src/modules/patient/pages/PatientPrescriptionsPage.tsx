import React, { useEffect, useState } from 'react';
import { FileText, Pill, Stethoscope, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '../../../shared/ui';
import { api } from '../../../shared/api';
import type { Prescription } from '../../../shared/types';
import { useAuth } from '../../../shared/context/AuthContext';

export const PatientPrescriptionsPage: React.FC = () => {
  const { showToast } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    setLoading(true);
    try {
      const data = await api.getPrescriptions();
      setPrescriptions(data);
    } catch (err: any) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'DISPENSED' || s === 'COMPLETED') {
      return (
        <Badge variant="success" className="gap-1.5 uppercase font-mono text-[0.65rem]">
          <CheckCircle2 size={11} />
          {status}
        </Badge>
      );
    }
    if (s === 'PENDING' || s === 'ISSUED') {
      return (
        <Badge variant="warning" className="gap-1.5 uppercase font-mono text-[0.65rem]">
          <Clock size={11} />
          {status}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1.5 uppercase font-mono text-[0.65rem]">
        <AlertCircle size={11} />
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      <Card className="hover:border-primary/50 transition-all duration-300">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/60">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-xs">
              <Pill size={20} />
            </div>
            <div>
              <CardTitle className="text-lg font-bold tracking-tight">Clinical Prescriptions & Regimens</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Authorized medical prescriptions issued by physicians and dispensary fulfillment records
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="font-mono text-xs px-2.5 py-1">
            Total Regimens: {prescriptions.length}
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-xs text-muted-foreground font-mono">
              Loading medical prescriptions...
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<FileText size={26} />}
                title="No Active Prescriptions"
                description="You currently have no medical prescriptions or dispensary orders on file. Completed physician consultations with orders will appear here automatically."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-semibold text-muted-foreground">Rx Identifier</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Prescribing Physician</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Medications & Dosage Regimen</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Date Issued</TableHead>
                  <TableHead className="font-semibold text-muted-foreground text-right">Dispensary Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prescriptions.map((rx) => (
                  <TableRow
                    key={rx.id}
                    className="border-b border-border/60 hover:bg-muted/40 transition-colors"
                  >
                    <TableCell className="py-3.5">
                      <span className="font-mono font-bold text-primary text-xs px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                        {rx.prescriptionNo}
                      </span>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0">
                          <Stethoscope size={12} className="text-primary" />
                        </div>
                        <span className="font-medium text-xs text-foreground">
                          {rx.doctor?.user ? `Dr. ${rx.doctor.user.lastName}` : 'Hospital Physician'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="space-y-1.5">
                        {rx.items?.map((it, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="font-semibold text-foreground">{it.medicineName}</span>
                            <span className="text-muted-foreground ml-1.5 text-[0.7rem] font-mono">
                              ({it.dosage} • {it.frequency} • {it.durationDays}d)
                            </span>
                            {it.instructions && (
                              <div className="text-[0.68rem] text-muted-foreground/90 font-sans italic mt-0.5">
                                Notes: {it.instructions}
                              </div>
                            )}
                          </div>
                        ))}
                        {rx.labTests && rx.labTests.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {rx.labTests.map((t, idx) => (
                              <Badge key={idx} variant="outline" className="text-[0.65rem] font-mono">
                                Lab: {t.testName}
                                {t.urgency && t.urgency !== 'Routine' ? ` (${t.urgency})` : ''}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 font-mono text-[0.7rem] text-muted-foreground">
                      {new Date(rx.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="py-3.5 text-right">
                      {getStatusBadge(rx.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
