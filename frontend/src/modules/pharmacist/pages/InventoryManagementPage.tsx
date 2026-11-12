import React, { useEffect, useMemo, useState } from 'react';
import { Pill, Plus, Search, AlertTriangle } from 'lucide-react';
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
} from '../../../shared/ui';
import { api } from '../../../shared/api';
import type { Medicine } from '../../../shared/types';
import { useAuth } from '../../../shared/context/AuthContext';
import { AddPharmacyItemModal } from '../components/AddPharmacyItemModal';

interface InventoryManagementPageProps {
  refreshTrigger?: number;
}

export const InventoryManagementPage: React.FC<InventoryManagementPageProps> = ({
  refreshTrigger = 0,
}) => {
  const { showToast } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW_STOCK'>('ALL');

  useEffect(() => {
    loadInventory();
  }, [refreshTrigger]);

  const loadInventory = async () => {
    try {
      const data = await api.getMedicines();
      setMedicines(data);
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

  const filteredMedicines = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return medicines.filter((med) => {
      if (stockFilter === 'LOW_STOCK' && med.stockQuantity > med.reorderLevel) {
        return false;
      }
      if (!q) return true;
      return (
        med.name.toLowerCase().includes(q) ||
        (med.genericName || '').toLowerCase().includes(q) ||
        med.category.toLowerCase().includes(q) ||
        med.batchNumber.toLowerCase().includes(q) ||
        (med.manufacturer || '').toLowerCase().includes(q)
      );
    });
  }, [medicines, searchQuery, stockFilter]);

  const lowStockCount = medicines.filter((m) => m.stockQuantity <= m.reorderLevel).length;
  const inventoryValuation = medicines.reduce(
    (sum, m) => sum + m.stockQuantity * m.unitPrice,
    0,
  );

  return (
    <div className="space-y-6 w-full max-w-full min-w-0">
      {/* Pharmacist Inventory Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 min-w-0">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-[0.68rem] font-mono uppercase text-muted-foreground">
            Registered Catalog Items
          </div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">
            {medicines.length}
          </div>
          <div className="text-[0.68rem] text-muted-foreground mt-0.5">
            Active formulations managed by Pharmacy
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-[0.68rem] font-mono uppercase text-muted-foreground flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-amber-400" />
            <span>Low Stock Alerts</span>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {lowStockCount}
          </div>
          <div className="text-[0.68rem] text-muted-foreground mt-0.5">
            Items at or below reorder threshold
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-[0.68rem] font-mono uppercase text-muted-foreground">
            Inventory Retail Value
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            ${inventoryValuation.toFixed(2)}
          </div>
          <div className="text-[0.68rem] text-muted-foreground mt-0.5">
            Current stock valuation across all batches
          </div>
        </div>
      </div>

      <Card
        title="Medicine Management & Batch Inventory Control"
        subtitle="Pharmacist-exclusive drug catalog: add new medicines, set unit pricing, and manage batch stock levels"
        icon={<Pill size={18} />}
        action={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add New Medicine
          </Button>
        }
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-border min-w-0">
          <div className="relative flex-1 min-w-0 max-w-full sm:max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search medicine, generic name, batch, or manufacturer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={() => setStockFilter('ALL')}
              className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border cursor-pointer transition-colors ${
                stockFilter === 'ALL'
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-card text-muted-foreground hover:text-foreground border-border'
              }`}
            >
              All ({medicines.length})
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('LOW_STOCK')}
              className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border cursor-pointer transition-colors ${
                stockFilter === 'LOW_STOCK'
                  ? 'bg-amber-500 text-black border-amber-500 shadow-xs'
                  : 'bg-card text-muted-foreground hover:text-foreground border-border'
              }`}
            >
              Low Stock ({lowStockCount})
            </button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Medicine Name</TableHead>
              <TableHead>Category &amp; Brand</TableHead>
              <TableHead>Batch Number</TableHead>
              <TableHead>Stock Level</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Expiration</TableHead>
              <TableHead>Stock Adjust</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMedicines.map((med) => (
              <TableRow key={med.id}>
                <TableCell>
                  <div className="font-semibold text-foreground">{med.name}</div>
                  <div className="text-muted-foreground text-xs">{med.genericName || 'Standard formulation'}</div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Badge variant="outline">{med.category}</Badge>
                    {med.manufacturer && (
                      <div className="text-[0.68rem] text-muted-foreground font-mono">
                        {med.manufacturer}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs text-muted-foreground">{med.batchNumber}</span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={med.stockQuantity <= med.reorderLevel ? 'solid' : 'outline'}
                    className={
                      med.stockQuantity <= med.reorderLevel
                        ? 'bg-destructive text-destructive-foreground'
                        : ''
                    }
                  >
                    {med.stockQuantity} units (min {med.reorderLevel})
                  </Badge>
                </TableCell>
                <TableCell className="font-mono font-semibold text-foreground">
                  ${med.unitPrice.toFixed(2)}
                </TableCell>
                <TableCell className="font-mono text-muted-foreground text-xs">
                  {new Date(med.expiryDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
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
                      onClick={() => handleUpdateStock(med.id, 1)}
                    >
                      +1
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
            {filteredMedicines.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8 font-mono text-xs">
                  No medicines matching current filter
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Exclusive Pharmacist Add Medicine Modal */}
      <AddPharmacyItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onMedicineAdded={loadInventory}
      />
    </div>
  );
};
