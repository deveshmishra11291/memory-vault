'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MediaItem, MediaType, Album, formatTime } from '@/lib/types';
import MusicSearchModal from './MusicSearchModal';
import { 
  X, UploadCloud, Film, Image as ImageIcon, Music, 
  Play, Pause, Check, MapPin, Sparkles, Search, Disc3, HardDrive
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
  const [isUploading, setIsUploading] = useState(false);
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

  const handleCatalogOffsetChange = (newOffset: number) => {
    const clamped = Math.max(0, Math.min(newOffset, 25));
    setCatalogTrack((prev) => ({ ...prev, startOffsetSeconds: clamped }));

    const audio = previewAudioRef.current;
    if (audio) {
      if (isPlayingAudioTest) {
        audio.currentTime = clamped;
      } else {
        playTrackAtOffset(catalogTrack.url, clamped);
      }
    }
  };

  const handleSave = async () => {
    if (!mediaPreviewUrl && !mediaFile) {
      alert('Please select a photo or video file first!');
      return;
    }

    if (previewAudioRef.current) previewAudioRef.current.pause();
    setIsUploading(true);

    try {
      let finalMediaUrl = mediaPreviewUrl;

      // 1. Upload media binary to server
      if (mediaFile) {
        const formData = new FormData();
        formData.append('file', mediaFile);
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          if (data.url) finalMediaUrl = data.url;
        }
      }

      // 2. Upload custom audio if applicable
      let finalAudioUrl = '';
      if (audioSource === 'catalog') {
        finalAudioUrl = catalogTrack.url;
      } else if (audioSource === 'custom') {
        if (customAudioFile) {
          const audioFormData = new FormData();
          audioFormData.append('file', customAudioFile);
          const audioRes = await fetch('/api/upload', {
            method: 'POST',
            body: audioFormData,
          });
          if (audioRes.ok) {
            const data = await audioRes.json();
            if (data.url) finalAudioUrl = data.url;
          }
        }
        if (!finalAudioUrl) finalAudioUrl = customAudioUrl;
      }

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
      } else if (audioSource === 'custom' && finalAudioUrl) {
        audioTrack = {
          title: customAudioTitle || 'Custom Memory Soundtrack',
          artist: customAudioArtist || 'Uploaded Track',
          url: finalAudioUrl,
          startOffsetSeconds: customAudioStartOffset,
          source: 'custom' as const,
        };
      }

      const newItem: MediaItem = {
        id: `mem-${Date.now()}`,
        type: fileType,
        url: finalMediaUrl,
        thumbnailUrl: finalMediaUrl,
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

      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {}

      onClose();
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save memory. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-[2px] font-mono text-xs select-none">
      <audio
        ref={previewAudioRef}
        onEnded={() => setIsPlayingAudioTest(false)}
        onPause={() => setIsPlayingAudioTest(false)}
        onPlay={() => setIsPlayingAudioTest(true)}
        onError={() => setIsPlayingAudioTest(false)}
      />

      <div className="relative w-full max-w-xl retro-box-outset shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        
        {/* Title Bar */}
        <div className="retro-titlebar select-none">
          <div className="flex items-center gap-2">
            <HardDrive className="w-3.5 h-3.5 text-white" />
            <span>Add Memory Installation Wizard 1999</span>
          </div>
          <button
            onClick={() => {
              if (previewAudioRef.current) previewAudioRef.current.pause();
              onClose();
            }}
            className="retro-win-ctrl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Wizard Header Banner */}
        <div className="px-4 py-2.5 bg-gradient-to-r from-[#dfdbed] to-[#edeaf7] border-b border-[#a09bb8] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xs text-[#1a162b]">Memory Setup Wizard</h3>
            <p className="text-[10px] text-neutral-600">Select media and attach background music</p>
          </div>
          <div className="w-7 h-7 rounded-sm bg-[#5a4897] text-white flex items-center justify-center font-bold text-xs shadow-inner">
            99
          </div>
        </div>

        {/* Modal Form Content */}
        <div className="p-4 bg-[#f4f2fa] retro-box-inset m-1 overflow-y-auto space-y-4 max-h-[70vh]">
          
          {/* 1. Media File Upload */}
          <div className="retro-box-outset p-3 bg-[#dfdbed] space-y-2">
            <span className="font-bold text-[#1a162b] block">
              1. Photo or Video Source
            </span>

            {!mediaPreviewUrl ? (
              <label className="flex items-center justify-center p-6 border-2 border-dashed border-[#807a99] bg-white cursor-pointer hover:bg-neutral-50 transition text-center">
                <div>
                  <UploadCloud className="w-6 h-6 text-[#5a4897] mx-auto mb-1" />
                  <p className="font-bold text-xs text-neutral-800">Click to Browse File...</p>
                  <p className="text-[10px] text-neutral-500">Supports JPG, PNG, HEIC & MP4, MOV</p>
                </div>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleMediaChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative retro-box-inset bg-black p-1 max-h-48 flex items-center justify-center">
                {fileType === 'video' ? (
                  <video
                    src={mediaPreviewUrl}
                    controls
                    className="max-h-44 w-auto object-contain"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaPreviewUrl}
                    alt="Preview"
                    className="max-h-44 w-auto object-contain"
                  />
                )}
                <button
                  onClick={() => {
                    setMediaPreviewUrl('');
                    setMediaFile(null);
                  }}
                  className="absolute top-2 right-2 px-1.5 py-0.5 retro-btn bg-red-100 text-red-700 font-bold text-[10px]"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* 2. Soundtrack Attachment */}
          <div className="retro-box-outset p-3 bg-[#dfdbed] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#1a162b] flex items-center gap-1">
                <Music className="w-3.5 h-3.5 text-rose-600" />
                2. Sound Track Attachment
              </span>

              <div className="flex gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setAudioSource('catalog')}
                  className={`px-2 py-0.5 retro-btn ${audioSource === 'catalog' ? 'bg-[#cec8e3] font-bold' : ''}`}
                >
                  Catalog
                </button>
                <button
                  type="button"
                  onClick={() => setAudioSource('custom')}
                  className={`px-2 py-0.5 retro-btn ${audioSource === 'custom' ? 'bg-[#cec8e3] font-bold' : ''}`}
                >
                  Custom MP3
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (previewAudioRef.current) previewAudioRef.current.pause();
                    setAudioSource('none');
                  }}
                  className={`px-2 py-0.5 retro-btn ${audioSource === 'none' ? 'bg-[#cec8e3] font-bold' : ''}`}
                >
                  None
                </button>
              </div>
            </div>

            {/* Catalog Selector */}
            {audioSource === 'catalog' && (
              <div className="space-y-2">
                {catalogTrack.url ? (
                  <div className="retro-box-inset p-2.5 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0 pr-1">
                        <div className="w-10 h-10 rounded-sm overflow-hidden border border-[#332d47] flex-shrink-0 bg-black">
                          {catalogTrack.artworkUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={catalogTrack.artworkUrl}
                              alt={catalogTrack.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[8px] text-white">
                              CD
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs truncate leading-tight">
                            {catalogTrack.title}
                          </p>
                          <p className="text-[10px] text-neutral-600 truncate">
                            {catalogTrack.artist}
                          </p>
                          <p className="text-[10px] text-[#5a4897] font-bold">
                            Offset: {formatTime(catalogTrack.startOffsetSeconds)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={toggleAudioTest}
                          className="retro-btn"
                          title="Preview Track"
                        >
                          {isPlayingAudioTest ? <Pause className="w-3 h-3 fill-black" /> : <Play className="w-3 h-3 fill-black" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => setIsMusicModalOpen(true)}
                          className="retro-btn"
                        >
                          <Search className="w-3 h-3" />
                          <span>Change</span>
                        </button>
                      </div>
                    </div>

                    {/* Scrubber */}
                    <div className="pt-1.5 border-t border-neutral-200 space-y-1">
                      <div className="flex justify-between text-[10px] text-neutral-600">
                        <span>Starting point:</span>
                        <span className="font-bold text-[#5a4897]">
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
                        className="w-full accent-[#5a4897] h-1.5 bg-neutral-200 rounded cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] text-neutral-400">
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
                    className="w-full retro-btn py-2.5 font-bold flex items-center justify-center gap-1.5"
                  >
                    <Search className="w-3.5 h-3.5 text-rose-600" />
                    <span>Search Global Music Library (Spotify & Apple Music)...</span>
                  </button>
                )}
              </div>
            )}

            {/* Custom MP3 File */}
            {audioSource === 'custom' && (
              <div className="space-y-2">
                <label className="retro-btn w-full py-2 flex items-center justify-center gap-2 cursor-pointer bg-white">
                  <Music className="w-3.5 h-3.5 text-amber-600" />
                  <span>{customAudioFile ? customAudioFile.name : 'Choose Audio File (.mp3, .wav)...'}</span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleCustomAudioChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* 3. Metadata Fields */}
          <div className="retro-box-outset p-3 bg-[#dfdbed] space-y-2">
            <span className="font-bold text-[#1a162b] block">3. Memory Details</span>

            <div>
              <label className="block text-[10px] font-bold text-neutral-700 mb-0.5">Title:</label>
              <input
                type="text"
                placeholder="e.g. Summer Sunset 1999"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full retro-box-inset px-2 py-1 text-xs text-black"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-neutral-700 mb-0.5">Album Folder:</label>
                <select
                  value={albumId}
                  onChange={(e) => setAlbumId(e.target.value)}
                  className="w-full retro-box-inset px-2 py-1 text-xs text-black"
                >
                  {albums.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-700 mb-0.5">Date:</label>
                <input
                  type="date"
                  value={takenAt}
                  onChange={(e) => setTakenAt(e.target.value)}
                  className="w-full retro-box-inset px-2 py-1 text-xs text-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-700 mb-0.5">Location:</label>
              <input
                type="text"
                placeholder="e.g. Kyoto, Japan"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full retro-box-inset px-2 py-1 text-xs text-black"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-700 mb-0.5">Story Caption:</label>
              <textarea
                rows={2}
                placeholder="Story reflections..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full retro-box-inset px-2 py-1 text-xs text-black"
              />
            </div>
          </div>
        </div>

        {/* Wizard Footer Controls */}
        <div className="px-4 py-2 bg-[#dfdbed] border-t border-white flex items-center justify-between">
          <span className="text-[10px] text-neutral-600">Saved permanently to vault disk</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (previewAudioRef.current) previewAudioRef.current.pause();
                onClose();
              }}
              className="retro-btn"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isUploading}
              className="retro-btn bg-[#c5bee6] font-bold disabled:opacity-50"
            >
              {isUploading ? 'Installing...' : 'Finish [Save]'}
            </button>
          </div>
        </div>
      </div>

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
