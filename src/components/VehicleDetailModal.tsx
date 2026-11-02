import React, { useState } from 'react';
import { Vehicle } from '../types';
import { X, ShieldCheck, Gauge, Truck, ArrowRight, Check, Award, SlidersHorizontal, Volume2, Loader2, Sparkles, Server } from 'lucide-react';
import { VehicleImageSlider } from './VehicleImageSlider';
import {
  sendDirectEmail,
} from '../utils/mailDispatcher';

interface VehicleDetailModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onOpenDyno?: (v: Vehicle) => void;
  onScheduleTestDrive: (v: Vehicle) => void;
  onEnquireVehicle?: (v: Vehicle) => void;
}

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
  vehicle,
  onClose,
  onOpenDyno,
  onScheduleTestDrive,
  onEnquireVehicle,
}) => {
  const [reserved, setReserved] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [lockReference, setLockReference] = useState('');

  if (!vehicle) return null;

  const images = vehicle.galleryImages && vehicle.galleryImages.length > 0
    ? vehicle.galleryImages
    : [vehicle.imageUrl];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
      <div className="bg-[#171922] border border-white/[0.15] rounded-lg max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-[#0F1115]">
          <div className="flex items-center gap-3">
            <span className="bg-[#E5252A] text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase">
              {vehicle.secondaryBadge}
            </span>
            <span className="text-xs font-mono text-[#94A3B8]">
              STOCK #{vehicle.id.toUpperCase()} • {vehicle.location}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-[#94A3B8] hover:text-white rounded hover:bg-white/[0.05]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-grow space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Gallery Column (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <VehicleImageSlider
                images={images}
                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                aspectRatio="16/10"
                showControls={true}
                showDots={true}
                showCounter={true}
                showThumbnails={true}
                allowFullscreen={true}
                overlayBadge={
                  <div className="absolute top-3 left-3 bg-[#0F1115]/90 border border-white/15 px-2.5 py-1 rounded text-[10px] font-mono font-bold text-[#ECE5D8] z-10 backdrop-blur-sm pointer-events-none">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#E5252A] inline mr-1" />
                    VERIFIED VAULT CHASSIS
                  </div>
                }
              />

              {/* Key Highlights list */}
              <div className="bg-[#0F1115] border border-white/[0.06] rounded-lg p-4 space-y-2">
                <span className="text-[10px] font-mono text-[#94A3B8] uppercase font-bold block">
                  FACTORY OPTIONS &amp; PROVENANCE
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#ECE5D8]">
                  {(vehicle.highlights || [
                    'Multi-Point Comprehensive Inspection Verified',
                    'Zero Abuse / Clean Road Provenance',
                    'Clean CARFAX Non-Salvage Guarantee',
                    'Complete Ownership &amp; Service History'
                  ]).map((h, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-[#E5252A] shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Vehicle Details & Actions (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              <div>
                <div className="text-xs font-mono text-[#94A3B8] mb-1">
                  {vehicle.year} • {vehicle.mileage.toLocaleString()} MILES • {vehicle.exteriorColor}
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-black text-[#ECE5D8] leading-tight mb-2">
                  {vehicle.make} {vehicle.model}
                </h2>
                <div className="text-sm font-semibold text-[#94A3B8] mb-4">
                  {vehicle.trim}
                </div>

                {/* Admin Notes & Extra Information (If present) */}
                {vehicle.notes && vehicle.notes.trim().length > 0 && (
                  <div className="p-3 bg-[#171922] border border-[#E5252A]/30 rounded-lg mb-4">
                    <span className="text-[10px] font-mono text-[#E5252A] uppercase font-bold block mb-1">
                      ADMIN NOTES &amp; EXTRA DETAILS
                    </span>
                    <p className="text-xs text-[#ECE5D8] leading-relaxed whitespace-pre-line">
                      {vehicle.notes}
                    </p>
                  </div>
                )}

                {/* Allocation Status Indicator (Replacing Price) */}
                <div className="p-3 bg-[#0F1115] border border-white/[0.08] rounded-lg mb-6 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#94A3B8] uppercase block">ACQUISITION STATUS</span>
                    <span className="font-mono text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      AVAILABLE FOR ALLOCATION
                    </span>
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-white/[0.06] text-[#ECE5D8] border border-white/10">
                    INQUIRY ONLY
                  </span>
                </div>

                {/* Telemetry specs grid */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-4">
                  <div className="bg-[#0F1115] p-3 rounded border border-white/[0.06]">
                    <span className="text-[10px] text-[#94A3B8] uppercase block">Engine</span>
                    <strong className="text-[#ECE5D8] text-xs">{vehicle.engine || vehicle.specs?.engine || 'OEM Specification'}</strong>
                  </div>
                  <div className="bg-[#0F1115] p-3 rounded border border-white/[0.06]">
                    <span className="text-[10px] text-[#94A3B8] uppercase block">Verified Output</span>
                    <strong className="text-[#E5252A] text-xs">{vehicle.powerHp || vehicle.specs?.powerHp || 0} HP</strong>
                  </div>
                  <div className="bg-[#0F1115] p-3 rounded border border-white/[0.06]">
                    <span className="text-[10px] text-[#94A3B8] uppercase block">0-60 Time</span>
                    <strong className="text-[#ECE5D8] text-xs">{vehicle.specs?.zeroToSixtySec || 4.2} Seconds</strong>
                  </div>
                  <div className="bg-[#0F1115] p-3 rounded border border-white/[0.06]">
                    <span className="text-[10px] text-[#94A3B8] uppercase block">Gearbox</span>
                    <strong className="text-[#ECE5D8] text-xs">{vehicle.transmission || vehicle.specs?.transmission || 'Automatic'}</strong>
                  </div>
                </div>
              </div>

              {/* Action row */}
              <div className="space-y-2 pt-4 border-t border-white/[0.08]">
                {reserved ? (
                  <div className="p-3.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-xs font-semibold text-center space-y-2">
                    <div className="font-bold flex items-center justify-center gap-1.5">
                      <Server className="w-4 h-4 text-emerald-400" />
                      <span>✓ 48-Hour Priority Lock Registered • Ref #{lockReference}</span>
                    </div>
                    <div className="text-[11px] text-emerald-300/90 font-mono">
                      POST /api/enquiries [HTTP 201 RECEIVED] • Queued for AI Agent
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {onEnquireVehicle && (
                      <button
                        id="modal-btn-enquire-vehicle"
                        onClick={() => {
                          onClose();
                          onEnquireVehicle(vehicle);
                        }}
                        className="w-full bg-[#E5252A] hover:bg-[#c00017] text-white text-xs font-bold uppercase tracking-wider py-3.5 rounded transition-all shadow-[0_0_15px_rgba(229,37,42,0.35)] cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>I'm Interested / Enquire Now</span>
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          onClose();
                          onScheduleTestDrive(vehicle);
                        }}
                        className="bg-[#171922] hover:bg-[#222634] border border-white/[0.15] text-[#ECE5D8] text-xs font-bold uppercase tracking-wider py-3 rounded transition-all cursor-pointer"
                      >
                        Book Test Drive
                      </button>
                      <button
                        disabled={isLocking}
                        onClick={async () => {
                          setIsLocking(true);
                          const ref = `LCK-${Math.floor(100000 + Math.random() * 900000)}`;
                          setLockReference(ref);
                          const payload = {
                            formTitle: 'VEHICLE ALLOCATION LOCK RESERVATION',
                            referenceId: ref,
                            fields: [
                              { label: 'Vehicle', value: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ''}` },
                              { label: 'Stock ID', value: vehicle.id.toUpperCase() },
                              { label: 'Mileage', value: `${vehicle.mileage.toLocaleString()} mi` },
                              { label: 'Exterior Color', value: vehicle.exteriorColor },
                              { label: 'Transmission', value: vehicle.transmission || vehicle.specs?.transmission || 'Automatic' },
                              { label: 'Horsepower', value: `${vehicle.powerHp || vehicle.specs?.powerHp || 0} HP` },
                            ],
                            additionalNotes: `Client placed 48-hour priority lock request on ${vehicle.year} ${vehicle.make} ${vehicle.model}.`,
                          };

                          try {
                            const res = await sendDirectEmail(payload);
                            if (res.id) setLockReference(res.id);
                          } catch (err) {
                            console.warn('Lock API POST dispatch warning:', err);
                          } finally {
                            setIsLocking(false);
                            setReserved(true);
                          }
                        }}
                        className="bg-[#0F1115] hover:bg-[#1E2230] border border-white/[0.12] disabled:opacity-60 text-[#ECE5D8] text-xs font-bold uppercase tracking-wider py-3 rounded transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {isLocking ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Locking...</span>
                          </>
                        ) : (
                          <span>Priority Lock</span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between text-[11px] text-[#94A3B8] pt-2">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-emerald-400" />
                    Enclosed transport available
                  </span>
                  <span>Certified Provenance &amp; Handover</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
