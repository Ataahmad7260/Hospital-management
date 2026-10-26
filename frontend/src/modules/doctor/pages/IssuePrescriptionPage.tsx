import React, { useEffect, useState } from 'react';
import { FileText, Plus } from 'lucide-react';
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
import type { Prescription, Patient, Doctor } from '../../../shared/types';
import { useAuth } from '../../../shared/context/AuthContext';

export const IssuePrescriptionPage: React.FC = () => {
  const { showToast } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    doctorId: '',
    patientId: '',
    medicineName: 'Amoxicillin 500mg',
    dosage: '500mg',
    frequency: '1-0-1 (twice daily after meals)',
    durationDays: 7,
    instructions: 'Take with warm water after meals',
    doctorNotes: 'Complete the full course as prescribed',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rxList, pList, dList] = await Promise.all([
        api.getPrescriptions(),
        api.getPatients(),
        api.getDoctors(),
      ]);
      setPrescriptions(rxList);
      setPatients(pList);
      setDoctors(dList);

      if (dList.length > 0 && !form.doctorId) {
        setForm((prev) => ({ ...prev, doctorId: dList[0].id }));
      }
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.doctorId || !form.patientId) {
      showToast('Please select both Doctor and Patient', true);
      return;
    }

    try {
      await api.createPrescription({
        doctorId: form.doctorId,
        patientId: form.patientId,
        doctorNotes: form.doctorNotes,
        items: [
          {
            medicineName: form.medicineName,
            dosage: form.dosage,
            frequency: form.frequency,
            durationDays: Number(form.durationDays),
            instructions: form.instructions,
          },
        ],
      });
      showToast('Digital prescription issued successfully');
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  return (
    <div className="portal-page">
      <Card
        title="Digital Prescription Registry"
        subtitle="Issue electronic prescriptions and view dispensary fulfillment status"
        icon={<FileText size={18} />}
        action={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setIsModalOpen(true)}
          >
            Issue New Prescription
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rx Identifier</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Prescribing Doctor</TableHead>
              <TableHead>Medication & Regimen</TableHead>
              <TableHead>Issued Date</TableHead>
              <TableHead>Dispensary Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prescriptions.map((rx) => (
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
                  {rx.doctor?.user ? `Dr. ${rx.doctor.user.lastName}` : 'Doctor'}
                </TableCell>
                <TableCell>
                  {rx.items?.map((item, idx) => (
                    <div key={idx} className="mb-1">
                      <span className="font-semibold text-primary">{item.medicineName}</span>
                      <span className="text-muted text-xs">
                        {' '}
                        &bull; {item.dosage} &bull; {item.frequency} ({item.durationDays} days)
                      </span>
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
                <TableCell colSpan={6} className="text-center text-muted py-8">
                  No prescriptions on record
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Issue Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Issue Digital Prescription"
      >
        <form onSubmit={handleCreatePrescription}>
          <FormRow columns={2}>
            <FormGroup label="Prescribing Physician">
              <select
                value={form.doctorId}
                onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                required
              >
                <option value="">Select Doctor...</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.user.firstName} {d.user.lastName} ({d.specialization})
                  </option>
                ))}
              </select>
            </FormGroup>

            <FormGroup label="Patient">
              <select
                value={form.patientId}
                onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                required
              >
                <option value="">Select Patient...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.user.firstName} {p.user.lastName}
                  </option>
                ))}
              </select>
            </FormGroup>
          </FormRow>

          <FormRow columns={2}>
            <FormGroup label="Medication Name">
              <input
                type="text"
                value={form.medicineName}
                onChange={(e) => setForm({ ...form, medicineName: e.target.value })}
                required
              />
            </FormGroup>
            <FormGroup label="Dosage">
              <input
                type="text"
                value={form.dosage}
                onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                required
              />
            </FormGroup>
          </FormRow>

          <FormRow columns={2}>
            <FormGroup label="Dosage Frequency">
              <input
                type="text"
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                required
              />
            </FormGroup>
            <FormGroup label="Duration (Days)">
              <input
                type="number"
                min="1"
                value={form.durationDays}
                onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })}
                required
              />
            </FormGroup>
          </FormRow>

          <FormGroup label="Patient Instructions">
            <input
              type="text"
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            />
          </FormGroup>

          <FormGroup label="Clinical Remarks">
            <input
              type="text"
              value={form.doctorNotes}
              onChange={(e) => setForm({ ...form, doctorNotes: e.target.value })}
            />
          </FormGroup>

          <div className="modal-footer">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Issue Prescription
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
