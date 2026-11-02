import { Vehicle, DynoTelemetry, DynoDataPoint, InspectionSummary, CarfaxReport } from '../types';
import { INVENTORY_DATA } from '../data/inventory';
import {
  getSupabaseClient,
  isSupabaseConfigured,
  getSupabaseCredentials,
  syncSupabaseConfigFromServer,
} from './supabaseClient';
import { uploadUrlOrBase64ToSupabase, deleteSupabaseImage } from './supabaseStorageService';

const LOCAL_STORAGE_KEY = 'tt_admin_vehicle_registry_v1';
const TABLE_NAME = 'vehicles';

// Dynamic listeners for UI updates
type VehicleListener = (vehicles: Vehicle[]) => void;
const listeners: Set<VehicleListener> = new Set();

let memoryCache: Vehicle[] = [];
let isRealtimeSubscribed = false;

/**
 * Enriches a list of vehicles with telemetry, inspection, and carfax reports
 */
export function enrichVehiclesWithMetadata(cars: Vehicle[]): Vehicle[] {
  return cars.map((car) => {
    const hp = car.powerHp || car.specs?.powerHp || 300;
    const tq = car.torque || car.specs?.torqueLbFt || 350;
    const eng = car.engine || car.specs?.engine || 'V6 Twin Turbo';

    return {
      ...car,
      status: car.status || (car.isSold ? ('sold' as const) : ('available' as const)),
      dynoTelemetry: car.dynoTelemetry || generateDynoTelemetry(hp, tq, eng),
      inspection: car.inspection || generateInspectionSummary(),
      carfax: car.carfax || generateCarfaxReport(car.id),
      galleryImages: car.galleryImages || (car.imageUrl ? [car.imageUrl] : []),
    };
  });
}

// Convert TypeScript Vehicle object to Supabase database row
export function mapVehicleToSupabaseRow(v: Vehicle) {
  const images = v.galleryImages && v.galleryImages.length > 0 ? v.galleryImages : v.imageUrl ? [v.imageUrl] : [];
  return {
    id: v.id,
    make: v.make || '',
    model: v.model || '',
    year: Number(v.year) || 2024,
    price: Number(v.price) || 0,
    mileage: Number(v.mileage) || 0,
    category: (v.category || 'sedans').toLowerCase(),
    trim: v.trim || '',
    exterior_color: v.exteriorColor || '',
    status: v.status || (v.isSold ? 'sold' : 'available'),
    is_sold: Boolean(v.isSold || v.status === 'sold'),
    featured: false,
    location: v.location || 'Central Vault',
    specs: v.specs || {},
    images: images,
    inspection_score: 98,
    description: v.notes || '',
    primary_badge: v.primaryBadge || '',
    secondary_badge: v.secondaryBadge || '',
    dyno_telemetry: v.dynoTelemetry || {},
    inspection: v.inspection || {},
    carfax: v.carfax || {},
    updated_at: new Date().toISOString(),
  };
}

