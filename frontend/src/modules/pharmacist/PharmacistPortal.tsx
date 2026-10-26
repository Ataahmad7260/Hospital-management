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
      <div className="flex gap-1.5 border-b border-mono-800 pb-2 overflow-x-auto">
        <button
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'text-white bg-mono-800 border border-mono-700 font-bold'
              : 'text-mono-400 hover:text-white hover:bg-mono-900 border border-transparent'
          }`}
          onClick={() => setActiveTab('overview')}
        >
          <LayoutDashboard size={15} />
          <span>Pharmacy Overview</span>
        </button>
        <button
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'fulfillment'
              ? 'text-white bg-mono-800 border border-mono-700 font-bold'
              : 'text-mono-400 hover:text-white hover:bg-mono-900 border border-transparent'
          }`}
          onClick={() => setActiveTab('fulfillment')}
        >
          <FileText size={15} />
          <span>Dispensary Orders</span>
        </button>
        <button
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === 'inventory'
              ? 'text-white bg-mono-800 border border-mono-700 font-bold'
              : 'text-mono-400 hover:text-white hover:bg-mono-900 border border-transparent'
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
