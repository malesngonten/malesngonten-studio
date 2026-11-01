import React from 'react';
import { 
  Video, 
  LayoutGrid, 
  Boxes, 
  Sliders, 
  Activity, 
  Download,
  Sparkles,
  Info
} from 'lucide-react';
import { SystemStatus } from '../../contracts/types.ts';
import { GlowPill } from './GlowBorder.tsx';

export type TabType = 'studio' | 'templates' | 'extensions' | 'settings' | 'doctor';

interface NavbarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  systemStatus: SystemStatus | null;
  onOpenExport: () => void;
  onOpenInfo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  systemStatus,
  onOpenExport,
  onOpenInfo,
}) => {
  const navItems = [
    { id: 'studio' as TabType, label: 'Studio', icon: Video },
    { id: 'templates' as TabType, label: 'Template', icon: LayoutGrid },
    { id: 'extensions' as TabType, label: 'Fitur', icon: Boxes },
    { id: 'doctor' as TabType, label: 'Cek Sistem', icon: Activity },
    { id: 'settings' as TabType, label: 'Pengaturan', icon: Sliders },
  ];

  const isDemo = Boolean(systemStatus?.isDemoMode);

  return (
    <>
      {/* Top Header Bar: Clean & Minimalist (No borders, no Plus button) */}
      <header className="sticky top-0 z-40 w-full bg-[#0c0d11]/90 backdrop-blur-xl px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto gap-3">
          {/* Logo Button - Clicking shows app details modal */}
          <button 
            onClick={onOpenInfo}
            className="flex items-center gap-2.5 p-1 rounded-2xl hover:bg-white/5 active:scale-95 transition-all cursor-pointer group"
            title="Klik untuk melihat detail aplikasi & sistem"
            aria-label="Detail Aplikasi"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#171820] flex items-center justify-center p-1.5 shadow-md group-hover:scale-105 transition-transform">
              <img
                src="/assets/aistudio/PhotoRoom-20261031_185018_f6d34a51.png"
                alt="Logo Studio"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors font-medium">
              <Info className="w-3.5 h-3.5" />
              <span>Detail Studio</span>
            </span>
          </button>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Attention-grabbing button when AI is not yet configured (1px Rotating Iridescent Glow Border) */}
            {isDemo ? (
              <GlowPill onClick={() => onSelectTab('settings')} title="Hubungkan AI untuk respon otomatis">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Hubungkan AI</span>
              </GlowPill>
            ) : (
              <button
                onClick={() => onSelectTab('settings')}
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-medium cursor-pointer"
                title="AI Aktif"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{systemStatus?.activeProvider || 'AI Aktif'}</span>
              </button>
            )}

            {/* Export Video Button */}
            <button
              onClick={onOpenExport}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black hover:bg-zinc-200 text-xs sm:text-sm font-semibold shadow-md transition-all cursor-pointer active:scale-95"
              title="Export video dengan Remotion CLI pipeline"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </header>

      {/* Original Mobile Bottom Navigation Bar: Docked, Full-Width, Clean Minimalist */}
      <nav 
        aria-label="Navigasi Utama" 
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0c0d11]/95 backdrop-blur-xl pb-[max(env(safe-area-inset-bottom),6px)] pt-1 px-1"
      >
        <div className="grid grid-cols-5 items-center justify-around h-14">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex flex-col items-center justify-center h-full transition-colors cursor-pointer active:scale-95 select-none ${
                  isActive
                    ? 'text-white'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                aria-label={item.label}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-zinc-500'}`} />
                <span className={`text-[11px] mt-1 tracking-tight ${isActive ? 'text-white font-semibold' : 'text-zinc-500'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
