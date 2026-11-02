import React, { useState, useMemo, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { HomeVaultTeaser } from './components/HomeVaultTeaser';
import { CustomRequestBanner } from './components/CustomRequestBanner';
import { InventoryPage } from './components/InventoryPage';
import { HowItWorks } from './components/HowItWorks';
import { BookingForm } from './components/BookingForm';
import { TrustBadges } from './components/TrustBadges';
import { Footer } from './components/Footer';

import { VehicleDetailModal } from './components/VehicleDetailModal';
import { VehicleDetailPage } from './components/VehicleDetailPage';
import { VipConciergeModal } from './components/VipConciergeModal';
import { EnquiryModal } from './components/EnquiryModal';
import { CustomRequestModal } from './components/CustomRequestModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLogin } from './components/admin/AdminLogin';
import { SupabaseSettingsModal } from './components/admin/SupabaseSettingsModal';

import { getStoredVehicles, subscribeToVehicles, refreshFromSupabase } from './firebase/vehicleService';
import { syncSupabaseConfigFromServer } from './supabase/supabaseClient';
import { Vehicle, FilterState, QuickFilter, AdminUser } from './types';
import { subscribeToAuthState, logoutAdmin } from './firebase/authService';

// Hardcoded year-wise sort: latest 2026 first, decreasing
const sortVehiclesByYear = (list: Vehicle[]): Vehicle[] => {
  return [...list].sort((a, b) => {
    const yearA = typeof a.year === 'number' ? a.year : parseInt(String(a.year || 0), 10) || 0;
    const yearB = typeof b.year === 'number' ? b.year : parseInt(String(b.year || 0), 10) || 0;
    return yearB - yearA; // Latest 2026 first, decreasing
  });
};

export default function App() {
  // Live vehicle inventory database state (synced with Supabase & local cache)
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => sortVehiclesByYear(getStoredVehicles()));
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Real-time vehicles sync across Supabase & local updates
  useEffect(() => {
    let isMounted = true;

    // First synchronize server credentials if available, then pull fleet
    syncSupabaseConfigFromServer()
      .then(() => refreshFromSupabase())
      .then((loadedCars) => {
        if (isMounted && loadedCars && loadedCars.length > 0) {
          setVehicles(sortVehiclesByYear(loadedCars));
        }
      })
      .catch((err) => console.warn('Supabase initial fetch note:', err));

    const unsub = subscribeToVehicles((updatedList) => {
      if (isMounted) {
        setVehicles(sortVehiclesByYear(updatedList));
      }
    });

    return () => {
      isMounted = false;
      unsub();
    };
  }, []);

  interface AppRouteState {
    path: '/' | '/inventory' | '/admin' | '/vehicle';
    vehicleId?: string;
  }

  // Route resolution helper supporting /#/admin, /#/inventory, /#/vehicle/:id, etc.
  const resolveCurrentRoute = (): AppRouteState => {
    if (typeof window === 'undefined') return { path: '/' };
    const p = (window.location.pathname || '').toLowerCase();
    const h = window.location.hash || '';
    const hLower = h.toLowerCase();

    // Check for vehicle detail route: e.g. #/vehicle/:id, #vehicle/:id, /vehicle/:id
    if (hLower.startsWith('#/vehicle/') || hLower.startsWith('#vehicle/')) {
      const parts = h.split('/');
      const rawId = parts.slice(2).join('/').split('?')[0].trim();
      if (rawId) {
        return { path: '/vehicle', vehicleId: rawId };
      }
    }
    if (p.startsWith('/vehicle/')) {
      const parts = p.split('/');
      const rawId = parts.slice(2).join('/').split('?')[0].trim();
      if (rawId) {
        return { path: '/vehicle', vehicleId: rawId };
      }
    }

    // Dedicated check for admin access (e.g., /#/admin, #/admin, #admin, /admin)
    if (
      hLower === '#/admin' ||
      hLower === '#admin' ||
      hLower.startsWith('#/admin') ||
      p === '/admin' ||
      p.startsWith('/admin')
    ) {
      return { path: '/admin' };
    }

    if (
      hLower === '#/inventory' ||
      hLower === '#inventory' ||
      hLower.startsWith('#/inventory') ||
      p === '/inventory' ||
      p.startsWith('/inventory')
    ) {
      return { path: '/inventory' };
    }

    return { path: '/' };
  };

  // Routing state
  const [currentRoute, setCurrentRoute] = useState<AppRouteState>(() => resolveCurrentRoute());

  // Authenticated Admin User
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(() => {
    try {
      const saved = sessionStorage.getItem('tt_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Listen to browser navigation / hash / path changes
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentRoute(resolveCurrentRoute());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    // Subscribe to Firebase Auth
    const unsubAuth = subscribeToAuthState((user) => {
      if (user) {
        setCurrentAdmin(user);
        try {
          sessionStorage.setItem('tt_admin_user', JSON.stringify(user));
        } catch {}
      }
    });

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
      unsubAuth();
    };
  }, []);

  const handleAdminLoginSuccess = (admin: AdminUser) => {
    setCurrentAdmin(admin);
    try {
      sessionStorage.setItem('tt_admin_user', JSON.stringify(admin));
    } catch {}
  };

  const handleAdminLogout = async () => {
    try {
      await logoutAdmin();
    } catch {}
    setCurrentAdmin(null);
    try {
      sessionStorage.removeItem('tt_admin_user');
    } catch {}
  };

  const navigateToVehicle = (vehicleId: string) => {
    setCurrentRoute({ path: '/vehicle', vehicleId });
    window.location.hash = `/vehicle/${vehicleId}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToAdmin = () => {
    setCurrentRoute({ path: '/admin' });
    window.location.hash = '/admin';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToStore = () => {
    setCurrentRoute({ path: '/' });
    if (
      window.location.hash.includes('admin') ||
      window.location.hash.includes('inventory') ||
      window.location.hash.includes('vehicle')
    ) {
      window.location.hash = '';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToInventory = () => {
    setCurrentRoute({ path: '/inventory' });
    window.location.hash = '/inventory';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Global search & filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    make: 'all',
    transmission: 'all',
    selectedVehicleId: 'all',
  });

  // Active section for navigation
  const [activeSection, setActiveSection] = useState('inventory');

  // Customer Enquiry Modal state
  const [enquiryVehicle, setEnquiryVehicle] = useState<Vehicle | null>(null);
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);

  const handleOpenEnquiry = (vehicle: Vehicle) => {
    setEnquiryVehicle(vehicle);
    setIsEnquiryOpen(true);
  };

  // Modals state
  const [selectedDetailVehicle, setSelectedDetailVehicle] = useState<Vehicle | null>(null);
  const [bookingVehicleId, setBookingVehicleId] = useState<string | undefined>(undefined);
  const [isConciergeOpen, setIsConciergeOpen] = useState(false);
  const [isCustomRequestOpen, setIsCustomRequestOpen] = useState(false);

  // Live count of sold/delivered vehicles from the active database
  const soldVehiclesCount = useMemo(() => {
    return vehicles.filter((v) => v.status === 'sold' || v.isSold).length;
  }, [vehicles]);

  // Only available (non-sold) vehicles for customer public pages
  const availableVehicles = useMemo(() => {
    return vehicles.filter((car) => !(car.status === 'sold' || car.isSold));
  }, [vehicles]);

  // Filter logic
  const filteredVehicles = useMemo(() => {
    return availableVehicles.filter((car) => {
      const engineStr = car.engine || car.specs?.engine || '';
      const transStr = (car.transmission || car.specs?.transmission || '').toLowerCase();
      const catStr = (car.category || 'sedans').toLowerCase();

      // Target Car / Model specific filter
      if (filters.selectedVehicleId && filters.selectedVehicleId !== 'all') {
        if (car.id !== filters.selectedVehicleId) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = `${car.make || ''} ${car.model || ''} ${car.trim || ''} ${car.year || ''} ${car.id || ''}`.toLowerCase().includes(q);
        const matchEngine = engineStr.toLowerCase().includes(q);
        const matchHighlights = (car.highlights || []).some((h) => h.toLowerCase().includes(q));
        if (!matchTitle && !matchEngine && !matchHighlights) return false;
      }

      // Quick filter
      if (quickFilter === 'v8-plus' && !engineStr.match(/v8|v10|v12/i)) return false;
      if (quickFilter === 'sub-4s' && (car.specs?.zeroToSixtySec ?? 5.0) >= 4.0) return false;
      if (quickFilter === 'under-20k-miles' && (car.mileage || 0) >= 20000) return false;
      if (quickFilter === 'manual' && !transStr.includes('manual')) return false;

      // Category filter (SUV, Sedans, Hatchback, MPV, Motorcycle)
      if (filters.category !== 'all' && catStr !== filters.category.toLowerCase()) {
        return false;
      }

      // Make
      if (filters.make !== 'all' && car.make !== filters.make) return false;

      // Transmission / Gearbox
      if (filters.transmission === 'manual' && !transStr.includes('manual')) {
        return false;
      }
      if (
        filters.transmission === 'dual-clutch' &&
        !transStr.includes('pdk') &&
        !transStr.includes('dual-clutch') &&
        !transStr.includes('dct')
      ) {
        return false;
      }
      if (
        filters.transmission === 'automatic' &&
        !transStr.includes('automatic') &&
        !transStr.includes('auto') &&
        !transStr.includes('8-speed') &&
        !transStr.includes('10-speed')
      ) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      const yearA = typeof a.year === 'number' ? a.year : parseInt(String(a.year || 0), 10) || 0;
      const yearB = typeof b.year === 'number' ? b.year : parseInt(String(b.year || 0), 10) || 0;
      return yearB - yearA; // Latest 2026 first, decreasing
    });
  }, [availableVehicles, searchQuery, quickFilter, filters]);

  // Calculate counts for categories (all, suv, sedans, hatchback, mpv, motorcycle)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: availableVehicles.length,
      suv: 0,
      sedans: 0,
      hatchback: 0,
      mpv: 0,
      motorcycle: 0,
    };
    availableVehicles.forEach((car) => {
      const cat = (car.category || 'sedans').toLowerCase();
      if (counts[cat] !== undefined) {
        counts[cat]++;
      }
    });
    return counts;
  }, [availableVehicles]);

  const handleNavigateSection = (sectionId: string) => {
    setActiveSection(sectionId);
    if (sectionId === 'hero') {
      if (currentRoute.path !== '/') {
        navigateToStore();
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (sectionId === 'inventory') {
      navigateToInventory();
    } else if (sectionId === 'how-it-works' || sectionId === 'standard') {
      if (currentRoute.path !== '/') {
        navigateToStore();
        setTimeout(() => {
          document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else {
        document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (sectionId === 'test-drive') {
      if (currentRoute.path !== '/') {
        navigateToStore();
        setTimeout(() => {
          document.getElementById('test-drive-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      } else {
        document.getElementById('test-drive-section')?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleScheduleTestDrive = (v: Vehicle) => {
    setBookingVehicleId(v.id);
    if (currentRoute.path !== '/') {
      navigateToStore();
      setTimeout(() => {
        document.getElementById('test-drive-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      const el = document.getElementById('test-drive-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Dedicated Admin Route View
  if (currentRoute.path === '/admin') {
    if (currentAdmin) {
      return (
        <AdminDashboard
          currentAdmin={currentAdmin}
          onLogout={handleAdminLogout}
          onBackToStore={navigateToStore}
        />
      );
    }
    return (
      <AdminLogin
        onLoginSuccess={handleAdminLoginSuccess}
        onBackToStore={navigateToStore}
      />
    );
  }

  const handleExportCSV = () => {
    if (vehicles.length === 0) return;
    const cleanField = (val: any): string => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };
    const headers = ['Vehicle ID', 'Year', 'Make', 'Model', 'Trim', 'Category', 'Status', 'Price (INR)', 'Mileage'];
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
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] text-[#ECE5D8] selection:bg-[#E5252A] selection:text-white font-sans antialiased relative">
      {/* Fixed Static Background Wallpaper */}
      <div
        id="app-fixed-wallpaper"
        className="fixed inset-0 -z-10 pointer-events-none overflow-hidden select-none"
      >
        <img
          src="/vault-wallpaper.jpg"
          alt="Torque & Throttle Vault Static Wallpaper"
          className="w-full h-full object-cover object-center scale-100"
          referrerPolicy="no-referrer"
        />
        {/* Subtle Obsidian & Carbon Vignette Overlays for Crisp Text Contrast */}
        <div className="absolute inset-0 bg-[#0A0C10]/75 backdrop-blur-[0.5px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0C10]/90 via-[#0F1115]/60 to-[#0A0C10]/92"></div>
      </div>

       {/* Top Navbar */}
      <Navbar
        searchQuery={searchQuery}
        vehicles={availableVehicles}
        onSearchChange={(q) => {
          setSearchQuery(q);
        }}
        onNavigateSection={handleNavigateSection}
        activeSection={
          currentRoute.path === '/inventory'
            ? 'inventory'
            : currentRoute.path === '/vehicle'
            ? 'inventory'
            : activeSection
        }
        onOpenFinancing={() => setIsConciergeOpen(true)}
        onOpenConcierge={() => setIsConciergeOpen(true)}
        onOpenCustomRequest={() => setIsCustomRequestOpen(true)}
        filters={filters}
        onFilterChange={(updates) => setFilters((prev) => ({ ...prev, ...updates }))}
        onResetFilters={() => {
          setFilters({
            category: 'all',
            make: 'all',
            transmission: 'all',
            selectedVehicleId: 'all',
          });
          setQuickFilter('all');
          setSearchQuery('');
        }}
        categoryCounts={categoryCounts}
        filteredCount={filteredVehicles.length}
        totalCount={availableVehicles.length}
        onOpenSupabaseSettings={() => setIsSupabaseModalOpen(true)}
        onRefreshSupabase={async () => {
          const pulled = await refreshFromSupabase();
          if (pulled && pulled.length > 0) {
            setVehicles(sortVehiclesByYear(pulled));
          }
        }}
        onExportCSV={handleExportCSV}
      />

      <main className="relative">
        {currentRoute.path === '/vehicle' ? (
          /* Dedicated Vehicle Webpage */
          (() => {
            const activeVehicle = availableVehicles.find(
              (v) => v.id.toLowerCase() === (currentRoute.vehicleId || '').toLowerCase()
            );

            if (!activeVehicle) {
              return (
                <div className="max-w-4xl mx-auto px-4 py-24 text-center">
                  <div className="bg-[#171922] border border-white/[0.08] rounded-xl p-12 space-y-4">
                    <h2 className="text-2xl font-display font-bold text-[#ECE5D8]">
                      Vehicle Record Not Found
                    </h2>
                    <p className="text-sm text-[#94A3B8]">
                      The requested vehicle record "{currentRoute.vehicleId}" was not found or has been allocated.
                    </p>
                    <button
                      onClick={navigateToInventory}
                      className="bg-[#E5252A] hover:bg-[#c00017] text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded transition-all cursor-pointer"
                    >
                      Return to Vault Inventory
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <VehicleDetailPage
                vehicle={activeVehicle}
                allVehicles={availableVehicles}
                onBackToInventory={navigateToInventory}
                onScheduleTestDrive={handleScheduleTestDrive}
                onEnquireVehicle={handleOpenEnquiry}
                onNavigateToVehicle={navigateToVehicle}
              />
            );
          })()
        ) : currentRoute.path === '/inventory' ? (
          /* Dedicated Inventory Webpage */
          <InventoryPage
            vehicles={availableVehicles}
            totalCount={availableVehicles.length}
            filteredVehicles={filteredVehicles}
            filters={filters}
            onFilterChange={(updates) => setFilters((prev) => ({ ...prev, ...updates }))}
            onResetFilters={() => {
              setFilters({
                category: 'all',
                make: 'all',
                transmission: 'all',
                selectedVehicleId: 'all',
              });
              setQuickFilter('all');
              setSearchQuery('');
            }}
            categoryCounts={categoryCounts}
            quickFilter={quickFilter}
            onQuickFilterChange={setQuickFilter}
            onScheduleTestDrive={handleScheduleTestDrive}
            onViewVehicleDetail={(v) => navigateToVehicle(v.id)}
            onEnquireVehicle={handleOpenEnquiry}
            onOpenCustomRequest={() => setIsCustomRequestOpen(true)}
            onBackToHome={navigateToStore}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenSupabaseSettings={() => setIsSupabaseModalOpen(true)}
            onRefreshSupabase={async () => {
              const pulled = await refreshFromSupabase();
              if (pulled && pulled.length > 0) {
                setVehicles(sortVehiclesByYear(pulled));
              }
            }}
          />
        ) : (
          /* Home Page */
          <>
            {/* Hero Section */}
            <Hero
              onExploreVault={navigateToInventory}
              onScheduleTestDrive={() => handleNavigateSection('test-drive')}
              deliveredCount={soldVehiclesCount}
              vaultCount={availableVehicles.length}
            />

            {/* Curated Vault Teaser linking to Dedicated Inventory Webpage */}
            <HomeVaultTeaser
              onNavigateToInventory={navigateToInventory}
              totalVehiclesCount={availableVehicles.length}
              previewVehicles={availableVehicles}
              onViewVehicleDetail={(v) => navigateToVehicle(v.id)}
            />

            {/* Bespoke Vehicle Model Request Banner */}
            <CustomRequestBanner onOpenModal={() => setIsCustomRequestOpen(true)} />

            {/* Frictionless How It Works (3 Steps) */}
            <HowItWorks />

            {/* Private Test Drive & Inspection Booking Form */}
            <BookingForm preselectedVehicleId={bookingVehicleId} vehicles={availableVehicles} />

            {/* Trust Badges Bar */}
            <TrustBadges />
          </>
        )}
      </main>

      {/* Footer */}
      <Footer
        onNavigateSection={handleNavigateSection}
        onOpenConcierge={() => setIsConciergeOpen(true)}
      />

      {/* Modals */}
      <VehicleDetailModal
        vehicle={selectedDetailVehicle}
        onClose={() => setSelectedDetailVehicle(null)}
        onScheduleTestDrive={handleScheduleTestDrive}
        onEnquireVehicle={handleOpenEnquiry}
      />

      <VipConciergeModal
        isOpen={isConciergeOpen}
        onClose={() => setIsConciergeOpen(false)}
      />

      {/* Customer Vehicle Enquiry Modal */}
      <EnquiryModal
        vehicle={enquiryVehicle}
        isOpen={isEnquiryOpen}
        onClose={() => setIsEnquiryOpen(false)}
      />

      {/* Custom Vehicle Request Modal */}
      <CustomRequestModal
        isOpen={isCustomRequestOpen}
        onClose={() => setIsCustomRequestOpen(false)}
      />

      {/* Supabase Fleet & Storage Configuration Modal */}
      {isSupabaseModalOpen && (
        <SupabaseSettingsModal
          isOpen={isSupabaseModalOpen}
          onClose={() => setIsSupabaseModalOpen(false)}
          onConfigSaved={async () => {
            const pulled = await refreshFromSupabase();
            if (pulled && pulled.length > 0) {
              setVehicles(pulled);
            }
          }}
        />
      )}
    </div>
  );
}

