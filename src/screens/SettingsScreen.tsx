import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Server, 
  CheckCircle2, 
  XCircle, 
  Cpu, 
  ShieldCheck, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Terminal, 
  Sparkles
} from 'lucide-react';
import { AISettings, AISettingsPayload, DetectedAgent, ProviderPreset, TestConnectionResult } from '../contracts/types.ts';
import { apiClient } from '../api/client.ts';

const PRESET_CONFIGS: Record<ProviderPreset, { name: string; defaultBaseUrl: string; note: string; requiresKey: boolean; exampleModels?: string[] }> = {
  custom: {
    name: 'Custom (OpenAI-Compatible)',
    defaultBaseUrl: 'https://api.openai.com/v1',
    note: 'Gunakan endpoint API kompatibel OpenAI mana pun.',
    requiresKey: true,
    exampleModels: ['gpt-4o-mini', 'gpt-4o', 'qwen-2.5-72b'],
  },
  nvidia: {
    name: 'NVIDIA NIM (build.nvidia.com)',
    defaultBaseUrl: 'https://integrate.api.nvidia.com/v1',
    note: 'Inference resmi NVIDIA NIM. Tentukan model pilihan Anda atau klik Ambil Model dari Akun.',
    requiresKey: true,
    exampleModels: ['mistralai/mistral-7b-instruct-v0.3', 'deepseek-ai/deepseek-v4.1-flash', 'nv-mistralai/mistral-nemo-12b-instruct'],
  },
  openrouter: {
    name: 'OpenRouter (Agregator Multi-Model)',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    note: 'Akses ratusan model AI open-source & komersial dengan satu API key.',
    requiresKey: true,
    exampleModels: ['deepseek/deepseek-r1:free', 'meta-llama/llama-3.3-70b-instruct', 'google/gemini-2.5-flash'],
  },
  groq: {
    name: 'Groq Cloud (Super Cepat)',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    note: 'Inference LPU berkecepatan sangat tinggi (~500 token/detik).',
    requiresKey: true,
    exampleModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
  },
  ollama: {
    name: 'Ollama (Lokal 100% Gratis & Offline)',
    defaultBaseUrl: 'http://127.0.0.1:11434/v1',
    note: 'Berjalan di GPU/CPU lokal komputer Anda. Tidak membutuhkan API key.',
    requiresKey: false,
    exampleModels: ['llama3:latest', 'mistral:latest', 'qwen2.5:7b'],
  },
  lmstudio: {
    name: 'LM Studio (Lokal UI)',
    defaultBaseUrl: 'http://127.0.0.1:1234/v1',
    note: 'Server lokal dari aplikasi LM Studio desktop.',
    requiresKey: false,
    exampleModels: ['local-model'],
  },
  together: {
    name: 'Together AI',
    defaultBaseUrl: 'https://api.together.xyz/v1',
    note: 'Platform inference open-weights berkecepatan tinggi.',
    requiresKey: true,
    exampleModels: ['meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo'],
  },
  deepseek: {
    name: 'DeepSeek Official',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    note: 'Model penalaran tingkat tinggi dengan biaya terjangkau.',
    requiresKey: true,
    exampleModels: ['deepseek-chat', 'deepseek-reasoner'],
  },
};

