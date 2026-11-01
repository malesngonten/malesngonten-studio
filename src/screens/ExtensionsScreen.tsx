import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Package, 
  Sparkles, 
  Layers, 
  ShieldCheck,
  Check
} from 'lucide-react';
import { ExtensionManifest, ExtensionType } from '../contracts/manifest.ts';
import { apiClient } from '../api/client.ts';
import { ApprovalDialog } from '../components/common/ApprovalDialog.tsx';

export const ExtensionsScreen: React.FC = () => {
  const [extensions, setExtensions] = useState<ExtensionManifest[]>([]);
  const [activeTypeFilter, setActiveTypeFilter] = useState<'all' | ExtensionType>('all');
  const [simulatedPromptDialogOpen, setSimulatedPromptDialogOpen] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    loadExtensions();
  }, []);

  const loadExtensions = async () => {
    try {
      const data = await apiClient.getExtensions();
      setExtensions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggle = async (id: string, currentEnabled: boolean) => {
    try {
      const updated = await apiClient.toggleExtension(id, !currentEnabled);
      setExtensions((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } catch (err: any) {
      alert(`Gagal mengubah status: ${err.message}`);
    }
  };

  const handleSimulateAiRequest = () => {
    setSimulatedPromptDialogOpen(true);
  };

  const handleApproveSimulatedInstall = async () => {
    setIsInstalling(true);
    try {
      const newExt: ExtensionManifest = {
        id: `ext-paths-${Date.now()}`,
        name: '@remotion/paths',
        type: 'library',
        version: '^4.0.120',
        author: 'Remotion Core Team',
        source: 'npm registry resmi',
        description: 'Efek garis animasi vektor dinamis dan transisi bentuk geometris untuk mempercantik video.',
        enabled: true,
        permissions: ['Akses Animasi Garis Vektor'],
        requiredNpmPackages: ['@remotion/paths'],
      };

      const installed = await apiClient.installExtension(newExt);
      setExtensions((prev) => [installed, ...prev.filter((e) => e.id !== installed.id)]);
      setSimulatedPromptDialogOpen(false);
    } catch (err: any) {
      alert(`Gagal: ${err.message}`);
    } finally {
      setIsInstalling(false);
    }
  };

  const extensionTypes: { id: 'all' | ExtensionType; label: string; icon: any }[] = [
    { id: 'all', label: 'Semua Fitur', icon: Boxes },
    { id: 'library', label: 'Library Efek', icon: Package },
    { id: 'skill', label: 'Keahlian AI', icon: Sparkles },
    { id: 'component', label: 'Paket Animasi', icon: Layers },
  ];

  const filteredExtensions = extensions.filter((ext) => {
    if (activeTypeFilter === 'all') return true;
    return ext.type === activeTypeFilter;
  });

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 pb-28 md:pb-16 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-sky-400" />
            Fitur &amp; Skill Tambahan
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
            Aktifkan atau nonaktifkan modul animasi, gaya bahasa otomatis, dan efek video.
          </p>
        </div>

        <button
          onClick={handleSimulateAiRequest}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-sky-600" />
          <span>Uji Izin Fitur Baru</span>
        </button>
      </div>

      {/* Safety Notice */}
      <div className="rounded-3xl bg-[#14161c] p-4 sm:p-5 flex items-start gap-3.5 shadow-md">
        <div className="w-10 h-10 rounded-2xl bg-sky-500/10 flex items-center justify-center shrink-0 text-sky-400">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-white">
            Kontrol Penuh di Tangan Anda
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Setiap kali AI membutuhkan library animasi baru, sistem akan selalu meminta persetujuan Anda terlebih dahulu sebelum memasangnya.
          </p>
        </div>
      </div>

      {/* Type Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs sm:text-sm">
        {extensionTypes.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTypeFilter(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                activeTypeFilter === t.id
                  ? 'bg-white text-black font-semibold shadow-md'
                  : 'bg-[#15171e] text-zinc-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Extensions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredExtensions.map((ext) => (
          <div
            key={ext.id}
            className={`p-5 rounded-3xl bg-[#15171e] transition-all flex flex-col justify-between space-y-4 shadow-lg ${
              ext.enabled ? 'opacity-100' : 'opacity-60'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#1c1e28] flex items-center justify-center text-white shrink-0">
                    {ext.type === 'library' && <Package className="w-5 h-5 text-sky-400" />}
                    {ext.type === 'skill' && <Sparkles className="w-5 h-5 text-amber-400" />}
                    {ext.type === 'component' && <Layers className="w-5 h-5 text-rose-400" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">
                      {ext.name}
                    </h3>
                    <span className="text-xs text-zinc-400 capitalize">
                      {ext.type === 'library' ? 'Library Efek' : ext.type === 'skill' ? 'Keahlian AI' : 'Paket Animasi'}
                    </span>
                  </div>
                </div>

                {/* Big Switch Button */}
                <button
                  onClick={() => handleToggle(ext.id, ext.enabled)}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none ${
                    ext.enabled ? 'bg-sky-500' : 'bg-[#262831]'
                  }`}
                  role="switch"
                  aria-checked={ext.enabled}
                  aria-label={`Toggle ${ext.name}`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                      ext.enabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                {ext.description}
              </p>
            </div>

            {/* Footer */}
            <div className="pt-2 flex items-center justify-between text-xs text-zinc-400">
              <span>Sumber: <strong className="text-zinc-200">{ext.author}</strong></span>
              <span className={`px-2.5 py-0.5 rounded-full font-medium ${
                ext.enabled ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-zinc-500'
              }`}>
                {ext.enabled ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Approval Dialog */}
      <ApprovalDialog
        isOpen={simulatedPromptDialogOpen}
        title="AI Merekomendasikan Fitur Baru"
        description="Untuk merender garis vektor dan efek visual yang lebih memukau, AI merekomendasikan pemasangan modul @remotion/paths."
        targetName="@remotion/paths"
        version="^4.0.120"
        license="MIT"
        confirmLabel="Ya, Pasang Sekarang"
        cancelLabel="Nanti Saja"
        onConfirm={handleApproveSimulatedInstall}
        onCancel={() => setSimulatedPromptDialogOpen(false)}
      />
    </div>
  );
};
