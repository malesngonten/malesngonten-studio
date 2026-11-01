import React from 'react';
import { 
  X, 
  Sparkles, 
  Terminal, 
  ShieldCheck, 
  Cpu, 
  Video, 
  ExternalLink,
  Smartphone,
  Layers,
  Heart
} from 'lucide-react';
import { SystemStatus } from '../../contracts/types.ts';

interface AppInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemStatus: SystemStatus | null;
  onNavigateSettings: () => void;
}

export const AppInfoModal: React.FC<AppInfoModalProps> = ({
  isOpen,
  onClose,
  systemStatus,
  onNavigateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#181a20] via-[#131418] to-[#0f1013] p-5 sm:p-6 shadow-2xl shadow-black text-zinc-200 space-y-5 max-h-[90vh] overflow-y-auto"
      >
        {/* Header with App Logo & Title */}
        <div className="flex items-start justify-between gap-3 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center p-2 shadow-inner">
              <img
                src="/assets/aistudio/PhotoRoom-20261031_185018_f6d34a51.png"
                alt="Logo Studio"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight flex items-center gap-2">
                Studio Video AI
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium">
                  v1.0 Siap Produksi
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                Studio pembuatan video otomatis berbasis React & Remotion
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Highlights */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-2xl bg-[#1c1e26] space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>Status AI</span>
            </div>
            <div className="font-medium text-white flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${systemStatus?.isDemoMode ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
              <span className="truncate">{systemStatus?.isDemoMode ? 'Mode Simulasi' : systemStatus?.activeProvider || 'Terhubung'}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#1c1e26] space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
              <Video className="w-3.5 h-3.5 text-rose-400" />
              <span>Engine Video</span>
            </div>
            <div className="font-medium text-white">
              Remotion 4.0 (React)
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#1c1e26] space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Kompatibilitas</span>
            </div>
            <div className="font-medium text-white">
              Android Termux / Linux
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#1c1e26] space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Keamanan Kunci</span>
            </div>
            <div className="font-medium text-white">
              100% Memori Lokal (BYOK)
            </div>
          </div>
        </div>

        {/* Plain-English Overview */}
        <div className="space-y-2 text-xs sm:text-sm text-zinc-300 leading-relaxed bg-[#14151a] p-3.5 rounded-2xl">
          <p className="font-medium text-white text-xs uppercase tracking-wider text-zinc-400 mb-1">
            Tentang Aplikasi
          </p>
          <p>
            Aplikasi ini dirancang untuk kreator konten yang ingin memproduksi video vertikal (TikTok, Reels, Shorts) dengan cepat dan praktis tanpa pusing belajar editing rumit.
          </p>
          <p>
            Cukup ketik ide di kolom percakapan, AI akan otomatis menyusun kata-kata pancingan (hook 3 detik), warna, dan animasi teks yang langsung dapat diputar dan diunduh.
          </p>
        </div>

        {/* Production Terminal / Termux Readiness */}
        <div className="p-3.5 rounded-2xl bg-[#14151a] space-y-2 text-xs">
          <div className="flex items-center gap-2 text-white font-medium">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Siap Dijalankan di Terminal & Termux Android</span>
          </div>
          <p className="text-zinc-400 leading-normal">
            Proyek ini bersifat 100% open-source dan ringan. Anda dapat memasangnya langsung di Termux Android, Ubuntu, Linux Server, atau laptop dengan perintah standar:
          </p>
          <div className="p-2.5 rounded-xl bg-black/60 font-mono text-[11px] text-emerald-300 select-all overflow-x-auto">
            npm install &amp;&amp; npm run dev
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 gap-3">
          <button
            onClick={() => {
              onClose();
              onNavigateSettings();
            }}
            className="px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-center gap-2"
          >
            <Cpu className="w-4 h-4 text-blue-400" />
            <span>Atur Kunci AI</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full bg-white text-black hover:bg-zinc-200 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-md"
          >
            Mengerti &amp; Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
