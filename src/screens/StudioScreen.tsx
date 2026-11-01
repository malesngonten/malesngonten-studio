import React, { useState, useEffect, useRef } from 'react';
import { Player, PlayerRef } from '@remotion/player';
import { 
  Sparkles, 
  Play, 
  Pause, 
  RotateCcw, 
  SlidersHorizontal, 
  ChevronDown, 
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
  Flame,
  Coffee,
  Zap,
  Quote,
  Layers,
  ArrowRight,
  RotateCw,
  Settings,
  Copy,
  Check,
  Terminal,
  FileCode,
  AlertCircle,
  Clock,
  Loader2,
  Undo2,
  Redo2,
  Move,
  History,
  FolderOpen
} from 'lucide-react';
import { KineticComposition } from '../remotion/KineticComposition.tsx';
import { 
  CompositionProps, 
  ChatMessage, 
  SystemStatus, 
  ChatActivity, 
  TimelineLayerItem, 
  MediaAsset 
} from '../contracts/types.ts';
import { ApprovalDialog } from '../components/common/ApprovalDialog.tsx';
import { GlowBorder } from '../components/common/GlowBorder.tsx';
import { TimelineTrack } from '../components/studio/TimelineTrack.tsx';
import { CanvasLayerOverlay } from '../components/studio/CanvasLayerOverlay.tsx';
import { AssetManagementModal } from '../components/studio/AssetManagementModal.tsx';
import { apiClient } from '../api/client.ts';

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
    tagline: '#KreatorCerdas #VideoViral',
    aspectRatio: '9:16',
    durationInSeconds: 6,
    fps: 30,
    primaryColor: '#ffffff',
    accentColor: '#38bdf8', // Vibrant sky blue accent
    bgColor: '#0c0d10',
    fontStyle: 'display',
    animationPreset: 'kinetic-pop',
    authorHandle: '@studio.kreator',
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendingSeconds, setSendingSeconds] = useState(0);
  const [currentActivity, setCurrentActivity] = useState<ChatActivity | null>(null);
  const [activeFile, setActiveFile] = useState<string | undefined>(undefined);
  const [activeCommand, setActiveCommand] = useState<string | undefined>(undefined);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lastUserPrompt, setLastUserPrompt] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const [showQuickEditor, setShowQuickEditor] = useState(false);
  const [showTimelineTrack, setShowTimelineTrack] = useState(false);
  const [showCanvasOverlay, setShowCanvasOverlay] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [customAssets, setCustomAssets] = useState<MediaAsset[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Global Undo / Redo history stack
  const [history, setHistory] = useState<CompositionProps[]>([composition]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const pushHistory = (newComp: CompositionProps) => {
    setHistory((prev) => {
      const upToCurrent = prev.slice(0, historyIndex + 1);
      return [...upToCurrent, newComp];
    });
    setHistoryIndex((prev) => prev + 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const targetIdx = historyIndex - 1;
      const targetComp = history[targetIdx];
      setHistoryIndex(targetIdx);
      setComposition(targetComp);
      apiClient.updateComposition(targetComp);
      setToastMessage('Aksi dibatalkan (Undo)');
      setTimeout(() => setToastMessage(null), 2000);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const targetIdx = historyIndex + 1;
      const targetComp = history[targetIdx];
      setHistoryIndex(targetIdx);
      setComposition(targetComp);
      apiClient.updateComposition(targetComp);
      setToastMessage('Aksi diulang (Redo)');
      setTimeout(() => setToastMessage(null), 2000);
    }
  };

  const handleRestoreVersion = (snapshot?: CompositionProps, fallbackPatch?: Partial<CompositionProps>) => {
    const targetComp = snapshot || (fallbackPatch ? { ...composition, ...fallbackPatch } : null);
    if (!targetComp) return;
    setComposition(targetComp);
    pushHistory(targetComp);
    apiClient.updateComposition(targetComp);
    playerRef.current?.seekTo(0);
    playerRef.current?.play();
    setIsPlaying(true);
    setToastMessage('Versi video berhasil dikembalikan ke titik ini!');
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Asset Management handlers
  const handleAddAsset = (asset: MediaAsset) => {
    setCustomAssets((prev) => [...prev, asset]);
    setToastMessage(`Asset "${asset.name}" berhasil ditambahkan!`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleDeleteAsset = (id: string) => {
    setCustomAssets((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddAssetToTimeline = (asset: MediaAsset) => {
    const newId = `layer-${Date.now()}`;
    const startSec = Math.floor(currentTime);
    const durationSec = asset.durationSec || 4;
    const newEndSec = startSec + durationSec;
    const newTotalDuration = Math.max(composition.durationInSeconds, newEndSec);

    const currentLayers: TimelineLayerItem[] = composition.timelineLayers || [
      {
        id: 'headline',
        name: composition.headline || 'Judul Hook (3 Detik)',
        type: 'headline',
        startSec: 0,
        durationSec: composition.durationInSeconds,
        x: 0,
        y: 0,
        scale: 1,
        visible: true,
        trackIndex: 0,
        color: '#38bdf8',
      },
      {
        id: 'subtext',
        name: composition.subtext || 'Teks Subtext / Deskripsi',
        type: 'subtext',
        startSec: 0.3,
        durationSec: Math.max(0.5, composition.durationInSeconds - 0.3),
        x: 0,
        y: 0,
        scale: 1,
        visible: true,
        trackIndex: 1,
        color: '#a78bfa',
      },
      {
        id: 'tagline',
        name: composition.tagline || 'Tagline / Badge Atas',
        type: 'tagline',
        startSec: 0,
        durationSec: composition.durationInSeconds,
        x: 0,
        y: 0,
        scale: 1,
        visible: true,
        trackIndex: 2,
        color: '#34d399',
      },
      {
        id: 'author',
        name: composition.authorHandle || 'Footer & Watermark',
        type: 'author',
        startSec: 0,
        durationSec: composition.durationInSeconds,
        x: 0,
        y: 0,
        scale: 1,
        visible: true,
        trackIndex: 3,
        color: '#fbbf24',
      },
    ];

    const newLayer: TimelineLayerItem = {
      id: newId,
      name: asset.name,
      type: asset.type,
      startSec,
      durationSec,
      x: 0,
      y: asset.type === 'image' ? 0 : 50,
      scale: 1,
      visible: true,
      content: asset.url,
      trackIndex: currentLayers.length,
      color: asset.type === 'audio' ? '#a855f7' : asset.type === 'video' ? '#06b6d4' : '#10b981',
    };

    const updatedLayers = [...currentLayers, newLayer];
    const updatedComp: CompositionProps = {
      ...composition,
      durationInSeconds: newTotalDuration,
      timelineLayers: updatedLayers,
    };

    setComposition(updatedComp);
    pushHistory(updatedComp);
    apiClient.updateComposition(updatedComp);
    setShowTimelineTrack(true);
    setToastMessage(`Layer "${asset.name}" berhasil dipasang di timeline!`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleUpdateTimelineLayers = (newLayers: TimelineLayerItem[], newDuration?: number) => {
    const updated: CompositionProps = {
      ...composition,
      timelineLayers: newLayers,
      durationInSeconds: newDuration || composition.durationInSeconds,
    };
    setComposition(updated);
    apiClient.updateComposition(updated);
  };

  // Keyboard shortcut listener for Ctrl+Z (Undo) and Ctrl+Y (Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

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
      const startTime = Date.now();
      interval = setInterval(() => {
        setSendingSeconds(Number(((Date.now() - startTime) / 1000).toFixed(1)));
      }, 100);
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
      if (isMounted && comp) {
        setComposition(comp);
        setHistory([comp]);
        setHistoryIndex(0);
      }
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

  // Scroll chat on new messages or during live streaming
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isSending) return;

    const tempUserMsgId = `usr-${Date.now()}`;
    const newUserMsg: ChatMessage = {
      id: tempUserMsgId,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
    };

    // Streaming placeholder assistant message
    const tempAsstMsgId = `asst-stream-${Date.now()}`;
    const newAsstMsg: ChatMessage = {
      id: tempAsstMsgId,
      sender: 'assistant',
      text: '',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      status: 'streaming',
    };

    // 1. Immediately append to timeline state so user prompt NEVER vanishes!
    setMessages((prev) => [...prev, newUserMsg, newAsstMsg]);
    setInputMessage('');
    setIsSending(true);
    setLastUserPrompt(text);
    setCurrentActivity(null);
    setActiveFile(undefined);
    setActiveCommand(undefined);

    // 2. Stream real-time events via Server-Sent Events (SSE)
    const controller = apiClient.streamChatMessage(text, {
      onUserMessage: (confirmedMsg) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempUserMsgId ? { ...confirmedMsg, status: 'sending' } : m))
        );
      },
      onToken: ({ delta }) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempAsstMsgId ? { ...m, text: m.text + delta } : m))
        );
      },
      onActivity: (activity) => {
        setCurrentActivity(activity);
        setMessages((prev) =>
          prev.map((m) => (m.id === tempAsstMsgId ? { ...m, activity } : m))
        );
        if (activity.file) setActiveFile(activity.file);
        if (activity.command) setActiveCommand(activity.command);
      },
      onCompositionUpdate: (comp) => {
        setComposition(comp);
        pushHistory(comp);
        playerRef.current?.seekTo(0);
        playerRef.current?.play();
        setIsPlaying(true);
      },
      onResult: (data) => {
        setMessages((prev) => {
          // Replace temp messages with confirmed persistent messages
          const filtered = prev.filter(
            (m) => m.id !== tempUserMsgId && m.id !== tempAsstMsgId && m.id !== data.userMessage.id
          );
          return [...filtered, data.userMessage, data.assistantMessage];
        });

        if (data.updatedComposition) {
          setComposition(data.updatedComposition);
          pushHistory(data.updatedComposition);
          playerRef.current?.seekTo(0);
          playerRef.current?.play();
          setIsPlaying(true);
        }

        if (data.assistantMessage.actionRequest) {
          setPendingAction(data.assistantMessage.actionRequest);
        }
        setCurrentActivity(null);
        setIsSending(false);
      },
      onError: (err) => {
        setMessages((prev) => {
          const updated = prev.map((m) =>
            m.id === tempUserMsgId
              ? { ...m, status: 'error' as const, errorMessage: err.message }
              : m.id === tempAsstMsgId
              ? (err.assistantMessage || {
                  ...m,
                  status: 'error' as const,
                  text: m.text || err.message || 'Terjadi gangguan saat memproses respon dari AI provider.',
                  errorMessage: err.message,
                  activity: currentActivity ? { ...currentActivity, status: 'error' as const } : undefined,
                })
              : m
          );
          return updated;
        });
        setCurrentActivity(null);
        setIsSending(false);
      },
    });

    abortControllerRef.current = controller;
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSending(false);
    setCurrentActivity(null);
    setMessages((prev) =>
      prev.map((m) =>
        m.status === 'sending'
          ? { ...m, status: 'error' as const, errorMessage: 'Proses dibatalkan oleh pengguna.' }
          : m.status === 'streaming'
          ? { ...m, status: 'success' as const, text: m.text ? m.text + ' (Diberhentikan)' : 'Proses dihentikan.' }
          : m
      )
    );
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
          author: 'Remotion Core',
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
            text: `Berhasil memasang ${pendingAction.packageName}! Fitur baru kini aktif untuk video Anda.`,
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

  // Quick suggestions with icons matching reference aesthetic
  const quickPrompts = [
    { label: 'Hook Viral 3 Detik', icon: Flame, prompt: 'Buatkan hook 3 detik pertama yang sangat bikin penasaran untuk konten tips kreator!' },
    { label: 'Tema Santai & Aesthetic', icon: Coffee, prompt: 'Ubah teks dan warna jadi gaya santai, hangat, dan aesthetic untuk quote motivasi.' },
    { label: 'Fakta Singkat & Berita', icon: Zap, prompt: 'Format teks jadi gaya berita kilat: judul tegas, punchline cepat, warna kontras tinggi.' },
    { label: 'Quotes Motivasi Harian', icon: Quote, prompt: 'Buatkan teks video kutipan sukses dan kerja keras dengan kata kunci yang bersinar.' },
  ];

  const activeModelDisplay = systemStatus?.isDemoMode 
    ? 'Mode Demo' 
    : (systemStatus?.activeModel || 'Default');

  return (
    <div className="flex flex-col min-h-[calc(100vh-70px)] pb-28 md:pb-16 max-w-3xl mx-auto px-3 sm:px-6 pt-2 gap-5">
      {/* Top Model Badge line */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-zinc-400 px-1 pt-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-medium text-zinc-200">
            <span className={`w-2 h-2 rounded-full ${systemStatus?.isDemoMode ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
            {systemStatus?.isDemoMode ? 'Simulasi Otomatis' : (systemStatus?.activeModel || 'Gemini 2.5 Flash')}
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-zinc-400">Studio Siap Digunakan</span>
        </div>
      </div>

      {/* Main Video Preview Card (Spacious, Clean, High Contrast - No borders) */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#181a20] via-[#14151a] to-[#101115] p-3.5 sm:p-5 shadow-2xl shadow-black flex flex-col items-center">
        {/* Top actions line: Zoom Controls, Undo/Redo + Quick Tools */}
        <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-3 text-zinc-400">
          {/* Zoom In / Zoom Out Controls & Undo / Redo */}
          <div className="flex items-center gap-2">
            <div 
              data-allow-zoom="true"
              className="flex items-center gap-1 bg-[#101116] px-2.5 py-1.5 rounded-full select-none"
            >
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  zoomLevel <= 0.5 ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-300 hover:text-white hover:bg-white/10'
                }`}
                title="Perkecil Tampilan (Zoom Out)"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <button
                onClick={handleResetZoom}
                className="px-2 py-0.5 text-xs font-mono text-zinc-200 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
                title="Kembalikan ke Ukuran Semula (100%)"
              >
                {Math.round(zoomLevel * 100)}%
              </button>

              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 2.5}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  zoomLevel >= 2.5 ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-300 hover:text-white hover:bg-white/10'
                }`}
                title="Perbesar Tampilan (Zoom In)"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              {(zoomLevel !== 1 || panOffset.x !== 0 || panOffset.y !== 0) && (
                <button
                  onClick={handleResetZoom}
                  className="ml-1 p-1 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Reset Posisi & Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Undo / Redo Buttons */}
            <div className="flex items-center gap-1 bg-[#101116] px-2 py-1.5 rounded-full">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className={`p-1 rounded-full transition-colors cursor-pointer ${
                  historyIndex <= 0 ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95'
                }`}
                title="Batalkan perubahan (Undo / Ctrl+Z)"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className={`p-1 rounded-full transition-colors cursor-pointer ${
                  historyIndex >= history.length - 1 ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-300 hover:text-white hover:bg-white/10 active:scale-95'
                }`}
                title="Ulangi perubahan (Redo / Ctrl+Y)"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Video Aspect Ratio, Tata Letak, & Quick Editor Toggle */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center bg-[#101116] p-1 rounded-full text-xs">
              {(['9:16', '1:1', '16:9'] as const).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => {
                    const updated = { ...composition, aspectRatio: ratio };
                    setComposition(updated);
                    pushHistory(updated);
                    apiClient.updateComposition(updated);
                  }}
                  className={`px-2.5 py-1 rounded-full font-mono text-xs cursor-pointer transition-all ${
                    composition.aspectRatio === ratio
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {ratio === '9:16' ? 'Vertikal' : ratio === '1:1' ? 'Kotak' : 'Lebar'}
                </button>
              ))}
            </div>

            {/* Direct On-Canvas Layer Position/Size Drag Toggle */}
            <button
              onClick={() => setShowCanvasOverlay(!showCanvasOverlay)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                showCanvasOverlay ? 'bg-sky-500 text-white shadow-md' : 'bg-[#101116] text-zinc-300 hover:text-white hover:bg-white/5'
              }`}
              title="Atur tata letak dan ukuran komponen langsung di layar video"
            >
              <Move className="w-3.5 h-3.5" />
              <span>Tata Letak</span>
            </button>

            <button
              onClick={() => setShowQuickEditor(!showQuickEditor)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                showQuickEditor ? 'bg-white text-black' : 'bg-[#101116] text-zinc-300 hover:text-white hover:bg-white/5'
              }`}
              title="Buka atau Tutup Panel Edit Cepat"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showQuickEditor ? 'Tutup Edit' : 'Edit Cepat'}</span>
            </button>
          </div>
        </div>

        {/* Remotion Player Canvas Container with Drag Pan & Zoom */}
        <div 
          data-allow-zoom="true"
          onWheel={handleZoomIn}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`w-full flex items-center justify-center overflow-hidden rounded-2xl bg-black relative shadow-inner select-none ${
            composition.aspectRatio === '9:16' 
              ? 'h-[360px] sm:h-[440px]' 
              : composition.aspectRatio === '1:1' 
              ? 'h-[300px] sm:h-[380px]' 
              : 'h-[220px] sm:h-[300px]'
          } ${zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'}`}
        >
          <div 
            style={{
              transform: `scale(${zoomLevel}) translate(${panOffset.x / zoomLevel}px, ${panOffset.y / zoomLevel}px)`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
            className="w-full h-full flex items-center justify-center pointer-events-none"
          >
            <Player
              ref={playerRef}
              component={KineticComposition}
              inputProps={composition}
              durationInFrames={composition.durationInSeconds * composition.fps}
              fps={composition.fps}
              compositionWidth={compWidth}
              compositionHeight={compHeight}
              style={{
                width: '100%',
                height: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
              controls={false}
              loop
              autoPlay={false}
            />
          </div>

          {/* On-Canvas Layer Manipulation Overlay */}
          {showCanvasOverlay && (
            <CanvasLayerOverlay
              composition={composition}
              onUpdateLayer={(id, transform) => {
                const updated = {
                  ...composition,
                  layers: {
                    ...(composition.layers || {}),
                    [id]: {
                      ...(composition.layers?.[id] || {}),
                      ...transform,
                    },
                  },
                };
                setComposition(updated);
                apiClient.updateComposition(updated);
              }}
              onCommit={() => pushHistory(composition)}
              onClose={() => setShowCanvasOverlay(false)}
            />
          )}
        </div>

        {/* Video Player Bottom Controls: Play/Pause, Timeline Toggle, Scrubber */}
        <div className="w-full pt-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {/* Big Play/Pause Button */}
            <button
              onClick={handleTogglePlay}
              className="w-10 h-10 rounded-full bg-white text-black hover:bg-zinc-200 flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-95"
              title={isPlaying ? 'Jeda Video' : 'Putar Video'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black ml-0.5" />}
            </button>

            {/* Restart Button */}
            <button
              onClick={handleRestart}
              className="w-9 h-9 rounded-full bg-[#181a20] hover:bg-[#22252e] text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
              title="Ulangi dari Awal"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Timeline Track Toggle Button (Minimalist: hideable by default) */}
            <button
              onClick={() => setShowTimelineTrack(!showTimelineTrack)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                showTimelineTrack 
                  ? 'bg-sky-500 text-white shadow-md' 
                  : 'bg-[#181a20] hover:bg-[#22252e] text-zinc-300 hover:text-white'
              }`}
              title="Buka atau Tutup Timeline Layer & Durasi"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Timeline Layer</span>
            </button>

            <span className="font-mono text-zinc-300 text-xs sm:text-sm pl-1">
              00:0{Math.floor(currentTime)} / 00:0{composition.durationInSeconds}
            </span>
          </div>

          {/* Quick info right */}
          <div className="flex items-center gap-2 text-zinc-400">
            <button
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                  setShareFeedback(true);
                  setTimeout(() => setShareFeedback(false), 2500);
                }
              }}
              className="p-2 rounded-full hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              title="Salin Tautan Video"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {shareFeedback && (
              <span className="text-[11px] text-emerald-400 font-medium">Tautan tersalin!</span>
            )}
          </div>
        </div>

        {/* Collapsible Timeline Track Drawer (Matching Reference) */}
        {showTimelineTrack && (
          <div className="w-full mt-3">
            <TimelineTrack
              composition={composition}
              currentTime={currentTime}
              durationInSeconds={composition.durationInSeconds}
              isPlaying={isPlaying}
              onSeek={(time) => {
                if (playerRef.current) {
                  playerRef.current.seekTo(Math.floor(time * (composition.fps || 30)));
                  setCurrentTime(time);
                }
              }}
              onTogglePlay={handleTogglePlay}
              onUpdateTimelineLayers={handleUpdateTimelineLayers}
              onCommitLayers={() => pushHistory(composition)}
              onOpenAssetManagement={() => setShowAssetModal(true)}
              onClose={() => setShowTimelineTrack(false)}
            />
          </div>
        )}

        {/* Collapsible Quick Editor (Friendly, No Technical Jargon) */}
        {showQuickEditor && (
          <div className="w-full mt-4 p-4 rounded-2xl bg-[#14151a] space-y-3.5 text-xs sm:text-sm animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-1">
              <span className="font-semibold text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-sky-400" />
                Ubah Teks &amp; Warna Langsung
              </span>
              <span className="text-zinc-400 text-xs">Perubahan langsung terlihat</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-300 font-medium text-xs">Judul Utama Video (Hook 3 Detik)</label>
              <input
                type="text"
                value={composition.headline}
                onChange={(e) => {
                  const updated = { ...composition, headline: e.target.value };
                  setComposition(updated);
                  apiClient.updateComposition(updated);
                }}
                className="w-full rounded-xl bg-[#0e0f12] px-3 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-sky-400 text-xs sm:text-sm"
                placeholder="Contoh: RAHASIA KONTEN VIRAL TERBONGKAR!"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-zinc-300 font-medium text-xs">Kata yang Diberi Aksen Warna</label>
                <input
                  type="text"
                  value={composition.highlightWord}
                  onChange={(e) => {
                    const updated = { ...composition, highlightWord: e.target.value };
                    setComposition(updated);
                    apiClient.updateComposition(updated);
                  }}
                  className="w-full rounded-xl bg-[#0e0f12] px-3 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-sky-400 text-xs sm:text-sm"
                  placeholder="Contoh: VIRAL"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-300 font-medium text-xs">Warna Aksen Teks</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={composition.accentColor}
                    onChange={(e) => {
                      const updated = { ...composition, accentColor: e.target.value };
                      setComposition(updated);
                      apiClient.updateComposition(updated);
                    }}
                    className="w-9 h-9 rounded-lg bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-xs text-zinc-300">{composition.accentColor}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-300 font-medium text-xs">Teks Penjelasan / Deskripsi Singkat</label>
              <input
                type="text"
                value={composition.subtext}
                onChange={(e) => {
                  const updated = { ...composition, subtext: e.target.value };
                  setComposition(updated);
                  apiClient.updateComposition(updated);
                }}
                className="w-full rounded-xl bg-[#0e0f12] px-3 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-sky-400 text-xs sm:text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Chat Messages History & Live Real-Time Feedback */}
      {(messages.length > 0 || isSending) && (
        <div className="space-y-3.5 max-h-[380px] overflow-y-auto px-1 text-xs sm:text-sm">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isSys = msg.sender === 'system';
            const isErr = msg.status === 'error';
            const isSendingUserMsg = msg.status === 'sending';
            const isStreaming = msg.status === 'streaming';

            if (isSys) {
              return (
                <div key={msg.id} className="p-3 rounded-2xl bg-[#14151a] text-center text-zinc-400 text-xs">
                  {msg.text}
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                <div
                  className={`max-w-[92%] sm:max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed transition-all ${
                    isUser
                      ? isErr 
                        ? 'bg-[#2b1f22] text-rose-200 shadow-md' 
                        : isSendingUserMsg 
                        ? 'bg-[#22242c] text-white shadow-md' 
                        : 'bg-[#2b2d36] text-white shadow-md'
                      : isErr
                      ? 'bg-[#1e1418] text-rose-200 shadow-md w-full'
                      : 'bg-[#18191f] text-zinc-200 shadow-md'
                  }`}
                >
                  {/* User Message Header / Status indicator */}
                  {isUser && (
                    <div className="flex items-center justify-between gap-3 pb-1 text-[11px]">
                      <span className="text-zinc-400 font-medium">Ide Kamu</span>
                      <div className="flex items-center gap-1.5">
                        {isSendingUserMsg && (
                          <span className="inline-flex items-center gap-1 text-sky-400 font-medium">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Diproses
                          </span>
                        )}
                        {isErr && (
                          <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                            <AlertCircle className="w-3 h-3" />
                            Gagal
                          </span>
                        )}
                        {msg.status === 'success' && (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                            <Check className="w-3 h-3" />
                            Terkirim
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Main Message Content */}
                  {isStreaming ? (
                    <div>
                      {msg.text ? (
                        <p className="whitespace-pre-wrap">
                          {msg.text}
                          <span className="inline-block w-1.5 h-3.5 ml-1 bg-sky-400 animate-pulse rounded-xs align-middle" />
                        </p>
                      ) : (
                        <div className="flex items-center gap-2 text-zinc-400 text-xs py-1">
                          <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                          <span>Sedang merespon...</span>
                        </div>
                      )}

                      {/* In-flight streaming controls & timer */}
                      <div className="mt-2.5 pt-2 flex items-center justify-between gap-2 text-[11px] text-zinc-500">
                        <span className="flex items-center gap-1 font-mono text-sky-300">
                          <Clock className="w-3 h-3 animate-spin" />
                          {sendingSeconds.toFixed(1)}s
                        </span>
                        <button
                          onClick={handleStopGeneration}
                          className="inline-flex items-center gap-1 text-zinc-400 hover:text-rose-300 px-2 py-0.5 rounded-lg bg-white/5 hover:bg-rose-500/10 transition-colors cursor-pointer active:scale-95"
                          title="Hentikan pembuatan respon"
                        >
                          <Square className="w-2.5 h-2.5 fill-current" />
                          <span>Batal</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}

                  {/* Contextual Real Activity Badge (Analysis, File Update, Remotion, Render) */}
                  {msg.activity && (
                    <div className="mt-2.5 pt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        {msg.activity.status === 'running' ? (
                          <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin shrink-0" />
                        ) : msg.activity.status === 'done' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        )}
                        <span className={`text-[11px] font-medium ${msg.activity.status === 'running' ? 'text-sky-300' : 'text-zinc-300'}`}>
                          {msg.activity.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {msg.activity.file && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 font-mono text-[10px] text-emerald-300">
                            <FileCode className="w-3 h-3 text-emerald-400" />
                            {msg.activity.file.split('/').pop()}
                          </span>
                        )}
                        {msg.activity.command && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 font-mono text-[10px] text-sky-300">
                            <Terminal className="w-3 h-3 text-sky-400" />
                            {msg.activity.command}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* If assistant error: Show explicit diagnostic and action buttons */}
                  {!isUser && isErr && (
                    <div className="mt-3 p-3 bg-rose-950/20 rounded-2xl space-y-2.5">
                      <div className="flex items-center gap-2 text-rose-300 font-medium text-xs">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Tindakan yang Dapat Anda Lakukan:</span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {/* Action 1: Coba Lagi (Retry) */}
                        <button
                          onClick={() => handleSendMessage(lastUserPrompt)}
                          disabled={isSending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-medium text-xs transition-colors cursor-pointer active:scale-95"
                          title="Kirim ulang prompt ini ke AI"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          <span>Coba Lagi</span>
                        </button>

                        {/* Action 2: Buka Pengaturan AI */}
                        <button
                          onClick={onNavigateSettings}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors cursor-pointer active:scale-95"
                          title="Buka menu Pengaturan untuk memeriksa atau mengganti Kunci API dan Model"
                        >
                          <Settings className="w-3.5 h-3.5 text-sky-400" />
                          <span>Atur Kunci AI / Provider</span>
                        </button>

                        {/* Action 3: Salin Pesan */}
                        <button
                          onClick={() => {
                            if (navigator.clipboard && lastUserPrompt) {
                              navigator.clipboard.writeText(lastUserPrompt);
                              setCopiedId(msg.id);
                              setTimeout(() => setCopiedId(null), 2500);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs transition-colors cursor-pointer"
                          title="Salin teks ide Anda agar tidak hilang"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin Ide</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Request Card */}
                  {msg.actionRequest && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-[#101115] text-left space-y-2">
                      <div className="flex items-center gap-2 text-white font-medium text-xs sm:text-sm">
                        <PackageCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{msg.actionRequest.title}</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-normal">
                        {msg.actionRequest.description}
                      </p>
                      <button
                        onClick={() => setPendingAction(msg.actionRequest)}
                        className="w-full mt-2 py-2 rounded-xl bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        Setujui &amp; Pasang Fitur
                      </button>
                    </div>
                  )}

                  {/* Success Modified File & Command Chip (only when not streaming and file exists) */}
                  {!isUser && !isErr && !isStreaming && msg.activeFile && (
                    <div className="mt-2.5 pt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 font-mono text-zinc-300">
                        <FileCode className="w-3 h-3 text-emerald-400" />
                        {msg.activeFile.split('/').pop()}
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-zinc-400">Tersinkronisasi ke video</span>
                    </div>
                  )}

                  {/* Action History & Restore Version Button */}
                  {!isUser && !isErr && !isStreaming && (msg.actionSummary || msg.suggestedProps || msg.appliedCompositionSnapshot) && (
                    <div className="mt-3 pt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-zinc-300">
                        <span className="p-1 rounded-md bg-sky-500/10 text-sky-400">
                          <History className="w-3.5 h-3.5" />
                        </span>
                        <span className="font-medium text-[11px] text-zinc-200">
                          {msg.actionSummary || (msg.suggestedProps?.headline ? `Pembaruan: Hook "${msg.suggestedProps.headline}"` : 'Modifikasi Video')}
                        </span>
                      </div>

                      <button
                        onClick={() => handleRestoreVersion(msg.appliedCompositionSnapshot, msg.suggestedProps)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-all cursor-pointer active:scale-95 shadow-sm"
                        title="Kembalikan komposisi video ke versi yang dibuat pada pesan ini"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
                        <span>Kembalikan ke Versi Ini</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Retry button under user failed message */}
                {isUser && isErr && (
                  <button
                    onClick={() => handleSendMessage(msg.text)}
                    disabled={isSending}
                    className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 rounded-full cursor-pointer transition-colors active:scale-95"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Kirim Ulang</span>
                  </button>
                )}
              </div>
            );
          })}

          <div ref={chatBottomRef} />
        </div>
      )}

      {/* Rotating 1px Iridescent Border Glow Chat Input Container (Sole Attention Element) */}
      <GlowBorder className="w-full shadow-2xl" innerClassName="p-3.5 sm:p-4 flex flex-col gap-3">
        {/* Main Prompt Textarea */}
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
          placeholder="Tulis ide video yang ingin kamu buat, biarkan AI yang buatkan..."
          className="w-full bg-transparent px-2 pt-1 text-sm sm:text-base text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none leading-relaxed"
        />

        {/* Bottom controls row */}
        <div className="flex items-center justify-between pt-1">
          {/* Left: Plus circular action button */}
          <button
            type="button"
            onClick={onNavigateSettings}
            className="w-10 h-10 rounded-full bg-[#24262f] hover:bg-[#2d313c] text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
            title="Tambah atau Atur Kunci AI"
            aria-label="Tambah"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Right section: Model pill dropdown, Mic icon, Blue Sparkle Send Button */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Model Selector Pill */}
            <button
              type="button"
              onClick={onNavigateSettings}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#24262f] hover:bg-[#2e323e] text-zinc-200 text-xs sm:text-sm font-medium transition-all cursor-pointer active:scale-95"
              title="Ganti Model atau Pengaturan AI"
            >
              <span className="max-w-[130px] sm:max-w-[160px] truncate">{activeModelDisplay}</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>

            {/* Mic button */}
            <button
              type="button"
              onClick={() => {
                setInputMessage('Buatkan video hook 3 detik tentang cara konsisten membuat konten');
              }}
              className="w-10 h-10 rounded-full bg-[#24262f] hover:bg-[#2e323e] text-zinc-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
              title="Isi contoh ide suara"
              aria-label="Input Suara"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Sparkle Send / Stop Button */}
            {isSending ? (
              <button
                type="button"
                onClick={handleStopGeneration}
                className="w-10 h-10 rounded-2xl bg-[#2a2c35] hover:bg-[#353842] text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
                title="Hentikan Proses"
              >
                <Square className="w-4 h-4 fill-white" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim()}
                className="w-10 h-10 rounded-2xl bg-[#292c3a] hover:bg-[#343849] disabled:opacity-35 text-[#4285f4] hover:text-[#669df6] flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95"
                title="Kirim dan Buat Video"
                aria-label="Buat Video"
              >
                <Sparkles className="w-5 h-5 fill-current" />
              </button>
            )}
          </div>
        </div>
      </GlowBorder>

      {/* Quick Suggestion Pills below Chat Input (Borderless) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {quickPrompts.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSendMessage(item.prompt)}
              disabled={isSending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1b1d24] hover:bg-[#252833] text-zinc-200 hover:text-white shrink-0 text-xs sm:text-sm font-medium transition-all cursor-pointer active:scale-95 shadow-sm"
            >
              <Icon className="w-4 h-4 text-sky-400 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Permission Approval Dialog */}
      {pendingAction && (
        <ApprovalDialog
          isOpen={true}
          title={pendingAction.title || 'Izin Diperlukan'}
          description={pendingAction.description || 'AI merekomendasikan penambahan library untuk efek video baru ini.'}
          targetName={pendingAction.packageName}
          version={pendingAction.version}
          confirmLabel="Setujui &amp; Pasang"
          cancelLabel="Nanti Saja"
          onConfirm={handleApproveAction}
          onCancel={() => setPendingAction(null)}
        />
      )}

      {/* Floating Action Feedback Toast (Zero borders) */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#1e2029] text-white px-4 py-2.5 rounded-full shadow-2xl text-xs sm:text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Asset Management Modal */}
      <AssetManagementModal
        isOpen={showAssetModal}
        onClose={() => setShowAssetModal(false)}
        customAssets={customAssets}
        onAddAsset={handleAddAsset}
        onDeleteAsset={handleDeleteAsset}
        onAddToTimeline={handleAddAssetToTimeline}
      />
    </div>
  );
};
