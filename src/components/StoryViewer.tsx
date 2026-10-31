'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MediaItem, formatTime } from '@/lib/types';
import { 
  X, Volume2, VolumeX, Play, Pause, ChevronLeft, ChevronRight, 
  Music, MapPin, Heart, Sliders, Disc3, Monitor
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
  const [showMixer, setShowMixer] = useState(false);
  const [videoVol, setVideoVol] = useState(1.0);
  const [musicVol, setMusicVol] = useState(0.85);
  const [mediaErrors, setMediaErrors] = useState<Record<string, boolean>>({});

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentItem = items[currentIndex];

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setProgress(0);
      setIsPaused(false);
    }
  }, [isOpen, initialIndex]);

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

        if (pct >= 100) {
          clearInterval(progressIntervalRef.current!);
          handleNext();
        }
      }, intervalStep);
    }

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, isOpen, isPaused, currentItem, handleNext, musicVol, videoVol, isMuted]);

  const togglePlayPause = () => {
    setIsPaused((prev) => {
      const nextState = !prev;
      if (audioRef.current) {
        if (nextState) audioRef.current.pause();
        else audioRef.current.play().catch(() => {});
      }
      if (videoRef.current) {
        if (nextState) videoRef.current.pause();
        else videoRef.current.play().catch(() => {});
      }
      return nextState;
    });
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      const nextMuted = !prev;
      if (audioRef.current) audioRef.current.volume = nextMuted ? 0 : musicVol;
      if (videoRef.current) videoRef.current.volume = nextMuted ? 0 : videoVol;
      return nextMuted;
    });
  };

  if (!isOpen || !currentItem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-[3px] select-none font-mono">
      <audio ref={audioRef} loop />

      {/* Main 1999 Retro Window Container */}
      <div className="relative w-full max-w-lg retro-box-outset shadow-2xl flex flex-col overflow-hidden max-h-[94vh]">
        
        {/* Retro Title Bar */}
        <div className="retro-titlebar select-none">
          <div className="flex items-center gap-2 truncate">
            <Monitor className="w-3.5 h-3.5 text-white flex-shrink-0" />
            <span className="truncate">MemoryPlayer 1999 — [{currentItem.title}]</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={togglePlayPause} className="retro-win-ctrl font-bold" title="Play/Pause">
              {isPaused ? '▶' : '⏸'}
            </button>
            <button onClick={onClose} className="retro-win-ctrl font-bold" title="Close">
              ✕
            </button>
          </div>
        </div>

        {/* Top 1999 Segmented Progress Bars (Instagram Stories Retro Style) */}
        <div className="p-2 bg-[#dfdbed] border-b border-[#a09bb8] flex gap-1">
          {items.map((item, idx) => {
            let fillWidth = '0%';
            if (idx < currentIndex) fillWidth = '100%';
            else if (idx === currentIndex) fillWidth = `${progress}%`;

            return (
              <div
                key={item.id}
                className="h-2 flex-1 retro-box-inset bg-neutral-900 overflow-hidden cursor-pointer"
                onClick={() => {
                  setCurrentIndex(idx);
                  setProgress(0);
                }}
              >
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-rose-400"
                  style={{ width: fillWidth }}
                />
              </div>
            );
          })}
        </div>

        {/* Media Canvas Viewport */}
        <div className="relative aspect-[4/5] bg-black retro-box-inset m-1 flex items-center justify-center overflow-hidden">
          {mediaErrors[currentItem.id] ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#2d2642] p-8 text-center text-white">
              <Disc3 className="w-12 h-12 text-amber-400 animate-spin mb-3" />
              <h4 className="text-sm font-bold">{currentItem.title}</h4>
              <p className="text-[11px] text-neutral-300 mt-1">Soundtrack playing in background</p>
            </div>
          ) : currentItem.type === 'video' ? (
            <video
              ref={videoRef}
              src={currentItem.url}
              playsInline
              loop
              className="w-full h-full object-contain"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentItem.url}
              alt={currentItem.title}
              onError={() => setMediaErrors((prev) => ({ ...prev, [currentItem.id]: true }))}
              className="w-full h-full object-contain transition-transform duration-500 ease-out"
            />
          )}

          {/* Navigation Click Tap Areas */}
          <div
            className="absolute top-0 bottom-0 left-0 w-1/3 z-20 cursor-pointer"
            onClick={handlePrev}
            title="Previous (Left Arrow)"
          />
          <div
            className="absolute top-0 bottom-0 right-0 w-1/3 z-20 cursor-pointer"
            onClick={handleNext}
            title="Next (Right Arrow / Space)"
          />

          {/* Paused Overlay */}
          {isPaused && (
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none bg-black/40">
              <div className="px-4 py-2 retro-box-outset bg-[#dfdbed] text-[#1a162b] font-bold text-xs flex items-center gap-2 shadow-2xl">
                <span>PAUSED</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Vintage Audio Deck & Track Information */}
        <div className="p-2.5 bg-[#dfdbed] border-t border-white space-y-2">
          
          {/* LCD Digital Track Readout */}
          <div className="retro-box-inset p-1.5 bg-[#1b1926] text-amber-400 text-[11px] font-mono flex items-center justify-between">
            <div className="flex items-center gap-2 truncate pr-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <span className="truncate">
                {currentItem.audioTrack ? (
                  `♪ ${currentItem.audioTrack.title} — ${currentItem.audioTrack.artist}`
                ) : (
                  'No soundtrack attached'
                )}
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 flex-shrink-0">
              [{currentIndex + 1}/{items.length}]
            </span>
          </div>

          {/* Controls Deck: Spinning CD + Buttons + Volume Mixer */}
          <div className="flex items-center justify-between gap-2">
            
            {/* Spinning CD-ROM Badge */}
            <div className="flex items-center gap-2 min-w-0 pr-1">
              <div
                className={`w-8 h-8 rounded-full overflow-hidden border-2 border-neutral-700 shadow-md flex-shrink-0 bg-black ${
                  !isPaused ? 'animate-spin' : ''
                }`}
                style={{ animationDuration: '4s' }}
              >
                {currentItem.audioTrack?.artworkUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentItem.audioTrack.artworkUrl}
                    alt="Album Cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-amber-400 text-[8px] font-bold">
                    CD
                  </div>
                )}
              </div>
              <div className="truncate text-[10px]">
                <span className="font-bold text-[#1a162b] truncate block leading-tight">
                  {currentItem.title}
                </span>
                <span className="text-neutral-600 truncate block">
                  {currentItem.takenAt} {currentItem.location ? `• ${currentItem.location}` : ''}
                </span>
              </div>
            </div>

            {/* Retro Action Buttons */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="retro-btn px-2 disabled:opacity-40"
                title="Previous"
              >
                ⏮
              </button>

              <button
                onClick={togglePlayPause}
                className="retro-btn px-2.5 font-bold"
                title={isPaused ? 'Play' : 'Pause'}
              >
                {isPaused ? '▶' : '⏸'}
              </button>

              <button
                onClick={handleNext}
                className="retro-btn px-2"
                title="Next"
              >
                ⏭
              </button>

              <button
                onClick={toggleMute}
                className="retro-btn px-1.5"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-600" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => onToggleFavorite && onToggleFavorite(currentItem.id)}
                className="retro-btn px-1.5"
                title="Favorite"
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    currentItem.isFavorite ? 'fill-rose-600 text-rose-600' : 'text-neutral-600'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
