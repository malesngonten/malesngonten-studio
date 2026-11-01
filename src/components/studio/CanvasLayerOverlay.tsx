import React, { useState, useRef, useEffect } from 'react';
import { 
  Move, 
  RotateCcw, 
  Check, 
  Layers, 
  Maximize2, 
  X, 
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { CompositionProps, LayerTransform } from '../../contracts/types.ts';

interface CanvasLayerOverlayProps {
  composition: CompositionProps;
  onUpdateLayer: (id: 'headline' | 'subtext' | 'tagline' | 'author', transform: Partial<LayerTransform>) => void;
  onCommit?: () => void;
  onClose: () => void;
}

type LayerKey = 'headline' | 'subtext' | 'tagline' | 'author';

interface LayerOption {
  id: LayerKey;
  name: string;
  defaultY: number; // default vertical approximate position % in 9:16
}

const LAYER_OPTIONS: LayerOption[] = [
  { id: 'headline', name: 'Judul Hook (3 Detik)', defaultY: 42 },
  { id: 'subtext', name: 'Teks Subtext / Keterangan', defaultY: 58 },
  { id: 'tagline', name: 'Tagline & Badge Atas', defaultY: 8 },
  { id: 'author', name: 'Footer & Watermark', defaultY: 90 },
];

export const CanvasLayerOverlay: React.FC<CanvasLayerOverlayProps> = ({
  composition,
  onUpdateLayer,
  onCommit,
  onClose,
}) => {
  const [selectedLayer, setSelectedLayer] = useState<LayerKey>('headline');
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const dragStartRef = useRef<{ clientX: number; clientY: number; initialX: number; initialY: number }>({
    clientX: 0,
    clientY: 0,
    initialX: 0,
    initialY: 0,
  });

  const resizeStartRef = useRef<{ clientX: number; clientY: number; initialScale: number }>({
    clientX: 0,
    clientY: 0,
    initialScale: 1,
  });

  const currentTransform = composition.layers?.[selectedLayer] || {
    x: 0,
    y: 0,
    scale: 1,
    startSec: 0,
    durationSec: composition.durationInSeconds,
    visible: true,
  };

  const x = currentTransform.x ?? 0;
  const y = currentTransform.y ?? 0;
  const scale = currentTransform.scale ?? 1;

  // Handle Drag Move (translate X, Y)
  const handlePointerDownDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      initialX: x,
      initialY: y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;

    onUpdateLayer(selectedLayer, {
      x: Math.round(dragStartRef.current.initialX + dx),
      y: Math.round(dragStartRef.current.initialY + dy),
    });
  };

  const handlePointerUpDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      onCommit?.();
    }
  };

  // Handle Resize (Scale)
  const handlePointerDownResize = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      initialScale: scale,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveResize = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isResizing) return;
    const deltaX = e.clientX - resizeStartRef.current.clientX;
    const newScale = Math.max(0.4, Math.min(2.5, Number((resizeStartRef.current.initialScale + deltaX * 0.008).toFixed(2))));

    onUpdateLayer(selectedLayer, {
      scale: newScale,
    });
  };

  const handlePointerUpResize = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isResizing) {
      setIsResizing(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      onCommit?.();
    }
  };

  const handleResetCurrentLayer = () => {
    onUpdateLayer(selectedLayer, {
      x: 0,
      y: 0,
      scale: 1,
    });
    onCommit?.();
  };

  return (
    <div className="absolute inset-0 z-30 pointer-events-auto flex flex-col justify-between p-3 select-none">
      {/* Top Selector Bar (No borders) */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#121419]/95 backdrop-blur-md px-3 py-2 rounded-2xl shadow-2xl text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-zinc-400 font-medium shrink-0 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            Layer:
          </span>
          {LAYER_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelectedLayer(opt.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all shrink-0 ${
                selectedLayer === opt.id
                  ? 'bg-sky-500 text-white shadow-md'
                  : 'bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {opt.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleResetCurrentLayer}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Reset Posisi & Ukuran Layer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white text-black font-semibold hover:bg-zinc-200 transition-colors cursor-pointer text-xs shadow-sm"
            title="Selesai Mengatur Posisi"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Selesai</span>
          </button>
        </div>
      </div>

      {/* Interactive Floating Transform Bounding Box positioned relative to the layer */}
      <div className="flex-1 relative flex items-center justify-center pointer-events-none">
        <div
          style={{
            transform: `translate(${x}px, ${y}px) scale(${scale})`,
            transformOrigin: 'center center',
          }}
          className="relative pointer-events-auto"
        >
          {/* Draggable Bounding Box (Borderless, using subtle surface contrast and glow) */}
          <div
            onPointerDown={handlePointerDownDrag}
            onPointerMove={handlePointerMoveDrag}
            onPointerUp={handlePointerUpDrag}
            className={`min-w-[220px] sm:min-w-[280px] p-3 rounded-2xl ${
              isDragging ? 'bg-sky-500/25 shadow-[0_0_25px_rgba(56,189,248,0.3)]' : 'bg-sky-500/10 hover:bg-sky-500/15'
            } backdrop-blur-[2px] cursor-move transition-all flex flex-col items-center justify-center gap-1 shadow-2xl group`}
            title="Tahan & geser untuk memindahkan posisi komponen"
          >
            {/* Top Indicator Chip */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500 text-white font-semibold text-[10px] shadow-md">
              <Move className="w-3 h-3" />
              <span>{LAYER_OPTIONS.find(l => l.id === selectedLayer)?.name}</span>
            </div>

            {/* Coordinate readout */}
            <div className="font-mono text-[10px] text-zinc-200 pt-0.5">
              X: {x}px • Y: {y}px • Skala: {Math.round(scale * 100)}%
            </div>

            {/* Corner Resize Handle */}
            <div
              onPointerDown={handlePointerDownResize}
              onPointerMove={handlePointerMoveResize}
              onPointerUp={handlePointerUpResize}
              className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-white text-black flex items-center justify-center cursor-nwse-resize shadow-xl hover:scale-110 active:scale-95 transition-transform"
              title="Tarik untuk memperbesar atau memperkecil ukuran"
            >
              <Maximize2 className="w-3.5 h-3.5 rotate-90" />
            </div>

            {/* Corner positioning dots */}
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-sky-400 shadow-sm" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-sky-400 shadow-sm" />
            <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 rounded-full bg-sky-400 shadow-sm" />
          </div>
        </div>
      </div>

      {/* Bottom Hint */}
      <div className="text-center text-[11px] text-zinc-400 bg-black/60 backdrop-blur-sm py-1 px-3 rounded-full mx-auto">
        Tahan &amp; geser kotak untuk ubah tata letak • Tarik bulatan kanan bawah untuk ukuran
      </div>
    </div>
  );
};
