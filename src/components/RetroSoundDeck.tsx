'use client';

import React, { useState } from 'react';
import { 
  Play, Pause, Heart, Disc, Volume2, VolumeX, Shuffle, RotateCcw, 
  ChevronDown, FastForward, Rewind, SkipBack, SkipForward, Disc3 
} from 'lucide-react';
import { formatTime } from '@/lib/types';

interface RetroSoundDeckProps {
  trackTitle?: string;
  artistName?: string;
  artworkUrl?: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTime?: number;
  duration?: number;
  volume?: number;
  onVolumeChange?: (vol: number) => void;
  onSeek?: (time: number) => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  className?: string;
}

export default function RetroSoundDeck({
  trackTitle = 'Smokin Out The Window',
  artistName = 'Silk Sonic',
  artworkUrl = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80',
  isPlaying = false,
  onTogglePlay,
  currentTime = 93, // 1:33 default
  duration = 205, // 3:25 default
  volume = 0.85,
  onVolumeChange,
  onSeek,
  isFavorite = false,
  onToggleFavorite,
  className = '',
}: RetroSoundDeckProps) {
  const [isShuffled, setIsShuffled] = useState(false);
  const [isLooping, setIsLooping] = useState(true);

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <div className={`winamp-deck-bg p-2 rounded-sm font-mono text-xs select-none max-w-sm w-full ${className}`}>
      
      {/* 1. Green Titlebar matching Image 1 ("Song") */}
      <div className="winamp-header-green px-2 py-0.5 flex items-center justify-between mb-2 rounded-t-xs">
        <span className="font-bold tracking-wider text-[11px]">Song</span>
        <div className="flex items-center gap-1">
          <span className="text-[9px] opacity-80">STEREO</span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
        </div>
      </div>

      {/* 2. Main Middle Deck: Left Art + Right Retro Controls */}
      <div className="flex gap-2.5 items-start mb-2">
        
        {/* Left: 3D Inset Album Art Frame */}
        <div className="w-28 h-28 flex-shrink-0 retro-box-inset p-1 bg-[#2b253b] relative overflow-hidden group shadow-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={artworkUrl}
            alt={trackTitle}
            className="w-full h-full object-cover rounded-xs"
          />
          {/* Subtle vinyl groove reflection overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/20 pointer-events-none" />
        </div>

        {/* Right: Tactile Gadget Controls */}
        <div className="flex-1 flex flex-col justify-between h-28">
          
          {/* Top Row: Spinning Mini CD + Cassette Player Deck + Vertical Volume Slider */}
          <div className="flex items-center justify-between gap-1.5">
            
            {/* Spinning Mini-Disc (Inspired by Image 1) */}
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full bg-gradient-to-tr from-amber-100 via-neutral-200 to-amber-200 border border-neutral-400 p-0.5 shadow-sm flex items-center justify-center ${isPlaying ? 'spinning-disc' : 'paused-disc'}`}>
                <div className="w-7 h-7 rounded-full bg-neutral-100 border border-neutral-300 flex items-center justify-center relative">
                  <div className="w-2.5 h-2.5 rounded-full bg-neutral-400 border border-neutral-600" />
                  <div className="absolute inset-0 rounded-full border border-dashed border-amber-400/40" />
                </div>
              </div>
            </div>

            {/* Mini Tape Deck / VCR Gadget (Image 1 aesthetic) */}
            <div className="retro-box-inset px-1.5 py-1 bg-[#ded8ea] flex flex-col items-center justify-center w-16">
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
                onClick={() => onVolumeChange && onVolumeChange(Math.min(1, volume + 0.1))}
                className="retro-win-ctrl text-[8px] font-bold w-4 h-3.5"
                title="Volume Up"
              >
                +
              </button>
              <div className="h-9 w-2.5 retro-box-inset bg-[#302b3f] relative p-0.5 overflow-hidden">
                <div 
                  className="w-full bg-gradient-to-t from-emerald-500 via-amber-400 to-rose-500 absolute bottom-0 left-0 transition-all"
                  style={{ height: `${volume * 100}%` }}
                />
              </div>
              <button 
                onClick={() => onVolumeChange && onVolumeChange(Math.max(0, volume - 0.1))}
                className="retro-win-ctrl text-[8px] font-bold w-4 h-3.5"
                title="Volume Down"
              >
                -
              </button>
            </div>
          </div>

          {/* Middle Row: Playback Buttons matching Image 1 */}
          <div className="grid grid-cols-4 gap-1 mt-1">
            {/* Play / Pause Big Button */}
            <button
              onClick={onTogglePlay}
              className={`col-span-2 retro-btn py-1 font-bold flex items-center justify-center text-xs ${
                isPlaying ? 'bg-[#c5bee6]' : 'bg-[#dfdbed]'
              }`}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-black" /> : <Play className="w-3.5 h-3.5 fill-black" />}
            </button>

            {/* Shuffle */}
            <button
              onClick={() => setIsShuffled(!isShuffled)}
              className={`retro-btn py-1 ${isShuffled ? 'bg-amber-200' : ''}`}
              title="Shuffle"
            >
              <Shuffle className="w-3 h-3 text-neutral-800" />
            </button>

            {/* Repeat / Loop */}
            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`retro-btn py-1 ${isLooping ? 'bg-emerald-200' : ''}`}
              title="Repeat"
            >
              <RotateCcw className="w-3 h-3 text-neutral-800" />
            </button>
          </div>

          {/* Lower Nav Buttons */}
          <div className="flex items-center justify-between gap-0.5 mt-1">
            <button className="retro-btn p-1 flex-1" title="Skip Back">
              <SkipBack className="w-2.5 h-2.5 text-neutral-800" />
            </button>
            <button className="retro-btn p-1 flex-1" title="Rewind">
              <Rewind className="w-2.5 h-2.5 text-neutral-800" />
            </button>
            <button className="retro-btn p-1 flex-1" title="Fast Forward">
              <FastForward className="w-2.5 h-2.5 text-neutral-800" />
            </button>
            <button className="retro-btn p-1 flex-1" title="Skip Forward">
              <SkipForward className="w-2.5 h-2.5 text-neutral-800" />
            </button>
            {onToggleFavorite && (
              <button 
                onClick={onToggleFavorite} 
                className="retro-btn p-1 flex-1"
                title="Favorite Song"
              >
                <Heart className={`w-2.5 h-2.5 ${isFavorite ? 'fill-rose-600 text-rose-600' : 'text-neutral-700'}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Bottom Text Readouts matching Image 1 */}
      <div className="space-y-1 pt-1 border-t border-[#a7a0b8]">
        
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

        {/* Scrubber Bar matching Image 1 */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[10px] font-mono text-neutral-700 w-7 flex-shrink-0 text-right">
            {formatTime(currentTime)}
          </span>

          <div 
            onClick={(e) => {
              if (!onSeek || duration <= 0) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const pct = Math.max(0, Math.min(1, clickX / rect.width));
              onSeek(pct * duration);
            }}
            className="flex-1 h-3.5 retro-box-inset bg-[#e5e0f0] relative cursor-pointer overflow-hidden p-0.5"
          >
            {/* Retro Beveled Thumb Slider */}
            <div 
              className="h-full bg-[#5a4897] relative transition-all"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-2.5 retro-box-outset bg-[#dfdbed]" />
            </div>
          </div>

          <span className="text-[10px] font-mono text-neutral-700 w-7 flex-shrink-0">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}