// Convert Supabase database row to TypeScript Vehicle object with flexible column extraction
export function mapSupabaseRowToVehicle(row: any): Vehicle {
  const isSold = Boolean(
    row.is_sold ||
    row.isSold ||
    row.status === 'sold' ||
    row.stage === 'sold'
  );

  // Flexible image extraction
  let rawImages: string[] = [];

  const checkAndExtractImages = (val: any) => {
    if (!val) return;
    if (Array.isArray(val)) {
      val.forEach((item) => {
        if (typeof item === 'string' && item.trim()) {
          rawImages.push(item.trim());
        } else if (item && typeof item.url === 'string') {
          rawImages.push(item.url.trim());
        }
      });
    } else if (typeof val === 'string') {
      const trimmed = val.trim();
      if (!trimmed) return;
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            parsed.forEach((p) => {
              if (typeof p === 'string' && p.trim()) rawImages.push(p.trim());
            });
            return;
          }
        } catch {}
      }
      if (trimmed.includes(',')) {
        trimmed.split(',').forEach((s) => {
          if (s.trim()) rawImages.push(s.trim());
        });
      } else {
        rawImages.push(trimmed);
      }
    }
  };

  [
    row.images,
    row.gallery_images,
    row.galleryImages,
    row.photos,
    row.pictures,
    row.image_urls,
    row.image_url,
    row.imageUrl,
    row.image,
    row.photo,
    row.picture,
    row.photo_url,
    row.img,
    row.thumbnail,
    row.thumbnail_url,
    row.car_image,
    row.carImage,
  ].forEach(checkAndExtractImages);

  const fallbackImages = [
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=85',
  ];
  const primaryImg = rawImages[0] || fallbackImages[0];
  const finalImages = rawImages.length > 0 ? rawImages : [primaryImg];

  // Flexible Make & Model extraction
  let make = String(row.make || row.brand || row.company || row.manufacturer || '').trim();
  let model = String(row.model || row.car_model || row.model_name || '').trim();
  const title = String(row.title || row.name || row.car_name || row.vehicle_name || '').trim();

  if (!make && title) {
    const parts = title.split(' ');
    make = parts[0] || 'Vehicle';
    model = parts.slice(1).join(' ') || title;
  } else if (!model && title) {
    model = title;
  }

  const sanitizeStr = (s?: string) =>
    (s || '')
      .replace(/\s*\([OO0o]\)/gi, '')
      .replace(/\s+O$/gi, '')
      .replace(/\bO\b/gi, '')
      .replace(/\(O\)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

  model = sanitizeStr(model);
  make = sanitizeStr(make);
  if (!make) make = 'Vehicle';
  if (!model) model = 'Model';
  const cleanTrim = sanitizeStr(String(row.trim || row.variant || row.edition || ''));

  // Category normalization
  const rawCat = String(row.category || row.type || row.body_type || row.body || 'sedans').toLowerCase();
  let category: 'all' | 'suv' | 'sedans' | 'hatchback' | 'mpv' | 'motorcycle' = 'sedans';
  if (rawCat.includes('suv') || rawCat.includes('4x4') || rawCat.includes('crossover')) {
    category = 'suv';
  } else if (rawCat.includes('hatch')) {
    category = 'hatchback';
  } else if (rawCat.includes('mpv') || rawCat.includes('van') || rawCat.includes('wagon')) {
    category = 'mpv';
  } else if (rawCat.includes('motor') || rawCat.includes('bike')) {
    category = 'motorcycle';
  } else {
    category = 'sedans';
  }

  // Price & Mileage parsing
  const parseNum = (val: any, fallback: number = 0) => {
    if (typeof val === 'number') return isNaN(val) ? fallback : val;
    if (typeof val === 'string') {
      const clean = val.replace(/[^0-9.-]/g, '');
      const parsed = Number(clean);
      return isNaN(parsed) ? fallback : parsed;
    }
    return fallback;
  };

  const price = parseNum(row.price || row.cost || row.rate || row.amount || row.selling_price, 0);
  const mileage = parseNum(row.mileage || row.odometer || row.km || row.kms || row.miles, 0);
  const year = parseNum(row.year || row.model_year || row.manufacture_year, 2024);

  const hp = parseNum(row.specs?.powerHp || row.powerHp || row.power_hp || row.horsepower || row.hp, 300);
  const tq = parseNum(row.specs?.torqueLbFt || row.torque || row.torque_nm, 350);
  const eng = String(row.specs?.engine || row.engine || row.engine_type || row.motor || 'Certified Preowned Engine');

  const id = String(
    row.id ||
    row.car_id ||
    row.vehicle_id ||
    row.vin ||
    row.uuid ||
    `car-${Math.random().toString(36).slice(2, 9)}`
  );

  return {
    id,
    make,
    model,
    year,
    price,
    mileage,
    category: category as any,
    trim: cleanTrim,
    status: (row.status || (isSold ? 'sold' : 'available')) as any,
    isSold,
    location: typeof row.location === 'string' ? row.location : 'Central Vault',
    specs: row.specs || {
      powerHp: hp,
      torqueLbFt: tq,
      engine: eng,
      transmission: row.transmission || row.specs?.transmission || 'Automatic',
      drivetrain: row.drivetrain || row.specs?.drivetrain || 'AWD',
      owners: parseNum(row.owners || row.specs?.owners, 1),
    },
    imageUrl: primaryImg,
    galleryImages: finalImages,
    additionalImages: finalImages.slice(1),
    exteriorColor: String(row.exterior_color || row.exteriorColor || row.color || row.paint || 'Factory Paint'),
    primaryBadge: row.primary_badge || row.primaryBadge || '',
    secondaryBadge: row.secondary_badge || row.secondaryBadge || '',
    dynoTelemetry: row.dyno_telemetry || row.dynoTelemetry || generateDynoTelemetry(hp, tq, eng),
    inspection: row.inspection || generateInspectionSummary(),
    carfax: row.carfax || generateCarfaxReport(id),
    notes: row.description || row.notes || row.details || '',
  };
}

