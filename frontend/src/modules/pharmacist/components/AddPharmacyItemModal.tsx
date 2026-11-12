import React, { useState } from 'react';
import { X, Pill, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../../shared/api';
import { useAuth } from '../../../shared/context/AuthContext';
import type { CreateMedicinePayload } from '../../../shared/types';

interface AddPharmacyItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMedicineAdded?: () => void;
}

const defaultExpiryDate = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 2);
  return d.toISOString().split('T')[0];
};

const generateBatchCode = () =>
  `BATCH-${Date.now().toString().slice(-6).toUpperCase()}`;

export const AddPharmacyItemModal: React.FC<AddPharmacyItemModalProps> = ({
  isOpen,
  onClose,
  onMedicineAdded,
}) => {
  const { showToast } = useAuth();
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [category, setCategory] = useState('Tablet');
  const [manufacturer, setManufacturer] = useState('GSK Pharmaceuticals');
  const [batchNumber, setBatchNumber] = useState(generateBatchCode);
  const [stockQuantity, setStockQuantity] = useState(200);
  const [reorderLevel, setReorderLevel] = useState(25);
  const [unitPrice, setUnitPrice] = useState(5.5);
  const [expiryDate, setExpiryDate] = useState(defaultExpiryDate);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setGenericName('');
    setCategory('Tablet');
    setManufacturer('GSK Pharmaceuticals');
    setBatchNumber(generateBatchCode());
    setStockQuantity(200);
    setReorderLevel(25);
    setUnitPrice(5.5);
    setExpiryDate(defaultExpiryDate());
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload: CreateMedicinePayload = {
        name: name.trim(),
        genericName: genericName.trim() || undefined,
        category: category.trim(),
        manufacturer: manufacturer.trim() || undefined,
        batchNumber: batchNumber.trim(),
        stockQuantity: Number(stockQuantity),
        reorderLevel: Number(reorderLevel),
        unitPrice: Number(unitPrice),
        expiryDate: new Date(expiryDate).toISOString(),
      };

      await api.createMedicine(payload);
      showToast(`Medicine '${payload.name}' added to pharmacy inventory`);
      onMedicineAdded?.();
      resetForm();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add medicine');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg border border-border bg-card text-card-foreground p-6 rounded-xl shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg border border-border bg-muted flex items-center justify-center text-foreground">
              <Pill size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-foreground">
                Add New Medicine
              </h2>
              <p className="text-xs text-muted-foreground">
                Pharmacist Exclusive &bull; Register medication batch, dispensing price &amp; stock threshold
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="text-xs font-mono border border-destructive/40 bg-destructive/10 text-destructive p-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Commercial Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Azithromycin 500mg"
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Generic Pharmacological Name
              </label>
              <input
                type="text"
                value={genericName}
                onChange={(e) => setGenericName(e.target.value)}
                placeholder="e.g. Azithromycin Dihydrate"
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors"
              />
            </div>
          </div>

          {/* Form Factor & Manufacturer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Form Factor / Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors cursor-pointer"
              >
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup">Syrup / Suspension</option>
                <option value="Injection">Injection / Vial</option>
                <option value="IV Solution">IV Solution / Drip</option>
                <option value="Ointment">Topical Ointment</option>
                <option value="Drops">Eye / Ear Drops</option>
                <option value="Inhaler">Inhaler / Respiratory</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Manufacturer / Brand
              </label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g. Pfizer, GSK, Novartis"
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground transition-colors"
              />
            </div>
          </div>

          {/* Batch & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Batch Tracking Code *
              </label>
              <input
                type="text"
                required
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground font-mono transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Unit Dispensing Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground font-mono transition-colors"
              />
            </div>
          </div>

          {/* Stock Quantities & Expiry */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Initial Stock *
              </label>
              <input
                type="number"
                min="0"
                required
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground font-mono transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Reorder Level
              </label>
              <input
                type="number"
                min="1"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(Number(e.target.value))}
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-3 py-2 text-xs rounded-lg text-foreground font-mono transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                Expiry Date *
              </label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full bg-background border border-border focus:border-foreground focus:outline-none px-2 py-1.5 text-xs rounded-lg text-foreground transition-colors"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="px-4 py-2 border border-border rounded-lg text-xs hover:bg-muted transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-foreground text-background font-semibold rounded-lg text-xs hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {isSubmitting ? (
                'Adding to Pharmacy...'
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Add New Medicine</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