interface SettingsScreenProps {
  onSettingsSaved: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onSettingsSaved }) => {
  const [settings, setSettings] = useState<AISettings>({
    preset: 'custom',
    baseUrl: 'https://api.openai.com/v1',
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
  const [simulatedErrorMode, setSimulatedErrorMode] = useState<string>('none');

  // Agents
  const [agents, setAgents] = useState<DetectedAgent[]>([]);

  useEffect(() => {
    loadSettingsAndAgents();
  }, []);

  const loadSettingsAndAgents = async () => {
    try {
      const [aiData, agentData] = await Promise.all([
        apiClient.getAISettings(),
        apiClient.getAgents(),
      ]);
      setSettings(aiData);
      setAgents(agentData);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePresetChange = (preset: ProviderPreset) => {
    const cfg = PRESET_CONFIGS[preset];
    setSettings((prev) => ({
      ...prev,
      preset,
      baseUrl: cfg.defaultBaseUrl,
      // Model is NOT predetermined. It is explicitly chosen by the user.
    }));
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

    const errorParam = simulatedErrorMode !== 'none' ? simulatedErrorMode : undefined;

    try {
      const res = await apiClient.testAIConnection(errorParam);
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

  const handleToggleAgentStatus = async (agentId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'siap' ? 'belum_login' : 'siap';
    try {
      const updated = await apiClient.updateAgentStatus(agentId, nextStatus);
      setAgents((prev) => prev.map((a) => (a.id === agentId ? updated : a)));
      onSettingsSaved();
    } catch (err) {
      console.error(err);
    }
  };

  const getAgentStatusBadge = (status: DetectedAgent['status']) => {
    switch (status) {
      case 'siap':
        return {
          label: 'Siap Digunakan',
          className: 'bg-emerald-500/15 text-emerald-300',
          dot: 'bg-emerald-400',
        };
      case 'belum_login':
        return {
          label: 'Belum Login',
          className: 'bg-amber-500/15 text-amber-300',
          dot: 'bg-amber-400',
        };
      case 'tidak_terpasang':
        return {
          label: 'Tidak Terpasang',
          className: 'bg-white/10 text-zinc-400',
          dot: 'bg-zinc-500',
        };
      case 'error':
        return {
          label: 'Error',
          className: 'bg-white/10 text-zinc-300',
          dot: 'bg-zinc-400',
        };
    }
  };

  const currentPresetConfig = PRESET_CONFIGS[settings.preset];

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-5 pb-24 md:pb-12 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-normal text-white flex items-center gap-2.5">
          <Key className="w-5 h-5 text-white" /> Pengaturan AI & BYOK
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Bawa API key Anda sendiri (Bring Your Own Key) atau hubungkan ke model AI lokal.
        </p>
      </div>

      {/* Security Architecture Notice */}
      <div className="rounded-3xl bg-gradient-to-b from-[#1c1d22] to-[#121316] p-4 text-xs text-zinc-300 space-y-1.5 shadow-md">
        <div className="flex items-center gap-2 font-medium text-white">
          <ShieldCheck className="w-4 h-4 shrink-0 text-zinc-300" />
          <span>Arsitektur Keamanan Zero-Exposure API Key</span>
        </div>
        <p className="text-zinc-400 leading-relaxed pl-6">
          Kunci API tidak pernah dikirim ke browser publik. Server Node lokal Anda menyimpan key di memori server dan bertindak sebagai proxy aman.
        </p>
      </div>

      {/* Form: AI Provider Configuration */}
      <div className="rounded-3xl bg-gradient-to-b from-[#1c1d22] to-[#121316] p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between pb-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-zinc-300" /> Konfigurasi Provider AI
          </h2>
          <span className="text-[11px] font-mono text-zinc-500">OpenAI Compatible Format</span>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          {/* Preset Dropdown */}
          <div className="space-y-1.5">
            <label className="font-medium text-zinc-300">Pilih Preset Provider</label>
            <select
              value={settings.preset}
              onChange={(e) => handlePresetChange(e.target.value as ProviderPreset)}
              className="w-full rounded-2xl bg-[#181a20] px-4 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white/30 cursor-pointer"
            >
              {Object.entries(PRESET_CONFIGS).map(([key, cfg]) => (
                <option key={key} value={key} className="bg-[#181a20] text-white">
                  {cfg.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-zinc-500">{currentPresetConfig.note}</p>
          </div>

          {/* Base URL Input */}
          <div className="space-y-1.5">
            <label className="font-medium text-zinc-300">Base URL Endpoint</label>
            <input
              type="text"
              value={settings.baseUrl}
              onChange={(e) => setSettings({ ...settings, baseUrl: e.target.value })}
              placeholder="https://api.example.com/v1"
              required
              className="w-full rounded-2xl bg-[#181a20] px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-white/30"
            />
          </div>

          {/* Model Name Input (User-chosen) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-medium text-zinc-300">
                Pilih / Tentukan Model AI <span className="text-zinc-400">*</span>
              </label>
              <button
                type="button"
                onClick={handleFetchModels}
                disabled={isFetchingModels}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#22242c] hover:bg-[#2b2d35] text-zinc-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
                title="Ambil daftar model yang tersedia langsung dari provider ini"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetchingModels ? 'animate-spin' : ''}`} />
                <span>{isFetchingModels ? 'Mengambil Model...' : 'Ambil Model dari Akun'}</span>
              </button>
            </div>

            {/* If models were fetched from provider, show dropdown selector */}
            {fetchedModels.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#22242c] to-[#18191e] space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-200 font-medium">
                    {fetchedModels.length} Model Terdeteksi dari Akun Provider:
                  </span>
                  <span className="text-[10px] text-zinc-400">Pilih salah satu</span>
                </div>
                <select
                  value={settings.model}
                  onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                  className="w-full rounded-xl bg-[#111216] px-3.5 py-2 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-white/30 cursor-pointer"
                >
                  <option value="">-- Pilih Model dari Daftar Akun Anda --</option>
                  {fetchedModels.map((m) => (
                    <option key={m} value={m} className="bg-[#111216] text-white">
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {fetchModelsError && (
              <p className="text-[11px] text-amber-400">
                {fetchModelsError}
              </p>
            )}

            {/* Manual input for any model the user wants */}
            <div className="space-y-1">
              <input
                type="text"
                value={settings.model}
                onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                placeholder="Ketik nama model pilihan Anda (contoh: mistralai/mistral-7b-instruct-v0.3, gpt-4o)..."
                required
                className="w-full rounded-2xl bg-[#181a20] px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-white/30"
              />
              {!settings.model && (
                <p className="text-[11px] text-zinc-400">
                  Model belum dipilih. Ketik nama model Anda di atas atau klik &quot;Ambil Model dari Akun&quot;.
                </p>
              )}
            </div>

            {/* Optional reference examples */}
            {currentPresetConfig.exampleModels && currentPresetConfig.exampleModels.length > 0 && (
              <div className="pt-1">
                <span className="text-[10px] text-zinc-400 block mb-1">
                  Contoh format model di {currentPresetConfig.name} (klik jika ingin menggunakan):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentPresetConfig.exampleModels.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSettings({ ...settings, model: m })}
                      className={`px-2.5 py-1 rounded-full font-mono text-[10px] transition-colors cursor-pointer ${
                        settings.model === m
                          ? 'bg-white text-black font-semibold shadow-sm'
                          : 'bg-[#181a20] text-zinc-400 hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* API Key Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-medium text-zinc-300 flex items-center gap-1.5">
                <span>API Key</span>
                {!currentPresetConfig.requiresKey && (
                  <span className="text-[10px] text-zinc-400 font-normal">(Opsional untuk server lokal)</span>
                )}
              </label>
              {settings.hasKey && (
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Tersimpan ({settings.maskedKey})
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={settings.hasKey ? '•••••••••••••••• (Ketik untuk mengganti key baru)' : 'Masukkan API key (sk-...)'}
                className="w-full rounded-2xl bg-[#181a20] px-4 py-2.5 pr-10 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-white/30"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
                aria-label={showKey ? 'Sembunyikan Key' : 'Tampilkan Key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Actions & Feedback */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="w-full sm:w-auto">
              {saveSuccess && (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" /> Pengaturan berhasil disimpan!
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-white hover:bg-zinc-200 disabled:opacity-50 text-black font-semibold text-xs transition-all shadow-md cursor-pointer"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </button>
          </div>
        </form>
      </div>

      {/* Test Connection Section */}
      <div className="rounded-3xl bg-gradient-to-b from-[#1c1d22] to-[#121316] p-5 sm:p-6 shadow-xl space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-zinc-300" /> Uji Koneksi API (Connection Test)
          </h2>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Verifikasi apakah API Key dan Model merespon dengan benar.
          </p>
        </div>

        {/* Diagnostic Simulator Pills */}
        <div className="space-y-1.5 text-xs">
          <label className="text-zinc-400">Mode Simulasi Pengujian (Uji Respons Error):</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'none', label: 'Realistis / Normal' },
              { id: 'invalid_key', label: 'Key Salah (401)' },
              { id: 'quota_exceeded', label: 'Kuota Habis (429)' },
              { id: 'model_not_found', label: 'Model Tak Ada (404)' },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setSimulatedErrorMode(mode.id)}
                className={`px-3 py-1.5 rounded-full text-center transition-colors text-[11px] cursor-pointer ${
                  simulatedErrorMode === mode.id
                    ? 'bg-[#2f323c] text-white font-medium shadow-sm'
                    : 'bg-[#181a20] text-zinc-400 hover:text-white'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Test Button */}
        <div>
          <button
            onClick={handleTestConnection}
            disabled={isTesting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#22242c] hover:bg-[#2c2f38] disabled:opacity-50 text-white font-medium text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            {isTesting ? 'Menguji Sambungan...' : 'Tes Koneksi Sekarang'}
          </button>
        </div>

        {/* Result Card */}
        {testResult && (
          <div
            className={`p-4 rounded-2xl text-xs space-y-1.5 animate-in fade-in duration-200 ${
              testResult.success
                ? 'bg-gradient-to-b from-[#18231c] to-[#121815] text-emerald-200'
                : 'bg-gradient-to-b from-[#251a1a] to-[#171111] text-zinc-200'
            }`}
          >
            <div className="flex items-center gap-2 font-semibold text-sm">
              {testResult.success ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Koneksi Berhasil!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-zinc-400" />
                  <span className="text-white">Koneksi Gagal ({testResult.errorType || 'Error'})</span>
                </>
              )}
            </div>
            <p className="leading-relaxed text-zinc-300">{testResult.message}</p>
            {testResult.latencyMs && (
              <p className="text-[11px] opacity-70 font-mono">
                Latensi respons server: {testResult.latencyMs}ms
              </p>
            )}
          </div>
        )}
      </div>

      {/* Detected Agents List */}
      <div className="rounded-3xl bg-gradient-to-b from-[#1c1d22] to-[#121316] p-5 sm:p-6 shadow-xl space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-zinc-300" /> Agen AI Lokal Terdeteksi (Detected Agents)
          </h2>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            CLI dan alat otomasi yang terpasang di sistem lokal Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {agents.map((agent) => {
            const badge = getAgentStatusBadge(agent.status);
            return (
              <div
                key={agent.id}
                className="p-4 rounded-2xl bg-gradient-to-b from-[#181a20] to-[#111216] flex flex-col justify-between space-y-3 shadow-md"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-white text-xs flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-zinc-400" /> {agent.name}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${badge.className}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      {badge.label}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-snug">
                    {agent.description}
                  </p>
                </div>

                {/* Langkah Perbaikan Box */}
                <div className="pt-2 space-y-1">
                  <span className="text-[10px] font-medium text-zinc-500 block uppercase tracking-wider">
                    Langkah Perbaikan:
                  </span>
                  <div className="rounded-xl bg-black/80 p-2.5 font-mono text-[10px] text-zinc-300 break-words">
                    {agent.langkahPerbaikan}
                  </div>
                </div>

                {/* Quick Toggle Action to simulate agent state */}
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {agent.version || 'v1.0.0'}
                  </span>
                  <button
                    onClick={() => handleToggleAgentStatus(agent.id, agent.status)}
                    className="text-[10px] text-zinc-300 hover:text-white underline font-medium cursor-pointer"
                  >
                    {agent.status === 'siap' ? 'Uji Status Belum Login' : 'Uji Status Siap'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
