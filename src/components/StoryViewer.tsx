'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MediaItem, formatTime } from '@/lib/types';
import { 
  X, Volume2, VolumeX, Play, Pause, ChevronLeft, ChevronRight, 
  Music, MapPin, Heart, Sliders, Disc3, Monitor, Shuffle, RotateCcw,
  SkipBack, SkipForward, FastForward, Rewind, ChevronDown
} from 'lucide-react';

interface StoryViewerProps {
  items: MediaItem[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onToggleFavorite?: (id: string) => void;
}

export default function StoryViewer({
  items,
  initialIndex = 0,
  isOpen,
  onClose,
  onToggleFavorite,
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100%
  const [videoVol, setVideoVol] = useState(1.0);
  const [musicVol, setMusicVol] = useState(0.85);
  const [mediaErrors, setMediaErrors] = useState<Record<string, boolean>>({});
  const [isShuffled, setIsShuffled] = useState(false);
  const [isLooping, setIsLooping] = useState(true);

  // Playback timer for scrubber display
  const [trackCurrentTime, setTrackCurrentTime] = useState(103); // 1:43
  const [trackDuration, setTrackDuration] = useState(205); // 3:25

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const safeIndex = Math.min(Math.max(0, currentIndex), Math.max(0, items.length - 1));
  const currentItem = items[safeIndex] || items[0];

  useEffect(() => {
    if (isOpen && items.length > 0) {
      const validInitial = Math.min(Math.max(0, initialIndex), items.length - 1);
      setCurrentIndex(validInitial);
      setProgress(0);
      setIsPaused(false);
    }
  }, [isOpen, initialIndex, items.length]);

  useEffect(() => {
    if (currentItem?.audioMix) {
      setVideoVol(currentItem.audioMix.videoVolume);
      setMusicVol(currentItem.audioMix.musicVolume);
    } else {
      setVideoVol(currentItem?.type === 'video' ? 1.0 : 0);
      setMusicVol(0.85);
    }
  }, [currentIndex, currentItem]);

  const handleNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, items.length, onClose]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMuted((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  // Audio & Video synchronization
  useEffect(() => {
    if (!isOpen || !currentItem) return;

    setProgress(0);

    const duration = currentItem.durationSeconds || 7;
    const intervalStep = 50;
    const totalSteps = (duration * 1000) / intervalStep;
    let stepCount = 0;

    // Background soundtrack initialization
    if (audioRef.current) {
      if (currentItem.audioTrack) {
        const audio = audioRef.current;
        const targetOffset = currentItem.audioTrack.startOffsetSeconds || 0;
        audio.volume = isMuted ? 0 : musicVol;

        const applySeekAndPlay = () => {
          try {
            const maxSafe = !isNaN(audio.duration) && audio.duration > 2
              ? Math.floor(audio.duration) - 2
              : 25;
            audio.currentTime = Math.max(0, Math.min(targetOffset, maxSafe));
            if (!isPaused) {
              audio.play().catch(() => {});
            }
          } catch {
            if (!isPaused) audio.play().catch(() => {});
          }
        };

        if (audio.src === currentItem.audioTrack.url && audio.readyState >= 1) {
          applySeekAndPlay();
        } else {
          audio.src = currentItem.audioTrack.url;
          audio.load();
          audio.onloadedmetadata = applySeekAndPlay;
        }
      } else {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    }

    // Video sound initialization
    if (videoRef.current && currentItem.type === 'video') {
      videoRef.current.currentTime = 0;
      videoRef.current.volume = isMuted ? 0 : videoVol;
      if (!isPaused) {
        videoRef.current.play().catch(() => {});
      }
    }

    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!isPaused) {
      progressIntervalRef.current = setInterval(() => {
        stepCount++;
        const pct = Math.min((stepCount / totalSteps) * 100, 100);
        setProgress(pct);

        if (audioRef.current && !isNaN(audioRef.current.currentTime)) {
          setTrackCurrentTime(Math.floor(audioRef.current.currentTime));
          if (!isNaN(audioRef.current.duration) && audioRef.current.duration > 0) {
            setTrackDuration(Math.floor(audioRef.current.duration));
          }
        } else {
          setTrackCurrentTime((prev) => (prev >= 205 ? 0 : prev + 1));
        }

        if (stepCount >= totalSteps) {
          clearInterval(progressIntervalRef.current!);
          handleNext();
        }
      }, intervalStep);
    }

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, isPaused, isOpen, currentItem, handleNext, musicVol, videoVol, isMuted]);

  // Handle pause/resume
  const togglePlayPause = () => {
    setIsPaused((prev) => {
      const nextState = !prev;
      if (nextState) {
        if (audioRef.current) audioRef.current.pause();
        if (videoRef.current) videoRef.current.pause();
      } else {
        if (audioRef.current && currentItem?.audioTrack) audioRef.current.play().catch(() => {});
        if (videoRef.current) videoRef.current.play().catch(() => {});
      }
      return nextState;
    });
  };

  if (!isOpen || !currentItem) return null;

  const trackTitle = currentItem.audioTrack?.title || currentItem.title || 'Танцевать';
  const artistName = currentItem.audioTrack?.artist || 'Molchat Doma';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs select-none font-mono">
      <audio ref={audioRef} loop />

      {/* Main Retro Player Gadget (Exact Silk Sonic / Winamp Player Layout from user reference image) */}
      <div className="winamp-deck-bg p-3 sm:p-4 rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-2 border-[#b5accc] w-full max-w-lg flex flex-col select-none text-xs">
        
        {/* 1. Iconic Green Header matching Image ("Song" + STEREO indicator + Close ✕) */}
        <div className="winamp-header-green px-3 py-1 flex items-center justify-between mb-2 rounded-t-xs shadow-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-wider text-xs text-white">Song</span>
            <span className="text-[10px] text-emerald-100 font-mono">
              [Story {currentIndex + 1} of {items.length}]
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-white/90 font-bold tracking-tighter">STEREO</span>
              <div className={`w-1.5 h-1.5 rounded-full ${!isPaused ? 'bg-emerald-300 animate-ping' : 'bg-emerald-400'}`} />
            </div>

            <button 
              onClick={onClose} 
              className="retro-win-ctrl font-bold text-xs ml-1" 
              title="Close Player"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Story Progress: Segmented bars for small albums, continuous unified retro bar for large archives */}
        {items.length <= 15 ? (
          <div className="flex gap-1 mb-2 px-0.5">
            {items.map((item, idx) => {
              let fillWidth = '0%';
              if (idx < currentIndex) fillWidth = '100%';
              else if (idx === currentIndex) fillWidth = `${progress}%`;

              return (
                <div
                  key={item.id}
                  className="h-1.5 flex-1 retro-box-inset bg-neutral-900 overflow-hidden cursor-pointer"
                  onClick={() => {
                    setCurrentIndex(idx);
                    setProgress(0);
                  }}
                  title={`Jump to Story ${idx + 1}`}
                >
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-amber-300 transition-all duration-75"
                    style={{ width: fillWidth }}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mb-2 px-0.5">
            <div 
              className="h-2 w-full retro-box-inset bg-neutral-900 overflow-hidden relative cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const pct = Math.max(0, Math.min(1, clickX / rect.width));
                const targetIdx = Math.min(items.length - 1, Math.floor(pct * items.length));
                setCurrentIndex(targetIdx);
                setProgress(0);
              }}
              title="Click anywhere along progress bar to jump"
            >
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-amber-300 to-rose-400 transition-all duration-75"
                style={{ 
                  width: `${Math.min(100, Math.max(0, ((currentIndex + progress / 100) / items.length) * 100))}%` 
                }}
              />
            </div>
          </div>
        )}

        {/* 2. Main Middle Deck: Left 3D Inset Video Art + Right Tactile Controls */}
        <div className="flex gap-3 items-stretch mb-2.5">
          
          {/* Left: 3D Inset Video / Photo Viewport matching Image 1 Frame */}
          <div className="w-48 sm:w-56 aspect-[4/5] flex-shrink-0 retro-box-inset p-1 bg-[#1a1426] relative overflow-hidden group shadow-inner flex items-center justify-center">
            {mediaErrors[currentItem.id] ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#2d2642] p-4 text-center text-white">
                <Disc3 className="w-10 h-10 text-amber-400 animate-spin mb-2" />
                <h4 className="text-xs font-bold line-clamp-1">{currentItem.title}</h4>
                <p className="text-[9px] text-neutral-300 mt-1">Soundtrack playing</p>
              </div>
            ) : currentItem.type === 'video' ? (
              <video
                ref={videoRef}
                src={currentItem.url}
                playsInline
                loop
                className="w-full h-full object-cover rounded-xs"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentItem.url}
                alt={currentItem.title}
                onError={() => setMediaErrors((prev) => ({ ...prev, [currentItem.id]: true }))}
                className="w-full h-full object-cover rounded-xs"
              />
            )}

            {/* Subtle reflection overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-white/10 pointer-events-none" />

            {/* Story Tap Navigation Areas */}
            <div
              className="absolute top-0 bottom-0 left-0 w-1/3 z-20 cursor-pointer"
              onClick={handlePrev}
              title="Previous Story"
            />
            <div
              className="absolute top-0 bottom-0 right-0 w-1/3 z-20 cursor-pointer"
              onClick={handleNext}
              title="Next Story"
            />

            {/* Paused Overlay */}
            {isPaused && (
              <div 
                onClick={togglePlayPause}
                className="absolute inset-0 z-30 flex items-center justify-center bg-black/45 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-white/90 border-2 border-black flex items-center justify-center shadow-2xl">
                  <Play className="w-6 h-6 fill-black text-black translate-x-0.5" />
                </div>
              </div>
            )}
          </div>

          {/* Right: Tactile Gadget Controls matching reference player */}
          <div className="flex-1 flex flex-col justify-between">
            
            {/* Top Row: Spinning CD + Cassette Player Deck + Vertical Volume Slider */}
            <div className="flex items-center justify-between gap-1.5 pt-1">
              
              {/* Spinning Mini-Disc (animated spinning disc!) */}
              <div className="flex flex-col items-center">
                <div className={`w-11 h-11 rounded-full bg-gradient-to-tr from-amber-100 via-neutral-200 to-amber-200 border border-neutral-400 p-0.5 shadow-sm flex items-center justify-center ${!isPaused ? 'spinning-disc' : 'paused-disc'}`}>
                  <div className="w-9 h-9 rounded-full bg-neutral-100 border border-neutral-300 flex items-center justify-center relative">
                    <div className="w-3 h-3 rounded-full bg-neutral-400 border border-neutral-600" />
                    <div className="absolute inset-0 rounded-full border border-dashed border-amber-400/50" />
                  </div>
                </div>
              </div>

              {/* Mini Cassette Tape Deck Gadget with running lights */}
              <div className="retro-box-inset px-2 py-1.5 bg-[#ded8ea] flex flex-col items-center justify-center flex-1 max-w-[90px]">
                <div className="w-full h-1.5 bg-[#1a1426] mb-1.5 rounded-xs" />
                <div className="flex items-center gap-1 justify-center">
                  <span className={`w-1.5 h-1.5 rounded-full ${!isPaused ? 'bg-rose-600 animate-ping' : 'bg-neutral-500'}`} />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="text-[8px] text-neutral-600 font-bold ml-0.5">TAPE</span>
                </div>
              </div>

              {/* Vertical Volume Fader with + / - buttons */}
              <div className="flex flex-col items-center gap-0.5">
                <button 
                  onClick={() => setMusicVol((v) => Math.min(1, v + 0.1))}
                  className="retro-win-ctrl text-[9px] font-bold w-4 h-4"
                  title="Volume Up"
                >
                  +
                </button>
                <div className="h-10 w-3 retro-box-inset bg-[#302b3f] relative p-0.5 overflow-hidden">
                  <div 
                    className="w-full bg-gradient-to-t from-emerald-500 via-amber-400 to-rose-500 absolute bottom-0 left-0 transition-all"
                    style={{ height: `${(isMuted ? 0 : musicVol) * 100}%` }}
                  />
                </div>
                <button 
                  onClick={() => setMusicVol((v) => Math.max(0, v - 0.1))}
                  className="retro-win-ctrl text-[9px] font-bold w-4 h-4"
                  title="Volume Down"
                >
                  -
                </button>
              </div>
            </div>

            {/* Middle Row: Playback Buttons matching reference player */}
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {/* Play / Pause Big Button */}
              <button
                onClick={togglePlayPause}
                className={`col-span-2 retro-btn py-1.5 font-bold flex items-center justify-center text-xs shadow ${
                  !isPaused ? 'bg-[#c5bee6]' : 'bg-[#dfdbed]'
                }`}
                title={isPaused ? 'Play' : 'Pause'}
              >
                {!isPaused ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-black" />}
              </button>

              {/* Shuffle */}
              <button
                onClick={() => setIsShuffled(!isShuffled)}
                className={`retro-btn py-1.5 flex items-center justify-center ${isShuffled ? 'bg-amber-200' : ''}`}
                title="Shuffle"
              >
                <Shuffle className="w-3.5 h-3.5 text-neutral-800" />
              </button>

              {/* Repeat / Loop */}
              <button
                onClick={() => setIsLooping(!isLooping)}
                className={`retro-btn py-1.5 flex items-center justify-center ${isLooping ? 'bg-emerald-200' : ''}`}
                title="Repeat"
              >
                <RotateCcw className="w-3.5 h-3.5 text-neutral-800" />
              </button>
            </div>

            {/* Lower Nav Buttons: Prev Story, Rewind, Fast Forward, Next Story, Favorite */}
            <div className="flex items-center justify-between gap-1 mt-1.5">
              <button 
                onClick={handlePrev} 
                className="retro-btn p-1.5 flex-1 flex items-center justify-center" 
                title="Previous Story"
              >
                <SkipBack className="w-3 h-3 text-neutral-800" />
              </button>

              <button 
                onClick={() => {
                  if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
                }} 
                className="retro-btn p-1.5 flex-1 flex items-center justify-center" 
                title="Rewind 5s"
              >
                <Rewind className="w-3 h-3 text-neutral-800" />
              </button>

              <button 
                onClick={() => {
                  if (audioRef.current) audioRef.current.currentTime += 5;
                }} 
                className="retro-btn p-1.5 flex-1 flex items-center justify-center" 
                title="Fast Forward 5s"
              >
                <FastForward className="w-3 h-3 text-neutral-800" />
              </button>

              <button 
                onClick={handleNext} 
                className="retro-btn p-1.5 flex-1 flex items-center justify-center" 
                title="Next Story"
              >
                <SkipForward className="w-3 h-3 text-neutral-800" />
              </button>

              {onToggleFavorite && (
                <button 
                  onClick={() => onToggleFavorite(currentItem.id)} 
                  className="retro-btn p-1.5 flex-1 flex items-center justify-center"
                  title="Favorite Story"
                >
                  <Heart className={`w-3 h-3 ${currentItem.isFavorite ? 'fill-rose-600 text-rose-600' : 'text-neutral-700'}`} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3. Bottom Text Readouts matching reference player */}
        <div className="space-y-1.5 pt-1.5 border-t border-[#a7a0b8]">
          
          {/* Artist Field */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-neutral-700 font-bold w-12 flex-shrink-0">Artist:</span>
            <div className="flex-1 retro-box-inset px-2.5 py-1 bg-white text-black text-xs font-mono flex items-center justify-between truncate shadow-inner">
              <span className="truncate">{artistName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
            </div>
          </div>

          {/* Title Field */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-neutral-700 font-bold w-12 flex-shrink-0">Title:</span>
            <div className="flex-1 retro-box-inset px-2.5 py-1 bg-white text-black text-xs font-mono flex items-center justify-between truncate shadow-inner">
              <span className="truncate">{trackTitle}</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
            </div>
          </div>

          {/* Scrubber Bar matching reference image with timestamps (1:43 / 3:25) */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] font-mono text-neutral-700 w-8 flex-shrink-0 text-right">
              {formatTime(trackCurrentTime)}
            </span>

            <div 
              onClick={(e) => {
                if (!audioRef.current || isNaN(audioRef.current.duration)) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const pct = Math.max(0, Math.min(1, clickX / rect.width));
                audioRef.current.currentTime = pct * audioRef.current.duration;
              }}
              className="flex-1 h-4 retro-box-inset bg-[#e5e0f0] relative cursor-pointer overflow-hidden p-0.5"
            >
              {/* Retro Beveled Purple Thumb Slider */}
              <div 
                className="h-full bg-[#5a4897] relative transition-all"
                style={{ width: `${trackDuration > 0 ? (trackCurrentTime / trackDuration) * 100 : 0}%` }}
              >
                <div className="absolute right-0 top-0 bottom-0 w-3 retro-box-outset bg-[#dfdbed]" />
              </div>
            </div>

            <span className="text-[11px] font-mono text-neutral-700 w-8 flex-shrink-0">
              {formatTime(trackDuration)}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}