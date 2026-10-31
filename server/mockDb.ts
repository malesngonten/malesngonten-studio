import { 
  AISettings, 
  DetectedAgent, 
  DoctorCheckItem, 
  DoctorReport,
  CompositionProps, 
  ChatMessage, 
  TestConnectionResult,
  SystemStatus 
} from '../src/contracts/types.js';
import { TemplateManifest, ExtensionManifest } from '../src/contracts/manifest.js';

/**
 * In-memory state for local-first BYOK Males Ngonten Studio
 * Keys are kept strictly in server memory and never sent to browser.
 */

interface ServerSecretStore {
  apiKey: string;
}

const secretStore: ServerSecretStore = {
  apiKey: '',
};

let currentAISettings: AISettings = {
  preset: 'custom',
  baseUrl: '',
  model: '',
  hasKey: false,
  maskedKey: '',
};

const initialCompositionProps: CompositionProps = {
  headline: 'STOP BIKIN KONTEN MANUAL!',
  highlightWord: 'MANUAL',
  subtext: 'Bikin video reels & tiktok 10x lebih cepat pakai Remotion + AI',
  tagline: '#MalesNgonten #CreatorEconomy',
  aspectRatio: '9:16',
  durationInSeconds: 6,
  fps: 30,
  primaryColor: '#ffffff', // Clean white
  accentColor: '#a1a1aa', // Muted silver/gray
  bgColor: '#0c0d10',
  fontStyle: 'display',
  animationPreset: 'kinetic-pop',
  authorHandle: '@official.malesngonten',
};

let currentComposition: CompositionProps = { ...initialCompositionProps };

const initialAgents: DetectedAgent[] = [
  {
    id: 'opencode',
    name: 'OpenCode CLI',
    command: 'opencode',
    status: 'siap',
    version: 'v1.4.2',
    description: 'Agen AI terminal open-source untuk otomasi kode Remotion.',
    langkahPerbaikan: 'Terhubung optimal. Tidak ada tindakan diperlukan.',
    isDefault: true,
  },
  {
    id: 'gemini-cli',
    name: 'Gemini CLI',
    command: 'gemini',
    status: 'belum_login',
    version: 'v0.9.1',
    description: 'CLI resmi untuk Google AI Studio & Gemini API.',
    langkahPerbaikan: "Jalankan 'gemini auth login' atau set env GOOGLE_GENAI_API_KEY di terminal lokal.",
  },
  {
    id: 'hermes',
    name: 'Hermes Agent',
    command: 'hermes-agent',
    status: 'tidak_terpasang',
    description: 'Autonomous scripting agent untuk pembuatan asset & video batching.',
    langkahPerbaikan: "Jalankan 'npm install -g @malesngonten/hermes-agent' di terminal Anda.",
  },
  {
    id: 'builtin-mock',
    name: 'Built-in Engine (Offline Mock)',
    command: 'internal',
    status: 'siap',
    version: 'v2.1.0-embedded',
    description: 'Mesin template lokal siap pakai tanpa koneksi eksternal.',
    langkahPerbaikan: 'Selalu siap melayani mode demo dan preview instan.',
  },
];

let agents: DetectedAgent[] = [...initialAgents];

