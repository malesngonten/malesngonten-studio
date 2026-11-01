import { Router } from 'express';
import { mockDb } from './mockDb.js';
import { TemplateManifest } from '../src/contracts/manifest.js';

export const apiRouter = Router();

/**
 * Universal endpoint resolvers for ANY OpenAI-compatible provider:
 * Handles trailing slashes, full endpoints, missing /v1, etc.
 */
export function resolveChatEndpoint(baseUrl: string): string {
  let url = (baseUrl || '').trim().replace(/\/+$/, '');
  if (!url) {
    return 'https://api.openai.com/v1/chat/completions';
  }
  if (url.includes('generativelanguage.googleapis.com')) {
    if (url.endsWith('/chat/completions')) return url;
    return 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
  }
  if (url.endsWith('/chat/completions')) {
    return url;
  }
  if (url.endsWith('/v1')) {
    return `${url}/chat/completions`;
  }
  if (url.endsWith('/v1/')) {
    return `${url.slice(0, -1)}/chat/completions`;
  }
  // If baseUrl does not contain /v1 or /api (e.g., http://localhost:11434)
  if (!url.includes('/v1') && !url.includes('/api/')) {
    return `${url}/v1/chat/completions`;
  }
  return `${url}/chat/completions`;
}

export function resolveModelsEndpoint(baseUrl: string): string {
  let url = (baseUrl || '').trim().replace(/\/+$/, '');
  if (!url) {
    return 'https://api.openai.com/v1/models';
  }
  if (url.includes('generativelanguage.googleapis.com')) {
    if (url.endsWith('/models')) return url;
    return 'https://generativelanguage.googleapis.com/v1beta/openai/models';
  }
  if (url.endsWith('/chat/completions')) {
    url = url.replace(/\/chat\/completions$/, '');
  }
  if (url.endsWith('/models')) {
    return url;
  }
  if (url.endsWith('/v1')) {
    return `${url}/models`;
  }
  if (!url.includes('/v1') && !url.includes('/api/')) {
    return `${url}/v1/models`;
  }
  return `${url}/models`;
}

// 1. System Status
apiRouter.get('/status', (req, res) => {
  res.json({
    success: true,
    data: mockDb.getSystemStatus(),
  });
});

// 2. AI Settings
apiRouter.get('/settings/ai', (req, res) => {
  res.json({
    success: true,
    data: mockDb.getAISettings(),
  });
});

apiRouter.post('/settings/ai', (req, res) => {
  const { preset, baseUrl, model, apiKey } = req.body;
  if (!baseUrl) {
    return res.status(400).json({
      success: false,
      message: 'Base URL wajib diisi.',
    });
  }
  const updated = mockDb.updateAISettings({ 
    preset, 
    baseUrl, 
    model: typeof model === 'string' ? model.trim() : '', 
    apiKey 
  });
  res.json({
    success: true,
    data: updated,
    message: 'Pengaturan AI berhasil disimpan di memory server lokal.',
  });
});

// 2.1 Fetch Live Models from Provider
apiRouter.post('/settings/fetch-models', async (req, res) => {
  const settings = mockDb.getAISettings();
  const rawKey = req.body.apiKey || mockDb.getRawApiKey();
  const preset = req.body.preset || settings.preset;

  if (preset === 'gemini') {
    return res.json({
      success: true,
      data: {
        count: 4,
        models: [
          'gemini-3.8-flash',
          'gemini-2.5-pro',
          'gemini-2.0-flash',
          'gemini-2.0-flash-lite'
        ],
      },
    });
  }

  const baseUrl = req.body.baseUrl || settings.baseUrl;
  const endpoint = resolveModelsEndpoint(baseUrl);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const apiRes = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        ...(rawKey ? { 'Authorization': `Bearer ${rawKey}` } : {}),
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!apiRes.ok) {
      const errText = await apiRes.text().catch(() => '');
      return res.status(400).json({
        success: false,
        message: `Gagal membaca model dari provider (HTTP ${apiRes.status}): ${errText.slice(0, 150)}`,
      });
    }

    const data = await apiRes.json();
    let models: string[] = [];
    if (Array.isArray(data.data)) {
      models = data.data.map((m: any) => m.id || m.name).filter(Boolean);
    } else if (Array.isArray(data.models)) {
      models = data.models.map((m: any) => m.name || m.id).filter(Boolean);
    }

    // Sort models
    models.sort();

    res.json({
      success: true,
      data: {
        count: models.length,
        models,
      },
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: `Gagal menghubungi endpoint models (${err.message}). Anda tetap dapat mengisi nama model secara manual.`,
    });
  }
});

