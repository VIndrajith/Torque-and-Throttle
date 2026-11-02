import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'tt_supabase_project_url';
const STORAGE_KEY_ANON_KEY = 'tt_supabase_anon_key';
const STORAGE_KEY_TABLE = 'tt_supabase_table_name';
const BUCKET_NAME = 'vehicles';

let cachedClient: SupabaseClient | null = null;
let currentUrl: string = '';
let currentKey: string = '';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  table: string;
  isConfigured: boolean;
  source: 'env' | 'storage' | 'server' | 'none';
}

// In-memory cache for credentials retrieved from server
let serverConfigCache: { url: string; anonKey: string; table: string } | null = null;

/**
 * Checks if a JWT string is a Supabase service_role secret key
 */
export function isServiceRoleKey(key: string): boolean {
  if (!key) return false;
  try {
    const parts = key.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      return payload.role === 'service_role';
    }
  } catch {
    // Ignore base64 decode errors
  }
  return false;
}

/**
 * Synchronizes Supabase credentials from the server configuration
 */
export async function syncSupabaseConfigFromServer(): Promise<{ url: string; anonKey: string; table: string; isConfigured: boolean }> {
  try {
    const res = await fetch('/api/supabase/config');
    if (res.ok) {
      const json = await res.json();
      if (json && json.url) {
        serverConfigCache = {
          url: (json.url || '').trim(),
          anonKey: (json.key || '').trim(),
          table: (json.table || 'vehicles').trim(),
        };

        // Cache locally if not yet present in browser storage
        if (typeof window !== 'undefined' && serverConfigCache.url && serverConfigCache.anonKey) {
          if (!localStorage.getItem(STORAGE_KEY_URL)) {
            localStorage.setItem(STORAGE_KEY_URL, serverConfigCache.url);
          }
          if (!localStorage.getItem(STORAGE_KEY_ANON_KEY)) {
            localStorage.setItem(STORAGE_KEY_ANON_KEY, serverConfigCache.anonKey);
          }
          if (!localStorage.getItem(STORAGE_KEY_TABLE) && serverConfigCache.table) {
            localStorage.setItem(STORAGE_KEY_TABLE, serverConfigCache.table);
          }
        }

        return {
          ...serverConfigCache,
          isConfigured: Boolean(serverConfigCache.url && serverConfigCache.anonKey),
        };
      }
    }
  } catch (err) {
    console.warn('Could not sync Supabase config from server:', err);
  }

  const creds = getSupabaseCredentials();
  return {
    url: creds.url,
    anonKey: creds.anonKey,
    table: creds.table,
    isConfigured: Boolean(creds.url && creds.anonKey),
  };
}

export function cleanSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  return rawUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

/**
 * Retrieves currently active Supabase URL, Key & Table from localStorage, server cache, or environment variables
 */
export function getSupabaseCredentials(): { url: string; anonKey: string; table: string; source: 'env' | 'storage' | 'server' | 'none' } {
  // 1. Check localStorage first (user-configured in admin UI)
  if (typeof window !== 'undefined') {
    const storedUrl = localStorage.getItem(STORAGE_KEY_URL)?.trim();
    const storedKey = localStorage.getItem(STORAGE_KEY_ANON_KEY)?.trim();
    const storedTable = localStorage.getItem(STORAGE_KEY_TABLE)?.trim() || 'vehicles';
    if (storedUrl && storedKey) {
      return { url: cleanSupabaseUrl(storedUrl), anonKey: storedKey, table: storedTable, source: 'storage' };
    }
  }

  // 2. Check server-loaded credentials
  if (serverConfigCache && serverConfigCache.url && serverConfigCache.anonKey) {
    return {
      url: cleanSupabaseUrl(serverConfigCache.url),
      anonKey: serverConfigCache.anonKey,
      table: serverConfigCache.table || 'vehicles',
      source: 'server',
    };
  }

  // 3. Check environment variables
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL?.trim() || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY?.trim() || '';
  if (envUrl && envKey) {
    return { url: cleanSupabaseUrl(envUrl), anonKey: envKey, table: 'vehicles', source: 'env' };
  }

  return { url: '', anonKey: '', table: 'vehicles', source: 'none' };
}

/**
 * Checks if Supabase credentials are validly set
 */
export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey && url.startsWith('http'));
}

/**
 * Gets or initializes the Supabase client instance
 */
export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();

  if (!url || !anonKey || !url.startsWith('http')) {
    return null;
  }

  if (cachedClient && currentUrl === url && currentKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    currentUrl = url;
    currentKey = anonKey;
    return cachedClient;
  } catch (err: any) {
    console.warn('Direct browser Supabase client init note:', err?.message || err);
    return null;
  }
}

/**
 * Saves user-provided Supabase credentials to localStorage & server backend
 */
export function saveSupabaseCredentials(url: string, anonKey: string, table?: string): boolean {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();
  const cleanTable = (table || 'vehicles').trim();

  if (!cleanUrl || !cleanKey) {
    return false;
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_URL, cleanUrl);
    localStorage.setItem(STORAGE_KEY_ANON_KEY, cleanKey);
    localStorage.setItem(STORAGE_KEY_TABLE, cleanTable);
  }

  serverConfigCache = { url: cleanUrl, anonKey: cleanKey, table: cleanTable };

  // Persist to server config in background
  fetch('/api/supabase/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: cleanUrl, key: cleanKey, table: cleanTable }),
  }).catch((err) => console.warn('Could not persist Supabase config to server:', err));

  // Invalidate cache
  cachedClient = null;
  currentUrl = '';
  currentKey = '';

  const client = getSupabaseClient();
  return Boolean(client || cleanUrl);
}

