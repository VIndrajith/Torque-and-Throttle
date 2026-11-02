import React, { useState, useMemo } from 'react';
import { Vehicle, QuickFilter } from '../types';
import { Gauge, Sparkles, Database, RefreshCw, Loader2, AlertTriangle, ShieldCheck, Settings } from 'lucide-react';
import { VehicleImageSlider } from './VehicleImageSlider';

interface VehicleGridProps {
  vehicles: Vehicle[];
  totalCount?: number;
  quickFilter: QuickFilter;
  onQuickFilterChange: (f: QuickFilter) => void;
  onResetFilters?: () => void;
  favorites?: string[];
  onToggleFavorite?: (id: string) => void;
  onSelectVehicleDyno?: (v: Vehicle) => void;
  onScheduleTestDrive: (v: Vehicle) => void;
  onViewVehicleDetail: (v: Vehicle) => void;
  onEnquireVehicle?: (v: Vehicle) => void;
  onOpenSupabaseSettings?: () => void;
  onRefreshSupabase?: () => Promise<void>;
}

const QUICK_FILTERS: { id: QuickFilter; label: string }[] = [
  { id: 'all', label: 'ALL' },
  { id: 'certified', label: 'CERTIFIED VAULT' },
  { id: 'sub-4s', label: 'SUB-4S 0-60' },
  { id: 'under-20k-miles', label: '< 20K MILES' },
  { id: 'manual', label: 'MANUAL GEARBOX' },
];

