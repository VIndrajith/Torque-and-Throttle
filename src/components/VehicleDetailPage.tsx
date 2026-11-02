import React, { useState } from 'react';
import { Vehicle } from '../types';
import {
  ArrowLeft,
  ShieldCheck,
  Gauge,
  Truck,
  Calendar,
  Building2,
  Car,
  Layers,
  Tag,
  Cpu,
  Flame,
  SlidersHorizontal,
  Compass,
  Users,
  Palette,
  Check,
  CheckCircle2,
  Award,
  Sparkles,
  Phone,
  Mail,
  FileText,
  Share2,
  Lock,
  Server,
  Loader2,
  Headphones,
  Database,
  CheckCircle,
  ExternalLink,
  Info,
} from 'lucide-react';
import { VehicleImageSlider } from './VehicleImageSlider';
import { sendDirectEmail, TARGET_CONTACT_EMAIL } from '../utils/mailDispatcher';

interface VehicleDetailPageProps {
  vehicle: Vehicle;
  allVehicles: Vehicle[];
  onBackToInventory: () => void;
  onSelectVehicleDyno?: (v: Vehicle) => void;
  onScheduleTestDrive: (v: Vehicle) => void;
  onEnquireVehicle: (v: Vehicle) => void;
  onNavigateToVehicle: (vehicleId: string) => void;
}

