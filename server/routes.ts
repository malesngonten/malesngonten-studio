import { Router } from 'express';
import { mockDb } from './mockDb.js';
import { TemplateManifest } from '../src/contracts/manifest.js';

export const apiRouter = Router();

/**
 * Universal endpoint resolvers for ANY OpenAI-compatible provider:
 * Handles trailing slashes, full endpoints, missing /v1, etc.
 */
export function resolveChatEndpoint(baseUrl: string): string {
  let url = baseUrl.trim().replace(/\/+$/, '');
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
  let url = baseUrl.trim().replace(/\/+$/, '');
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
      message: 'API Key belum diisi. Masukkan API Key terlebih dahulu atau pilih provider lokal.',
      data: {
        success: false,
        errorType: 'invalid_key',
        message: 'API Key belum diisi. Masukkan API Key terlebih dahulu.',
      },
    });
  }

  if (!settings.model || !settings.model.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Nama model belum dipilih. Silakan ketik nama model pilihan Anda atau klik "Ambil Model dari Akun".',
      data: {
        success: false,
        errorType: 'model_not_found',
        message: 'Nama model belum dipilih. Silakan ketik nama model pilihan Anda atau klik "Ambil Model dari Akun".',
      },
    });
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

// 9. Chat
apiRouter.get('/chat', (req, res) => {
  res.json({
    success: true,
    data: mockDb.getChatMessages(),
  });
});

