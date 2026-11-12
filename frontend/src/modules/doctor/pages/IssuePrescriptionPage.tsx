import React, { useEffect, useState } from 'react';
import { FileText, Plus, Trash2 } from 'lucide-react';
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

interface MedDraft {
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions: string;
}

interface LabDraft {
  testName: string;
  urgency: string;
  instructions: string;
}

const emptyMed = (): MedDraft => ({
  medicineName: '',
  dosage: '',
  frequency: '',
  durationDays: 7,
  instructions: '',
});

const emptyLab = (): LabDraft => ({
  testName: '',
  urgency: 'Routine',
  instructions: '',
});

export const IssuePrescriptionPage: React.FC = () => {
  const { showToast } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [doctorId, setDoctorId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [items, setItems] = useState<MedDraft[]>([emptyMed()]);
  const [labTests, setLabTests] = useState<LabDraft[]>([]);

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

      if (dList.length > 0 && !doctorId) {
        setDoctorId(dList[0].id);
      }
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId || !patientId) {
      showToast('Please select both Doctor and Patient', true);
      return;
    }

    const preparedItems = items
      .filter((m) => m.medicineName.trim())
      .map((m) => ({
        medicineName: m.medicineName.trim(),
        dosage: m.dosage.trim(),
        frequency: m.frequency.trim(),
        durationDays: Number(m.durationDays) || 1,
        instructions: m.instructions.trim() || undefined,
      }));

    const preparedLabs = labTests
      .filter((t) => t.testName.trim())
      .map((t) => ({
        testName: t.testName.trim(),
        urgency: t.urgency || 'Routine',
        instructions: t.instructions.trim() || undefined,
      }));

    if (preparedItems.length === 0 && preparedLabs.length === 0) {
      showToast('Please add at least one medication or lab test order', true);
      return;
    }

    try {
      await api.createPrescription({
        doctorId,
        patientId,
        doctorNotes: doctorNotes.trim() || undefined,
        items: preparedItems,
        labTests: preparedLabs,
      });
      showToast('Digital prescription issued successfully');
      setIsModalOpen(false);
      setItems([emptyMed()]);
      setLabTests([]);
      setDoctorNotes('');
      loadData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
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
                  {rx.labTests && rx.labTests.length > 0 && (
                    <div className="text-xs text-muted mt-1">
                      Labs: {rx.labTests.map((t) => t.testName).join(', ')}
                    </div>
                  )}
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
        <form onSubmit={handleCreatePrescription} className="space-y-4">
          <FormRow columns={2}>
            <FormGroup label="Prescribing Physician">
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
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
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
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

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono uppercase text-muted-foreground font-semibold">
                Medications ({items.length})
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Plus size={12} />}
                onClick={() => setItems((prev) => [...prev, emptyMed()])}
              >
                Add Another Medicine
              </Button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold">Medicine #{idx + 1}</span>
                  {(items.length > 1 || labTests.length > 0) && (
                    <button
                      type="button"
                      onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  )}
                </div>
                <FormRow columns={2}>
                  <FormGroup label="Medication Name">
                    <input
                      type="text"
                      value={item.medicineName}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((m, i) => (i === idx ? { ...m, medicineName: e.target.value } : m)),
                        )
                      }
                      required
                    />
                  </FormGroup>
                  <FormGroup label="Dosage">
                    <input
                      type="text"
                      value={item.dosage}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((m, i) => (i === idx ? { ...m, dosage: e.target.value } : m)),
                        )
                      }
                      required
                    />
                  </FormGroup>
                </FormRow>
                <FormRow columns={2}>
                  <FormGroup label="Dosage Frequency">
                    <input
                      type="text"
                      value={item.frequency}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((m, i) => (i === idx ? { ...m, frequency: e.target.value } : m)),
                        )
                      }
                      required
                    />
                  </FormGroup>
                  <FormGroup label="Duration (Days)">
                    <input
                      type="number"
                      min="1"
                      value={item.durationDays}
                      onChange={(e) =>
                        setItems((prev) =>
                          prev.map((m, i) =>
                            i === idx ? { ...m, durationDays: Number(e.target.value) } : m,
                          ),
                        )
                      }
                      required
                    />
                  </FormGroup>
                </FormRow>
                <FormGroup label="Patient Instructions">
                  <input
                    type="text"
                    value={item.instructions}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((m, i) => (i === idx ? { ...m, instructions: e.target.value } : m)),
                      )
                    }
                  />
                </FormGroup>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono uppercase text-muted-foreground font-semibold">
                Lab / Diagnostic Tests ({labTests.length})
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Plus size={12} />}
                onClick={() => setLabTests((prev) => [...prev, emptyLab()])}
              >
                {labTests.length > 0 ? 'Add Another Test' : 'Add Lab Test'}
              </Button>
            </div>

            {labTests.map((test, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold">Diagnostic Order #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => setLabTests((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
                <FormRow columns={2}>
                  <FormGroup label="Test Name">
                    <input
                      type="text"
                      value={test.testName}
                      onChange={(e) =>
                        setLabTests((prev) =>
                          prev.map((t, i) => (i === idx ? { ...t, testName: e.target.value } : t)),
                        )
                      }
                      placeholder="e.g. CBC, Blood Sugar, X-Ray"
                      required
                    />
                  </FormGroup>
                  <FormGroup label="Urgency">
                    <select
                      value={test.urgency}
                      onChange={(e) =>
                        setLabTests((prev) =>
                          prev.map((t, i) => (i === idx ? { ...t, urgency: e.target.value } : t)),
                        )
                      }
                    >
                      <option value="Routine">Routine</option>
                      <option value="Urgent">Urgent</option>
                      <option value="STAT">STAT</option>
                    </select>
                  </FormGroup>
                </FormRow>
                <FormGroup label="Sample / Prep Instructions">
                  <input
                    type="text"
                    value={test.instructions}
                    onChange={(e) =>
                      setLabTests((prev) =>
                        prev.map((t, i) => (i === idx ? { ...t, instructions: e.target.value } : t)),
                      )
                    }
                  />
                </FormGroup>
              </div>
            ))}
          </div>

          <FormGroup label="Clinical Remarks">
            <input
              type="text"
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
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
