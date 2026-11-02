/**
 * Vehicle Service Layer
 * Unified vehicle database and storage powered by Supabase (PostgreSQL + Storage Bucket)
 * Replaces Google Firestore for vehicle datasets and media storage.
 */
export * from '../supabase/supabaseVehicleService';
export {
  getStoredVehicles,
  subscribeToVehicles,
  updateVehicleRecord,
  updateVehicleRecordAsync,
  deleteVehicleRecord,
  batchDeleteVehicleRecords,
  batchUpdateVehicleStatus,
  clearAllVehiclesFromDatabase,
  resetVehicleDatabase,
  toggleVehicleSoldStatus,
  generateDynoTelemetry,
  generateInspectionSummary,
  generateCarfaxReport,
  seedSupabaseWithVehicles,
  migrateAllImagesToSupabase,
  enrichVehiclesWithMetadata,
  refreshFromSupabase,
} from '../supabase/supabaseVehicleService';

import {
  migrateAllImagesToSupabase,
  getStoredVehicles,
} from '../supabase/supabaseVehicleService';
import { Vehicle } from '../types';

// Backward compatible alias
export async function migrateStorageContentsToTnT(
  onProgress?: (progress: { current: number; total: number; carName: string; percent: number }) => void
) {
  return migrateAllImagesToSupabase(onProgress);
}

export function saveStoredVehicles(list: Vehicle[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tt_admin_vehicle_registry_v1', JSON.stringify(list));
  }
}