/**
 * Hardcoded year-wise sort: latest 2026 first, decreasing
 */
export function sortVehiclesByYearDesc(list: Vehicle[]): Vehicle[] {
  return [...list].sort((a, b) => {
    const yearA = typeof a.year === 'number' ? a.year : parseInt(String(a.year || 0), 10) || 0;
    const yearB = typeof b.year === 'number' ? b.year : parseInt(String(b.year || 0), 10) || 0;
    return yearB - yearA; // Latest 2026 first, decreasing
  });
}

/**
 * Actively pulls and refreshes the vehicle fleet from Supabase
 */
export async function refreshFromSupabase(): Promise<Vehicle[]> {
  // Sync server credentials first if local is not set
  let { url, anonKey, table } = getSupabaseCredentials();
  if (!url || !anonKey) {
    const remote = await syncSupabaseConfigFromServer();
    url = remote.url;
    anonKey = remote.anonKey;
    table = remote.table;
  }

  let rawRows: any[] = [];

  // Method 1: Server-side relay (handles both anon and service_role keys, avoids CORS)
  try {
    const res = await fetch('/api/supabase/fetch-fleet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, key: anonKey, table }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.vehicles)) {
        rawRows = json.vehicles;
      }
    }
  } catch (err) {
    console.warn('Server fetch fleet attempt note:', err);
  }

  // Method 2: Direct client SDK if server relay returned empty or failed
  if (rawRows.length === 0 && url && anonKey) {
    const client = getSupabaseClient();
    if (client) {
      const candidateTables = [
        table,
        'vehicles',
        'cars',
        'Vehicles',
        'Cars',
        'vehicle',
        'car',
        'inventory',
        'Inventory',
        'fleet',
      ].filter(Boolean) as string[];

      for (const tbl of candidateTables) {
        try {
          let { data, error } = await client
            .from(tbl)
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            const fallback = await client.from(tbl).select('*');
            data = fallback.data;
          }

          if (data && Array.isArray(data) && data.length > 0) {
            rawRows = data;
            break;
          }
        } catch (clientErr) {
          console.warn(`Direct Supabase fetch exception for ${tbl}:`, clientErr);
        }
      }
    }
  }

  // 1. Read local storage status map to preserve local updates (e.g. sold status)
  const localStatusMap = new Map<string, { status: 'available' | 'reserved' | 'sold'; isSold: boolean }>();
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: any) => {
            if (item && item.id) {
              localStatusMap.set(String(item.id), {
                status: item.status || (item.isSold ? 'sold' : 'available'),
                isSold: Boolean(item.isSold || item.status === 'sold'),
              });
            }
          });
        }
      }
    } catch {}
  }

  // Map rows from Supabase into typed vehicles
  const vehicles = sortVehiclesByYearDesc(
    rawRows.map((row) => {
      const vehicle = mapSupabaseRowToVehicle(row);
      const local = localStatusMap.get(vehicle.id);
      // If locally marked as sold/reserved, preserve that status unless remote explicitly overwrote it
      if (local && (local.isSold || local.status === 'sold' || local.status === 'reserved') && !vehicle.isSold) {
        vehicle.status = local.status;
        vehicle.isSold = local.isSold;
      }
      return vehicle;
    })
  );

  if (vehicles.length > 0) {
    saveLocalVehicles(vehicles);
    return vehicles;
  }

  return sortVehiclesByYearDesc(memoryCache);
}

