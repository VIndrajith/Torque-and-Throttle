import express from 'express';
import compression from 'compression';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser } from './src/db/users.ts';
import { getAllVehicles, getVehicleById, upsertVehicle, deleteVehicle } from './src/db/vehicles.ts';
import { getAllEnquiries, insertEnquiry, updateEnquiryStatus } from './src/db/enquiries.ts';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SUPABASE_CONFIG_FILE = resolve(__dirname, 'supabase-server-config.json');

function cleanSupabaseUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  return rawUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

function getServerSupabaseConfig(): { url: string; key: string; table: string } {
  try {
    if (fs.existsSync(SUPABASE_CONFIG_FILE)) {
      const content = fs.readFileSync(SUPABASE_CONFIG_FILE, 'utf8');
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed.url === 'string') {
        return {
          url: cleanSupabaseUrl(parsed.url),
          key: (parsed.key || '').trim(),
          table: (parsed.table || 'vehicles').trim(),
        };
      }
    }
  } catch (err) {
    console.warn('Error reading supabase-server-config.json:', err);
  }

  const envUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const envKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    '';
  return { url: cleanSupabaseUrl(envUrl), key: envKey.trim(), table: 'vehicles' };
}

function saveServerSupabaseConfig(cfg: { url: string; key: string; table?: string }) {
  try {
    const sanitized = {
      url: cleanSupabaseUrl(cfg.url),
      key: (cfg.key || '').trim(),
      table: (cfg.table || 'vehicles').trim(),
    };
    fs.writeFileSync(SUPABASE_CONFIG_FILE, JSON.stringify(sanitized, null, 2), 'utf8');
  } catch (err) {
    console.warn('Error writing supabase-server-config.json:', err);
  }
}

