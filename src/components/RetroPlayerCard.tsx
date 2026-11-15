'use client';

import React, { useState, useRef } from 'react';
import { MediaItem } from '@/lib/types';
import { 
  Play, Pause, Heart, Shuffle, RotateCcw, 
  ChevronDown, FastForward, Rewind, SkipBack, SkipForward, 
  Disc3, Copy, Trash2, Maximize2, Volume2, VolumeX, Check
} from 'lucide-react';
import { formatTime } from '@/lib/types';

interface RetroPlayerCardProps {
  item: MediaItem;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onOpenStory?: () => void;
  onToggleFavorite?: (id: string) => void;
  onCopyItem?: (id: string) => void;
  onDeleteItem?: (id: string) => void;
  className?: string;
}

export default function RetroPlayerCard({
  item,
  isSelected = false,
  onToggleSelect,
  onOpenStory,
  onToggleFavorite,
  onCopyItem,
  onDeleteItem,
  className = '',
}: RetroPlayerCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [isShuffled, setIsShuffled] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const trackTitle = item.audioTrack?.title || item.title || 'Untitled Memory';
  const artistName = item.audioTrack?.artist || 'MemoryVault';
  const artworkUrl = item.thumbnailUrl || item.url;

  const toggleVideoPlayback = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) {
      if (onOpenStory) onOpenStory();
      return;
    }
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  return (
    <div 
      className={`winamp-deck-bg p-2.5 rounded-sm font-mono text-xs select-none w-full max-w-sm shadow-[0_8px_20px_rgba(0,0,0,0.25)] border border-[#a49bb8] transition-all duration-150 hover:shadow-[0_12px_28px_rgba(0,0,0,0.35)] relative ${
        isSelected ? 'ring-3 ring-[#5a4897] bg-[#cec8e3]' : ''
      } ${className}`}
    >
      {/* 1. Green Header Titlebar matching the reference image ("Song" + STEREO indicator) */}
      <div className="winamp-header-green px-2 py-1 flex items-center justify-between mb-2 rounded-t-xs shadow-xs">
        <div className="flex items-center gap-2">
          {/* Select Checkbox */}
          {onToggleSelect && (
            <label 
              className="flex items-center gap-1 cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect(item.id)}
                className="w-3.5 h-3.5 cursor-pointer accent-[#5a4897]"
              />
            </label>
          )}
          <span className="font-bold tracking-wider text-[11px] text-white">Song</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-white/90 font-bold tracking-tighter">STEREO</span>
            <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-300 animate-ping' : 'bg-emerald-400'}`} />
          </div>

          {/* Quick Open Maximize Button */}
          {onOpenStory && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenStory();
              }}
              className="text-white/80 hover:text-white p-0.5"
              title="Open full player"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Middle Deck: Left Inset Art Frame + Right Tactile Controls */}
      <div className="flex gap-2.5 items-start mb-2">
        
        {/* Left: 3D Inset Media Frame (Click to open story player!) */}
        <div 
          onClick={() => onOpenStory && onOpenStory()}
          className="w-28 h-28 flex-shrink-0 retro-box-inset p-1 bg-[#1a1426] relative overflow-hidden group shadow-inner cursor-pointer"
          title="Click to Open Memory in Player"
        >
          {item.type === 'video' ? (
            <video
              ref={videoRef}
              src={item.url}
              className="w-full h-full object-cover rounded-xs"
              loop
              playsInline
              muted
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={artworkUrl}
              alt={trackTitle}
              className="w-full h-full object-cover rounded-xs transition-transform duration-300 group-hover:scale-105"
            />
          )}

          {/* Subtle vinyl reflection overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/20 pointer-events-none" />

          {/* Center Play Overlay on Hover */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/45 transition">
            <div className="w-9 h-9 rounded-full bg-white/90 border border-black/50 flex items-center justify-center shadow-lg transition transform group-hover:scale-110">
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-black text-black" />
              ) : (
                <Play className="w-4 h-4 fill-black text-black translate-x-0.5" />
              )}
            </div>
          </div>

          {/* Badge: Video / Photo */}
          <span className="absolute top-1 left-1 px-1 py-0.2 bg-black/80 text-white font-mono text-[8px] rounded-xs border border-white/20">
            {item.type === 'video' ? 'VIDEO' : 'PHOTO'}
          </span>
        </div>

        {/* Right: Tactile Gadget Controls matching reference player */}
        <div className="flex-1 flex flex-col justify-between h-28">
          
          {/* Top Row: Mini Spinning CD + Cassette Player Deck + Vertical Volume Slider */}
          <div className="flex items-center justify-between gap-1">
            
            {/* Spinning Mini-Disc (animated rotation when playing) */}
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full bg-gradient-to-tr from-amber-100 via-neutral-200 to-amber-200 border border-neutral-400 p-0.5 shadow-sm flex items-center justify-center ${isPlaying ? 'spinning-disc' : 'paused-disc'}`}>
                <div className="w-7 h-7 rounded-full bg-neutral-100 border border-neutral-300 flex items-center justify-center relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-400 border border-neutral-600" />
                  <div className="absolute inset-0 rounded-full border border-dashed border-amber-400/40" />
                </div>
              </div>
            </div>

            {/* Mini Tape Deck Gadget with LED lights */}
            <div className="retro-box-inset px-1.5 py-1 bg-[#ded8ea] flex flex-col items-center justify-center w-14 sm:w-16">
              <div className="w-full h-1 bg-[#1a1426] mb-1 rounded-xs" />
              <div className="flex items-center gap-0.5 justify-center">
                <span className={`w-1 h-1 rounded-full ${isPlaying ? 'bg-rose-600 animate-ping' : 'bg-neutral-500'}`} />
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                <span className="w-1 h-1 rounded-full bg-amber-400" />
                <span className="text-[7px] text-neutral-600 font-bold ml-0.5">TAPE</span>
              </div>
            </div>

            {/* Vertical Volume Fader with + / - buttons */}
            <div className="flex flex-col items-center gap-0.5">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setVolume(Math.min(1, volume + 0.1));
                }}
                className="retro-win-ctrl text-[8px] font-bold w-4 h-3.5"
                title="Volume Up"
              >
                +
              </button>
              <div className="h-8 w-2.5 retro-box-inset bg-[#302b3f] relative p-0.5 overflow-hidden">
                <div 
                  className="w-full bg-gradient-to-t from-emerald-500 via-amber-400 to-rose-500 absolute bottom-0 left-0 transition-all"
                  style={{ height: `${volume * 100}%` }}
                />
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setVolume(Math.max(0, volume - 0.1));
                }}
                className="retro-win-ctrl text-[8px] font-bold w-4 h-3.5"
                title="Volume Down"
              >
                -
              </button>
            </div>
          </div>

          {/* Middle Row: Playback Buttons matching reference player */}
          <div className="grid grid-cols-4 gap-1 mt-1">
            {/* Play / Pause Big Button */}
            <button
              onClick={toggleVideoPlayback}
              className={`col-span-2 retro-btn py-1 font-bold flex items-center justify-center text-xs ${
                isPlaying ? 'bg-[#c5bee6]' : 'bg-[#dfdbed]'
              }`}
              title={isPlaying ? 'Pause' : 'Play in place'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-black" /> : <Play className="w-3.5 h-3.5 fill-black" />}
            </button>

            {/* Shuffle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsShuffled(!isShuffled);
              }}
              className={`retro-btn py-1 ${isShuffled ? 'bg-amber-200' : ''}`}
              title="Shuffle"
            >
              <Shuffle className="w-3 h-3 text-neutral-800" />
            </button>

            {/* Repeat / Loop */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsLooping(!isLooping);
              }}
              className={`retro-btn py-1 ${isLooping ? 'bg-emerald-200' : ''}`}
              title="Repeat"
            >
              <RotateCcw className="w-3 h-3 text-neutral-800" />
            </button>
          </div>

          {/* Lower Nav Buttons: Rewind, Fast Forward, Favorite, Copy, Delete */}
          <div className="flex items-center justify-between gap-0.5 mt-1">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenStory) onOpenStory();
              }}
              className="retro-btn p-1 flex-1" 
              title="Open Story"
            >
              <SkipBack className="w-2.5 h-2.5 text-neutral-800" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenStory) onOpenStory();
              }}
              className="retro-btn p-1 flex-1" 
              title="Fast Forward"
            >
              <SkipForward className="w-2.5 h-2.5 text-neutral-800" />
            </button>

            {onToggleFavorite && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(item.id);
                }} 
                className="retro-btn p-1 flex-1"
                title="Favorite Memory"
              >
                <Heart className={`w-2.5 h-2.5 ${item.isFavorite ? 'fill-rose-600 text-rose-600' : 'text-neutral-700'}`} />
              </button>
            )}

            {onCopyItem && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onCopyItem(item.id);
                }} 
                className="retro-btn p-1 flex-1"
                title="Copy to Album..."
              >
                <Copy className="w-2.5 h-2.5 text-[#5a4897]" />
              </button>
            )}

            {onDeleteItem && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteItem(item.id);
                }} 
                className="retro-btn p-1 flex-1 text-neutral-500 hover:text-rose-700 hover:bg-rose-100"
                title="Delete from Vault"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Bottom Text Readouts matching reference player */}
      <div 
        onClick={() => onOpenStory && onOpenStory()}
        className="space-y-1 pt-1 border-t border-[#a7a0b8] cursor-pointer"
        title="Click to Open Memory in Player"
      >
        {/* Artist Field */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-neutral-700 font-bold w-11 flex-shrink-0">Artist:</span>
          <div className="flex-1 retro-box-inset px-2 py-0.5 bg-white text-black text-[11px] font-mono flex items-center justify-between truncate shadow-inner">
            <span className="truncate">{artistName}</span>
            <ChevronDown className="w-3 h-3 text-neutral-400 flex-shrink-0" />
          </div>
        </div>

        {/* Title Field */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-neutral-700 font-bold w-11 flex-shrink-0">Title:</span>
          <div className="flex-1 retro-box-inset px-2 py-0.5 bg-white text-black text-[11px] font-mono flex items-center justify-between truncate shadow-inner">
            <span className="truncate">{trackTitle}</span>
            <ChevronDown className="w-3 h-3 text-neutral-400 flex-shrink-0" />
          </div>
        </div>

        {/* Scrubber Bar matching reference image with timestamps */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[10px] font-mono text-neutral-700 w-7 flex-shrink-0 text-right">
            1:43
          </span>

          <div className="flex-1 h-3.5 retro-box-inset bg-[#e5e0f0] relative overflow-hidden p-0.5">
            <div 
              className="h-full bg-[#5a4897] relative transition-all"
              style={{ width: `48%` }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-2.5 retro-box-outset bg-[#dfdbed]" />
            </div>
          </div>

          <span className="text-[10px] font-mono text-neutral-700 w-7 flex-shrink-0">
            3:25
          </span>
        </div>
      </div>
    </div>
  );
}