// 3. Test Connection
apiRouter.post('/settings/test-connection', async (req, res) => {
  const { simulatedError } = req.body || {};

  // If explicit simulation error mode is selected for testing UI states
  if (simulatedError && simulatedError !== 'none') {
    const result = mockDb.testAIConnection(simulatedError);
    return res.status(400).json({
      success: false,
      data: result,
      message: result.message,
    });
  }

  const settings = mockDb.getAISettings();
  const rawKey = mockDb.getRawApiKey();
  const isLocal = settings.preset === 'ollama' || settings.preset === 'lmstudio';

  if (!rawKey && !isLocal) {
    return res.status(400).json({
      success: false,
      message: 'Kunci API (API Key) belum diisi. Masukkan kunci API Anda terlebih dahulu.',
      data: {
        success: false,
        errorType: 'invalid_key',
        message: 'Kunci API (API Key) belum diisi. Masukkan kunci API Anda terlebih dahulu.',
      },
    });
  }

  if (!settings.model || !settings.model.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Nama model belum dipilih. Silakan pilih atau ketik nama model yang ingin digunakan.',
      data: {
        success: false,
        errorType: 'model_not_found',
        message: 'Nama model belum dipilih.',
      },
    });
  }

  // Handle Google Gemini natively via @google/genai
  if (settings.preset === 'gemini') {
    const startTime = Date.now();
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: rawKey });
      const targetModel = settings.model || 'gemini-3.8-flash';
      await ai.models.generateContent({
        model: targetModel,
        contents: 'Ping test. Jawab: OK',
      });
      const latencyMs = Date.now() - startTime;
      return res.json({
        success: true,
        data: {
          success: true,
          message: `Koneksi ke Google Gemini (${targetModel}) berhasil! Waktu respon: ${latencyMs}ms.`,
          latencyMs,
          detectedModel: targetModel,
        },
      });
    } catch (err: any) {
      return res.status(400).json({
        success: false,
        message: `Gagal terhubung ke Google Gemini: ${err.message}`,
        data: {
          success: false,
          errorType: 'invalid_key',
          message: `Gagal terhubung ke Google Gemini: ${err.message}`,
        },
      });
    }
  }

  // Real connection test to OpenAI-compatible endpoint
  const startTime = Date.now();
  const endpoint = resolveChatEndpoint(settings.baseUrl);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const apiRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(rawKey ? { 'Authorization': `Bearer ${rawKey}` } : {}),
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [{ role: 'user', content: 'Ping test connection. Respond with OK.' }],
        max_tokens: 10,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const latencyMs = Date.now() - startTime;

    if (!apiRes.ok) {
      const errText = await apiRes.text().catch(() => '');
      let errMsg = `Provider (${settings.preset.toUpperCase()}) mengembalikan status ${apiRes.status} ${apiRes.statusText}`;
      let errType: 'invalid_key' | 'quota_exceeded' | 'model_not_found' | 'network_error' = 'network_error';

      try {
        const parsed = JSON.parse(errText);
        if (parsed.error?.message) {
          errMsg = parsed.error.message;
        } else if (parsed.message) {
          errMsg = parsed.message;
        } else if (parsed.detail) {
          errMsg = typeof parsed.detail === 'string' ? parsed.detail : JSON.stringify(parsed.detail);
        }
      } catch {
        if (errText) errMsg += `: ${errText.slice(0, 150)}`;
      }

      if (apiRes.status === 401 || apiRes.status === 403) {
        errType = 'invalid_key';
        errMsg = `Kunci API tidak valid atau tidak diizinkan (HTTP ${apiRes.status}): ${errMsg}`;
      } else if (apiRes.status === 429) {
        errType = 'quota_exceeded';
        errMsg = `Batas kuota atau rate limit habis (HTTP 429): ${errMsg}`;
      } else if (apiRes.status === 404) {
        errType = 'model_not_found';
        errMsg = `Model "${settings.model}" tidak ditemukan di provider ini (HTTP 404). Periksa penulisan nama model.`;
      }

      return res.status(400).json({
        success: false,
        message: errMsg,
        data: {
          success: false,
          errorType: errType,
          message: errMsg,
          latencyMs,
        },
      });
    }

    return res.json({
      success: true,
      data: {
        success: true,
        message: `Koneksi nyata ke ${settings.preset.toUpperCase()} (${settings.model}) berhasil! Latensi: ${latencyMs}ms.`,
        latencyMs,
        detectedModel: settings.model,
      },
    });
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError';
    const msg = isTimeout 
      ? `Koneksi timeout (>12 detik) ke ${endpoint}. Periksa URL atau koneksi internet.` 
      : `Gagal menghubungi server AI (${err.message || 'Network error'}).`;

    return res.status(400).json({
      success: false,
      message: msg,
      data: {
        success: false,
        errorType: 'network_error',
        message: msg,
      },
    });
  }
});

// 4. Detected Agents
apiRouter.get('/agents', (req, res) => {
  res.json({
    success: true,
    data: mockDb.getAgents(),
  });
});

apiRouter.patch('/agents/:id/status', (req, res) => {
  const { status } = req.body;
  const updated = mockDb.updateAgentStatus(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Agen tidak ditemukan' });
  }
  res.json({ success: true, data: updated });
});

