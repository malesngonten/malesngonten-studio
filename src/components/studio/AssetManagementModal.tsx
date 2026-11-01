import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Image as ImageIcon, 
  Music, 
  Film, 
  Plus, 
  Trash2, 
  X, 
  Check, 
  Play, 
  FolderOpen,
  Sparkles
} from 'lucide-react';
import { MediaAsset, TimelineLayerItem } from '../../contracts/types.ts';

interface AssetManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  customAssets: MediaAsset[];
  onAddAsset: (asset: MediaAsset) => void;
  onDeleteAsset: (id: string) => void;
  onAddToTimeline: (asset: MediaAsset) => void;
}

const DEFAULT_PRESET_ASSETS: MediaAsset[] = [
  {
    id: 'asset-logo-mn',
    name: 'Logo Males Ngonten (PNG)',
    type: 'image',
    url: '/assets/aistudio/PhotoRoom-20261031_185018_f6d34a51.png',
    thumbnail: '/assets/aistudio/PhotoRoom-20261031_185018_f6d34a51.png',
    size: '124 KB',
  },
  {
    id: 'asset-beach-sunset',
    name: 'Golden Hour Sunset Beach (B-Roll)',
    type: 'image',
    url: '/assets/aistudio/IMG_20261101_201333_cdc53922.png',
    thumbnail: '/assets/aistudio/IMG_20261101_201333_cdc53922.png',
    size: '420 KB',
  },
  {
    id: 'asset-cat-mascot',
    name: 'Black Cat Mascot Studio',
    type: 'image',
    url: '/assets/aistudio/Black_Cat_Animals___Pets_Logo_20261024_034747_0000_d2a38d28.png',
    thumbnail: '/assets/aistudio/Black_Cat_Animals___Pets_Logo_20261024_034747_0000_d2a38d28.png',
    size: '88 KB',
  },
  {
    id: 'asset-audio-lofi',
    name: 'Chill Lofi Beat (Background Music)',
    type: 'audio',
    url: 'https://cdn.freesound.org/previews/515/515823_11438996-lq.mp3',
    size: '1.2 MB',
    durationSec: 15,
  },
  {
    id: 'asset-audio-pop',
    name: 'Upbeat Viral Trend Rhythm',
    type: 'audio',
    url: 'https://cdn.freesound.org/previews/612/612089_11861866-lq.mp3',
    size: '850 KB',
    durationSec: 12,
  },
];

export const AssetManagementModal: React.FC<AssetManagementModalProps> = ({
  isOpen,
  onClose,
  customAssets,
  onAddAsset,
  onDeleteAsset,
  onAddToTimeline,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'image' | 'audio' | 'video'>('all');
  const [addedFeedbackId, setAddedFeedbackId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const allAssets = [...DEFAULT_PRESET_ASSETS, ...customAssets];
  const filteredAssets = filterType === 'all' 
    ? allAssets 
    : allAssets.filter(a => a.type === filterType);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImg = file.type.startsWith('image/');
      const isAudio = file.type.startsWith('audio/');
      const isVideo = file.type.startsWith('video/');

      const type = isImg ? 'image' : isAudio ? 'audio' : isVideo ? 'video' : 'image';
      const fileUrl = URL.createObjectURL(file);

      const newAsset: MediaAsset = {
        id: `user-asset-${Date.now()}-${i}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        type,
        url: fileUrl,
        thumbnail: isImg ? fileUrl : undefined,
        size: `${(file.size / 1024).toFixed(0)} KB`,
        durationSec: isAudio || isVideo ? 10 : undefined,
      };

      onAddAsset(newAsset);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAdd = (asset: MediaAsset) => {
    onAddToTimeline(asset);
    setAddedFeedbackId(asset.id);
    setTimeout(() => setAddedFeedbackId(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#12141a] rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[88vh] text-zinc-200">
        {/* Header (No borders) */}
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-[#1e212b] text-sky-400">
              <FolderOpen className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Kelola Asset &amp; Media
              </h2>
              <p className="text-xs text-zinc-400">
                Pilih atau unggah gambar, stiker, musik latar, dan video untuk ditambahkan ke timeline
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-[#1b1d26] hover:bg-[#252835] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Pills & Upload Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-1.5 bg-[#0b0c10] p-1 rounded-2xl text-xs">
            {(['all', 'image', 'audio', 'video'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                  filterType === type 
                    ? 'bg-[#222634] text-white shadow-sm' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {type === 'all' ? 'Semua Asset' : type === 'image' ? 'Gambar & Stiker' : type === 'audio' ? 'Audio & Musik' : 'Video B-Roll'}
              </button>
            ))}
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,audio/*,video/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all cursor-pointer shadow-md active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah File Baru</span>
            </button>
          </div>
        </div>

        {/* Assets Grid / List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 py-2 pr-1 no-scrollbar min-h-[220px]">
          {filteredAssets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500 gap-2">
              <FolderOpen className="w-10 h-10 stroke-1" />
              <p className="text-sm">Belum ada asset untuk kategori ini</p>
            </div>
          ) : (
            filteredAssets.map((asset) => {
              const isDefault = DEFAULT_PRESET_ASSETS.some(d => d.id === asset.id);
              const isAdded = addedFeedbackId === asset.id;

              return (
                <div
                  key={asset.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#171922] hover:bg-[#1e202b] transition-all"
                >
                  {/* Left: Thumbnail & Name */}
                  <div className="flex items-center gap-3 truncate">
                    {/* Thumbnail preview */}
                    <div className="w-12 h-12 rounded-xl bg-[#0c0d12] flex items-center justify-center shrink-0 overflow-hidden">
                      {asset.type === 'image' ? (
                        <img
                          src={asset.thumbnail || asset.url}
                          alt={asset.name}
                          className="w-full h-full object-cover"
                        />
                      ) : asset.type === 'audio' ? (
                        <div className="p-2.5 rounded-lg bg-purple-500/20 text-purple-400">
                          <Music className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                          <Film className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    <div className="truncate">
                      <div className="font-medium text-sm text-white truncate">
                        {asset.name}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-400 pt-0.5">
                        <span className="capitalize">{asset.type}</span>
                        {asset.size && (
                          <>
                            <span>•</span>
                            <span>{asset.size}</span>
                          </>
                        )}
                        {asset.durationSec && (
                          <>
                            <span>•</span>
                            <span>{asset.durationSec}s</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Action buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleAdd(asset)}
                      disabled={isAdded}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isAdded
                          ? 'bg-emerald-500 text-white'
                          : 'bg-[#272b38] hover:bg-[#34394a] text-white active:scale-95'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Ditambahkan!</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Pasang di Timeline</span>
                        </>
                      )}
                    </button>

                    {!isDefault && (
                      <button
                        onClick={() => onDeleteAsset(asset.id)}
                        className="p-2 rounded-xl bg-transparent hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Hapus Asset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="pt-4 flex items-center justify-between text-xs text-zinc-500">
          <span>Asset yang dipasang akan muncul sebagai layer baru di timeline video</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1c1e28] text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};