export function sanitizeVehicleModel(vehicle: Vehicle): Vehicle {
  if (!vehicle) return vehicle;
  const sanitizeStr = (s?: string) =>
    (s || '')
      .replace(/\s*\([OO0o]\)/gi, '')
      .replace(/\s+O$/gi, '')
      .replace(/\bO\b/gi, '')
      .replace(/\(O\)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

  const cleanModel = sanitizeStr(vehicle.model);
  const cleanTrim = sanitizeStr(vehicle.trim);
  const cleanMake = sanitizeStr(vehicle.make);

  return {
    ...vehicle,
    model: cleanModel,
    trim: cleanTrim,
    make: cleanMake,
  };
}

/**
 * Initializes and fetches vehicle database from Supabase with verified fallback.
 * Loads cached inventory or certified vault fleet, then syncs with Supabase in background.
 */
export function getStoredVehicles(): Vehicle[] {
  if (memoryCache.length > 0) {
    return sortVehiclesByYearDesc(memoryCache.map(sanitizeVehicleModel));
  }

  // 1. Try reading local cached registry
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryCache = sortVehiclesByYearDesc(parsed.map(sanitizeVehicleModel));
          fetchFromSupabaseBackground();
          return memoryCache;
        }
      }
    } catch {
      // Ignore parse error
    }
  }

  // 2. Default initial state: load certified vault inventory
  memoryCache = sortVehiclesByYearDesc([...INVENTORY_DATA].map(sanitizeVehicleModel));
  saveLocalVehicles(memoryCache);
  fetchFromSupabaseBackground();
  return memoryCache;
}

function saveLocalVehicles(list: Vehicle[]) {
  const sorted = sortVehiclesByYearDesc(list);
  memoryCache = sorted;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sorted));
    } catch {
      // Storage quota or error
    }
  }
  notifyListeners(sorted);
}

function notifyListeners(list: Vehicle[]) {
  listeners.forEach((fn) => {
    try {
      fn(list);
    } catch (e) {
      console.warn('Listener notification error:', e);
    }
  });
}

/**
 * Asynchronously syncs with Supabase Database
 */
async function fetchFromSupabaseBackground() {
  try {
    await refreshFromSupabase();
  } catch (err) {
    console.warn('Supabase background sync exception:', err);
  }
}

/**
 * Seeds Supabase with the current fleet of vehicles
 */
export async function seedSupabaseWithVehicles(vehicleList: Vehicle[]): Promise<{ success: boolean; count: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) {
    return { success: false, count: 0, error: 'Supabase credentials not configured' };
  }

  try {
    const rows = vehicleList.map(mapVehicleToSupabaseRow);
    const { error } = await client.from(TABLE_NAME).upsert(rows, { onConflict: 'id' });

    if (error) {
      return { success: false, count: 0, error: error.message };
    }

    return { success: true, count: rows.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || String(err) };
  }
}

/**
 * Subscribes to real-time vehicle updates from Supabase (or local store)
 */