// 5. Templates
apiRouter.get('/templates', (req, res) => {
  res.json({
    success: true,
    data: mockDb.getTemplates(),
  });
});

apiRouter.post('/templates/import', (req, res) => {
  const { source, pathOrUrl, zipName } = req.body;
  
  if (!source) {
    return res.status(400).json({ success: false, message: 'Sumber import tidak valid' });
  }

  // Generate realistic parsed manifest for user approval
  const rawTitle = zipName 
    ? zipName.replace(/\.zip$/i, '').replace(/[-_]/g, ' ')
    : (pathOrUrl ? pathOrUrl.split('/').pop()?.replace(/[-_]/g, ' ') || 'Custom Template' : 'Template Eksternal');

  const parsedManifest: TemplateManifest = {
    name: `imported-${Date.now().toString(36)}`,
    version: '1.0.0',
    title: rawTitle.toUpperCase(),
    author: source === 'github' ? (pathOrUrl.split('/')[3] || 'GitHub Contributor') : 'Lokal Kreator',
    license: 'MIT',
    entry: 'src/templates/ImportedComposition.tsx',
    preview: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    description: `Template diimpor dari ${source.toUpperCase()} (${pathOrUrl || zipName}). Membutuhkan persetujuan sebelum file disalin ke project.`,
    category: 'TikTok / Reels',
    aspectRatio: '9:16',
    fps: 30,
    durationInFrames: 180,
    dependencies: {
      'remotion': '^4.0.0',
      '@remotion/paths': '^4.0.0',
    },
    requires: {
      node: '>=18.0.0',
      ffmpeg: true,
    },
    installed: false,
    tags: ['Imported', 'Community'],
  };

  res.json({
    success: true,
    data: parsedManifest,
    message: 'Template manifest berhasil divalidasi. Menunggu persetujuan Anda.',
  });
});

apiRouter.post('/templates/install', (req, res) => {
  const { manifest } = req.body;
  if (!manifest || !manifest.name) {
    return res.status(400).json({ success: false, message: 'Data manifest template tidak lengkap' });
  }
  const installed = mockDb.addCustomTemplate(manifest);
  res.json({
    success: true,
    data: installed,
    message: `Template "${installed.title}" berhasil dipasang ke katalog lokal!`,
  });
});

// 6. Extensions
apiRouter.get('/extensions', (req, res) => {
  res.json({
    success: true,
    data: mockDb.getExtensions(),
  });
});

apiRouter.patch('/extensions/:id/toggle', (req, res) => {
  const { enabled } = req.body;
  const updated = mockDb.toggleExtension(req.params.id, enabled);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Ekstensi tidak ditemukan' });
  }
  res.json({
    success: true,
    data: updated,
    message: `Ekstensi ${updated.name} sekarang ${updated.enabled ? 'Aktif' : 'Nonaktif'}.`,
  });
});

apiRouter.post('/extensions/install', (req, res) => {
  const { extension } = req.body;
  if (!extension || !extension.id) {
    return res.status(400).json({ success: false, message: 'Data ekstensi tidak lengkap' });
  }
  const installed = mockDb.installExtension(extension);
  res.json({
    success: true,
    data: installed,
    message: `Ekstensi "${installed.name}" berhasil dipasang dan diaktifkan!`,
  });
});

// 7. Doctor Checklist
apiRouter.get('/doctor', (req, res) => {
  res.json({
    success: true,
    data: mockDb.getDoctorReport(),
  });
});

// 8. Composition State
apiRouter.get('/composition', (req, res) => {
  res.json({
    success: true,
    data: mockDb.getComposition(),
  });
});

apiRouter.post('/composition', (req, res) => {
  const updated = mockDb.updateComposition(req.body);
  res.json({
    success: true,
    data: updated,
    message: 'Properti komposisi video berhasil diperbarui.',
  });
});

// 9. Chat Service & Dynamic Contextual Streaming Endpoints
interface AIChatExecutionResult {
  text: string;
  suggestedProps?: any;
  actionRequest?: any;
  activity?: {
    type: 'analysis' | 'file' | 'remotion' | 'render';
    title: string;
    detail?: string;
    file?: string;
    command?: string;
    status: 'running' | 'done' | 'error';
  };
  activeFile?: string;
  activeCommand?: string;
  isError?: boolean;
  errorType?: 'invalid_key' | 'quota_exceeded' | 'model_not_found' | 'network_error' | 'provider_error';
}

