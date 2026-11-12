import React, { useState } from 'react';
import { LayoutDashboard, FileText, Pill } from 'lucide-react';
import { PharmacistDashboard } from './pages/PharmacistDashboard';
import { PrescriptionFulfillmentPage } from './pages/PrescriptionFulfillmentPage';
import { InventoryManagementPage } from './pages/InventoryManagementPage';

export const PharmacistPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'fulfillment' | 'inventory'>('overview');

  return (
    <div className="flex flex-col gap-6">
      {/* Subnavigation */}
      <div className="flex gap-1.5 border-b border-border pb-3 overflow-x-auto">
        <button
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
          onClick={() => setActiveTab('overview')}
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
          onClick={() => setActiveTab('fulfillment')}
        >
          <FileText size={15} />
          <span>Dispensary Orders</span>
        </button>
        <button
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'inventory'
              ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
          onClick={() => setActiveTab('inventory')}
        >
          <Pill size={15} />
          <span>Inventory & Stock</span>
        </button>
      </div>

      <div>
        {activeTab === 'overview' && (
          <PharmacistDashboard onNavigateToFulfillment={() => setActiveTab('fulfillment')} />
        )}
        {activeTab === 'fulfillment' && <PrescriptionFulfillmentPage />}
        {activeTab === 'inventory' && <InventoryManagementPage />}
      </div>
    </div>
  );
};
