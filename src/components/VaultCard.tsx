'use client';

import React, { useState, useRef } from 'react';
import { MediaItem } from '@/lib/types';
import { 
  Play, Pause, Sparkles, Music, MapPin, Calendar, Heart, 
  Maximize2, Volume2, VolumeX, Shield, Award, Disc3,
  Copy, Trash2, CheckSquare
} from 'lucide-react';

interface VaultCardProps {
  item: MediaItem;
  onOpenStory?: () => void;
  onToggleFavorite?: (id: string) => void;
  onToggleSelect?: (id: string) => void;
  isSelected?: boolean;
  onCopyItem?: (id: string) => void;
  onDeleteItem?: (id: string) => void;
  className?: string;
  rarity?: 'trap-magenta' | 'gold-rare' | 'cyber-platinum';
  showSoundDeck?: boolean;
}

export default function VaultCard({
  item,
  onOpenStory,
  onToggleFavorite,
  onToggleSelect,
  isSelected = false,
  onCopyItem,
  onDeleteItem,
  className = '',
  rarity = 'trap-magenta',
}: VaultCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // 3D Card tilt effect on mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    setRotateX(((y - centerY) / centerY) * -5);
    setRotateY(((x - centerX) / centerX) * 5);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  const toggleVideoPlayback = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  // Determine frame style based on cardStyle or rarity prop
  const activeRarity = item.cardStyle?.rarity || rarity;
  const frameClass = activeRarity === 'gold-rare' 
    ? 'card-frame-gold' 
    : activeRarity === 'cyber-platinum' 
      ? 'card-frame-cyber' 
      : 'card-frame-magenta';

  return (
    <div 
      className={`card-perspective inline-block select-none max-w-full ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main Collectible Card Frame (Image 2 TCG Style - 100% Original Copyright-Safe) */}
      <div 
        className={`${frameClass} relative w-full max-w-[320px] sm:max-w-[340px] mx-auto rounded-xl p-3 text-neutral-900 transition-transform duration-150 ease-out shadow-2xl ${
          isSelected ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-purple-900 scale-[1.02]' : ''
        }`}
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Holographic Sheen Layer on hover */}
        {isHovered && <div className="holo-overlay absolute inset-0 rounded-xl z-20 pointer-events-none" />}

        {/* Checkbox Select Pill on Card Top */}
        {onToggleSelect && (
          <div 
            className="absolute -top-3 left-3 z-30 flex items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <label 
              className={`flex items-center gap-1.5 cursor-pointer px-2 py-0.5 rounded shadow-md border text-[10px] font-bold select-none transition ${
                isSelected 
                  ? 'bg-amber-400 text-black border-amber-500 font-black' 
                  : 'bg-white/95 text-neutral-800 border-black/30 hover:bg-white'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(item.id)}
                className="w-3.5 h-3.5 cursor-pointer accent-[#5a4897]"
              />
              <span>{isSelected ? '✓ Selected' : 'Select Card'}</span>
            </label>
          </div>
        )}

        {/* 1. Top Card Title Banner */}
        <div className="card-banner-inset px-2.5 py-1 rounded-sm flex items-center justify-between mb-2 select-none">
          <span className="font-serif font-black text-xs text-[#2b101f] tracking-wide truncate max-w-[190px]">
            {item.title}
          </span>

          {/* Top-Right Mood / Type Attribute Gem */}
          <div className="flex items-center gap-1 bg-[#47122b] text-white px-1.5 py-0.5 rounded-full border border-amber-300 shadow-sm flex-shrink-0">
            <span className="text-[9px] font-bold tracking-tighter">
              {item.type === 'video' ? 'STORY' : 'SNAP'}
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          </div>
        </div>

        {/* 2. Card Category Subtitle */}
        <div className="flex items-center justify-between text-right px-1 mb-1.5 font-serif font-bold text-[11px] text-[#f7e4f1] tracking-wider drop-shadow-sm select-none">
          <span className="text-[9px] uppercase tracking-widest text-amber-200 opacity-90">
            Vault Series • 1st Ed.
          </span>
          <span>
            [ {item.type === 'video' ? 'Story Card' : 'Memory Card'} ]
          </span>
        </div>

        {/* 3. Center Media Frame ("Artwork" frame of the card) */}
        <div className="relative aspect-[4/5] rounded-xs border-3 border-[#2b0e1e] bg-black overflow-hidden shadow-2xl mb-2 group">
          {item.type === 'video' ? (
            <video
              ref={videoRef}
              src={item.url}
              className="w-full h-full object-cover"
              loop
              playsInline
              muted={isMuted}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.thumbnailUrl || item.url}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}

          {/* Video In-Place Play/Pause Button (Does NOT open the modal automatically) */}
          {item.type === 'video' && (
            <button
              onClick={toggleVideoPlayback}
              className="absolute inset-0 flex items-center justify-center bg-black/15 group-hover:bg-black/35 transition"
              title={isPlaying ? "Pause Video Preview" : "Play Video Preview"}
            >
              <div className="w-11 h-11 rounded-full bg-white/90 border-2 border-black/50 flex items-center justify-center shadow-2xl transition transform group-hover:scale-110">
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-black text-black" />
                ) : (
                  <Play className="w-4 h-4 fill-black text-black translate-x-0.5" />
                )}
              </div>
            </button>
          )}

          {/* Top In-Frame Media Pill */}
          <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 pointer-events-none">
            <span className="px-1.5 py-0.5 rounded-xs bg-black/80 text-white font-mono text-[9px] border border-white/20">
              {item.type === 'video' ? '🎬 VIDEO' : '📸 PHOTO'}
            </span>
          </div>

          {/* Bottom Audio Pill in Media Frame */}
          {item.audioTrack && (
            <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-black/85 text-white font-mono text-[9px] border border-white/20 truncate max-w-[80%]">
                <Disc3 className="w-3 h-3 text-rose-400 animate-spin flex-shrink-0" />
                <span className="truncate">{item.audioTrack.title} • {item.audioTrack.artist}</span>
              </div>

              {item.type === 'video' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMuted(!isMuted);
                  }}
                  className="p-1 rounded bg-black/80 text-white hover:bg-black"
                >
                  {isMuted ? <VolumeX className="w-3 h-3 text-rose-400" /> : <Volume2 className="w-3 h-3" />}
                </button>
              )}
            </div>
          )}

          {/* Explicit Expand to Stereo Player Icon in Top Right */}
          {onOpenStory && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenStory();
              }}
              className="absolute top-2 right-2 p-1.5 rounded-sm bg-black/75 text-white hover:bg-black border border-white/20 shadow z-20"
              title="Open in Stereo Player"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 4. Bottom Lore / Effect Box (Inspired by Image 2 Lore Box) */}
        <div className="card-lore-box p-2.5 rounded-sm text-neutral-900 font-serif relative">
          
          {/* Metadata Row: Date & Location */}
          <div className="flex items-center justify-between text-[10px] font-sans font-bold text-[#451730] border-b border-[#cca7c2] pb-1 mb-1.5">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#6e224c]" />
              {item.takenAt}
            </span>
            {item.location && (
              <span className="flex items-center gap-1 truncate max-w-[120px]">
                <MapPin className="w-3 h-3 text-[#6e224c]" />
                {item.location}
              </span>
            )}
          </div>

          {/* Lore / Story Text */}
          <p className="text-[11px] leading-relaxed italic text-[#260e1d] mb-2 font-serif line-clamp-2">
            &quot;{item.caption || item.title || 'A timeless memory captured and preserved forever in the private vault.'}&quot;
          </p>

          {/* Attached Soundtrack Badge */}
          {item.audioTrack && (
            <div className="flex items-center justify-between bg-white/70 px-2 py-1 rounded-xs border border-[#a87498] text-[10px] font-mono mb-2">
              <span className="text-[#3b1229] font-bold truncate">
                ♫ {item.audioTrack.title}
              </span>
              <span className="text-neutral-500 text-[9px]">
                {item.audioTrack.artist}
              </span>
            </div>
          )}

          {/* Explicit Action Button: User must click this intentionally to open the stereo player */}
          {onOpenStory && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenStory();
              }}
              className="w-full py-1.5 px-3 bg-[#5a4897] hover:bg-[#453675] text-white font-bold text-xs rounded-xs shadow flex items-center justify-center gap-1.5 mb-2 transition transform active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Open in Stereo Player</span>
            </button>
          )}

          {/* Action Row inside lore box */}
          <div className="flex items-center justify-between pt-1 border-t border-[#cca7c2]/60 text-[10px] font-mono">
            <span className="text-[#6e224c] font-bold">
              #{item.id.slice(-4).toUpperCase()}
            </span>

            <div className="flex items-center gap-1">
              {onCopyItem && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyItem(item.id);
                  }}
                  className="p-1 hover:bg-[#cca7c2]/50 rounded text-[#451730]"
                  title="Copy card to album..."
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              )}

              {onToggleFavorite && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(item.id);
                  }}
                  className="p-1 text-[#6e224c] hover:scale-110 transition"
                  title="Favorite Card"
                >
                  <Heart className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-rose-600 text-rose-600' : ''}`} />
                </button>
              )}

              {onDeleteItem && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteItem(item.id);
                  }}
                  className="p-1 text-neutral-500 hover:text-rose-700 hover:bg-rose-100 rounded"
                  title="Delete Card"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 5. Card Footer: Serial Code & Hologram Foil Stamp */}
        <div className="flex items-center justify-between px-1 pt-1.5 text-[9px] font-mono text-[#fcd8ef]">
          <span className="tracking-wider">
            VAULT CARD • 100% PRIVATE
          </span>

          {/* Hologram Square Foil Stamp */}
          <div 
            className="w-3.5 h-3.5 rounded-2xs bg-gradient-to-tr from-amber-300 via-yellow-100 to-amber-500 border border-amber-600 shadow-sm flex items-center justify-center text-[7px] font-bold text-black"
            title="Authentic MemoryVault Card"
          >
            ★
          </div>
        </div>

      </div>
    </div>
  );
}