import React, { useState, useEffect, useRef } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { 
  Send, 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  SlidersHorizontal, 
  ChevronDown, 
  ChevronUp, 
  PackageCheck,
  CheckCircle2,
  Bookmark,
  Share2,
  Volume2,
  Plus,
  Mic,
  Square,
  Palette,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move
} from 'lucide-react';
import { KineticComposition } from '../remotion/KineticComposition.tsx';
import { CompositionProps, ChatMessage, SystemStatus } from '../contracts/types.ts';
import { apiClient } from '../api/client.ts';
import { ApprovalDialog } from '../components/common/ApprovalDialog.tsx';

interface StudioScreenProps {
  onNavigateSettings: () => void;
  systemStatus: SystemStatus | null;
}

export const StudioScreen: React.FC<StudioScreenProps> = ({
  onNavigateSettings,
  systemStatus,
}) => {
  const [composition, setComposition] = useState<CompositionProps>({
    headline: 'STOP BIKIN KONTEN MANUAL!',
    highlightWord: 'MANUAL',
    subtext: 'Bikin video reels & tiktok 10x lebih cepat pakai Remotion + AI',
    tagline: '#MalesNgonten #CreatorEconomy',
    aspectRatio: '9:16',
    durationInSeconds: 6,
    fps: 30,
    primaryColor: '#ffffff',
    accentColor: '#a1a1aa',
    bgColor: '#0c0d10',
    fontStyle: 'display',
    animationPreset: 'kinetic-pop',
    authorHandle: '@official.malesngonten',
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendingSeconds, setSendingSeconds] = useState(0);
  const [showQuickEditor, setShowQuickEditor] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Zoom & Pan state for Remotion Player
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialPinchDistRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(1);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(2.5, Number((prev + 0.25).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(0.5, Number((prev - 0.25).toFixed(2)));
      if (next <= 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handlePlayerWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoomLevel((prev) => {
      const next = Math.min(2.5, Math.max(0.5, Number((prev + delta).toFixed(2))));
      if (next <= 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const getDistance = (t1: React.Touch, t2: React.Touch) => {
    return Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      initialPinchDistRef.current = getDistance(e.touches[0], e.touches[1]);
      initialZoomRef.current = zoomLevel;
    } else if (e.touches.length === 1 && zoomLevel > 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistRef.current !== null) {
      const currentDist = getDistance(e.touches[0], e.touches[1]);
      const scaleChange = currentDist / initialPinchDistRef.current;
      const nextZoom = Math.min(2.5, Math.max(0.5, Number((initialZoomRef.current * scaleChange).toFixed(2))));
      setZoomLevel(nextZoom);
      if (nextZoom <= 1) setPanOffset({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && isDragging && zoomLevel > 1) {
      setPanOffset({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y,
      });
    }
  };

  const handleTouchEnd = () => {
    initialPinchDistRef.current = null;
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1 && e.button === 0) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setPanOffset({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    let interval: any = null;
    if (isSending) {
      setSendingSeconds(0);
      interval = setInterval(() => {
        setSendingSeconds((s) => s + 1);
      }, 1000);
    } else {
      setSendingSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSending]);

  // Approval dialog state for AI tool calls
  const [pendingAction, setPendingAction] = useState<any>(null);

  const playerRef = useRef<PlayerRef>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Fetch initial composition & chat
  useEffect(() => {
    let isMounted = true;
    apiClient.getComposition().then((comp) => {
      if (isMounted) setComposition(comp);
    }).catch(console.error);

    apiClient.getChatMessages().then((msgs) => {
      if (isMounted) setMessages(msgs);
    }).catch(console.error);

    return () => {
      isMounted = false;
    };
  }, []);

  // Track video playback time
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current && isPlaying) {
        const frame = playerRef.current.getCurrentFrame();
        const fps = composition.fps || 30;
        setCurrentTime(Math.min(frame / fps, composition.durationInSeconds));
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying, composition]);

  // Scroll chat on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isSending) return;

    setInputMessage('');
    setIsSending(true);

    try {
      const result = await apiClient.sendChatMessage(text);
      setMessages((prev) => [...prev, result.userMessage, result.assistantMessage]);
      if (result.updatedComposition) {
        setComposition(result.updatedComposition);
        // Reset player to start so user sees new animation
        playerRef.current?.seekTo(0);
        playerRef.current?.play();
        setIsPlaying(true);
      }
      if (result.assistantMessage.actionRequest) {
        setPendingAction(result.assistantMessage.actionRequest);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'system',
          text: `Gagal mengirim pesan: ${err.message || 'Terjadi kesalahan jaringan'}`,
          timestamp: 'Sekarang',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleTogglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pause();
      setIsPlaying(false);
    } else {
      playerRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleRestart = () => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(0);
    playerRef.current.play();
    setIsPlaying(true);
  };

  const handleApproveAction = async () => {
    if (!pendingAction) return;
    if (pendingAction.type === 'install_library') {
      try {
        await apiClient.installExtension({
          id: `ext-${Date.now()}`,
          name: pendingAction.packageName,
          type: 'library',
          version: pendingAction.version || 'latest',
          author: 'Community / Remotion',
          source: 'npm registry',
          description: pendingAction.description,
          enabled: true,
          permissions: pendingAction.payload?.permissions || [],
        });
        setMessages((prev) => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            sender: 'system',
            text: `Berhasil menyetujui & memasang ${pendingAction.packageName}. Ekstensi sekarang aktif di project.`,
            timestamp: 'Sekarang',
          },
        ]);
      } catch (e: any) {
        console.error(e);
      }
    }
    setPendingAction(null);
  };

  // Dimensions based on aspect ratio
  const compWidth = composition.aspectRatio === '9:16' ? 1080 : composition.aspectRatio === '16:9' ? 1920 : 1080;
  const compHeight = composition.aspectRatio === '9:16' ? 1920 : composition.aspectRatio === '16:9' ? 1080 : 1080;

  const quickPrompts = [
    'Ubah headline jadi lebih viral dan provokatif',
    'Ganti tema ke minimalis monokrom',
    'Pasang library @remotion/shapes untuk efek visual',
    'Buat quotes santai & motivasi kreator',
  ];

  const activeModelDisplay = systemStatus?.activeModel || 'Default';

  return (
    <div className="flex flex-col min-h-[calc(100vh-60px)] pb-24 md:pb-12 max-w-2xl mx-auto px-3 sm:px-4 pt-2 gap-4">
      {/* Top Metadata Line matching reference image 1 */}
      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-zinc-300">
            {systemStatus?.activeModel ? systemStatus.activeModel : 'Gemini 3.8 Flash'}
          </span>
          <span className="text-zinc-600">•</span>
          <span>
            {isSending ? `Running for ${sendingSeconds}s` : 'Ran for 4m 20s'}
          </span>
        </div>
      </div>

      {/* Main Video Preview Card */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#1b1c21] via-[#15161a] to-[#111215] p-3 sm:p-4 shadow-2xl shadow-black/70 flex flex-col items-center">
        {/* Top actions line: Zoom Controls on left + Bookmark & Share on right */}
        <div className="w-full flex items-center justify-between pb-2 text-zinc-400">
          {/* Zoom In / Zoom Out Controls for Remotion Player */}
          <div 
            data-allow-zoom="true"
            className="flex items-center gap-1 bg-[#131418] px-2 py-1 rounded-full shadow-inner select-none"
          >
            <button
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.5}
              className={`p-1 rounded-full transition-colors cursor-pointer ${
                zoomLevel <= 0.5 ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-300 hover:text-white hover:bg-white/10'
              }`}
              title="Perkecil Layar (Zoom Out)"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleResetZoom}
              className="px-1.5 py-0.5 text-[11px] font-mono text-zinc-300 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
              title="Reset Zoom ke 100%"
            >
              {Math.round(zoomLevel * 100)}%
            </button>

            <button
              onClick={handleZoomIn}
              disabled={zoomLevel >= 2.5}
              className={`p-1 rounded-full transition-colors cursor-pointer ${
                zoomLevel >= 2.5 ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-300 hover:text-white hover:bg-white/10'
              }`}
              title="Perbesar Layar (Zoom In)"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            {(zoomLevel !== 1 || panOffset.x !== 0 || panOffset.y !== 0) && (
              <button
                onClick={handleResetZoom}
                className="ml-0.5 p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Reset Posisi & Zoom"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Top-right card actions: Bookmark & Share */}
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setIsBookmarked(!isBookmarked)}
              className="p-1.5 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              title="Simpan Bookmark"
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-white text-white' : ''}`} />
            </button>
            <button 
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Tautan disalin ke clipboard');
                }
              }}
              className="p-1.5 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              title="Bagikan Tautan"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Video Canvas Container (supports wheel zoom, touch pinch, and drag-to-pan) */}
        <div 
          data-allow-zoom="true"
          onWheel={handlePlayerWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`relative w-full aspect-[9/16] max-h-[360px] sm:max-h-[420px] rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-inner select-none ${
            zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
          }`}
        >
          {/* Scaled & Panned Remotion Player Wrapper */}
          <div 
            className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out will-change-transform"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
              transformOrigin: 'center center',
            }}
          >
            <Player
              ref={playerRef}
              component={KineticComposition}
              inputProps={composition}
              durationInFrames={composition.fps * composition.durationInSeconds}
              compositionWidth={compWidth}
              compositionHeight={compHeight}
              fps={composition.fps}
              loop
              autoPlay={false}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                pointerEvents: zoomLevel > 1 && isDragging ? 'none' : 'auto',
              }}
            />
          </div>

          {/* Center Play Overlay Icon when paused */}
          {!isPlaying && (
            <button
              onClick={handleTogglePlay}
              className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white flex items-center justify-center transition-transform hover:scale-110 cursor-pointer shadow-lg z-20"
              title="Putar Video"
            >
              <Play className="w-6 h-6 fill-white ml-0.5" />
            </button>
          )}

          {/* Zoomed State Overlay Helper */}
          {zoomLevel > 1 && (
            <div className="pointer-events-none absolute bottom-2 left-2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-sm text-[10px] text-zinc-300 shadow-md">
              <Move className="w-3 h-3 text-white" />
              <span>Geser untuk memindahkan canvas</span>
            </div>
          )}
        </div>

        {/* Video Controls Bar matching Reference Image 1 */}
        <div className="w-full mt-3 flex items-center gap-3 px-1 text-xs">
          {/* Play/Pause Button */}
          <button
            onClick={handleTogglePlay}
            className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer shrink-0"
            title={isPlaying ? 'Jeda' : 'Putar'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-white" />
            ) : (
              <Play className="w-4 h-4 fill-white" />
            )}
          </button>

          {/* Scrubber slider bar matching image 1 (white progress on dark track) */}
          <div className="flex-1 flex items-center gap-2">
            <div 
              onClick={(e) => {
                if (!playerRef.current) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const pct = Math.max(0, Math.min(1, clickX / rect.width));
                const targetFrame = Math.floor(pct * (composition.fps * composition.durationInSeconds));
                playerRef.current.seekTo(targetFrame);
              }}
              className="relative flex-1 h-1.5 bg-[#252730] rounded-full cursor-pointer overflow-hidden group"
            >
              <div 
                className="absolute left-0 top-0 bottom-0 bg-white rounded-full transition-all"
                style={{ width: `${(currentTime / composition.durationInSeconds) * 100}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-zinc-400 shrink-0">
              0:0{Math.floor(currentTime)} / 0:0{composition.durationInSeconds}
            </span>
          </div>

          {/* Audio volume icon */}
          <button 
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors shrink-0 cursor-pointer"
            title="Audio Video"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Quick Property toggle */}
          <button
            onClick={() => setShowQuickEditor(!showQuickEditor)}
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors shrink-0 cursor-pointer"
            title="Edit Properti Cepat"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Collapsible Quick Property Editor */}
        {showQuickEditor && (
          <div className="w-full mt-3 p-4 rounded-2xl bg-gradient-to-b from-[#1f2127] to-[#15161b] text-xs space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2">
              <span className="font-medium text-white flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-zinc-400" /> Properti Komposisi
              </span>
              <span className="text-[10px] text-zinc-400">Real-time sync</span>
            </div>

            <div className="space-y-1">
              <label className="text-zinc-400 text-[11px]">Headline Text</label>
              <input
                type="text"
                value={composition.headline}
                onChange={(e) => {
                  const updated = { ...composition, headline: e.target.value };
                  setComposition(updated);
                  apiClient.updateComposition(updated);
                }}
                className="w-full rounded-xl bg-[#111216] px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white/30 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-zinc-400 text-[11px]">Highlight Word</label>
                <input
                  type="text"
                  value={composition.highlightWord}
                  onChange={(e) => {
                    const updated = { ...composition, highlightWord: e.target.value };
                    setComposition(updated);
                    apiClient.updateComposition(updated);
                  }}
                  className="w-full rounded-xl bg-[#111216] px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-white/30 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 text-[11px]">Aspek Rasio</label>
                <div className="grid grid-cols-3 gap-1">
                  {(['9:16', '16:9', '1:1'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => {
                        const updated = { ...composition, aspectRatio: ratio };
                        setComposition(updated);
                        apiClient.updateComposition(updated);
                      }}
                      className={`py-1.5 rounded-lg text-center font-mono text-[11px] cursor-pointer transition-all ${
                        composition.aspectRatio === ratio
                          ? 'bg-white text-black font-semibold'
                          : 'bg-[#111216] text-zinc-400 hover:text-white'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading Indicator & Execution Steps matching Reference Image 1 */}
      {isSending && (
        <div className="space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
            <span>{systemStatus?.activeModel || 'Gemini 3.8 Flash'} • Running for {sendingSeconds}s</span>
          </div>

          {/* Working Sparkle & Spinning Indicator */}
          <div className="flex items-center gap-2 text-xs text-zinc-200 px-1">
            <div className="w-3.5 h-3.5 rounded-full border-[1.5px] border-transparent border-t-white border-r-white/60 animate-spin" />
            <span className="font-medium">Working</span>
          </div>

          {/* Steps Checklist Card matching Image 1 */}
          <div className="p-3 rounded-2xl bg-gradient-to-b from-[#1b1c21] to-[#121316] space-y-2 text-xs text-zinc-300 shadow-md">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-zinc-300">server/routes.ts</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-zinc-300">src/api/client.ts</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages Log */}
      {messages.length > 0 && (
        <div className="space-y-2.5 max-h-[220px] overflow-y-auto px-1 text-xs">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isSys = msg.sender === 'system';

            if (isSys) {
              return (
                <div key={msg.id} className="p-2.5 rounded-2xl bg-gradient-to-b from-[#191b20] to-[#131417] text-center text-zinc-400 text-[11px]">
                  {msg.text}
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-[#2c2e36] to-[#22242c] text-white shadow-sm'
                      : 'bg-gradient-to-b from-[#1a1b20] to-[#131417] text-zinc-200 shadow-sm'
                  }`}
                >
                  {msg.text}

                  {/* Action Request Card */}
                  {msg.actionRequest && (
                    <div className="mt-2.5 p-3 rounded-xl bg-gradient-to-b from-[#22242c] to-[#17181d] text-left space-y-2">
                      <div className="flex items-center gap-1.5 text-white font-medium text-[11px]">
                        <PackageCheck className="w-4 h-4 text-zinc-300 shrink-0" />
                        <span>{msg.actionRequest.title}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-normal">
                        {msg.actionRequest.description}
                      </p>
                      <button
                        onClick={() => setPendingAction(msg.actionRequest)}
                        className="w-full mt-1 py-1.5 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-[11px] transition-all cursor-pointer shadow-sm"
                      >
                        Tinjau Izin & Pasang
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={chatBottomRef} />
        </div>
      )}

      {/* Quick Prompts Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-[11px]">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(prompt)}
            disabled={isSending}
            className="px-3 py-1 rounded-full bg-gradient-to-b from-[#1f2026] to-[#141519] hover:from-[#272930] hover:to-[#1b1c21] text-zinc-300 hover:text-white shrink-0 transition-colors cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Input Container matching Reference Image 1 */}
      <div className="rounded-3xl bg-gradient-to-b from-[#1c1d22] to-[#141518] p-3 shadow-xl shadow-black/60 flex flex-col gap-2">
        {/* Main Input Textarea/Input */}
        <textarea
          rows={2}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Make changes, add new features, ask for anything"
          className="w-full bg-transparent px-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none resize-none"
        />

        {/* Bottom controls row matching Reference Image 1 */}
        <div className="flex items-center justify-between pt-1">
          {/* Left: Plus icon */}
          <button
            type="button"
            onClick={onNavigateSettings}
            className="w-8 h-8 rounded-full bg-[#24262f] hover:bg-[#2d303a] text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Tambah atau Pilih Model"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Right section: Model dropdown pill, Mic icon, Send/Stop icon */}
          <div className="flex items-center gap-2">
            {/* Model Selector Pill */}
            <button
              type="button"
              onClick={onNavigateSettings}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#22242b] hover:bg-[#2b2d35] text-zinc-200 text-xs font-medium transition-colors cursor-pointer"
              title="Pilih Model AI"
            >
              <span className="max-w-[130px] truncate">{activeModelDisplay}</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {/* Mic button */}
            <button
              type="button"
              onClick={() => alert('Fitur input suara lokal akan tersedia di update berikutnya.')}
              className="w-8 h-8 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Voice Input"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Send / Stop circular button */}
            {isSending ? (
              <button
                type="button"
                onClick={() => setIsSending(false)}
                className="w-8 h-8 rounded-full bg-[#2a2c35] hover:bg-[#353842] text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Hentikan Proses"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim()}
                className="w-8 h-8 rounded-full bg-white hover:bg-zinc-200 disabled:opacity-30 text-black flex items-center justify-center transition-all cursor-pointer shadow-sm"
                title="Kirim Pesan"
              >
                <Send className="w-3.5 h-3.5 fill-black" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Permission Approval Dialog */}
      {pendingAction && (
        <ApprovalDialog
          isOpen={true}
          title={pendingAction.title || 'Izin Diperlukan'}
          description={pendingAction.description || 'AI meminta izin untuk menjalankan aksi ini.'}
          targetName={pendingAction.packageName}
          version={pendingAction.version}
          confirmLabel="Setujui & Pasang"
          cancelLabel="Tolak"
          onConfirm={handleApproveAction}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </div>
  );
};
