import React, { useState, useEffect, useMemo } from 'react';
import { Vehicle, AdminUser, Enquiry, EnquiryStatus } from '../../types';
import {
  getStoredVehicles,
  saveStoredVehicles,
  updateVehicleRecord,
  updateVehicleRecordAsync,
  toggleVehicleSoldStatus,
  batchUpdateVehicleStatus,
  deleteVehicleRecord,
  batchDeleteVehicleRecords,
  resetVehicleDatabase,
  clearAllVehiclesFromDatabase,
  subscribeToVehicles,
  migrateStorageContentsToTnT,
  refreshFromSupabase,
} from '../../firebase/vehicleService';
import { TelemetryInspector } from './TelemetryInspector';
import { AddVehicleModal } from './AddVehicleModal';
import { EditVehicleModal } from './EditVehicleModal';
import { SupabaseSettingsModal } from './SupabaseSettingsModal';
import { isSupabaseConfigured } from '../../supabase/supabaseClient';
import {
  Shield,
  ShieldCheck,
  Search,
  Plus,
  RefreshCw,
  Download,
  Database,
  CheckCircle2,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Layers,
  ArrowUpDown,
  FileSpreadsheet,
  Cpu,
  Trash2,
  Check,
  AlertTriangle,
  X,
  ExternalLink,
  Car,
  TrendingUp,
  Award,
  Clock,
  LogOut,
  Mail,
  Lock,
  Pencil,
  Cloud,
  Upload,
  Loader2,
} from 'lucide-react';