export const VehicleGrid: React.FC<VehicleGridProps> = ({
  vehicles,
  totalCount = 0,
  quickFilter,
  onQuickFilterChange,
  onResetFilters,
  onSelectVehicleDyno,
  onScheduleTestDrive,
  onViewVehicleDetail,
  onEnquireVehicle,
  onOpenSupabaseSettings,
  onRefreshSupabase,
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullMessage, setPullMessage] = useState<string | null>(null);

  const handleManualSync = async () => {
    if (!onRefreshSupabase) return;
    setIsPulling(true);
    setPullMessage(null);
    try {
      await onRefreshSupabase();
      setPullMessage('Fleet reloaded from Supabase!');
      setTimeout(() => setPullMessage(null), 4000);
    } catch (err: any) {
      setPullMessage(`Sync error: ${err?.message || err}`);
    } finally {
      setIsPulling(false);
    }
  };

  // Hardcoded year-wise sort: latest 2026 first, decreasing
  const sortedVehicles = useMemo(() => {
    return [...vehicles].sort((a, b) => {
      const yearA = typeof a.year === 'number' ? a.year : parseInt(String(a.year || 0), 10) || 0;
      const yearB = typeof b.year === 'number' ? b.year : parseInt(String(b.year || 0), 10) || 0;
      return yearB - yearA; // Latest 2026 first, decreasing
    });
  }, [vehicles]);

  return (
    <section id="inventory-section" className="pt-6 pb-16 bg-[#0F1115]/85 backdrop-blur-sm relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-0 sm:mb-10">
          <div className="hidden sm:block">
            <div className="flex items-center gap-2 text-[#E5252A] text-xs font-mono font-bold tracking-wider uppercase mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E5252A] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E5252A]"></span>
              </span>
              <span>VAULT STOCK UPDATED HOURLY</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#ECE5D8] tracking-tight uppercase">
              FEATURED FRESH ARRIVALS
            </h2>
          </div>


        </div>

        {pullMessage && (
          <div className="mb-6 p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-emerald-300 font-mono text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{pullMessage}</span>
          </div>
        )}

        {/* Vehicles Grid */}
        {vehicles.length === 0 ? (
          totalCount === 0 ? (
            /* Database Fleet has 0 records loaded */
            <div className="bg-[#171922] border border-white/[0.1] rounded-2xl p-8 sm:p-12 text-center my-8 max-w-2xl mx-auto shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-5 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Database className="w-7 h-7" />
              </div>
              <h3 className="font-display text-2xl font-black text-[#ECE5D8] mb-2 uppercase tracking-wide">
                Supabase Fleet Registry
              </h3>
              <p className="text-[#94A3B8] text-xs sm:text-sm max-w-lg mx-auto mb-6 font-sans leading-relaxed">
                Connect your Supabase database or fetch your 6 registered vehicle records to populate the inventory showroom.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
                {onRefreshSupabase && (
                  <button
                    onClick={handleManualSync}
                    disabled={isPulling}
                    className="w-full sm:w-auto px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer"
                  >
                    {isPulling ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    <span>{isPulling ? 'CONNECTING & FETCHING...' : 'PULL 6 CARS FROM SUPABASE'}</span>
                  </button>
                )}

                {onOpenSupabaseSettings && (
                  <button
                    onClick={onOpenSupabaseSettings}
                    className="w-full sm:w-auto px-5 py-3 rounded-lg bg-[#0F1115] hover:bg-[#1C1F2A] border border-white/[0.15] text-[#ECE5D8] font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-emerald-400" />
                    <span>DATABASE SETTINGS</span>
                  </button>
                )}
              </div>

              <div className="p-3 bg-[#0A0C10] border border-white/[0.06] rounded-xl text-left text-[11px] text-[#94A3B8] font-mono space-y-1">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[10px] uppercase">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>TROUBLESHOOTING YOUR 6 SUPABASE CARS</span>
                </div>
                <p className="leading-relaxed">
                  1. Check table name: Your cars should be in table <code className="text-emerald-400">vehicles</code> or <code className="text-emerald-400">cars</code>.
                </p>
                <p className="leading-relaxed">
                  2. Row Level Security: If Supabase RLS is enabled, public anon queries return 0 rows. Run <code className="text-amber-300">ALTER TABLE public.vehicles DISABLE ROW LEVEL SECURITY;</code> or use your service_role key.
                </p>
              </div>
            </div>
          ) : (
            /* Filters matched 0 cars */
            <div className="bg-[#171922] border border-white/[0.08] rounded-lg p-12 text-center my-8">
              <Gauge className="w-12 h-12 text-[#94A3B8] mx-auto mb-4 opacity-50" />
              <h3 className="font-display text-xl font-bold text-[#ECE5D8] mb-2">
                No Vehicles Match Filter Criteria
              </h3>
              <p className="text-[#94A3B8] text-sm max-w-md mx-auto mb-6 font-sans">
                Reset or adjust your car category filters, or submit a custom vehicle sourcing request.
              </p>
              <button
                onClick={() => {
                  if (onResetFilters) {
                    onResetFilters();
                  } else {
                    onQuickFilterChange('all');
                  }
                }}
                className="bg-[#E5252A] hover:bg-[#c00017] text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded transition-all cursor-pointer shadow-[0_0_15px_rgba(229,37,42,0.3)]"
              >
                Reset Filters
              </button>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedVehicles.map((car) => {
              return (
                <div
                  key={car.id}
                  id={`car-card-${car.id}`}
                  className="group bg-[#171922] border border-white/[0.08] hover:border-[#E5252A]/45 rounded-lg overflow-hidden flex flex-col transition-all duration-300 shadow-xl hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.6)]"
                >
                  {/* Image Bay with Multi-Image Sliding Gallery & Badges */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#0A0C10]">
                    <VehicleImageSlider
                      images={
                        car.galleryImages && car.galleryImages.length > 0
                          ? car.galleryImages
                          : [car.imageUrl]
                      }
                      alt={`${car.year} ${car.make} ${car.model}`}
                      aspectRatio="16/10"
                      showControls={true}
                      showDots={true}
                      showCounter={false}
                      allowFullscreen={false}
                      onImageClick={() => onViewVehicleDetail(car)}
                    />
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex flex-col flex-grow">
                    {/* Header: Category Badge, Year & Miles */}
                    <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8] mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#E5252A]/15 text-[#E5252A] border border-[#E5252A]/30 font-mono">
                          {car.category === 'sedans' ? 'SEDAN' : car.category.toUpperCase()}
                        </span>
                        <span>
                          {car.year} • {car.mileage.toLocaleString()} MI
                        </span>
                      </div>
                    </div>

                    {/* Vehicle Make Model Title */}
                    <a
                      href={`#/vehicle/${car.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onViewVehicleDetail(car);
                      }}
                      className="block cursor-pointer mb-1 group/title"
                    >
                      <h3 className="font-display text-xl font-extrabold text-[#ECE5D8] group-hover/title:text-[#E5252A] transition-colors leading-tight">
                        {car.year} {car.make} {car.model}
                      </h3>
                      <div className="text-xs text-[#94A3B8] font-sans font-medium truncate mt-0.5">
                        {car.trim || 'Certified Preowned'}
                      </div>
                    </a>

                    {/* Acquisition Spec */}
                    <div className="mb-3.5 flex items-center justify-between text-[11px] font-mono text-[#94A3B8]">
                      <span>{car.exteriorColor}</span>
                      {car.status === 'sold' || car.isSold ? (
                        <span className="text-red-400 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                          Sold
                        </span>
                      ) : car.status === 'reserved' ? (
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                          Reserved Allocation
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          Available Allocation
                        </span>
                      )}
                    </div>

                    {/* 4-Column Telemetry Rail: Power, Torque, Owners, Drivetrain */}
                    <div className="grid grid-cols-4 gap-2 py-3 px-2.5 bg-[#0F1115] border border-white/[0.06] rounded text-center mb-4">
                      {/* 1. POWER */}
                      <div className="flex flex-col">
                        <span className="text-[9px] font-mono uppercase text-[#94A3B8] font-bold">
                          POWER
                        </span>
                        <span className="text-xs font-bold text-[#ECE5D8] font-mono mt-0.5">
                          {car.powerHp || car.specs?.powerHp ? `${car.powerHp || car.specs?.powerHp} HP` : '—'}
                        </span>
                      </div>

                      {/* 2. TORQUE */}
                      <div className="flex flex-col border-l border-white/[0.06]">
                        <span className="text-[9px] font-mono uppercase text-[#94A3B8] font-bold">
                          TORQUE
                        </span>
                        <span className="text-xs font-bold text-[#ECE5D8] font-mono mt-0.5 truncate px-0.5">
                          {car.torque || car.specs?.torqueLbFt ? `${car.torque || car.specs?.torqueLbFt} NM` : '—'}
                        </span>
                      </div>

                      {/* 3. OWNERS */}
                      <div className="flex flex-col border-l border-white/[0.06]">
                        <span className="text-[9px] font-mono uppercase text-[#94A3B8] font-bold">
                          OWNERS
                        </span>
                        <span className="text-xs font-bold text-[#ECE5D8] font-mono mt-0.5 truncate px-0.5">
                          {car.owners || car.specs?.owners ? `${car.owners || car.specs?.owners}` : '1'}
                        </span>
                      </div>

                      {/* 4. DRIVETRAIN */}
                      <div className="flex flex-col border-l border-white/[0.06]">
                        <span className="text-[9px] font-mono uppercase text-[#94A3B8] font-bold">
                          DRIVETRAIN
                        </span>
                        <span className="text-xs font-bold text-[#ECE5D8] font-mono mt-0.5 truncate px-0.5">
                          {car.drivetrain || car.specs?.drivetrain || 'AWD'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons: I'm Interested & Schedule VIP Test Drive */}
                    <div className="grid grid-cols-2 gap-2">
                      {car.status === 'sold' || car.isSold ? (
                        <button
                          disabled
                          className="w-full bg-white/[0.05] border border-white/[0.08] text-[#94A3B8] text-xs font-bold font-sans uppercase tracking-wider py-3 rounded cursor-not-allowed flex items-center justify-center gap-1.5 opacity-60 col-span-2"
                        >
                          <span>Vehicle Sold &amp; Delivered</span>
                        </button>
                      ) : (
                        <>
                          <button
                            id={`btn-enquire-${car.id}`}
                            onClick={() => onEnquireVehicle ? onEnquireVehicle(car) : onViewVehicleDetail(car)}
                            className="w-full bg-[#E5252A] hover:bg-[#c00017] text-white text-xs font-bold font-sans uppercase tracking-wider py-3 rounded transition-all shadow-[0_0_12px_rgba(229,37,42,0.25)] hover:shadow-[0_0_20px_rgba(229,37,42,0.5)] flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>I'm Interested</span>
                          </button>

                          <button
                            id={`btn-schedule-testdrive-${car.id}`}
                            onClick={() => onScheduleTestDrive(car)}
                            className="w-full bg-[#0F1115] hover:bg-[#1E2230] border border-white/[0.12] hover:border-white/[0.25] text-[#ECE5D8] text-xs font-bold font-sans uppercase tracking-wider py-3 rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Gauge className="w-3.5 h-3.5 text-[#E5252A]" />
                            <span>Test Drive</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
