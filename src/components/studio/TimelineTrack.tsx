import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  Plus, 
  Trash2, 
  Volume2, 
  Type, 
  AlignLeft, 
  Tag, 
  User, 
  Image as ImageIcon, 
  Music, 
  Film, 
  Sparkles,
  FolderOpen
} from 'lucide-react';
import { CompositionProps, TimelineLayerItem, LayerType } from '../../contracts/types.ts';

interface TimelineTrackProps {
  composition: CompositionProps;
  currentTime: number;
  durationInSeconds: number;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  onTogglePlay: () => void;
  onUpdateTimelineLayers: (layers: TimelineLayerItem[], newDuration?: number) => void;
  onCommitLayers?: () => void;
  onOpenAssetManagement?: () => void;
  onClose?: () => void;
}

export const TimelineTrack: React.FC<TimelineTrackProps> = ({
  composition,
  currentTime,
  durationInSeconds,
  isPlaying,
  onSeek,
  onTogglePlay,
  onUpdateTimelineLayers,
  onCommitLayers,
  onOpenAssetManagement,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string>('headline');
  const [activeDrag, setActiveDrag] = useState<{
    layerId: string;
    action: 'move' | 'trim-left' | 'trim-right';
    startX: number;
    initialStartSec: number;
    initialDurationSec: number;
  } | null>(null);

  const [isScrubbing, setIsScrubbing] = useState(false);

  // Initialize timelineLayers if empty or not set
  const layers: TimelineLayerItem[] = React.useMemo(() => {
    if (composition.timelineLayers && composition.timelineLayers.length > 0) {
      return composition.timelineLayers;
    }

    // Default 4 built-in layers if not present
    return [
      {
        id: 'headline',
        name: composition.headline || 'Judul Hook (3 Detik)',
        type: 'headline',
        startSec: composition.layers?.headline?.startSec ?? 0,
        durationSec: composition.layers?.headline?.durationSec ?? durationInSeconds,
        x: composition.layers?.headline?.x ?? 0,
        y: composition.layers?.headline?.y ?? 0,
        scale: composition.layers?.headline?.scale ?? 1,
        visible: composition.layers?.headline?.visible !== false,
        trackIndex: 0,
        color: '#38bdf8',
      },
      {
        id: 'subtext',
        name: composition.subtext || 'Teks Subtext / Deskripsi',
        type: 'subtext',
        startSec: composition.layers?.subtext?.startSec ?? 0.3,
        durationSec: composition.layers?.subtext?.durationSec ?? Math.max(0.5, durationInSeconds - 0.3),
        x: composition.layers?.subtext?.x ?? 0,
        y: composition.layers?.subtext?.y ?? 0,
        scale: composition.layers?.subtext?.scale ?? 1,
        visible: composition.layers?.subtext?.visible !== false,
        trackIndex: 1,
        color: '#a78bfa',
      },
      {
        id: 'tagline',
        name: composition.tagline || 'Tagline / Badge Atas',
        type: 'tagline',
        startSec: composition.layers?.tagline?.startSec ?? 0,
        durationSec: composition.layers?.tagline?.durationSec ?? durationInSeconds,
        x: composition.layers?.tagline?.x ?? 0,
        y: composition.layers?.tagline?.y ?? 0,
        scale: composition.layers?.tagline?.scale ?? 1,
        visible: composition.layers?.tagline?.visible !== false,
        trackIndex: 2,
        color: '#34d399',
      },
      {
        id: 'author',
        name: composition.authorHandle || 'Footer & Watermark',
        type: 'author',
        startSec: composition.layers?.author?.startSec ?? 0,
        durationSec: composition.layers?.author?.durationSec ?? durationInSeconds,
        x: composition.layers?.author?.x ?? 0,
        y: composition.layers?.author?.y ?? 0,
        scale: composition.layers?.author?.scale ?? 1,
        visible: composition.layers?.author?.visible !== false,
        trackIndex: 3,
        color: '#fbbf24',
      },
    ];
  }, [composition.timelineLayers, composition.layers, durationInSeconds, composition.headline, composition.subtext, composition.tagline, composition.authorHandle]);

  // Dynamic timeline width: compute maximum time from duration or furthest layer
  const maxLayerEnd = Math.max(
    durationInSeconds,
    ...layers.map((l) => l.startSec + l.durationSec)
  );

  // Flexible timeline duration (e.g. 10s, 20s, 30s)
  const timelineMaxSec = Math.max(10, Math.ceil(maxLayerEnd / 5) * 5);

  const getLayerIcon = (type: LayerType) => {
    switch (type) {
      case 'headline':
        return <Type className="w-3.5 h-3.5" />;
      case 'subtext':
        return <AlignLeft className="w-3.5 h-3.5" />;
      case 'tagline':
        return <Tag className="w-3.5 h-3.5" />;
      case 'author':
        return <User className="w-3.5 h-3.5" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5" />;
      case 'audio':
        return <Music className="w-3.5 h-3.5" />;
      case 'video':
        return <Film className="w-3.5 h-3.5" />;
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  // Playhead Scrubber Logic
  const handlePointerDownScrubber = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const seekTime = Number(((x / rect.width) * timelineMaxSec).toFixed(2));
    onSeek(Math.min(timelineMaxSec, seekTime));
    setIsScrubbing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMoveScrubber = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const seekTime = Number(((x / rect.width) * timelineMaxSec).toFixed(2));
    onSeek(Math.min(timelineMaxSec, seekTime));
  };

  const handlePointerUpScrubber = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isScrubbing) {
      setIsScrubbing(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  // Dragging Layer Position or Handles
  const handleStartDrag = (
    e: React.PointerEvent,
    layerId: string,
    action: 'move' | 'trim-left' | 'trim-right'
  ) => {
    e.stopPropagation();
    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;

    setSelectedLayerId(layerId);
    setActiveDrag({
      layerId,
      action,
      startX: e.clientX,
      initialStartSec: layer.startSec,
      initialDurationSec: layer.durationSec,
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveDrag = (e: React.PointerEvent) => {
    if (!activeDrag || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const trackWidth = rect.width;
    if (trackWidth <= 0) return;

    const deltaX = e.clientX - activeDrag.startX;
    const deltaSec = (deltaX / trackWidth) * timelineMaxSec;

    let newStart = activeDrag.initialStartSec;
    let newDuration = activeDrag.initialDurationSec;

    if (activeDrag.action === 'move') {
      newStart = Math.max(0, activeDrag.initialStartSec + deltaSec);
    } else if (activeDrag.action === 'trim-left') {
      const maxStart = activeDrag.initialStartSec + activeDrag.initialDurationSec - 0.4;
      newStart = Math.max(0, Math.min(maxStart, activeDrag.initialStartSec + deltaSec));
      newDuration = (activeDrag.initialStartSec + activeDrag.initialDurationSec) - newStart;
    } else if (activeDrag.action === 'trim-right') {
      newDuration = Math.max(0.4, activeDrag.initialDurationSec + deltaSec);
    }

    newStart = Number(newStart.toFixed(2));
    newDuration = Number(newDuration.toFixed(2));

    // Dynamic duration expansion: if layer moved or trimmed past duration, expand video!
    const layerEnd = newStart + newDuration;
    const targetVideoDuration = Math.max(durationInSeconds, Math.ceil(layerEnd));

    const updated = layers.map((l) =>
      l.id === activeDrag.layerId
        ? { ...l, startSec: newStart, durationSec: newDuration }
        : l
    );

    onUpdateTimelineLayers(updated, targetVideoDuration > durationInSeconds ? targetVideoDuration : undefined);
  };

  const handlePointerUpDrag = (e: React.PointerEvent) => {
    if (activeDrag) {
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      setActiveDrag(null);
      onCommitLayers?.();
    }
  };

  const handleToggleVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = layers.map((l) =>
      l.id === id ? { ...l, visible: !l.visible } : l
    );
    onUpdateTimelineLayers(updated);
    onCommitLayers?.();
  };

  const handleDeleteCustomLayer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = layers.filter((l) => l.id !== id);
    onUpdateTimelineLayers(updated);
    onCommitLayers?.();
  };

  const handleAddTextLayer = () => {
    const newId = `text-${Date.now()}`;
    const newLayer: TimelineLayerItem = {
      id: newId,
      name: 'Teks Tambahan',
      type: 'text',
      content: 'Teks Baru',
      startSec: Math.floor(currentTime),
      durationSec: 3.5,
      x: 0,
      y: 80,
      scale: 1,
      visible: true,
      trackIndex: layers.length,
      color: '#ffffff',
    };
    onUpdateTimelineLayers([...layers, newLayer]);
    setSelectedLayerId(newId);
    onCommitLayers?.();
  };

  // Group layers into tracks to allow overlapping & parallel display
  // We can render each layer on its assigned track or dynamically stack them
  const playheadPercent = Math.min(100, Math.max(0, (currentTime / timelineMaxSec) * 100));

  // Time format e.g. 0:15 / 0:32
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Generate ruler tick marks (e.g. 0s, 5s, 10s, 15s, 20s, 30s)
  const tickStep = timelineMaxSec > 20 ? 10 : 5;
  const tickCount = Math.floor(timelineMaxSec / tickStep) + 1;

  return (
    <div className="w-full bg-[#0a0b0e] rounded-3xl p-4 sm:p-5 text-xs select-none shadow-2xl flex flex-col gap-3">
      {/* Top Header: Time Display, Play Button, Loop, Collapse (Matching Reference Screenshot) */}
      <div className="flex items-center justify-between px-1">
        {/* Left: Time indicator */}
        <div className="font-mono text-sm sm:text-base font-medium text-white tracking-wider">
          {formatTime(currentTime)} <span className="text-zinc-500">/</span> {formatTime(durationInSeconds)}
        </div>

        {/* Center: Big Clean Play / Pause Triangle Button */}
        <button
          onClick={onTogglePlay}
          className="w-10 h-10 rounded-full bg-white text-black hover:bg-zinc-200 flex items-center justify-center transition-transform active:scale-95 cursor-pointer shadow-lg"
          title={isPlaying ? 'Jeda' : 'Putar'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-black" />
          ) : (
            <Play className="w-4 h-4 fill-black ml-0.5" />
          )}
        </button>

        {/* Right Controls: Loop, Asset Manager, Add Layer, Collapse */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSeek(0)}
            className="p-2 rounded-full bg-[#181a22] hover:bg-[#222530] text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Ulangi dari awal"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {onOpenAssetManagement && (
            <button
              onClick={onOpenAssetManagement}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1e212b] hover:bg-[#292d3b] text-sky-400 hover:text-sky-300 font-medium transition-all cursor-pointer active:scale-95"
              title="Kelola & Tambah Media Asset"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kelola Asset</span>
            </button>
          )}

          <button
            onClick={handleAddTextLayer}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#1e212b] hover:bg-[#292d3b] text-white font-medium transition-all cursor-pointer active:scale-95"
            title="Tambah Layer Teks Baru"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Teks</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-[#181a22] hover:bg-[#222530] text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Sembunyikan Timeline"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Timeline Workspace: Ruler + Stacked Layers + Vertical Playhead Line */}
      <div className="relative w-full flex flex-col pt-1">
        {/* Time Ruler (0s, 10s, 20s, 30s) */}
        <div 
          ref={containerRef}
          onPointerDown={handlePointerDownScrubber}
          onPointerMove={handlePointerMoveScrubber}
          onPointerUp={handlePointerUpScrubber}
          className="w-full h-7 relative cursor-pointer select-none flex items-center"
        >
          {Array.from({ length: tickCount }).map((_, i) => {
            const sec = i * tickStep;
            const leftPct = (sec / timelineMaxSec) * 100;
            return (
              <div
                key={i}
                style={{ left: `${leftPct}%` }}
                className="absolute top-0 bottom-0 flex flex-col items-center justify-between -translate-x-1/2 pointer-events-none text-[11px] font-mono text-zinc-400"
              >
                <span>{sec}s</span>
                <div className="w-[1.5px] h-2 bg-zinc-700" />
              </div>
            );
          })}

          {/* Slicing Cyan Playhead Handle in Ruler */}
          <div
            style={{ left: `${playheadPercent}%` }}
            className="absolute top-0 bottom-0 -translate-x-1/2 pointer-events-none z-30 flex flex-col items-center"
          >
            <div className="w-3 h-3 bg-sky-400 rounded-full shadow-[0_0_12px_rgba(56,189,248,1)]" />
          </div>
        </div>

        {/* Stacked Tracks Container (Layers can overlap, expand past video duration) */}
        <div 
          onPointerMove={handlePointerMoveDrag}
          onPointerUp={handlePointerUpDrag}
          className="relative w-full flex flex-col gap-2 pt-2 min-h-[160px]"
        >
          {/* Continuous Vertical Cyan Playhead Needle Cutting through all tracks */}
          <div
            style={{ left: `${playheadPercent}%` }}
            className="absolute top-0 bottom-0 w-[2px] bg-sky-400 -translate-x-1/2 pointer-events-none z-30 shadow-[0_0_10px_rgba(56,189,248,0.9)]"
          />

          {/* Render Layers (Each layer gets a sleek horizontal lane) */}
          {layers.map((layer) => {
            const isSelected = selectedLayerId === layer.id;
            const startPct = Math.max(0, (layer.startSec / timelineMaxSec) * 100);
            const widthPct = Math.max(4, (layer.durationSec / timelineMaxSec) * 100);
            const isBuiltin = ['headline', 'subtext', 'tagline', 'author'].includes(layer.id);

            // Styling based on layer type (Matching reference screenshot)
            const isAudio = layer.type === 'audio';
            const isImage = layer.type === 'image';
            const isVideo = layer.type === 'video';

            return (
              <div
                key={layer.id}
                className="relative w-full h-11 bg-[#12141a] rounded-2xl flex items-center overflow-hidden"
              >
                {/* Layer Clip Bar on Timeline */}
                <div
                  style={{
                    left: `${startPct}%`,
                    width: `${widthPct}%`,
                    opacity: layer.visible ? 1 : 0.35,
                  }}
                  onPointerDown={(e) => handleStartDrag(e, layer.id, 'move')}
                  className={`absolute top-1 bottom-1 rounded-xl flex items-center justify-between cursor-grab active:cursor-grabbing select-none transition-shadow ${
                    isAudio
                      ? 'bg-[#3b1d5c] text-purple-200'
                      : isImage || isVideo
                      ? 'bg-[#1e293b] text-slate-200'
                      : 'bg-[#1b2234] text-sky-200'
                  } ${isSelected ? 'ring-2 ring-sky-400 shadow-xl' : ''}`}
                >
                  {/* Left Trim Handle (Blue rounded handle matching screenshot when selected) */}
                  {isSelected ? (
                    <div
                      onPointerDown={(e) => handleStartDrag(e, layer.id, 'trim-left')}
                      className="w-4 h-full bg-sky-400 rounded-l-xl flex items-center justify-center cursor-ew-resize shrink-0 transition-colors"
                      title="Tarik untuk atur awal kemunculan"
                    >
                      <div className="w-[2px] h-3.5 bg-black rounded" />
                    </div>
                  ) : (
                    <div
                      onPointerDown={(e) => handleStartDrag(e, layer.id, 'trim-left')}
                      className="w-2.5 h-full hover:bg-white/20 rounded-l-xl cursor-ew-resize shrink-0 flex items-center justify-center"
                    >
                      <div className="w-[1px] h-3 bg-white/40 rounded" />
                    </div>
                  )}

                  {/* Middle Content: Icon Badge + Filmstrip / Waveform / Label */}
                  <div className="flex-1 flex items-center gap-2 px-2 truncate pointer-events-none">
                    {/* Rounded Icon Badge */}
                    <div className="w-6 h-6 rounded-lg bg-black/40 flex items-center justify-center shrink-0">
                      {getLayerIcon(layer.type)}
                    </div>

                    {/* Audio Waveform visualization or Name */}
                    {isAudio ? (
                      <div className="flex items-center gap-1 w-full overflow-hidden opacity-80">
                        {Array.from({ length: 24 }).map((_, idx) => (
                          <div
                            key={idx}
                            style={{ height: `${8 + ((idx * 7) % 14)}px` }}
                            className="w-[2px] bg-purple-300 rounded-full shrink-0"
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="font-medium text-xs truncate">
                        {layer.name}
                      </span>
                    )}

                    <span className="font-mono text-[10px] opacity-60 shrink-0 ml-auto hidden sm:inline">
                      {layer.startSec.toFixed(1)}s - {(layer.startSec + layer.durationSec).toFixed(1)}s
                    </span>
                  </div>

                  {/* Right Trim Handle (Blue rounded handle matching screenshot when selected) */}
                  {isSelected ? (
                    <div
                      onPointerDown={(e) => handleStartDrag(e, layer.id, 'trim-right')}
                      className="w-4 h-full bg-sky-400 rounded-r-xl flex items-center justify-center cursor-ew-resize shrink-0 transition-colors"
                      title="Tarik untuk perpanjang/perpendek durasi"
                    >
                      <div className="w-[2px] h-3.5 bg-black rounded" />
                    </div>
                  ) : (
                    <div
                      onPointerDown={(e) => handleStartDrag(e, layer.id, 'trim-right')}
                      className="w-2.5 h-full hover:bg-white/20 rounded-r-xl cursor-ew-resize shrink-0 flex items-center justify-center"
                    >
                      <div className="w-[1px] h-3 bg-white/40 rounded" />
                    </div>
                  )}
                </div>

                {/* Subtle right actions on hover: Eye toggle & Delete for custom */}
                <div className="absolute right-2 flex items-center gap-1 z-10 bg-[#12141a]/80 backdrop-blur-sm px-1.5 py-0.5 rounded-lg opacity-40 hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleToggleVisibility(layer.id, e)}
                    className="p-1 rounded text-zinc-400 hover:text-white cursor-pointer"
                    title={layer.visible ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  {!isBuiltin && (
                    <button
                      onClick={(e) => handleDeleteCustomLayer(layer.id, e)}
                      className="p-1 rounded text-zinc-500 hover:text-rose-400 cursor-pointer"
                      title="Hapus Layer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="flex items-center justify-between text-[11px] text-zinc-400 px-1 pt-1">
        <span>💡 Geser klip atau tarik gagang biru untuk atur durasi • Durasi video otomatis menyesuaikan</span>
        <span className="font-mono text-zinc-300 font-medium">
          Total: {durationInSeconds} detik
        </span>
      </div>
    </div>
  );
};
