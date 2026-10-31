import React, { useState, useEffect } from 'react';
import { 
  LayoutGrid, 
  UploadCloud, 
  Folder, 
  Github, 
  FileArchive, 
  Play, 
  Info, 
  X
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
  const [githubUrlInput, setGithubUrlInput] = useState('https://github.com/malesngonten/tiktok-quiz-template');
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
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-5 pb-24 md:pb-12 space-y-6">
      {/* Header & Import Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-normal text-white flex items-center gap-2.5">
            <LayoutGrid className="w-5 h-5 text-white" /> Galeri Template Remotion
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Pilih tata letak video siap pakai atau impor template kustom dari komunitas.
          </p>
        </div>

        <button
          onClick={() => setIsImportModalOpen(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-zinc-200 text-black font-semibold text-xs shadow-md transition-all cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Import Template</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#2a2c34] text-white font-medium shadow-sm'
                  : 'bg-[#181a20] text-zinc-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Cari judul, tag, atau author..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-full bg-[#181a20] px-4 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/30"
        />
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTemplates.map((tpl) => (
          <div
            key={tpl.name}
            className="rounded-3xl bg-gradient-to-b from-[#1c1d22] to-[#121316] overflow-hidden shadow-xl flex flex-col justify-between group transition-all"
          >
            {/* Visual Thumbnail */}
            <div className="relative aspect-[16/10] bg-black overflow-hidden">
              <img
                src={tpl.preview}
                alt={tpl.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#121316] via-black/20 to-transparent" />

              {/* Badges on Thumbnail */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-zinc-200">
                  {tpl.aspectRatio}
                </span>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white font-medium">
                  {tpl.license}
                </span>
              </div>

              <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[11px] text-zinc-300">
                <span className="font-semibold text-white drop-shadow">{tpl.category}</span>
                <span className="font-mono text-zinc-400 drop-shadow">
                  {Math.round(tpl.durationInFrames / tpl.fps)}s · {tpl.fps}fps
                </span>
              </div>
            </div>

            {/* Template Info Content */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white text-sm">
                    {tpl.title}
                  </h3>
                  <span className="text-[10px] font-mono text-zinc-500">v{tpl.version}</span>
                </div>
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {tpl.description}
                </p>
              </div>

              {/* Author & Tags */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-500">
                <span>Karya: <strong className="text-zinc-300">{tpl.author}</strong></span>
                <button
                  onClick={() => setSelectedTemplateForDetail(tpl)}
                  className="text-zinc-400 hover:text-white underline cursor-pointer"
                >
                  Detail Manifest
                </button>
              </div>

              {/* Action Button */}
              <div className="pt-1">
                <button
                  onClick={() => onUseTemplate(tpl)}
                  className="w-full py-2 rounded-full bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Pakai Template</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#202228] to-[#141519] shadow-2xl shadow-black/80 overflow-hidden">
            <div className="flex items-center justify-between bg-gradient-to-b from-[#272932] to-[#1d1f25] px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-[#323541] text-white">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Import Template Komposisi</h3>
                  <p className="text-xs text-zinc-400">Pilih sumber berkas template Remotion</p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1.5 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStartImport} className="p-6 space-y-4 text-xs">
              {/* Source Tabs */}
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
                      className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${
                        importSource === src.id
                          ? 'bg-[#2f323c] text-white font-medium'
                          : 'bg-[#181a20] text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{src.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Source-specific Inputs */}
              {importSource === 'zip' && (
                <div className="space-y-1.5">
                  <label className="text-zinc-300 font-medium">Nama / File Arsip Template (.zip)</label>
                  <div className="rounded-2xl bg-gradient-to-b from-[#191b21] to-[#121317] p-5 text-center space-y-2">
                    <FileArchive className="w-7 h-7 text-white mx-auto" />
                    <input
                      type="text"
                      value={zipFileName}
                      onChange={(e) => setZipFileName(e.target.value)}
                      placeholder="contoh: template-tiktok-quiz.zip"
                      required
                      className="w-full text-center rounded-xl bg-[#111216] px-3 py-2 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-white/30"
                    />
                    <p className="text-[11px] text-zinc-400">
                      File zip harus berisi <code className="text-white">manifest.json</code> dan berkas komponen Remotion.
                    </p>
                  </div>
                </div>
              )}

              {importSource === 'folder' && (
                <div className="space-y-1.5">
                  <label className="text-zinc-300 font-medium">Jalur Folder Absolut di Mesin Lokal</label>
                  <input
                    type="text"
                    value={folderPathInput}
                    onChange={(e) => setFolderPathInput(e.target.value)}
                    placeholder="/Users/nama/Templates/MyTemplate"
                    required
                    className="w-full rounded-2xl bg-[#181a20] px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-white/30"
                  />
                  <p className="text-[11px] text-zinc-400">
                    Akan dibaca langsung oleh server Node lokal Anda tanpa upload internet.
                  </p>
                </div>
              )}

              {importSource === 'github' && (
                <div className="space-y-1.5">
                  <label className="text-zinc-300 font-medium">Tautan Repositori GitHub</label>
                  <input
                    type="url"
                    value={githubUrlInput}
                    onChange={(e) => setGithubUrlInput(e.target.value)}
                    placeholder="https://github.com/user/remotion-template"
                    required
                    className="w-full rounded-2xl bg-[#181a20] px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-white/30"
                  />
                  <p className="text-[11px] text-zinc-400">
                    Server lokal akan mengklon repositori ke direktori cache lokal.
                  </p>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-full bg-[#242630] hover:bg-[#2d303c] text-zinc-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="px-5 py-2 rounded-full bg-white hover:bg-zinc-200 disabled:opacity-50 text-black font-semibold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {isAnalyzing ? 'Menganalisis Manifest...' : 'Analisis & Lanjutkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manifest Detail Modal */}
      {selectedTemplateForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#202228] to-[#141519] shadow-2xl p-6 space-y-4 text-xs text-zinc-300">
            <div className="flex items-center justify-between pb-3">
              <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-zinc-400" /> Manifest: {selectedTemplateForDetail.title}
              </h3>
              <button
                onClick={() => setSelectedTemplateForDetail(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#1b1c22] to-[#131418]">
                  <span className="text-zinc-500 block">Package ID</span>
                  <span className="font-mono text-white">{selectedTemplateForDetail.name}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#1b1c22] to-[#131418]">
                  <span className="text-zinc-500 block">Versi & Lisensi</span>
                  <span className="font-mono text-white">{selectedTemplateForDetail.version} ({selectedTemplateForDetail.license})</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#1b1c22] to-[#131418] space-y-1">
                <span className="text-zinc-500 block">File Entry Point</span>
                <span className="font-mono text-white">{selectedTemplateForDetail.entry}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#1b1c22] to-[#131418] space-y-1">
                <span className="text-zinc-500 block">Dependensi Diperlukan</span>
                <pre className="font-mono text-[11px] text-emerald-400 overflow-x-auto">
                  {JSON.stringify(selectedTemplateForDetail.dependencies, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTemplateForDetail(null)}
                className="px-5 py-2 rounded-full bg-white hover:bg-zinc-200 text-black font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Security Approval Dialog for Template Installation */}
      <ApprovalDialog
        isOpen={Boolean(stagedManifest)}
        title="Konfirmasi Pemasangan Template"
        description={`Anda akan mengimpor template "${stagedManifest?.title}" ke dalam workspace lokal Anda. Template ini mendefinisikan dependensi dan aturan eksekusi Remotion berikut:`}
        targetName={stagedManifest?.title}
        version={stagedManifest?.version}
        license={stagedManifest?.license}
        dependencies={stagedManifest?.dependencies}
        permissions={['Salin kode ke src/templates/', 'Registrasi entry point Remotion']}
        shellCommand={`npm install ${Object.keys(stagedManifest?.dependencies || {}).join(' ')}`}
        confirmLabel="Setuju & Pasang Template"
        cancelLabel="Batalkan Pemasangan"
        onConfirm={handleConfirmInstall}
        onCancel={() => setStagedManifest(null)}
      />
    </div>
  );
};