async function streamAIChat(
  message: string,
  sendEvent: (event: string, data: any) => void,
  isAborted: () => boolean
): Promise<AIChatExecutionResult> {
  const settings = mockDb.getAISettings();
  const rawKey = mockDb.getRawApiKey();
  const isLocal = settings.preset === 'ollama' || settings.preset === 'lmstudio' || settings.baseUrl.includes('localhost') || settings.baseUrl.includes('127.0.0.1');
  const hasKey = Boolean(rawKey && rawKey.trim().length > 0) || isLocal;
  const hasModel = Boolean(settings.model && settings.model.trim().length > 0);
  const hasConfiguredAI = hasKey && hasModel;

  const trimmedLower = message.trim().toLowerCase();

  // Contextual intent identification
  const isGreeting = /^(halo|hai|hi|hey|helo|pagi|siang|sore|malam|selamat|tes|test|ping|assalamu|oy|oi)\b/i.test(trimmedLower) ||
    ['halo', 'hai', 'siapa kamu', 'kamu siapa', 'apa kabar', 'help', 'bantuan', 'halo studio'].includes(trimmedLower);

  const isExplainCode = /(jelaskan kode|bagaimana kode|analisis kode|struktur kode|remotion code|kode ini|explain code|jelaskan arsitektur|cara kerja kode)/i.test(trimmedLower);

  const isRenderRequest = /(render video|render|ekspor video|export video|export mp4|unduh video|download mp4|hasil render)/i.test(trimmedLower);

  let rawAccumulated = '';
  let suggestedProps: any = undefined;
  let actionRequest: any = undefined;
  let activeActivity: any = undefined;
  let activeFile: string | undefined = undefined;
  let activeCommand: string | undefined = undefined;
  let isError = false;
  let errorType: AIChatExecutionResult['errorType'] = undefined;

  // Validation: Key present but no model selected
  if (hasKey && !hasModel) {
    const errorText = '⚠️ API Key telah terdeteksi, namun Nama Model AI belum Anda tentukan. Buka tab Pengaturan AI, lalu pilih model yang ingin digunakan.';
    sendEvent('token', { delta: errorText });
    return {
      text: errorText,
      isError: true,
      errorType: 'model_not_found',
    };
  }

  // 1. REAL AI PROVIDER (when configured)
  if (hasConfiguredAI) {
    if (isExplainCode) {
      activeActivity = {
        type: 'analysis',
        title: 'Menganalisis kode & komponen Remotion',
        file: 'src/remotion/KineticComposition.tsx',
        status: 'running',
      };
      sendEvent('activity', activeActivity);
    } else if (isRenderRequest) {
      activeActivity = {
        type: 'render',
        title: 'Mengecek kesiapan render Remotion',
        command: 'npx remotion render src/remotion/index.ts Out video.mp4',
        status: 'running',
      };
      sendEvent('activity', activeActivity);
    }

    const currentComp = mockDb.getComposition();
    const chatHistory = mockDb.getChatMessages().slice(-6);

    const systemPrompt = `Kamu adalah asisten cerdas untuk "Males Ngonten Studio", aplikasi AI Video Studio frontend untuk Remotion.
Bahasa: Bahasa Indonesia gaul, ramah, dan profesional bagi kreator konten.
State komposisi video saat ini:
- Headline: "${currentComp.headline}"
- Highlight Word: "${currentComp.highlightWord}"
- Subtext: "${currentComp.subtext}"
- Tagline: "${currentComp.tagline}"
- Aspek Rasio: "${currentComp.aspectRatio}"
- Warna: ${currentComp.primaryColor} (primer), ${currentComp.accentColor} (aksen), ${currentComp.bgColor} (bg)
- Font: "${currentComp.fontStyle}", Animasi: "${currentComp.animationPreset}"

ATURAN PERILAKU:
1. Jika pengguna hanya menyapa (contoh: "Halo", "Hai") atau bertanya umum, JAWAB DENGAN PERCAKAPAN BIASA. JANGAN buatkan video atau modifikasi properti video jika tidak diminta.
2. Jika pengguna meminta penjelasan kode, jelaskan arsitektur React Remotion secara ringkas tanpa memodifikasi file.
3. HANYA JIKA pengguna secara spesifik meminta membuat/mengubah video (judul, warna, hook, teks, dsb), berikan penjelasan singkat dan sertakan blok JSON patch di akhir respon:
\`\`\`json_composition_patch
{
  "headline": "TEKS BARU",
  "highlightWord": "KATA_DIPILIH",
  "subtext": "Penjelasan subtext",
  "primaryColor": "#06b6d4",
  "bgColor": "#0f172a"
}
\`\`\`
Hanya masukkan field yang benar-benar diubah.`;

    if (settings.preset === 'gemini') {
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: rawKey });
        const targetModel = (settings.model && !settings.model.includes('2.5-flash')) ? settings.model : 'gemini-3.8-flash';

        const historyText = chatHistory.slice(0, -1).map(m => `${m.sender === 'user' ? 'Kreator' : 'Asisten'}: ${m.text}`).join('\n');
        const fullPrompt = `${systemPrompt}\n\nPercakapan sebelumnya:\n${historyText}\n\nPermintaan kreator: ${message}`;

        const responseStream = await ai.models.generateContentStream({
          model: targetModel,
          contents: fullPrompt,
        });

        for await (const chunk of responseStream) {
          if (isAborted()) break;
          const delta = chunk.text || '';
          if (delta) {
            rawAccumulated += delta;
            sendEvent('token', { delta });
          }
        }
      } catch (err: any) {
        console.error('Gemini streaming error:', err);
        isError = true;
        const msg = err.message || '';
        if (msg.includes('API_KEY_INVALID') || msg.includes('403') || msg.includes('401')) {
          errorType = 'invalid_key';
          rawAccumulated = `Kunci API Google Gemini tidak valid atau tidak memiliki izin akses (${msg}). Periksa kembali di Pengaturan AI.`;
        } else if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
          errorType = 'quota_exceeded';
          rawAccumulated = `Batas kuota Gemini tercapai (429 Rate Limit). Silakan coba sesaat lagi atau gunakan API key lain.`;
        } else if (msg.includes('NOT_FOUND') || msg.includes('404')) {
          errorType = 'model_not_found';
          rawAccumulated = `Model Gemini "${settings.model}" tidak ditemukan. Silakan pilih model lain di Pengaturan AI.`;
        } else {
          errorType = 'provider_error';
          rawAccumulated = `Gagal mendapatkan respon dari Google Gemini: ${msg}.`;
        }
      }
    } else {
      // OpenAI-compatible streaming
      const endpoint = resolveChatEndpoint(settings.baseUrl);
      try {
        const apiRes = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(rawKey ? { 'Authorization': `Bearer ${rawKey}` } : {}),
          },
          body: JSON.stringify({
            model: settings.model,
            messages: [
              { role: 'system', content: systemPrompt },
              ...chatHistory.slice(0, -1).map(m => ({
                role: m.sender === 'assistant' ? 'assistant' : 'user',
                content: m.text,
              })),
              { role: 'user', content: message },
            ],
            stream: true,
            temperature: 0.7,
          }),
        });

        if (!apiRes.ok) {
          const errText = await apiRes.text().catch(() => '');
          let errMsg = `Status HTTP ${apiRes.status} ${apiRes.statusText}`;
          try {
            const parsed = JSON.parse(errText);
            errMsg = parsed.error?.message || parsed.message || parsed.detail || errMsg;
          } catch {
            if (errText) errMsg += `: ${errText.slice(0, 150)}`;
          }
          isError = true;
          if (apiRes.status === 401 || apiRes.status === 403) {
            errorType = 'invalid_key';
            rawAccumulated = `Kunci API tidak valid atau ditolak (${settings.preset.toUpperCase()}): ${errMsg}`;
          } else if (apiRes.status === 429) {
            errorType = 'quota_exceeded';
            rawAccumulated = `Batas kuota habis (${settings.preset.toUpperCase()}): ${errMsg}`;
          } else if (apiRes.status === 404) {
            errorType = 'model_not_found';
            rawAccumulated = `Model "${settings.model}" tidak ditemukan di ${settings.preset.toUpperCase()}.`;
          } else {
            errorType = 'provider_error';
            rawAccumulated = `Provider ${settings.preset.toUpperCase()} mengembalikan error: ${errMsg}`;
          }
        } else if (apiRes.body) {
          const reader = apiRes.body.getReader();
          const decoder = new TextDecoder('utf-8');
          let buffer = '';

          while (true) {
            if (isAborted()) break;
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data:')) continue;
              const jsonStr = trimmed.slice(5).trim();
              if (jsonStr === '[DONE]') break;
              try {
                const parsed = JSON.parse(jsonStr);
                const delta = parsed.choices?.[0]?.delta?.content || '';
                if (delta) {
                  rawAccumulated += delta;
                  sendEvent('token', { delta });
                }
              } catch {}
            }
          }
        }
      } catch (err: any) {
        console.error('Error contacting AI provider:', err);
        isError = true;
        errorType = 'network_error';
        rawAccumulated = `Gagal menghubungi endpoint provider (${err.message || 'Network error'}). Periksa koneksi internet Anda.`;
      }
    }
  }

  // 2. DEMO MODE (when no API key or offline demo)
  if (!hasConfiguredAI && !isError) {
    const helperStreamTokens = async (text: string) => {
      const words = text.match(/\S+\s*/g) || [text];
      for (const word of words) {
        if (isAborted()) break;
        rawAccumulated += word;
        sendEvent('token', { delta: word });
        await new Promise(r => setTimeout(r, 22));
      }
    };

    if (isGreeting) {
      // PURE CASUAL GREETING - Zero workflow steps, zero file modifications!
      await helperStreamTokens(
        'Halo! Saya asisten kreatif Males Ngonten Studio.\n\nSaya siap membantu Anda membuat video kinetik vertikal untuk TikTok, Instagram Reels, dan YouTube Shorts. Anda bisa meminta saya meracik ide hook 3 detik pertama, mengubah palet warna, memilih gaya font, atau menjelaskan arsitektur Remotion. Apa yang ingin kita buat hari ini?'
      );
    } else if (isExplainCode) {
      activeActivity = {
        type: 'analysis',
        title: 'Menganalisis file src/remotion/KineticComposition.tsx',
        file: 'src/remotion/KineticComposition.tsx',
        status: 'running',
      };
      sendEvent('activity', activeActivity);

      await helperStreamTokens(
        'Males Ngonten Studio menggunakan arsitektur video-as-code berbasis Remotion:\n\n' +
        '1. Komponen Utama: Berada di `src/remotion/KineticComposition.tsx`.\n' +
        '2. Timing & Frame: Menggunakan hook `useCurrentFrame()` dan fungsi `spring()` dari Remotion untuk menghitung transisi teks per frame secara presisi matematika.\n' +
        '3. Reaktivitas: Properti seperti headline, highlightWord, subtext, dan warna dikontrol langsung oleh state React tanpa membutuhkan kompilasi ulang.'
      );

      activeActivity = { ...activeActivity, status: 'done', title: 'Analisis komponen Remotion selesai' };
      sendEvent('activity', activeActivity);
    } else if (isRenderRequest) {
      activeActivity = {
        type: 'render',
        title: 'Menyiapkan render video Remotion',
        command: 'npx remotion render src/remotion/index.ts Out video.mp4',
        status: 'running',
      };
      sendEvent('activity', activeActivity);

      await helperStreamTokens(
        'Untuk merender video ke format MP4 secara aktual:\n\n' +
        '• Jalankan di terminal: `npx remotion render src/remotion/index.ts Out video.mp4 --codec=h264`\n' +
        '• Atau klik tombol "Ekspor" di pojok kanan atas aplikasi untuk memilih preset resolusi (9:16 / 16:9) dan mengunduh video langsung.'
      );

      activeActivity = { ...activeActivity, status: 'done', title: 'Antrean render video siap' };
      sendEvent('activity', activeActivity);
      activeCommand = 'npx remotion render src/remotion/index.ts Out video.mp4';
    } else if (trimmedLower.includes('warna') || trimmedLower.includes('cyber') || trimmedLower.includes('tema') || trimmedLower.includes('color')) {
      activeActivity = {
        type: 'file',
        title: 'Memperbarui tema warna video',
        file: 'src/remotion/KineticComposition.tsx',
        status: 'running',
      };
      sendEvent('activity', activeActivity);

      suggestedProps = {
        primaryColor: '#06b6d4',
        accentColor: '#f43f5e',
        bgColor: '#030712',
        fontStyle: 'mono',
      };
      mockDb.updateComposition(suggestedProps);
      sendEvent('composition_update', suggestedProps);

      await helperStreamTokens(
        'Palet warna video telah diubah ke gaya Cyberpunk Neon (#06b6d4 & #f43f5e) dengan latar belakang gelap. Pratinjau video di atas langsung terupdate!'
      );

      activeActivity = { ...activeActivity, status: 'done', title: 'Palet warna disinkronkan ke video' };
      sendEvent('activity', activeActivity);
      activeFile = 'src/remotion/KineticComposition.tsx';
    } else if (trimmedLower.includes('santai') || trimmedLower.includes('chill') || trimmedLower.includes('aesthetic')) {
      activeActivity = {
        type: 'file',
        title: 'Menyesuaikan mood aesthetic video',
        file: 'src/remotion/KineticComposition.tsx',
        status: 'running',
      };
      sendEvent('activity', activeActivity);

      suggestedProps = {
        headline: 'TENANG, SEMUANYA AKAN INDAH PADA WAKTUNYA',
        highlightWord: 'INDAH',
        subtext: 'Tarik napas perlahan. Nikmati setiap proses perjalananmu hari ini.',
        primaryColor: '#a78bfa',
        accentColor: '#fb7185',
        bgColor: '#0f172a',
        fontStyle: 'sans',
        animationPreset: 'smooth-slide',
      };
      mockDb.updateComposition(suggestedProps);
      sendEvent('composition_update', suggestedProps);

      await helperStreamTokens(
        'Komposisi video disesuaikan ke gaya aesthetic santai dengan transisi lembut dan tone warna pastel. Cek hasilnya pada pratinjau video!'
      );

      activeActivity = { ...activeActivity, status: 'done', title: 'Komposisi aesthetic diterapkan' };
      sendEvent('activity', activeActivity);
      activeFile = 'src/remotion/KineticComposition.tsx';
    } else if (trimmedLower.includes('library') || trimmedLower.includes('shape') || trimmedLower.includes('pasang') || trimmedLower.includes('install')) {
      activeActivity = {
        type: 'remotion',
        title: 'Pemeriksaan paket dependensi Remotion',
        command: 'npm install @remotion/shapes',
        status: 'running',
      };
      sendEvent('activity', activeActivity);

      actionRequest = {
        type: 'install_library',
        title: 'Izin Instalasi Library Remotion',
        description: 'Dibutuhkan library @remotion/shapes untuk rendering elemen bentuk geometris dinamis.',
        packageName: '@remotion/shapes',
        version: '^4.0.120',
        payload: {
          command: 'npm install @remotion/shapes',
          permissions: ['Canvas SVG', 'Bundle Assets'],
        },
      };

      await helperStreamTokens(
        'Untuk membuat elemen grafis geometris, diperlukan library `@remotion/shapes`. Konfirmasi instalasi pada kartu dialog di bawah untuk memasangnya.'
      );

      activeActivity = { ...activeActivity, status: 'done', title: 'Permintaan dependensi siap ditinjau' };
      sendEvent('activity', activeActivity);
    } else if (trimmedLower.includes('buat') || trimmedLower.includes('bikin') || trimmedLower.includes('hook') || trimmedLower.includes('judul') || trimmedLower.includes('headline') || trimmedLower.includes('video')) {
      activeActivity = {
        type: 'file',
        title: 'Membuat komposisi video baru',
        file: 'src/remotion/KineticComposition.tsx',
        status: 'running',
      };
      sendEvent('activity', activeActivity);

      const words = message.trim().split(/\s+/);
      const headlineText = message.length > 40 ? message.slice(0, 40).toUpperCase() : message.toUpperCase();
      suggestedProps = {
        headline: headlineText,
        highlightWord: words[0]?.toUpperCase() || 'KONTEN',
        subtext: 'Bikin video reels & tiktok 10x lebih cepat pakai template otomatis.',
        animationPreset: 'kinetic-pop',
      };
      mockDb.updateComposition(suggestedProps);
      sendEvent('composition_update', suggestedProps);

      await helperStreamTokens(
        `Video berhasil dibuat dengan hook "${headlineText}". Parameter komposisi telah langsung disinkronkan ke canvas Remotion di atas.`
      );

      activeActivity = { ...activeActivity, status: 'done', title: 'Komposisi video berhasil disinkronkan' };
      sendEvent('activity', activeActivity);
      activeFile = 'src/remotion/KineticComposition.tsx';
    } else {
      // General question in demo mode
      await helperStreamTokens(
        `Pertanyaan Anda: "${message}".\n\nDi Males Ngonten Studio, Anda dapat menginstruksikan AI untuk membuat video pendek, mengatur teks hook, mengganti warna, atau memasang template baru. Anda juga dapat menghubungkan Kunci API (Google Gemini, OpenAI, Groq, DeepSeek, Ollama) di menu Pengaturan AI untuk kecerdasan penuh.`
      );
    }
  }

  // 3. PARSE REAL AI RESPONSE PATCHES (if real provider was used)
  if (hasConfiguredAI && !isError) {
    // Extract json_composition_patch
    const compPatchMatch = rawAccumulated.match(/```json_composition_patch\s*([\s\S]*?)\s*```/);
    if (compPatchMatch && compPatchMatch[1]) {
      try {
        const parsedComp = JSON.parse(compPatchMatch[1].trim());
        suggestedProps = parsedComp;
        mockDb.updateComposition(parsedComp);
        sendEvent('composition_update', parsedComp);
        activeActivity = {
          type: 'file',
          title: 'Memperbarui komposisi video',
          file: 'src/remotion/KineticComposition.tsx',
          detail: 'Parameter visual berhasil disinkronkan ke video',
          status: 'done',
        };
        sendEvent('activity', activeActivity);
        activeFile = 'src/remotion/KineticComposition.tsx';
      } catch (e) {
        console.error('Failed to parse json_composition_patch:', e);
      }
    }

    // Extract json_action_request
    const actionMatch = rawAccumulated.match(/```json_action_request\s*([\s\S]*?)\s*```/);
    if (actionMatch && actionMatch[1]) {
      try {
        actionRequest = JSON.parse(actionMatch[1].trim());
        activeActivity = {
          type: 'remotion',
          title: actionRequest.title || 'Permintaan Tindakan AI',
          detail: actionRequest.description,
          status: 'done',
        };
        sendEvent('activity', activeActivity);
      } catch (e) {
        console.error('Failed to parse json_action_request:', e);
      }
    }

    if (isExplainCode && !activeActivity) {
      activeActivity = {
        type: 'analysis',
        title: 'Analisis komponen Remotion selesai',
        status: 'done',
      };
      sendEvent('activity', activeActivity);
    }

    if (isRenderRequest && !activeActivity) {
      activeActivity = {
        type: 'render',
        title: 'Antrean render video Remotion siap',
        command: 'npx remotion render src/remotion/index.ts Out video.mp4',
        status: 'done',
      };
      sendEvent('activity', activeActivity);
      activeCommand = 'npx remotion render src/remotion/index.ts Out video.mp4';
    }
  }

  const cleanText = rawAccumulated
    .replace(/```json_composition_patch[\s\S]*?```/g, '')
    .replace(/```json_action_request[\s\S]*?```/g, '')
    .trim();

  const finalText = cleanText || (suggestedProps ? `Komposisi video diperbarui: "${suggestedProps.headline || 'Hook Baru'}". Cek pratinjau video di atas!` : rawAccumulated);

  return {
    text: finalText,
    suggestedProps,
    actionRequest,
    activity: activeActivity,
    activeFile,
    activeCommand,
    isError,
    errorType,
  };
}

