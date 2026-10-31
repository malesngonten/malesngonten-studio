import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Terminal, 
  Copy, 
  Check
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
      `=== MALES NGONTEN STUDIO — DIAGNOSTIC REPORT ===`,
      `Waktu: ${report.timestamp}`,
      `OS: ${report.os} (${report.arch})`,
      `Status: ${report.allHealthy ? 'LULUS (HEALTHY)' : 'PERLU TINDAKAN'}`,
      `-----------------------------------------------`,
      ...report.items.map(
        (i) => `[${i.status.toUpperCase()}] ${i.name} (${i.version || 'N/A'})\nDetail: ${i.details}\nSaran: ${i.suggestedFix}\n`
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
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-5 pb-24 md:pb-12 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-normal text-white flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-white" /> System Doctor & Diagnostik
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Pemeriksaan integritas komponen lokal: Node.js, FFmpeg, Chromium, agen AI, dan port socket.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={runDiagnostics}
            disabled={isLoading}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-full bg-[#20222a] hover:bg-[#2a2c35] text-zinc-200 font-medium text-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Diagnosa Ulang</span>
          </button>

          <button
            onClick={handleCopyFullReport}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white hover:bg-zinc-200 text-black font-semibold text-xs shadow-md transition-all cursor-pointer"
          >
            {copiedReport ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedReport ? 'Tersalin' : 'Salin Laporan'}</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-3xl bg-gradient-to-b from-[#1c1d22] to-[#121316] shadow-md flex flex-col justify-between">
          <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Lulus
          </span>
          <span className="text-xl sm:text-2xl font-bold text-white mt-1">{passCount}</span>
        </div>

        <div className="p-4 rounded-3xl bg-gradient-to-b from-[#1c1d22] to-[#121316] shadow-md flex flex-col justify-between">
          <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Peringatan
          </span>
          <span className="text-xl sm:text-2xl font-bold text-white mt-1">{warnCount}</span>
        </div>

        <div className="p-4 rounded-3xl bg-gradient-to-b from-[#1c1d22] to-[#121316] shadow-md flex flex-col justify-between">
          <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-zinc-400" /> Gagal
          </span>
          <span className="text-xl sm:text-2xl font-bold text-white mt-1">{failCount}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs transition-colors cursor-pointer ${
            filter === 'all'
              ? 'bg-[#2a2c34] text-white font-medium shadow-sm'
              : 'bg-[#181a20] text-zinc-400 hover:text-white'
          }`}
        >
          Semua Item ({report?.items.length || 0})
        </button>
        <button
          onClick={() => setFilter('needs_action')}
          className={`px-3.5 py-1.5 rounded-full text-xs transition-colors cursor-pointer ${
            filter === 'needs_action'
              ? 'bg-[#2a2c34] text-white font-medium shadow-sm'
              : 'bg-[#181a20] text-zinc-400 hover:text-white'
          }`}
        >
          Perlu Perhatian ({warnCount + failCount})
        </button>
      </div>

      {/* Checklist items */}
      <div className="space-y-3">
        {filteredItems.map((item, idx) => {
          const isPass = item.status === 'pass';
          const isWarn = item.status === 'warn';
          const isFail = item.status === 'fail';

          return (
            <div
              key={item.id}
              className="p-4 rounded-3xl bg-gradient-to-b from-[#1c1d22] to-[#121316] shadow-lg transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {isPass && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                    {isWarn && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
                    {isFail && <XCircle className="w-5 h-5 text-zinc-400 shrink-0" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white text-sm">{item.name}</h3>
                      {item.version && (
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#181a20] text-zinc-400">
                          {item.version}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {item.details}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] uppercase font-medium tracking-wider px-2.5 py-0.5 rounded-full shrink-0 ${
                    isPass
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : isWarn
                      ? 'bg-amber-500/15 text-amber-300'
                      : 'bg-white/10 text-zinc-300'
                  }`}
                >
                  {isPass ? 'Lulus' : isWarn ? 'Peringatan' : 'Gagal'}
                </span>
              </div>

              {/* Suggested fix */}
              {item.suggestedFix && (
                <div className="mt-3 pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <div className="text-zinc-400">
                    <strong className="text-zinc-300">Saran Perbaikan: </strong>
                    <span>{item.suggestedFix}</span>
                  </div>

                  {item.fixCommand && (
                    <button
                      onClick={() => handleCopyCommand(item.fixCommand!, idx)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#16171c] hover:bg-[#202228] text-zinc-300 font-mono text-[11px] transition-colors cursor-pointer shrink-0"
                    >
                      <Terminal className="w-3 h-3 text-zinc-400" />
                      <span>{item.fixCommand}</span>
                      {copiedIndex === idx ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 opacity-60" />
                      )}
                    </button>
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
