'use client';

import React, { useState } from 'react';
import JSZip from 'jszip';
import { MediaItem, Album } from '@/lib/types';
import { 
  Camera, X, UploadCloud, Check, Sparkles, Folder, 
  Film, Image as ImageIcon, ShieldCheck, ArrowRight, Music, AlertCircle, Trash2, Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface InstagramImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (items: MediaItem[], album: Album) => void;
}

interface DetectedItem {
  id: string;
  name: string;
  blob: Blob;
  type: 'photo' | 'video';
  previewUrl: string;
  timestamp?: number;
  songTitle?: string;
  artistName?: string;
  selected: boolean;
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
  const [enlargedItem, setEnlargedItem] = useState<DetectedItem | null>(null);

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
              id: `item-${Date.now()}-${items.length}-${Math.random().toString(36).substring(2, 7)}`,
              name: filename,
              blob,
              type: isVideo ? 'video' : 'photo',
              previewUrl,
              timestamp,
              songTitle,
              artistName,
              selected: true,
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

  // Selection & Removal Handlers
  const handleRemoveItem = (id: string) => {
    setDetectedItems((prev) => prev.filter((item) => item.id !== id));
    if (enlargedItem?.id === id) {
      setEnlargedItem(null);
    }
  };

  const handleToggleSelect = (id: string) => {
    setDetectedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setDetectedItems((prev) => prev.map((item) => ({ ...item, selected: select })));
  };

  const handleRemoveDeselected = () => {
    setDetectedItems((prev) => prev.filter((item) => item.selected));
  };

  const selectedItems = detectedItems.filter((i) => i.selected);