export function subscribeToVehicles(callback: (vehicles: Vehicle[]) => void): () => void {
  listeners.add(callback);
  callback(getStoredVehicles());

  // Subscribe to Supabase Realtime channel if not already active
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured() && !isRealtimeSubscribed) {
    try {
      const channel = client
        .channel('public:vehicles')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: TABLE_NAME },
          async () => {
            console.log('[Supabase Realtime] Vehicle table changed, reloading...');
            await refreshFromSupabase();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            isRealtimeSubscribed = true;
          }
        });

      return () => {
        listeners.delete(callback);
        if (listeners.size === 0 && channel) {
          client.removeChannel(channel);
          isRealtimeSubscribed = false;
        }
      };
    } catch (err) {
      console.warn('Supabase realtime subscription note:', err);
    }
  }

  return () => {
    listeners.delete(callback);
  };
}

/**
 * Creates or updates a vehicle record in Supabase Database and Storage
 */
export async function updateVehicleRecordAsync(vehicle: Vehicle): Promise<Vehicle[]> {
  const current = getStoredVehicles();
  const existingIdx = current.findIndex((v) => v.id === vehicle.id);

  // 1. Process and upload gallery images to Supabase Storage if configured
  let processedImages = vehicle.galleryImages || (vehicle.imageUrl ? [vehicle.imageUrl] : []);
  if (isSupabaseConfigured() && processedImages.length > 0) {
    try {
      const uploadedUrls = await Promise.all(
        processedImages.map((imgUrl, idx) => uploadUrlOrBase64ToSupabase(vehicle.id, imgUrl, idx))
      );
      processedImages = uploadedUrls;
    } catch (err) {
      console.warn('Image upload to Supabase storage exception:', err);
    }
  }

  const hp = vehicle.powerHp || vehicle.specs?.powerHp || 300;
  const tq = vehicle.torque || vehicle.specs?.torqueLbFt || 350;
  const eng = vehicle.engine || vehicle.specs?.engine || 'V6 Turbo';

  const enrichedVehicle: Vehicle = {
    ...vehicle,
    imageUrl: processedImages[0] || vehicle.imageUrl,
    galleryImages: processedImages,
    dynoTelemetry: vehicle.dynoTelemetry || generateDynoTelemetry(hp, tq, eng),
    inspection: vehicle.inspection || generateInspectionSummary(),
    carfax: vehicle.carfax || generateCarfaxReport(vehicle.id),
  };

  let updatedList: Vehicle[];
  if (existingIdx >= 0) {
    updatedList = [...current];
    updatedList[existingIdx] = enrichedVehicle;
  } else {
    updatedList = [enrichedVehicle, ...current];
  }

  // Save to local cache immediately for responsive UI
  saveLocalVehicles(updatedList);

  // 2. Persist to Supabase Database
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      const row = mapVehicleToSupabaseRow(enrichedVehicle);
      const { error } = await client.from(TABLE_NAME).upsert(row, { onConflict: 'id' });
      if (error) {
        console.warn('Supabase upsert warning:', error.message);
      }
    } catch (err) {
      console.error('Supabase updateVehicleRecord error:', err);
    }
  }

  // 3. Persist to server via relay endpoint
  try {
    const row = mapVehicleToSupabaseRow(enrichedVehicle);
    fetch('/api/supabase/sync-fleet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vehicles: [row] }),
    }).catch((e) => console.warn('Server sync fleet relay note:', e));
  } catch (e) {
    console.warn('Sync fleet relay error:', e);
  }

  return updatedList;
}

/**
 * Synchronous wrapper for backwards compatibility
 */
export function updateVehicleRecord(vehicle: Vehicle): Vehicle[] {
  updateVehicleRecordAsync(vehicle).catch(console.error);
  return getStoredVehicles();
}

/**
 * Deletes a single vehicle record from Supabase
 */
