import React, { useState, useEffect } from 'react';
import { Vehicle } from '../../types';
import {
  X,
  Save,
  Upload,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Star,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Cloud,
} from 'lucide-react';
import { compressImageFile, compressImageFileToBlob, estimateGallerySizeBytes, ensureGalleryFitsFirestoreBudget } from '../../utils/imageCompressor';
import { uploadVehicleImage } from '../../firebase/storageService';

interface EditVehicleModalProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedVehicle: Vehicle) => Promise<void> | void;
}

export const EditVehicleModal: React.FC<EditVehicleModalProps> = ({
  vehicle,
  isOpen,
  onClose,
  onSave,
}) => {
  // The 13 registered database fields:
  // 1. Company
  const [make, setMake] = useState(vehicle?.make || '');
  // 2. Model
  const [model, setModel] = useState(vehicle?.model || '');
  // 3. Year
  const [year, setYear] = useState<number | ''>(vehicle?.year || 2024);
  // 4. Category
  const [category, setCategory] = useState(vehicle?.category || 'sedans');
  // 5. Trim
  const [trim, setTrim] = useState(vehicle?.trim || '');
  // 6. Engine Description
  const [engine, setEngine] = useState(vehicle?.engine || vehicle?.specs?.engine || '');
  // 7. Power (HP)
  const [powerHp, setPowerHp] = useState<number | ''>(vehicle?.powerHp || vehicle?.specs?.powerHp || '');
  // 8. Torque
  const [torque, setTorque] = useState<number | ''>(vehicle?.torque || vehicle?.specs?.torqueLbFt || '');
  // 9. Transmission
  const [transmission, setTransmission] = useState(vehicle?.transmission || vehicle?.specs?.transmission || '');
  // 10. Drivetrain
  const [drivetrain, setDrivetrain] = useState<'FWD' | 'RWD' | 'AWD' | '4WD'>((vehicle?.drivetrain as any) || vehicle?.specs?.drivetrain || 'AWD');
  // 11. Odometer
  const [mileage, setMileage] = useState<number | ''>(vehicle?.mileage ?? '');
  // 12. Owner Count
  const [owners, setOwners] = useState<number | ''>(vehicle?.owners || vehicle?.specs?.owners || 1);
  // 13. Exterior Paint
  const [exteriorColor, setExteriorColor] = useState(vehicle?.exteriorColor || '');
  const [notes, setNotes] = useState(vehicle?.notes || '');

  // Status & Media
  const [status, setStatus] = useState<'available' | 'reserved' | 'sold'>(
    vehicle?.status || (vehicle?.isSold ? 'sold' : 'available')
  );

  const initialGallery = vehicle?.galleryImages && vehicle.galleryImages.length > 0
    ? vehicle.galleryImages
    : vehicle?.additionalImages && vehicle.additionalImages.length > 0
    ? [vehicle.imageUrl, ...vehicle.additionalImages]
    : vehicle?.imageUrl ? [vehicle.imageUrl] : [];

  const [galleryImages, setGalleryImages] = useState<string[]>(initialGallery);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [imageError, setImageError] = useState<string | null>(null);

  // Sync state only when switching to a different vehicle or opening
  useEffect(() => {
    if (vehicle && isOpen) {
      setMake(vehicle.make);
      setModel(vehicle.model);
      setTrim(vehicle.trim);
      setYear(vehicle.year);
      setCategory(vehicle.category || 'sedans');
      setEngine(vehicle.engine || vehicle.specs?.engine || '');
      setPowerHp(vehicle.powerHp || vehicle.specs?.powerHp || '');
      setTorque(vehicle.torque || vehicle.specs?.torqueLbFt || '');
      setTransmission(vehicle.transmission || vehicle.specs?.transmission || '');
      setDrivetrain(((vehicle.drivetrain as any) || vehicle.specs?.drivetrain || 'AWD') as any);
      setMileage(vehicle.mileage);
      setOwners(vehicle.owners || vehicle.specs?.owners || 1);
      setExteriorColor(vehicle.exteriorColor || '');
      setNotes(vehicle.notes || '');
      setStatus(vehicle.status || (vehicle.isSold ? 'sold' : 'available'));

      const initialImgs = vehicle.galleryImages && vehicle.galleryImages.length > 0
        ? vehicle.galleryImages
        : [vehicle.imageUrl];
      setGalleryImages(initialImgs);
    }
  }, [vehicle?.id, isOpen]);

  // Guard against closed modal or null vehicle
  if (!isOpen || !vehicle) {
    return null;
  }

  // Gallery Operations directly with Firebase TnT-storage Cloud Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !vehicle) return;

    setIsUploading(true);
    setImageError(null);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadStatusMsg(`Compressing & uploading image ${i + 1} of ${files.length}...`);
        try {
          const downloadUrl = await uploadVehicleImage(file, vehicle.id, file.name);
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

  const handleRemoveImage = (index: number) => {
    if (galleryImages.length <= 1) {
      setImageError('Vehicle must retain at least one image in its gallery.');
      setTimeout(() => setImageError(null), 3000);
      return;
    }
    setImageError(null);
    setGalleryImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetPrimary = (index: number) => {
    if (index === 0) return;
    setGalleryImages((prev) => {
      const selected = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [selected, ...rest];
    });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isSold = status === 'sold';
    const rawGallery = galleryImages.filter(Boolean);
    const optimizedGallery = await ensureGalleryFitsFirestoreBudget(rawGallery, 350 * 1024);
    const primaryImg = optimizedGallery[0] || vehicle.imageUrl;

    const updated: Vehicle = {
      id: vehicle.id,
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
      status,
      isSold,
      imageUrl: primaryImg,
      galleryImages: optimizedGallery,
      additionalImages: optimizedGallery.slice(1),
      specs: {
        powerHp: Number(powerHp) || 0,
        torqueLbFt: Number(torque) || 0,
        engine: engine.trim(),
        transmission: transmission.trim(),
        drivetrain,
        owners: Number(owners) || 1,
      },
    };

    await onSave(updated);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#12141C] border border-white/[0.12] rounded-xl max-w-3xl w-full my-8 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="bg-[#171922] border-b border-white/[0.08] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#E5252A]/10 border border-[#E5252A]/30 flex items-center justify-center text-[#E5252A]">
              <Save className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-black text-sm uppercase text-[#ECE5D8] tracking-wider">
                EDIT CAR RECORD: {vehicle?.year || ''} {vehicle?.make || ''} {vehicle?.model || ''}
              </h3>
              <p className="text-[11px] font-mono text-[#94A3B8]">
                Update verified database parameters &amp; device photo gallery
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
                value={powerHp}
                onChange={(e) => setPowerHp(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-[#0F1115] border border-white/[0.1] focus:border-[#E5252A] rounded px-3 py-2 text-[#ECE5D8] outline-none font-bold"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-[#94A3B8] uppercase mb-1">
                Torque (lb-ft / Nm) <span className="text-[#E5252A]">*</span>
              </label>
              <input
                type="number"
                required
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
                Odometer (km) <span className="text-[#E5252A]">*</span>
              </label>
              <input
                type="number"
                required
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
                className="w-full bg-[#0F1115] border border-white/[0.1] focus:border-[#E5252A] rounded px-3 py-2 text-[#ECE5D8] outline-none"
              />
            </div>
          </div>

          {/* Status Selection */}
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

          {/* Device / Desktop Photos Management */}
          <div className="space-y-3 bg-[#0B0D13] p-4 rounded-lg border border-white/[0.08]">
            <div className="flex items-center justify-between">
              <div>
                <label className="block font-mono text-[11px] font-bold text-[#ECE5D8] uppercase">
                  Vehicle Photos (Device / Desktop Upload)
                </label>
                <p className="text-[10px] font-mono text-[#94A3B8]">
                  Select images from your desktop or gallery. The first photo serves as the primary cover.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-[#ECE5D8] border border-white/10">
                {galleryImages.length} Image{galleryImages.length !== 1 ? 's' : ''}
              </span>
            </div>

            {imageError && (
              <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-mono">
                {imageError}
              </div>
            )}

            {/* Upload Box */}
            <div className="border-2 border-dashed border-white/[0.15] hover:border-[#E5252A]/60 rounded-lg p-4 text-center bg-black/20 hover:bg-white/[0.02] transition-colors relative cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
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

          {/* Action Footer Bar */}
          <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-white/[0.05] hover:bg-white/[0.1] text-[#94A3B8] hover:text-white text-xs font-mono font-bold uppercase transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center gap-3">
              {saveSuccess && (
                <span className="text-emerald-400 text-xs font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Vehicle updated successfully!
                </span>
              )}
              <button
                type="submit"
                className="bg-[#E5252A] hover:bg-[#c00017] text-white text-xs font-mono font-bold uppercase tracking-wider px-6 py-2.5 rounded flex items-center gap-2 shadow-lg transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
