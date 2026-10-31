'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AudioTrack } from '@/lib/types';
import { 
  Search, X, Play, Pause, Music, Sparkles, Check, 
  Volume2, Sliders, Disc3, TrendingUp, Flame, Coffee, Compass
} from 'lucide-react';

interface MusicSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrack: (track: {
    title: string;
    artist: string;
    url: string;
    artworkUrl?: string;
    startOffsetSeconds: number;
  }) => void;
  initialSelectedUrl?: string;
}

const CATEGORIES = [
  { id: 'trending', label: 'Trending Hits', icon: Flame },
  { id: 'lofi', label: 'Lofi & Ambient', icon: Coffee },
  { id: 'roadtrip', label: 'Road Trip', icon: Compass },
  { id: 'chill', label: 'Acoustic Sunset', icon: Sparkles },
];

export default function MusicSearchModal({
  isOpen,
  onClose,
  onSelectTrack,
  initialSelectedUrl,
}: MusicSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('trending');
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Audition / Preview playback state
  const [auditioningTrackId, setAuditioningTrackId] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Instagram-style Selected Track Trimmer
  const [stagedTrack, setStagedTrack] = useState<AudioTrack | null>(null);
  const [startOffset, setStartOffset] = useState<number>(0);
  const [isPlayingStaged, setIsPlayingStaged] = useState<boolean>(false);

  // Fetch tracks from our backend iTunes/Streaming API
  const fetchTracks = async (query = '', category = 'trending') => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) {
        params.set('q', query.trim());
      } else {
        params.set('category', category);
      }
      params.set('limit', '25');

      const res = await fetch(`/api/music/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTracks(data.tracks || []);
      }
    } catch (err) {
      console.error('Failed to search tracks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load or category change
  useEffect(() => {
    if (isOpen) {
      if (!searchTerm.trim()) {
        fetchTracks('', activeCategory);
      }
    }
  }, [isOpen, activeCategory]);

  // Debounced search on user input
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        fetchTracks(searchTerm, activeCategory);
      } else {
        fetchTracks('', activeCategory);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm, isOpen]);

  // Handle Auditioning in the list
  const toggleAudition = (track: AudioTrack, e: React.MouseEvent) => {
    e.stopPropagation();

    if (auditioningTrackId === track.id) {
      audioPreviewRef.current?.pause();
      setAuditioningTrackId(null);
    } else {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.src = track.url;
        audioPreviewRef.current.currentTime = 0;
        audioPreviewRef.current.play().then(() => {
          setAuditioningTrackId(track.id);
        }).catch(console.error);
      }
    }
  };

  // Stage a track to adjust start offset trimmer (Instagram style)
  const handleStageTrack = (track: AudioTrack) => {
    // Stop list audition
    if (audioPreviewRef.current) audioPreviewRef.current.pause();
    setAuditioningTrackId(null);

    setStagedTrack(track);
    setStartOffset(0);
    setIsPlayingStaged(true);

    if (audioPreviewRef.current) {
      audioPreviewRef.current.src = track.url;
      audioPreviewRef.current.currentTime = 0;
      audioPreviewRef.current.play().catch(console.error);
    }
  };

  // Toggle playback in trimmer view
  const toggleStagedPlayback = () => {
    if (!audioPreviewRef.current || !stagedTrack) return;
    if (isPlayingStaged) {
      audioPreviewRef.current.pause();
      setIsPlayingStaged(false);
    } else {
      audioPreviewRef.current.currentTime = startOffset;
      audioPreviewRef.current.play().then(() => {
        setIsPlayingStaged(true);
      }).catch(console.error);
    }
  };

  // Update offset in trimmer
  const handleOffsetChange = (newOffset: number) => {
    setStartOffset(newOffset);
    if (audioPreviewRef.current && stagedTrack) {
      audioPreviewRef.current.currentTime = newOffset;
      if (!isPlayingStaged) {
        audioPreviewRef.current.play().then(() => setIsPlayingStaged(true)).catch(() => {});
      }
    }
  };

  // Confirm selection
  const handleConfirmTrack = () => {
    if (!stagedTrack) return;
    if (audioPreviewRef.current) audioPreviewRef.current.pause();

    onSelectTrack({
      title: stagedTrack.title,
      artist: stagedTrack.artist,
      url: stagedTrack.url,
      artworkUrl: stagedTrack.artworkUrl,
      startOffsetSeconds: startOffset,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Hidden audio element for previewing */}
      <audio
        ref={audioPreviewRef}
        onEnded={() => {
          setAuditioningTrackId(null);
          setIsPlayingStaged(false);
        }}
      />

      <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl flex flex-col h-[82vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-5 pb-3 border-b border-neutral-800/80 bg-neutral-900/90">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-md">
                <Music className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white leading-tight">
                  Music Library
                </h3>
                <p className="text-[11px] text-neutral-400">
                  Global catalog (Spotify & Apple Music library)
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                if (audioPreviewRef.current) audioPreviewRef.current.pause();
                onClose();
              }}
              className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Input Bar (Instagram style) */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search millions of songs, artists, or albums..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-800/90 border border-neutral-700/80 focus:border-amber-500 rounded-2xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none transition shadow-inner"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-3 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Categories Pills */}
          {!searchTerm && (
            <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-1 no-scrollbar">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                      isSelected
                        ? 'bg-white text-black shadow-md'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Track List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-500 space-y-3">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Searching global music catalog...</p>
            </div>
          ) : tracks.length === 0 ? (
            <div className="text-center py-20 text-neutral-400">
              <Disc3 className="w-10 h-10 text-neutral-600 mx-auto mb-2 animate-spin" />
              <p className="text-xs">No tracks found. Try searching for an artist or song name.</p>
            </div>
          ) : (
            tracks.map((track) => {
              const isAuditioning = auditioningTrackId === track.id;
              const isStaged = stagedTrack?.id === track.id;

              return (
                <div
                  key={track.id}
                  onClick={() => handleStageTrack(track)}
                  className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition group border ${
                    isStaged
                      ? 'bg-amber-500/15 border-amber-500/50'
                      : 'border-transparent hover:bg-neutral-800/60 hover:border-neutral-700/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    {/* Album Artwork Cover */}
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-neutral-800 flex-shrink-0 shadow-md">
                      {track.artworkUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={track.artworkUrl}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                          <Music className="w-5 h-5 text-neutral-500" />
                        </div>
                      )}

                      {/* Small visualizer badge if playing */}
                      {isAuditioning && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center gap-0.5">
                          <div className="w-1 h-3 bg-amber-400 rounded-full animate-bounce" />
                          <div className="w-1 h-4 bg-amber-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                          <div className="w-1 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                        </div>
                      )}
                    </div>

                    {/* Track Info */}
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-white truncate group-hover:text-amber-400 transition">
                        {track.title}
                      </h4>
                      <p className="text-[11px] text-neutral-400 truncate">
                        {track.artist}
                      </p>
                      {track.albumName && (
                        <p className="text-[10px] text-neutral-500 truncate">
                          {track.albumName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Actions: Play Preview & Select */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => toggleAudition(track, e)}
                      className={`p-2.5 rounded-full transition ${
                        isAuditioning
                          ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                          : 'bg-neutral-800 text-white/80 hover:text-white hover:bg-neutral-700'
                      }`}
                      title={isAuditioning ? 'Pause preview' : 'Play preview'}
                    >
                      {isAuditioning ? (
                        <Pause className="w-3.5 h-3.5 fill-black" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-white translate-x-0.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Instagram-Style Scrubber & Confirm Drawer (When a track is staged) */}
        {stagedTrack && (
          <div className="border-t border-neutral-800 bg-neutral-950/95 p-4 space-y-3 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 pr-2">
                {stagedTrack.artworkUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={stagedTrack.artworkUrl}
                    alt={stagedTrack.title}
                    className="w-10 h-10 rounded-xl object-cover shadow border border-white/10"
                  />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate leading-tight">
                    {stagedTrack.title}
                  </p>
                  <p className="text-[11px] text-neutral-400 truncate">
                    {stagedTrack.artist}
                  </p>
                </div>
              </div>

              <button
                onClick={handleConfirmTrack}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white text-xs font-bold shadow-lg shadow-rose-500/20 transition flex-shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Attach Music</span>
              </button>
            </div>

            {/* Scrubber / Offset Slider */}
            <div className="bg-neutral-900/80 rounded-2xl p-3 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <button
                    onClick={toggleStagedPlayback}
                    className="p-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white"
                  >
                    {isPlayingStaged ? (
                      <Pause className="w-3 h-3 fill-white" />
                    ) : (
                      <Play className="w-3 h-3 fill-white translate-x-0.5" />
                    )}
                  </button>
                  <span>Select Starting Point:</span>
                </div>
                <span className="font-mono font-bold text-amber-400">
                  0:{startOffset < 10 ? `0${startOffset}` : startOffset}
                </span>
              </div>

              {/* Scrubber Range Bar */}
              <input
                type="range"
                min="0"
                max={Math.max((stagedTrack.durationSeconds || 30) - 5, 25)}
                step="1"
                value={startOffset}
                onChange={(e) => handleOffsetChange(parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-neutral-500">
                <span>0:00 (Intro)</span>
                <span>0:15 (Chorus)</span>
                <span>0:{Math.max((stagedTrack.durationSeconds || 30) - 5, 25)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
