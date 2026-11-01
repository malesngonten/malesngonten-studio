import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { GlowPill } from './GlowBorder.tsx';

interface DemoBannerProps {
  onNavigateSettings: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ onNavigateSettings }) => {
  return (
    <div className="bg-[#121319] px-4 py-2.5 sm:px-6 text-xs text-zinc-300">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
          </span>
          <p className="text-zinc-300 text-xs sm:text-sm">
            <strong className="text-white">Mode Demo:</strong> AI belum terhubung. Anda dapat menghubungkan provider apa pun (OpenAI, Groq, Ollama, Gemini, dll) di Pengaturan.
          </p>
        </div>

        <GlowPill onClick={onNavigateSettings}>
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Hubungkan AI</span>
          <ArrowRight className="w-3.5 h-3.5 text-zinc-300" />
        </GlowPill>
      </div>
    </div>
  );
};