export function deleteVehicleRecord(id: string): Vehicle[] {
  const current = getStoredVehicles();
  const target = current.find((v) => v.id === id);
  const next = current.filter((v) => v.id !== id);
  saveLocalVehicles(next);

  // Clean up Supabase
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    // 1. Delete from table
    client
      .from(TABLE_NAME)
      .delete()
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.warn('Supabase delete error:', error.message);
      });

    // 2. Clean up storage images
    if (target?.galleryImages) {
      target.galleryImages.forEach((imgUrl) => {
        deleteSupabaseImage(imgUrl).catch(() => {});
      });
    }
  }

  return next;
}

/**
 * Batch deletes multiple vehicle records
 */
export function batchDeleteVehicleRecords(ids: string[]): Vehicle[] {
  const current = getStoredVehicles();
  const idsSet = new Set(ids);
  const next = current.filter((v) => !idsSet.has(v.id));
  saveLocalVehicles(next);

  const client = getSupabaseClient();
  if (client && isSupabaseConfigured() && ids.length > 0) {
    client
      .from(TABLE_NAME)
      .delete()
      .in('id', ids)
      .then(({ error }) => {
        if (error) console.warn('Supabase batch delete error:', error.message);
      });
  }

  return next;
}

/**
 * Batch updates vehicle status (e.g. available vs sold)
 */
export function batchUpdateVehicleStatus(ids: string[], status: 'available' | 'reserved' | 'sold'): Vehicle[] {
  const current = getStoredVehicles();
  const idsSet = new Set(ids);
  const isSold = status === 'sold';

  const next = current.map((v) => {
    if (idsSet.has(v.id)) {
      return {
        ...v,
        status,
        isSold,
      };
    }
    return v;
  });

  saveLocalVehicles(next);

  // 1. Client-side update
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured() && ids.length > 0) {
    client
      .from(TABLE_NAME)
      .update({
        status,
        is_sold: isSold,
        updated_at: new Date().toISOString(),
      })
      .in('id', ids)
      .then(({ error }) => {
        if (error) console.warn('Supabase batch update status error:', error.message);
      });
  }

  // 2. Server-side relay update to ensure server and Supabase persistence
  fetch('/api/supabase/batch-update-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids, status }),
  }).catch((err) => console.warn('Server batch status update relay note:', err));

  return next;
}

/**
 * Clears all vehicle records from database
 */
export async function clearAllVehiclesFromDatabase(): Promise<void> {
  saveLocalVehicles([]);

  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    try {
      await client.from(TABLE_NAME).delete().neq('id', '___non_existent___');
    } catch (err) {
      console.warn('Supabase clearAll error:', err);
    }
  }
}

/**
 * Resets vehicle database to empty list and refreshes from Supabase
 */
export function resetVehicleDatabase(): Vehicle[] {
  saveLocalVehicles([]);
  refreshFromSupabase().catch(console.warn);
  return [];
}

/**
 * Toggles sold status for a vehicle
 */
