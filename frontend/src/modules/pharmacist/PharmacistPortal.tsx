import React, { useEffect, useState } from 'react';
import { LayoutDashboard, FileText, Pill, TrendingUp, Plus } from 'lucide-react';
import { PharmacistDashboard } from './pages/PharmacistDashboard';
import { PrescriptionFulfillmentPage } from './pages/PrescriptionFulfillmentPage';
import { InventoryManagementPage } from './pages/InventoryManagementPage';
import { SalesRevenueLedgerPage } from './pages/SalesRevenueLedgerPage';
import { AddPharmacyItemModal } from './components/AddPharmacyItemModal';

export type PharmacistTab = 'overview' | 'fulfillment' | 'sales' | 'inventory';

interface PharmacistPortalProps {
  initialTab?: PharmacistTab;
  onNavigate?: (route: string) => void;
}

export const PharmacistPortal: React.FC<PharmacistPortalProps> = ({
  initialTab = 'overview',
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<PharmacistTab>(initialTab);
  const [pendingBillRxId, setPendingBillRxId] = useState<string | null>(null);
  const [isAddMedicineOpen, setIsAddMedicineOpen] = useState(false);
  const [inventoryRefreshKey, setInventoryRefreshKey] = useState(0);

  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (tab: PharmacistTab) => {
    setActiveTab(tab);
    const routeMap: Record<PharmacistTab, string> = {
      overview: 'pharmacist/dashboard',
      fulfillment: 'pharmacist/fulfillment',
      sales: 'pharmacist/sales',
      inventory: 'pharmacist/inventory',
    };
    const targetRoute = routeMap[tab];
    if (onNavigate) {
      onNavigate(targetRoute);
    } else {
      window.location.hash = `#/${targetRoute}`;
    }
  };

  const handleOpenFulfillmentWithBill = (rxId?: string) => {
    setPendingBillRxId(rxId || null);
    handleTabChange('fulfillment');
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-full min-w-0">
      {/* Subnavigation + Pharmacist-Exclusive Add Medicine Action */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-border pb-3 min-w-0 max-w-full">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto scrollbar-hidden min-w-0 max-w-full select-none">
          <button
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            onClick={() => handleTabChange('overview')}
          >
            <LayoutDashboard size={15} />
            <span>Pharmacy Overview</span>
          </button>

          <button
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'fulfillment'
                ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            onClick={() => handleOpenFulfillmentWithBill()}
          >
            <FileText size={15} />
            <span>Dispensary Orders &amp; Billing</span>
          </button>

          <button
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'sales'
                ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            onClick={() => handleTabChange('sales')}
          >
            <TrendingUp size={15} />
            <span>Sales &amp; Revenue Ledger</span>
          </button>

          <button
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            onClick={() => handleTabChange('inventory')}
          >
            <Pill size={15} />
            <span>Medicine Management &amp; Stock</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsAddMedicineOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs shrink-0 self-start md:self-auto"
        >
          <Plus size={13} />
          <span>Add New Medicine</span>
        </button>
      </div>

      <div className="w-full max-w-full min-w-0">
        {activeTab === 'overview' && (
          <PharmacistDashboard
            refreshTrigger={inventoryRefreshKey}
            onNavigateToFulfillment={handleOpenFulfillmentWithBill}
            onNavigateToSales={() => handleTabChange('sales')}
            onNavigateToInventory={() => handleTabChange('inventory')}
            onAddMedicineClick={() => setIsAddMedicineOpen(true)}
          />
        )}
        {activeTab === 'fulfillment' && (
          <PrescriptionFulfillmentPage
            initialBillingRxId={pendingBillRxId}
            onClearInitialBillingRxId={() => setPendingBillRxId(null)}
          />
        )}
        {activeTab === 'sales' && <SalesRevenueLedgerPage />}
        {activeTab === 'inventory' && (
          <InventoryManagementPage refreshTrigger={inventoryRefreshKey} />
        )}
      </div>

      <AddPharmacyItemModal
        isOpen={isAddMedicineOpen}
        onClose={() => setIsAddMedicineOpen(false)}
        onMedicineAdded={() => setInventoryRefreshKey((prev) => prev + 1)}
      />
    </div>
  );
};
