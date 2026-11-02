import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Logo } from './Logo';
import { Search, Sparkles, Menu, X, ArrowRight, Car, CheckCircle2, SlidersHorizontal, RotateCcw, ChevronDown, Database, RefreshCw, Trash2, FileSpreadsheet } from 'lucide-react';
import { Vehicle, FilterState } from '../types';
import { getStoredVehicles, subscribeToVehicles } from '../firebase/vehicleService';
import { CATEGORIES } from './FilterBar';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  vehicles?: Vehicle[];
  favoritesCount?: number;
  onOpenFavorites?: () => void;
  onNavigateSection: (sectionId: string) => void;
  activeSection: string;
  onOpenFinancing: () => void;
  onOpenConcierge: () => void;
  onOpenCustomRequest: () => void;
  onNavigateAdmin?: () => void;
  filters?: FilterState;
  onFilterChange?: (updates: Partial<FilterState>) => void;
  onResetFilters?: () => void;
  categoryCounts?: Record<string, number>;
  filteredCount?: number;
  totalCount?: number;
  onOpenSupabaseSettings?: () => void;
  onRefreshSupabase?: () => Promise<void>;
  onClearDatabase?: () => Promise<void>;
  onExportCSV?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  vehicles: propVehicles,
  onNavigateSection,
  activeSection,
  onOpenConcierge,
  onOpenCustomRequest,
  filters,
  onFilterChange,
  onResetFilters,
  categoryCounts,
  filteredCount,
  totalCount,
  onOpenSupabaseSettings,
  onRefreshSupabase,
  onClearDatabase,
  onExportCSV,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);

  // Synchronize live vehicle inventory from props without redundant Firestore listeners
  const liveVehicles = propVehicles && propVehicles.length > 0 ? propVehicles : getStoredVehicles();


  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(e.target as Node)) {
        setDesktopDropdownOpen(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)) {
        setMobileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute related/matching cars based on user entered query
  const matchingVehicles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    return liveVehicles
      .filter((car) => {
        const title = `${car.year || ''} ${car.make || ''} ${car.model || ''} ${car.trim || ''}`.toLowerCase();
        const engine = (car.engine || car.specs?.engine || '').toLowerCase();
        const category = (car.category || '').toLowerCase();
        return title.includes(q) || engine.includes(q) || category.includes(q);
      })
      .slice(0, 6); // Top 6 matching items
  }, [liveVehicles, searchQuery]);

  const handleExecuteSearch = (queryToExecute?: string) => {
    const targetQuery = queryToExecute !== undefined ? queryToExecute : searchQuery;
    if (queryToExecute !== undefined) {
      onSearchChange(queryToExecute);
    }
    setDesktopDropdownOpen(false);
    setMobileDropdownOpen(false);
    setMobileMenuOpen(false);
    onNavigateSection('inventory');
  };

  const handleSelectCar = (car: Vehicle) => {
    const selectedName = `${car.make} ${car.model}`;
    onSearchChange(selectedName);
    setDesktopDropdownOpen(false);
    setMobileDropdownOpen(false);
    setMobileMenuOpen(false);
    onNavigateSection('inventory');
  };

  // Real-time unique companies/makes currently in the fleet database
  const availableMakes = useMemo(() => {
    const set = new Set<string>();
    liveVehicles.forEach((car) => {
      if (car.make && car.make.trim()) {
        set.add(car.make.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [liveVehicles]);

  const hasActiveFilters = Boolean(
    filters && (
      (filters.category && filters.category !== 'all') ||
      (filters.make && filters.make !== 'all') ||
      (filters.transmission && filters.transmission !== 'all') ||
      (filters.selectedVehicleId && filters.selectedVehicleId !== 'all')
    )
  );

  const handleApplyMobileFilters = () => {
    setMobileFilterOpen(false);
    setMobileMenuOpen(false);
    onNavigateSection('inventory');
    setTimeout(() => {
      const el = document.getElementById('inventory-section') || document.getElementById('vehicle-grid-container');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0F1115]/95 backdrop-blur-md border-b border-white/[0.07]">
      {/* Main Navigation Bar */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 h-20 flex items-center justify-between gap-4">
        {/* Logo */}
        <div
          id="nav-logo"
          onClick={() => onNavigateSection('hero')}
          className="cursor-pointer transition-transform hover:scale-[1.01]"
        >
          <Logo size="md" />
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-7 text-xs font-bold uppercase tracking-wider">
          <button
            id="nav-link-home"
            onClick={() => onNavigateSection('hero')}
            className={`transition-colors py-2 relative flex items-center gap-1.5 cursor-pointer ${
              activeSection !== 'inventory'
                ? 'text-[#ECE5D8] hover:text-[#E5252A]'
                : 'text-[#94A3B8] hover:text-[#ECE5D8]'
            }`}
          >
            HOME
          </button>

          <button
            id="nav-link-inventory"
            onClick={() => onNavigateSection('inventory')}
            className={`transition-colors py-2 relative flex items-center gap-1.5 cursor-pointer ${
              activeSection === 'inventory'
                ? 'text-[#E5252A]'
                : 'text-[#ECE5D8] hover:text-[#E5252A]'
            }`}
          >
            <span>INVENTORY</span>
            <span className="bg-[#E5252A] text-white text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
              10+
            </span>
            {activeSection === 'inventory' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E5252A] shadow-[0_0_8px_#E5252A]"></span>
            )}
          </button>

          <button
            id="nav-link-test-drive"
            onClick={() => onNavigateSection('test-drive')}
            className="text-[#ECE5D8] hover:text-[#E5252A] transition-colors py-2 cursor-pointer"
          >
            BOOK TEST DRIVE
          </button>

          <button
            id="nav-link-custom-request"
            onClick={onOpenCustomRequest}
            className="text-[#ECE5D8] hover:text-[#E5252A] transition-colors py-2 flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E5252A]" />
            <span>CUSTOM VEHICLE REQUEST</span>
          </button>
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2.5">
          {/* Database / Cloud Operations Buttons relocated from Admin header */}
          <div className="hidden 2xl:flex items-center gap-1.5">
            {onOpenSupabaseSettings && (
              <button
                onClick={onOpenSupabaseSettings}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#171922] hover:bg-[#202330] border border-emerald-500/40 text-[10px] text-emerald-300 font-bold font-mono transition-all cursor-pointer"
                title="Configure Supabase Cloud"
              >
                <Database className="w-3 h-3 text-emerald-400" />
                <span>CLOUD</span>
              </button>
            )}
            {onRefreshSupabase && (
              <button
                onClick={onRefreshSupabase}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-[10px] text-emerald-300 font-bold font-mono transition-all cursor-pointer"
                title="Fetch Fleet"
              >
                <RefreshCw className="w-3 h-3 text-emerald-400" />
                <span>FETCH</span>
              </button>
            )}
            {onExportCSV && (
              <button
                onClick={onExportCSV}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-[#171922] hover:bg-[#202330] border border-emerald-500/30 text-[10px] text-emerald-300 font-bold font-mono transition-all cursor-pointer"
                title="Export CSV"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-400" />
                <span>EXPORT</span>
              </button>
            )}
          </div>

          {/* Desktop Quick Search with Dropdown Suggestions */}
          <div ref={desktopSearchRef} className="relative hidden md:block w-56 lg:w-64 xl:w-72">
            <div className="relative flex items-center">
              <input
                id="global-quick-search-input"
                type="text"
                placeholder="Search make, model, trim..."
                value={searchQuery}
                onFocus={() => {
                  if (searchQuery.trim()) setDesktopDropdownOpen(true);
                }}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setDesktopDropdownOpen(e.target.value.trim().length > 0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleExecuteSearch();
                  } else if (e.key === 'Escape') {
                    setDesktopDropdownOpen(false);
                  }
                }}
                className="w-full bg-[#171922] border border-white/[0.1] rounded text-xs text-[#ECE5D8] placeholder-[#94A3B8] pl-9 pr-9 py-2.5 focus:outline-none focus:border-[#E5252A] focus:ring-1 focus:ring-[#E5252A] transition-all font-sans"
              />

              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none p-0.5">
                <Search className="w-4 h-4" />
              </div>

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange('');
                    setDesktopDropdownOpen(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Desktop Suggestions Dropdown */}
            {desktopDropdownOpen && searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#12151D] border border-white/[0.15] rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3.5 py-2 border-b border-white/[0.08] bg-[#161A24] flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[#94A3B8] uppercase font-bold tracking-wider">
                    RELATED CARS ({matchingVehicles.length})
                  </span>
                  <span className="text-[#E5252A] font-bold">CLICK TO REDIRECT</span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-white/[0.06]">
                  {matchingVehicles.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-xs text-[#94A3B8] font-sans">
                        No vehicles found matching &ldquo;<span className="text-[#ECE5D8] font-bold">{searchQuery}</span>&rdquo;
                      </p>
                      <button
                        onClick={() => handleExecuteSearch()}
                        className="mt-2.5 px-3 py-1.5 rounded bg-[#E5252A] hover:bg-[#c00017] text-white text-xs font-mono font-bold uppercase transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <span>Search in All Inventory</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    matchingVehicles.map((car) => {
                      const isSold = car.status === 'sold' || car.isSold;
                      return (
                        <div
                          key={car.id}
                          onClick={() => handleSelectCar(car)}
                          className="p-2.5 hover:bg-white/[0.07] flex items-center gap-3 transition-colors cursor-pointer group"
                        >
                          <div className="relative w-12 h-9 rounded overflow-hidden bg-black/60 shrink-0 border border-white/[0.08]">
                            <img
                              src={car.imageUrl || 'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=1200&q=85'}
                              alt={car.model}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              referrerPolicy="no-referrer"
                            />
                            {isSold && (
                              <div className="absolute inset-0 bg-red-950/80 flex items-center justify-center text-[7px] font-mono font-black text-white uppercase">
                                SOLD
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 text-left">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-[#ECE5D8] group-hover:text-white truncate">
                                {car.year} {car.make} {car.model}
                              </span>
                            </div>
                            <div className="text-[10px] text-[#94A3B8] font-mono truncate flex items-center gap-1.5">
                              <span>{car.trim || 'Standard'}</span>
                              <span>•</span>
                              <span>{car.powerHp || car.specs?.powerHp || 140} HP</span>
                            </div>
                          </div>

                          <div className="shrink-0 text-right font-mono">
                            {isSold ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-500/40 uppercase">
                                SOLD
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 uppercase">
                                IN STOCK
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {matchingVehicles.length > 0 && (
                  <div className="p-2 border-t border-white/[0.08] bg-[#0E1017]">
                    <button
                      onClick={() => handleExecuteSearch()}
                      className="w-full py-1.5 rounded bg-[#171922] hover:bg-[#E5252A] text-[#ECE5D8] hover:text-white text-xs font-mono font-bold uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Show All Results for &ldquo;{searchQuery}&rdquo;</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Filter Toggle Button - only shown in inventory */}
          {activeSection === 'inventory' && (
            <button
              id="mobile-nav-filter-toggle"
              onClick={() => {
                setMobileFilterOpen(!mobileFilterOpen);
                if (!mobileFilterOpen) setMobileMenuOpen(false);
              }}
              className={`p-2.5 sm:hidden border rounded text-[#ECE5D8] cursor-pointer relative transition-all flex items-center justify-center ${
                mobileFilterOpen || hasActiveFilters
                  ? 'bg-[#E5252A] text-white border-[#E5252A] shadow-[0_0_12px_rgba(229,37,42,0.5)]'
                  : 'bg-[#171922] border-white/[0.1] hover:border-white/25'
              }`}
              title="Filter Inventory"
              aria-label="Filter Inventory"
            >
              <SlidersHorizontal className="w-5 h-5" />
              {hasActiveFilters && !mobileFilterOpen && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-[#0F1115]"></span>
              )}
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            id="mobile-nav-toggle"
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen);
              if (!mobileMenuOpen) setMobileFilterOpen(false);
            }}
            className="p-2.5 lg:hidden bg-[#171922] border border-white/[0.1] rounded text-[#ECE5D8] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Filter Drawer from Navbar */}
      {mobileFilterOpen && (
        <div className="sm:hidden bg-[#12141C] border-b border-white/[0.12] px-4 py-5 space-y-4 animate-in slide-in-from-top-2 duration-150 max-h-[85vh] overflow-y-auto shadow-2xl">
          {/* Filter Header Row */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E5252A] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E5252A]"></span>
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#ECE5D8]">
                FLEET FILTERS
              </span>
              <span className="text-[10px] font-mono text-[#94A3B8]">
                ({filteredCount ?? liveVehicles.length} matched)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {hasActiveFilters && onResetFilters && (
                <button
                  id="mobile-reset-filters-btn"
                  onClick={onResetFilters}
                  className="text-[11px] font-mono font-bold text-[#E5252A] hover:text-[#ff4e52] flex items-center gap-1 px-2.5 py-1 rounded bg-[#171922] border border-white/[0.1] cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>RESET</span>
                </button>
              )}
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 rounded text-[#94A3B8] hover:text-white hover:bg-white/[0.05] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold">
                SELECT CATEGORY / BODY TYPE
              </label>
              <span className="text-[10px] font-mono text-[#E5252A] font-bold">
                {filters?.category?.toUpperCase() || 'ALL'}
              </span>
            </div>

            {/* Quick Category Grid */}
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => {
                const isActive = (filters?.category || 'all').toLowerCase() === cat.id.toLowerCase();
                const Icon = cat.icon;
                const count = categoryCounts?.[cat.id] ?? (cat.id === 'all' ? (totalCount ?? liveVehicles.length) : 0);

                return (
                  <button
                    key={cat.id}
                    id={`mobile-nav-cat-${cat.id}`}
                    onClick={() => onFilterChange?.({ category: cat.id })}
                    className={`p-2.5 rounded-lg text-left transition-all flex items-center justify-between cursor-pointer border ${
                      isActive
                        ? 'bg-gradient-to-r from-[#E5252A] to-[#c00017] text-white border-[#FF4E52]/40 shadow-[0_0_12px_rgba(229,37,42,0.4)]'
                        : 'bg-[#171922] text-[#ECE5D8] border-white/[0.08] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-[#94A3B8]'}`} />
                      <span className="text-xs font-bold font-display uppercase tracking-wide truncate">
                        {cat.shortLabel || cat.label}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ml-1 shrink-0 ${
                        isActive ? 'bg-black/30 text-white' : 'bg-white/[0.06] text-[#94A3B8]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Company / Make Filter */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono uppercase tracking-wider text-[#94A3B8] font-bold">
                COMPANY / BRAND ({availableMakes.length})
              </label>
              {filters?.make && filters.make !== 'all' && (
                <span className="text-[10px] font-mono text-[#E5252A] font-bold">
                  {filters.make}
                </span>
              )}
            </div>
            <div className="relative">
              <select
                id="mobile-nav-filter-make"
                value={filters?.make || 'all'}
                onChange={(e) => onFilterChange?.({ make: e.target.value })}
                className="w-full bg-[#0B0D13] border border-white/[0.15] rounded-xl text-xs font-bold text-[#ECE5D8] px-3.5 py-2.5 appearance-none focus:outline-none focus:border-[#E5252A] pr-9 cursor-pointer shadow-inner"
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
              <ChevronDown className="w-4 h-4 text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Action Button: View Verified */}
          <div className="pt-2">
            <button
              id="mobile-nav-filter-submit"
              onClick={handleApplyMobileFilters}
              className="w-full bg-gradient-to-r from-[#E5252A] to-[#c00017] hover:from-[#f02b30] hover:to-[#d6001a] text-white font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(229,37,42,0.35)] cursor-pointer active:scale-[0.98]"
            >
              <Search className="w-4 h-4" />
              <span>VIEW {filteredCount ?? liveVehicles.length} VERIFIED VEHICLES</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#171922] border-b border-white/[0.1] px-4 py-5 space-y-4 animate-in slide-in-from-top-2 duration-150">
          {/* Mobile Search Input with Dropdown Suggestions */}
          <div ref={mobileSearchRef} className="relative w-full">
            <div className="relative flex items-center">
              <input
                id="mobile-quick-search-input"
                type="text"
                placeholder="Search make, model, trim..."
                value={searchQuery}
                onFocus={() => {
                  if (searchQuery.trim()) setMobileDropdownOpen(true);
                }}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setMobileDropdownOpen(e.target.value.trim().length > 0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleExecuteSearch();
                  }
                }}
                className="w-full bg-[#0F1115] border border-white/[0.12] rounded text-sm text-[#ECE5D8] placeholder-[#94A3B8] pl-9 pr-14 py-2.5 focus:outline-none focus:border-[#E5252A]"
              />

              <button
                type="button"
                onClick={() => handleExecuteSearch()}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#E5252A] p-0.5 cursor-pointer"
                title="Search and redirect"
              >
                <Search className="w-4 h-4" />
              </button>

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange('');
                    setMobileDropdownOpen(false);
                  }}
                  className="absolute right-9 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => handleExecuteSearch()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#E5252A] hover:bg-[#c00017] text-white text-[11px] font-mono font-bold px-2.5 py-1 rounded transition-colors cursor-pointer uppercase shadow"
              >
                GO
              </button>
            </div>

            {/* Mobile Suggestions Dropdown */}
            {mobileDropdownOpen && searchQuery.trim() && (
              <div className="mt-2 bg-[#10131A] border border-white/[0.15] rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in duration-150">
                <div className="px-3.5 py-2 border-b border-white/[0.08] bg-[#161A24] flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[#94A3B8] uppercase font-bold tracking-wider">
                    RELATED CARS ({matchingVehicles.length})
                  </span>
                  <span className="text-[#E5252A] font-bold">TAP TO VIEW</span>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-white/[0.06]">
                  {matchingVehicles.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-xs text-[#94A3B8]">
                        No vehicles found matching &ldquo;<span className="text-[#ECE5D8] font-bold">{searchQuery}</span>&rdquo;
                      </p>
                      <button
                        onClick={() => handleExecuteSearch()}
                        className="mt-2.5 px-3 py-1.5 rounded bg-[#E5252A] hover:bg-[#c00017] text-white text-xs font-mono font-bold uppercase transition-colors cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <span>Browse All Cars</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    matchingVehicles.map((car) => {
                      const isSold = car.status === 'sold' || car.isSold;
                      return (
                        <div
                          key={car.id}
                          onClick={() => handleSelectCar(car)}
                          className="p-2.5 hover:bg-white/[0.07] flex items-center gap-3 transition-colors cursor-pointer active:bg-white/[0.1]"
                        >
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

                          <div className="flex-1 min-w-0 text-left">
                            <div className="text-xs font-bold text-[#ECE5D8] truncate">
                              {car.year} {car.make} {car.model}
                            </div>
                            <div className="text-[10px] text-[#94A3B8] font-mono truncate">
                              {car.trim || 'Standard'} • {car.powerHp || car.specs?.powerHp || 140} HP
                            </div>
                          </div>

                          <div className="shrink-0 text-right font-mono">
                            {isSold ? (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-500/40 uppercase">
                                SOLD
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 uppercase">
                                AVAILABLE
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {matchingVehicles.length > 0 && (
                  <div className="p-2 border-t border-white/[0.08] bg-[#0E1017]">
                    <button
                      onClick={() => handleExecuteSearch()}
                      className="w-full py-2 rounded bg-[#171922] hover:bg-[#E5252A] text-[#ECE5D8] hover:text-white text-xs font-mono font-bold uppercase transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Show All Results for &ldquo;{searchQuery}&rdquo;</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-2 text-sm font-semibold uppercase tracking-wider">
            {/* Quick Fleet Filters Action in Drawer */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setMobileFilterOpen(true);
              }}
              className="py-2.5 px-3 rounded bg-white/[0.04] hover:bg-white/[0.08] text-[#ECE5D8] justify-between flex items-center w-full cursor-pointer border border-white/[0.08]"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#E5252A]" />
                <span className="font-semibold text-xs tracking-wider">FLEET FILTERS</span>
              </div>
              <span className="text-[10px] font-mono text-[#94A3B8] bg-[#0E1017] px-2 py-0.5 rounded border border-white/[0.06]">
                {filters?.category !== 'all' ? filters?.category?.toUpperCase() : 'ALL'} • {filteredCount ?? liveVehicles.length} Units
              </span>
            </button>

            <button
              onClick={() => {
                onNavigateSection('hero');
                setMobileMenuOpen(false);
              }}
              className="text-center py-2.5 px-3 rounded hover:bg-white/[0.05] text-[#ECE5D8] justify-center flex items-center w-full cursor-pointer"
            >
              HOME
            </button>
            <button
              onClick={() => {
                onNavigateSection('inventory');
                setMobileMenuOpen(false);
              }}
              className="text-center py-2.5 px-3 rounded hover:bg-white/[0.05] text-[#ECE5D8] flex items-center justify-center gap-2 w-full cursor-pointer"
            >
              <span>INVENTORY</span>
              <span className="bg-[#E5252A] text-white text-xs px-2 py-0.5 rounded font-mono">10+ Units</span>
            </button>
            <button
              onClick={() => {
                onNavigateSection('test-drive');
                setMobileMenuOpen(false);
              }}
              className="text-center py-2.5 px-3 rounded hover:bg-white/[0.05] text-[#ECE5D8] justify-center flex items-center w-full cursor-pointer"
            >
              BOOK TEST DRIVE
            </button>
            <button
              onClick={() => {
                onOpenConcierge?.();
                setMobileMenuOpen(false);
              }}
              className="text-center py-2.5 px-3 rounded hover:bg-white/[0.05] text-[#ECE5D8] justify-center flex items-center w-full cursor-pointer"
            >
              CONTACT US
            </button>
            <button
              id="mobile-btn-custom-vehicle-request"
              onClick={() => {
                onOpenCustomRequest();
                setMobileMenuOpen(false);
              }}
              className="text-center py-2.5 px-3 rounded bg-[#E5252A]/15 hover:bg-[#E5252A]/25 border border-[#E5252A]/30 text-[#ECE5D8] hover:text-white justify-center flex items-center gap-2 w-full cursor-pointer font-bold"
            >
              <Sparkles className="w-4 h-4 text-[#E5252A]" />
              <span>CUSTOM VEHICLE REQUEST</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
