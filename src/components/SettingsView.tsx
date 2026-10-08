import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Download,
  Upload,
  RotateCcw,
  User,
  Hash,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { User as UserType } from '../types/inventory';
import { api } from '../services/api';

interface SettingsViewProps {
  currentUser: UserType | null;
  settings: { id_prefix: string; currency: string; app_url?: string };
  onUpdateSettings: (newSettings: { id_prefix?: string; currency?: string; app_url?: string }) => Promise<void>;
  onResetSeed: () => Promise<void>;
  onOpenAuth: () => void;
  onRefreshData?: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  settings,
  onUpdateSettings,
  onResetSeed,
  onOpenAuth,
  onRefreshData,
}) => {
  const [prefix, setPrefix] = useState(settings.id_prefix || 'SOLK');
  const [currency, setCurrency] = useState(settings.currency || 'GBP');
  const [appUrl, setAppUrl] = useState(settings.app_url || window.location.origin);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSyncingQr, setIsSyncingQr] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSettings({
      id_prefix: prefix.trim().toUpperCase(),
      currency,
      app_url: appUrl.trim(),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSyncQrCodes = async () => {
    setIsSyncingQr(true);
    try {
      const res = await api.regenerateQrCodes(window.location.origin);
      setAppUrl(res.base_url);
      setSyncSuccess(true);
      if (onRefreshData) await onRefreshData();
      setTimeout(() => setSyncSuccess(false), 4000);
    } catch {
      alert('Failed to regenerate QR codes');
    } finally {
      setIsSyncingQr(false);
    }
  };

  const handleExport = () => {
    window.location.href = '/api/export';
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json),
      });
      if (res.ok) {
        alert('Inventory restored successfully!');
        window.location.reload();
      } else {
        alert('Failed to restore backup file');
      }
    } catch (err) {
      alert('Invalid JSON file format');
    }
  };

  const handleReset = async () => {
    if (confirm('Reset inventory back to sample possessions? Any custom items created will be reset to default demo records.')) {
      setIsResetting(true);
      await onResetSeed();
      setIsResetting(false);
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Application Settings
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Configure preferences, inventory identifiers, backup data, and security options
        </p>
      </div>

      {/* User Account Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white font-bold text-xl flex items-center justify-center shadow-sm">
            {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'C'}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              {currentUser?.name || 'Charlie Solk'}
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Active Session
              </span>
            </h3>
            <p className="text-xs text-slate-500">{currentUser?.email || 'charliesolk28@gmail.com'}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Encrypted personal catalog • Private storage
            </p>
          </div>
        </div>

        <button
          onClick={onOpenAuth}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          Switch Account / Profile
        </button>
      </div>

      {/* General Preferences */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Coins className="w-4 h-4 text-blue-600" />
            Inventory & Valuation Preferences
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Set default currency and prefix formatting for automatically generated asset tags
          </p>
        </div>

        <form onSubmit={handleSavePreferences} className="space-y-4 max-w-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Display Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
              >
                <option value="GBP">£ GBP (British Pound)</option>
                <option value="USD">$ USD (US Dollar)</option>
                <option value="EUR">€ EUR (Euro)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Asset ID Prefix
              </label>
              <input
                type="text"
                maxLength={6}
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                placeholder="e.g. SOLK"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono uppercase font-bold"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Next item generated: {prefix}-000013
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              Save Preferences
            </button>
            {saveSuccess && (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Preferences saved!
              </span>
            )}
          </div>
        </form>

        {/* QR Code Destination & Mobile Scannability Panel */}
        <div className="pt-6 border-t border-slate-100">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📱 Phone QR Code Direct Web Routing</span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Live
                  </span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Scanning physical labels with an iPhone or Android camera immediately navigates directly to that possession&apos;s page.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 block">
                Target App Base URL:
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="url"
                  value={appUrl}
                  onChange={(e) => setAppUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-white"
                />
                <button
                  type="button"
                  onClick={handleSyncQrCodes}
                  disabled={isSyncingQr}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {isSyncingQr ? 'Syncing...' : 'Sync All QR Codes to Current Domain'}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 block">
                Example URL encoded: {appUrl.replace(/\/+$/, '')}/item/SOLK-000001
              </span>
            </div>

            {syncSuccess && (
              <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All QR codes across your inventory have been regenerated with the current domain!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backup & Data Management */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-600" />
            Data Backup & Restore
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Export a complete JSON backup of your possessions, categories, and appraisals
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70 space-y-2">
            <h4 className="font-bold text-xs text-slate-800">Export Inventory Data</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Download your entire inventory catalog, valuations history, QR codes, and custom categories as JSON.
            </p>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer mt-1"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Download Backup (JSON)</span>
            </button>
          </div>

          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70 space-y-2">
            <h4 className="font-bold text-xs text-slate-800">Restore from Backup</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upload a previously exported inventory backup file to restore records.
            </p>
            <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all shadow-xs cursor-pointer mt-1">
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Import Backup File</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
            </label>
          </div>
        </div>

        {/* Reset Demo Data Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-xs text-slate-800">Restore Sample Inventory</h4>
            <p className="text-[11px] text-slate-400">
              Reloads curated demo items (MacBook, Leica Q2, Barbour, Jordans) with realistic valuations.
            </p>
          </div>
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isResetting ? 'Resetting...' : 'Reset Demo Data'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
