import React from 'react';
import { 
  Video, 
  LayoutGrid, 
  Boxes, 
  Sliders, 
  Activity, 
  Download,
  Plus
} from 'lucide-react';
import { SystemStatus } from '../../contracts/types.ts';

export type TabType = 'studio' | 'templates' | 'extensions' | 'settings' | 'doctor';

interface NavbarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  systemStatus: SystemStatus | null;
  onOpenExport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  systemStatus,
  onOpenExport,
}) => {
  const navItems = [
    { id: 'studio' as TabType, label: 'Studio', icon: Video },
    { id: 'templates' as TabType, label: 'Template', icon: LayoutGrid },
    { id: 'extensions' as TabType, label: 'Ekstensi', icon: Boxes },
    { id: 'doctor' as TabType, label: 'Doctor', icon: Activity },
    { id: 'settings' as TabType, label: 'Pengaturan', icon: Sliders },
  ];

  const isConfigured = Boolean(systemStatus && !systemStatus.isDemoMode);

  return (
    <>
      {/* Top Header Bar (Clean, Minimalist, matching reference image 1) */}
      <header className="sticky top-0 z-40 w-full bg-gradient-to-b from-[#16171b] via-[#121316] to-[#0f1013]/90 backdrop-blur-md px-3 sm:px-6 py-2.5 shadow-sm shadow-black/20">
        <div className="flex items-center justify-between max-w-5xl mx-auto gap-3">
          {/* Logo & Brand matching Reference 1 & 2 */}
          <div 
            onClick={() => onSelectTab('studio')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <img
                src="/assets/aistudio/PhotoRoom-20261031_185018_f6d34a51.png"
                alt="Logo Males Ngonten Studio"
                className="w-7 h-7 object-contain opacity-95 group-hover:opacity-100 transition-opacity"
              />
            </div>
            <span className="text-[15px] sm:text-base font-normal tracking-tight text-white flex items-center gap-1.5">
              Males Ngonten Studio
            </span>
          </div>

          {/* Right Header Actions: Plus button and Export button */}
          <div className="flex items-center gap-2">
            {/* Quick action / Plus button matching reference image 1 */}
            <button
              onClick={() => onSelectTab('settings')}
              className="w-8 h-8 rounded-full bg-[#1e2026] hover:bg-[#282a33] text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Pengaturan & Model Baru"
              aria-label="Tambah atau Konfigurasi"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Export Video Button */}
            <button
              onClick={onOpenExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-b from-white to-zinc-200 hover:from-zinc-100 hover:to-zinc-300 text-black text-xs font-medium shadow-sm transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav 
        aria-label="Navigasi Utama" 
        className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-[#090a0d] via-[#111216]/98 to-[#15161b]/95 backdrop-blur-xl pb-[max(env(safe-area-inset-bottom),8px)] pt-2 shadow-2xl shadow-black select-none"
      >
        <div className="flex items-center max-w-lg mx-auto px-2 sm:px-3 w-full gap-1.5 sm:gap-2">
          {/* Pinned Tool Utama: Studio (Fixed on left, tidak bisa digeser/scroll) */}
          <div className="shrink-0 flex items-center pr-1 relative">
            <button
              onClick={() => onSelectTab('studio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all cursor-pointer select-none font-medium ${
                activeTab === 'studio'
                  ? 'bg-gradient-to-b from-white to-zinc-200 text-black shadow-md shadow-white/10'
                  : 'bg-[#1c1e25] text-zinc-300 hover:text-white hover:bg-[#252832]'
              }`}
              title="Studio (Tool Utama — Tetap)"
            >
              <Video className={`w-3.5 h-3.5 ${activeTab === 'studio' ? 'text-black' : 'text-zinc-300'}`} />
              <span className="text-[12px] font-semibold tracking-tight">Studio</span>
              <span 
                className={`w-1.5 h-1.5 rounded-full ${activeTab === 'studio' ? 'bg-black' : 'bg-white/80'}`} 
                title="Tool Utama" 
              />
            </button>
          </div>

          {/* Subtle vertical gradation divider */}
          <div className="h-5 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent shrink-0" />

          {/* Horizontally Scrollable items container for the remaining tools */}
          <div className="relative flex-1 min-w-0 overflow-hidden flex items-center">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-1 w-full scroll-smooth overscroll-x-contain touch-pan-x">
              {navItems
                .filter((item) => item.id !== 'studio')
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-[#2a2c34] text-white font-medium shadow-sm' 
                          : 'text-zinc-400 hover:text-zinc-200 font-normal hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-zinc-400'}`} />
                      <span className="text-[12px] tracking-tight">{item.label}</span>
                    </button>
                  );
                })}
            </div>
            {/* Subtle right edge gradient fade hint */}
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-l from-[#111216] to-transparent" />
          </div>
        </div>
      </nav>
    </>
  );
};
