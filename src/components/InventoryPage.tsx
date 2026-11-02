import React from 'react';
import { FilterBar } from './FilterBar';
import { VehicleGrid } from './VehicleGrid';
import { CustomRequestBanner } from './CustomRequestBanner';
import { Vehicle, FilterState, QuickFilter } from '../types';
import { ShieldCheck } from 'lucide-react';

interface InventoryPageProps {
  vehicles: Vehicle[];
  totalCount: number;
  filteredVehicles: Vehicle[];
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onResetFilters: () => void;
  categoryCounts: Record<string, number>;
  quickFilter: QuickFilter;
  onQuickFilterChange: (f: QuickFilter) => void;
  favorites?: string[];
  onToggleFavorite?: (id: string) => void;
  onSelectVehicleDyno?: (v: Vehicle) => void;
  onScheduleTestDrive: (v: Vehicle) => void;
  onViewVehicleDetail: (v: Vehicle) => void;
  onEnquireVehicle: (v: Vehicle) => void;
  onOpenCustomRequest?: () => void;
  onBackToHome: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenSupabaseSettings?: () => void;
  onRefreshSupabase?: () => Promise<void>;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({
  vehicles,
  totalCount,
  filteredVehicles,
  filters,
  onFilterChange,
  onResetFilters,
  categoryCounts,
  quickFilter,
  onQuickFilterChange,
  onSelectVehicleDyno,
  onScheduleTestDrive,
  onViewVehicleDetail,
  onEnquireVehicle,
  onOpenCustomRequest,
  onBackToHome,
  searchQuery,
  onSearchChange,
  onOpenSupabaseSettings,
  onRefreshSupabase,
}) => {
  return (
    <>
      {/* Primary Inventory Viewport Container */}
      <div className="w-full relative min-h-screen">
        {/* Page Header / Breadcrumb Bar */}
        <div className="bg-[#12141C] border-b border-white/[0.08] py-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 text-[#E5252A] text-xs font-mono font-bold tracking-widest uppercase mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>CERTIFIED LIVE INVENTORY</span>
                </div>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#ECE5D8] tracking-tight uppercase">
                  THE VAULT INVENTORY
                </h1>
              </div>

              {/* Quick Metrics Badge */}
              <div className="hidden sm:flex items-center gap-3 bg-[#171922] border border-white/[0.1] rounded-lg px-4 py-3 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] font-mono text-[#94A3B8] uppercase block">AVAILABLE UNITS</span>
                  <span className="font-display text-xl sm:text-2xl font-black text-[#ECE5D8]">
                    {filteredVehicles.length}{' '}
                    <span className="text-xs text-[#94A3B8] font-normal font-sans">/ {totalCount}</span>
                  </span>
                </div>
                <div className="w-[1px] h-8 bg-white/[0.1]"></div>
                <div className="text-left">
                  <span className="text-[10px] font-mono text-emerald-400 uppercase block">100% INSPECTED</span>
                  <span className="text-xs text-[#ECE5D8] font-mono font-semibold">Ready for Delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Dock Bar */}
        <FilterBar
          vehicles={vehicles}
          filters={filters}
          onFilterChange={onFilterChange}
          onResetFilters={onResetFilters}
          filteredCount={filteredVehicles.length}
          totalCount={totalCount}
          categoryCounts={categoryCounts}
        />

        {/* Vehicle Grid */}
        <VehicleGrid
          vehicles={filteredVehicles}
          totalCount={totalCount}
          quickFilter={quickFilter}
          onQuickFilterChange={onQuickFilterChange}
          onResetFilters={onResetFilters}
          onSelectVehicleDyno={onSelectVehicleDyno}
          onScheduleTestDrive={onScheduleTestDrive}
          onViewVehicleDetail={onViewVehicleDetail}
          onEnquireVehicle={onEnquireVehicle}
          onOpenSupabaseSettings={onOpenSupabaseSettings}
          onRefreshSupabase={onRefreshSupabase}
        />
      </div>

      {/* Bespoke Vehicle Model Request Banner Placed Separately Above Footer */}
      <CustomRequestBanner onOpenModal={onOpenCustomRequest} />
    </>
  );
};
