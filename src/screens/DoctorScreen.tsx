import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Terminal, 
  Copy, 
  Check,
  ShieldCheck,
  Smartphone,
  Cpu
} from 'lucide-react';
import { DoctorReport } from '../contracts/types.ts';
import { apiClient } from '../api/client.ts';

export const DoctorScreen: React.FC = () => {
  const [report, setReport] = useState<DoctorReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'needs_action'>('all');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getDoctorReport();
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  const handleCopyCommand = (command: string, index: number) => {
    navigator.clipboard.writeText(command);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyFullReport = () => {
    if (!report) return;
    const lines = [
      `=== STUDIO VIDEO AI — LAPORAN KESIAPAN SISTEM ===`,
      `Waktu: ${report.timestamp}`,
      `Perangkat: ${report.os} (${report.arch})`,
      `Status: ${report.allHealthy ? 'SEMUA SIAP DIGUNAKAN' : 'PERLU PERHATIAN'}`,
      `-----------------------------------------------`,
      ...report.items.map(
        (i) => `[${i.status.toUpperCase()}] ${i.name} (${i.version || 'Tersedia'})\nKeterangan: ${i.details}\nSaran: ${i.suggestedFix}\n`
      ),
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const passCount = report?.items.filter((i) => i.status === 'pass').length || 0;
  const warnCount = report?.items.filter((i) => i.status === 'warn').length || 0;
  const failCount = report?.items.filter((i) => i.status === 'fail').length || 0;

  const filteredItems = report?.items.filter((item) => {
    if (filter === 'all') return true;
    return item.status === 'warn' || item.status === 'fail';
  }) || [];

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-6 pb-28 md:pb-16 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-emerald-400" />
            Pemeriksaan Sistem
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
            Mengecek kesiapan komputer atau perangkat Termux Android Anda untuk memproduksi video.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={runDiagnostics}
            disabled={isLoading}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-[#1e2028] hover:bg-[#282b36] text-zinc-200 font-medium text-xs sm:text-sm transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 text-sky-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Periksa Ulang</span>
          </button>

          <button
            onClick={handleCopyFullReport}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-zinc-200 text-black font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95"
          >
            {copiedReport ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copiedReport ? 'Tersalin' : 'Salin Info'}</span>
          </button>
        </div>
      </div>

      {/* Overview Status Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-3xl bg-[#15171e] shadow-md flex flex-col justify-between">
          <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Siap Pakai</span>
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-white mt-1.5">{passCount}</span>
        </div>

        <div className="p-4 rounded-3xl bg-[#15171e] shadow-md flex flex-col justify-between">
          <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Perlu Dicatat</span>
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-white mt-1.5">{warnCount}</span>
        </div>

        <div className="p-4 rounded-3xl bg-[#15171e] shadow-md flex flex-col justify-between">
          <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-zinc-400" />
            <span>Kendala</span>
          </span>
          <span className="text-2xl sm:text-3xl font-bold text-white mt-1.5">{failCount}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs sm:text-sm">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full font-medium transition-colors cursor-pointer ${
            filter === 'all'
              ? 'bg-white text-black font-semibold shadow-md'
              : 'bg-[#15171e] text-zinc-400 hover:text-white'
          }`}
        >
          Semua Komponen ({report?.items.length || 0})
        </button>
        <button
          onClick={() => setFilter('needs_action')}
          className={`px-4 py-2 rounded-full font-medium transition-colors cursor-pointer ${
            filter === 'needs_action'
              ? 'bg-white text-black font-semibold shadow-md'
              : 'bg-[#15171e] text-zinc-400 hover:text-white'
          }`}
        >
          Perlu Perhatian ({warnCount + failCount})
        </button>
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {filteredItems.map((item, idx) => {
          const isPass = item.status === 'pass';
          const isWarn = item.status === 'warn';

          return (
            <div
              key={item.id}
              className="p-4 sm:p-5 rounded-3xl bg-[#15171e] space-y-2.5 shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  {isPass && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                  {isWarn && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
                  {!isPass && !isWarn && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
                  <div>
                    <h2 className="text-sm sm:text-base font-semibold text-white">
                      {item.name}
                    </h2>
                    {item.version && (
                      <span className="text-xs text-zinc-400 font-mono">
                        Versi: {item.version}
                      </span>
                    )}
                  </div>
                </div>

                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium shrink-0 ${
                    isPass
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : isWarn
                      ? 'bg-amber-500/15 text-amber-300'
                      : 'bg-rose-500/15 text-rose-300'
                  }`}
                >
                  {isPass ? 'Siap Digunakan' : isWarn ? 'Peringatan' : 'Belum Siap'}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed pl-7">
                {item.details}
              </p>

              {item.suggestedFix && (
                <div className="ml-7 p-3 rounded-2xl bg-[#0f1015] text-xs text-zinc-400 space-y-1.5">
                  <span className="font-semibold text-zinc-300 block">Saran Praktis:</span>
                  <p>{item.suggestedFix}</p>
                  {item.fixCommand && (
                    <div className="mt-2 flex items-center justify-between gap-2 p-2 rounded-xl bg-black/60 font-mono text-[11px] text-emerald-300">
                      <span className="select-all overflow-x-auto">{item.fixCommand}</span>
                      <button
                        onClick={() => handleCopyCommand(item.fixCommand!, idx)}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white shrink-0 font-sans text-xs transition-colors cursor-pointer"
                      >
                        {copiedIndex === idx ? 'Tersalin' : 'Salin Perintah'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
