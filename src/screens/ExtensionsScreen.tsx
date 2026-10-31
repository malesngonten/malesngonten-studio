import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  Package, 
  Sparkles, 
  Layers, 
  AlertCircle
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
      alert(`Gagal mengubah status ekstensi: ${err.message}`);
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
        source: 'npm registry (resmi)',
        description: 'Perhitungan morphing SVG path dan interpolasi garis bezier dinamis untuk animasi visual.',
        enabled: true,
        permissions: ['Akses SVG Path Matrix', 'DOM Canvas Manipulation'],
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
    { id: 'all', label: 'Semua', icon: Boxes },
    { id: 'library', label: 'Library Remotion', icon: Package },
    { id: 'skill', label: 'AI Skills', icon: Sparkles },
    { id: 'component', label: 'Component Packs', icon: Layers },
  ];

  const filteredExtensions = extensions.filter((ext) => {
    if (activeTypeFilter === 'all') return true;
    return ext.type === activeTypeFilter;
  });

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-5 pb-24 md:pb-12 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-normal text-white flex items-center gap-2.5">
            <Boxes className="w-5 h-5 text-white" /> Ekstensi & Library Remotion
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Kelola modul pendukung, skill prompt AI, dan paket efek animasi visual.
          </p>
        </div>

        {/* Trigger Approval Dialog Simulation Button */}
        <button
          onClick={handleSimulateAiRequest}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-zinc-200 text-black font-semibold text-xs shadow-md transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-black" />
          <span>Simulasi Izin AI</span>
        </button>
      </div>

      {/* Interactive Simulation Explanation Card */}
      <div className="rounded-3xl bg-gradient-to-b from-[#1c1d22] to-[#121316] p-4 text-xs text-zinc-300 space-y-1.5 shadow-md">
        <div className="flex items-center gap-2 font-medium text-white">
          <AlertCircle className="w-4 h-4 shrink-0 text-zinc-400" />
          <span>Pola Keamanan: Izin Eksplisit Pemasangan Library</span>
        </div>
        <p className="text-zinc-400 leading-relaxed pl-6">
          Ketika agen AI lokal memutuskan membutuhkan paket npm baru untuk merender efek video, AI tidak akan pernah menginstal tanpa persetujuan Anda. Klik tombol <strong>"Simulasi Izin AI"</strong> di atas untuk menguji alur dialog persetujuan.
        </p>
      </div>

      {/* Type Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {extensionTypes.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTypeFilter(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs transition-colors cursor-pointer whitespace-nowrap ${
                activeTypeFilter === t.id
                  ? 'bg-[#2a2c34] text-white font-medium shadow-sm'
                  : 'bg-[#181a20] text-zinc-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
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
            className={`p-4 rounded-3xl bg-gradient-to-b from-[#1c1d22] to-[#121316] transition-all flex flex-col justify-between space-y-3 shadow-lg ${
              ext.enabled ? 'opacity-100' : 'opacity-55'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-[#262831] text-white">
                    {ext.type === 'library' && <Package className="w-4 h-4" />}
                    {ext.type === 'skill' && <Sparkles className="w-4 h-4" />}
                    {ext.type === 'component' && <Layers className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-xs sm:text-sm font-mono">
                      {ext.name}
                    </h3>
                    <span className="text-[10px] text-zinc-500 uppercase font-medium tracking-wider">
                      {ext.type} · v{ext.version}
                    </span>
                  </div>
                </div>

                {/* Enable/Disable Toggle Switch in Monochrome */}
                <button
                  onClick={() => handleToggle(ext.id, ext.enabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                    ext.enabled ? 'bg-white' : 'bg-[#262831]'
                  }`}
                  role="switch"
                  aria-checked={ext.enabled}
                  aria-label={`Toggle ${ext.name}`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full shadow-md transition duration-200 ease-in-out ${
                      ext.enabled ? 'translate-x-5 bg-black' : 'translate-x-0 bg-white/70'
                    }`}
                  />
                </button>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                {ext.description}
              </p>
            </div>

            {/* Permissions & Source Footer */}
            <div className="pt-2 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-zinc-500">
                <span>Sumber: <strong className="text-zinc-300 font-mono">{ext.source}</strong></span>
                <span>Karya: <strong className="text-zinc-300">{ext.author}</strong></span>
              </div>

              {ext.permissions && ext.permissions.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {ext.permissions.map((p, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-full bg-[#16171c] text-zinc-400 text-[10px]"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Approval Dialog Pattern for AI Library Request */}
      <ApprovalDialog
        isOpen={simulatedPromptDialogOpen}
        title="AI Meminta Memasang Library Baru"
        description="Agen AI mendeteksi kebutuhan fungsi kalkulasi SVG path animasi untuk hook visual. Apakah Anda menyetujui eksekusi instalasi library ini di sistem lokal Anda?"
        targetName="@remotion/paths"
        version="^4.0.120"
        license="MIT"
        shellCommand="npm install @remotion/paths"
        dependencies={{ '@remotion/paths': '^4.0.120' }}
        permissions={['Akses SVG Path Matrix', 'DOM Canvas Manipulation']}
        confirmLabel="Setuju (Izinkan AI)"
        cancelLabel="Tolak Permintaan"
        onConfirm={handleApproveSimulatedInstall}
        onCancel={() => setSimulatedPromptDialogOpen(false)}
      />
    </div>
  );
};
