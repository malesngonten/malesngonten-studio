/**
 * Unified API Client for Males Ngonten Studio
 * All data access in the UI routes exclusively through this module.
 */

import { 
  SystemStatus, 
  AISettings, 
  AISettingsPayload, 
  TestConnectionResult, 
  DetectedAgent, 
  DoctorReport, 
  CompositionProps, 
  ChatMessage,
  ChatActivity 
} from '../contracts/types.ts';
import { TemplateManifest, ExtensionManifest } from '../contracts/manifest.ts';

class ApiError extends Error {
  constructor(message: string, public status?: number, public details?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      body.message || `HTTP request failed with status ${response.status}`,
      response.status,
      body
    );
  }

  return body.data !== undefined ? body.data : body;
}

export const apiClient = {
  // System Status
  async getStatus(): Promise<SystemStatus> {
    return fetchJson<SystemStatus>('/api/status');
  },

  // AI Provider & BYOK Settings
  async getAISettings(): Promise<AISettings> {
    return fetchJson<AISettings>('/api/settings/ai');
  },

  async saveAISettings(payload: AISettingsPayload): Promise<AISettings> {
    return fetchJson<AISettings>('/api/settings/ai', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async testAIConnection(simulatedError?: string): Promise<TestConnectionResult> {
    return fetchJson<TestConnectionResult>('/api/settings/test-connection', {
      method: 'POST',
      body: JSON.stringify({ simulatedError }),
    });
  },

  async fetchProviderModels(params: { baseUrl?: string; apiKey?: string }): Promise<{ count: number; models: string[] }> {
    return fetchJson<{ count: number; models: string[] }>('/api/settings/fetch-models', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Detected Agents
  async getAgents(): Promise<DetectedAgent[]> {
    return fetchJson<DetectedAgent[]>('/api/agents');
  },

  async updateAgentStatus(agentId: string, status: string): Promise<DetectedAgent> {
    return fetchJson<DetectedAgent>(`/api/agents/${agentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Templates
  async getTemplates(): Promise<TemplateManifest[]> {
    return fetchJson<TemplateManifest[]>('/api/templates');
  },

  async importTemplate(params: { source: 'zip' | 'folder' | 'github'; pathOrUrl?: string; zipName?: string }): Promise<TemplateManifest> {
    return fetchJson<TemplateManifest>('/api/templates/import', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async installTemplate(manifest: TemplateManifest): Promise<TemplateManifest> {
    return fetchJson<TemplateManifest>('/api/templates/install', {
      method: 'POST',
      body: JSON.stringify({ manifest }),
    });
  },

  // Extensions
  async getExtensions(): Promise<ExtensionManifest[]> {
    return fetchJson<ExtensionManifest[]>('/api/extensions');
  },

  async toggleExtension(id: string, enabled?: boolean): Promise<ExtensionManifest> {
    return fetchJson<ExtensionManifest>(`/api/extensions/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    });
  },

  async installExtension(extension: ExtensionManifest): Promise<ExtensionManifest> {
    return fetchJson<ExtensionManifest>('/api/extensions/install', {
      method: 'POST',
      body: JSON.stringify({ extension }),
    });
  },

  // Doctor Checklist
  async getDoctorReport(): Promise<DoctorReport> {
    return fetchJson<DoctorReport>('/api/doctor');
  },

  // Composition State
  async getComposition(): Promise<CompositionProps> {
    return fetchJson<CompositionProps>('/api/composition');
  },

  async updateComposition(patch: Partial<CompositionProps>): Promise<CompositionProps> {
    return fetchJson<CompositionProps>('/api/composition', {
      method: 'POST',
      body: JSON.stringify(patch),
    });
  },

  // Chat
  async getChatMessages(): Promise<ChatMessage[]> {
    return fetchJson<ChatMessage[]>('/api/chat');
  },

  streamChatMessage(
    message: string,
    callbacks: {
      onUserMessage?: (userMsg: ChatMessage) => void;
      onToken?: (data: { delta: string; fullText?: string }) => void;
      onActivity?: (activity: ChatActivity) => void;
      onCompositionUpdate?: (composition: CompositionProps) => void;
      onStep?: (step: any) => void;
      onProgress?: (progress: any) => void;
      onResult?: (data: { userMessage: ChatMessage; assistantMessage: ChatMessage; updatedComposition: CompositionProps }) => void;
      onError?: (err: { message: string; errorType?: string; assistantMessage?: ChatMessage }) => void;
    }
  ): AbortController {
    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
          },
          body: JSON.stringify({ message }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          const errText = await response.text().catch(() => '');
          throw new Error(errText || `Server merespon dengan status ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const block of lines) {
            if (!block.trim()) continue;
            let currentEvent = 'message';
            let currentData = '';

            for (const rawLine of block.split('\n')) {
              const line = rawLine.trim();
              if (line.startsWith('event:')) {
                currentEvent = line.replace('event:', '').trim();
              } else if (line.startsWith('data:')) {
                currentData = line.replace('data:', '').trim();
              }
            }

            if (!currentData) continue;

            try {
              const parsed = JSON.parse(currentData);
              if (currentEvent === 'token') {
                callbacks.onToken?.(parsed);
              } else if (currentEvent === 'activity') {
                callbacks.onActivity?.(parsed);
              } else if (currentEvent === 'composition_update') {
                callbacks.onCompositionUpdate?.(parsed);
              } else if (currentEvent === 'user_message') {
                callbacks.onUserMessage?.(parsed);
              } else if (currentEvent === 'step') {
                callbacks.onStep?.(parsed);
              } else if (currentEvent === 'progress') {
                callbacks.onProgress?.(parsed);
              } else if (currentEvent === 'result') {
                callbacks.onResult?.(parsed);
              } else if (currentEvent === 'error') {
                callbacks.onError?.(parsed);
              }
            } catch (err) {
              console.error('Failed to parse SSE event data:', err);
            }
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        callbacks.onError?.({
          message: err.message || 'Koneksi ke server terputus',
          errorType: 'network_error',
        });
      }
    })();

    return controller;
  },

  async sendChatMessage(message: string): Promise<{
    userMessage: ChatMessage;
    assistantMessage: ChatMessage;
    updatedComposition: CompositionProps;
  }> {
    return fetchJson<{
      userMessage: ChatMessage;
      assistantMessage: ChatMessage;
      updatedComposition: CompositionProps;
    }>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  // Export
  async requestExport(composition: CompositionProps): Promise<{
    jobId: string;
    status: string;
    fileName: string;
    resolution: string;
    fps: number;
    note: string;
  }> {
    return fetchJson('/api/export', {
      method: 'POST',
      body: JSON.stringify({ composition }),
    });
  },
};