/**
 * Clears stored Supabase credentials
 */
export function clearSupabaseCredentials() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_ANON_KEY);
    localStorage.removeItem(STORAGE_KEY_TABLE);
  }
  serverConfigCache = null;
  cachedClient = null;
  currentUrl = '';
  currentKey = '';
}

/**
 * Tests connection to Supabase Database table and Storage bucket
 */
export async function testSupabaseConnection(
  overrideUrl?: string,
  overrideKey?: string,
  overrideTable?: string
): Promise<{
  success: boolean;
  databaseOk: boolean;
  storageOk: boolean;
  tableCount?: number;
  detectedTable?: string;
  detectedTables?: { name: string; count: number; accessible: boolean }[];
  message: string;
  error?: string;
  isServiceRole?: boolean;
}> {
  const { url: defaultUrl, anonKey: defaultKey, table: defaultTable } = getSupabaseCredentials();
  const targetUrl = (overrideUrl || defaultUrl).trim();
  const targetKey = (overrideKey || defaultKey).trim();
  const targetTable = (overrideTable || defaultTable || 'vehicles').trim();

  if (!targetUrl || !targetKey) {
    return {
      success: false,
      databaseOk: false,
      storageOk: false,
      message: 'Supabase credentials not configured.',
    };
  }

  const isServiceRole = isServiceRoleKey(targetKey);

  // 1. Preferred path: Test through server-side relay
  try {
    const serverRes = await fetch('/api/supabase/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: targetUrl, key: targetKey, table: targetTable }),
    });

    if (serverRes.ok) {
      const data = await serverRes.json();
      return {
        ...data,
        isServiceRole,
      };
    }
  } catch (err) {
    console.warn('Server-side Supabase tester unreachable, testing via client SDK:', err);
  }

  // 2. Direct browser test
  let client: SupabaseClient | null = null;
  try {
    client = createClient(targetUrl, targetKey);
  } catch (err: any) {
    if (err?.message?.includes('Forbidden use of secret API key') || isServiceRole) {
      return {
        success: false,
        databaseOk: false,
        storageOk: false,
        isServiceRole: true,
        message: 'You entered the secret "service_role" API key. Please use the "anon" (public) API key for direct browser connection, or click SAVE to let our backend proxy route it.',
        error: 'Forbidden use of secret API key in browser. Use the "anon" key from Supabase Settings -> API.',
      };
    }
    return {
      success: false,
      databaseOk: false,
      storageOk: false,
      message: 'Invalid Supabase URL or Key format.',
      error: err?.message || String(err),
    };
  }

  let dbOk = false;
  let stOk = false;
  let count: number | undefined;
  let dbError: string = '';
  let stError: string = '';

  // Test database query
  try {
    const { data, error } = await client.from('vehicles').select('id', { count: 'exact', head: true });
    if (error) {
      dbError = error.message;
    } else {
      dbOk = true;
      count = data?.length ?? 0;
    }
  } catch (err: any) {
    dbError = err?.message || String(err);
  }

  // Test storage bucket
  try {
    const { error } = await client.storage.from(BUCKET_NAME).list('', { limit: 1 });
    if (error) {
      stError = error.message;
    } else {
      stOk = true;
    }
  } catch (err: any) {
    stError = err?.message || String(err);
  }

  const success = dbOk;
  let message = '';
  if (dbOk && stOk) {
    message = 'Connected successfully to Supabase Database and Storage!';
  } else if (dbOk && !stOk) {
    message = `Connected to 'vehicles' table, but 'vehicles' storage bucket returned: ${stError || 'Bucket not found'}. Create a public bucket named 'vehicles' in Supabase Storage or run the SQL script.`;
  } else {
    message = `Failed connecting to Supabase: ${dbError || 'Could not query vehicles table'}. Check URL, API Key, and execute the SQL setup script.`;
  }

  return {
    success,
    databaseOk: dbOk,
    storageOk: stOk,
    tableCount: count,
    message,
    error: dbError || stError || undefined,
    isServiceRole,
  };
}

/**
 * SQL script for creating the 'vehicles' table and storage policy in Supabase
 */
export const SUPABASE_SETUP_SQL = `-- 1. Create the vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id TEXT PRIMARY KEY,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  mileage INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'sedans',
  trim TEXT DEFAULT '',
  exterior_color TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'available',
  is_sold BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  location TEXT DEFAULT 'Central Vault',
  specs JSONB DEFAULT '{}'::jsonb,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  inspection_score NUMERIC DEFAULT 98,
  description TEXT DEFAULT '',
  primary_badge TEXT DEFAULT '',
  secondary_badge TEXT DEFAULT '',
  dyno_telemetry JSONB DEFAULT '{}'::jsonb,
  inspection JSONB DEFAULT '{}'::jsonb,
  carfax JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS) & public read / admin write policies
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on vehicles" 
  ON public.vehicles FOR SELECT 
  USING (true);

CREATE POLICY "Allow all access on vehicles" 
  ON public.vehicles FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- 3. Enable Realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;

-- 4. Create the public vehicles storage bucket for car photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vehicles', 'vehicles', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access on vehicles bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vehicles');

CREATE POLICY "Allow Uploads on vehicles bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'vehicles');

CREATE POLICY "Allow Updates on vehicles bucket"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'vehicles');

CREATE POLICY "Allow Deletes on vehicles bucket"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'vehicles');
`;
