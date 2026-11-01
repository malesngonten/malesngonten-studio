import React, { useState, useEffect } from 'react';
import { 
  Key, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { AISettings, AISettingsPayload, ProviderPreset, TestConnectionResult } from '../contracts/types.ts';
import { apiClient } from '../api/client.ts';

const PRESET_CONFIGS: Record<ProviderPreset, { name: string; defaultBaseUrl: string; requiresKey: boolean; getKeyUrl?: string; exampleModels: string[] }> = {
  custom: {
    name: 'Universal / Bebas',
    defaultBaseUrl: '',
    requiresKey: true,
    exampleModels: ['gpt-4o-mini', 'llama-3.3-70b-versatile', 'gemini-3.8-flash', 'deepseek-chat'],
  },
  groq: {
    name: 'Groq Cloud',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    requiresKey: true,
    getKeyUrl: 'https://console.groq.com/keys',
    exampleModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'],
  },
  gemini: {
    name: 'Google Gemini',
    defaultBaseUrl: 'https://generativelanguage.googleapis.com',
    requiresKey: true,
    getKeyUrl: 'https://aistudio.google.com/app/apikey',
    exampleModels: ['gemini-3.8-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
  },
  ollama: {
    name: 'Ollama (Lokal)',
    defaultBaseUrl: 'http://127.0.0.1:11434/v1',
    requiresKey: false,
    exampleModels: ['llama3:latest', 'mistral:latest', 'qwen2.5:7b'],
  },
  lmstudio: {
    name: 'LM Studio (Lokal)',
    defaultBaseUrl: 'http://127.0.0.1:1234/v1',
    requiresKey: false,
    exampleModels: ['local-model'],
  },
  openrouter: {
    name: 'OpenRouter',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    requiresKey: true,
    getKeyUrl: 'https://openrouter.ai/keys',
    exampleModels: ['google/gemini-2.5-flash', 'deepseek/deepseek-r1:free', 'meta-llama/llama-3.3-70b-instruct'],
  },
  deepseek: {
    name: 'DeepSeek',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    requiresKey: true,
    getKeyUrl: 'https://platform.deepseek.com',
    exampleModels: ['deepseek-chat', 'deepseek-reasoner'],
  },
  together: {
    name: 'Together AI',
    defaultBaseUrl: 'https://api.together.xyz/v1',
    requiresKey: true,
    exampleModels: ['meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo'],
  },
  nvidia: {
    name: 'NVIDIA NIM',
    defaultBaseUrl: 'https://integrate.api.nvidia.com/v1',
    requiresKey: true,
    exampleModels: ['mistralai/mistral-7b-instruct-v0.3'],
  },
};

interface SettingsScreenProps {
  onSettingsSaved: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onSettingsSaved }) => {
  const [settings, setSettings] = useState<AISettings>({
    preset: 'custom',
    baseUrl: '',
    model: '',
    hasKey: false,
    maskedKey: '',
  });

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Live Provider Models Fetch
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [fetchModelsError, setFetchModelsError] = useState<string | null>(null);

  // Test connection state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await apiClient.getAISettings();
      setSettings(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePresetSelect = (preset: ProviderPreset) => {
    const cfg = PRESET_CONFIGS[preset];
    setSettings((prev) => ({
      ...prev,
      preset,
      baseUrl: cfg.defaultBaseUrl,
      model: cfg.exampleModels[0] || prev.model,
    }));
    setTestResult(null);
  };

  const handleFetchModels = async () => {
    setIsFetchingModels(true);
    setFetchModelsError(null);
    try {
      const res = await apiClient.fetchProviderModels({
        baseUrl: settings.baseUrl,
        apiKey: apiKeyInput.trim() || undefined,
      });
      setFetchedModels(res.models);
    } catch (err: any) {
      setFetchModelsError(err.message || 'Gagal mengambil daftar model');
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const payload: AISettingsPayload = {
        preset: settings.preset,
        baseUrl: settings.baseUrl,
        model: settings.model,
        apiKey: apiKeyInput.trim() ? apiKeyInput.trim() : undefined,
      };

      const res = await apiClient.saveAISettings(payload);
      setSettings(res);
      setApiKeyInput('');
      setSaveSuccess(true);
      onSettingsSaved();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(`Gagal menyimpan: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await apiClient.testAIConnection();
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Koneksi gagal',
        errorType: err.details?.errorType || 'network_error',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const currentPresetConfig = PRESET_CONFIGS[settings.preset] || PRESET_CONFIGS.custom;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-16 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Key className="w-7 h-7 text-sky-400" />
          Pengaturan AI
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 mt-2">
          Hubungkan penyedia AI pilihan Anda. Sistem mendukung semua provider secara bebas.
        </p>
      </div>

      {/* Main Clean Form (No Borders) */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Provider Quick Picker */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-base font-semibold text-white">
              Pilihan Layanan AI
            </label>
            {currentPresetConfig.getKeyUrl && (
              <a
                href={currentPresetConfig.getKeyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:text-sky-300 text-xs sm:text-sm flex items-center gap-1 underline"
              >
                <span>Daftar Kunci Gratis</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['custom', 'groq', 'gemini', 'openai', 'ollama', 'lmstudio', 'openrouter', 'deepseek'] as const).map((p) => {
              const isSelected = settings.preset === p;
              const label = p === 'custom' 
                ? 'Bebas / Universal' 
                : p === 'openai' 
                ? 'OpenAI' 
                : PRESET_CONFIGS[p]?.name || p;

              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => handlePresetSelect(p as ProviderPreset)}
                  className={`px-4 py-2.5 rounded-2xl text-sm font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-black font-semibold shadow-md'
                      : 'bg-[#181a22] text-zinc-300 hover:text-white hover:bg-[#222430]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Server Address (Base URL) */}
        <div className="space-y-2">
          <label className="text-base font-semibold text-white block">
            Alamat Server (Base URL)
          </label>
          <input
            type="text"
            value={settings.baseUrl}
            onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
            placeholder="https://api.openai.com/v1 atau http://127.0.0.1:11434/v1"
            required
            className="w-full rounded-2xl bg-[#14161f] px-4 py-3.5 text-base text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-sky-400 font-mono"
          />
        </div>

        {/* API Key */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-base font-semibold text-white">
              Kunci API (API Key)
            </label>
            {settings.hasKey && (
              <span className="text-xs sm:text-sm text-emerald-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>Tersimpan</span>
              </span>
            )}
          </div>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={settings.hasKey ? '•••••••••••••••• (Kunci tersimpan)' : 'Tempel kunci API Anda di sini...'}
              className="w-full rounded-2xl bg-[#14161f] px-4 py-3.5 pr-12 text-base text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 cursor-pointer"
              aria-label={showKey ? 'Sembunyikan Kunci' : 'Tampilkan Kunci'}
            >
              {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500">
            * Kosongkan jika menggunakan server lokal offline (Ollama atau LM Studio).
          </p>
        </div>

        {/* Model Name */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-base font-semibold text-white">
              Nama Model AI
            </label>
            <button
              type="button"
              onClick={handleFetchModels}
              disabled={isFetchingModels || !settings.baseUrl}
              className="text-xs sm:text-sm text-sky-400 hover:text-sky-300 disabled:opacity-40 flex items-center gap-1.5 cursor-pointer font-medium"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingModels ? 'animate-spin' : ''}`} />
              <span>{isFetchingModels ? 'Memeriksa...' : 'Cek Model Provider'}</span>
            </button>
          </div>

          <input
            type="text"
            value={settings.model}
            onChange={(e) => setSettings({ ...settings, model: e.target.value })}
            placeholder="gpt-4o-mini, llama-3.3-70b-versatile, gemini-3.8-flash, dll"
            required
            className="w-full rounded-2xl bg-[#14161f] px-4 py-3.5 text-base text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-sky-400 font-mono"
          />

          {/* Quick recommendations */}
          {currentPresetConfig.exampleModels.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-zinc-500">Pilihan cepat:</span>
              {currentPresetConfig.exampleModels.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSettings({ ...settings, model: m })}
                  className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-mono transition-colors cursor-pointer ${
                    settings.model === m
                      ? 'bg-sky-500 text-white font-medium'
                      : 'bg-[#181a22] text-zinc-400 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}

          {/* Fetched models from live endpoint */}
          {fetchedModels.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <span className="text-xs text-emerald-400 font-medium">Model tersedia di server Anda:</span>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 rounded-2xl bg-[#101117]">
                {fetchedModels.slice(0, 15).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSettings({ ...settings, model: m })}
                    className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                      settings.model === m
                        ? 'bg-emerald-500 text-white font-medium'
                        : 'bg-[#181a22] text-zinc-300 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {fetchModelsError && (
            <p className="text-xs text-amber-400 pt-1">{fetchModelsError}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-black hover:bg-zinc-200 font-semibold text-base transition-all cursor-pointer shadow-lg active:scale-95 disabled:opacity-40"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-[#1e2029] hover:bg-[#282b37] text-white font-medium text-base transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                <span>Menguji...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>Uji Koneksi AI</span>
              </>
            )}
          </button>

          {saveSuccess && (
            <span className="text-emerald-400 text-sm font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Tersimpan!</span>
            </span>
          )}
        </div>
      </form>

      {/* Test Connection Result */}
      {testResult && (
        <div
          className={`p-4 rounded-2xl text-sm flex items-start gap-3 ${
            testResult.success
              ? 'bg-emerald-500/15 text-emerald-200'
              : 'bg-rose-500/15 text-rose-200'
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <p className="font-semibold text-base">{testResult.success ? 'Koneksi Berhasil!' : 'Koneksi Gagal'}</p>
            <p className="text-xs sm:text-sm opacity-90 leading-relaxed">{testResult.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};
