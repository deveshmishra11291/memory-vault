'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MediaItem } from '@/lib/types';
import { 
  X, Volume2, VolumeX, Play, Pause, ChevronLeft, ChevronRight, 
  Music, MapPin, Calendar, Heart, Sliders, Maximize2
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

  // Sync initial index
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setProgress(0);
      setIsPaused(false);
    }
  }, [isOpen, initialIndex]);

  // Update volume balances whenever current item changes
  useEffect(() => {
    if (currentItem?.audioMix) {
      setVideoVol(currentItem.audioMix.videoVolume);
      setMusicVol(currentItem.audioMix.musicVolume);
    } else {
      setVideoVol(currentItem?.type === 'video' ? 1.0 : 0);
      setMusicVol(0.85);
    }
  }, [currentIndex, currentItem]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose(); // Finished playlist
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

  // Audio & Video synchronization and story timer
  useEffect(() => {
    if (!isOpen || !currentItem) return;

    // Reset progress
    setProgress(0);

    const duration = currentItem.durationSeconds || 7; // default 7 seconds
    const intervalStep = 50; // update progress every 50ms
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

    // Clear previous timers
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

  // Pause / Resume playback
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

  // Mute / Unmute handler
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl transition-all">
      {/* Hidden audio element for paired soundtrack */}
      <audio ref={audioRef} loop />

      {/* Main Story Container (Instagram 9:16 or Responsive Aspect) */}
      <div className="relative h-full w-full max-w-lg md:max-h-[92vh] md:rounded-3xl overflow-hidden bg-neutral-900 shadow-2xl flex flex-col justify-between select-none">
        
        {/* Top Progress Bars (Instagram Stories Style) */}
        <div className="absolute top-0 left-0 right-0 z-30 p-3 pt-4 flex gap-1.5 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          {items.map((item, idx) => {
            let fillWidth = '0%';
            if (idx < currentIndex) fillWidth = '100%';
            else if (idx === currentIndex) fillWidth = `${progress}%`;

            return (
              <div
                key={item.id}
                className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden cursor-pointer"
                onClick={() => {
                  setCurrentIndex(idx);
                  setProgress(0);
                }}
              >
                <div
                  className="h-full bg-white transition-all duration-75 ease-linear rounded-full"
                  style={{ width: fillWidth }}
                />
              </div>
            );
          })}
        </div>

        {/* Top Controls Header */}
        <div className="absolute top-6 left-0 right-0 z-30 px-4 py-2 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center p-0.5 shadow-md">
              <div className="w-full h-full bg-black/80 rounded-full flex items-center justify-center font-bold text-xs">
                MV
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm leading-tight text-white drop-shadow">
                {currentItem.title}
              </h4>
              <div className="flex items-center gap-2 text-xs text-white/70">
                <span>{currentItem.takenAt}</span>
                {currentItem.location && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-rose-400" />
                      {currentItem.location}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio mixer toggle */}
            <button
              onClick={() => setShowMixer((prev) => !prev)}
              title="Adjust Audio Balance"
              className={`p-2 rounded-full backdrop-blur-md transition ${
                showMixer ? 'bg-amber-500 text-black' : 'bg-black/50 text-white/90 hover:bg-black/70'
              }`}
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Mute button */}
            <button
              onClick={toggleMute}
              className="p-2 rounded-full bg-black/50 backdrop-blur-md text-white/90 hover:bg-black/70 transition"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlayPause}
              className="p-2 rounded-full bg-black/50 backdrop-blur-md text-white/90 hover:bg-black/70 transition"
            >
              {isPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-black/50 backdrop-blur-md text-white/90 hover:bg-black/70 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Audio Mixer Popup (Instagram Reels Style Sound Balancing) */}
        {showMixer && (
          <div className="absolute top-20 right-4 z-40 bg-neutral-900/95 border border-white/10 p-4 rounded-2xl backdrop-blur-xl shadow-2xl w-64 text-xs text-white space-y-3">
            <h5 className="font-semibold text-white/90 flex items-center justify-between">
              <span>Audio Sound Mix</span>
              <span className="text-[10px] text-amber-400">Live Adjustment</span>
            </h5>

            {currentItem.type === 'video' && (
              <div>
                <div className="flex justify-between mb-1 text-white/70">
                  <span>Original Video Audio</span>
                  <span>{Math.round(videoVol * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={videoVol}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setVideoVol(val);
                    if (videoRef.current && !isMuted) videoRef.current.volume = val;
                  }}
                  className="w-full accent-amber-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
                />
              </div>
            )}

            {currentItem.audioTrack && (
              <div>
                <div className="flex justify-between mb-1 text-white/70">
                  <span>Soundtrack Volume</span>
                  <span>{Math.round(musicVol * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={musicVol}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setMusicVol(val);
                    if (audioRef.current && !isMuted) audioRef.current.volume = val;
                  }}
                  className="w-full accent-rose-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>
        )}

        {/* Media Canvas (Image or Video) */}
        <div className="relative flex-1 w-full h-full flex items-center justify-center bg-black overflow-hidden">
          {mediaErrors[currentItem.id] ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-neutral-900 to-neutral-800 p-8 text-center select-none">
              <div className="w-16 h-16 rounded-3xl bg-neutral-800 border border-neutral-700 flex items-center justify-center mb-4 shadow-xl">
                <Music className="w-8 h-8 text-amber-400 animate-bounce" />
              </div>
              <h4 className="text-base font-bold text-white mb-1">{currentItem.title}</h4>
              <p className="text-xs text-neutral-400">Audio playback active</p>
            </div>
          ) : currentItem.type === 'video' ? (
            <video
              ref={videoRef}
              src={currentItem.url}
              playsInline
              loop
              onError={() => setMediaErrors((prev) => ({ ...prev, [currentItem.id]: true }))}
              className="w-full h-full object-cover md:object-contain"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentItem.url}
              alt={currentItem.title}
              onError={() => setMediaErrors((prev) => ({ ...prev, [currentItem.id]: true }))}
              className="w-full h-full object-cover md:object-contain transition-transform duration-700 ease-out hover:scale-105"
            />
          )}

          {/* Left / Right Click Nav Overlays (Instagram tap navigation) */}
          <div
            className="absolute top-20 bottom-28 left-0 w-1/3 z-20 cursor-pointer"
            onClick={handlePrev}
            title="Previous (Left Arrow)"
          />
          <div
            className="absolute top-20 bottom-28 right-0 w-1/3 z-20 cursor-pointer"
            onClick={handleNext}
            title="Next (Right Arrow / Space)"
          />

          {/* Pause overlay icon when paused */}
          {isPaused && (
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none bg-black/30 backdrop-blur-[2px]">
              <div className="p-4 rounded-full bg-black/60 text-white border border-white/20">
                <Play className="w-10 h-10 fill-white translate-x-0.5" />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Story Card: Caption & Music Badge */}
        <div className="absolute bottom-0 left-0 right-0 z-30 p-5 bg-gradient-to-t from-black via-black/75 to-transparent text-white">
          {/* Caption */}
          {currentItem.caption && (
            <p className="text-sm font-light text-white/90 mb-3 drop-shadow leading-relaxed line-clamp-2">
              {currentItem.caption}
            </p>
          )}

          <div className="flex items-center justify-between">
            {/* Spinning Music Vinyl Pill */}
            {currentItem.audioTrack ? (
              <div className="flex items-center gap-2.5 bg-black/70 border border-white/20 px-3 py-1.5 rounded-full backdrop-blur-md shadow-xl max-w-[80%]">
                <div className="relative flex items-center justify-center flex-shrink-0">
                  {currentItem.audioTrack.artworkUrl ? (
                    <div
                      className={`w-7 h-7 rounded-full overflow-hidden border-2 border-amber-400/80 shadow-md ${
                        !isPaused ? 'animate-spin' : ''
                      }`}
                      style={{ animationDuration: '4s' }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentItem.audioTrack.artworkUrl}
                        alt="Album Cover"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className={`w-6 h-6 rounded-full bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center ${
                        !isPaused ? 'animate-spin' : ''
                      }`}
                      style={{ animationDuration: '4s' }}
                    >
                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                    </div>
                  )}
                  <Music className="w-3 h-3 text-white absolute -top-1 -right-1 drop-shadow" />
                </div>
                <div className="truncate text-xs">
                  <span className="font-semibold text-white truncate block">
                    {currentItem.audioTrack.title}
                  </span>
                  <span className="text-[10px] text-white/70 truncate block">
                    {currentItem.audioTrack.artist}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-white/50 italic">No music attached</div>
            )}

            {/* Favorite / Heart Button */}
            <button
              onClick={() => onToggleFavorite && onToggleFavorite(currentItem.id)}
              className="p-2.5 rounded-full bg-black/50 backdrop-blur-md hover:bg-rose-500/20 transition group"
            >
              <Heart
                className={`w-5 h-5 transition ${
                  currentItem.isFavorite
                    ? 'fill-rose-500 text-rose-500 scale-110'
                    : 'text-white/80 group-hover:text-rose-400'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Desktop Side Arrows */}
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="hidden md:flex absolute -left-16 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md items-center justify-center text-white disabled:opacity-20 transition"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={handleNext}
          className="hidden md:flex absolute -right-16 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md items-center justify-center text-white transition"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
