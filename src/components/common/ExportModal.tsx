import React, { useState } from 'react';
import { Video, X, Terminal, CheckCircle2, Clock, AlertCircle, Download } from 'lucide-react';
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

  if (!isOpen) return null;

  const handleStartMockRender = async () => {
    setIsRendering(true);
    setRenderDone(false);
    try {
      const res = await apiClient.requestExport(composition);
      setJobDetails(res);
      // Simulate render progression
      setTimeout(() => {
        setIsRendering(false);
        setRenderDone(true);
      }, 1800);
    } catch {
      setIsRendering(false);
    }
  };

  const resolutionText = composition.aspectRatio === '9:16' ? '1080 x 1920 (Reels/TikTok)' : '1920 x 1080 (Landscape)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#202228] to-[#141519] shadow-2xl shadow-black/80 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-b from-[#272932] to-[#1d1f25] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-[#323541] text-white">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Export Video Remotion</h3>
              <p className="text-xs text-zinc-400">Rendering Pipeline & Media Encoder</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-sm text-zinc-300">
          <div className="rounded-2xl bg-gradient-to-b from-[#1d1f27] to-[#14151c] p-4 text-xs text-zinc-300 space-y-1.5">
            <div className="flex items-center gap-2 font-medium text-white">
              <AlertCircle className="w-4 h-4 shrink-0 text-zinc-400" />
              <span>Simulasi Ekspor (Mock Preview Mode)</span>
            </div>
            <p className="text-zinc-400 pl-6 leading-relaxed">
              Males Ngonten Studio berjalan sebagai UI skeleton BYOK. Pada instalasi final di laptop/server lokal Anda (`npm run dev`), tombol ini akan memanggil binary <strong>ffmpeg</strong> lokal melalui Remotion CLI untuk merender MP4 sejati.
            </p>
          </div>

          {/* Details Table */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#1b1c22] to-[#131418]">
              <span className="text-zinc-500 block mb-1">Resolusi Target</span>
              <span className="font-semibold text-white">{resolutionText}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#1b1c22] to-[#131418]">
              <span className="text-zinc-500 block mb-1">Frame Rate & Durasi</span>
              <span className="font-semibold text-white">{composition.fps} FPS / {composition.durationInSeconds} Detik</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-gradient-to-b from-[#1b1c22] to-[#131418] col-span-2">
              <span className="text-zinc-500 block mb-1">Headline Render</span>
              <span className="font-semibold text-white font-mono truncate block">{composition.headline}</span>
            </div>
          </div>

          {/* CLI Command Preview */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-zinc-400" /> Perintah Remotion CLI Asli:
            </span>
            <div className="rounded-xl bg-black/95 p-3.5 font-mono text-xs text-zinc-300 overflow-x-auto select-all">
              npx remotion render src/remotion/KineticComposition.tsx Out out/malesngonten.mp4 --codec=h264
            </div>
          </div>

          {/* Render State feedback */}
          {isRendering && (
            <div className="p-4 rounded-2xl bg-gradient-to-b from-[#1b1c22] to-[#131418] space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-200">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-spin text-white" /> Merender 180 frame Remotion...
                </span>
                <span className="font-mono text-white">68%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div className="h-full bg-white w-2/3 animate-pulse" />
              </div>
            </div>
          )}

          {renderDone && (
            <div className="p-4 rounded-2xl bg-gradient-to-b from-[#1b1f1d] to-[#121614] flex items-center gap-3 text-xs text-emerald-300">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
              <div>
                <p className="font-semibold text-white">Simulasi Render Selesai!</p>
                <p className="text-zinc-400">Job ID: {jobDetails?.jobId || 'render-9821'} — Siap ditransfer ke media pipeline.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-b from-[#1d1f25] to-[#15161a] px-6 py-4 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-[#242630] hover:bg-[#2d303c] text-zinc-300 text-xs font-medium transition-colors"
          >
            Tutup
          </button>
          {!renderDone ? (
            <button
              onClick={handleStartMockRender}
              disabled={isRendering}
              className="px-5 py-2 rounded-full bg-white hover:bg-zinc-200 disabled:opacity-50 text-black text-xs font-semibold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Video className="w-3.5 h-3.5" />
              {isRendering ? 'Memproses Render...' : 'Jalankan Render (Simulasi)'}
            </button>
          ) : (
            <button
              onClick={() => {
                alert('Dalam versi lokal Node dengan ffmpeg, file MP4 otomatis tersimpan di folder ./out/malesngonten.mp4');
                onClose();
              }}
              className="px-5 py-2 rounded-full bg-white hover:bg-zinc-200 text-black text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Simulasi Download (.mp4)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
