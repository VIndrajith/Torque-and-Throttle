import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  uploadString,
} from 'firebase/storage';
import { storage } from './firebase';
import firebaseConfig from './config.ts';
import { compressImageFileToBlob, compressImageFile, recompressDataUrl } from '../utils/imageCompressor';

export interface StorageUploadResult {
  url: string;
  path: string;
  size: number;
}

export const STORAGE_BUCKET_NAME = firebaseConfig.storageBucket || 'tnt-storage.firebasestorage.app';
export const STORAGE_PROJECT_ID = firebaseConfig.projectId || 'tnt-storage';
export const STORAGE_PATH_PREFIX = 'vehicles';

/**
 * Uploads a vehicle image directly to Firebase Cloud Storage under TnT-storage.
 * Uses maximum adaptive client-side compression (downscaled & compressed to ~35KB)
 * with an ultra-fast non-blocking timeout fallback so the UI never gets stuck in "uploading" state.
 */
export async function uploadVehicleImage(
  file: File | Blob,
  vehicleId: string,
  fileName?: string,
  onProgress?: (progressPercent: number) => void
): Promise<string> {
  // Step 1: Compress instantly
  let uploadBlob: Blob = file;
  let compressedDataUrlFallback = '';

  try {
    const compressed = await compressImageFileToBlob(file, 880, 660, 0.62, 35 * 1024);
    uploadBlob = compressed.blob;
    compressedDataUrlFallback = compressed.dataUrl;
  } catch (compressErr) {
    console.warn('Pre-upload image compression warning (proceeding with original):', compressErr);
  }

  if (onProgress) {
    onProgress(30);
  }

  const cleanVehicleId = (vehicleId || 'temp-vehicle').replace(/[^a-zA-Z0-9_-]/g, '_');
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  const sanitizedFileName = (fileName || `image_${timestamp}_${randomSuffix}.jpg`).replace(/[^a-zA-Z0-9._-]/g, '_');
  
  const storagePath = `vehicles/${cleanVehicleId}/${timestamp}_${sanitizedFileName}`;

  // Step 2: Attempt Firebase Storage upload with a strict 4.5-second timeout race
  try {
    const storageRef = ref(storage, storagePath);
    const metadata = {
      contentType: 'image/jpeg',
      customMetadata: {
        vehicleId: cleanVehicleId,
        uploadedAt: new Date().toISOString(),
        storageProject: STORAGE_BUCKET_NAME,
      },
    };

    const uploadPromise = (async () => {
      const snapshot = await uploadBytes(storageRef, uploadBlob, metadata);
      if (onProgress) onProgress(80);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      if (onProgress) onProgress(100);
      return downloadUrl;
    })();

    const timeoutPromise = new Promise<string>((resolve) => {
      setTimeout(() => {
        console.warn('Firebase Storage upload timed out after 4.5s; seamlessly using compressed fallback image');
        if (onProgress) onProgress(100);
        resolve(compressedDataUrlFallback || '');
      }, 4500);
    });

    const resultUrl = await Promise.race([uploadPromise, timeoutPromise]);
    if (resultUrl) {
      return resultUrl;
    }
    return compressedDataUrlFallback || '';
  } catch (storageErr) {
    console.warn('Firebase Storage direct upload notice (using compressed image fallback):', storageErr);
    if (onProgress) onProgress(100);
    if (compressedDataUrlFallback) {
      return compressedDataUrlFallback;
    }
    if (file instanceof File || file instanceof Blob) {
      return await compressImageFile(file, 840, 630, 0.60, 32 * 1024);
    }
    return '';
  }
}

/**
 * Uploads multiple images in parallel to TnT-storage with aggregate progress
 */
export async function uploadVehicleGallery(
  files: (File | Blob)[],
  vehicleId: string,
  onProgress?: (completed: number, total: number) => void
): Promise<string[]> {
  const urls: string[] = [];
  let completed = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const name = file instanceof File ? file.name : `gallery_${i + 1}.jpg`;
    try {
      const url = await uploadVehicleImage(file, vehicleId, name);
      if (url) {
        urls.push(url);
      }
    } catch (err) {
      console.warn(`Failed uploading photo ${i + 1} to TnT-storage:`, err);
    }
    completed++;
    if (onProgress) {
      onProgress(completed, files.length);
    }
  }

  return urls;
}

