import React, { useEffect, useState } from 'react';
import { Calendar, Plus } from 'lucide-react';
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
import type { Appointment, Doctor, Patient } from '../../../shared/types';
import { useAuth } from '../../../shared/context/AuthContext';

export const BookAppointmentPage: React.FC = () => {
  const { showToast } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    doctorId: '',
    patientId: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    timeSlot: '09:30 - 10:00 AM',
    reason: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [apts, dList, pList] = await Promise.all([
        api.getAppointments(),
        api.getDoctors(),
        api.getPatients(),
      ]);
      setAppointments(apts);
      setDoctors(dList);
      setPatients(pList);

      if (pList.length > 0 && !form.patientId) {
        setForm((prev) => ({ ...prev, patientId: pList[0].id }));
      }
      if (dList.length > 0 && !form.doctorId) {
        setForm((prev) => ({ ...prev, doctorId: dList[0].id }));
      }
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.doctorId || !form.patientId) {
      showToast('Please select a physician', true);
      return;
    }

    try {
      await api.createAppointment(form);
      showToast('Appointment successfully scheduled!');
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  return (
    <div className="portal-page">
      <Card
        title="My Medical Appointments"
        subtitle="Schedule and track clinical visits with hospital specialists"
        icon={<Calendar size={18} />}
        action={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setIsModalOpen(true)}
          >
            Book New Consultation
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Physician</TableHead>
              <TableHead>Specialization</TableHead>
              <TableHead>Reason for Visit</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((apt) => (
              <TableRow key={apt.id}>
                <TableCell>
                  <div className="font-semibold text-primary">{apt.timeSlot}</div>
                  <div className="font-mono text-muted text-xs">
                    {new Date(apt.appointmentDate).toDateString()}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-primary">
                    {apt.doctor?.user ? `Dr. ${apt.doctor.user.firstName} ${apt.doctor.user.lastName}` : 'Physician'}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-muted text-sm">{apt.doctor?.specialization || 'Clinical Medicine'}</span>
                </TableCell>
                <TableCell>{apt.reason || 'Routine Checkup'}</TableCell>
                <TableCell>
                  <StatusPill status={apt.status} />
                </TableCell>
              </TableRow>
            ))}
            {appointments.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted py-8">
                  No appointments scheduled. Click "Book New Consultation" to schedule one.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Booking Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Doctor Consultation"
      >
        <form onSubmit={handleBook}>
          <FormGroup label="Select Physician">
            <select
              value={form.doctorId}
              onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
              required
            >
              <option value="">Choose a specialist...</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.user.firstName} {d.user.lastName} — {d.specialization} (${d.consultationFee.toFixed(2)})
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
              <option value="">Select patient account...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.user.firstName} {p.user.lastName} ({p.user.email})
                </option>
              ))}
            </select>
          </FormGroup>

          <FormRow columns={2}>
            <FormGroup label="Preferred Date">
              <input
                type="date"
                value={form.appointmentDate}
                onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
                required
              />
            </FormGroup>

            <FormGroup label="Time Slot">
              <input
                type="text"
                value={form.timeSlot}
                onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                required
              />
            </FormGroup>
          </FormRow>

          <FormGroup label="Symptoms or Reason for Consultation">
            <input
              type="text"
              placeholder="e.g. Mild shortness of breath, annual checkup"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              required
            />
          </FormGroup>

          <div className="modal-footer">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Confirm Booking
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
