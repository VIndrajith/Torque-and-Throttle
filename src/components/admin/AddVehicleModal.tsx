import React, { useState, useEffect } from 'react';
import { Vehicle } from '../../types';
import { X, Plus, Upload, Trash2, Star, ArrowLeft, ArrowRight, Loader2, AlertCircle, Cloud } from 'lucide-react';
import { compressImageFile, compressImageFileToBlob, estimateGallerySizeBytes, ensureGalleryFitsFirestoreBudget } from '../../utils/imageCompressor';
import { uploadVehicleImage } from '../../firebase/storageService';

interface AddVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newVehicle: Vehicle) => Promise<void> | void;
}

export const AddVehicleModal: React.FC<AddVehicleModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  // Exactly the 13 registered database fields requested:
  // 1. Company
  const [make, setMake] = useState('');
  // 2. Model
  const [model, setModel] = useState('');
  // 3. Year
  const [year, setYear] = useState<number | ''>(2023);
  // 4. Category
  const [category, setCategory] = useState<'hatchback' | 'sedans' | 'suv' | 'mpv' | 'motorcycle'>('sedans');
  // 5. Trim
  const [trim, setTrim] = useState('');
  // 6. Engine Description
  const [engine, setEngine] = useState('');
  // 7. Power (HP)
  const [powerHp, setPowerHp] = useState<number | ''>('');
  // 8. Torque
  const [torque, setTorque] = useState<number | ''>('');
  // 9. Transmission
  const [transmission, setTransmission] = useState('');
  // 10. Drivetrain
  const [drivetrain, setDrivetrain] = useState<'FWD' | 'RWD' | 'AWD' | '4WD'>('AWD');
  // 11. Odometer
  const [mileage, setMileage] = useState<number | ''>('');
  // 12. Owner Count
  const [owners, setOwners] = useState<number | ''>(1);
  // 13. Exterior Paint
  const [exteriorColor, setExteriorColor] = useState('');
  // Admin Notes & Extra Info
  const [notes, setNotes] = useState('');

  // Status & Media
  const [status, setStatus] = useState<'available' | 'reserved' | 'sold'>('available');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState<string>('');
  const [urlInput, setUrlInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Handle file uploads with maximum adaptive compression and direct Firebase Cloud Storage upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setSubmitError(null);
    const tempId = make && model ? `${make}-${model}` : 'new-car';

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadStatusMsg(`Compressing & uploading image ${i + 1} of ${files.length}...`);
        try {
          const downloadUrl = await uploadVehicleImage(file, tempId, file.name);
          if (downloadUrl) {
            setGalleryImages((prev) => [...prev, downloadUrl]);
          }
        } catch (err) {
          console.warn('Fallback compressing image locally:', err);
          const fallbackDataUrl = await compressImageFile(file, 800, 600, 0.55, 30 * 1024);
          if (fallbackDataUrl) {
            setGalleryImages((prev) => [...prev, fallbackDataUrl]);
          }
        }
      }
    } finally {
      setIsUploading(false);
      setUploadStatusMsg('');
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleAddUrlImage = () => {
    if (urlInput.trim()) {
      setGalleryImages((prev) => [...prev, urlInput.trim()]);
      setUrlInput('');
    }
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    setGalleryImages((prev) => {
      const selected = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [selected, ...rest];
    });
  };

  const handleRemoveImage = (index: number) => {
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= galleryImages.length) return;
    setGalleryImages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleResetForm = () => {
    setMake('');
    setModel('');
    setYear(2023);
    setCategory('sedans');
    setTrim('');
    setEngine('');
    setPowerHp('');
    setTorque('');
    setTransmission('');
    setDrivetrain('AWD');
    setMileage('');
    setOwners(1);
    setExteriorColor('');
    setNotes('');
    setStatus('available');
    setGalleryImages([]);
    setUrlInput('');
  };

  // Reset form to clean state whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      handleResetForm();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const id = `car-${make.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${model.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`;
      const rawGallery = galleryImages.filter(Boolean);
      // Ensure all images (even fallback data URLs) fit comfortably within Firestore document limit
      const fullGallery = await ensureGalleryFitsFirestoreBudget(rawGallery, 350 * 1024);
      const primaryImg = fullGallery[0] || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=85';

      // Store vehicle with 13 registered fields, ID, photos, and admin notes
      const newVehicle: Vehicle = {
        id,
        make: make.trim(), // Company
        model: model.trim(), // Model
        year: Number(year), // Year
        category, // Category
        trim: trim.trim(), // Trim
        engine: engine.trim(), // Engine Description
        powerHp: Number(powerHp) || 0, // Power (HP)
        torque: Number(torque) || 0, // Torque
        transmission: transmission.trim(), // Transmission
        drivetrain, // Drivetrain
        mileage: Number(mileage) || 0, // Odometer
        owners: Number(owners) || 1, // Owner Count
        exteriorColor: exteriorColor.trim(), // Exterior Paint
        notes: notes.trim(),
        imageUrl: primaryImg,
        galleryImages: fullGallery.length > 0 ? fullGallery : [primaryImg],
        additionalImages: fullGallery.slice(1),
        status,
        isSold: status === 'sold',
        // Compatibility sub-object for UI cards
        specs: {
          powerHp: Number(powerHp) || 0,
          torqueLbFt: Number(torque) || 0,
          engine: engine.trim(),
          transmission: transmission.trim(),
          drivetrain,
          owners: Number(owners) || 1,
        },
      };

      await onSave(newVehicle);
      handleResetForm();
      onClose();
    } catch (err: any) {
      console.error('AddVehicleModal submit error:', err);
      setSubmitError(err?.message || 'Failed saving car to database. Please check image sizes or network.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#12141C] border border-white/[0.12] rounded-xl max-w-2xl w-full my-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#171922] border-b border-white/[0.08] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#E5252A]/10 border border-[#E5252A]/30 flex items-center justify-center text-[#E5252A]">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-black text-sm uppercase text-[#ECE5D8] tracking-wider">
                REGISTER VEHICLE TO CAR DB
              </h3>
              <p className="text-[11px] font-mono text-[#94A3B8]">
                Store only the 13 verified car parameters directly into database
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 font-sans text-xs flex-1">
          {/* Row 1: Company, Model, Year */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-mono text-[10px] text-[#94A3B8] uppercase mb-1">
                Company <span className="text-[#E5252A]">*</span>
              </label>
              <input
                type="text"
                required
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="e.g. Porsche, BMW, Volkswagen"
                className="w-full bg-[#0F1115] border border-white/[0.1] focus:border-[#E5252A] rounded px-3 py-2 text-[#ECE5D8] outline-none"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-[#94A3B8] uppercase mb-1">
                Model <span className="text-[#E5252A]">*</span>
              </label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Polo GT TSI / M3"
                className="w-full bg-[#0F1115] border border-white/[0.1] focus:border-[#E5252A] rounded px-3 py-2 text-[#ECE5D8] outline-none"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-[#94A3B8] uppercase mb-1">
                Year <span className="text-[#E5252A]">*</span>
              </label>
              <input
                type="number"
                required
                min={1990}
                max={2030}
                value={year}
                onChange={(e) => setYear(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#0F1115] border border-white/[0.1] focus:border-[#E5252A] rounded px-3 py-2 text-[#ECE5D8] outline-none"
              />
            </div>
          </div>

          {/* Row 2: Category & Trim */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[10px] text-[#94A3B8] uppercase mb-1">
                Category <span className="text-[#E5252A]">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-[#0F1115] border border-white/[0.1] focus:border-[#E5252A] rounded px-3 py-2 text-[#ECE5D8] outline-none font-mono"
              >
                <option value="sedans">Sedan</option>
                <option value="suv">SUV</option>
                <option value="hatchback">Hatchback</option>
                <option value="mpv">MPV</option>
                <option value="motorcycle">Motorcycle</option>
              </select>
            </div>
            <div>
              <label className="block font-mono text-[10px] text-[#94A3B8] uppercase mb-1">
                Trim <span className="text-[#E5252A]">*</span>
              </label>
              <input
                type="text"
                required
                value={trim}
                onChange={(e) => setTrim(e.target.value)}
                placeholder="e.g. 1.2L TSI Turbo • 7-Speed DSG"
                className="w-full bg-[#0F1115] border border-white/[0.1] focus:border-[#E5252A] rounded px-3 py-2 text-[#ECE5D8] outline-none"
              />
            </div>
          </div>

          {/* Row 3: Engine Description */}
          <div>
            <label className="block font-mono text-[10px] text-[#94A3B8] uppercase mb-1">
              Engine Description <span className="text-[#E5252A]">*</span>
            </label>
            <input
              type="text"
              required
              value={engine}
              onChange={(e) => setEngine(e.target.value)}
              placeholder="e.g. 1.2L TSI Turbocharged 4-Cylinder"
              className="w-full bg-[#0F1115] border border-white/[0.1] focus:border-[#E5252A] rounded px-3 py-2 text-[#ECE5D8] outline-none"
            />
          </div>

          {/* Row 4: Power (HP) & Torque */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[10px] text-[#94A3B8] uppercase mb-1">
                Power (HP) <span className="text-[#E5252A]">*</span>
              </label>
              <input
                type="number"
                required
                placeholder="e.g. 142"
                value={powerHp}
                onChange={(e) => setPowerHp(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#0F1115] border border-white/[0.1] focus:border-[#E5252A] rounded px-3 py-2 text-[#ECE5D8] outline-none font-bold"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-[#94A3B8] uppercase mb-1">
                Torque <span className="text-[#E5252A]">*</span>
              </label>
              <input
                type="number"
                required
                placeholder="e.g. 175"
                value={torque}
                onChange={(e) => setTorque(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#0F1115] border border-white/[0.1] focus:border-[#E5252A] rounded px-3 py-2 text-[#ECE5D8] outline-none"
              />
            </div>
          </div>

          {/* Row 5: Transmission & Drivetrain */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[10px] text-[#94A3B8] uppercase mb-1">
                Transmission <span className="text-[#E5252A]">*</span>
              </label>
              <input
                type="text"
                required
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
                placeholder="e.g. 7-Speed DSG / 6-Speed Manual / Automatic"
                className="w-full bg-[#0F1115] border border-white/[0.1] focus:border-[#E5252A] rounded px-3 py-2 text-[#ECE5D8] outline-none"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-[#94A3B8] uppercase mb-1">
                Drivetrain <span className="text-[#E5252A]">*</span>
              </label>
              <select
                value={drivetrain}
                onChange={(e) => setDrivetrain(e.target.value as any)}
                className="w-full bg-[#0F1115] border border-white/[0.1] focus:border-[#E5252A] rounded px-3 py-2 text-[#ECE5D8] outline-none font-mono"
              >
                <option value="FWD">FWD (Front-Wheel Drive)</option>
                <option value="RWD">RWD (Rear-Wheel Drive)</option>
                <option value="AWD">AWD (All-Wheel Drive)</option>
                <option value="4WD">4WD (Four-Wheel Drive)</option>
              </select>
            </div>
          </div>

          {/* Row 6: Odometer, Owner Count, Exterior Paint */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-mono text-[10px] text-[#94A3B8] uppercase mb-1">
                Odometer <span className="text-[#E5252A]">*</span>
              </label>
              <input
                type="number"
                required
                placeholder="e.g. 42800"
                value={mileage}
                onChange={(e) => setMileage(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#0F1115] border border-white/[0.1] focus:border-[#E5252A] rounded px-3 py-2 text-[#ECE5D8] outline-none"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-[#94A3B8] uppercase mb-1">
                Owner Count <span className="text-[#E5252A]">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                max={10}
                value={owners}
                onChange={(e) => setOwners(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#0F1115] border border-white/[0.1] focus:border-[#E5252A] rounded px-3 py-2 text-[#ECE5D8] outline-none"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-[#94A3B8] uppercase mb-1">
                Exterior Paint <span className="text-[#E5252A]">*</span>
              </label>
              <input
                type="text"
                required
                value={exteriorColor}
                onChange={(e) => setExteriorColor(e.target.value)}
                placeholder="e.g. Flash Red Metallic"
                className="w-full bg-[#0F1115] border border-white/[0.1] focus:border-[#E5252A] rounded px-3 py-2 text-[#ECE5D8] outline-none"
              />
            </div>
          </div>

          {/* Status State */}
          <div>
            <label className="block font-mono text-[10px] text-[#94A3B8] uppercase mb-1">
              Showroom Availability Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full bg-[#0F1115] border border-white/[0.1] focus:border-[#E5252A] rounded px-3 py-2 text-[#ECE5D8] outline-none font-mono"
            >
              <option value="available">Showroom Ready (Available)</option>
              <option value="reserved">Tokened / Reserved Lock</option>
              <option value="sold">Sold Out / Archive</option>
            </select>
          </div>

          {/* Admin Comments & Extra Information Textarea */}
          <div>
            <label className="block font-mono text-[10px] text-[#94A3B8] uppercase mb-1">
              Admin Comments &amp; Extra Information (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal dealership notes, special equipment, service provenance, price guidelines, or extra details for this car..."
              className="w-full bg-[#0F1115] border border-white/[0.1] focus:border-[#E5252A] rounded px-3 py-2 text-[#ECE5D8] outline-none font-sans text-xs resize-y placeholder-[#94A3B8]/40"
            />
          </div>

          {/* Vehicle Photos Upload Section */}
          <div className="space-y-3 bg-[#0B0D13] p-4 rounded-lg border border-white/[0.08]">
            <div className="flex items-center justify-between">
              <div>
                <label className="block font-mono text-[11px] font-bold text-[#ECE5D8] uppercase">
                  Vehicle Photos (Device / Desktop Upload)
                </label>
                <p className="text-[10px] font-mono text-[#94A3B8]">
                  Select photos from your device. Smart compression ensures up to 15+ photos fit in Firestore.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-[#ECE5D8] border border-white/10">
                {galleryImages.length} Image{galleryImages.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Cloud Storage Budget Gauge */}
            {galleryImages.length > 0 && (() => {
              const totalBytes = estimateGallerySizeBytes(galleryImages);
              const totalKb = Math.round(totalBytes / 1024);
              const maxSafeKb = 650;
              const percent = Math.min(100, Math.round((totalKb / maxSafeKb) * 100));
              const isWarning = totalKb > 600;

              return (
                <div className="bg-[#080A0E] p-2.5 rounded-lg border border-white/[0.06] space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#94A3B8] flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isWarning ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                      Cloud Database Gallery Payload:
                    </span>
                    <span className={isWarning ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {totalKb} KB / {maxSafeKb} KB (Safe Firestore Budget)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="text-[9.5px] text-[#94A3B8]/70">
                    Adaptive compression keeps each photo ~35-45KB so 10+ photos commit to Cloud Firestore without exceeding document size limits.
                  </p>
                </div>
              );
            })()}

            {/* Upload Box */}
            <div className="border-2 border-dashed border-white/[0.15] hover:border-[#E5252A]/60 rounded-lg p-4 text-center bg-black/20 hover:bg-white/[0.02] transition-colors relative cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading || isSubmitting}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                title="Click or drag photos to upload"
              />
              <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                <Upload className={`w-6 h-6 text-[#E5252A] ${isUploading ? 'animate-bounce' : ''}`} />
                <span className="font-mono text-xs font-bold text-[#ECE5D8]">
                  {isUploading ? 'Uploading to TnT-storage Cloud Storage...' : 'Upload Photos from Device or Desktop'}
                </span>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#94A3B8]">
                  <Cloud className="w-3 h-3 text-emerald-400" />
                  <span>Target Storage: <strong className="text-[#ECE5D8]">TnT-storage</strong> (Up to 15+ photos)</span>
                </div>
              </div>
            </div>

            {/* Optional URL addition */}
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Or paste an image web URL..."
                className="flex-1 bg-[#0F1115] border border-white/[0.1] focus:border-[#E5252A] rounded px-3 py-1.5 text-[#ECE5D8] outline-none font-mono text-[11px]"
              />
              <button
                type="button"
                onClick={handleAddUrlImage}
                className="px-3 py-1.5 bg-white/10 hover:bg-[#E5252A] text-white text-xs font-mono rounded transition-colors cursor-pointer"
              >
                + Add URL
              </button>
            </div>

            {/* Uploaded Gallery Thumbnails */}
            {galleryImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-white/[0.06]">
                {galleryImages.map((img, idx) => (
                  <div
                    key={idx}
                    className={`relative rounded-lg overflow-hidden border bg-black/40 group ${
                      idx === 0 ? 'border-[#E5252A] ring-1 ring-[#E5252A]' : 'border-white/[0.1]'
                    }`}
                  >
                    <div className="aspect-[16/10] w-full overflow-hidden bg-black/60">
                      <img
                        src={img}
                        alt={`Vehicle preview ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>

                    {/* Primary Badge */}
                    {idx === 0 ? (
                      <span className="absolute top-1.5 left-1.5 bg-[#E5252A] text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        Primary Cover
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(idx)}
                        className="absolute top-1.5 left-1.5 bg-black/80 hover:bg-[#E5252A] text-white text-[9px] font-mono px-1.5 py-0.5 rounded shadow transition-colors cursor-pointer"
                        title="Set as Primary Cover Image"
                      >
                        Set Primary
                      </button>
                    )}

                    {/* Controls */}
                    <div className="p-1.5 bg-[#171922] flex items-center justify-between text-[10px] font-mono">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveImage(idx, 'left')}
                          disabled={idx === 0}
                          className="p-0.5 text-[#94A3B8] hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Move left"
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveImage(idx, 'right')}
                          disabled={idx === galleryImages.length - 1}
                          className="p-0.5 text-[#94A3B8] hover:text-white disabled:opacity-30 cursor-pointer"
                          title="Move right"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="text-red-400 hover:text-red-300 p-0.5 cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submission Error Banner */}
          {submitError && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-200 text-xs font-mono">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleResetForm}
              className="px-3 py-2 rounded bg-white/[0.05] hover:bg-red-500/20 text-xs font-mono text-red-300 hover:text-red-200 transition-colors cursor-pointer flex items-center gap-1.5 border border-white/[0.08] disabled:opacity-40"
              title="Clear all fields in this form"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Clear Form</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onClose}
                className="px-4 py-2 rounded bg-white/[0.05] hover:bg-white/[0.1] text-xs font-mono text-[#94A3B8] transition-colors cursor-pointer disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="px-5 py-2 rounded bg-[#E5252A] hover:bg-[#c00017] disabled:opacity-50 text-white text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(229,37,42,0.4)] cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Committing to Cloud DB...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Register Car into DB</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
