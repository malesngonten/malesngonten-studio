/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Video, 
  LayoutGrid, 
  Boxes, 
  Sliders, 
  Activity, 
  Cpu, 
  Sparkles
} from 'lucide-react';
import { Navbar, TabType } from './components/common/Navbar.tsx';
import { DemoBanner } from './components/common/DemoBanner.tsx';
import { ExportModal } from './components/common/ExportModal.tsx';
import { StudioScreen } from './screens/StudioScreen.tsx';
import { SettingsScreen } from './screens/SettingsScreen.tsx';
import { TemplatesScreen } from './screens/TemplatesScreen.tsx';
import { ExtensionsScreen } from './screens/ExtensionsScreen.tsx';
import { DoctorScreen } from './screens/DoctorScreen.tsx';
import { AppInfoModal } from './components/common/AppInfoModal.tsx';
import { SystemStatus, CompositionProps } from './contracts/types.ts';
import { TemplateManifest } from './contracts/manifest.ts';
import { apiClient } from './api/client.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('studio');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [currentComposition, setCurrentComposition] = useState<CompositionProps | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const [status, comp] = await Promise.all([
        apiClient.getStatus(),
        apiClient.getComposition(),
      ]);
      setSystemStatus(status);
      setCurrentComposition(comp);
    } catch (err) {
      console.error('Failed to load system status:', err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleUseTemplate = async (template: TemplateManifest) => {
    try {
      const updated = await apiClient.updateComposition({
        headline: template.title.toUpperCase(),
        highlightWord: template.title.split(' ')[0] || 'KONTEN',
        subtext: template.description,
        aspectRatio: template.aspectRatio,
        durationInSeconds: Math.round(template.durationInFrames / template.fps),
        fps: template.fps,
      });
      setCurrentComposition(updated);
      setActiveTab('studio');
      showToast(`Template "${template.title}" berhasil dimuat ke Studio!`);
    } catch (err: any) {
      showToast(`Gagal memuat template: ${err.message}`);
    }
  };

  const navItems = [
    { id: 'studio' as TabType, label: 'Studio Video', icon: Video, badge: 'Utama' },
    { id: 'templates' as TabType, label: 'Pilihan Template', icon: LayoutGrid },
    { id: 'extensions' as TabType, label: 'Fitur & Skill', icon: Boxes },
    { id: 'doctor' as TabType, label: 'Pemeriksaan Sistem', icon: Activity },
    { id: 'settings' as TabType, label: 'Pengaturan AI', icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-[#0c0d11] text-[#e2e4e9] flex flex-col font-sans selection:bg-white/20 selection:text-white">
      {/* Demo Banner */}
      {systemStatus?.isDemoMode && (
        <DemoBanner onNavigateSettings={() => setActiveTab('settings')} />
      )}

      {/* Main Container with Desktop Sidebar & Mobile Views */}
      <div className="flex-1 flex flex-col md:flex-row w-full">
        {/* Desktop Sidebar (Clean Minimalist, No Borders) */}
        <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 bg-[#111217] p-4 space-y-6">
          {/* Logo Brand Header - Clicking opens App Info Modal */}
          <button 
            onClick={() => setIsInfoOpen(true)}
            className="flex items-center gap-3 cursor-pointer group p-2.5 rounded-2xl hover:bg-white/5 transition-all text-left w-full"
            title="Klik untuk melihat detail aplikasi & sistem"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#1a1c24] flex items-center justify-center shrink-0 p-1.5 shadow-md group-hover:scale-105 transition-transform">
              <img
                src="/assets/aistudio/PhotoRoom-20261031_185018_f6d34a51.png"
                alt="Logo Studio"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm tracking-tight text-white flex items-center gap-1.5 truncate">
                Studio Video AI
              </span>
              <span className="text-[11px] text-zinc-400 tracking-normal flex items-center gap-1">
                <span>Detail Aplikasi</span>
                <span className="text-[10px] text-zinc-600">→</span>
              </span>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="space-y-1.5 flex-1">
            <span className="text-[11px] uppercase font-semibold text-zinc-500 tracking-wider px-3 mb-2 block">
              Menu Navigasi
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-black font-semibold shadow-md'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      isActive ? 'bg-black/10 text-black' : 'bg-[#1c1e26] text-zinc-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Status Info Footer */}
          <div className="rounded-2xl bg-[#161820] border border-white/5 p-3.5 space-y-2 text-xs shadow-md">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-sky-400" /> Mesin AI
              </span>
              <span className={`font-medium ${systemStatus?.isDemoMode ? 'text-amber-400' : 'text-emerald-400'}`}>
                {systemStatus?.isDemoMode ? 'Simulasi' : 'Terhubung'}
              </span>
            </div>

            <div className="text-[11px] text-zinc-400 leading-snug">
              Studio video otomatis. Berjalan lokal di komputer atau Termux Android Anda.
            </div>

            <div className="pt-1 flex items-center justify-between text-[10px] text-zinc-500">
              <span>v1.0 Produksi</span>
              <span>Open Source</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            systemStatus={systemStatus}
            onOpenExport={() => setIsExportOpen(true)}
            onOpenInfo={() => setIsInfoOpen(true)}
          />

          <main className="flex-1 w-full overflow-y-auto">
            {activeTab === 'studio' && (
              <StudioScreen
                onNavigateSettings={() => setActiveTab('settings')}
                systemStatus={systemStatus}
              />
            )}
            {activeTab === 'templates' && (
              <TemplatesScreen onUseTemplate={handleUseTemplate} />
            )}
            {activeTab === 'extensions' && <ExtensionsScreen />}
            {activeTab === 'doctor' && <DoctorScreen />}
            {activeTab === 'settings' && (
              <SettingsScreen onSettingsSaved={fetchStatus} />
            )}
          </main>
        </div>
      </div>

      {/* Export Video Dialog */}
      {currentComposition && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          composition={currentComposition}
        />
      )}

      {/* App Details & System Info Modal */}
      <AppInfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        systemStatus={systemStatus}
        onNavigateSettings={() => {
          setIsInfoOpen(false);
          setActiveTab('settings');
        }}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 md:bottom-6 right-4 z-50 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-b from-[#242630] to-[#181a20] text-white text-xs sm:text-sm shadow-2xl border border-white/10">
            <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
