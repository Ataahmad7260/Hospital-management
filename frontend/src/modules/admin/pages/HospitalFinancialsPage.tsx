import React, { useEffect, useState } from 'react';
import { CreditCard, Plus, CheckCircle2, Stethoscope, Pill } from 'lucide-react';
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
import type { Bill, BillCategory, Patient } from '../../../shared/types';
import { useAuth } from '../../../shared/context/AuthContext';

export const HospitalFinancialsPage: React.FC = () => {
  const { showToast } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | BillCategory>('ALL');

  const [formData, setFormData] = useState({
    patientId: '',
    billType: 'OTHER' as BillCategory,
    description: 'Clinical Consultation & Diagnostic Review',
    unitPrice: 85.0,
    taxAmount: 5.0,
    discountAmount: 0.0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bList, pList] = await Promise.all([api.getBills(), api.getPatients()]);
      setBills(bList);
      setPatients(pList);
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId) {
      showToast('Please select a patient', true);
      return;
    }
    try {
      await api.createBill({
        patientId: formData.patientId,
        billType: formData.billType,
        subtotal: Number(formData.unitPrice),
        taxAmount: Number(formData.taxAmount),
        discountAmount: Number(formData.discountAmount),
        items: [
          {
            description: formData.description,
            quantity: 1,
            unitPrice: Number(formData.unitPrice),
            total: Number(formData.unitPrice),
          },
        ],
      });
      showToast('Invoice created successfully');
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleSettleBill = async (bill: Bill) => {
    try {
      const remaining = Math.max(0.01, Number((bill.totalAmount - (bill.paidAmount || 0)).toFixed(2)));
      await api.recordPayment(bill.id, remaining);
      showToast(`Invoice ${bill.invoiceNumber} settled in full`);
      loadData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const consultationBills = bills.filter((b) => (b.billType || 'CONSULTATION') === 'CONSULTATION');
  const pharmacyBills = bills.filter((b) => b.billType === 'PHARMACY');
  const consultationTotal = consultationBills.reduce((s, b) => s + b.totalAmount, 0);
  const pharmacyTotal = pharmacyBills.reduce((s, b) => s + b.totalAmount, 0);
  const filteredBills =
    categoryFilter === 'ALL'
      ? bills
      : bills.filter((b) => (b.billType || 'CONSULTATION') === categoryFilter);

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 min-w-0">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground uppercase">
            <span>Stage 1 • Consultation Fees</span>
            <Stethoscope size={15} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">
            ${consultationTotal.toFixed(2)}
          </div>
          <div className="text-[0.68rem] font-mono text-muted-foreground mt-0.5">
            {consultationBills.filter((b) => b.status === 'PAID').length} PAID •{' '}
            {consultationBills.filter((b) => b.status !== 'PAID').length} PENDING
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground uppercase">
            <span>Stage 2 • Pharmacy Dues</span>
            <Pill size={15} className="text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">
            ${pharmacyTotal.toFixed(2)}
          </div>
          <div className="text-[0.68rem] font-mono text-muted-foreground mt-0.5">
            {pharmacyBills.filter((b) => b.status === 'PAID').length} PAID •{' '}
            {pharmacyBills.filter((b) => b.status !== 'PAID').length} PENDING
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground uppercase">
            <span>Total Hospital Invoices</span>
            <CreditCard size={15} className="text-primary" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">
            ${bills.reduce((s, b) => s + b.totalAmount, 0).toFixed(2)}
          </div>
          <div className="text-[0.68rem] font-mono text-muted-foreground mt-0.5">
            Across {bills.length} clinical & pharmacy bills
          </div>
        </div>
      </div>

      <Card
        title="Hospital Invoicing & Two-Stage Revenue Ledger"
        subtitle="Consultation booking fees and pharmacy medicine bills with separate PAID / PENDING tracking"
        icon={<CreditCard size={18} />}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            {(['ALL', 'CONSULTATION', 'PHARMACY', 'OTHER'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 min-h-[38px] sm:min-h-8 rounded-full text-xs font-mono font-semibold uppercase border cursor-pointer transition-colors flex items-center ${categoryFilter === cat
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-card text-muted-foreground hover:text-foreground border-border'
                  }`}
              >
                {cat}
              </button>
            ))}
            <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setIsModalOpen(true)}>
              Create Invoice
            </Button>
          </div>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice No</TableHead>
              <TableHead>Stage / Category</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Service / Prescription Item</TableHead>
              <TableHead>Subtotal</TableHead>
              <TableHead>Tax</TableHead>
              <TableHead>Total Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Settlement</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBills.map((b) => {
              const cat = b.billType || 'CONSULTATION';
              return (
                <TableRow key={b.id}>
                  <TableCell>
                    <span className="font-mono font-semibold text-primary">{b.invoiceNumber}</span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={cat === 'PHARMACY' ? 'info' : cat === 'CONSULTATION' ? 'success' : 'secondary'}
                      className="font-mono text-[0.65rem] uppercase"
                    >
                      {cat}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {b.patient?.user
                      ? `${b.patient.user.firstName} ${b.patient.user.lastName}`
                      : 'Patient'}
                  </TableCell>
                  <TableCell>
                    {b.prescription?.prescriptionNo
                      ? `${b.prescription.prescriptionNo} • ${b.items?.[0]?.description || 'Medications'}`
                      : b.items?.[0]?.description || 'Medical Consultation'}
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
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSettleBill(b)}
                      >
                        Settle Full
                      </Button>
                    ) : (
                      <span className="badge badge-white text-xs">
                        <CheckCircle2 size={12} /> PAID
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {filteredBills.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted py-8">
                  No invoices match the selected category
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Invoice Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generate Patient Invoice"
      >
        <form onSubmit={handleCreateInvoice}>
          <FormRow columns={2}>
            <FormGroup label="Patient">
              <select
                value={formData.patientId}
                onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                required
              >
                <option value="">Select Patient...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.user.firstName} {p.user.lastName} ({p.user.email})
                  </option>
                ))}
              </select>
            </FormGroup>

            <FormGroup label="Bill Category">
              <select
                value={formData.billType}
                onChange={(e) => setFormData({ ...formData, billType: e.target.value as BillCategory })}
              >
                <option value="CONSULTATION">CONSULTATION</option>
                <option value="PHARMACY">PHARMACY</option>
                <option value="OTHER">OTHER</option>
              </select>
            </FormGroup>
          </FormRow>

          <FormGroup label="Service Description">
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </FormGroup>

          <FormRow columns={2}>
            <FormGroup label="Subtotal ($)">
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                required
              />
            </FormGroup>
            <FormGroup label="Tax Amount ($)">
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.taxAmount}
                onChange={(e) => setFormData({ ...formData, taxAmount: Number(e.target.value) })}
              />
            </FormGroup>
          </FormRow>

          <div className="modal-footer">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Generate Invoice
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
