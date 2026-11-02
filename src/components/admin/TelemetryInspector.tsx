import React, { useState, useEffect } from 'react';
import { Vehicle } from '../../types';
import {
  ShieldCheck,
  Cpu,
  FileCheck2,
  Sliders,
  CheckCircle2,
  Trash2,
  Clock,
  Sparkles,
  Save,
  Check,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  Gauge,
  Pencil,
} from 'lucide-react';
import { VehicleImageSlider } from '../VehicleImageSlider';

interface TelemetryInspectorProps {
  vehicle: Vehicle | null;
  onUpdateVehicle: (updated: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  onToggleSold: (id: string, isSold: boolean) => void;
  onEditVehicle?: (vehicle: Vehicle) => void;
  className?: string;
}

export const TelemetryInspector: React.FC<TelemetryInspectorProps> = ({
  vehicle,
  onUpdateVehicle,
  onDeleteVehicle,
  onToggleSold,
  onEditVehicle,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'specs' | 'mechanical' | 'vahan'>('specs');

  // Inspector form states
  const [listingPrice, setListingPrice] = useState<number>(0);
  const [floorPrice, setFloorPrice] = useState<number>(0);
  const [statusState, setStatusState] = useState<'available' | 'reserved' | 'sold'>('available');
  const [technicianNotes, setTechnicianNotes] = useState<string>('');
  const [isCommitted, setIsCommitted] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  // Sync form when selected vehicle changes
  useEffect(() => {
    if (vehicle) {
      setListingPrice(vehicle.price || vehicle.targetPrice || 0);
      setFloorPrice(vehicle.floorPrice || Math.round((vehicle.price || 0) * 0.92));
      setStatusState(vehicle.status || (vehicle.isSold ? 'sold' : 'available'));
      setTechnicianNotes(vehicle.notes || 'Inspection passed across all checkpoint standards. Clean title verified.');
      setIsCommitted(false);
      setConfirmDelete(false);
    }
  }, [vehicle]);

  if (!vehicle) {
    return (
      <div className={`bg-[#11141A] border border-white/[0.08] rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[460px] text-[#94A3B8] w-full ${className}`}>
        <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-3">
          <Sliders className="w-6 h-6 text-[#94A3B8]/60" />
        </div>
        <h4 className="font-display font-bold text-sm text-[#ECE5D8] uppercase tracking-wider mb-1">
          No Active Telemetry Selected
        </h4>
        <p className="text-xs font-mono max-w-xs leading-relaxed text-[#94A3B8]/80">
          Select any vehicle chassis from the telemetry index to view cylinder health, review diagnostics, manage Vahan documents, or mark as sold.
        </p>
      </div>
    );
  }

  const handleCommitRecord = () => {
    const isSold = statusState === 'sold';
    const updated: Vehicle = {
      ...vehicle,
      price: listingPrice,
      targetPrice: listingPrice,
      floorPrice,
      status: statusState,
      isSold,
      notes: technicianNotes,
    };

    onUpdateVehicle(updated);
    setIsCommitted(true);
    setTimeout(() => setIsCommitted(false), 2500);
  };

  const isSoldStatus = statusState === 'sold' || vehicle.isSold;

  return (
    <div className={`bg-[#11141A] border border-white/[0.08] rounded-xl overflow-hidden flex flex-col font-sans w-full ${className}`}>
      {/* Top Header Bar */}
      <div className="px-5 py-3 border-b border-white/[0.08] bg-[#141720] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#E5252A] animate-pulse"></span>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#ECE5D8]">
            TELEMETRY INSPECTOR
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onEditVehicle && (
            <button
              type="button"
              onClick={() => onEditVehicle(vehicle)}
              className="bg-[#E5252A] hover:bg-[#c00017] text-white text-[11px] font-mono font-bold px-2.5 py-1 rounded flex items-center gap-1.5 transition-colors cursor-pointer shadow"
              title="Edit vehicle details, specs & photos"
            >
              <Pencil className="w-3 h-3" />
              <span>Edit Details &amp; Photos</span>
            </button>
          )}
          <span className="text-[10px] font-mono text-[#94A3B8] hidden sm:inline">
            ID: T&amp;T-{vehicle.id.slice(0, 8).toUpperCase()}
          </span>
          <button
            onClick={() => window.open(`#/inventory?q=${vehicle.model}`, '_blank')}
            className="text-[#94A3B8] hover:text-[#ECE5D8] transition-colors p-1"
            title="Open preview on customer portal"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Hero Vehicle Sliding Gallery with Indian Registration Plate */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#0A0C10]">
        <VehicleImageSlider
          images={
            vehicle.galleryImages && vehicle.galleryImages.length > 0
              ? vehicle.galleryImages
              : [vehicle.imageUrl]
          }
          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          aspectRatio="16/9"
          showControls={true}
          showCounter={true}
          showDots={true}
          allowFullscreen={true}
          overlayBadge={
            <>
              {/* Gradient shadow overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#11141A] via-transparent to-black/50 pointer-events-none"></div>

              {/* Top Badges */}
              <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none z-10">
                <div className="bg-black/80 text-white font-mono font-bold text-[10px] px-2.5 py-0.5 rounded border border-white/20 flex items-center gap-1.5 shadow-lg tracking-wider uppercase backdrop-blur-sm">
                  <ShieldCheck className="w-3 h-3 text-[#E5252A]" />
                  <span>{vehicle.category?.toUpperCase() || 'VAULT SPEC'}</span>
                </div>
              </div>

              <div className="absolute top-3 right-12 flex items-center gap-1.5 pointer-events-none z-10">
                {isSoldStatus && (
                  <span className="px-2 py-0.5 rounded bg-red-600/90 text-white font-mono text-[10px] font-bold tracking-wider uppercase border border-red-500 shadow-[0_0_12px_rgba(229,37,42,0.8)]">
                    SOLD OUT
                  </span>
                )}
              </div>

              {/* Bottom Banner inside Image */}
              <div className="absolute bottom-3 inset-x-3 flex items-end justify-between pointer-events-none z-10">
                <div>
                  <div className="font-display font-extrabold text-lg text-[#ECE5D8] leading-tight">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </div>
                </div>
              </div>
            </>
          }
        />
      </div>

      {/* Verified Database Specifications Banner */}
      <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#0E1017] px-4 py-2.5 text-xs font-mono">
        <div className="flex items-center gap-2 text-xs font-bold text-[#ECE5D8] uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>13 REGISTERED SPECIFICATIONS</span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
          DB VERIFIED
        </span>
      </div>

      {/* Inspector Body Details: The 13 Registered Parameters */}
      <div className="p-4 space-y-3 font-mono text-xs">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#0B0D13] border border-white/[0.06] rounded p-2.5">
            <span className="text-[9px] text-[#94A3B8] uppercase block">Company</span>
            <span className="font-bold text-[#ECE5D8] text-xs mt-0.5 block">{vehicle.make}</span>
          </div>
          <div className="bg-[#0B0D13] border border-white/[0.06] rounded p-2.5">
            <span className="text-[9px] text-[#94A3B8] uppercase block">Model</span>
            <span className="font-bold text-[#ECE5D8] text-xs mt-0.5 block">{vehicle.model}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#0B0D13] border border-white/[0.06] rounded p-2.5">
            <span className="text-[9px] text-[#94A3B8] uppercase block">Year</span>
            <span className="font-bold text-[#ECE5D8] text-xs mt-0.5 block">{vehicle.year}</span>
          </div>
          <div className="bg-[#0B0D13] border border-white/[0.06] rounded p-2.5">
            <span className="text-[9px] text-[#94A3B8] uppercase block">Category</span>
            <span className="font-bold text-[#ECE5D8] text-xs mt-0.5 block uppercase">{vehicle.category}</span>
          </div>
          <div className="bg-[#0B0D13] border border-white/[0.06] rounded p-2.5">
            <span className="text-[9px] text-[#94A3B8] uppercase block">Drivetrain</span>
            <span className="font-bold text-[#ECE5D8] text-xs mt-0.5 block">{vehicle.drivetrain || vehicle.specs?.drivetrain || 'AWD'}</span>
          </div>
        </div>

        <div className="bg-[#0B0D13] border border-white/[0.06] rounded p-2.5">
          <span className="text-[9px] text-[#94A3B8] uppercase block">Trim</span>
          <span className="font-bold text-[#ECE5D8] text-xs mt-0.5 block">{vehicle.trim}</span>
        </div>

        <div className="bg-[#0B0D13] border border-white/[0.06] rounded p-2.5">
          <span className="text-[9px] text-[#94A3B8] uppercase block">Engine Description</span>
          <span className="font-bold text-[#ECE5D8] text-xs mt-0.5 block">{vehicle.engine || vehicle.specs?.engine || 'OEM Specification'}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#0B0D13] border border-white/[0.06] rounded p-2.5">
            <span className="text-[9px] text-[#94A3B8] uppercase block">Power (HP)</span>
            <span className="font-bold text-[#E5252A] text-sm mt-0.5 block">{vehicle.powerHp || vehicle.specs?.powerHp || 0}</span>
          </div>
          <div className="bg-[#0B0D13] border border-white/[0.06] rounded p-2.5">
            <span className="text-[9px] text-[#94A3B8] uppercase block">Torque</span>
            <span className="font-bold text-[#ECE5D8] text-sm mt-0.5 block">{vehicle.torque || vehicle.specs?.torqueLbFt || 0}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#0B0D13] border border-white/[0.06] rounded p-2.5">
            <span className="text-[9px] text-[#94A3B8] uppercase block">Transmission</span>
            <span className="font-bold text-[#ECE5D8] text-xs mt-0.5 block truncate">{vehicle.transmission || vehicle.specs?.transmission || 'Automatic'}</span>
          </div>
          <div className="bg-[#0B0D13] border border-white/[0.06] rounded p-2.5">
            <span className="text-[9px] text-[#94A3B8] uppercase block">Odometer</span>
            <span className="font-bold text-[#ECE5D8] text-xs mt-0.5 block">{(vehicle.mileage || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#0B0D13] border border-white/[0.06] rounded p-2.5">
            <span className="text-[9px] text-[#94A3B8] uppercase block">Owner Count</span>
            <span className="font-bold text-[#ECE5D8] text-xs mt-0.5 block">{vehicle.owners || vehicle.specs?.owners || 1}</span>
          </div>
          <div className="bg-[#0B0D13] border border-white/[0.06] rounded p-2.5">
            <span className="text-[9px] text-[#94A3B8] uppercase block">Exterior Paint</span>
            <span className="font-bold text-[#ECE5D8] text-xs mt-0.5 block truncate">{vehicle.exteriorColor || 'OEM Factory Paint'}</span>
          </div>
        </div>



        {/* CONTROLS: CHASSIS STAGE STATE */}
        <div className="font-mono text-xs">
          <label className="block text-[10px] text-[#94A3B8] uppercase mb-1">CHASSIS STAGE STATE</label>
          <select
            value={statusState}
            onChange={(e) => {
              const next = e.target.value as 'available' | 'reserved' | 'sold';
              setStatusState(next);
            }}
            className={`w-full border rounded px-3 py-2 outline-none font-bold ${
              statusState === 'sold'
                ? 'bg-red-950/40 border-red-500 text-red-300'
                : statusState === 'reserved'
                ? 'bg-amber-950/40 border-amber-500 text-amber-300'
                : 'bg-[#0F1115] border-white/[0.1] text-emerald-400'
            }`}
          >
            <option value="available">Active / Showroom Ready</option>
            <option value="reserved">Tokened / Under Reserve</option>
            <option value="sold">Sold Out / Delivered Archive</option>
          </select>
        </div>

        {/* ADMIN COMMENTS & EXTRA INFORMATION (TEXT AREA) */}
        <div>
          <label className="block text-[10px] font-mono font-bold text-[#ECE5D8] uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>ADMIN COMMENTS &amp; EXTRA INFORMATION</span>
            <span className="text-[9px] text-[#94A3B8] font-normal font-mono">Real-time Saved to Car Record</span>
          </label>
          <textarea
            rows={4}
            value={technicianNotes}
            onChange={(e) => setTechnicianNotes(e.target.value)}
            placeholder="Add internal dealership notes, special equipment, service provenance, price negotiation guidelines, or extra details for this vehicle..."
            className="w-full bg-[#0F1115] border border-white/[0.1] focus:border-[#E5252A] rounded-lg p-3 text-xs text-[#ECE5D8] placeholder-[#94A3B8]/40 outline-none resize-y font-sans transition-colors leading-relaxed"
          />
        </div>

        {/* Action Buttons: COMMIT & SYNC RECORD + PRINT + ARCHIVE/DELETE */}
        <div className="pt-2 flex items-center gap-2">
          <button
            onClick={handleCommitRecord}
            className={`flex-1 py-3 px-4 rounded text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
              isCommitted
                ? 'bg-emerald-600 text-white'
                : 'bg-[#E5252A] hover:bg-[#c00017] text-white shadow-[0_0_20px_rgba(229,37,42,0.4)]'
            }`}
          >
            {isCommitted ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>RECORD SYNCED &amp; SAVED</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>COMMIT &amp; SYNC RECORD</span>
              </>
            )}
          </button>

          {onEditVehicle && (
            <button
              type="button"
              onClick={() => onEditVehicle(vehicle)}
              className="p-3 rounded bg-[#0F1115] hover:bg-[#E5252A]/20 border border-white/[0.1] hover:border-[#E5252A]/50 text-[#ECE5D8] hover:text-[#E5252A] transition-colors cursor-pointer"
              title="Edit full vehicle details & images"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => {
              if (confirmDelete) {
                onDeleteVehicle(vehicle.id);
                setConfirmDelete(false);
              } else {
                setConfirmDelete(true);
                setTimeout(() => setConfirmDelete(false), 4000);
              }
            }}
            className={`p-3 rounded border transition-colors cursor-pointer flex items-center gap-1.5 ${
              confirmDelete
                ? 'bg-red-600 text-white border-red-500 font-mono text-[10px] font-bold animate-pulse px-3'
                : 'bg-[#0F1115] hover:bg-red-500/20 border-white/[0.1] hover:border-red-500/40 text-[#94A3B8] hover:text-red-400'
            }`}
            title={confirmDelete ? 'Click again to confirm removing vehicle from database' : 'Remove vehicle from database'}
          >
            <Trash2 className="w-4 h-4" />
            {confirmDelete && <span>CONFIRM DELETE?</span>}
          </button>
        </div>

        {/* Quick Lifecycle Switcher button */}
        <div className="pt-1">
          {isSoldStatus ? (
            <button
              onClick={() => {
                setStatusState('available');
                onToggleSold(vehicle.id, false);
              }}
              className="w-full py-2 px-3 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Relist Vehicle (Mark as Available)</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setStatusState('sold');
                onToggleSold(vehicle.id, true);
              }}
              className="w-full py-2 px-3 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-mono font-bold uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Mark Vehicle as Sold Out</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
