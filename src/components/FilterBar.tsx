import React, { useMemo } from 'react';
import { FilterState, Vehicle } from '../types';
import { Search, ChevronDown, RotateCcw, LayoutGrid, Compass, Car, Gauge, Users, Bike } from 'lucide-react';

interface FilterBarProps {
  vehicles?: Vehicle[];
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onResetFilters: () => void;
  filteredCount: number;
  totalCount: number;
  categoryCounts?: Record<string, number>;
}

export const CATEGORIES = [
  { id: 'all', label: 'ALL INVENTORY', shortLabel: 'ALL', icon: LayoutGrid },
  { id: 'suv', label: 'SUV', shortLabel: 'SUV', icon: Compass },
  { id: 'sedans', label: 'Sedans', shortLabel: 'SEDANS', icon: Car },
  { id: 'hatchback', label: 'Hatchback', shortLabel: 'HATCHBACK', icon: Gauge },
  { id: 'mpv', label: 'MPV', shortLabel: 'MPV', icon: Users },
  { id: 'motorcycle', label: 'Motorcycle', shortLabel: 'MOTORCYCLE', icon: Bike },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  vehicles = [],
  filters,
  onFilterChange,
  onResetFilters,
  filteredCount,
  totalCount,
  categoryCounts,
}) => {
  // Real-time unique companies/makes currently in the database
  const availableMakes = useMemo(() => {
    const set = new Set<string>();
    vehicles.forEach((car) => {
      if (car.make && car.make.trim()) {
        set.add(car.make.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [vehicles]);

  return (
    <div className="hidden sm:block bg-[#12141C] border-y border-white/[0.08] shadow-2xl relative z-20 py-3 sm:py-4">
      <div className="hidden sm:block max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6 space-y-5 bg-gradient-to-b from-[#181B26] via-[#141620] to-[#10121A] rounded-2xl border border-white/[0.09] shadow-[0_12px_40px_-10px_rgba(0,0,0,0.7)] backdrop-blur-md">
        
        {/* Category Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.07] pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E5252A] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E5252A]"></span>
            </span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#ECE5D8] font-bold">
              CATEGORIES // BODY TYPE CLASSIFICATION
            </span>
            <span className="text-white/20 text-xs hidden sm:inline">|</span>
            <span className="text-[11px] font-mono text-[#94A3B8] hidden sm:inline">
              Selected: <strong className="text-[#ECE5D8]">{filters.category.toUpperCase()}</strong> ({filteredCount} matched)
            </span>
          </div>

          {(filters.category !== 'all' ||
            filters.make !== 'all' ||
            (filters.selectedVehicleId && filters.selectedVehicleId !== 'all') ||
            filters.transmission !== 'all') && (
            <button
              id="reset-filter-btn"
              onClick={onResetFilters}
              className="text-xs text-[#94A3B8] hover:text-[#E5252A] flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F1115] border border-white/[0.1] hover:border-[#E5252A]/50 transition-all cursor-pointer w-fit self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#E5252A]" />
              <span className="font-mono text-[11px] font-bold">RESET CRITERIA</span>
            </button>
          )}
        </div>

        {/* Category Filter: Dropdown on Mobile, Pill Bar on Desktop */}
        <div>
          {/* Mobile Only: Dropdown selector */}
          <div className="block sm:hidden">
            <label className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold block mb-1.5">
              SELECT CATEGORY / BODY TYPE
            </label>
            <div className="relative">
              <select
                id="mobile-category-select"
                value={filters.category.toLowerCase()}
                onChange={(e) => onFilterChange({ category: e.target.value })}
                className="w-full bg-[#0B0D13] border border-white/[0.15] focus:border-[#E5252A] rounded-xl text-xs font-bold text-[#ECE5D8] px-4 py-3 appearance-none outline-none pr-10 cursor-pointer shadow-inner"
              >
                {CATEGORIES.map((cat) => {
                  const count = categoryCounts?.[cat.id] ?? (cat.id === 'all' ? totalCount : 0);
                  return (
                    <option key={cat.id} value={cat.id.toLowerCase()} className="bg-[#171922] text-[#ECE5D8]">
                      {cat.label.toUpperCase()} ({count} UNITS)
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="w-4 h-4 text-[#E5252A] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Desktop Only: Horizontal Category Pills */}
          <div className="hidden sm:flex items-center gap-2.5 overflow-x-auto pb-1.5 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const isActive = filters.category.toLowerCase() === cat.id.toLowerCase();
              const Icon = cat.icon;
              const count = categoryCounts?.[cat.id] ?? (cat.id === 'all' ? totalCount : 0);

              return (
                <button
                  key={cat.id}
                  id={`category-btn-${cat.id}`}
                  onClick={() => onFilterChange({ category: cat.id })}
                  className={`group whitespace-nowrap px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider transition-all duration-200 flex items-center gap-2.5 shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-[#E5252A] to-[#D0181D] text-white shadow-[0_0_18px_rgba(229,37,42,0.45)] border border-[#FF4E52]/40 ring-1 ring-[#FF4E52]/30 scale-[1.02]'
                      : 'bg-[#0E1017] hover:bg-[#1A1D2A] text-[#ECE5D8] border border-white/[0.1] hover:border-[#E5252A]/40'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-[#94A3B8] group-hover:text-[#E5252A]'
                    }`}
                  />
                  <span className="uppercase font-display tracking-wide">{cat.label}</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold transition-colors ${
                      isActive
                        ? 'bg-black/30 text-white'
                        : 'bg-white/[0.06] text-[#94A3B8] group-hover:text-white group-hover:bg-white/[0.1]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Real-time Dynamic Dropdowns Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {/* Company / Make (Only Makes Currently in Database) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-wider font-bold text-[#94A3B8]">
              COMPANY ({availableMakes.length})
            </label>
            <div className="relative">
              <select
                id="filter-make"
                value={filters.make}
                onChange={(e) => onFilterChange({ make: e.target.value })}
                className="w-full bg-[#0B0D13] border border-white/[0.12] rounded-lg text-xs text-[#ECE5D8] px-3.5 py-2.5 appearance-none focus:outline-none focus:border-[#E5252A] pr-8 cursor-pointer hover:border-white/20 transition-colors"
              >
                <option value="all" className="bg-[#171922] text-[#ECE5D8]">
                  ALL COMPANIES ({availableMakes.length})
                </option>
                {availableMakes.map((makeName) => (
                  <option key={makeName} value={makeName} className="bg-[#171922] text-[#ECE5D8]">
                    {makeName}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Action Button: View Verified */}
          <div className="flex flex-col justify-end">
            <button
              id="filter-submit-btn"
              onClick={() => {
                const el = document.getElementById('inventory-section') || document.getElementById('vehicle-grid-container');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full bg-gradient-to-r from-[#E5252A] to-[#c00017] hover:from-[#f02b30] hover:to-[#d6001a] text-white font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(229,37,42,0.35)] hover:shadow-[0_0_24px_rgba(229,37,42,0.55)] cursor-pointer active:scale-[0.98] h-[38px]"
            >
              <Search className="w-3.5 h-3.5" />
              <span>VIEW {filteredCount} VERIFIED</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