const initialTemplates: TemplateManifest[] = [
  {
    name: 'kinetic-viral-hook',
    version: '1.2.0',
    title: 'Kinetic Text Viral Hook',
    author: 'Males Ngonten Studio',
    license: 'MIT',
    entry: 'src/templates/KineticViralHook.tsx',
    preview: '/assets/aistudio/Black_Cat_Animals___Pets_Logo_20261024_034747_0000_d2a38d28.png',
    description: 'Animasi tipografi kinetik bertenaga dengan punchline bertingkat, cocok untuk hook 3 detik pertama TikTok/Reels.',
    category: 'TikTok / Reels',
    aspectRatio: '9:16',
    fps: 30,
    durationInFrames: 180,
    dependencies: {
      'remotion': '^4.0.0',
      '@remotion/player': '^4.0.0',
    },
    requires: {
      node: '>=18.0.0',
      ffmpeg: true,
    },
    installed: true,
    tags: ['Kinetic', 'Reels', 'Hook', 'Typography'],
  },
  {
    name: 'podcast-highlight-reel',
    version: '2.0.1',
    title: 'Podcast Clip Audio Waveform',
    author: 'Reelify Labs',
    license: 'MIT',
    entry: 'src/templates/PodcastWave.tsx',
    preview: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80',
    description: 'Template potongan podcast otomatis lengkap dengan waveform dinamis, foto host bergetar lembut, dan subtitel karaoke.',
    category: 'Podcast Hook',
    aspectRatio: '9:16',
    fps: 30,
    durationInFrames: 300,
    dependencies: {
      '@remotion/media-utils': '^4.0.0',
      '@remotion/noise': '^4.0.0',
    },
    requires: {
      node: '>=18.0.0',
      ffmpeg: true,
    },
    installed: true,
    tags: ['Podcast', 'Waveform', 'Subtitles'],
  },
  {
    name: 'quote-aesthetic-minimal',
    version: '1.0.4',
    title: 'Aesthetic Quotes Generator',
    author: 'Sipemalas Kreatif',
    license: 'Apache-2.0',
    entry: 'src/templates/QuoteMinimal.tsx',
    preview: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&auto=format&fit=crop&q=80',
    description: 'Kutipan motivasi tenang dengan latar belakang ambient bokeh, transisi fade elegan, dan watermark akun Instagram.',
    category: 'Quote Motivasi',
    aspectRatio: '9:16',
    fps: 30,
    durationInFrames: 210,
    dependencies: {
      'remotion': '^4.0.0',
    },
    requires: {
      node: '>=18.0.0',
    },
    installed: false,
    tags: ['Quotes', 'Minimal', 'Chill', 'Motivasi'],
  },
  {
    name: 'tech-news-bulletin',
    version: '1.1.0',
    title: 'Tech Flash & AI News Recap',
    author: 'Kreator Koding',
    license: 'MIT',
    entry: 'src/templates/TechNews.tsx',
    preview: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
    description: 'Format berita kilat tech: ticker berjalan di bawah, thumbnail headline bergaya cyber, dan timer 60 detik.',
    category: 'Berita Singkat',
    aspectRatio: '9:16',
    fps: 30,
    durationInFrames: 450,
    dependencies: {
      '@remotion/paths': '^4.0.0',
    },
    requires: {
      node: '>=20.0.0',
      ffmpeg: true,
      chromium: true,
    },
    installed: false,
    tags: ['Tech', 'News', 'Cyber', 'Ticker'],
  },
];

let templates: TemplateManifest[] = [...initialTemplates];

const initialExtensions: ExtensionManifest[] = [
  {
    id: 'ext-remotion-shapes',
    name: '@remotion/shapes',
    type: 'library',
    version: '4.0.120',
    author: 'Remotion Core Team',
    source: 'npm registry (resmi)',
    description: 'Komponen SVG dan bentuk geometris seperti bintang, poligon, dan lingkaran beranimasi untuk dekorasi video.',
    enabled: true,
    permissions: ['Render SVG di canvas'],
    requiredNpmPackages: ['@remotion/shapes'],
  },
  {
    id: 'ext-slang-subtitler',
    name: 'Indonesian Slang Subtitler',
    type: 'skill',
    version: '1.3.0',
    author: 'Males Ngonten Community',
    source: 'local ~/.malesngonten/skills',
    description: 'Skill AI untuk otomatis memformat kata-kata gaul Indonesia (bgt, yg, bgt, otw) menjadi teks yang natural di video.',
    enabled: true,
    permissions: ['Akses teks prompt AI'],
  },
  {
    id: 'ext-kinetic-typo-pack',
    name: 'Kinetic Typography Pack v2',
    type: 'component',
    version: '2.1.0',
    author: 'MotionCraft',
    source: 'github.com/malesngonten/kinetic-pack',
    description: 'Kumpulan 14 preset animasi teks siap pakai: bounce, wobble, glitch, neon pulse, dan 3D pop.',
    enabled: true,
    permissions: ['Injeksi style CSS ke composition'],
  },
  {
    id: 'ext-tiktok-hook-agent',
    name: 'Viral TikTok Hook Generator',
    type: 'skill',
    version: '1.0.5',
    author: 'GrowthHacker ID',
    source: 'local ~/.malesngonten/skills',
    description: 'Skill prompt AI untuk menguji 5 alternatif hook psikologis (fear of missing out, kontroversi, rasa penasaran).',
    enabled: false,
    permissions: ['Generasi hook teks'],
  },
  {
    id: 'ext-remotion-noise',
    name: '@remotion/noise',
    type: 'library',
    version: '4.0.88',
    author: 'Remotion Core Team',
    source: 'npm registry (resmi)',
    description: 'Algoritma Perlin & Simplex noise untuk animasi latar belakang cairan, awan, atau partikel organik.',
    enabled: false,
    permissions: ['Matematika procedural generation'],
    requiredNpmPackages: ['@remotion/noise'],
  },
];

