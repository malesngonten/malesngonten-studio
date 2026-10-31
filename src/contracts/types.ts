/**
 * Application domain types for Males Ngonten Studio
 */

export type AgentStatusType = 'siap' | 'belum_login' | 'tidak_terpasang' | 'error';

export interface DetectedAgent {
  id: string;
  name: string;
  command: string;
  status: AgentStatusType;
  version?: string;
  langkahPerbaikan: string;
  description: string;
  isDefault?: boolean;
}

export type ProviderPreset = 
  | 'custom'
  | 'nvidia'
  | 'openrouter'
  | 'groq'
  | 'ollama'
  | 'lmstudio'
  | 'together'
  | 'deepseek';

export interface AISettings {
  preset: ProviderPreset;
  baseUrl: string;
  model: string;
  hasKey: boolean;
  maskedKey?: string;
}

export interface AISettingsPayload {
  preset: ProviderPreset;
  baseUrl: string;
  model: string;
  apiKey?: string;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  latencyMs?: number;
  detectedModel?: string;
  errorType?: 'invalid_key' | 'quota_exceeded' | 'model_not_found' | 'network_error';
}

export interface SystemStatus {
  isConfigured: boolean;
  isDemoMode: boolean;
  activeProvider: string;
  activeModel: string;
  activeAgent: string;
  agentStatus: AgentStatusType;
}

export interface DoctorCheckItem {
  id: string;
  name: string;
  category: 'runtime' | 'media' | 'agent' | 'network';
  status: 'pass' | 'fail' | 'warn';
  version?: string;
  details: string;
  suggestedFix: string;
  fixCommand?: string;
}

export interface DoctorReport {
  timestamp: string;
  os: string;
  arch: string;
  items: DoctorCheckItem[];
  allHealthy: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  suggestedProps?: Partial<CompositionProps>;
  actionRequest?: {
    type: 'install_library' | 'apply_preset' | 'change_template';
    title: string;
    description: string;
    packageName?: string;
    version?: string;
    payload?: unknown;
  };
}

export interface CompositionProps {
  headline: string;
  highlightWord: string;
  subtext: string;
  tagline: string;
  aspectRatio: '9:16' | '16:9' | '1:1';
  durationInSeconds: number;
  fps: number;
  primaryColor: string;
  accentColor: string;
  bgColor: string;
  fontStyle: 'display' | 'sans' | 'mono';
  animationPreset: 'kinetic-pop' | 'typewriter' | 'neon-pulse' | 'smooth-slide';
  authorHandle: string;
}
