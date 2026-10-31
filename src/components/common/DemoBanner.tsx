import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface DemoBannerProps {
  onNavigateSettings: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ onNavigateSettings }) => {
  return (
    <div className="bg-gradient-to-r from-[#1c1d24] via-[#15161b] to-[#111216] px-3.5 py-2 sm:px-5 text-xs text-zinc-300 shadow-sm">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-1.5 w-1.5 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-white flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" /> Mode Demo:
            </span>
            <span className="text-zinc-400">
              Belum ada AI Key & Model. Respons disimulasikan dari mock lokal.
            </span>
          </div>
        </div>

        <button
          onClick={onNavigateSettings}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#272932] hover:bg-[#323440] text-white text-[11px] font-medium transition-colors shrink-0 cursor-pointer self-end sm:self-auto"
        >
          <span>Atur Model (BYOK)</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
