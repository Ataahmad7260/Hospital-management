import React, { useEffect, useState } from 'react';
import { CreditCard, CheckCircle2, Clock, DollarSign, Receipt } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '../../../shared/ui';
import { api } from '../../../shared/api';
import type { Bill } from '../../../shared/types';
import { useAuth } from '../../../shared/context/AuthContext';

export const PatientBillingPage: React.FC = () => {
  const { showToast } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);

  useEffect(() => {
    loadBills();
  }, []);

  const loadBills = async () => {
    setLoading(true);
    try {
      const data = await api.getBills();
      setBills(data);
    } catch (err: any) {
      showToast(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (bill: Bill) => {
    setPayingId(bill.id);
    try {
      await api.recordPayment(bill.id, bill.totalAmount);
      showToast(`Invoice ${bill.invoiceNumber} paid in full`);
      loadBills();
    } catch (err: any) {
      showToast(err.message, true);
    } finally {
      setPayingId(null);
    }
  };

  const pendingTotal = bills
    .filter((b) => b.status !== 'PAID')
    .reduce((sum, b) => sum + (b.totalAmount - (b.paidAmount || 0)), 0);

  const getStatusBadge = (status: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'PAID') {
      return (
        <Badge variant="success" className="gap-1.5 uppercase font-mono text-[0.65rem]">
          <CheckCircle2 size={11} />
          Settled
        </Badge>
      );
    }
    if (s === 'PARTIALLY_PAID') {
      return (
        <Badge variant="info" className="gap-1.5 uppercase font-mono text-[0.65rem]">
          <Clock size={11} />
          Partial
        </Badge>
      );
    }
    return (
      <Badge variant="warning" className="gap-1.5 uppercase font-mono text-[0.65rem]">
        <Clock size={11} />
        Unpaid
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="hover:border-primary/50 transition-all duration-300">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/60">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-xs">
              <CreditCard size={20} />
            </div>
            <div>
              <CardTitle className="text-lg font-bold tracking-tight">Hospital Invoices & Payments</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Review clinical examination charges, medication billing, and settle outstanding balances
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[0.68rem] text-muted-foreground uppercase font-mono">Outstanding</div>
              <div className="text-sm font-mono font-bold text-foreground">
                ${pendingTotal.toFixed(2)}
              </div>
            </div>
            <Badge variant="outline" className="font-mono text-xs px-2.5 py-1">
              {bills.length} Invoices
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-xs text-muted-foreground font-mono">
              Loading hospital billing statements...
            </div>
          ) : bills.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<Receipt size={26} />}
                title="No Billing Invoices"
                description="You currently have no outstanding or historical hospital invoices on record. Invoices are automatically generated upon pharmacy fulfillment."
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-semibold text-muted-foreground">Invoice No</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Description</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Date</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Subtotal</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Tax</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Total Due</TableHead>
                  <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-muted-foreground text-right">Payment Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((b) => (
                  <TableRow
                    key={b.id}
                    className="border-b border-border/60 hover:bg-muted/40 transition-colors"
                  >
                    <TableCell className="py-3.5">
                      <span className="font-mono font-bold text-primary text-xs px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                        {b.invoiceNumber}
                      </span>
                    </TableCell>
                    <TableCell className="py-3.5 text-xs text-foreground font-medium">
                      {b.items?.[0]?.description || 'Clinical Care & Dispensary Services'}
                    </TableCell>
                    <TableCell className="py-3.5 font-mono text-[0.7rem] text-muted-foreground">
                      {new Date(b.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="py-3.5 font-mono text-xs text-muted-foreground">
                      ${b.subtotal.toFixed(2)}
                    </TableCell>
                    <TableCell className="py-3.5 font-mono text-xs text-muted-foreground">
                      ${b.taxAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className="py-3.5 font-mono font-bold text-xs text-foreground">
                      ${b.totalAmount.toFixed(2)}
                    </TableCell>
                    <TableCell className="py-3.5">
                      {getStatusBadge(b.status)}
                    </TableCell>
                    <TableCell className="py-3.5 text-right">
                      {b.status !== 'PAID' ? (
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
                        <span className="inline-flex items-center gap-1 text-[0.68rem] font-mono text-emerald-400 font-semibold">
                          <CheckCircle2 size={12} />
                          Settled
                        </span>
                      )}
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