apiRouter.post('/chat', async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, message: 'Pesan tidak boleh kosong' });
  }

  // 1. Add user message
  const userMsg = mockDb.addChatMessage({
    sender: 'user',
    text: message,
  });

  const settings = mockDb.getAISettings();
  const rawKey = mockDb.getRawApiKey();
  const isLocal = settings.preset === 'ollama' || settings.preset === 'lmstudio' || settings.baseUrl.includes('localhost') || settings.baseUrl.includes('127.0.0.1');
  const hasKey = Boolean(rawKey && rawKey.trim().length > 0) || isLocal;
  const hasModel = Boolean(settings.model && settings.model.trim().length > 0);
  const hasConfiguredAI = hasKey && hasModel;

  let aiReplyText = '';
  let suggestedProps: any = undefined;
  let actionRequest: any = undefined;

  if (hasKey && !hasModel) {
    aiReplyText = '⚠️ API Key telah terdeteksi, namun Model AI belum Anda pilih. Silakan buka tab Pengaturan AI, lalu ketik nama model pilihan Anda atau klik "Ambil Model dari Akun".';
  } else if (hasConfiguredAI) {
    const endpoint = resolveChatEndpoint(settings.baseUrl);
    const currentComp = mockDb.getComposition();
    const chatHistory = mockDb.getChatMessages().slice(-6);

    const systemPrompt = `Kamu adalah sutradara video kreatif untuk "Males Ngonten Studio", aplikasi AI Video Studio frontend untuk Remotion.
Karaktermu: Santai, solutif, kreatif dalam meracik copywriting hook 3 detik pertama (TikTok, Reels, Shorts), dan berbahasa Indonesia gaul/kreator.

State komposisi video saat ini:
- Headline: "${currentComp.headline}"
- Highlight Word: "${currentComp.highlightWord}"
- Subtext: "${currentComp.subtext}"
- Tagline: "${currentComp.tagline}"
- Aspek Rasio: "${currentComp.aspectRatio}"
- Warna: ${currentComp.primaryColor} (primer), ${currentComp.accentColor} (aksen), ${currentComp.bgColor} (bg)
- Font: "${currentComp.fontStyle}", Animasi: "${currentComp.animationPreset}"

ATURAN OUTPUT:
1. Berikan respon percakapan singkat padat.
2. JIKA ada perubahan teks/warna/animasi video, sertakan blok JSON patch di akhir:
\`\`\`json_composition_patch
{
  "headline": "TEKS HOOK BESAR",
  "highlightWord": "KATA_DARI_HEADLINE",
  "subtext": "Penjelasan pendukung",
  "tagline": "#Hashtag1 #Hashtag2",
  "primaryColor": "#ef4444",
  "accentColor": "#f59e0b",
  "fontStyle": "display",
  "animationPreset": "kinetic-pop"
}
\`\`\`
Hanya masukkan field yang ingin diubah.
3. JIKA butuh library eksternal:
\`\`\`json_action_request
{
  "type": "install_library",
  "title": "Izin Instalasi Library Remotion",
  "description": "Alasan singkat...",
  "packageName": "@remotion/shapes",
  "version": "^4.0.120"
}
\`\`\``;

    try {
      const controller = new AbortController();
      // Generous 75s timeout to avoid false aborts on busy cloud shared queues
      const timeout = setTimeout(() => controller.abort(), 75000);

      const apiRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(rawKey ? { 'Authorization': `Bearer ${rawKey}` } : {}),
        },
        body: JSON.stringify({
          model: settings.model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...chatHistory.slice(0, -1).map((m) => ({
              role: m.sender === 'assistant' ? 'assistant' : 'user',
              content: m.text,
            })),
            { role: 'user', content: message },
          ],
          temperature: 0.7,
          // Fast generation: 450 tokens is plenty for video advice + json patch
          max_tokens: 450,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!apiRes.ok) {
        const errText = await apiRes.text().catch(() => '');
        let errMsg = `Status HTTP ${apiRes.status} ${apiRes.statusText}`;
        try {
          const parsed = JSON.parse(errText);
          errMsg = parsed.error?.message || parsed.message || parsed.detail || errMsg;
        } catch {}
        aiReplyText = `⚠️ Provider ${settings.preset.toUpperCase()} (${settings.model}) mengembalikan error: ${errMsg}.`;
      } else {
        const responseData = await apiRes.json();
        const rawContent: string = responseData.choices?.[0]?.message?.content || '';

        // Extract json_composition_patch
        const compPatchMatch = rawContent.match(/```json_composition_patch\s*([\s\S]*?)\s*```/);
        if (compPatchMatch && compPatchMatch[1]) {
          try {
            const parsedComp = JSON.parse(compPatchMatch[1].trim());
            suggestedProps = parsedComp;
            mockDb.updateComposition(parsedComp);
          } catch (e) {
            console.error('Failed to parse json_composition_patch:', e);
          }
        }

        // Extract json_action_request
        const actionMatch = rawContent.match(/```json_action_request\s*([\s\S]*?)\s*```/);
        if (actionMatch && actionMatch[1]) {
          try {
            actionRequest = JSON.parse(actionMatch[1].trim());
          } catch (e) {
            console.error('Failed to parse json_action_request:', e);
          }
        }

        // Clean raw json blocks from visible chat text
        aiReplyText = rawContent
          .replace(/```json_composition_patch[\s\S]*?```/g, '')
          .replace(/```json_action_request[\s\S]*?```/g, '')
          .trim();

        if (!aiReplyText && suggestedProps) {
          aiReplyText = `Komposisi video diperbarui: "${suggestedProps.headline || 'Hook Baru'}". Cek preview video di atas!`;
        }
      }
    } catch (err: any) {
      console.error('Error invoking real AI provider:', err);
      const isTimeout = err.name === 'AbortError';
      if (isTimeout) {
        aiReplyText = `⚠️ Waktu tunggu habis (>75 detik) saat menghubungi ${settings.baseUrl}.
Penyebab: Model "${settings.model}" sedang mengantre atau kelebihan beban di provider Anda.
Solusi Cepat:
1. Di menu Pengaturan AI, gunakan model yang sangat cepat & ringan seperti:
   • "mistralai/mistral-7b-instruct-v0.3" (Sangat cepat di NVIDIA NIM)
   • "deepseek-ai/deepseek-v4.1-flash"
   • "nv-mistralai/mistral-nemo-12b-instruct"
2. Atau gunakan tombol "Ambil Model Tersedia" untuk memilih model aktif dari akun Anda.`;
      } else {
        aiReplyText = `⚠️ Terjadi kendala saat menghubungi AI (${err.message}). Pastikan Base URL & API Key sudah valid.`;
      }
    }
  }

  // 3. Fallback to mock ONLY when in Demo Mode (no key provided)
  if (!aiReplyText) {
    const lower = message.toLowerCase();
    if (lower.includes('headline') || lower.includes('judul') || lower.includes('hook')) {
      aiReplyText = '[Mode Demo] Saya telah memperbarui teks hook video Anda agar lebih memikat perhatian audiens di 3 detik pertama!';
      suggestedProps = {
        headline: 'RAHASIA KONTEN VIRAL TERBONGKAR!',
        highlightWord: 'VIRAL',
        subtext: 'Jangan cuma scroll, tonton trik 30 detik ini sekarang juga!',
        animationPreset: 'kinetic-pop',
      };
      mockDb.updateComposition(suggestedProps);
    } else if (lower.includes('warna') || lower.includes('cyber') || lower.includes('tema') || lower.includes('color')) {
      aiReplyText = '[Mode Demo] Saya telah mengubah palet warna video ke gaya Cyberpunk Neon yang mencolok!';
      suggestedProps = {
        primaryColor: '#06b6d4',
        accentColor: '#f43f5e',
        bgColor: '#030712',
        fontStyle: 'mono',
      };
      mockDb.updateComposition(suggestedProps);
    } else if (lower.includes('library') || lower.includes('shape') || lower.includes('pasang') || lower.includes('install')) {
      aiReplyText = '[Mode Demo] Untuk menghasilkan efek bentuk geometris dinamis, saya memerlukan library `@remotion/shapes`. Mohon konfirmasi instalasi berikut:';
      actionRequest = {
        type: 'install_library',
        title: 'Izin Instalasi Library Remotion',
        description: 'AI mendeteksi kebutuhan rendering bentuk vektor SVG dinamis untuk latar belakang video.',
        packageName: '@remotion/shapes',
        version: '^4.0.120',
        payload: {
          command: 'npm install @remotion/shapes',
          permissions: ['Akses Canvas SVG', 'Bundle Assets'],
        },
      };
    } else if (lower.includes('santai') || lower.includes('chill') || lower.includes('aesthetic')) {
      aiReplyText = '[Mode Demo] Siap! Komposisi disesuaikan dengan mood chill aesthetic.';
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
    } else {
      aiReplyText = `[Mode Demo] Ide bagus: "${message}". Komposisi telah disesuaikan. (Catatan: Ini adalah respon simulasi demo. Masukkan API key di menu Pengaturan AI untuk mendapatkan balasan AI sungguhan!)`;
      suggestedProps = {
        headline: message.slice(0, 35).toUpperCase(),
        highlightWord: message.split(' ')[0]?.toUpperCase() || 'KONTEN',
        subtext: 'Dibuat otomatis oleh Males Ngonten Studio.',
      };
      mockDb.updateComposition(suggestedProps);
    }
  }

  const assistantMsg = mockDb.addChatMessage({
    sender: 'assistant',
    text: aiReplyText,
    suggestedProps,
    actionRequest,
  });

  res.json({
    success: true,
    data: {
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      updatedComposition: mockDb.getComposition(),
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