/**
 * Migrates base64 or raw data URLs to Cloud Storage under TnT-storage with maximum compression
 */
export async function migrateDataUrlToCloudStorage(
  dataUrl: string,
  vehicleId: string,
  index: number
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:')) {
    return dataUrl;
  }

  try {
    const compressedUrl = await recompressDataUrl(dataUrl, 840, 630, 0.60);
    const cleanId = (vehicleId || 'migrated-car').replace(/[^a-zA-Z0-9_-]/g, '_');
    const storagePath = `vehicles/${cleanId}/migrated_img_${index}_${Date.now()}.jpg`;
    const storageRef = ref(storage, storagePath);

    const snapshot = await uploadString(storageRef, compressedUrl, 'data_url', {
      contentType: 'image/jpeg',
      customMetadata: {
        source: 'migration',
        vehicleId: cleanId,
        project: STORAGE_BUCKET_NAME,
      },
    });

    return await getDownloadURL(snapshot.ref);
  } catch (err) {
    console.warn('Could not migrate data URL to Cloud Storage (keeping compressed data URL):', err);
    return dataUrl;
  }
}

/**
 * Deletes a file from Cloud Storage if it belongs to the bucket
 */
export async function deleteStoredFile(fileUrl: string): Promise<boolean> {
  if (!fileUrl || (!fileUrl.includes('firebasestorage.googleapis.com') && !fileUrl.includes('firebasestorage.app'))) {
    return false;
  }

  try {
    const storageRef = ref(storage, fileUrl);
    await deleteObject(storageRef);
    return true;
  } catch (err) {
    console.warn('Failed deleting stored file from TnT-storage:', err);
    return false;
  }
}

/**
 * Downloads an external image URL, aggressively compresses it, and uploads it directly
 * to Firebase Cloud Storage under tnt-storage
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  vehicleId: string,
  fileName?: string
): Promise<string> {
  if (imageUrl.includes('firebasestorage.googleapis.com') || imageUrl.includes('firebasestorage.app')) {
    return imageUrl;
  }

  const cleanVehicleId = (vehicleId || 'vehicle').replace(/[^a-zA-Z0-9_-]/g, '_');
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  const targetName = fileName || `migrated_${timestamp}_${randomSuffix}.jpg`;
  const storagePath = `vehicles/${cleanVehicleId}/${targetName}`;
  const storageRef = ref(storage, storagePath);

  let rawBlob: Blob;
  try {
    const res = await fetch(imageUrl, { mode: 'cors' });
    if (!res.ok) throw new Error(`Fetch failed: ${res.statusText}`);
    rawBlob = await res.blob();
  } catch {
    try {
      const proxyRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`);
      if (!proxyRes.ok) throw new Error(`Proxy fetch failed: ${proxyRes.statusText}`);
      rawBlob = await proxyRes.blob();
    } catch (proxyErr) {
      console.warn(`Could not download image ${imageUrl} for Cloud Storage upload:`, proxyErr);
      return imageUrl;
    }
  }

  let uploadBlob = rawBlob;
  try {
    const compressed = await compressImageFileToBlob(rawBlob, 880, 660, 0.62, 35 * 1024);
    uploadBlob = compressed.blob;
  } catch (compressErr) {
    console.warn('Blob compression error during URL migration (using raw blob):', compressErr);
  }

  try {
    const metadata = {
      contentType: 'image/jpeg',
      customMetadata: {
        vehicleId: cleanVehicleId,
        source: 'catalog_migration',
        migratedAt: new Date().toISOString(),
        storageProject: STORAGE_BUCKET_NAME,
      },
    };

    const snapshot = await uploadBytes(storageRef, uploadBlob, metadata);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (uploadErr) {
    console.warn('Failed uploading image blob to Firebase Storage:', uploadErr);
    return imageUrl;
  }
}
