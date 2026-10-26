import React, { useEffect, useState } from 'react';
import { Pill, Plus } from 'lucide-react';
import {
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
  Badge,
  Modal,
  FormGroup,
  FormRow,
} from '../../../shared/ui';
import { api } from '../../../shared/api';
import type { Medicine } from '../../../shared/types';
import { useAuth } from '../../../shared/context/AuthContext';

export const InventoryManagementPage: React.FC = () => {
  const { showToast } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    genericName: '',
    category: 'Tablet',
    manufacturer: '',
    batchNumber: `BATCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    stockQuantity: 200,
    reorderLevel: 25,
    unitPrice: 2.5,
    expiryDate: '2028-12-31',
  });

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const data = await api.getMedicines();
      setMedicines(data);
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleCreateMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createMedicine({
        ...form,
        stockQuantity: Number(form.stockQuantity),
        reorderLevel: Number(form.reorderLevel),
        unitPrice: Number(form.unitPrice),
      });
      showToast(`Medicine ${form.name} added to inventory`);
      setIsModalOpen(false);
      loadInventory();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleUpdateStock = async (id: string, delta: number) => {
    try {
      await api.updateMedicineStock(id, delta);
      showToast(`Stock updated (${delta > 0 ? '+' : ''}${delta})`);
      loadInventory();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  return (
    <div className="portal-page">
      <Card
        title="Pharmacy Inventory & Batch Control"
        subtitle="Catalog medicines, track stock levels, and set automatic reorder thresholds"
        icon={<Pill size={18} />}
        action={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setIsModalOpen(true)}
          >
            Add New Medicine
          </Button>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Medicine Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Batch Number</TableHead>
              <TableHead>Stock Level</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Expiration</TableHead>
              <TableHead>Stock Adjust</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {medicines.map((med) => (
              <TableRow key={med.id}>
                <TableCell>
                  <div className="font-semibold text-primary">{med.name}</div>
                  <div className="text-muted text-xs">{med.genericName}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{med.category}</Badge>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs">{med.batchNumber}</span>
                </TableCell>
                <TableCell>
                  <span
                    className={`badge ${
                      med.stockQuantity <= med.reorderLevel ? 'badge-white' : 'badge-outline'
                    }`}
                  >
                    {med.stockQuantity} units
                  </span>
                </TableCell>
                <TableCell className="font-mono font-semibold text-primary">
                  ${med.unitPrice.toFixed(2)}
                </TableCell>
                <TableCell className="font-mono text-muted text-xs">
                  {new Date(med.expiryDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex-row-gap">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleUpdateStock(med.id, 10)}
                    >
                      +10
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={med.stockQuantity <= 0}
                      onClick={() => handleUpdateStock(med.id, -1)}
                    >
                      -1
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {medicines.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted py-8">
                  No medicines currently in catalog
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Modal: Add Medicine */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Medicine Formulation"
      >
        <form onSubmit={handleCreateMedicine}>
          <FormGroup label="Brand Name">
            <input
              type="text"
              placeholder="e.g. Paracetamol 650mg"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </FormGroup>

          <FormGroup label="Generic Name">
            <input
              type="text"
              placeholder="e.g. Acetaminophen"
              value={form.genericName}
              onChange={(e) => setForm({ ...form, genericName: e.target.value })}
            />
          </FormGroup>

          <FormRow columns={2}>
            <FormGroup label="Category">
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup">Syrup</option>
                <option value="Injection">Injection</option>
                <option value="Ointment">Ointment</option>
              </select>
            </FormGroup>

            <FormGroup label="Batch Number">
              <input
                type="text"
                value={form.batchNumber}
                onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                required
              />
            </FormGroup>
          </FormRow>

          <FormRow columns={2}>
            <FormGroup label="Available Units">
              <input
                type="number"
                min="0"
                value={form.stockQuantity}
                onChange={(e) => setForm({ ...form, stockQuantity: Number(e.target.value) })}
                required
              />
            </FormGroup>

            <FormGroup label="Unit Price ($)">
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: Number(e.target.value) })}
                required
              />
            </FormGroup>
          </FormRow>

          <div className="modal-footer">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add Medicine
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