export const VehicleDetailPage: React.FC<VehicleDetailPageProps> = ({
  vehicle,
  allVehicles,
  onBackToInventory,
  onSelectVehicleDyno,
  onScheduleTestDrive,
  onEnquireVehicle,
  onNavigateToVehicle,
}) => {
  const [reserved, setReserved] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [lockReference, setLockReference] = useState('');
  const [copiedShare, setCopiedShare] = useState(false);

  const images =
    vehicle.galleryImages && vehicle.galleryImages.length > 0
      ? vehicle.galleryImages
      : vehicle.imageUrl
      ? [vehicle.imageUrl]
      : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=85'];

  const handleShare = () => {
    try {
      const shareUrl = window.location.href;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2500);
      }
    } catch {
      // fallback
    }
  };

  const handlePriorityLock = async () => {
    setIsLocking(true);
    const ref = `LCK-${Math.floor(100000 + Math.random() * 900000)}`;
    setLockReference(ref);
    const payload = {
      formTitle: 'VEHICLE ALLOCATION PRIORITY LOCK',
      referenceId: ref,
      fields: [
        { label: 'Vehicle', value: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ''}` },
        { label: 'Stock ID', value: vehicle.id.toUpperCase() },
        { label: 'Company (make)', value: vehicle.make },
        { label: 'Model', value: vehicle.model },
        { label: 'Year', value: vehicle.year },
        { label: 'Category', value: vehicle.category },
        { label: 'Trim', value: vehicle.trim || 'Standard' },
        { label: 'Engine', value: vehicle.engine || vehicle.specs?.engine || 'OEM Specification' },
        { label: 'Power (HP)', value: `${vehicle.powerHp || vehicle.specs?.powerHp || 0} HP` },
        { label: 'Torque', value: `${vehicle.torque || vehicle.specs?.torqueLbFt || 0} lb-ft` },
        { label: 'Transmission', value: vehicle.transmission || vehicle.specs?.transmission || 'Automatic' },
        { label: 'Drivetrain', value: vehicle.drivetrain || vehicle.specs?.drivetrain || 'AWD' },
        { label: 'Mileage', value: `${(vehicle.mileage || 0).toLocaleString()} mi` },
        { label: 'Owners', value: `${vehicle.owners || vehicle.specs?.owners || 1}` },
        { label: 'Exterior Paint', value: vehicle.exteriorColor },
      ],
      additionalNotes: `Client placed immediate 48-hour priority allocation hold on ${vehicle.year} ${vehicle.make} ${vehicle.model} from vehicle webpage.`,
    };

    try {
      const res = await sendDirectEmail(payload);
      if (res.id) setLockReference(res.id);
    } catch (err) {
      console.warn('Priority lock API dispatch warning:', err);
    } finally {
      setIsLocking(false);
      setReserved(true);
    }
  };

  // Determine similar vehicles in vault (same category or make, excluding this one)
  const similarVehicles = allVehicles
    .filter((v) => v.id !== vehicle.id)
    .sort((a, b) => {
      const aMatch = (a.category === vehicle.category ? 2 : 0) + (a.make === vehicle.make ? 3 : 0);
      const bMatch = (b.category === vehicle.category ? 2 : 0) + (b.make === vehicle.make ? 3 : 0);
      return bMatch - aMatch;
    })
    .slice(0, 3);

  // Derive display values for the 13 parameters safely
  const engineVal = vehicle.engine || vehicle.specs?.engine || 'OEM Specification';
  const rawPower = vehicle.powerHp || vehicle.specs?.powerHp || 0;
  const powerVal = typeof rawPower === 'number' ? rawPower.toString() : String(rawPower).replace(/[^0-9.,]/g, '');
  const rawTorque = vehicle.torque || vehicle.specs?.torqueLbFt || 0;
  const torqueVal = typeof rawTorque === 'number' ? rawTorque.toString() : String(rawTorque).replace(/[^0-9.,]/g, '');
  const transmissionVal = vehicle.transmission || vehicle.specs?.transmission || 'Automatic';
  const drivetrainVal = vehicle.drivetrain || vehicle.specs?.drivetrain || 'AWD';
  const rawMileage = vehicle.mileage || 0;
  const odometerVal = (typeof rawMileage === 'number' ? rawMileage : Number(String(rawMileage).replace(/[^0-9]/g, '')) || 0).toLocaleString();
  const ownersVal = `${vehicle.owners || vehicle.specs?.owners || 1}`;
  const categoryVal = (vehicle.category || 'sedans').toUpperCase();

  const isSold = vehicle.status === 'sold' || vehicle.isSold;
  const isPendingReservation = vehicle.status === 'reserved' || reserved;

  return (
    <div className="w-full min-h-screen bg-[#0A0C10] text-[#ECE5D8] pb-24 relative selection:bg-[#E5252A] selection:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">
        {/* Title Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-white/[0.08]">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-[#94A3B8]">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#E5252A]/15 text-[#E5252A] border border-[#E5252A]/30">
                {categoryVal}
              </span>
              <span>•</span>
              <span className="text-[#ECE5D8] font-bold">{vehicle.year} MODEL</span>
              <span>•</span>
              <span>{odometerVal}</span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block border border-white/30"
                  style={{ backgroundColor: vehicle.exteriorColor.toLowerCase() }}
                ></span>
                {vehicle.exteriorColor}
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black text-[#ECE5D8] tracking-tight uppercase leading-none">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              <span className="text-lg sm:text-2xl lg:text-3xl font-bold text-[#94A3B8] tracking-wide uppercase">
                {vehicle.trim || 'Certified Preowned Edition'}
              </span>
            </div>
          </div>
        </div>

        {/* Top Grid: Gallery (7 Cols) & Immediate Action Bay (5 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Gallery Viewport */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-[#12141C] border border-white/[0.1] rounded-xl overflow-hidden shadow-2xl">
              <VehicleImageSlider
                images={images}
                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                aspectRatio="16/10"
                showControls={true}
                showDots={true}
                showCounter={true}
                showThumbnails={true}
                allowFullscreen={true}
              />
            </div>
          </div>

          {/* Right Action & Spec Highlight Column */}
          <div className="lg:col-span-5 space-y-5">
            {/* Allocation Status Card */}
            <div className="bg-[#12141C] border border-white/[0.1] rounded-xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <span className="text-xs font-mono text-[#94A3B8] uppercase font-bold tracking-wider">
                  ALLOCATION STATUS
                </span>
                <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#E5252A]/15 text-[#E5252A] font-bold border border-[#E5252A]/30">
                  {vehicle.secondaryBadge || 'CURATED ASSET'}
                </span>
              </div>

              <div className="space-y-1">
                <div className="font-display text-sm sm:text-2xl font-black text-[#ECE5D8] uppercase text-center whitespace-nowrap sm:whitespace-normal">
                  {isSold ? 'VEHICLE DELIVERED' : 'CONFIDENTIAL ALLOCATION'}
                </div>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Price upon application. Contact our Vault Specialist desk for private viewing arrangements, trade appraisal, or wire allocation instructions.
                </p>
              </div>

              {/* Primary Actions */}
              {!isSold && (
                <div className="space-y-3 pt-2">
                  <button
                    id="btn-card-enquire"
                    onClick={() => onEnquireVehicle(vehicle)}
                    className="w-full bg-[#E5252A] hover:bg-[#c00017] text-white text-xs font-bold uppercase tracking-wider py-4 rounded-lg transition-all shadow-[0_0_20px_rgba(229,37,42,0.35)] hover:shadow-[0_0_30px_rgba(229,37,42,0.55)] cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>I'm Interested / Enquire Now</span>
                  </button>

                  <button
                    onClick={() => onScheduleTestDrive(vehicle)}
                    className="w-full bg-[#171922] hover:bg-[#222634] border border-white/[0.15] text-[#ECE5D8] text-xs font-bold uppercase tracking-wider py-3.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Gauge className="w-4 h-4 text-[#E5252A]" />
                    <span>Book Test Drive</span>
                  </button>
                </div>
              )}
            </div>

            {/* Direct Specialist Line & Delivery Assurance */}
            <div className="bg-[#12141C] border border-white/[0.08] rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#E5252A]/15 border border-[#E5252A]/30 flex items-center justify-center text-[#E5252A] shrink-0">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-mono uppercase font-bold text-[#94A3B8]">
                    DIRECT VAULT SPECIALIST LINE
                  </div>
                  <a
                    href="tel:+919400581250"
                    className="text-base font-display font-black text-[#ECE5D8] hover:text-[#E5252A] transition-colors"
                  >
                    +91 9400581250
                  </a>
                </div>
              </div>

              <div className="pt-3 border-t border-white/[0.06] text-xs text-[#94A3B8]">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Flatbed Enclosed Transport Available</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 13 REGISTERED DATABASE PARAMETERS PROMINENT SECTION */}
        <section
          id="registered-database-parameters"
          className="bg-[#12141C] border border-white/[0.1] rounded-2xl p-6 sm:p-8 lg:p-10 shadow-2xl relative overflow-hidden"
        >
          {/* Ambient Corner Accent */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#E5252A]/5 blur-3xl pointer-events-none -z-0"></div>

          <div className="relative z-10 space-y-8">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
              <div>
                <div className="inline-flex items-center gap-2 text-[#E5252A] text-xs font-mono font-bold tracking-widest uppercase mb-1.5">
                  <Database className="w-4 h-4" />
                  <span>OFFICIAL SPECIFICATION RECORD</span>
                </div>
                <h2 className="font-display text-[11px] sm:text-2xl lg:text-3xl font-black text-[#ECE5D8] tracking-tight uppercase text-center sm:text-left whitespace-nowrap sm:whitespace-normal">
                  REGISTERED SPECIFICATIONS &amp; ATTRIBUTES
                </h2>
                <p className="text-xs sm:text-sm text-[#94A3B8] mt-1 font-sans">
                  The verified foundational attributes persisted in the Torque &amp; Throttle vault database for this vehicle.
                </p>
              </div>

              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold shrink-0">
                <CheckCircle2 className="w-4 h-4" />
                <span>PARAMETERS VALIDATED</span>
              </div>
            </div>

            {/* Admin Extra Information / Comments (If present in database) */}
            {vehicle.notes && vehicle.notes.trim().length > 0 && (
              <div className="bg-[#171922] border border-[#E5252A]/30 bg-gradient-to-r from-[#171922] via-[#1c1417] to-[#171922] p-5 sm:p-6 rounded-xl shadow-lg">
                <div className="flex items-center gap-2 text-xs font-mono text-[#E5252A] uppercase font-bold mb-2">
                  <FileText className="w-4 h-4 text-[#E5252A]" />
                  <span>ADMIN NOTES &amp; EXTRA VEHICLE INFORMATION</span>
                </div>
                <p className="text-sm sm:text-base font-sans text-[#ECE5D8] leading-relaxed whitespace-pre-line">
                  {vehicle.notes}
                </p>
              </div>
            )}

            {/* Structured Specifications Grid */}
            <div className="space-y-6">
              {/* Group 1: Powertrain & Performance Highlight Row */}
              <div>
                <div className="text-xs font-mono text-[#94A3B8] uppercase font-bold tracking-wider mb-3 flex items-center justify-center sm:justify-start gap-2">
                  <Flame className="w-3.5 h-3.5 text-[#E5252A]" />
                  <span>POWERTRAIN &amp; SPECIFICATIONS</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Power (HP) */}
                  <div className="bg-[#171922] border border-[#E5252A]/30 hover:border-[#E5252A]/60 p-4 sm:p-5 rounded-xl transition-all bg-gradient-to-br from-[#171922] to-[#201214] flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs font-mono text-[#E5252A] uppercase font-bold">
                      <Flame className="w-4 h-4 shrink-0" />
                      <span>Power (HP)</span>
                    </div>
                    <div className="font-display text-2xl sm:text-3xl font-black text-[#E5252A]">
                      {powerVal}
                    </div>
                  </div>

                  {/* Torque */}
                  <div className="bg-[#171922] border border-white/[0.08] hover:border-white/[0.2] p-4 sm:p-5 rounded-xl transition-all flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs font-mono text-[#94A3B8] uppercase font-bold">
                      <Gauge className="w-4 h-4 text-[#E5252A] shrink-0" />
                      <span>Torque</span>
                    </div>
                    <div className="font-display text-xl sm:text-2xl font-black text-[#ECE5D8]">
                      {torqueVal}
                    </div>
                  </div>

                  {/* Transmission */}
                  <div className="bg-[#171922] border border-white/[0.08] hover:border-white/[0.2] p-4 sm:p-5 rounded-xl transition-all flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs font-mono text-[#94A3B8] uppercase font-bold">
                      <SlidersHorizontal className="w-4 h-4 text-[#E5252A] shrink-0" />
                      <span>Transmission</span>
                    </div>
                    <div className="font-display text-sm sm:text-base font-bold text-[#ECE5D8] truncate max-w-[55%] text-right" title={transmissionVal}>
                      {transmissionVal}
                    </div>
                  </div>

                  {/* Drivetrain */}
                  <div className="bg-[#171922] border border-white/[0.08] hover:border-white/[0.2] p-4 sm:p-5 rounded-xl transition-all flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs font-mono text-[#94A3B8] uppercase font-bold">
                      <Compass className="w-4 h-4 text-[#E5252A] shrink-0" />
                      <span>Drivetrain</span>
                    </div>
                    <div className="font-display text-sm sm:text-base font-bold text-[#ECE5D8]">
                      {drivetrainVal}
                    </div>
                  </div>
                </div>

                {/* Engine Description spanning clean banner */}
                <div className="mt-4 bg-[#171922] border border-white/[0.08] hover:border-white/[0.2] p-4 sm:p-5 rounded-xl transition-all flex flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#94A3B8] uppercase font-bold shrink-0">
                    <Cpu className="w-4 h-4 text-[#E5252A]" />
                    <span>Engine</span>
                  </div>
                  <div className="font-display text-sm sm:text-base font-bold text-[#ECE5D8] text-right truncate max-w-[70%]" title={engineVal}>
                    {engineVal}
                  </div>
                </div>
              </div>

              {/* Group 2: Heritage, Identity & Paint */}
              <div>
                <div className="text-xs font-mono text-[#94A3B8] uppercase font-bold tracking-wider mb-3 flex items-center justify-center sm:justify-start gap-2">
                  <Car className="w-3.5 h-3.5 text-[#E5252A]" />
                  <span>IDENTITY &amp; SPECIFICATION</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Company (make) */}
                  <div className="bg-[#171922] border border-white/[0.08] hover:border-white/[0.2] p-4 sm:p-5 rounded-xl transition-all flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs font-mono text-[#94A3B8] uppercase font-bold">
                      <Building2 className="w-4 h-4 text-[#E5252A] shrink-0" />
                      <span>Company</span>
                    </div>
                    <div className="font-display text-base sm:text-lg font-bold text-[#ECE5D8]">
                      {vehicle.make}
                    </div>
                  </div>

                  {/* Model */}
                  <div className="bg-[#171922] border border-white/[0.08] hover:border-white/[0.2] p-4 sm:p-5 rounded-xl transition-all flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs font-mono text-[#94A3B8] uppercase font-bold">
                      <Car className="w-4 h-4 text-[#E5252A] shrink-0" />
                      <span>Model</span>
                    </div>
                    <div className="font-display text-base sm:text-lg font-bold text-[#ECE5D8]">
                      {vehicle.model}
                    </div>
                  </div>

                  {/* Year */}
                  <div className="bg-[#171922] border border-white/[0.08] hover:border-white/[0.2] p-4 sm:p-5 rounded-xl transition-all flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs font-mono text-[#94A3B8] uppercase font-bold">
                      <Calendar className="w-4 h-4 text-[#E5252A] shrink-0" />
                      <span>Year</span>
                    </div>
                    <div className="font-display text-base sm:text-lg font-bold text-[#ECE5D8]">
                      {vehicle.year}
                    </div>
                  </div>

                  {/* Category */}
                  <div className="bg-[#171922] border border-white/[0.08] hover:border-white/[0.2] p-4 sm:p-5 rounded-xl transition-all flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs font-mono text-[#94A3B8] uppercase font-bold">
                      <Layers className="w-4 h-4 text-[#E5252A] shrink-0" />
                      <span>Category</span>
                    </div>
                    <div className="font-display text-sm font-bold text-[#ECE5D8]">
                      <span className="px-2.5 py-0.5 rounded bg-white/[0.08] text-xs font-mono uppercase tracking-wider">
                        {categoryVal}
                      </span>
                    </div>
                  </div>

                  {/* Trim / Variant */}
                  <div className="bg-[#171922] border border-white/[0.08] hover:border-white/[0.2] p-4 sm:p-5 rounded-xl transition-all flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs font-mono text-[#94A3B8] uppercase font-bold">
                      <Tag className="w-4 h-4 text-[#E5252A] shrink-0" />
                      <span>Trim</span>
                    </div>
                    <div className="font-display text-sm sm:text-base font-bold text-[#ECE5D8] truncate max-w-[55%] text-right" title={vehicle.trim}>
                      {vehicle.trim || 'Standard'}
                    </div>
                  </div>

                  {/* Exterior Paint */}
                  <div className="bg-[#171922] border border-white/[0.08] hover:border-white/[0.2] p-4 sm:p-5 rounded-xl transition-all flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs font-mono text-[#94A3B8] uppercase font-bold">
                      <Palette className="w-4 h-4 text-[#E5252A] shrink-0" />
                      <span>Paint</span>
                    </div>
                    <div className="font-display text-sm sm:text-base font-bold text-[#ECE5D8] flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0"
                        style={{ backgroundColor: vehicle.exteriorColor.toLowerCase() }}
                      ></span>
                      <span className="truncate">{vehicle.exteriorColor}</span>
                    </div>
                  </div>

                  {/* Odometer */}
                  <div className="bg-[#171922] border border-emerald-500/20 hover:border-emerald-500/40 p-4 sm:p-5 rounded-xl transition-all flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase font-bold">
                      <Gauge className="w-4 h-4 shrink-0" />
                      <span>Odometer</span>
                    </div>
                    <div className="font-display text-base sm:text-lg font-bold text-emerald-400">
                      {odometerVal}
                    </div>
                  </div>

                  {/* Owner Count */}
                  <div className="bg-[#171922] border border-white/[0.08] hover:border-white/[0.2] p-4 sm:p-5 rounded-xl transition-all flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs font-mono text-[#94A3B8] uppercase font-bold">
                      <Users className="w-4 h-4 text-[#E5252A] shrink-0" />
                      <span>Owners</span>
                    </div>
                    <div className="font-display text-base sm:text-lg font-bold text-[#ECE5D8]">
                      {ownersVal}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>



        {/* Similar / Other Vault Inventory Recommendations */}
        {similarVehicles.length > 0 && (
          <section className="pt-8 border-t border-white/[0.08] space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-[#E5252A] tracking-wider uppercase block">
                  EXPLORE ALTERNATIVES
                </span>
                <h3 className="font-display text-2xl font-black text-[#ECE5D8] uppercase">
                  SIMILAR VAULT ALLOCATIONS
                </h3>
              </div>
              <button
                onClick={onBackToInventory}
                className="text-xs font-mono font-bold text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
              >
                VIEW FULL INVENTORY ({allVehicles.length}) →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarVehicles.map((car) => (
                <div
                  key={car.id}
                  onClick={() => onNavigateToVehicle(car.id)}
                  className="group bg-[#171922] border border-white/[0.08] hover:border-[#E5252A]/40 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 shadow-lg hover:-translate-y-1"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#0A0C10]">
                    <img
                      src={car.imageUrl || (car.galleryImages && car.galleryImages[0]) || ''}
                      alt={`${car.year} ${car.make} ${car.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 bg-[#0F1115]/90 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-emerald-400 border border-white/10">
                      {car.year} • {car.category.toUpperCase()}
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="text-xs font-mono text-[#94A3B8]">
                      {(car.mileage || 0).toLocaleString()} MILES • {car.exteriorColor}
                    </div>
                    <h4 className="font-display text-base font-bold text-[#ECE5D8] group-hover:text-white truncate">
                      {car.make} {car.model}
                    </h4>
                    <div className="text-xs text-[#94A3B8] truncate">{car.trim}</div>
                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
                      <span className="text-emerald-400 font-bold">{car.powerHp || car.specs?.powerHp || 0} HP</span>
                      <span className="text-[#E5252A] group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">
                        View Spec →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
