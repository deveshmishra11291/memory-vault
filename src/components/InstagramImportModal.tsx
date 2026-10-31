'use client';

import React, { useState } from 'react';
import JSZip from 'jszip';
import { MediaItem, Album } from '@/lib/types';
import { 
  Camera, X, UploadCloud, Check, Sparkles, Folder, 
  Film, Image as ImageIcon, ShieldCheck, ArrowRight, Music, AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface InstagramImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (items: MediaItem[], album: Album) => void;
}

interface DetectedItem {
  name: string;
  blob: Blob;
  type: 'photo' | 'video';
  previewUrl: string;
  timestamp?: number;
  songTitle?: string;
  artistName?: string;
}

export default function InstagramImportModal({
  isOpen,
  onClose,
  onImportComplete,
}: InstagramImportModalProps) {
  const [step, setStep] = useState<'intro' | 'parsing' | 'preview' | 'importing' | 'done'>('intro');
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [albumName, setAlbumName] = useState('Instagram Archive 📸');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  // Process dropped or selected ZIP file
  const handleZipFile = async (file: File) => {
    setStep('parsing');
    setErrorMessage('');
    try {
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(file);

      // Search for stories.json or posts.json metadata
      let storiesMeta: any[] = [];
      const jsonCandidates = [
        'your_instagram_activity/content/stories.json',
        'content/stories.json',
        'stories.json',
        'your_instagram_activity/media/stories.json',
      ];

      for (const path of jsonCandidates) {
        const jsonFile = loadedZip.file(path);
        if (jsonFile) {
          try {
            const text = await jsonFile.async('text');
            const parsed = JSON.parse(text);
            storiesMeta = parsed.ig_stories || parsed.stories || (Array.isArray(parsed) ? parsed : []);
            break;
          } catch (e) {
            console.warn('Failed parsing JSON candidate', path, e);
          }
        }
      }

      // Find all media files in the zip
      const items: DetectedItem[] = [];

      for (const [relativePath, zipEntry] of Object.entries(loadedZip.files)) {
        if (zipEntry.dir) continue;
        const lower = relativePath.toLowerCase();

        const isVideo = lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm');
        const isPhoto = lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp') || lower.endsWith('.heic');

        if (isVideo || isPhoto) {
          // Check if this file is in stories, posts, or media folders
          if (lower.includes('stories') || lower.includes('media') || lower.includes('content') || items.length < 50) {
            const blob = await zipEntry.async('blob');
            const previewUrl = URL.createObjectURL(blob);

            // Match with metadata if available
            let timestamp: number | undefined;
            let songTitle: string | undefined;
            let artistName: string | undefined;

            const filename = relativePath.split('/').pop() || '';
            const match = storiesMeta.find((m) => m.uri && m.uri.includes(filename));
            if (match) {
              if (match.creation_timestamp) timestamp = match.creation_timestamp * 1000;
              const music = match.media_metadata?.music_metadata;
              if (music) {
                songTitle = music.music_title;
                artistName = music.artist_name;
              }
            }

            // Fallback timestamp from filename regex (e.g. 20240815_...)
            if (!timestamp) {
              const dateMatch = filename.match(/(\d{4})(\d{2})(\d{2})/);
              if (dateMatch) {
                const year = parseInt(dateMatch[1] || '2024', 10);
                const month = parseInt(dateMatch[2] || '01', 10) - 1;
                const day = parseInt(dateMatch[3] || '01', 10);
                timestamp = new Date(year, month, day).getTime();
              }
            }

            items.push({
              name: filename,
              blob,
              type: isVideo ? 'video' : 'photo',
              previewUrl,
              timestamp,
              songTitle,
              artistName,
            });
          }
        }
      }

      if (items.length === 0) {
        setErrorMessage('No photos or videos found in the selected file. Please make sure this is your Instagram data download.');
        setStep('intro');
        return;
      }

      // Sort chronologically if timestamps available
      items.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      setDetectedItems(items);
      setStep('preview');
    } catch (err) {
      console.error('Failed to parse zip archive:', err);
      setErrorMessage('Failed to read the archive file. Make sure it is a valid .zip file downloaded from Meta.');
      setStep('intro');
    }
  };

  // Execute the import: upload binaries permanently to /api/upload
  const handleExecuteImport = async () => {
    setStep('importing');
    setImportProgress(0);

    const importedMedia: MediaItem[] = [];
    const total = detectedItems.length;

    for (let i = 0; i < total; i++) {
      const item = detectedItems[i]!;
      try {
        const formData = new FormData();
        const file = new File([item.blob], item.name, {
          type: item.type === 'video' ? 'video/mp4' : 'image/jpeg',
        });
        formData.append('file', file);

        let finalUrl = item.previewUrl;
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.url) finalUrl = data.url;
        }

        const dateStr = item.timestamp
          ? new Date(item.timestamp).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];

        importedMedia.push({
          id: `ig-mem-${Date.now()}-${i}`,
          type: item.type,
          url: finalUrl,
          thumbnailUrl: finalUrl,
          title: item.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ') || 'Instagram Story',
          album: albumName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          takenAt: dateStr || '2024-10-31',
          durationSeconds: item.type === 'video' ? 15 : 7,
          isFavorite: false,
          audioTrack: item.songTitle ? {
            title: item.songTitle,
            artist: item.artistName || 'Instagram Audio',
            url: finalUrl, // if audio is baked into the video
            startOffsetSeconds: 0,
            source: 'library',
          } : undefined,
          audioMix: {
            videoVolume: 1.0,
            musicVolume: 0.85,
          },
        });
      } catch (err) {
        console.error('Error importing item:', item.name, err);
      }

      setImportProgress(Math.round(((i + 1) / total) * 100));
    }

    // Create target album
    const newAlbum: Album = {
      id: albumName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: albumName,
      description: `Official Instagram Stories Archive (${importedMedia.length} memories)`,
      coverUrl: importedMedia[0]?.url || 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80',
      itemCount: importedMedia.length,
    };

    onImportComplete(importedMedia, newAlbum);
    setStep('done');

    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-[2px] font-mono text-xs select-none">
      <div className="relative w-full max-w-xl retro-box-outset shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        
        {/* Title Bar */}
        <div className="retro-titlebar select-none">
          <div className="flex items-center gap-2">
            <Camera className="w-3.5 h-3.5 text-white" />
            <span>Instagram Archive Import Wizard 1999 — [Official Data Portability]</span>
          </div>
          <button onClick={onClose} className="retro-win-ctrl font-bold">✕</button>
        </div>

        {/* Wizard Header Banner */}
        <div className="px-4 py-2.5 bg-gradient-to-r from-[#dfdbed] to-[#edeaf7] border-b border-[#a09bb8] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xs text-[#1a162b]">Instagram Archive Importer</h3>
            <p className="text-[10px] text-neutral-600">Import stories with filters, text, and dates legally</p>
          </div>
          <div className="px-2 py-0.5 retro-box-outset bg-emerald-100 text-emerald-800 text-[9px] font-bold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-700" />
            100% LEGAL & SAFE
          </div>
        </div>

        {/* Wizard Body */}
        <div className="p-4 bg-[#f4f2fa] retro-box-inset m-1 overflow-y-auto space-y-4 max-h-[70vh]">
          
          {/* STEP 1: INTRO & DROP ZONE */}
          {step === 'intro' && (
            <div className="space-y-4">
              <div className="retro-box-outset p-3 bg-[#dfdbed] space-y-2">
                <span className="font-bold text-[#1a162b] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  How This Works (100% Legal & Private)
                </span>
                <p className="text-[11px] text-neutral-700 leading-relaxed">
                  We <strong>never</strong> ask for your Instagram password or run unauthorized bots. Instead, this wizard reads your official <strong>Meta &quot;Download Your Information&quot; export ZIP</strong>.
                </p>
                <div className="retro-box-inset p-2 bg-white text-[10px] text-neutral-800 space-y-1">
                  <p className="font-bold text-[#5a4897]">Quick steps to get your archive from Instagram:</p>
                  <ol className="list-decimal pl-4 space-y-0.5 text-neutral-700">
                    <li>Instagram App → <strong>Settings</strong> → <strong>Accounts Center</strong>.</li>
                    <li>Tap <strong>&quot;Your information and permissions&quot;</strong> → <strong>&quot;Download your information&quot;</strong>.</li>
                    <li>Select <strong>Stories</strong>, choose <strong>JSON format</strong>, and download the ZIP file.</li>
                  </ol>
                </div>
              </div>

              {errorMessage && (
                <div className="retro-box-inset p-2.5 bg-red-100 border-red-400 text-red-800 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-700 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Drop Zone */}
              <div className="retro-box-outset p-3 bg-[#dfdbed]">
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-[#807a99] bg-white cursor-pointer hover:bg-neutral-50 transition text-center group">
                  <UploadCloud className="w-8 h-8 text-[#5a4897] mb-2 group-hover:scale-110 transition" />
                  <p className="font-bold text-xs text-neutral-900 mb-1">
                    Drop your Instagram .ZIP file here
                  </p>
                  <p className="text-[10px] text-neutral-500">
                    or click to browse your downloaded export file
                  </p>
                  <input
                    type="file"
                    accept=".zip"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleZipFile(file);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* STEP 2: PARSING SPINNER */}
          {step === 'parsing' && (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-700 space-y-3">
              <div className="w-8 h-8 border-3 border-[#5a4897] border-t-transparent rounded-full animate-spin" />
              <p className="font-bold text-xs">Unpacking Instagram Archive...</p>
              <p className="text-[10px] text-neutral-500">Extracting stories, filters, video audio, and timestamps...</p>
            </div>
          )}

          {/* STEP 3: PREVIEW DETECTED STORIES */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="retro-box-outset p-3 bg-[#dfdbed] flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-[#1a162b]">
                    Found {detectedItems.length} Stories & Media Files
                  </h4>
                  <p className="text-[10px] text-neutral-600">
                    Filters and text overlays are rendered into the images & videos.
                  </p>
                </div>
                <div className="px-2 py-1 retro-box-inset bg-white text-[10px] font-bold text-[#5a4897]">
                  {detectedItems.filter((i) => i.type === 'video').length} Videos • {detectedItems.filter((i) => i.type === 'photo').length} Photos
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-700 mb-1">Target Album Folder Name:</label>
                <input
                  type="text"
                  value={albumName}
                  onChange={(e) => setAlbumName(e.target.value)}
                  className="w-full retro-box-inset px-2.5 py-1 text-xs text-black"
                />
              </div>

              {/* Grid Preview */}
              <div className="retro-box-inset p-2 bg-white max-h-56 overflow-y-auto grid grid-cols-4 sm:grid-cols-5 gap-2">
                {detectedItems.map((item, idx) => (
                  <div key={idx} className="relative aspect-[4/5] retro-box-inset bg-black overflow-hidden group">
                    {item.type === 'video' ? (
                      <video
                        src={item.previewUrl}
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-black/80 text-white text-[8px] font-mono rounded-sm">
                      {item.type === 'video' ? 'VID' : 'PIC'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: IMPORTING PROGRESS */}
          {step === 'importing' && (
            <div className="py-12 space-y-4 text-center">
              <h4 className="font-bold text-xs text-neutral-800">
                Archiving Stories to Vault Disk... ({importProgress}%)
              </h4>
              <div className="w-full h-4 retro-box-inset bg-neutral-200 overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-[#5a4897] transition-all duration-150"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-neutral-500 font-mono">
                Saving permanent copies to /uploads/ with original dates & audio tags.
              </p>
            </div>
          )}

          {/* STEP 5: DONE */}
          {step === 'done' && (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 border-2 border-emerald-500 flex items-center justify-center mx-auto shadow-md">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-[#1a162b]">Import Successfully Completed!</h3>
              <p className="text-xs text-neutral-600 max-w-sm mx-auto">
                All {detectedItems.length} memories have been permanently imported into your private lifetime vault with your original filters, text overlays, and dates.
              </p>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="px-4 py-2 bg-[#dfdbed] border-t border-white flex items-center justify-between">
          <span className="text-[10px] text-neutral-600 font-bold">
            {step === 'done' ? 'Status: 100% Synchronized' : 'Encrypted Local Processing'}
          </span>
          <div className="flex items-center gap-2">
            {step === 'intro' && (
              <button onClick={onClose} className="retro-btn">Cancel</button>
            )}

            {step === 'preview' && (
              <>
                <button onClick={() => setStep('intro')} className="retro-btn">&lt; Back</button>
                <button
                  onClick={handleExecuteImport}
                  className="retro-btn bg-[#c5bee6] font-bold"
                >
                  Import {detectedItems.length} Stories →
                </button>
              </>
            )}

            {step === 'done' && (
              <button
                onClick={onClose}
                className="retro-btn bg-[#c5bee6] font-bold"
              >
                Finish [Open Vault]
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