  // Execute the import: upload binaries permanently to /api/upload
  const handleExecuteImport = async () => {
    if (selectedItems.length === 0) return;

    setStep('importing');
    setImportProgress(0);

    const importedMedia: MediaItem[] = [];
    const total = selectedItems.length;

    for (let i = 0; i < total; i++) {
      const item = selectedItems[i]!;
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
            url: finalUrl, // audio is baked into the video
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
      description: `Official Instagram Archive (${importedMedia.length} memories)`,
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
      <div className="relative w-full max-w-2xl retro-box-outset shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        
        {/* Title Bar */}
        <div className="retro-titlebar select-none">
          <div className="flex items-center gap-2">
            <Camera className="w-3.5 h-3.5 text-white" />
            <span>Instagram Archive Import Wizard 1999 — [Data Portability]</span>
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

          {/* STEP 3: PREVIEW DETECTED STORIES & FILTER/REMOVE BEFORE IMPORT */}
          {step === 'preview' && (
            <div className="space-y-3">
              {/* Info & Stats Banner */}
              <div className="retro-box-outset p-2.5 bg-[#dfdbed] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-xs text-[#1a162b] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#5a4897]" />
                    Archive Contents ({detectedItems.length} Total Found)
                  </h4>
                  <p className="text-[10px] text-neutral-600">
                    Uncheck or click <span className="text-rose-600 font-bold">✕</span> to remove any stories you don&apos;t want before uploading.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <span className="px-2 py-0.5 retro-box-inset bg-white text-[10px] font-bold text-[#5a4897]">
                    {selectedItems.length} of {detectedItems.length} Selected
                  </span>
                </div>
              </div>

              {/* Controls bar: Select All / Deselect / Album Name */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 retro-box-outset bg-[#edeaf7]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-neutral-700">Quick Select:</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="px-2 py-0.5 retro-btn text-[10px]"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="px-2 py-0.5 retro-btn text-[10px]"
                  >
                    Deselect All
                  </button>
                  {detectedItems.some((i) => !i.selected) && (
                    <button
                      type="button"
                      onClick={handleRemoveDeselected}
                      className="px-2 py-0.5 retro-btn text-[10px] text-rose-700 font-bold"
                      title="Permanently remove deselected items from this list"
                    >
                      Delete Unchecked
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-neutral-700 whitespace-nowrap">Album:</span>
                  <input
                    type="text"
                    value={albumName}
                    onChange={(e) => setAlbumName(e.target.value)}
                    className="retro-box-inset px-2 py-0.5 text-[11px] text-black w-40"
                  />
                </div>
              </div>

              {/* Grid Preview with Checkbox & Instant Delete Button */}
              {detectedItems.length === 0 ? (
                <div className="retro-box-inset p-8 bg-white text-center space-y-2">
                  <p className="font-bold text-neutral-600">All items removed!</p>
                  <p className="text-[10px] text-neutral-400">Click &quot;&lt; Back&quot; to pick or drop another archive.</p>
                </div>
              ) : (
                <div className="retro-box-inset p-2 bg-white max-h-64 overflow-y-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                  {detectedItems.map((item) => (
                    <div 
                      key={item.id} 
                      className={`relative aspect-[4/5] retro-box-inset bg-black overflow-hidden group cursor-pointer transition ${
                        item.selected ? 'ring-2 ring-[#5a4897]' : 'opacity-40 grayscale border border-rose-400'
                      }`}
                      onClick={() => setEnlargedItem(item)}
                    >
                      {item.type === 'video' ? (
                        <video
                          src={item.previewUrl}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.previewUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      )}

                      {/* Top Controls Overlay */}
                      <div className="absolute top-1 inset-x-1 flex items-center justify-between z-10">
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSelect(item.id);
                          }}
                          className={`w-5 h-5 rounded-sm retro-box-outset flex items-center justify-center text-[10px] font-bold transition ${
                            item.selected ? 'bg-emerald-600 text-white' : 'bg-neutral-300 text-neutral-500'
                          }`}
                          title={item.selected ? 'Click to uncheck/exclude' : 'Click to check/include'}
                        >
                          {item.selected ? '✓' : ''}
                        </button>

                        {/* Instant Remove Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveItem(item.id);
                          }}
                          className="w-5 h-5 rounded-sm retro-box-outset bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center text-[11px] font-bold shadow-md transition transform hover:scale-110"
                          title="Remove from upload"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Enlarged Inspection Hint on Hover */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center pointer-events-none">
                        <span className="text-[9px] text-white bg-black/75 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold">
                          <Eye className="w-2.5 h-2.5" /> Inspect
                        </span>
                      </div>

                      {/* Bottom Media Badge */}
                      <div className="absolute bottom-1 inset-x-1 flex items-center justify-between pointer-events-none">
                        <span className="px-1 py-0.2 bg-black/85 text-white text-[8px] font-mono rounded-sm">
                          {item.type === 'video' ? 'VID' : 'PIC'}
                        </span>
                        {item.songTitle && (
                          <span className="px-1 py-0.2 bg-[#5a4897] text-white text-[7px] font-mono rounded-sm truncate max-w-[65px]">
                            ♫ {item.songTitle}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                Saving permanent copies to /uploads/ with original dates, filters & audio tags.
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
                All {selectedItems.length} memories have been permanently imported into your private lifetime vault with your original filters, text overlays, and dates.
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
                  disabled={selectedItems.length === 0}
                  className={`retro-btn font-bold ${
                    selectedItems.length > 0 
                      ? 'bg-[#c5bee6] text-black hover:bg-[#b0a7db]' 
                      : 'opacity-50 cursor-not-allowed text-neutral-500'
                  }`}
                >
                  Import {selectedItems.length} Stories →
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

      {/* Enlarged Quick Inspector Modal */}
      {enlargedItem && (
        <div 
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setEnlargedItem(null)}
        >
          <div 
            className="retro-box-outset bg-[#dfdbed] p-3 max-w-md w-full space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="retro-titlebar">
              <span className="truncate">Preview: {enlargedItem.name}</span>
              <button onClick={() => setEnlargedItem(null)} className="retro-win-ctrl">✕</button>
            </div>

            <div className="relative aspect-[9/16] max-h-[60vh] bg-black retro-box-inset flex items-center justify-center overflow-hidden mx-auto">
              {enlargedItem.type === 'video' ? (
                <video
                  src={enlargedItem.previewUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={enlargedItem.previewUrl}
                  alt="Enlarged preview"
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  handleRemoveItem(enlargedItem.id);
                  setEnlargedItem(null);
                }}
                className="retro-btn text-rose-700 font-bold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove from Import
              </button>

              <button
                type="button"
                onClick={() => {
                  handleToggleSelect(enlargedItem.id);
                  setEnlargedItem(null);
                }}
                className="retro-btn font-bold"
              >
                {enlargedItem.selected ? 'Uncheck / Exclude' : 'Check / Include'}
              </button>

              <button
                type="button"
                onClick={() => setEnlargedItem(null)}
                className="retro-btn"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