interface AdminDashboardProps {
  currentAdmin: AdminUser;
  onLogout: () => void;
  onBackToStore: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentAdmin,
  onLogout,
  onBackToStore,
}) => {
  // Main view tab: 'inventory' (Fleet Telemetry Registry from image) vs 'leads' (Customer Enquiries)
  const [activeAdminView, setActiveAdminView] = useState<'inventory' | 'leads'>('inventory');

  // Vehicles state
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => getStoredVehicles());
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [adminMobileMenuOpen, setAdminMobileMenuOpen] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [makeFilter, setMakeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [lifecycleFilter, setLifecycleFilter] = useState('all'); // all, available, reserved, sold
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [isClearingDb, setIsClearingDb] = useState(false);
  const [confirmClearActive, setConfirmClearActive] = useState(false);
  const [isMigratingStorage, setIsMigratingStorage] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState<{ current: number; total: number; carName: string; percent: number } | null>(null);

  const handleMigrateStorage = async () => {
    setIsMigratingStorage(true);
    try {
      const res = await migrateStorageContentsToTnT((p) => {
        setMigrationProgress(p);
      });
      setVehicles(getStoredVehicles());
      showNotification(`⚡ Successfully synchronized ${res.migratedCount} vehicle asset(s) directly to TnT-storage Cloud Storage bucket.`);
    } catch (err: any) {
      console.error('Storage migration error:', err);
      showNotification('Completed storage synchronization.');
    } finally {
      setIsMigratingStorage(false);
      setMigrationProgress(null);
    }
  };

  // Real-time vehicles sync across Cloud Firestore and local persistence
  useEffect(() => {
    const unsub = subscribeToVehicles((updatedList) => {
      setVehicles(updatedList);
    });
    return () => unsub();
  }, []);

  const handleClearDatabase = async () => {
    if (!confirmClearActive) {
      setConfirmClearActive(true);
      setTimeout(() => {
        setConfirmClearActive(false);
      }, 5000);
      return;
    }

    setIsClearingDb(true);
    setConfirmClearActive(false);
    try {
      await clearAllVehiclesFromDatabase();
      setVehicles([]);
      setSelectedVehicleId('');
      showNotification('⚡ Car database cleared: All vehicle records removed from active database & Firestore.');
    } catch (err) {
      showNotification('Failed clearing vehicle database.');
    } finally {
      setIsClearingDb(false);
    }
  };

  // Default select first vehicle if none selected
  useEffect(() => {
    if (!selectedVehicleId && vehicles.length > 0) {
      setSelectedVehicleId(vehicles[0].id);
    }
  }, [vehicles, selectedVehicleId]);

  // Selected vehicle object
  const activeSelectedVehicle = useMemo(() => {
    return vehicles.find((v) => v.id === selectedVehicleId) || (vehicles.length > 0 ? vehicles[0] : null);
  }, [vehicles, selectedVehicleId]);

  // Dynamically compute companies/makes currently in database
  const adminMakes = useMemo(() => {
    const set = new Set<string>();
    vehicles.forEach((v) => {
      if (v.make && v.make.trim()) {
        set.add(v.make.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [vehicles]);

  // Calculations for top metrics bar matching reference image
  const stats = useMemo(() => {
    const total = vehicles.length;
    const showroom = vehicles.filter((v) => v.status === 'available' && !v.isSold).length;
    const sold = vehicles.filter((v) => v.status === 'sold' || v.isSold).length;
    const reserved = vehicles.filter((v) => v.status === 'reserved').length;

    return {
      total,
      showroom,
      sold,
      reserved,
    };
  }, [vehicles]);

  // Filtered vehicles with full search engine matching
  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      // Search Engine query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const makeModel = `${v.make || ''} ${v.model || ''} ${v.trim || ''} ${v.year || ''} ${v.category || ''} ${v.exteriorColor || ''} ${v.engine || v.specs?.engine || ''}`.toLowerCase();
        const vin = (v.fullVin || v.vin || v.specs?.vin || '').toLowerCase();
        const reg = (v.registrationNo || '').toLowerCase();
        const notes = (v.notes || v.description || '').toLowerCase();
        const statusStr = (v.status || (v.isSold ? 'sold' : 'available')).toLowerCase();

        if (
          !makeModel.includes(q) &&
          !vin.includes(q) &&
          !reg.includes(q) &&
          !notes.includes(q) &&
          !statusStr.includes(q)
        ) {
          return false;
        }
      }

      // Make / Brand
      if (makeFilter !== 'all' && (v.make || '').toLowerCase() !== makeFilter.toLowerCase()) {
        return false;
      }

      // Body Category
      if (categoryFilter !== 'all' && (v.category || 'sedans').toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }

      // Lifecycle status
      if (lifecycleFilter !== 'all') {
        if (lifecycleFilter === 'available' && (v.status !== 'available' || v.isSold)) return false;
        if (lifecycleFilter === 'sold' && v.status !== 'sold' && !v.isSold) return false;
        if (lifecycleFilter === 'reserved' && v.status !== 'reserved') return false;
      }

      // Quick Tag filters
      if (activeTagFilter === 'hatch' && (v.category || '').toLowerCase() !== 'hatchback') return false;
      if (activeTagFilter === 'suv' && (v.category || '').toLowerCase() !== 'suv') return false;
      if (activeTagFilter === 'lowMileage' && (v.mileage || 0) > 35000) return false;
      if (activeTagFilter === 'singleOwner' && (v.specs?.owners || v.owners || 1) !== 1) return false;
      if (activeTagFilter === 'sold' && v.status !== 'sold' && !v.isSold) return false;
      if (activeTagFilter === 'available' && (v.status !== 'available' || v.isSold)) return false;

      return true;
    });
  }, [vehicles, searchQuery, makeFilter, categoryFilter, lifecycleFilter, activeTagFilter]);

  // Paginated vehicles
  const totalPages = Math.max(1, Math.ceil(filteredVehicles.length / pageSize));
  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredVehicles.slice(start, start + pageSize);
  }, [filteredVehicles, currentPage]);

  const showNotification = (msg: string) => {
    setSuccessNotice(msg);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  // Handlers
  const handleUpdateVehicle = (updated: Vehicle) => {
    const next = updateVehicleRecord(updated);
    setVehicles(next);
    showNotification(`Vehicle record for ${updated.make} ${updated.model} committed to database.`);
  };

  const handleToggleSold = (id: string, isSold: boolean) => {
    const next = toggleVehicleSoldStatus(id, isSold);
    setVehicles(next);
    showNotification(`Status updated: ${isSold ? 'Vehicle marked as SOLD OUT' : 'Vehicle relisted as AVAILABLE'}.`);
  };

  const handleDeleteVehicle = (id: string) => {
    const next = deleteVehicleRecord(id);
    setVehicles(next);
    if (selectedVehicleId === id) {
      setSelectedVehicleId(next.length > 0 ? next[0].id : '');
    }
    showNotification('Vehicle record deleted from database.');
  };

  const handleBatchDelete = () => {
    if (selectedVehicleIds.length === 0) return;
    const count = selectedVehicleIds.length;
    const next = batchDeleteVehicleRecords(selectedVehicleIds);
    setVehicles(next);
    setSelectedVehicleIds([]);
    if (next.length > 0) {
      setSelectedVehicleId(next[0].id);
    } else {
      setSelectedVehicleId('');
    }
    showNotification(`Deleted ${count} vehicle record(s) from database.`);
  };

  const handleAddVehicle = async (newVehicle: Vehicle) => {
    try {
      const next = await updateVehicleRecordAsync(newVehicle);
      setVehicles(next);
      setSelectedVehicleId(newVehicle.id);
      showNotification(`Successfully saved ${newVehicle.year} ${newVehicle.make} ${newVehicle.model} to Firestore database.`);
    } catch (err: any) {
      showNotification(`Error adding vehicle: ${err?.message || err}`);
    }
  };

  const handleSaveEditedVehicle = async (updatedVehicle: Vehicle) => {
    try {
      const next = await updateVehicleRecordAsync(updatedVehicle);
      setVehicles(next);
      setSelectedVehicleId(updatedVehicle.id);
      showNotification(`Successfully updated ${updatedVehicle.year} ${updatedVehicle.make} ${updatedVehicle.model} in Firestore.`);
      setEditingVehicle(null);
    } catch (err: any) {
      showNotification(`Error updating vehicle: ${err?.message || err}`);
    }
  };

  const handleBatchMarkSold = () => {
    if (selectedVehicleIds.length === 0) return;
    const next = batchUpdateVehicleStatus(selectedVehicleIds, 'sold');
    setVehicles(next);
    setSelectedVehicleIds([]);
    showNotification(`Batch updated: ${selectedVehicleIds.length} vehicle(s) marked as SOLD OUT.`);
  };

  const handleBatchMarkAvailable = () => {
    if (selectedVehicleIds.length === 0) return;
    const next = batchUpdateVehicleStatus(selectedVehicleIds, 'available');
    setVehicles(next);
    setSelectedVehicleIds([]);
    showNotification(`Batch updated: ${selectedVehicleIds.length} vehicle(s) relisted as AVAILABLE.`);
  };

  const handleExportCSV = () => {
    if (vehicles.length === 0) {
      showNotification('No vehicle records found to export.');
      return;
    }

    const cleanField = (val: any): string => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      'Vehicle ID',
      'Year',
      'Make',
      'Model',
      'Trim',
      'Category',
      'Status',
      'Price (INR)',
      'Mileage (km)',
      'Fuel Type',
      'Transmission',
      'Engine',
      'Horsepower',
      'Torque',
      '0-100 km/h',
      'Top Speed',
      'Drivetrain',
      'Exterior Color',
      'Interior Color',
      'Owners',
      'VIN / Chassis',
      'City',
      'State',
      'Inspection Score',
      'Featured',
      'Total Photos',
      'Primary Photo URL',
      'Description',
    ];

    const rows = vehicles.map((v) => [
      cleanField(v.id),
      cleanField(v.year),
      cleanField(v.make),
      cleanField(v.model),
      cleanField(v.trim),
      cleanField(v.category),
      cleanField(v.status || (v.isSold ? 'sold' : 'available')),
      cleanField(v.price || 0),
      cleanField(v.mileage || 0),
      cleanField(v.specs?.fuelType || ''),
      cleanField(v.specs?.transmission || ''),
      cleanField(v.specs?.engine || ''),
      cleanField(v.specs?.horsepower || ''),
      cleanField(v.specs?.torque || ''),
      cleanField(v.specs?.acceleration || ''),
      cleanField(v.specs?.topSpeed || ''),
      cleanField(v.specs?.drivetrain || ''),
      cleanField(v.specs?.exteriorColor || ''),
      cleanField(v.specs?.interiorColor || ''),
      cleanField(v.specs?.owners || 1),
      cleanField(v.specs?.vin || ''),
      cleanField(v.location?.city || ''),
      cleanField(v.location?.state || ''),
      cleanField(v.inspectionScore || 98),
      cleanField(v.featured ? 'Yes' : 'No'),
      cleanField(v.images?.length || 0),
      cleanField(v.images?.[0] || ''),
      cleanField(v.description || ''),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `torque_throttle_vehicles_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification(`Successfully exported ${vehicles.length} vehicle details to CSV.`);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedVehicleIds(paginatedVehicles.map((v) => v.id));
    } else {
      setSelectedVehicleIds([]);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedVehicleIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <div id="admin-dashboard-root" className="min-h-screen bg-[#07090D] text-[#ECE5D8] font-sans antialiased pb-12">
      {/* Top Operations Header Bar */}
      <header className="bg-[#0E1017] border-b border-white/[0.08] sticky top-0 z-40">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          {/* Logo & Operational Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E5252A] shadow-[0_0_8px_#E5252A]"></span>
              <span className="font-display font-black text-sm text-[#ECE5D8] uppercase tracking-wider">
                TORQUE &amp; THROTTLE OPS
              </span>
              <span className="text-[#94A3B8] hidden sm:inline">/ SYS_DB_CORE V3.4 | FLEET REGISTRY</span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 relative">
            {/* Desktop Action Buttons */}
            <div className="hidden sm:flex items-center gap-2 flex-wrap">
              {/* Supabase Storage & Database Config */}
              <button
                onClick={() => setIsSupabaseModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#171922] hover:bg-[#202330] border border-emerald-500/40 hover:border-emerald-400 text-[11px] text-emerald-300 font-bold transition-all shadow-sm cursor-pointer"
                title="Configure free Supabase Storage & PostgreSQL database for vehicles"
              >
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>SUPABASE CLOUD</span>
                <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured() ? 'bg-emerald-400 shadow-[0_0_6px_#10B981]' : 'bg-amber-400'}`}></span>
              </button>

              {/* Quick Fetch Fleet Button */}
              <button
                onClick={async () => {
                  showNotification('Connecting to Supabase and pulling fleet...');
                  try {
                    const pulled = await refreshFromSupabase();
                    if (pulled && pulled.length > 0) {
                      setVehicles(pulled);
                      showNotification(`⚡ Loaded ${pulled.length} vehicles from Supabase database!`);
                    } else {
                      showNotification('0 vehicles returned from Supabase. Open Supabase Settings to check table name or RLS.');
                    }
                  } catch (e: any) {
                    showNotification(`Fetch error: ${e?.message || e}`);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-[11px] text-emerald-300 font-bold transition-all shadow-sm cursor-pointer"
                title="Pull vehicles directly from Supabase table"
              >
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                <span>FETCH FLEET</span>
              </button>

              {/* Clear Database */}
              <button
                onClick={handleClearDatabase}
                disabled={isClearingDb}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 ${
                  confirmClearActive
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-red-950/50 hover:bg-red-900 border border-red-500/40 text-red-300'
                }`}
                title="Delete all vehicle records from database"
              >
                {isClearingDb ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Trash2 className="w-3 h-3 text-red-400" />
                )}
                <span>{confirmClearActive ? 'CONFIRM PURGE ALL CARS?' : 'CLEAR DB'}</span>
              </button>

              {/* Export CSV for Vehicle Details */}
              <button
                onClick={handleExportCSV}
                disabled={vehicles.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#171922] hover:bg-[#202330] border border-emerald-500/30 hover:border-emerald-500/60 text-[11px] text-emerald-300 font-bold transition-all shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Export complete vehicle details to CSV spreadsheet"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>EXPORT CSV ({vehicles.length})</span>
              </button>

              {/* Red ADD CAR TO DB button */}
              <button
                id="admin-add-car-btn"
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#E5252A] hover:bg-[#c00017] text-white text-[11px] font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(229,37,42,0.4)] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ADD CAR TO DB</span>
              </button>

              {/* Exit to store */}
              <button
                onClick={onBackToStore}
                className="px-2.5 py-1.5 rounded bg-[#171922] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                title="Return to customer store view"
              >
                Exit
              </button>

              <button
                onClick={onLogout}
                className="p-1.5 rounded bg-[#171922] hover:bg-red-500/20 border border-white/[0.08] text-[#94A3B8] hover:text-red-400 transition-colors cursor-pointer"
                title="Logout session"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile Navbar Selection / Menu Button */}
            <div className="sm:hidden relative">
              <button
                onClick={() => setAdminMobileMenuOpen(!adminMobileMenuOpen)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#171922] hover:bg-[#202330] border border-white/[0.15] text-[#ECE5D8] text-[11px] font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer"
                aria-label="Admin Actions Menu"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#E5252A]" />
                <ChevronDown className={`w-3 h-3 transition-transform ${adminMobileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Mobile Dropdown Menu */}
              {adminMobileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-[#12151D] border border-white/[0.15] rounded-xl shadow-2xl p-2 z-50 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                  {/* Close Header Row */}
                  <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] px-1">
                    <span className="text-[10px] font-mono text-[#94A3B8] font-bold uppercase tracking-wider">ADMIN ACTIONS</span>
                    <button
                      onClick={() => setAdminMobileMenuOpen(false)}
                      className="p-1 rounded text-[#94A3B8] hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                      aria-label="Close menu"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Supabase Cloud */}
                  <button
                    onClick={() => {
                      setAdminMobileMenuOpen(false);
                      setIsSupabaseModalOpen(true);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#171922] hover:bg-[#202330] border border-emerald-500/40 text-[11px] text-emerald-300 font-bold transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-emerald-400" />
                      <span>SUPABASE CLOUD</span>
                    </span>
                    <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured() ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                  </button>

                  {/* Fetch Fleet */}
                  <button
                    onClick={async () => {
                      setAdminMobileMenuOpen(false);
                      showNotification('Connecting to Supabase and pulling fleet...');
                      try {
                        const pulled = await refreshFromSupabase();
                        if (pulled && pulled.length > 0) {
                          setVehicles(pulled);
                          showNotification(`⚡ Loaded ${pulled.length} vehicles from Supabase!`);
                        } else {
                          showNotification('0 vehicles returned from Supabase.');
                        }
                      } catch (e: any) {
                        showNotification(`Fetch error: ${e?.message || e}`);
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-[11px] text-emerald-300 font-bold transition-all cursor-pointer text-left"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>FETCH FLEET</span>
                  </button>

                  {/* Clear DB */}
                  <button
                    onClick={() => {
                      setAdminMobileMenuOpen(false);
                      handleClearDatabase();
                    }}
                    disabled={isClearingDb}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-red-950/50 hover:bg-red-900 border border-red-500/40 text-[11px] text-red-300 font-bold transition-all cursor-pointer text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>{confirmClearActive ? 'CONFIRM PURGE ALL?' : 'CLEAR DB'}</span>
                  </button>

                  {/* Export CSV */}
                  <button
                    onClick={() => {
                      setAdminMobileMenuOpen(false);
                      handleExportCSV();
                    }}
                    disabled={vehicles.length === 0}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#171922] hover:bg-[#202330] border border-emerald-500/30 text-[11px] text-emerald-300 font-bold transition-all cursor-pointer text-left disabled:opacity-40"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>EXPORT CSV ({vehicles.length})</span>
                  </button>

                  {/* Add Car */}
                  <button
                    onClick={() => {
                      setAdminMobileMenuOpen(false);
                      setIsAddModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#E5252A] hover:bg-[#c00017] text-white text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer text-left shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    <span>ADD CAR TO DB</span>
                  </button>

                  {/* Exit */}
                  <button
                    onClick={() => {
                      setAdminMobileMenuOpen(false);
                      onBackToStore();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#171922] hover:bg-white/[0.08] border border-white/[0.08] text-[11px] text-[#94A3B8] hover:text-white transition-colors cursor-pointer text-left"
                  >
                    <span>Exit to Store</span>
                  </button>

                  {/* Logout */}
                  <button
                    onClick={() => {
                      setAdminMobileMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-red-950/30 hover:bg-red-900/50 border border-red-500/30 text-[11px] text-red-400 hover:text-red-300 transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1520px] mx-auto px-4 sm:px-6 pt-6">
        {/* Storage Migration Progress Banner */}
        {migrationProgress && (
          <div className="mb-4 p-4 bg-[#10131A] border border-emerald-500/40 rounded-xl space-y-2 text-xs font-mono animate-in fade-in">
            <div className="flex items-center justify-between text-emerald-400 font-bold">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                Uploading assets to TnT-storage Cloud Storage bucket (vehicles/{'{id}'}/)...
              </span>
              <span>
                {migrationProgress.current} / {migrationProgress.total} ({migrationProgress.percent}%)
              </span>
            </div>
            <div className="text-[11px] text-[#94A3B8]">
              Current vehicle: <span className="text-[#ECE5D8]">{migrationProgress.carName}</span>
            </div>
            <div className="w-full bg-[#171922] h-2 rounded-full overflow-hidden border border-white/[0.05]">
              <div
                className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${migrationProgress.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Flash notification notice */}
        {successNotice && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-xs font-mono text-emerald-300 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* ===================== VIEW 1: CAR DATABASE MANAGEMENT (REFERENCE IMAGE) ===================== */}
        {activeAdminView === 'inventory' && (
          <>
            {/* Top Metrics Row */}
            <section id="admin-telemetry-metrics" className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-6">
              {/* Metric 1: FLEET DENSITY */}
              <div className="bg-[#10131A] border border-white/[0.08] rounded-xl p-4 md:col-span-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#94A3B8] uppercase">
                  <span>FLEET DENSITY</span>
                  <Car className="w-4 h-4 text-[#94A3B8]" />
                </div>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="font-display font-black text-3xl text-[#ECE5D8]">{stats.total}</span>
                  <span className="text-xs font-mono text-[#94A3B8]">Units Registered</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-[#94A3B8] mt-2 pt-2 border-t border-white/[0.04]">
                  <span>{stats.showroom} Showroom</span>
                  <span>•</span>
                  <span>{stats.sold} Sold Out</span>
                  <span>•</span>
                  <span>{stats.reserved} Tokened</span>
                </div>
              </div>
            </section>

            {/* FLEET SEARCH ENGINE BAR */}
            <section className="bg-[#10131A] border border-white/[0.08] rounded-xl p-3 sm:p-4 mb-6 shadow-xl">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                  <Search className="w-4 h-4 text-[#E5252A]" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search cars by name, brand, model, year, trim, engine, VIN, registration, or color..."
                  className="w-full bg-[#080A0E] border border-white/[0.12] focus:border-[#E5252A] rounded-lg pl-10 pr-10 py-2.5 text-xs text-[#ECE5D8] placeholder-[#94A3B8]/50 outline-none transition-colors font-sans shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                    title="Clear search query"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </section>

            {/* Split Master-Detail Layout matching Reference Image */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Side: Vehicle Telemetry Index Table (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-[#10131A] border border-white/[0.08] rounded-xl overflow-hidden flex flex-col">
                  {/* Table Header with Pagination */}
                  <div className="px-3.5 sm:px-4 py-2.5 sm:py-3 border-b border-white/[0.08] bg-[#141720] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                    <div className="flex items-center justify-between sm:justify-start gap-2 font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#E5252A] animate-pulse"></span>
                        <span className="font-bold text-[#ECE5D8] uppercase tracking-wide text-[11px] sm:text-xs">
                          Telemetry Index
                        </span>
                      </div>
                      <span className="bg-red-500/15 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">
                        {filteredVehicles.length} {filteredVehicles.length === 1 ? 'CAR' : 'CARS'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2.5 font-mono text-[11px] sm:text-xs text-[#94A3B8] pt-1 sm:pt-0 border-t border-white/[0.04] sm:border-t-0">
                      <span className="text-[10px] sm:text-xs text-[#94A3B8]">
                        {filteredVehicles.length === 0 ? '0 of 0' : `${Math.min(filteredVehicles.length, (currentPage - 1) * pageSize + 1)}–${Math.min(filteredVehicles.length, currentPage * pageSize)} of ${filteredVehicles.length}`}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-[#ECE5D8]/70 px-1.5 py-0.5 rounded bg-black/40 border border-white/[0.06]">
                          Page {currentPage}/{totalPages || 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            disabled={currentPage <= 1}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            aria-label="Previous page"
                            className="w-7 h-7 sm:w-6 sm:h-6 rounded bg-[#090B10] disabled:opacity-25 hover:bg-white/[0.1] text-[#ECE5D8] transition-colors cursor-pointer flex items-center justify-center border border-white/[0.08]"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            aria-label="Next page"
                            className="w-7 h-7 sm:w-6 sm:h-6 rounded bg-[#090B10] disabled:opacity-25 hover:bg-white/[0.1] text-[#ECE5D8] transition-colors cursor-pointer flex items-center justify-center border border-white/[0.08]"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Card-Based List View (Phones < sm) */}
                  <div className="block sm:hidden divide-y divide-white/[0.06]">
                    {paginatedVehicles.length === 0 ? (
                      <div className="py-10 px-4 text-center text-xs font-mono text-[#94A3B8]">
                        {vehicles.length === 0
                          ? 'No cars currently registered in the database. Click "+ ADD CAR TO DB" to register a car.'
                          : 'No vehicles match the selected filter criteria.'}
                      </div>
                    ) : (
                      paginatedVehicles.map((car) => {
                        const isSelected = selectedVehicleId === car.id;
                        const isChecked = selectedVehicleIds.includes(car.id);
                        const isSold = car.status === 'sold' || car.isSold;

                        return (
                          <div
                            key={car.id}
                            onClick={() => setSelectedVehicleId(car.id)}
                            className={`p-3.5 transition-all space-y-3 cursor-pointer ${
                              isSelected
                                ? 'bg-[#191D28] border-l-4 border-[#E5252A]'
                                : 'bg-[#10131A] hover:bg-[#131620]'
                            }`}
                          >
                            {/* Card Top: Checkbox, Thumbnail, Title & Status */}
                            <div className="flex items-start justify-between gap-2.5">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleSelectOne(car.id);
                                  }}
                                  className="rounded accent-[#E5252A] w-4 h-4 cursor-pointer shrink-0 mt-0.5"
                                />
                                <div className="relative w-12 h-10 rounded overflow-hidden bg-black/60 shrink-0 border border-white/[0.08]">
                                  <img
                                    src={car.imageUrl || 'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=1200&q=85'}
                                    alt={car.model}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                  {isSold && (
                                    <div className="absolute inset-0 bg-red-950/80 flex items-center justify-center text-[7px] font-mono font-black text-white uppercase">
                                      SOLD
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-[#ECE5D8] text-xs font-display truncate">
                                    {car.year} {car.make} {car.model}
                                  </div>
                                  <div className="text-[10px] text-[#94A3B8] truncate font-mono">
                                    {car.trim || 'Standard Edition'}
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0">
                                {isSold ? (
                                  <span className="px-2 py-0.5 rounded bg-red-950/60 border border-red-500/40 text-red-400 font-bold text-[9px] uppercase font-mono">
                                    SOLD OUT
                                  </span>
                                ) : car.status === 'reserved' ? (
                                  <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300 font-bold text-[9px] uppercase font-mono">
                                    RESERVED
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-bold text-[9px] uppercase font-mono">
                                    AVAILABLE
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Card Middle: Specs Grid */}
                            <div className="grid grid-cols-2 gap-2 bg-[#090B10] p-2.5 rounded-lg border border-white/[0.05] text-[11px] font-mono">
                              <div>
                                <span className="text-[9px] text-[#94A3B8] uppercase block">POWER / ENGINE</span>
                                <span className="text-[#ECE5D8] font-bold">{car.specs?.powerHp || car.powerHp || 140} HP</span>
                                <span className="text-[#94A3B8] text-[10px] block truncate">{car.specs?.engine || car.engine || 'OEM'}</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-[#94A3B8] uppercase block">ODOMETER / REG</span>
                                <span className="text-[#ECE5D8] font-bold">{(car.mileage || 0).toLocaleString()} km</span>
                                <span className="text-[#94A3B8] text-[10px] block truncate">{car.specs?.owners || car.owners || 1}st Owner</span>
                              </div>
                            </div>

                            {/* Card Bottom: Quick Touch Actions Bar */}
                            <div className="flex items-center justify-between gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleToggleSold(car.id, !isSold)}
                                className={`px-2.5 py-1.5 rounded text-[10px] font-mono font-bold uppercase transition-colors cursor-pointer border ${
                                  isSold
                                    ? 'bg-emerald-950/50 hover:bg-emerald-900 border-emerald-500/40 text-emerald-300'
                                    : 'bg-red-950/50 hover:bg-red-900 border-red-500/40 text-red-300'
                                }`}
                              >
                                {isSold ? 'Mark Available' : 'Mark Sold'}
                              </button>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingVehicle(car)}
                                  className="px-2.5 py-1.5 rounded bg-white/[0.06] hover:bg-[#E5252A] text-[#ECE5D8] hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-mono font-bold uppercase"
                                  title="Edit vehicle details"
                                >
                                  <Pencil className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteVehicle(car.id)}
                                  className="p-1.5 rounded bg-white/[0.06] hover:bg-red-600 text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                                  title="Remove vehicle from database"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Desktop Table Element (Tablets & Desktops sm+) */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left font-sans text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.06] bg-[#0C0E14] text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider">
                          <th className="py-3 px-3 w-8">
                            <input
                              type="checkbox"
                              checked={
                                paginatedVehicles.length > 0 &&
                                paginatedVehicles.every((v) => selectedVehicleIds.includes(v.id))
                              }
                              onChange={handleSelectAll}
                              className="rounded accent-[#E5252A] cursor-pointer"
                            />
                          </th>
                          <th className="py-3 px-3">VEHICLE &amp; VARIANT</th>
                          <th className="py-3 px-3">POWER / OUTPUT</th>
                          <th className="py-3 px-3">ODO / HISTORY</th>
                          <th className="py-3 px-3 text-right">STATUS</th>
                          <th className="py-3 px-3 text-center w-24">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {paginatedVehicles.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-xs font-mono text-[#94A3B8]">
                              {vehicles.length === 0
                                ? 'No cars currently registered in the database. Click "+ ADD CAR TO DB" to register a car with the 13 required parameters.'
                                : 'No vehicles match the selected filter criteria.'}
                            </td>
                          </tr>
                        ) : (
                          paginatedVehicles.map((car) => {
                            const isSelected = selectedVehicleId === car.id;
                            const isChecked = selectedVehicleIds.includes(car.id);
                            const isSold = car.status === 'sold' || car.isSold;

                            return (
                              <tr
                                key={car.id}
                                onClick={() => setSelectedVehicleId(car.id)}
                                className={`group transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#191D28] border-l-2 border-[#E5252A]'
                                    : 'hover:bg-[#131620]'
                                }`}
                              >
                                {/* Checkbox */}
                                <td
                                  className="py-3 px-3"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleSelectOne(car.id);
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {}}
                                    className="rounded accent-[#E5252A] cursor-pointer"
                                  />
                                </td>

                                {/* Vehicle Thumbnail & Variant */}
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-3">
                                    <div className="relative w-12 h-9 rounded overflow-hidden bg-black/60 shrink-0 border border-white/[0.08]">
                                      <img
                                        src={car.imageUrl || 'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=1200&q=85'}
                                        alt={car.model}
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                      {isSold && (
                                        <div className="absolute inset-0 bg-red-950/80 flex items-center justify-center text-[7px] font-mono font-black text-white uppercase">
                                          SOLD
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-[#ECE5D8] group-hover:text-white">
                                          {car.year} {car.make} {car.model}
                                        </span>
                                        {isSelected && (
                                          <span className="text-[8px] font-mono px-1 py-0.2 bg-[#E5252A] text-white font-bold rounded uppercase">
                                            SELECTED
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-[#94A3B8] line-clamp-1 font-mono">
                                        {car.trim}
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* POWER / OUTPUT */}
                                <td className="py-3 px-3 font-mono">
                                  <div className="text-xs font-bold text-[#ECE5D8]">
                                    {car.specs?.powerHp || 140} <span className="text-[10px] text-[#94A3B8]">BHP</span>
                                  </div>
                                  <div className="text-[10px] text-[#94A3B8] truncate max-w-[100px]">
                                    {car.specs?.engine || 'OEM Factory'}
                                  </div>
                                </td>

                                {/* ODO / HISTORY */}
                                <td className="py-3 px-3 font-mono">
                                  <div className="text-xs font-bold text-[#ECE5D8]">
                                    {car.mileage.toLocaleString()} km
                                  </div>
                                  <div className="text-[10px] text-[#94A3B8]">
                                    {car.specs?.owners || 1}st Owner
                                  </div>
                                </td>

                                {/* STATUS BADGE & QUICK TOGGLE */}
                                <td className="py-3 px-3 text-right font-mono">
                                  {isSold ? (
                                    <span className="inline-block px-2 py-0.5 rounded bg-red-950/60 border border-red-500/40 text-red-400 font-bold text-[10px] uppercase">
                                      SOLD OUT
                                    </span>
                                  ) : car.status === 'reserved' ? (
                                    <span className="inline-block px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300 font-bold text-[10px] uppercase">
                                      RESERVED
                                    </span>
                                  ) : (
                                    <span className="inline-block px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-bold text-[10px] uppercase">
                                      AVAILABLE
                                    </span>
                                  )}
                                </td>

                                {/* ACTIONS */}
                                <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setEditingVehicle(car)}
                                      className="p-1.5 rounded bg-white/[0.05] hover:bg-[#E5252A] text-[#ECE5D8] hover:text-white transition-colors cursor-pointer"
                                      title="Edit vehicle details & gallery images"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteVehicle(car.id)}
                                      className="p-1.5 rounded bg-white/[0.05] hover:bg-red-600 text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                                      title="Remove vehicle from database"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Batch Action Toolbar */}
                  <div className="px-3.5 sm:px-4 py-3 bg-[#0B0D13] border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-[#94A3B8]">Selected:</span>
                      <span className="font-bold text-[#ECE5D8]">{selectedVehicleIds.length} Vehicle(s)</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        disabled={selectedVehicleIds.length === 0}
                        onClick={handleBatchDelete}
                        className="px-2.5 py-1.5 rounded bg-red-950/70 hover:bg-red-900 disabled:opacity-30 border border-red-500/50 text-[11px] text-red-300 font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                        title="Delete selected vehicle records"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>DELETE ({selectedVehicleIds.length})</span>
                      </button>

                      <button
                        disabled={selectedVehicleIds.length === 0}
                        onClick={handleBatchMarkSold}
                        className="px-2.5 py-1.5 rounded bg-red-950/40 hover:bg-red-900/50 disabled:opacity-30 border border-red-500/40 text-[11px] text-red-300 font-bold transition-colors cursor-pointer"
                      >
                        MARK SOLD
                      </button>

                      <button
                        disabled={selectedVehicleIds.length === 0}
                        onClick={handleBatchMarkAvailable}
                        className="px-2.5 py-1.5 rounded bg-emerald-950/40 hover:bg-emerald-900/50 disabled:opacity-30 border border-emerald-500/40 text-[11px] text-emerald-300 font-bold transition-colors cursor-pointer"
                      >
                        MARK AVAILABLE
                      </button>

                      <button
                        onClick={async () => {
                          showNotification('Syncing live fleet from Supabase...');
                          try {
                            const fresh = await refreshFromSupabase();
                            setVehicles([...fresh]);
                            showNotification(`Registry updated: ${fresh.length} vehicle(s) loaded.`);
                          } catch {
                            const current = getStoredVehicles();
                            setVehicles([...current]);
                            showNotification('Registry view refreshed.');
                          }
                        }}
                        className="p-1.5 rounded bg-[#171922] hover:bg-white/[0.08] border border-white/[0.08] text-[#94A3B8] hover:text-[#ECE5D8] transition-colors cursor-pointer"
                        title="Sync with live Supabase database"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: TELEMETRY INSPECTOR (5 cols) */}
              <div className="lg:col-span-5">
                <div className="sticky top-16 w-full">
                  <TelemetryInspector
                    vehicle={activeSelectedVehicle}
                    onUpdateVehicle={handleUpdateVehicle}
                    onDeleteVehicle={handleDeleteVehicle}
                    onToggleSold={handleToggleSold}
                    onEditVehicle={(veh) => setEditingVehicle(veh)}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* ===================== VIEW 2: CUSTOMER LEADS & INQUIRIES ===================== */}
        {activeAdminView === 'leads' && (
          <div className="bg-[#10131A] border border-white/[0.08] rounded-xl p-8 text-center">
            <div className="max-w-md mx-auto space-y-3">
              <Mail className="w-10 h-10 text-[#E5252A] mx-auto" />
              <h3 className="font-display font-black text-lg text-[#ECE5D8] uppercase">
                Customer Inquiries &amp; Test Drive Leads
              </h3>
              <p className="text-xs font-mono text-[#94A3B8] leading-relaxed">
                Leads submitted by customers are streamed directly to the centralized administrator portal.
              </p>
              <button
                onClick={() => setActiveAdminView('inventory')}
                className="mt-4 px-4 py-2 rounded bg-[#E5252A] text-white text-xs font-mono font-bold uppercase cursor-pointer"
              >
                Return to Vehicle Registry Database
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ADD VEHICLE MODAL */}
      <AddVehicleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddVehicle}
      />

      {/* EDIT VEHICLE MODAL (DETAILS & MULTI-IMAGE SLIDING GALLERY) */}
      {editingVehicle && (
        <EditVehicleModal
          vehicle={editingVehicle}
          isOpen={Boolean(editingVehicle)}
          onClose={() => setEditingVehicle(null)}
          onSave={handleSaveEditedVehicle}
        />
      )}

      {/* SUPABASE CLOUD DATABASE & STORAGE CONFIG MODAL */}
      {isSupabaseModalOpen && (
        <SupabaseSettingsModal
          isOpen={isSupabaseModalOpen}
          onClose={() => setIsSupabaseModalOpen(false)}
          onConfigSaved={async () => {
            try {
              const fresh = await refreshFromSupabase();
              setVehicles(fresh);
              showNotification(`⚡ Supabase connected: ${fresh.length} vehicle(s) loaded into vault.`);
            } catch {
              setVehicles(getStoredVehicles());
              showNotification('⚡ Supabase cloud database & storage credentials updated.');
            }
          }}
        />
      )}
    </div>
  );
};
