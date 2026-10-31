/**
 * Manifest definitions for Males Ngonten Studio
 * Standard contracts for Templates and Extensions
 */

export interface TemplateRequires {
  node?: string;
  ffmpeg?: boolean;
  chromium?: boolean;
  minMemoryMb?: number;
  [key: string]: unknown;
}

export interface TemplateManifest {
  name: string;
  version: string;
  title: string;
  author: string;
  license: string;
  entry: string;
  preview: string;
  description: string;
  category: 'TikTok / Reels' | 'Quote Motivasi' | 'Podcast Hook' | 'Berita Singkat' | 'Tutorial Koding';
  aspectRatio: '9:16' | '16:9' | '1:1';
  fps: number;
  durationInFrames: number;
  dependencies: Record<string, string>;
  requires: TemplateRequires;
  installed?: boolean;
  tags?: string[];
  sampleProps?: Record<string, unknown>;
}

export type ExtensionType = 'library' | 'skill' | 'component';

export interface ExtensionManifest {
  id: string;
  name: string;
  type: ExtensionType;
  version: string;
  author: string;
  source: string;
  description: string;
  enabled: boolean;
  permissions?: string[];
  requiredNpmPackages?: string[];
}
