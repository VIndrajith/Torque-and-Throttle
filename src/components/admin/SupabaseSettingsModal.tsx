import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  Server,
  HardDrive,
  UploadCloud,
  Shield,
  ExternalLink,
} from 'lucide-react';
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  clearSupabaseCredentials,
  testSupabaseConnection,
  SUPABASE_SETUP_SQL,
  isSupabaseConfigured,
} from '../../supabase/supabaseClient';
import {
  seedSupabaseWithVehicles,
  getStoredVehicles,
  migrateAllImagesToSupabase,
  refreshFromSupabase,
} from '../../supabase/supabaseVehicleService';

interface SupabaseSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: () => void;
}

export const SupabaseSettingsModal: React.FC<SupabaseSettingsModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [tableName, setTableName] = useState('vehicles');
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    databaseOk: boolean;
    storageOk: boolean;
    tableCount?: number;
    detectedTable?: string;
    detectedTables?: { name: string; count: number; accessible: boolean }[];
    message: string;
    error?: string;
  } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedRlsSql, setCopiedRlsSql] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string | null>(null);
  const [isPulling, setIsPulling] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials();
      setUrl(creds.url);
      setAnonKey(creds.anonKey);
      setTableName(creds.table || 'vehicles');
      setTestResult(null);
      setSaveSuccess(false);
      setSyncProgress(null);
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({
        tested: true,
        success: false,
        databaseOk: false,
        storageOk: false,
        message: 'Please enter both Supabase Project URL and API Key first.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await testSupabaseConnection(url.trim(), anonKey.trim(), tableName.trim());
      setTestResult({
        tested: true,
        ...res,
      });
      if (res.detectedTable && res.detectedTable !== tableName) {
        setTableName(res.detectedTable);
      }
    } catch (err: any) {
      setTestResult({
        tested: true,
        success: false,
        databaseOk: false,
        storageOk: false,
        message: 'Connection error',
        error: err?.message || String(err),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!url.trim() || !anonKey.trim()) return;

    const ok = saveSupabaseCredentials(url.trim(), anonKey.trim(), tableName.trim());
    if (ok) {
      setSaveSuccess(true);
      try {
        setSyncProgress('Loading fleet records from Supabase...');
        const pulled = await refreshFromSupabase();
        setSyncProgress(`Connected! Loaded ${pulled.length} vehicles from Supabase.`);
      } catch (err: any) {
        console.warn('Refresh on save note:', err);
      }
      setTimeout(() => {
        setSaveSuccess(false);
        setSyncProgress(null);
      }, 4000);
      if (onConfigSaved) onConfigSaved();
    }
  };

  const handlePullFromSupabase = async () => {
    setIsPulling(true);
    setSyncProgress(`Fetching vehicles from Supabase table '${tableName}'...`);
    try {
      saveSupabaseCredentials(url.trim(), anonKey.trim(), tableName.trim());
      const pulled = await refreshFromSupabase();
      if (pulled.length > 0) {
        setSyncProgress(`Successfully fetched ${pulled.length} vehicles from Supabase!`);
      } else {
        setSyncProgress(`Connected to Supabase, but 0 vehicles were returned. Check if your table is named '${tableName}', or if Supabase Row-Level Security (RLS) is blocking read access.`);
      }
      if (onConfigSaved) onConfigSaved();
      setTimeout(() => setSyncProgress(null), 5000);
    } catch (err: any) {
      setSyncProgress(`Failed fetching from Supabase: ${err?.message || err}`);
    } finally {
      setIsPulling(false);
    }
  };

  const handleClear = () => {
    clearSupabaseCredentials();
    setUrl('');
    setAnonKey('');
    setTableName('vehicles');
    setTestResult(null);
    if (onConfigSaved) onConfigSaved();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleCopyRlsSql = () => {
    const rlsFix = `-- Disable Row Level Security so your webapp can read the vehicles\nALTER TABLE IF EXISTS public.vehicles DISABLE ROW LEVEL SECURITY;\nALTER TABLE IF EXISTS public.cars DISABLE ROW LEVEL SECURITY;\n\n-- Or create a public SELECT policy:\nCREATE POLICY IF NOT EXISTS "Allow public read" ON public.vehicles FOR SELECT USING (true);\nCREATE POLICY IF NOT EXISTS "Allow public read" ON public.cars FOR SELECT USING (true);`;
    navigator.clipboard.writeText(rlsFix);
    setCopiedRlsSql(true);
    setTimeout(() => setCopiedRlsSql(false), 2500);
  };

  const handleSyncFleet = async () => {
    setIsSyncing(true);
    setSyncProgress('Syncing vehicle fleet records to Supabase table...');

    try {
      const cars = getStoredVehicles();
      const res = await seedSupabaseWithVehicles(cars);

      if (!res.success) {
        setSyncProgress(`Sync error: ${res.error}`);
        return;
      }

      setSyncProgress('Uploading vehicle photos to Supabase Storage bucket...');
      await migrateAllImagesToSupabase((p) => {
        setSyncProgress(`Uploading photos: ${p.carName} (${p.current}/${p.total})`);
      });

      setSyncProgress(`Successfully synced ${cars.length} vehicles and images to Supabase!`);
      setTimeout(() => setSyncProgress(null), 4000);
    } catch (err: any) {
      setSyncProgress(`Sync failed: ${err?.message || err}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const isConfigured = isSupabaseConfigured();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
      <div
        className="bg-[#0E1017] border border-white/[0.12] rounded-2xl max-w-2xl w-full p-5 sm:p-7 relative shadow-2xl my-auto max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close Supabase configuration modal"
          className="absolute top-4 right-4 text-[#94A3B8] hover:text-white p-2 rounded-lg hover:bg-white/[0.06] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-black text-lg sm:text-xl text-[#ECE5D8] uppercase tracking-wide">
                Supabase Storage &amp; Database
              </h2>
              {isConfigured ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold">
                  ACTIVE
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-950/70 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold">
                  NOT CONFIGURED
                </span>
              )}
            </div>
            <p className="text-xs font-mono text-[#94A3B8]">
              Free PostgreSQL vehicle database and media storage bucket
            </p>
          </div>
        </div>

        {/* Credentials Form */}
        <div className="space-y-4 font-mono text-xs mb-6">
          {/* Project URL */}
          <div>
            <label className="block text-[11px] font-bold text-[#ECE5D8] uppercase mb-1.5 flex items-center justify-between">
              <span>Supabase Project URL</span>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline flex items-center gap-1 text-[10px] font-normal"
              >
                <span>Supabase Dashboard</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full bg-[#07090D] border border-white/[0.1] focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-xs text-[#ECE5D8] placeholder-[#94A3B8]/40 outline-none transition-all"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="block text-[11px] font-bold text-[#ECE5D8] uppercase mb-1.5 flex items-center justify-between">
              <span>Supabase API Key (Anon / Public)</span>
              <span className="text-[10px] text-[#94A3B8] font-normal">
                Project Settings &gt; API &gt; <strong>anon public</strong>
              </span>
            </label>
            <input
              type="password"
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full bg-[#07090D] border border-white/[0.1] focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-xs text-[#ECE5D8] placeholder-[#94A3B8]/40 outline-none transition-all"
            />
            <div className="mt-1.5 text-[10px] text-[#94A3B8] font-sans flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>
                Use <strong>anon (public)</strong> key or <strong>service_role (secret)</strong> key (our backend securely proxies both).
              </span>
            </div>
          </div>

          {/* Table Name Selection */}
          <div>
            <label className="block text-[11px] font-bold text-[#ECE5D8] uppercase mb-1.5 flex items-center justify-between">
              <span>Database Table Name</span>
              <span className="text-[10px] text-[#94A3B8] font-normal">
                Default: <strong>vehicles</strong> or <strong>cars</strong>
              </span>
            </label>
            <input
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="vehicles"
              className="w-full bg-[#07090D] border border-white/[0.1] focus:border-emerald-500 rounded-lg px-3.5 py-2.5 text-xs text-[#ECE5D8] placeholder-[#94A3B8]/40 outline-none transition-all"
            />
            {/* Quick table chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[10px] text-[#94A3B8]">Quick select:</span>
              {['vehicles', 'cars', 'inventory', 'fleet'].map((tbl) => (
                <button
                  key={tbl}
                  type="button"
                  onClick={() => setTableName(tbl)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer border ${
                    tableName === tbl
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                      : 'bg-[#171922] border-white/[0.08] text-[#94A3B8] hover:text-[#ECE5D8]'
                  }`}
                >
                  {tbl}
                </button>
              ))}
            </div>

            {/* Detected tables from live project scan */}
            {testResult?.detectedTables && testResult.detectedTables.length > 0 && (
              <div className="mt-2.5 p-2.5 bg-[#07090D] border border-white/[0.08] rounded-lg">
                <span className="text-[10px] text-[#94A3B8] block mb-1.5">
                  Detected Tables in your Supabase project:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {testResult.detectedTables.map((dt) => (
                    <button
                      key={dt.name}
                      type="button"
                      onClick={() => setTableName(dt.name)}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono flex items-center gap-1.5 cursor-pointer border transition-all ${
                        tableName === dt.name
                          ? 'bg-emerald-600 text-white border-emerald-400 font-bold'
                          : dt.count > 0
                          ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900'
                          : 'bg-[#171922] border-white/[0.08] text-[#94A3B8]'
                      }`}
                    >
                      <span>{dt.name}</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-black/40 font-bold">
                        {dt.count} rows
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Test connection result banner */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border flex flex-col gap-2 ${
                testResult.success
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-red-950/40 border-red-500/40 text-red-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
              <div className="flex items-center gap-4 text-[11px] pt-1 border-t border-white/[0.08]">
                <span className="flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5" />
                  <span>
                    Table '{tableName}': {testResult.databaseOk ? `${testResult.tableCount ?? 0} cars` : 'Unavailable'}
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Storage: {testResult.storageOk ? 'Available' : 'Unavailable'}</span>
                </span>
              </div>
              {testResult.error && (
                <p className="text-[10px] text-red-300 font-sans opacity-90">{testResult.error}</p>
              )}

              {/* RLS troubleshooting tip if 0 rows returned */}
              {testResult.databaseOk && (testResult.tableCount === 0 || testResult.tableCount === undefined) && (
                <div className="mt-2 p-2.5 bg-amber-950/50 border border-amber-500/40 rounded-lg text-amber-200 text-[11px] font-sans">
                  <p className="font-bold flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Have 6 cars in Supabase but 0 showing?</span>
                  </p>
                  <p className="text-[10px] text-amber-300/90 leading-relaxed mb-2">
                    Supabase enables Row-Level Security (RLS) by default, which blocks the anon key from reading rows unless a policy is created.
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyRlsSql}
                    className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 font-mono text-[10px] font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedRlsSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedRlsSql ? 'COPIED RLS SQL!' : 'COPY SQL TO DISABLE RLS & ALLOW READ'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Supabase credentials saved successfully.</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !url.trim() || !anonKey.trim()}
                className="px-3.5 py-2 rounded-lg bg-[#171922] hover:bg-[#202330] disabled:opacity-40 border border-white/[0.1] text-xs font-bold text-[#ECE5D8] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />}
                <span>TEST CONNECTION</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={!url.trim() || !anonKey.trim()}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer"
              >
                SAVE CREDENTIALS
              </button>
            </div>

            {isConfigured && (
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs transition-colors cursor-pointer"
              >
                Disconnect
              </button>
            )}
          </div>
        </div>

        {/* Sync fleet & SQL guide */}
        <div className="border-t border-white/[0.08] pt-5 space-y-4 font-mono text-xs">
          {/* 1-Click Pull fleet from Supabase */}
          <div className="p-4 bg-[#090B10] border border-emerald-500/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-[#ECE5D8] text-xs uppercase flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                <span>Fetch Fleet from Supabase Database</span>
              </div>
              <p className="text-[11px] text-[#94A3B8] font-sans mt-0.5">
                Directly imports all registered cars from your Supabase <code className="text-emerald-400">vehicles</code> table into the showroom.
              </p>
            </div>

            <button
              type="button"
              onClick={handlePullFromSupabase}
              disabled={isPulling || !isConfigured}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white font-bold text-xs shrink-0 cursor-pointer flex items-center gap-1.5 shadow-lg shadow-emerald-950/50"
            >
              {isPulling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>{isPulling ? 'FETCHING...' : 'PULL CARS FROM SUPABASE'}</span>
            </button>
          </div>

          {/* 1-Click Sync fleet */}
          <div className="p-4 bg-[#090B10] border border-white/[0.08] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-[#ECE5D8] text-xs uppercase flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-emerald-400" />
                <span>Sync Local Vehicles to Supabase</span>
              </div>
              <p className="text-[11px] text-[#94A3B8] font-sans mt-0.5">
                Uploads all local cars and their high-resolution photos into Supabase Table &amp; Storage Bucket.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSyncFleet}
              disabled={isSyncing || !isConfigured}
              className="px-3.5 py-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 disabled:opacity-30 text-emerald-300 font-bold text-xs shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
              <span>{isSyncing ? 'SYNCING...' : 'SYNC ALL CARS'}</span>
            </button>
          </div>

          {syncProgress && (
            <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-lg text-[11px] text-emerald-300 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              <span>{syncProgress}</span>
            </div>
          )}

          {/* SQL Setup Helper */}
          <div className="p-4 bg-[#090B10] border border-white/[0.08] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-bold text-[#ECE5D8] text-xs uppercase flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Supabase SQL Setup Script</span>
              </div>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-2.5 py-1 rounded bg-[#171922] hover:bg-white/[0.1] text-[11px] text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'COPIED!' : 'COPY SQL'}</span>
              </button>
            </div>
            <p className="text-[11px] text-[#94A3B8] font-sans">
              Paste this in the <strong>SQL Editor</strong> tab of your Supabase dashboard to create the{' '}
              <code className="text-emerald-400 font-mono">vehicles</code> table and public storage bucket.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