apiRouter.get('/chat', (req, res) => {
  res.json({
    success: true,
    data: mockDb.getChatMessages(),
  });
});

// Real-Time Server-Sent Events (SSE) Streaming Chat Endpoint
apiRouter.post('/chat/stream', async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, message: 'Pesan tidak boleh kosong' });
  }

  // Enable SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  let isAborted = false;
  res.on('close', () => {
    if (!res.writableEnded) {
      isAborted = true;
    }
  });

  const sendEvent = (event: string, data: any) => {
    if (isAborted) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // 1. Immediately add user message to DB and emit to client
  const userMsg = mockDb.addChatMessage({
    sender: 'user',
    text: message,
    status: 'sending',
  });
  sendEvent('user_message', userMsg);

  // 2. Stream AI response with dynamic, contextual activities
  const result = await streamAIChat(message, sendEvent, () => isAborted);

  if (isAborted) {
    res.end();
    return;
  }

  if (result.isError) {
    const errorAssistantMsg = mockDb.addChatMessage({
      sender: 'assistant',
      text: result.text,
      status: 'error',
      errorMessage: result.text,
      activity: result.activity,
      activeFile: result.activeFile,
      activeCommand: result.activeCommand,
    });

    sendEvent('error', {
      message: result.text,
      errorType: result.errorType,
      userMessageId: userMsg.id,
      assistantMessage: errorAssistantMsg,
    });
    res.end();
    return;
  }

  // 3. Save success assistant message with action history snapshot
  const changedFields: string[] = [];
  if (result.suggestedProps) {
    if (result.suggestedProps.headline) changedFields.push('Judul Hook');
    if (result.suggestedProps.highlightWord) changedFields.push('Kata Aksen');
    if (result.suggestedProps.subtext) changedFields.push('Subtext');
    if (result.suggestedProps.primaryColor || result.suggestedProps.accentColor || result.suggestedProps.bgColor) changedFields.push('Warna');
    if (result.suggestedProps.aspectRatio) changedFields.push('Format Rasio');
    if (result.suggestedProps.animationPreset) changedFields.push('Animasi');
    if (result.suggestedProps.layers) changedFields.push('Layout Layer');
  }

  const actionSummary = changedFields.length > 0
    ? `Pembaruan: ${changedFields.join(', ')}`
    : result.activity?.title || undefined;

  const assistantMsg = mockDb.addChatMessage({
    sender: 'assistant',
    text: result.text,
    status: 'success',
    suggestedProps: result.suggestedProps,
    appliedCompositionSnapshot: result.suggestedProps ? JSON.parse(JSON.stringify(mockDb.getComposition())) : undefined,
    actionSummary,
    actionRequest: result.actionRequest,
    activity: result.activity,
    activeFile: result.activeFile,
    activeCommand: result.activeCommand,
  });

  sendEvent('result', {
    userMessage: { ...userMsg, status: 'success' },
    assistantMessage: assistantMsg,
    updatedComposition: result.suggestedProps ? mockDb.getComposition() : undefined,
  });

  res.end();
});