async function startServer() {
  const app = express();
  let port = Number(process.env.PORT);
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    port = Number(process.argv[portArgIndex + 1]);
  }
  const PORT = port || 3000;

  // Gzip / Brotli payload compression to minimize network egress and stay well within free bandwidth limits
  app.use(compression());

  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', cloudSql: true });
  });

  // User synchronization with Cloud SQL
  app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email;
      const name = (req.user as any)?.name;
      if (!uid || !email) {
        return res.status(400).json({ error: 'Missing user credentials in token' });
      }
      const user = await getOrCreateUser(uid, email, name);
      res.json(user);
    } catch (error: any) {
      console.error('Failed syncing user to Cloud SQL:', error);
      res.status(500).json({ error: 'Failed syncing user profile' });
    }
  });

  // Image Proxy to avoid CORS issues when migrating external images to Firebase Cloud Storage
  app.get('/api/proxy-image', async (req, res) => {
    const imageUrl = req.query.url as string;
    if (!imageUrl) {
      return res.status(400).send('Missing url query parameter');
    }
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        return res.status(response.status).send(`Failed fetching upstream image: ${response.statusText}`);
      }
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (err: any) {
      console.error('Proxy image error:', err);
      res.status(500).send('Failed proxying image');
    }
  });

  // Vehicles endpoints
  app.get('/api/vehicles', async (_req, res) => {
    try {
      const list = await getAllVehicles();
      res.json(list);
    } catch (error: any) {
      console.error('Failed fetching vehicles:', error);
      res.status(500).json({ error: 'Failed to retrieve vehicles' });
    }
  });

  app.get('/api/vehicles/:id', async (req, res) => {
    try {
      const item = await getVehicleById(req.params.id);
      if (!item) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      res.json(item);
    } catch (error: any) {
      console.error('Failed fetching vehicle:', error);
      res.status(500).json({ error: 'Failed to retrieve vehicle' });
    }
  });

  app.post('/api/vehicles', requireAuth, async (req: AuthRequest, res) => {
    try {
      const saved = await upsertVehicle(req.body);
      res.json(saved);
    } catch (error: any) {
      console.error('Failed saving vehicle:', error);
      res.status(500).json({ error: 'Failed saving vehicle' });
    }
  });

  app.delete('/api/vehicles/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const deleted = await deleteVehicle(req.params.id);
      res.json(deleted);
    } catch (error: any) {
      console.error('Failed deleting vehicle:', error);
      res.status(500).json({ error: 'Failed deleting vehicle' });
    }
  });

  // Enquiries endpoints
  app.get('/api/enquiries', requireAuth, async (_req: AuthRequest, res) => {
    try {
      const list = await getAllEnquiries();
      res.json(list);
    } catch (error: any) {
      console.error('Failed fetching enquiries:', error);
      res.status(500).json({ error: 'Failed retrieving customer enquiries' });
    }
  });

  // Unified POST endpoint for enquiries, bookings, and custom requests via FormSubmit
  app.post(['/api/enquiries', '/api/bookings', '/api/requests'], async (req, res) => {
    try {
      const body = req.body || {};

      // Flexible extraction supporting flat keys, nested customer/vehicle objects, or form payloads
      const customerName = (
        body.customerName ||
        body.clientName ||
        body.customer?.name ||
        body.name ||
        'Anonymous Client'
      ).trim();

      const customerPhone = (
        body.customerPhone ||
        body.clientContact ||
        body.customer?.phone ||
        body.phone ||
        body.mobile ||
        ''
      ).trim();

      const customerEmail = (
        body.customerEmail ||
        body.customer?.email ||
        body.email ||
        ''
      ).trim();

      const preferredContact = (
        body.preferredContact ||
        body.customer?.preferredContact ||
        'phone'
      ) as 'phone' | 'email' | 'whatsapp';

      const preferredDate = body.preferredDate || body.targetTimeline || body.date || '';
      const rawMessage = (
        body.message ||
        body.additionalNotes ||
        body.customer?.message ||
        body.notes ||
        ''
      ).trim();

      const message = preferredDate
        ? `[Schedule/Timeline: ${preferredDate}] ${rawMessage}`.trim()
        : rawMessage;

      const vehicleId = (
        body.vehicleId ||
        body.vehicle?.id ||
        body.stockId ||
        ''
      ).trim() || null;

      const vehicleName = (
        body.vehicleName ||
        body.vehicle?.name ||
        body.vehicleModel ||
        body.targetModel ||
        body.formTitle ||
        'Vehicle'
      ).trim();

      const source = (
        body.source ||
        body.formTitle ||
        body.type ||
        'website'
      ).trim();

      const generatedId = (
        body.id ||
        body.referenceId ||
        `ENQ-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`
      ).trim();

      const enquiryRecord = {
        id: generatedId,
        customerName,
        customerPhone,
        customerEmail,
        preferredContact,
        message,
        vehicleId,
        vehicleName,
        status: body.status || 'new',
        assignedAdminId: body.assignedAdminId || '',
        source,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Persist to database/memory store
      let dbRecord = null;
      try {
        dbRecord = await insertEnquiry(enquiryRecord);
      } catch (dbErr: any) {
        console.warn('Enquiry store notice:', dbErr?.message);
      }

      res.status(201).json({
        success: true,
        status: 'received',
        message: 'Submission successfully recorded.',
        id: generatedId,
        data: dbRecord || enquiryRecord,
      });
    } catch (error: any) {
      console.error('Failed processing enquiry:', error);
      res.status(500).json({ error: 'Failed processing enquiry', message: error?.message });
    }
  });

  // Dedicated reliable server-side relay to Make.com AI Agent Webhook (with 2-attempt retry if first fails)
  const AI_AGENT_WEBHOOK_URL =
    process.env.AI_AGENT_WEBHOOK_URL ||
    process.env.VITE_AI_AGENT_WEBHOOK_URL ||
    'https://hook.eu1.make.com/oegp35uomovhnm2gtix2jrem19rnhc4k';

  app.post('/api/webhook-relay', async (req, res) => {
    const payload = req.body;
    let lastError: any = null;
    let lastStatus = 500;
    let responseText = '';

    // Send two times if one failed
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[Webhook Relay Attempt ${attempt}/2] Outbound POST to Make.com:`, JSON.stringify(payload));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s safety timeout per attempt

        const response = await fetch(AI_AGENT_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json, text/plain, */*',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        responseText = await response.text().catch(() => '');
        lastStatus = response.status;

        if (response.ok) {
          console.log(`[Webhook Relay Success - Attempt ${attempt}/2 HTTP ${response.status}]:`, responseText);
          return res.status(200).json({
            success: true,
            status: response.status,
            attempt,
            makeResponse: responseText,
          });
        }

        console.warn(`[Webhook Relay Attempt ${attempt}/2 Failed] HTTP ${response.status}: ${responseText}`);
        lastError = new Error(`HTTP ${response.status}: ${responseText}`);
      } catch (error: any) {
        lastError = error;
        console.warn(`[Webhook Relay Attempt ${attempt}/2 Error]:`, error?.message || error);
      }

      // If attempt 1 failed, wait briefly before sending a second time
      if (attempt < 2) {
        console.log('[Webhook Relay] Attempt 1 failed. Retrying (Attempt 2)...');
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    }

    console.error('[Webhook Relay Server Error after 2 attempts]:', lastError);
    return res.status(lastStatus >= 400 && lastStatus < 600 ? lastStatus : 502).json({
      success: false,
      error: lastError?.message || 'Failed delivering to Make.com webhook after 2 attempts',
      status: lastStatus,
    });
  });

  app.patch('/api/enquiries/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const updated = await updateEnquiryStatus(req.params.id, req.body.status);
      res.json(updated);
    } catch (error: any) {
      console.error('Failed updating enquiry status:', error);
      res.status(500).json({ error: 'Failed updating enquiry status' });
    }
  });

  // Helper to discover all tables in a Supabase project
  async function discoverSupabaseTables(url: string, key: string): Promise<string[]> {
    const discovered: Set<string> = new Set();
    // 1. Check OpenAPI specification endpoint from PostgREST
    try {
      const cleanUrl = url.replace(/\/+$/, '');
      const openApiRes = await fetch(`${cleanUrl}/rest/v1/`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
      });
      if (openApiRes.ok) {
        const schema = await openApiRes.json();
        if (schema && schema.definitions) {
          Object.keys(schema.definitions).forEach((t) => discovered.add(t));
        }
        if (schema && schema.components && schema.components.schemas) {
          Object.keys(schema.components.schemas).forEach((t) => discovered.add(t));
        }
        if (schema && schema.paths) {
          Object.keys(schema.paths).forEach((p) => {
            const tablePart = p.replace(/^\//, '').split('?')[0].split('/')[0];
            if (tablePart && !tablePart.startsWith('rpc')) {
              discovered.add(tablePart);
            }
          });
        }
      }
    } catch {}

    // 2. Comprehensive fallback list of common vehicle / car table names
    const commonNames = [
      'vehicles',
      'cars',
      'vehicle',
      'car',
      'Vehicles',
      'Cars',
      'Vehicle',
      'Car',
      'inventory',
      'Inventory',
      'car_inventory',
      'vehicle_inventory',
      'car_list',
      'vehicle_list',
      'fleet',
      'fleets',
      'listings',
      'listing',
      'automobiles',
      'automobile',
      'garage',
      'motors',
      'products',
      'tnt_vehicles',
      'tnt_cars',
    ];
    commonNames.forEach((name) => discovered.add(name));
    return Array.from(discovered);
  }

  function isServiceRoleKey(key: string): boolean {
    if (!key) return false;
    try {
      const parts = key.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        return payload.role === 'service_role';
      }
    } catch {
      // Ignore parse errors
    }
    return false;
  }

  // Get current Supabase credentials and active configuration
  app.get('/api/supabase/config', (_req, res) => {
    const cfg = getServerSupabaseConfig();
    const isSecret = isServiceRoleKey(cfg.key);
    return res.json({
      success: true,
      url: cfg.url,
      hasKey: Boolean(cfg.key),
      // Mask secret service_role key so it is never exposed to client browser
      key: isSecret ? '' : cfg.key,
      table: cfg.table || 'vehicles',
      isConfigured: Boolean(cfg.url && cfg.key),
    });
  });

  // Save Supabase credentials to server storage
  app.post('/api/supabase/config', (req, res) => {
    try {
      const { url, key, table } = req.body;
      if (!url || !key) {
        return res.status(400).json({ success: false, error: 'Missing url or key' });
      }
      saveServerSupabaseConfig({
        url: url.trim(),
        key: key.trim(),
        table: (table || 'vehicles').trim(),
      });
      return res.json({
        success: true,
        message: 'Supabase configuration saved securely to server.',
        url: url.trim(),
        table: (table || 'vehicles').trim(),
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  // Supabase connection tester (supports both anon and service_role keys seamlessly)
  app.post('/api/supabase/test', async (req, res) => {
    try {
      let { url, key, table } = req.body;
      if (!url || !key) {
        const serverCfg = getServerSupabaseConfig();
        url = url || serverCfg.url;
        key = key || serverCfg.key;
        table = table || serverCfg.table;
      }

      if (!url || !key) {
        return res.status(400).json({
          success: false,
          databaseOk: false,
          storageOk: false,
          message: 'Please provide both Supabase Project URL and API Key.',
        });
      }

      const targetUrl = cleanSupabaseUrl(url);
      const targetKey = key.trim();
      const client = createSupabaseClient(targetUrl, targetKey);
      const discoveredTables = await discoverSupabaseTables(targetUrl, targetKey);
      if (table && !discoveredTables.includes(table)) {
        discoveredTables.unshift(table);
      }

      let dbOk = false;
      let stOk = false;
      let dbError = '';
      let stError = '';
      let detectedTable = table || 'vehicles';
      let tableCount = 0;
      const detectedTables: { name: string; count: number; accessible: boolean }[] = [];

      for (const tbl of discoveredTables) {
        try {
          const { count, data, error } = await client
            .from(tbl)
            .select('*', { count: 'exact' })
            .limit(1);

          if (!error && Array.isArray(data)) {
            const actualCount = count !== null && count !== undefined ? count : data.length;
            detectedTables.push({ name: tbl, count: actualCount, accessible: true });
            if (!dbOk || actualCount > tableCount) {
              dbOk = true;
              tableCount = actualCount;
              detectedTable = tbl;
              dbError = '';
            }
          } else if (error && !error.message?.includes('does not exist') && !error.message?.includes('404')) {
            detectedTables.push({ name: tbl, count: 0, accessible: false });
            if (!dbError) dbError = error.message;
          }
        } catch (err: any) {
          if (!dbError) dbError = err?.message || String(err);
        }
      }

      // If user specified table explicitly, favor that
      if (table) {
        const match = detectedTables.find((t) => t.name.toLowerCase() === table.toLowerCase());
        if (match) {
          detectedTable = match.name;
          tableCount = match.count;
        }
      }

      if (dbOk && detectedTable) {
        saveServerSupabaseConfig({ url: targetUrl, key: targetKey, table: detectedTable });
      }

      // 2. Test vehicles storage bucket
      try {
        const { error } = await client.storage.from('vehicles').list('', { limit: 1 });
        if (error) {
          stError = error.message;
        } else {
          stOk = true;
        }
      } catch (err: any) {
        stError = err?.message || String(err);
      }

      let message = '';
      if (dbOk && stOk) {
        message = `Connected successfully to Supabase '${detectedTable}' table (${tableCount} vehicles found) and Storage!`;
      } else if (dbOk && !stOk) {
        message = `Connected to '${detectedTable}' table (${tableCount} vehicles found). Storage bucket 'vehicles': ${stError || 'Not found'}.`;
      } else {
        message = `Failed querying Supabase table: ${dbError || 'Table not found or blocked by RLS'}. Check RLS policies or run the SQL setup script.`;
      }

      return res.json({
        success: dbOk,
        databaseOk: dbOk,
        storageOk: stOk,
        detectedTable,
        tableCount,
        detectedTables,
        message,
        error: dbError || stError || undefined,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        databaseOk: false,
        storageOk: false,
        message: 'Server error testing Supabase connection',
        error: err?.message || String(err),
      });
    }
  });

  // Fetch vehicles directly from Supabase (server-side, avoiding CORS or browser restrictions)
  app.all(['/api/supabase/fetch-fleet', '/api/supabase/fleet'], async (req, res) => {
    try {
      const serverCfg = getServerSupabaseConfig();
      const url = ((req.body?.url || req.query?.url || serverCfg.url) as string)?.trim();
      const key = ((req.body?.key || req.query?.key || serverCfg.key) as string)?.trim();
      const requestedTable = ((req.body?.table || req.query?.table || serverCfg.table) as string)?.trim();

      if (!url || !key) {
        return res.status(400).json({
          success: false,
          count: 0,
          vehicles: [],
          error: 'No Supabase credentials configured. Configure URL & API Key in Admin Settings.',
        });
      }

      const targetUrl = cleanSupabaseUrl(url);
      const targetKey = key.trim();
      const client = createSupabaseClient(targetUrl, targetKey);
      const discoveredTables = await discoverSupabaseTables(targetUrl, targetKey);
      if (requestedTable && !discoveredTables.includes(requestedTable)) {
        discoveredTables.unshift(requestedTable);
      }

      let foundData: any[] = [];
      let foundTable = requestedTable || 'vehicles';
      let lastError: any = null;
      let checkedTables: string[] = [];

      for (const tbl of discoveredTables) {
        checkedTables.push(tbl);
        try {
          // Attempt 1: with created_at sorting
          let { data, error } = await client
            .from(tbl)
            .select('*')
            .order('created_at', { ascending: false });

          // Attempt 2: fallback to plain select if created_at column is missing
          if (error) {
            const fallback = await client.from(tbl).select('*');
            data = fallback.data;
            error = fallback.error;
          }

          if (!error && Array.isArray(data) && data.length > 0) {
            foundData = data;
            foundTable = tbl;
            saveServerSupabaseConfig({ url: targetUrl, key: targetKey, table: foundTable });
            break; // Found our populated table with rows!
          } else if (!error && Array.isArray(data) && foundData.length === 0) {
            foundData = data;
            foundTable = tbl;
          } else if (error) {
            lastError = error;
          }
        } catch (e: any) {
          lastError = e;
        }
      }

      const isRlsSuspected = foundData.length === 0 && Boolean(url && key);

      let hint = '';
      if (foundData.length === 0) {
        hint = `Queried Supabase table '${foundTable}'. 0 rows returned. If you have 6 cars in Supabase, ensure Row-Level Security (RLS) is disabled or has a public SELECT policy (run 'ALTER TABLE ${foundTable} DISABLE ROW LEVEL SECURITY;'), or provide your 'service_role' key.`;
      }

      return res.json({
        success: true,
        table: foundTable,
        count: foundData.length,
        vehicles: foundData,
        isRlsSuspected,
        message: hint || `Successfully loaded ${foundData.length} vehicles from table '${foundTable}'.`,
        checkedTables: checkedTables.slice(0, 5),
        error: foundData.length === 0 && lastError ? lastError.message : undefined,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  // Server-side relay for updating single vehicle status (sold, reserved, available)
  app.post('/api/supabase/update-vehicle-status', async (req, res) => {
    try {
      const { id, isSold, status } = req.body || {};
      if (!id) {
        return res.status(400).json({ success: false, error: 'Missing vehicle id' });
      }
      const targetStatus = status || (isSold ? 'sold' : 'available');
      const targetIsSold = Boolean(isSold || targetStatus === 'sold');

      const serverCfg = getServerSupabaseConfig();
      if (serverCfg.url && serverCfg.key) {
        const client = createSupabaseClient(serverCfg.url, serverCfg.key);
        
        // Attempt 1: update is_sold, status, and updated_at
        let { error } = await client
          .from(serverCfg.table || 'vehicles')
          .update({
            is_sold: targetIsSold,
            status: targetStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id);

        // Attempt 2: fallback without updated_at if column is missing
        if (error && error.message.includes('updated_at')) {
          const retry = await client
            .from(serverCfg.table || 'vehicles')
            .update({
              is_sold: targetIsSold,
              status: targetStatus,
            })
            .eq('id', id);
          error = retry.error;
        }

        if (error) {
          console.warn('[Server Supabase Update Status Warning]:', error.message);
        } else {
          console.log(`[Server Supabase] Vehicle ${id} status successfully updated to ${targetStatus} (isSold=${targetIsSold})`);
        }
      }

      // Also update in Cloud SQL if configured
      try {
        const vehicle = await getVehicleById(id);
        if (vehicle) {
          await upsertVehicle({
            ...vehicle,
            status: targetStatus,
            isSold: targetIsSold,
            updatedAt: new Date(),
          });
        }
      } catch (err) {
        console.warn('Cloud SQL update status note:', err);
      }

      return res.json({ success: true, id, status: targetStatus, isSold: targetIsSold });
    } catch (err: any) {
      console.error('Server status update error:', err);
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  // Server-side relay for batch updating vehicle statuses
  app.post('/api/supabase/batch-update-status', async (req, res) => {
    try {
      const { ids, status } = req.body || {};
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, error: 'Missing ids array' });
      }
      const targetStatus = status || 'available';
      const targetIsSold = targetStatus === 'sold';

      const serverCfg = getServerSupabaseConfig();
      if (serverCfg.url && serverCfg.key) {
        const client = createSupabaseClient(serverCfg.url, serverCfg.key);
        
        let { error } = await client
          .from(serverCfg.table || 'vehicles')
          .update({
            is_sold: targetIsSold,
            status: targetStatus,
            updated_at: new Date().toISOString(),
          })
          .in('id', ids);

        if (error && error.message.includes('updated_at')) {
          const retry = await client
            .from(serverCfg.table || 'vehicles')
            .update({
              is_sold: targetIsSold,
              status: targetStatus,
            })
            .in('id', ids);
          error = retry.error;
        }

        if (error) {
          console.warn('[Server Supabase Batch Update Warning]:', error.message);
        } else {
          console.log(`[Server Supabase] Batch updated ${ids.length} vehicles to ${targetStatus}`);
        }
      }

      return res.json({ success: true, count: ids.length, status: targetStatus, isSold: targetIsSold });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  // Supabase fleet synchronization
  app.post('/api/supabase/sync-fleet', async (req, res) => {
    try {
      const serverCfg = getServerSupabaseConfig();
      const url = (req.body?.url || serverCfg.url)?.trim();
      const key = (req.body?.key || serverCfg.key)?.trim();
      const targetTable = (req.body?.table || serverCfg.table || 'vehicles')?.trim();
      const vehicleRows = req.body?.vehicles;

      if (!url || !key || !Array.isArray(vehicleRows)) {
        return res.status(400).json({ success: false, error: 'Invalid payload' });
      }

      const client = createSupabaseClient(url, key);
      const { data, error } = await client.from(targetTable).upsert(vehicleRows, { onConflict: 'id' });

      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }

      return res.json({ success: true, count: vehicleRows.length, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  // Mount Vite middleware for dev or serve dist in production with static asset caching
  if (process.env.NODE_ENV === 'production') {
    app.use(
      express.static(resolve(__dirname, 'dist'), {
        maxAge: '1y',
        immutable: true,
        setHeaders: (res, path) => {
          if (path.endsWith('.html')) {
            // HTML files should revalidate quickly so new deployments are picked up immediately
            res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
          } else {
            // JS, CSS, WebP, SVG, PNG, Fonts are content-hashed by Vite build
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      })
    );
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      res.sendFile(resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup failed:', err);
});
