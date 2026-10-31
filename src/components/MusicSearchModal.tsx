'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AudioTrack, formatTime } from '@/lib/types';
import { 
  Search, X, Play, Pause, Music, Disc3, Flame, Coffee, Compass, Sparkles, Check
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

const MAX_PREVIEW_OFFSET = 25; // 0:00 to 0:25

export default function MusicSearchModal({
  isOpen,
  onClose,
  onSelectTrack,
}: MusicSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('trending');
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Audition in list
  const [auditioningTrackId, setAuditioningTrackId] = useState<string | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Staged track for trimming
  const [stagedTrack, setStagedTrack] = useState<AudioTrack | null>(null);
  const [startOffset, setStartOffset] = useState<number>(0);
  const [isPlayingStaged, setIsPlayingStaged] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen && audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      setAuditioningTrackId(null);
      setIsPlayingStaged(false);
    }
  }, [isOpen]);

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

  useEffect(() => {
    if (isOpen && !searchTerm.trim()) {
      fetchTracks('', activeCategory);
    }
  }, [isOpen, activeCategory]);

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

  const safePlay = (audio: HTMLAudioElement, targetOffset: number) => {
    const playPromise = () => {
      try {
        const safe = Math.min(targetOffset, MAX_PREVIEW_OFFSET);
        if (!isNaN(audio.duration) && audio.duration > 0) {
          audio.currentTime = Math.min(safe, Math.max(0, audio.duration - 2));
        } else {
          audio.currentTime = safe;
        }
        audio.play().then(() => {
          setIsPlayingStaged(true);
        }).catch(() => {
          setIsPlayingStaged(false);
        });
      } catch (err) {
        console.error('SafePlay seek error:', err);
      }
    };

    if (audio.readyState >= 1) {
      playPromise();
    } else {
      audio.onloadedmetadata = () => {
        playPromise();
      };
    }
  };

  const toggleAudition = (track: AudioTrack, e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioPreviewRef.current;
    if (!audio) return;

    if (auditioningTrackId === track.id) {
      audio.pause();
      setAuditioningTrackId(null);
    } else {
      audio.pause();
      setIsPlayingStaged(false);
      audio.src = track.url;
      audio.load();
      audio.onloadedmetadata = () => {
        audio.currentTime = 0;
        audio.play().then(() => {
          setAuditioningTrackId(track.id);
        }).catch(console.error);
      };
    }
  };

  const handleStageTrack = (track: AudioTrack) => {
    const audio = audioPreviewRef.current;
    if (!audio) return;

    audio.pause();
    setAuditioningTrackId(null);

    setStagedTrack(track);
    setStartOffset(0);

    audio.src = track.url;
    audio.load();
    safePlay(audio, 0);
  };

  const toggleStagedPlayback = () => {
    const audio = audioPreviewRef.current;
    if (!audio || !stagedTrack) return;

    if (isPlayingStaged) {
      audio.pause();
      setIsPlayingStaged(false);
    } else {
      if (audio.src !== stagedTrack.url) {
        audio.src = stagedTrack.url;
        audio.load();
      }
      safePlay(audio, startOffset);
    }
  };

  const handleOffsetChange = (newOffset: number) => {
    const clamped = Math.max(0, Math.min(newOffset, MAX_PREVIEW_OFFSET));
    setStartOffset(clamped);

    const audio = audioPreviewRef.current;
    if (audio && stagedTrack) {
      try {
        audio.currentTime = clamped;
        if (!isPlayingStaged) {
          audio.play().then(() => setIsPlayingStaged(true)).catch(() => {});
        }
      } catch (err) {
        console.error('Offset seek error:', err);
      }
    }
  };

  const handleConfirmTrack = () => {
    if (!stagedTrack) return;
    if (audioPreviewRef.current) audioPreviewRef.current.pause();

    onSelectTrack({
      title: stagedTrack.title,
      artist: stagedTrack.artist,
      url: stagedTrack.url,
      artworkUrl: stagedTrack.artworkUrl,
      startOffsetSeconds: Math.min(startOffset, MAX_PREVIEW_OFFSET),
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-[2px] font-mono text-xs select-none">
      <audio
        ref={audioPreviewRef}
        onEnded={() => {
          setAuditioningTrackId(null);
          setIsPlayingStaged(false);
        }}
        onPause={() => {
          if (!auditioningTrackId) setIsPlayingStaged(false);
        }}
      />

      <div className="relative w-full max-w-xl retro-box-outset shadow-2xl flex flex-col h-[84vh] overflow-hidden">
        
        {/* Title Bar */}
        <div className="retro-titlebar select-none">
          <div className="flex items-center gap-2">
            <Music className="w-3.5 h-3.5 text-white" />
            <span>Audio Catalog Explorer 1999 — [Spotify & Apple Music]</span>
          </div>
          <button
            onClick={() => {
              if (audioPreviewRef.current) audioPreviewRef.current.pause();
              onClose();
            }}
            className="retro-win-ctrl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Toolbar & Search Input */}
        <div className="p-3 bg-[#dfdbed] border-b border-[#a09bb8] space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search artist, song name, or genre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 retro-box-inset px-2.5 py-1 text-xs bg-white text-black font-mono"
            />
            <button
              onClick={() => fetchTracks(searchTerm, activeCategory)}
              className="retro-btn"
            >
              <Search className="w-3 h-3" />
              <span>Search</span>
            </button>
          </div>

          {/* Quick Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            {CATEGORIES.map((cat) => {
              const isSelected = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setSearchTerm('');
                  }}
                  className={`px-2.5 py-1 retro-btn text-[10px] whitespace-nowrap ${
                    isSelected ? 'bg-[#cec8e3] font-bold' : ''
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Track List Body */}
        <div className="flex-1 overflow-y-auto p-2 bg-[#f4f2fa] retro-box-inset m-1 space-y-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-500 space-y-2">
              <div className="w-6 h-6 border-2 border-[#5a4897] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Buffering catalog...</p>
            </div>
          ) : tracks.length === 0 ? (
            <div className="text-center py-20 text-neutral-500">
              <Disc3 className="w-8 h-8 text-neutral-400 mx-auto mb-1 animate-spin" />
              <p className="text-xs">No tracks found. Try typing another song name.</p>
            </div>
          ) : (
            tracks.map((track) => {
              const isAuditioning = auditioningTrackId === track.id;
              const isStaged = stagedTrack?.id === track.id;

              return (
                <div
                  key={track.id}
                  onClick={() => handleStageTrack(track)}
                  className={`flex items-center justify-between p-2 retro-box-outset cursor-pointer transition ${
                    isStaged
                      ? 'border-t-[#332d47] border-l-[#332d47] border-b-white border-r-white bg-[#cec8e3]'
                      : 'hover:bg-[#eae7f7]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className="w-8 h-8 rounded-sm overflow-hidden border border-[#332d47] flex-shrink-0 bg-black">
                      {track.artworkUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={track.artworkUrl}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-white">
                          CD
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs truncate leading-tight text-[#1a162b]">
                        {track.title}
                      </p>
                      <p className="text-[10px] text-neutral-600 truncate">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={(e) => toggleAudition(track, e)}
                      className="retro-btn px-2 py-1"
                      title={isAuditioning ? 'Stop Preview' : 'Audition'}
                    >
                      {isAuditioning ? <Pause className="w-3 h-3 fill-black" /> : <Play className="w-3 h-3 fill-black" />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Vintage Scrubber */}
        {stagedTrack && (
          <div className="p-3 bg-[#dfdbed] border-t border-white space-y-2 select-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 pr-1">
                {stagedTrack.artworkUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={stagedTrack.artworkUrl}
                    alt={stagedTrack.title}
                    className="w-7 h-7 rounded-sm object-cover border border-[#332d47]"
                  />
                )}
                <div className="min-w-0">
                  <p className="font-bold text-xs text-[#1a162b] truncate">{stagedTrack.title}</p>
                  <p className="text-[10px] text-neutral-600 truncate">{stagedTrack.artist}</p>
                </div>
              </div>

              <button
                onClick={handleConfirmTrack}
                className="retro-btn bg-[#c5bee6] font-bold flex-shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Attach Soundtrack</span>
              </button>
            </div>

            <div className="retro-box-inset p-2 bg-white space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1">
                  <button onClick={toggleStagedPlayback} className="retro-btn px-1.5 py-0.5">
                    {isPlayingStaged ? <Pause className="w-2.5 h-2.5 fill-black" /> : <Play className="w-2.5 h-2.5 fill-black" />}
                  </button>
                  <span className="font-bold">Select Starting Second:</span>
                </div>
                <span className="font-mono font-bold text-[#5a4897]">
                  {formatTime(startOffset)}
                </span>
              </div>

              <input
                type="range"
                min="0"
                max={MAX_PREVIEW_OFFSET}
                step="1"
                value={startOffset}
                onChange={(e) => handleOffsetChange(parseInt(e.target.value, 10))}
                className="w-full accent-[#5a4897] h-1.5 bg-neutral-200 rounded cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-neutral-400 font-mono">
                <span>0:00 (Intro)</span>
                <span>0:15 (Chorus)</span>
                <span>0:25 (Outro)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
