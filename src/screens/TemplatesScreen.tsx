import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, 
  UploadCloud, 
  Folder, 
  Github, 
  FileArchive, 
  Play, 
  Info, 
  X,
  Search,
  Sparkles
} from 'lucide-react';
import { TemplateManifest } from '../contracts/manifest.ts';
import { apiClient } from '../api/client.ts';
import { ApprovalDialog } from '../components/common/ApprovalDialog.tsx';

interface TemplatesScreenProps {
  onUseTemplate: (template: TemplateManifest) => void;
}

export const TemplatesScreen: React.FC<TemplatesScreenProps> = ({ onUseTemplate }) => {
  const [templates, setTemplates] = useState<TemplateManifest[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplateForDetail, setSelectedTemplateForDetail] = useState<TemplateManifest | null>(null);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importSource, setImportSource] = useState<'zip' | 'folder' | 'github'>('zip');
  const [folderPathInput, setFolderPathInput] = useState('/home/user/projects/remotion-reel-hook');
  const [githubUrlInput, setGithubUrlInput] = useState('https://github.com/remotion-dev/template-tiktok');
  const [zipFileName, setZipFileName] = useState('template-kinetic-quote-v2.zip');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Approval Dialog State
  const [stagedManifest, setStagedManifest] = useState<TemplateManifest | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await apiClient.getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAnalyzing(true);

    try {
      const parsed = await apiClient.importTemplate({
        source: importSource,
        pathOrUrl: importSource === 'folder' ? folderPathInput : importSource === 'github' ? githubUrlInput : undefined,
        zipName: importSource === 'zip' ? zipFileName : undefined,
      });

      setIsImportModalOpen(false);
      setStagedManifest(parsed);
    } catch (err: any) {
      alert(`Gagal menganalisis template: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirmInstall = async () => {
    if (!stagedManifest) return;
    try {
      const installed = await apiClient.installTemplate(stagedManifest);
      setTemplates((prev) => [installed, ...prev.filter((t) => t.name !== installed.name)]);
      setStagedManifest(null);
    } catch (err: any) {
      alert(`Gagal memasang template: ${err.message}`);
    }
  };

  const categories = ['Semua', 'TikTok / Reels', 'Podcast Hook', 'Quote Motivasi', 'Berita Singkat'];

  const filteredTemplates = templates.filter((tpl) => {
    const matchesCat = selectedCategory === 'Semua' || tpl.category === selectedCategory;
    const matchesSearch =
      tpl.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpl.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 pb-28 md:pb-16 space-y-6">
      {/* Header & Import Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <LayoutGrid className="w-6 h-6 text-sky-400" />
            Galeri Template Video
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
            Pilih tata letak video siap pakai atau impor template baru dari komunitas.
          </p>
        </div>

        <button
          onClick={() => setIsImportModalOpen(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Tambah Template</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs sm:text-sm">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-white text-black font-semibold shadow-md'
                  : 'bg-[#15171e] text-zinc-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari template..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full bg-[#15171e] pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-sky-400"
          />
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {filteredTemplates.map((tpl) => (
          <div
            key={tpl.name}
            className="rounded-3xl bg-[#15171e] overflow-hidden shadow-xl flex flex-col justify-between group transition-all"
          >
            {/* Visual Thumbnail */}
            <div className="relative aspect-[16/10] bg-black overflow-hidden">
              <img
                src={tpl.preview}
                alt={tpl.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#15171e] via-black/20 to-transparent" />

              {/* Badges on Thumbnail */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-black/80 backdrop-blur-md text-zinc-200">
                  {tpl.aspectRatio}
                </span>
                <span className="text-xs px-3 py-1 rounded-full bg-sky-500/80 backdrop-blur-md text-white font-medium">
                  {tpl.category}
                </span>
              </div>

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-zinc-300">
                <span className="font-semibold text-white drop-shadow">{tpl.title}</span>
                <span className="font-mono text-zinc-300 drop-shadow">
                  {Math.round(tpl.durationInFrames / tpl.fps)} detik · {tpl.fps} fps
                </span>
              </div>
            </div>

            {/* Template Info Content */}
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-1.5">
                <p className="text-xs sm:text-sm text-zinc-300 line-clamp-2 leading-relaxed">
                  {tpl.description}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Kreator: <strong className="text-zinc-200">{tpl.author}</strong></span>
                <button
                  onClick={() => setSelectedTemplateForDetail(tpl)}
                  className="text-sky-400 hover:text-sky-300 underline cursor-pointer"
                >
                  Detail Info
                </button>
              </div>

              {/* Action Button */}
              <button
                onClick={() => onUseTemplate(tpl)}
                className="w-full py-3 rounded-2xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Gunakan Template Ini</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#161820] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-2xl bg-white/10 text-white">
                  <UploadCloud className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Tambah Template Video</h3>
                  <p className="text-xs text-zinc-400">Pilih sumber berkas template</p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-zinc-400 hover:text-white p-2 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStartImport} className="p-6 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'zip' as const, label: 'Berkas .Zip', icon: FileArchive },
                  { id: 'folder' as const, label: 'Folder Lokal', icon: Folder },
                  { id: 'github' as const, label: 'GitHub Repo', icon: Github },
                ].map((src) => {
                  const Icon = src.icon;
                  return (
                    <button
                      key={src.id}
                      type="button"
                      onClick={() => setImportSource(src.id)}
                      className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        importSource === src.id
                          ? 'bg-white text-black font-semibold border-white shadow-md'
                          : 'bg-[#101116] border-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-xs">{src.label}</span>
                    </button>
                  );
                })}
              </div>

              {importSource === 'zip' && (
                <div className="space-y-1.5">
                  <label className="text-zinc-300 font-medium">Nama Berkas ZIP</label>
                  <input
                    type="text"
                    value={zipFileName}
                    onChange={(e) => setZipFileName(e.target.value)}
                    placeholder="nama-template.zip"
                    className="w-full rounded-2xl bg-[#0f1015] border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-sky-400 text-xs sm:text-sm"
                  />
                </div>
              )}

              {importSource === 'github' && (
                <div className="space-y-1.5">
                  <label className="text-zinc-300 font-medium">URL Repositori GitHub</label>
                  <input
                    type="url"
                    value={githubUrlInput}
                    onChange={(e) => setGithubUrlInput(e.target.value)}
                    placeholder="https://github.com/..."
                    className="w-full rounded-2xl bg-[#0f1015] border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-sky-400 text-xs sm:text-sm"
                  />
                </div>
              )}

              {importSource === 'folder' && (
                <div className="space-y-1.5">
                  <label className="text-zinc-300 font-medium">Alamat Path Folder Lokal</label>
                  <input
                    type="text"
                    value={folderPathInput}
                    onChange={(e) => setFolderPathInput(e.target.value)}
                    placeholder="/path/ke/folder"
                    className="w-full rounded-2xl bg-[#0f1015] border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-sky-400 text-xs sm:text-sm"
                  />
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2.5 rounded-full text-zinc-400 hover:text-white cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="px-6 py-2.5 rounded-full bg-white text-black font-semibold hover:bg-zinc-200 cursor-pointer shadow-md disabled:opacity-40"
                >
                  {isAnalyzing ? 'Menganalisis...' : 'Periksa & Lanjutkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Template Detail Modal */}
      {selectedTemplateForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#161820] border border-white/10 p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedTemplateForDetail.title}</h3>
                <p className="text-xs text-zinc-400">{selectedTemplateForDetail.description}</p>
              </div>
              <button
                onClick={() => setSelectedTemplateForDetail(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-[#0f1015] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Aspek Rasio:</span>
                <span className="text-white font-mono">{selectedTemplateForDetail.aspectRatio}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Durasi:</span>
                <span className="text-white font-mono">{Math.round(selectedTemplateForDetail.durationInFrames / selectedTemplateForDetail.fps)} detik</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Kreator:</span>
                <span className="text-white">{selectedTemplateForDetail.author}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Lisensi:</span>
                <span className="text-white font-mono">{selectedTemplateForDetail.license}</span>
              </div>
            </div>

            <button
              onClick={() => {
                onUseTemplate(selectedTemplateForDetail);
                setSelectedTemplateForDetail(null);
              }}
              className="w-full py-3 rounded-2xl bg-white text-black font-semibold hover:bg-zinc-200 cursor-pointer shadow-md"
            >
              Gunakan Template Ini Sekarang
            </button>
          </div>
        </div>
      )}

      {/* Approval Dialog */}
      {stagedManifest && (
        <ApprovalDialog
          isOpen={true}
          title={`Pasang Template: ${stagedManifest.title}`}
          description={stagedManifest.description}
          targetName={stagedManifest.name}
          version={stagedManifest.version}
          license={stagedManifest.license}
          confirmLabel="Pasang ke Koleksi"
          cancelLabel="Batal"
          onConfirm={handleConfirmInstall}
          onCancel={() => setStagedManifest(null)}
        />
      )}
    </div>
  );
};
