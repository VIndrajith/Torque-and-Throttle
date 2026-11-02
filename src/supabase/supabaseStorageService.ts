import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

const BUCKET_NAME = 'vehicles';

/**
 * Uploads a local File or Blob directly to Supabase Storage bucket 'vehicles'
 */
export async function uploadFileToSupabase(
  vehicleId: string,
  file: File | Blob,
  fileName?: string
): Promise<{ success: boolean; url: string; path?: string; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, url: '', error: 'Supabase is not configured' };
  }

  try {
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const uniqueName = fileName || `img_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filePath = `${vehicleId}/${uniqueName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await client.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '31536000',
        upsert: true,
        contentType: file.type || 'image/jpeg',
      });

    if (uploadError) {
      console.warn('Supabase image upload warning:', uploadError.message);
      return { success: false, url: '', error: uploadError.message };
    }

    // Get public URL
    const { data } = client.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    return { success: true, url: data.publicUrl, path: filePath };
  } catch (err: any) {
    console.error('Supabase upload exception:', err);
    return { success: false, url: '', error: err?.message || String(err) };
  }
}

/**
 * Converts a base64 data URL or external image URL and uploads it to Supabase Storage
 */
export async function uploadUrlOrBase64ToSupabase(
  vehicleId: string,
  imageUrl: string,
  index: number = 0
): Promise<string> {
  const client = getSupabaseClient();
  if (!client || !isSupabaseConfigured()) {
    return imageUrl; // Fallback to original URL if Supabase is not ready
  }

  // If already a Supabase Storage URL, keep it
  if (imageUrl.includes('/storage/v1/object/public/vehicles/')) {
    return imageUrl;
  }

  try {
    let blob: Blob;

    if (imageUrl.startsWith('data:image/')) {
      // Base64 data URL
      const response = await fetch(imageUrl);
      blob = await response.blob();
    } else {
      // External URL - fetch with CORS or proxy fallback
      try {
        const res = await fetch(imageUrl, { mode: 'cors' });
        blob = await res.blob();
      } catch {
        const proxyRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(imageUrl)}`);
        blob = await proxyRes.blob();
      }
    }

    const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
    const filePath = `${vehicleId}/gallery_${index}_${Date.now()}.${ext}`;

    const { error } = await client.storage
      .from(BUCKET_NAME)
      .upload(filePath, blob, {
        cacheControl: '31536000',
        upsert: true,
        contentType: blob.type || 'image/jpeg',
      });

    if (error) {
      console.warn(`Supabase Storage upload note for vehicle ${vehicleId}:`, error.message);
      return imageUrl;
    }

    const { data } = client.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.warn(`Supabase upload fallback for ${vehicleId}:`, err);
    return imageUrl;
  }
}

/**
 * Deletes an image file from Supabase Storage given its URL
 */
export async function deleteSupabaseImage(imageUrl: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client || !imageUrl) return false;

  try {
    const marker = `/storage/v1/object/public/${BUCKET_NAME}/`;
    if (!imageUrl.includes(marker)) return false;

    const path = imageUrl.split(marker)[1];
    if (!path) return false;

    const { error } = await client.storage.from(BUCKET_NAME).remove([path]);
    return !error;
  } catch (err) {
    console.warn('Supabase image delete warning:', err);
    return false;
  }
}
