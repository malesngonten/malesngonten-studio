import React from 'react';
import { AlertTriangle, ShieldCheck, X, Terminal, PackageCheck } from 'lucide-react';

export interface ApprovalDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  targetName?: string;
  version?: string;
  license?: string;
  shellCommand?: string;
  dependencies?: Record<string, string>;
  permissions?: string[];
  confirmLabel?: string;
  cancelLabel?: string;
  dangerLevel?: 'low' | 'medium' | 'high';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ApprovalDialog: React.FC<ApprovalDialogProps> = ({
  isOpen,
  title,
  description,
  targetName,
  version,
  license,
  shellCommand,
  dependencies,
  permissions,
  confirmLabel = 'Setuju & Pasang',
  cancelLabel = 'Tolak & Batalkan',
  dangerLevel = 'medium',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const depEntries = dependencies ? Object.entries(dependencies) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg overflow-hidden rounded-3xl bg-gradient-to-b from-[#202228] to-[#141519] shadow-2xl shadow-black/80"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with security badge */}
        <div className="bg-gradient-to-b from-[#272932] to-[#1d1f25] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-[#323541] text-white">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">{title}</h3>
                <p className="text-xs text-zinc-400">Persetujuan Keamanan Tindakan Lokal (Local-First)</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-zinc-400 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-sm text-zinc-300">
          <p className="leading-relaxed text-zinc-300">
            {description}
          </p>

          {/* Package Details Box */}
          {(targetName || version || license) && (
            <div className="rounded-2xl bg-gradient-to-b from-[#1a1b21] to-[#111215] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Identitas Target</span>
                {license && (
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/10 text-white">
                    Lisensi: {license}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-white shrink-0" />
                <span className="font-medium text-white font-mono text-sm truncate">
                  {targetName || 'Paket / Skrip'}
                </span>
                {version && (
                  <span className="text-xs text-zinc-400 font-mono">
                    @{version}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Shell Command Preview */}
          {shellCommand && (
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-zinc-400" /> Perintah Shell yang akan dieksekusi:
              </span>
              <div className="rounded-xl bg-black/95 p-3.5 font-mono text-xs text-emerald-400 overflow-x-auto">
                $ {shellCommand}
              </div>
            </div>
          )}

          {/* Permissions Requested */}
          {permissions && permissions.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-zinc-300" /> Akses yang Diminta:
              </span>
              <ul className="grid grid-cols-1 gap-1 text-xs text-zinc-300">
                {permissions.map((perm, idx) => (
                  <li key={idx} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                    <span>{perm}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dependencies List */}
          {depEntries.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-zinc-400">Dependensi Diperlukan ({depEntries.length}):</span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {depEntries.map(([pkg, ver]) => (
                  <span
                    key={pkg}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#242630] text-zinc-200 font-mono text-[11px]"
                  >
                    <span>{pkg}</span>
                    <span className="text-zinc-500">{ver}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-gradient-to-b from-[#1e2027] to-[#15161c] p-3.5 text-xs text-zinc-300 leading-relaxed">
            <strong className="text-white">Prinsip Zero-Implicit-Exec:</strong> Tindakan ini hanya dijalankan di mesin lokal Anda setelah persetujuan eksplisit.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gradient-to-b from-[#1d1f25] to-[#15161a] px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2 rounded-full bg-[#242630] hover:bg-[#2d303c] text-zinc-300 font-medium text-xs transition-colors cursor-pointer text-center"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto px-5 py-2 rounded-full bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
