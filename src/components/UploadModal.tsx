'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MediaItem, MediaType, Album, formatTime } from '@/lib/types';
import { PRESET_SOUNDTRACKS } from '@/lib/sampleData';
import MusicSearchModal from './MusicSearchModal';
import { 
  X, UploadCloud, Film, Image as ImageIcon, Music, 
  Play, Pause, Sliders, Check, MapPin, Sparkles, Search, Disc3
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  albums: Album[];
  onSave: (item: MediaItem) => void;
}

export default function UploadModal({
  isOpen,
  onClose,
  albums,
  onSave,
}: UploadModalProps) {
  // Media State
  const [fileType, setFileType] = useState<MediaType>('photo');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string>('');
  
  // Details
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [albumId, setAlbumId] = useState('wanderlust');
  const [location, setLocation] = useState('');
  const [takenAt, setTakenAt] = useState(new Date().toISOString().split('T')[0]);

  // Audio State
  const [audioSource, setAudioSource] = useState<'catalog' | 'custom' | 'none'>('catalog');
  
  // Catalog Selected Track
  const [catalogTrack, setCatalogTrack] = useState<{
    title: string;
    artist: string;
    url: string;
    artworkUrl?: string;
    startOffsetSeconds: number;
  }>({
    title: 'Yellow',
    artist: 'Coldplay',
    url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/66/f3/1a/66f31a76-a6ed-cb4c-f353-23310a7ae9a8/mzaf_10593596652344378873.plus.aac.p.m4a',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f5/93/8c/f5938c49-964c-31d1-4b33-78b634f71fb7/190295978075.jpg/600x600bb.jpg',
    startOffsetSeconds: 0,
  });

  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);

  // Custom Audio State
  const [customAudioFile, setCustomAudioFile] = useState<File | null>(null);
  const [customAudioUrl, setCustomAudioUrl] = useState('');
  const [customAudioTitle, setCustomAudioTitle] = useState('');
  const [customAudioArtist, setCustomAudioArtist] = useState('');
  const [customAudioDuration, setCustomAudioDuration] = useState(30);
  const [customAudioStartOffset, setCustomAudioStartOffset] = useState(0);

  // Audio Mixer State
  const [videoVol, setVideoVol] = useState(0.4);
  const [musicVol, setMusicVol] = useState(0.85);

  // Audio Preview Test State
  const [isPlayingAudioTest, setIsPlayingAudioTest] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Pause test audio when modal is closed
  useEffect(() => {
    if (!isOpen && previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPlayingAudioTest(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle media file upload
  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaFile(file);
    const isVideo = file.type.startsWith('video');
    setFileType(isVideo ? 'video' : 'photo');
    setMediaPreviewUrl(URL.createObjectURL(file));

    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
    }
  };

  // Handle custom audio upload
  const handleCustomAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCustomAudioFile(file);
    const url = URL.createObjectURL(file);
    setCustomAudioUrl(url);
    setCustomAudioTitle(file.name.replace(/\.[^/.]+$/, ''));
    setCustomAudioArtist('My Music Vault');
    setCustomAudioStartOffset(0);

    // Detect actual duration of uploaded MP3
    const tempAudio = new Audio(url);
    tempAudio.onloadedmetadata = () => {
      if (!isNaN(tempAudio.duration) && tempAudio.duration > 0) {
        setCustomAudioDuration(Math.floor(tempAudio.duration));
      }
    };
  };

  // Reliable seek and play function
  const playTrackAtOffset = (url: string, targetOffset: number) => {
    const audio = previewAudioRef.current;
    if (!audio || !url) return;

    audio.volume = musicVol;

    const executePlayback = () => {
      try {
        const maxOffset = !isNaN(audio.duration) && audio.duration > 2
          ? Math.floor(audio.duration) - 2
          : 25;
        const safeOffset = Math.max(0, Math.min(targetOffset, maxOffset));
        audio.currentTime = safeOffset;
        audio.play().then(() => {
          setIsPlayingAudioTest(true);
        }).catch((err) => {
          console.warn('Playback error:', err);
          setIsPlayingAudioTest(false);
        });
      } catch (err) {
        console.error('Seek error:', err);
      }
    };

    if (audio.src === url && audio.readyState >= 1) {
      executePlayback();
    } else {
      audio.src = url;
      audio.load();
      audio.onloadedmetadata = () => {
        executePlayback();
      };
      audio.onerror = () => {
        console.error('Audio stream load error');
        setIsPlayingAudioTest(false);
      };
    }
  };

  // Toggle audio test preview button
  const toggleAudioTest = () => {
    const audio = previewAudioRef.current;
    if (!audio) return;

    if (isPlayingAudioTest) {
      audio.pause();
      setIsPlayingAudioTest(false);
      return;
    }

    if (audioSource === 'catalog' && catalogTrack.url) {
      playTrackAtOffset(catalogTrack.url, catalogTrack.startOffsetSeconds);
    } else if (audioSource === 'custom' && customAudioUrl) {
      playTrackAtOffset(customAudioUrl, customAudioStartOffset);
    }
  };

  // Handler for scrubbing catalog start offset
  const handleCatalogOffsetChange = (newOffset: number) => {
    const clamped = Math.max(0, Math.min(newOffset, 25));
    setCatalogTrack((prev) => ({ ...prev, startOffsetSeconds: clamped }));

    const audio = previewAudioRef.current;
    if (audio) {
      if (isPlayingAudioTest) {
        audio.currentTime = clamped;
      } else {
        // Auto-play snippet from that position so user hears it!
        playTrackAtOffset(catalogTrack.url, clamped);
      }
    }
  };

  // Handler for scrubbing custom audio start offset
  const handleCustomOffsetChange = (newOffset: number) => {
    const maxOffset = Math.max(5, customAudioDuration - 5);
    const clamped = Math.max(0, Math.min(newOffset, maxOffset));
    setCustomAudioStartOffset(clamped);

    const audio = previewAudioRef.current;
    if (audio) {
      if (isPlayingAudioTest) {
        audio.currentTime = clamped;
      } else {
        playTrackAtOffset(customAudioUrl, clamped);
      }
    }
  };

  const handleSave = () => {
    if (!mediaPreviewUrl && !mediaFile) {
      alert('Please upload a photo or video first!');
      return;
    }

    // Stop preview test
    if (previewAudioRef.current) previewAudioRef.current.pause();

    // Configure Audio Track
    let audioTrack = undefined;
    if (audioSource === 'catalog' && catalogTrack.url) {
      audioTrack = {
        title: catalogTrack.title,
        artist: catalogTrack.artist,
        url: catalogTrack.url,
        artworkUrl: catalogTrack.artworkUrl,
        startOffsetSeconds: Math.min(catalogTrack.startOffsetSeconds, 25),
        source: 'library' as const,
      };
    } else if (audioSource === 'custom' && customAudioUrl) {
      audioTrack = {
        title: customAudioTitle || 'Custom Memory Soundtrack',
        artist: customAudioArtist || 'Uploaded Track',
        url: customAudioUrl,
        startOffsetSeconds: customAudioStartOffset,
        source: 'custom' as const,
      };
    }

    const newItem: MediaItem = {
      id: `mem-${Date.now()}`,
      type: fileType,
      url: mediaPreviewUrl,
      thumbnailUrl: mediaPreviewUrl,
      title: title || 'Untitled Memory',
      caption,
      album: albumId,
      location,
      takenAt: takenAt || new Date().toISOString().split('T')[0] || '2024-10-31',
      durationSeconds: fileType === 'video' ? 15 : 7,
      isFavorite: false,
      audioTrack,
      audioMix: {
        videoVolume: fileType === 'video' ? videoVol : 0,
        musicVolume: musicVol,
      },
    };

    onSave(newItem);

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // safe fallback
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      {/* Hidden audio element for preview tests */}
      <audio
        ref={previewAudioRef}
        onEnded={() => setIsPlayingAudioTest(false)}
        onPause={() => setIsPlayingAudioTest(false)}
        onPlay={() => setIsPlayingAudioTest(true)}
        onError={() => setIsPlayingAudioTest(false)}
      />

      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Add New Memory</h3>
          </div>
          <button
            onClick={() => {
              if (previewAudioRef.current) previewAudioRef.current.pause();
              onClose();
            }}
            className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* 1. Media Upload Zone */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              1. Choose Photo or Video
            </label>
            
            {!mediaPreviewUrl ? (
              <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-neutral-700 hover:border-amber-500/80 rounded-2xl cursor-pointer bg-neutral-800/40 hover:bg-neutral-800/70 transition group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                  <div className="p-3 bg-neutral-800 rounded-full mb-2 group-hover:scale-110 transition">
                    <UploadCloud className="w-6 h-6 text-amber-400" />
                  </div>
                  <p className="text-sm font-medium text-white mb-1">
                    Click to upload or drag & drop
                  </p>
                  <p className="text-xs text-neutral-400">
                    Supports Photos (JPEG, PNG, HEIC) & Videos (MP4, MOV, WebM)
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleMediaChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-neutral-700 max-h-64 bg-black flex items-center justify-center group">
                {fileType === 'video' ? (
                  <video
                    src={mediaPreviewUrl}
                    controls
                    className="max-h-64 w-auto object-contain"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaPreviewUrl}
                    alt="Preview"
                    className="max-h-64 w-auto object-contain"
                  />
                )}
                <button
                  onClick={() => {
                    setMediaPreviewUrl('');
                    setMediaFile(null);
                  }}
                  className="absolute top-3 right-3 p-1.5 bg-black/70 hover:bg-red-600 rounded-full text-white backdrop-blur-md transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* 2. Instagram-Style Music Catalog Attachment */}
          <div className="border border-neutral-800 rounded-2xl p-4 bg-neutral-800/30 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Music className="w-4 h-4" />
                2. Music Soundtrack (Instagram Style)
              </label>
              
              <div className="flex bg-neutral-900 p-0.5 rounded-lg border border-neutral-700 text-xs">
                <button
                  type="button"
                  onClick={() => setAudioSource('catalog')}
                  className={`px-3 py-1 rounded-md transition ${
                    audioSource === 'catalog' ? 'bg-amber-500 text-black font-semibold' : 'text-neutral-400'
                  }`}
                >
                  Music Library
                </button>
                <button
                  type="button"
                  onClick={() => setAudioSource('custom')}
                  className={`px-3 py-1 rounded-md transition ${
                    audioSource === 'custom' ? 'bg-amber-500 text-black font-semibold' : 'text-neutral-400'
                  }`}
                >
                  Upload MP3
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (previewAudioRef.current) previewAudioRef.current.pause();
                    setAudioSource('none');
                  }}
                  className={`px-3 py-1 rounded-md transition ${
                    audioSource === 'none' ? 'bg-neutral-700 text-white' : 'text-neutral-400'
                  }`}
                >
                  No Music
                </button>
              </div>
            </div>

            {/* A. Global Music Library (Spotify & Apple Music Catalog) */}
            {audioSource === 'catalog' && (
              <div className="space-y-3">
                {catalogTrack.url ? (
                  <div className="space-y-3 p-3.5 rounded-2xl bg-neutral-800/80 border border-neutral-700 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3.5 min-w-0 pr-2">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md flex-shrink-0 bg-neutral-900 border border-white/10">
                          {catalogTrack.artworkUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={catalogTrack.artworkUrl}
                              alt={catalogTrack.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Disc3 className="w-6 h-6 text-amber-400 animate-spin" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs text-white truncate">
                              {catalogTrack.title}
                            </h4>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                              Attached
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-400 truncate">
                            {catalogTrack.artist}
                          </p>
                          <p className="text-[10px] text-amber-400 font-mono mt-0.5">
                            Start offset: {formatTime(catalogTrack.startOffsetSeconds)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Play while attached button */}
                        <button
                          type="button"
                          onClick={toggleAudioTest}
                          className={`p-2.5 rounded-full transition shadow-md ${
                            isPlayingAudioTest
                              ? 'bg-amber-500 text-black shadow-amber-500/30 animate-pulse'
                              : 'bg-neutral-700 hover:bg-neutral-600 text-white'
                          }`}
                          title={isPlayingAudioTest ? 'Pause snippet' : 'Play attached track'}
                        >
                          {isPlayingAudioTest ? (
                            <Pause className="w-3.5 h-3.5 fill-black" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-white translate-x-0.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsMusicModalOpen(true)}
                          className="px-3 py-1.5 rounded-xl bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-medium flex items-center gap-1.5 transition"
                        >
                          <Search className="w-3 h-3" />
                          <span>Change</span>
                        </button>
                      </div>
                    </div>

                    {/* Scrubber for catalog track */}
                    <div className="pt-2 border-t border-neutral-700/60 space-y-1.5">
                      <div className="flex justify-between text-[11px] text-neutral-300">
                        <span>Select Starting Point (Intro / Chorus):</span>
                        <span className="text-amber-400 font-mono font-bold">
                          {formatTime(catalogTrack.startOffsetSeconds)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="25"
                        step="1"
                        value={Math.min(catalogTrack.startOffsetSeconds, 25)}
                        onChange={(e) => handleCatalogOffsetChange(parseInt(e.target.value, 10))}
                        className="w-full accent-amber-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] text-neutral-500 font-mono">
                        <span>0:00 (Intro)</span>
                        <span>0:15 (Chorus)</span>
                        <span>0:25 (Outro)</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsMusicModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-amber-500/40 hover:border-amber-500 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 text-xs font-semibold transition"
                  >
                    <Search className="w-4 h-4" />
                    <span>Search Millions of Songs (Spotify & Apple Music Library)</span>
                  </button>
                )}
              </div>
            )}

            {/* B. Custom Music File Upload */}
            {audioSource === 'custom' && (
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border border-neutral-700 rounded-xl bg-neutral-800/60 cursor-pointer hover:border-amber-500/80 transition">
                  <div className="p-2 bg-neutral-700 rounded-lg">
                    <Music className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-xs">
                    <span className="font-medium text-white block">
                      {customAudioFile ? customAudioFile.name : 'Choose an MP3, AAC, or WAV file'}
                    </span>
                    <span className="text-neutral-400 text-[10px]">Your personal music file</span>
                  </div>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleCustomAudioChange}
                    className="hidden"
                  />
                </label>

                {customAudioUrl && (
                  <div className="space-y-3 p-3 rounded-xl bg-neutral-800/50 border border-neutral-700">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-neutral-400 text-[10px]">Song Title</span>
                        <input
                          type="text"
                          value={customAudioTitle}
                          onChange={(e) => setCustomAudioTitle(e.target.value)}
                          className="w-full mt-1 bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-neutral-400 text-[10px]">Artist</span>
                        <input
                          type="text"
                          value={customAudioArtist}
                          onChange={(e) => setCustomAudioArtist(e.target.value)}
                          className="w-full mt-1 bg-neutral-900 border border-neutral-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between items-center text-[11px] text-neutral-300">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={toggleAudioTest}
                            className={`p-1.5 rounded-full transition ${
                              isPlayingAudioTest ? 'bg-amber-500 text-black' : 'bg-neutral-700 text-white'
                            }`}
                          >
                            {isPlayingAudioTest ? (
                              <Pause className="w-3 h-3 fill-current" />
                            ) : (
                              <Play className="w-3 h-3 fill-current translate-x-0.5" />
                            )}
                          </button>
                          <span>Starting Point:</span>
                        </div>
                        <span className="text-amber-400 font-mono font-bold">
                          {formatTime(customAudioStartOffset)} / {formatTime(customAudioDuration)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={Math.max(5, customAudioDuration - 5)}
                        step="1"
                        value={customAudioStartOffset}
                        onChange={(e) => handleCustomOffsetChange(parseInt(e.target.value, 10))}
                        className="w-full accent-amber-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* C. Audio Mixer Balance (If Video) */}
            {audioSource !== 'none' && fileType === 'video' && (
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-neutral-800/80">
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Original Video Sound</span>
                    <span className="text-white font-mono">{Math.round(videoVol * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={videoVol}
                    onChange={(e) => setVideoVol(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 h-1 bg-neutral-700 rounded-lg cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                    <span>Soundtrack Volume</span>
                    <span className="text-white font-mono">{Math.round(musicVol * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={musicVol}
                    onChange={(e) => setMusicVol(parseFloat(e.target.value))}
                    className="w-full accent-rose-500 h-1 bg-neutral-700 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Details & Metadata */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                Title
              </label>
              <input
                type="text"
                placeholder="e.g. Sunset in Malibu"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                  Album
                </label>
                <select
                  value={albumId}
                  onChange={(e) => setAlbumId(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                >
                  {albums.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="e.g. Kyoto, Japan"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={takenAt}
                  onChange={(e) => setTakenAt(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                Story Caption / Reflection
              </label>
              <textarea
                rows={2}
                placeholder="What made this moment unforgettable?"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800 bg-neutral-900/80">
          <span className="text-[11px] text-neutral-400 flex items-center gap-1">
            🔒 Saved permanently to your private lifetime vault
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (previewAudioRef.current) previewAudioRef.current.pause();
                onClose();
              }}
              className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white rounded-xl shadow-lg shadow-rose-500/20 transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Save Memory
            </button>
          </div>
        </div>
      </div>

      {/* Global Music Search Modal (Spotify & Apple Music Library) */}
      <MusicSearchModal
        isOpen={isMusicModalOpen}
        onClose={() => setIsMusicModalOpen(false)}
        onSelectTrack={(track) => {
          setCatalogTrack({
            ...track,
            startOffsetSeconds: Math.min(track.startOffsetSeconds, 25),
          });
          setAudioSource('catalog');
        }}
      />
    </div>
  );
}
