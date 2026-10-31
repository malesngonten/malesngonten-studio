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
import { SystemStatus, CompositionProps } from './contracts/types.ts';
import { TemplateManifest } from './contracts/manifest.ts';
import { apiClient } from './api/client.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('studio');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
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
    { id: 'studio' as TabType, label: 'Studio Video', icon: Video, badge: 'Main' },
    { id: 'templates' as TabType, label: 'Galeri Template', icon: LayoutGrid },
    { id: 'extensions' as TabType, label: 'Ekstensi & Library', icon: Boxes },
    { id: 'doctor' as TabType, label: 'System Doctor', icon: Activity },
    { id: 'settings' as TabType, label: 'Pengaturan AI & BYOK', icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-[#0e0f13] text-[#e2e4e9] flex flex-col font-sans selection:bg-white/20 selection:text-white">
      {/* Demo Banner */}
      {systemStatus?.isDemoMode && (
        <DemoBanner onNavigateSettings={() => setActiveTab('settings')} />
      )}

      {/* Main Container with Desktop Sidebar & Mobile Views */}
      <div className="flex-1 flex flex-col md:flex-row w-full">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 bg-gradient-to-b from-[#141519] via-[#101115] to-[#0c0d10] p-4 space-y-6 shadow-xl shadow-black/40">
          {/* Logo Brand Header */}
          <div 
            onClick={() => setActiveTab('studio')}
            className="flex items-center gap-3 cursor-pointer group p-2 rounded-2xl hover:bg-white/5 transition-colors"
          >
            <div className="w-9 h-9 flex items-center justify-center shrink-0">
              <img
                src="/assets/aistudio/PhotoRoom-20261031_185018_f6d34a51.png"
                alt="Logo Males Ngonten Studio"
                className="w-8 h-8 object-contain opacity-95 group-hover:opacity-100 transition-opacity"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-sm tracking-tight text-white flex items-center gap-1.5">
                Males Ngonten
              </span>
              <span className="text-[11px] text-zinc-400 tracking-normal">
                Studio Remotion
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 flex-1">
            <span className="text-[10px] uppercase font-medium text-zinc-500 tracking-wider px-3 mb-2 block">
              Menu Navigasi
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#2a2c34] text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                      isActive ? 'bg-white/15 text-white' : 'bg-[#181a20] text-zinc-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Status Info Footer */}
          <div className="rounded-2xl bg-gradient-to-b from-[#181a20] to-[#111215] p-3.5 space-y-2 text-xs shadow-md">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-zinc-400" /> AI Engine
              </span>
              <span className={`font-medium ${systemStatus?.isDemoMode ? 'text-zinc-400' : 'text-white'}`}>
                {systemStatus?.isDemoMode ? 'Mock Offline' : 'BYOK Active'}
              </span>
            </div>

            <div className="text-[10px] text-zinc-400 leading-snug">
              Local-first video studio. Eksekusi kode & rendering via Remotion di 127.0.0.1.
            </div>

            <div className="pt-1 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
              <span>v0.1.0-alpha</span>
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

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-50 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-b from-[#242630] to-[#181a20] text-white text-xs shadow-2xl">
            <Sparkles className="w-4 h-4 text-white shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
