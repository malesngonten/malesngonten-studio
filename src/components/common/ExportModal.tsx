import React, { useState } from 'react';
import { Video, X, Terminal, CheckCircle2, Clock, Film, Copy, Check } from 'lucide-react';
import { CompositionProps } from '../../contracts/types.ts';
import { apiClient } from '../../api/client.ts';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  composition: CompositionProps;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  composition,
}) => {
  const [isRendering, setIsRendering] = useState(false);
  const [renderDone, setRenderDone] = useState(false);
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [copiedCli, setCopiedCli] = useState(false);

  if (!isOpen) return null;

  const cliCommand = `npx remotion render src/remotion/KineticComposition.tsx Out out/malesngonten.mp4 --codec=h264 --props='${JSON.stringify({
    headline: composition.headline,
    aspectRatio: composition.aspectRatio,
  })}'`;

  const handleStartRender = async () => {
    setIsRendering(true);
    setRenderDone(false);
    try {
      const res = await apiClient.requestExport(composition);
      setJobDetails(res);
      setTimeout(() => {
        setIsRendering(false);
        setRenderDone(true);
      }, 1600);
    } catch {
      setIsRendering(false);
    }
  };

  const handleCopyCli = () => {
    navigator.clipboard.writeText(cliCommand);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  const resolutionText = composition.aspectRatio === '9:16' 
    ? '1080 x 1920 (Vertikal 9:16 - TikTok / Reels / Shorts)' 
    : composition.aspectRatio === '1:1' 
    ? '1080 x 1080 (Kotak 1:1 - Instagram Feed)' 
    : '1920 x 1080 (Landscape 16:9 - YouTube)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-[#161820] shadow-2xl shadow-black overflow-hidden text-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center">
              <Film className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Export Video (Remotion CLI)</h3>
              <p className="text-xs text-zinc-400">Pipeline rendering video &amp; media encoder lokal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-full hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs sm:text-sm">
          {/* Details Table */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-[#0f1015]">
              <span className="text-zinc-400 block mb-1 text-xs">Resolusi &amp; Aspek Rasio</span>
              <span className="font-semibold text-white">{resolutionText}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0f1015]">
              <span className="text-zinc-400 block mb-1 text-xs">Durasi &amp; Frame Rate</span>
              <span className="font-semibold text-white">{composition.durationInSeconds} Detik ({composition.fps} FPS)</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0f1015] col-span-2">
              <span className="text-zinc-400 block mb-1 text-xs">Target Berkas Output</span>
              <span className="font-semibold text-emerald-400 font-mono text-xs">./out/malesngonten.mp4 (H.264 / AAC)</span>
            </div>
          </div>

          {/* Terminal CLI Command for Termux & Linux */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" /> Perintah Eksekusi CLI di Terminal / Termux:
              </span>
              <button
                type="button"
                onClick={handleCopyCli}
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
              >
                {copiedCli ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCli ? 'Tersalin' : 'Salin Perintah'}</span>
              </button>
            </div>
            <div className="rounded-xl bg-black/95 p-3 font-mono text-[11px] text-zinc-300 overflow-x-auto select-all">
              {cliCommand}
            </div>
          </div>

          {/* Render State feedback */}
          {isRendering && (
            <div className="p-4 rounded-2xl bg-[#0f1015] space-y-2.5">
              <div className="flex items-center justify-between text-xs text-zinc-200">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-spin text-sky-400" /> Rendering frame dengan FFmpeg...
                </span>
                <span className="font-mono text-white">82%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full bg-sky-400 w-4/5 animate-pulse" />
              </div>
            </div>
          )}

          {renderDone && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-xs text-emerald-300">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <div>
                <p className="font-semibold text-white">Render Berhasil Disimulasikan!</p>
                <p className="text-zinc-400">Job ID: {jobDetails?.jobId || 'render-out-1'} — Siap dieksekusi di lingkungan lokal.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-zinc-400 hover:text-white text-xs sm:text-sm font-medium cursor-pointer"
          >
            Tutup
          </button>
          <button
            onClick={handleStartRender}
            disabled={isRendering}
            className="px-6 py-2.5 rounded-full bg-white text-black hover:bg-zinc-200 font-semibold text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <Film className="w-4 h-4" />
            <span>{isRendering ? 'Sedang Rendering...' : 'Jalankan Export'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
