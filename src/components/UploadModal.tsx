'use client';

import React, { useState, useRef } from 'react';
import { MediaItem, MediaType, Album } from '@/lib/types';
import { PRESET_SOUNDTRACKS } from '@/lib/sampleData';
import { 
  X, UploadCloud, Film, Image as ImageIcon, Music, 
  Play, Pause, Sliders, Check, MapPin, Sparkles
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
  const [audioSource, setAudioSource] = useState<'preset' | 'custom' | 'none'>('preset');
  const [selectedPresetId, setSelectedPresetId] = useState(PRESET_SOUNDTRACKS[0]?.id || '');
  const [customAudioFile, setCustomAudioFile] = useState<File | null>(null);
  const [customAudioUrl, setCustomAudioUrl] = useState('');
  const [customAudioTitle, setCustomAudioTitle] = useState('');
  const [customAudioArtist, setCustomAudioArtist] = useState('');
  const [audioStartOffset, setAudioStartOffset] = useState(0);
  
  // Audio Mixer State
  const [videoVol, setVideoVol] = useState(0.4);
  const [musicVol, setMusicVol] = useState(0.85);

  // Audio Preview Test
  const [isPlayingAudioTest, setIsPlayingAudioTest] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

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
  };

  // Toggle audio test preview
  const toggleAudioTest = () => {
    let trackUrl = '';
    if (audioSource === 'preset') {
      const p = PRESET_SOUNDTRACKS.find((s) => s.id === selectedPresetId);
      trackUrl = p ? p.url : '';
    } else if (audioSource === 'custom') {
      trackUrl = customAudioUrl;
    }

    if (!trackUrl || !previewAudioRef.current) return;

    if (isPlayingAudioTest) {
      previewAudioRef.current.pause();
      setIsPlayingAudioTest(false);
    } else {
      previewAudioRef.current.src = trackUrl;
      previewAudioRef.current.currentTime = audioStartOffset;
      previewAudioRef.current.volume = musicVol;
      previewAudioRef.current.play().then(() => {
        setIsPlayingAudioTest(true);
      }).catch(console.error);
    }
  };

  const handleSave = () => {
    if (!mediaPreviewUrl && !mediaFile) {
      alert('Please upload a photo or video first!');
      return;
    }

    // Configure Audio Track
    let audioTrack = undefined;
    if (audioSource === 'preset') {
      const preset = PRESET_SOUNDTRACKS.find((s) => s.id === selectedPresetId);
      if (preset) {
        audioTrack = {
          title: preset.title,
          artist: preset.artist,
          url: preset.url,
          startOffsetSeconds: audioStartOffset,
        };
      }
    } else if (audioSource === 'custom' && customAudioUrl) {
      audioTrack = {
        title: customAudioTitle || 'Custom Memory Soundtrack',
        artist: customAudioArtist || 'Uploaded Track',
        url: customAudioUrl,
        startOffsetSeconds: audioStartOffset,
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
      <audio
        ref={previewAudioRef}
        onEnded={() => setIsPlayingAudioTest(false)}
      />

      <div className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold text-white">Add New Memory</h3>
          </div>
          <button
            onClick={onClose}
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

          {/* 2. Music Soundtrack Attachment */}
          <div className="border border-neutral-800 rounded-2xl p-4 bg-neutral-800/30 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Music className="w-4 h-4" />
                2. Pair With Soundtrack (Instagram Style)
              </label>
              
              <div className="flex bg-neutral-900 p-0.5 rounded-lg border border-neutral-700 text-xs">
                <button
                  type="button"
                  onClick={() => setAudioSource('preset')}
                  className={`px-3 py-1 rounded-md transition ${
                    audioSource === 'preset' ? 'bg-amber-500 text-black font-semibold' : 'text-neutral-400'
                  }`}
                >
                  Atmospheric Presets
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
                  onClick={() => setAudioSource('none')}
                  className={`px-3 py-1 rounded-md transition ${
                    audioSource === 'none' ? 'bg-neutral-700 text-white' : 'text-neutral-400'
                  }`}
                >
                  No Music
                </button>
              </div>
            </div>

            {/* Preset Soundtracks Selector */}
            {audioSource === 'preset' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {PRESET_SOUNDTRACKS.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => setSelectedPresetId(track.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                      selectedPresetId === track.id
                        ? 'border-amber-500 bg-amber-500/10 text-white'
                        : 'border-neutral-700 hover:border-neutral-600 bg-neutral-800/40 text-neutral-300'
                    }`}
                  >
                    <p className="font-semibold text-xs truncate">{track.title}</p>
                    <p className="text-[10px] text-neutral-400 truncate">{track.artist}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Custom Music File Upload */}
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
                    <span className="text-neutral-400 text-[10px]">Your personal music vault</span>
                  </div>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleCustomAudioChange}
                    className="hidden"
                  />
                </label>

                {customAudioUrl && (
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
                )}
              </div>
            )}

            {/* Music Start Offset & Test Play */}
            {audioSource !== 'none' && (
              <div className="pt-2 border-t border-neutral-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400">
                    Track Start Offset: <strong className="text-white">{audioStartOffset}s</strong>
                  </span>
                  <button
                    type="button"
                    onClick={toggleAudioTest}
                    className="flex items-center gap-1.5 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white rounded-lg text-xs transition"
                  >
                    {isPlayingAudioTest ? (
                      <>
                        <Pause className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>Stop Test</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>Preview Snippet</span>
                      </>
                    )}
                  </button>
                </div>

                <input
                  type="range"
                  min="0"
                  max="60"
                  step="1"
                  value={audioStartOffset}
                  onChange={(e) => setAudioStartOffset(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
                />

                {/* Audio Mixer Balance (If Video) */}
                {fileType === 'video' && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                        <span>Original Video Sound</span>
                        <span className="text-white">{Math.round(videoVol * 100)}%</span>
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
                        <span className="text-white">{Math.round(musicVol * 100)}%</span>
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
              onClick={onClose}
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
    </div>
  );
}