let extensions: ExtensionManifest[] = [...initialExtensions];

const initialChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'assistant',
    text: 'Halo! Saya asisten video Males Ngonten Studio. Ketikkan ide video yang ingin Anda buat, atau gunakan template bawaan kami di atas.',
    timestamp: 'Baru saja',
  },
];

let chatMessages: ChatMessage[] = [...initialChatMessages];

export const mockDb = {
  getAISettings: (): AISettings => ({
    ...currentAISettings,
    hasKey: Boolean(secretStore.apiKey && secretStore.apiKey.trim().length > 0),
    maskedKey: secretStore.apiKey 
      ? `${secretStore.apiKey.slice(0, 4)}...${secretStore.apiKey.slice(-4)}`
      : '',
  }),

  getRawApiKey: (): string => secretStore.apiKey,

  updateAISettings: (payload: { preset: any; baseUrl: string; model: string; apiKey?: string }): AISettings => {
    currentAISettings.preset = payload.preset;
    currentAISettings.baseUrl = payload.baseUrl;
    currentAISettings.model = payload.model;
    if (payload.apiKey !== undefined && payload.apiKey.trim() !== '') {
      secretStore.apiKey = payload.apiKey.trim();
    }
    return mockDb.getAISettings();
  },

  testAIConnection: (simulatedError?: string): TestConnectionResult => {
    // If simulated error is explicitly requested
    if (simulatedError === 'invalid_key') {
      return {
        success: false,
        errorType: 'invalid_key',
        message: 'Kunci API (API Key) salah atau tidak valid. Periksa kembali token dari penyedia Anda.',
      };
    }
    if (simulatedError === 'quota_exceeded') {
      return {
        success: false,
        errorType: 'quota_exceeded',
        message: 'Kredit atau kuota akun habis (429 Rate Limit / Insufficient Quota). Silakan isi saldo provider Anda.',
      };
    }
    if (simulatedError === 'model_not_found') {
      return {
        success: false,
        errorType: 'model_not_found',
        message: `Model "${currentAISettings.model}" tidak ditemukan di provider ini. Periksa penulisan model name.`,
      };
    }

    // Default connection behavior based on whether key is configured
    if (!secretStore.apiKey && currentAISettings.preset !== 'ollama' && currentAISettings.preset !== 'lmstudio') {
      return {
        success: false,
        errorType: 'invalid_key',
        message: 'API Key belum diisi. Masukkan API Key terlebih dahulu atau pilih provider lokal (Ollama / LM Studio).',
      };
    }

    return {
      success: true,
      message: `Koneksi berhasil! Provider: ${currentAISettings.preset.toUpperCase()}, Model: ${currentAISettings.model} merespon dalam 142ms.`,
      latencyMs: 142,
      detectedModel: currentAISettings.model,
    };
  },

  getSystemStatus: (): SystemStatus => {
    const hasKey = Boolean(secretStore.apiKey || currentAISettings.preset === 'ollama' || currentAISettings.preset === 'lmstudio');
    const hasModel = Boolean(currentAISettings.model && currentAISettings.model.trim().length > 0);
    const isConfigured = hasKey && hasModel;
    const activeAgent = agents.find(a => a.status === 'siap') || agents[0];
    
    return {
      isConfigured,
      isDemoMode: !isConfigured,
      activeProvider: currentAISettings.preset === 'custom' 
        ? 'Custom (OpenAI)' 
        : currentAISettings.preset.toUpperCase(),
      activeModel: currentAISettings.model || 'Belum dipilih',
      activeAgent: activeAgent.name,
      agentStatus: activeAgent.status,
    };
  },

  getAgents: (): DetectedAgent[] => agents,

  updateAgentStatus: (agentId: string, status: any): DetectedAgent | undefined => {
    const ag = agents.find(a => a.id === agentId);
    if (ag) {
      ag.status = status;
      if (status === 'siap') {
        ag.langkahPerbaikan = 'Terhubung optimal dan siap digunakan.';
      }
    }
    return ag;
  },

  getTemplates: (): TemplateManifest[] => templates,

  installTemplate: (templateName: string): TemplateManifest | undefined => {
    const t = templates.find(item => item.name === templateName);
    if (t) {
      t.installed = true;
    }
    return t;
  },

  addCustomTemplate: (manifest: TemplateManifest): TemplateManifest => {
    const exists = templates.find(t => t.name === manifest.name);
    if (exists) {
      Object.assign(exists, manifest, { installed: true });
      return exists;
    }
    manifest.installed = true;
    templates.unshift(manifest);
    return manifest;
  },

  getExtensions: (): ExtensionManifest[] => extensions,

  toggleExtension: (id: string, enabled?: boolean): ExtensionManifest | undefined => {
    const ext = extensions.find(e => e.id === id);
    if (ext) {
      ext.enabled = enabled !== undefined ? enabled : !ext.enabled;
    }
    return ext;
  },

  installExtension: (ext: ExtensionManifest): ExtensionManifest => {
    const exists = extensions.find(e => e.id === ext.id);
    if (exists) {
      exists.enabled = true;
      return exists;
    }
    extensions.push({ ...ext, enabled: true });
    return ext;
  },

  getComposition: (): CompositionProps => currentComposition,

  updateComposition: (patch: Partial<CompositionProps>): CompositionProps => {
    currentComposition = {
      ...currentComposition,
      ...patch,
    };
    return currentComposition;
  },

  getDoctorReport: (): DoctorReport => {
    return {
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      os: 'Linux (x86_64 Local Daemon)',
      arch: 'x64',
      allHealthy: true,
      items: [
        {
          id: 'check-node',
          name: 'Node.js Runtime',
          category: 'runtime',
          status: 'pass',
          version: 'v22.14.0',
          details: 'Node.js terpasang dengan versi modern yang mendukung ES Modules & streaming.',
          suggestedFix: 'Sudah optimal.',
        },
        {
          id: 'check-ffmpeg',
          name: 'FFmpeg Video Processor',
          category: 'media',
          status: 'pass',
          version: 'v6.1.1-static',
          details: 'Binary ffmpeg & ffprobe terdeteksi di PATH sistem untuk proses video encoding & muxing.',
          suggestedFix: 'Jika error di Windows/Mac lokal: Jalankan "brew install ffmpeg" atau "winget install ffmpeg".',
          fixCommand: 'brew install ffmpeg',
        },
        {
          id: 'check-chromium',
          name: 'Headless Chromium / Puppeteer',
          category: 'media',
          status: 'pass',
          version: 'v124.0 (Remotion Bundled)',
          details: 'Browser engine tersedia untuk merender canvas Remotion frame-demi-frame.',
          suggestedFix: 'Remotion mengunduh chromium secara otomatis saat pertama kali render.',
        },
        {
          id: 'check-agent-opencode',
          name: 'OpenCode CLI Local Daemon',
          category: 'agent',
          status: 'pass',
          version: 'v1.4.2',
          details: 'Socket CLI aktif di /tmp/opencode.sock dan merespon dalam 12ms.',
          suggestedFix: 'Layanan berjalan normal.',
        },
        {
          id: 'check-gemini-cli',
          name: 'Gemini CLI Authentication',
          category: 'agent',
          status: 'warn',
          version: 'v0.9.1',
          details: 'CLI terpasang tetapi kredensial auth login belum ditemukan.',
          suggestedFix: 'Jalankan "gemini auth login" di terminal lokal Anda untuk sinkronisasi token otomatis.',
          fixCommand: 'gemini auth login',
        },
        {
          id: 'check-port',
          name: 'Local Daemon Socket Binding',
          category: 'network',
          status: 'pass',
          version: '127.0.0.1:3000',
          details: 'Server terikat secara ketat pada 127.0.0.1 (hanya akses lokal, aman dari jaringan luar).',
          suggestedFix: 'Port 3000 dalam status listen (ESTABLISHED).',
        },
      ],
    };
  },

  getChatMessages: (): ChatMessage[] => chatMessages,

  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage => {
    const newMsg: ChatMessage = {
      ...msg,
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };
    chatMessages.push(newMsg);
    return newMsg;
  },
};