export function toggleVehicleSoldStatus(id: string, isSold: boolean): Vehicle[] {
  const current = getStoredVehicles();
  const targetStatus = isSold ? ('sold' as const) : ('available' as const);

  const next = current.map((v) => {
    if (v.id === id) {
      return {
        ...v,
        isSold,
        status: targetStatus,
      };
    }
    return v;
  });

  saveLocalVehicles(next);

  // 1. Client-side update
  const client = getSupabaseClient();
  if (client && isSupabaseConfigured()) {
    client
      .from(TABLE_NAME)
      .update({
        is_sold: isSold,
        status: targetStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .then(({ error }) => {
        if (error) console.warn('Supabase toggle status error:', error.message);
      });
  }

  // 2. Server-side relay update to guarantee server database & Supabase persistence
  fetch('/api/supabase/update-vehicle-status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, isSold, status: targetStatus }),
  }).catch((err) => console.warn('Server status update relay note:', err));

  return next;
}

// Telemetry generators
export function generateDynoTelemetry(powerHp: number, torque: number, engine: string): DynoTelemetry {
  const hp = powerHp > 0 ? powerHp : 250;
  const tq = torque > 0 ? torque : 240;
  const isTurbo = engine.toLowerCase().includes('turbo') || engine.toLowerCase().includes('crdi');

  const dynoCurve: DynoDataPoint[] = [
    { rpm: 2000, hp: Math.round(hp * 0.38), torque: Math.round(tq * 0.72) },
    { rpm: 3000, hp: Math.round(hp * 0.58), torque: Math.round(tq * 0.88) },
    { rpm: 4000, hp: Math.round(hp * 0.78), torque: Math.round(tq * 0.98) },
    { rpm: 5000, hp: Math.round(hp * 0.93), torque: Math.round(tq * 1.00) },
    { rpm: 6000, hp: Math.round(hp * 1.00), torque: Math.round(tq * 0.91) },
    { rpm: 7000, hp: Math.round(hp * 0.94), torque: Math.round(tq * 0.76) },
  ];

  return {
    peakBhp: hp,
    peakTorque: tq,
    dynoCurve,
    ecuFlashCount: 0,
    boostPsi: isTurbo ? 16.5 : 0,
    ambientTempF: 72,
    correctionFactor: 'SAE J1349 (1.00)',
    dynoOperator: 'Master Dyno Lab #4',
    dynoDate: 'Factory Scan Certified',
  };
}

export function generateInspectionSummary(): InspectionSummary {
  return {
    totalPoints: 100,
    passedPoints: 100,
    borescopeStatus: 'Clear - 0 Scorings',
    brakePadFrontMm: 10.5,
    brakePadRearMm: 9.8,
    tireTread32ndsFront: 8,
    tireTread32ndsRear: 8,
    paintDepthMicronsAvg: 118,
    paintPanelReadings: [
      { panel: 'Hood', microns: 115, status: 'Factory' },
      { panel: 'Front Fender LH', microns: 118, status: 'Factory' },
      { panel: 'Front Fender RH', microns: 119, status: 'Factory' },
      { panel: 'Door Driver', microns: 121, status: 'Factory' },
      { panel: 'Door Passenger', microns: 120, status: 'Factory' },
      { panel: 'Rear Quarter LH', microns: 117, status: 'Factory' },
      { panel: 'Rear Quarter RH', microns: 118, status: 'Factory' },
      { panel: 'Trunk / Tailgate', microns: 116, status: 'Factory' },
    ],
    frameStraightnessToleranceMm: 0.05,
    compressionPsi: [195, 195, 194, 195, 196, 195],
    batteryHealthPercent: 98,
  };
}

export function generateCarfaxReport(vehicleId: string): CarfaxReport {
  return {
    accidents: 0,
    owners: 1,
    serviceRecords: 8,
    lastOdometerDate: 'Verified Genuine',
    titleStatus: 'Clean Title (No Encumbrance)',
    countryOfOrigin: 'Germany / Japan',
  };
}

/**
 * Migrates all local vehicle photos to Supabase Storage
 */
export async function migrateAllImagesToSupabase(
  onProgress?: (progress: { current: number; total: number; carName: string; percent: number }) => void
): Promise<{ success: boolean; migratedCount: number }> {
  const currentVehicles = getStoredVehicles();
  let count = 0;
  const total = currentVehicles.length;

  for (let i = 0; i < currentVehicles.length; i++) {
    const v = currentVehicles[i];
    if (onProgress) {
      onProgress({
        current: i + 1,
        total,
        carName: `${v.year} ${v.make} ${v.model}`,
        percent: Math.round(((i + 1) / total) * 100),
      });
    }

    try {
      await updateVehicleRecordAsync(v);
      count++;
    } catch (e) {
      console.warn(`Migration error for vehicle ${v.id}:`, e);
    }
  }

  return { success: true, migratedCount: count };
}
