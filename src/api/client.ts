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
  ChatMessage 
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
