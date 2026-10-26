import React, { useEffect, useState } from 'react';
import { CreditCard, CheckCircle2 } from 'lucide-react';
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
import type { Bill } from '../../../shared/types';
import { useAuth } from '../../../shared/context/AuthContext';

export const PatientBillingPage: React.FC = () => {
  const { showToast } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    try {
      const data = await api.getBills();
      setBills(data);
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handlePay = async (bill: Bill) => {
    try {
      await api.recordPayment(bill.id, bill.totalAmount);
      showToast(`Invoice ${bill.invoiceNumber} paid in full`);
      loadBills();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  return (
    <div className="portal-page">
      <Card
        title="My Hospital Invoices & Statements"
        subtitle="Review medical charges, consultation balances, and pay outstanding statements"
        icon={<CreditCard size={18} />}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice No</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Subtotal</TableHead>
              <TableHead>Tax</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  <span className="font-mono font-semibold text-primary">{b.invoiceNumber}</span>
                </TableCell>
                <TableCell>{b.items?.[0]?.description || 'Clinical Care Services'}</TableCell>
                <TableCell className="font-mono text-muted text-xs">
                  {new Date(b.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="font-mono">${b.subtotal.toFixed(2)}</TableCell>
                <TableCell className="font-mono text-muted">${b.taxAmount.toFixed(2)}</TableCell>
                <TableCell className="font-mono font-bold text-primary">
                  ${b.totalAmount.toFixed(2)}
                </TableCell>
                <TableCell>
                  <StatusPill status={b.status} />
                </TableCell>
                <TableCell>
                  {b.status !== 'PAID' ? (
                    <Button variant="primary" size="sm" onClick={() => handlePay(b)}>
                      Pay Now
                    </Button>
                  ) : (
                    <span className="badge badge-white text-xs">
                      <CheckCircle2 size={12} /> Settled
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {bills.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted py-8">
                  You have no outstanding or past invoices
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