// Standard non-streaming fallback endpoint
apiRouter.post('/chat', async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, message: 'Pesan tidak boleh kosong' });
  }

  const userMsg = mockDb.addChatMessage({
    sender: 'user',
    text: message,
    status: 'success',
  });

  const result = await streamAIChat(message, () => {}, () => false);

  const assistantMsg = mockDb.addChatMessage({
    sender: 'assistant',
    text: result.text,
    status: result.isError ? 'error' : 'success',
    errorMessage: result.isError ? result.text : undefined,
    suggestedProps: result.suggestedProps,
    actionRequest: result.actionRequest,
    activity: result.activity,
    activeFile: result.activeFile,
    activeCommand: result.activeCommand,
  });

  res.json({
    success: !result.isError,
    data: {
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      updatedComposition: result.suggestedProps ? mockDb.getComposition() : undefined,
      isError: result.isError,
      errorType: result.errorType,
    },
  });
});

// 10. Mock Export
apiRouter.post('/export', (req, res) => {
  const { composition } = req.body;
  res.json({
    success: true,
    data: {
      jobId: `render-${Date.now().toString(36)}`,
      status: 'mock_queued',
      fileName: 'malesngonten-video.mp4',
      resolution: composition?.aspectRatio === '9:16' ? '1080x1920' : '1920x1080',
      fps: 30,
      note: 'Ini adalah mock export dialog. Dalam implementasi server lokal lengkap, endpoint ini mengeksekusi CLI: `npx remotion render src/index.ts Out video.mp4 --codec=h264` via ffmpeg lokal.',
    },
  });
});
