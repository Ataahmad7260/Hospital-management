import React, { useEffect, useState } from 'react';
import { CreditCard, Plus, CheckCircle2 } from 'lucide-react';
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
import { api } from '../../../shared/api';
import type { Bill, Patient } from '../../../shared/types';
import { useAuth } from '../../../shared/context/AuthContext';

export const HospitalFinancialsPage: React.FC = () => {
  const { showToast } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    patientId: '',
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
      await api.recordPayment(bill.id, bill.totalAmount);
      showToast(`Invoice ${bill.invoiceNumber} settled in full`);
      loadData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <Card
        title="Hospital Invoicing & Revenue Ledger"
        subtitle="Itemized billing records and payment reconciliation"
        icon={<CreditCard size={18} />}
        action={
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setIsModalOpen(true)}>
            Create Invoice
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice No</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Service Item</TableHead>
              <TableHead>Subtotal</TableHead>
              <TableHead>Tax</TableHead>
              <TableHead>Total Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Settlement</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.map((b) => (
              <TableRow key={b.id}>
                <TableCell>
                  <span className="font-mono font-semibold text-primary">{b.invoiceNumber}</span>
                </TableCell>
                <TableCell>
                  {b.patient?.user
                    ? `${b.patient.user.firstName} ${b.patient.user.lastName}`
                    : 'Patient'}
                </TableCell>
                <TableCell>{b.items?.[0]?.description || 'Medical Consultation'}</TableCell>
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
                      <CheckCircle2 size={12} /> Settled
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {bills.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted py-8">
                  No invoices generated
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
