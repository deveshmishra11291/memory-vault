'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MediaItem, Album } from '@/lib/types';
import { 
  Play, Film, Music, Heart, MapPin, Calendar, 
  Trash2, Sparkles, Image as ImageIcon, Folder, ArrowLeft, ArrowRight,
  HardDrive, Plus, Search, Download, FolderPlus, CheckSquare, Square,
  Copy, Layers, Check, X, Smartphone, Share2, Disc3, Eye, Grid
} from 'lucide-react';
import MoveToAlbumModal from '@/components/MoveToAlbumModal';
import VaultCard from '@/components/VaultCard';
import RetroSoundDeck from '@/components/RetroSoundDeck';

interface AlbumGridProps {
  items: MediaItem[];
  albums: Album[];
  selectedAlbum: string;
  onSelectAlbum: (albumId: string) => void;
  onOpenStory: (index: number) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onOpenUpload: () => void;
  onOpenNewAlbum: () => void;
  onOpenMusicSearch: () => void;
  onExportVault: () => void;
  onOpenIgImport: () => void;
  onMoveItemsToAlbum: (itemIds: string[], targetAlbumId: string, newAlbum?: Album, isMove?: boolean) => void;
  onDeleteAlbum: (albumId: string) => void;
  onClose: () => void;
  onOpenShareExtension?: () => void;
  isMobileSimulator?: boolean;
  onToggleMobileSimulator?: () => void;
}

export default function AlbumGrid({
  items,
  albums,
  selectedAlbum,
  onSelectAlbum,
  onOpenStory,
  onToggleFavorite,
  onDeleteItem,
  onOpenUpload,
  onOpenNewAlbum,
  onOpenMusicSearch,
  onExportVault,
  onOpenIgImport,
  onMoveItemsToAlbum,
  onDeleteAlbum,
  onClose,
  onOpenShareExtension,
  isMobileSimulator = false,
  onToggleMobileSimulator,
}: AlbumGridProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // View Mode: 'deck' (Collectible Trading Cards TCG style) vs 'classic' (Win95 Explorer Grid)
  const [viewMode, setViewMode] = useState<'deck' | 'classic'>('deck');

  // Window State
  const [isMaximized, setIsMaximized] = useState(false);

  // Checkbox Selection & Album Organize
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [targetMoveIds, setTargetMoveIds] = useState<string[]>([]);
  const [successToast, setSuccessToast] = useState('');

  // Retro Sound Deck State (Image 1 Silk Sonic / Winamp Gadget)
  const [showSoundDeck, setShowSoundDeck] = useState(true);
  const [deckPlaying, setDeckPlaying] = useState(false);
  const [deckTime, setDeckTime] = useState(93); // 1:33
  const [deckVolume, setDeckVolume] = useState(0.85);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Filter items by album
  const filteredItems = selectedAlbum === 'all'
    ? items
    : items.filter((item) => item.album === selectedAlbum);

  const activeAlbumObj = albums.find((a) => a.id === selectedAlbum) || albums[0];

  const videoItems = filteredItems.filter((i) => i.type === 'video');
  const photoItems = filteredItems.filter((i) => i.type === 'photo');

  // Pick first item with audio track for RetroSoundDeck or default to Silk Sonic
  const firstAudioItem = filteredItems.find((i) => i.audioTrack);
  const deckTrackTitle = firstAudioItem?.audioTrack?.title || 'Smokin Out The Window';
  const deckArtistName = firstAudioItem?.audioTrack?.artist || 'Silk Sonic';
  const deckArtwork = firstAudioItem?.thumbnailUrl || firstAudioItem?.url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=400&q=80';

  // Handle deck timer tick when playing
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (deckPlaying) {
      interval = setInterval(() => {
        setDeckTime((prev) => (prev >= 205 ? 0 : prev + 1));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [deckPlaying]);

  const handleToggleSelectCard = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedIds(filteredItems.map((i) => i.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleOpenMoveModal = (idsToMove: string[]) => {
    if (idsToMove.length === 0) return;
    setTargetMoveIds(idsToMove);
    setMoveModalOpen(true);
  };

  const handleConfirmMove = (itemIds: string[], targetAlbumId: string, newAlbum?: Album, isMove?: boolean) => {
    onMoveItemsToAlbum(itemIds, targetAlbumId, newAlbum, isMove);
    setSelectedIds([]);

    const targetAlbumName = newAlbum?.name 
      || albums.find((a) => a.id === targetAlbumId)?.name 
      || 'Album';

    setSuccessToast(`✓ ${itemIds.length} stor${itemIds.length === 1 ? 'y' : 'ies'} successfully ${isMove ? 'moved' : 'copied'} to "${targetAlbumName}"!`);
    setTimeout(() => setSuccessToast(''), 4500);
  };

  // Find thumbnail for first item being moved
  const firstItemThumbnail = items.find((m) => m.id === targetMoveIds[0])?.thumbnailUrl 
    || items.find((m) => m.id === targetMoveIds[0])?.url;

  const allFilteredSelected = filteredItems.length > 0 && selectedIds.length === filteredItems.length;

  return (
    <div className={`retro-box-outset shadow-2xl font-mono text-xs transition-all ${
      isMaximized 
        ? 'fixed inset-3 z-40 max-w-none mb-0 flex flex-col bg-[#dfdbed]' 
        : 'w-full mb-12 flex flex-col'
    }`}>
      
      {/* 1. Retro Title Bar with Working Minimize, Maximize, and Exit Buttons */}
      <div className="retro-titlebar select-none flex-shrink-0">
        <div className="flex items-center gap-2 truncate">
          <Folder className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
          <span className="truncate">
            My Memories — [C:\Vault\{activeAlbumObj?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'All'}]
          </span>
          <span className="text-[10px] text-amber-200 ml-2 hidden sm:inline-block">
            {viewMode === 'deck' ? '🎴 Collectible Deck Mode' : '📁 Win95 Explorer Mode'}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Minimize button: hides window to taskbar */}
          <button 
            type="button" 
            onClick={onClose} 
            className="retro-win-ctrl font-bold" 
            title="Minimize window"
          >
            _
          </button>
          {/* Maximize button: expands window full screen */}
          <button 
            type="button" 
            onClick={() => setIsMaximized(!isMaximized)} 
            className="retro-win-ctrl font-bold" 
            title={isMaximized ? "Restore window size" : "Maximize window full screen"}
          >
            {isMaximized ? '❐' : '□'}
          </button>
          {/* Exit / Close button: closes window */}
          <button 
            type="button" 
            onClick={onClose} 
            className="retro-win-ctrl font-bold" 
            title="Close window"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 2. Menu Bar */}
      <div className="px-2 py-1 bg-[#dfdbed] border-b border-[#a09bb8] flex items-center justify-between text-[11px] text-[#2d2642] select-none flex-shrink-0">
        <div className="flex gap-3">
          <span className="hover:bg-[#5a4897] hover:text-white px-1 cursor-pointer">File</span>
          <span className="hover:bg-[#5a4897] hover:text-white px-1 cursor-pointer">Edit</span>
          <span 
            onClick={() => setViewMode(viewMode === 'deck' ? 'classic' : 'deck')}
            className="hover:bg-[#5a4897] hover:text-white px-1 cursor-pointer font-bold"
          >
            View ({viewMode === 'deck' ? 'Cards' : 'Grid'})
          </span>
          <span className="hover:bg-[#5a4897] hover:text-white px-1 cursor-pointer">Favorites</span>
          <span 
            onClick={() => onOpenShareExtension && onOpenShareExtension()}
            className="hover:bg-[#5a4897] hover:text-white px-1 cursor-pointer text-indigo-800 font-bold"
          >
            iOS Setup
          </span>
        </div>

        {/* Delete current album shortcut in menu bar */}
        {selectedAlbum !== 'all' && (
          <button
            type="button"
            onClick={() => onDeleteAlbum(selectedAlbum)}
            className="text-rose-700 hover:bg-rose-100 hover:underline px-1 flex items-center gap-1 font-bold text-[10px]"
          >
            <Trash2 className="w-3 h-3 text-rose-600" />
            <span>Delete Current Album</span>
          </button>
        )}
      </div>

      {/* 3. Retro Toolbar (Desktop 1999 Style + Solution A iOS Ingest + View Mode Toggles) */}
      <div className="px-2 py-1.5 bg-[#dfdbed] border-b border-[#a09bb8] flex flex-wrap items-center gap-2 select-none flex-shrink-0">
        
        {/* Solution A 1-Tap iOS Share Extension Simulator */}
        {onOpenShareExtension && (
          <button
            onClick={onOpenShareExtension}
            className="retro-btn bg-gradient-to-r from-amber-200 to-amber-300 font-bold border-amber-600 text-black flex items-center gap-1.5 shadow"
            title="Solution A: 1-Tap iOS Share to Vault (App Store & Instagram)"
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-900" />
            <span>⚡ iOS Share to Vault</span>
          </button>
        )}

        {/* View Mode Switcher: Collectible Cards vs Classic Explorer */}
        <div className="flex items-center retro-box-inset p-0.5 bg-[#d4cee6]">
          <button
            onClick={() => setViewMode('deck')}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-xs flex items-center gap-1 transition ${
              viewMode === 'deck'
                ? 'bg-[#5a4897] text-white shadow-xs'
                : 'text-neutral-700 hover:text-black'
            }`}
            title="Collectible VaultCard Deck (Image 2 TCG Style)"
          >
            <Layers className="w-3 h-3" />
            <span>🎴 Collectible Cards</span>
          </button>

          <button
            onClick={() => setViewMode('classic')}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-xs flex items-center gap-1 transition ${
              viewMode === 'classic'
                ? 'bg-[#5a4897] text-white shadow-xs'
                : 'text-neutral-700 hover:text-black'
            }`}
            title="Classic Windows 95 Explorer Grid"
          >
            <Grid className="w-3 h-3" />
            <span>📁 Explorer Grid</span>
          </button>
        </div>

        {/* Toggle Sound Deck Widget */}
        <button
          onClick={() => setShowSoundDeck(!showSoundDeck)}
          className={`retro-btn flex items-center gap-1 ${
            showSoundDeck ? 'bg-[#c5bee6] font-bold' : ''
          }`}
          title="Toggle Retro Silk Sonic Sound Deck Gadget (Image 1)"
        >
          <Disc3 className={`w-3.5 h-3.5 ${deckPlaying ? 'text-rose-600 animate-spin' : 'text-neutral-700'}`} />
          <span>Sound Deck</span>
        </button>

        {/* Mobile iOS Simulator Mode Toggle */}
        {onToggleMobileSimulator && (
          <button
            onClick={onToggleMobileSimulator}
            className={`retro-btn flex items-center gap-1 ${
              isMobileSimulator ? 'bg-indigo-200 font-bold' : ''
            }`}
            title="Preview inside iPhone 16 Pro Frame"
          >
            <Smartphone className="w-3.5 h-3.5 text-indigo-800" />
            <span>{isMobileSimulator ? 'Desktop View' : '📱 iOS Frame'}</span>
          </button>
        )}

        <div className="w-px h-5 bg-[#a09bb8] mx-0.5" />

        <button
          onClick={onOpenUpload}
          className="retro-btn"
          title="Add New Memory"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-700" />
          <span>Add Memory</span>
        </button>

        <button
          onClick={onOpenNewAlbum}
          className="retro-btn"
          title="Create New Album"
        >
          <FolderPlus className="w-3.5 h-3.5 text-amber-700" />
          <span>New Album</span>
        </button>

        {/* Master Select All Checkbox Button */}
        <label 
          className={`retro-btn flex items-center gap-1.5 cursor-pointer transition ${
            selectedIds.length > 0 ? 'bg-[#5a4897] text-white font-bold' : 'bg-[#ede9f7]'
          }`}
          title="Select all stories in this album"
        >
          <input
            type="checkbox"
            checked={allFilteredSelected}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="w-3.5 h-3.5 cursor-pointer accent-[#5a4897]"
          />
          <span>
            {allFilteredSelected 
              ? 'Deselect All' 
              : `Select All (${filteredItems.length})`}
          </span>
          {selectedIds.length > 0 && !allFilteredSelected && (
            <span className="ml-0.5 px-1 bg-amber-400 text-black text-[9px] rounded-sm font-bold">
              {selectedIds.length}
            </span>
          )}
        </label>

        {/* Delete Album Toolbar Button */}
        {selectedAlbum !== 'all' && (
          <button
            type="button"
            onClick={() => onDeleteAlbum(selectedAlbum)}
            className="retro-btn text-rose-700 hover:bg-rose-100 font-bold flex items-center gap-1"
            title={`Delete "${activeAlbumObj?.name}" album folder`}
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Delete Album</span>
          </button>
        )}

        <button
          onClick={onOpenMusicSearch}
          className="retro-btn"
          title="Search Global Spotify/Apple Catalog"
        >
          <Music className="w-3.5 h-3.5 text-rose-600" />
          <span>Music Catalog</span>
        </button>

        <button
          onClick={onOpenIgImport}
          className="retro-btn bg-[#f3edf8]"
          title="Import Instagram Stories Archive (ZIP)"
        >
          <span className="text-rose-600 font-bold">IG</span>
          <span>Import Archive</span>
        </button>

        {filteredItems.length > 0 && (
          <button
            onClick={() => onOpenStory(0)}
            className="retro-btn bg-[#c5bee6] font-bold"
            title="Play All Stories with Soundtrack"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            <span>Play Stories ({filteredItems.length})</span>
          </button>
        )}

        <button
          onClick={onExportVault}
          className="retro-btn"
          title="Backup Vault"
        >
          <Download className="w-3.5 h-3.5 text-blue-700" />
          <span>Backup</span>
        </button>
      </div>

      {/* Success Notification Banner (Does not leave the album!) */}
      {successToast && (
        <div className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs flex items-center justify-between border-b border-emerald-800 animate-fadeIn select-none flex-shrink-0">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-200" />
            {successToast}
          </span>
          <button
            onClick={() => setSuccessToast('')}
            className="text-white hover:text-emerald-200 text-xs font-bold px-1.5 py-0.5 retro-box-outset bg-emerald-700"
          >
            ✕ Dismiss
          </button>
        </div>
      )}

      {/* Multi-Select Floating Action Bar (Appears whenever items are checked) */}
      {selectedIds.length > 0 && (
        <div className="px-3 py-2 bg-[#483a78] text-white border-b border-[#302554] flex flex-wrap items-center justify-between gap-2 select-none shadow-md flex-shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4" />
              {selectedIds.length} of {filteredItems.length} Stories Selected
            </span>

            <button
              onClick={() => setSelectedIds(filteredItems.map((i) => i.id))}
              className="px-2 py-0.5 retro-btn text-[10px] text-black font-bold"
            >
              Select All ({filteredItems.length})
            </button>

            {videoItems.length > 0 && (
              <button
                onClick={() => setSelectedIds(videoItems.map((i) => i.id))}
                className="px-2 py-0.5 retro-btn text-[10px] text-black"
              >
                Videos Only ({videoItems.length})
              </button>
            )}

            {photoItems.length > 0 && (
              <button
                onClick={() => setSelectedIds(photoItems.map((i) => i.id))}
                className="px-2 py-0.5 retro-btn text-[10px] text-black"
              >
                Photos Only ({photoItems.length})
              </button>
            )}

            <button
              onClick={() => setSelectedIds([])}
              className="px-2 py-0.5 retro-btn text-[10px] text-black"
            >
              Clear
            </button>
          </div>

          <button
            onClick={() => handleOpenMoveModal(selectedIds)}
            className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs retro-box-outset flex items-center gap-1.5 shadow"
          >
            <Copy className="w-3.5 h-3.5 text-black" />
            <span>Copy {selectedIds.length} Stories to Album...</span>
          </button>
        </div>
      )}

      {/* 4. Address Bar */}
      <div className="px-2 py-1 bg-[#dfdbed] border-b border-[#a09bb8] flex items-center gap-2 text-[11px] select-none flex-shrink-0">
        <span className="text-neutral-600 font-bold">Address:</span>
        <div className="flex-1 retro-box-inset px-2 py-0.5 bg-white text-black font-mono text-[11px] truncate flex items-center justify-between">
          <span>C:\MemoryVault\Albums\{activeAlbumObj?.name || 'All_Memories'}</span>
          <span className="text-neutral-400 text-[10px]">▼</span>
        </div>
      </div>

      {/* 5. Highlight Folders (Story Circles — 1999 Edition with Delete Option) */}
      <div className="p-3 bg-[#e8e5f2] border-b border-[#a09bb8] flex items-center gap-3 overflow-x-auto select-none flex-shrink-0">
        {albums.map((album) => {
          const isSelected = selectedAlbum === album.id;
          return (
            <div
              key={album.id}
              onClick={() => {
                onSelectAlbum(album.id);
                setSelectedIds([]);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 retro-box-outset cursor-pointer transition flex-shrink-0 ${
                isSelected
                  ? 'border-t-[#332d47] border-l-[#332d47] border-b-white border-r-white bg-[#cec8e3]'
                  : 'hover:bg-[#f1effa]'
              }`}
            >
              <div className="w-6 h-6 rounded-md overflow-hidden border border-[#332d47] flex-shrink-0 bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={album.coverUrl}
                  alt={album.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="truncate text-[11px]">
                <span className={`block truncate ${isSelected ? 'font-bold text-[#1a162b]' : 'text-neutral-700'}`}>
                  {album.name}
                </span>
                <span className="text-[9px] text-neutral-500">
                  {album.itemCount} items
                </span>
              </div>

              {/* Delete Icon on Album Pill for Custom Albums */}
              {album.id !== 'all' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAlbum(album.id);
                  }}
                  className="p-1 hover:bg-rose-200 rounded text-neutral-400 hover:text-rose-700 ml-1 transition"
                  title={`Delete album "${album.name}"`}
                >
                  <Trash2 className="w-3 h-3 text-rose-600" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 6. Media Display Viewport (Inside Retro Inset Viewport) */}
      <div className={`p-4 bg-[#f4f2fa] retro-box-inset m-1 ${
        isMaximized ? 'flex-1 overflow-y-auto min-h-0' : 'min-h-[480px]'
      }`}>
        
        {/* Retro Sound Deck Header Gadget (Image 1 Silk Sonic / Winamp Player) */}
        {showSoundDeck && (
          <div className="mb-6 p-3 bg-[#e8e4f5] retro-box-outset flex flex-wrap items-center justify-between gap-4 border border-[#bbb4d4]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-[#281c44] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Tactile Retro Sound Gadget
                </span>
                <span className="px-1.5 py-0.2 bg-[#5a4897] text-white text-[9px] rounded-xs font-mono">
                  1999 Silk Sonic Edition
                </span>
              </div>
              <p className="text-[10px] text-neutral-600 max-w-md">
                Tactile stereo player with spinning mini-disc, tape mechanism, vertical volume fader, and pixel track display.
              </p>
            </div>

            <div className="flex-shrink-0">
              <RetroSoundDeck
                trackTitle={deckTrackTitle}
                artistName={deckArtistName}
                artworkUrl={deckArtwork}
                isPlaying={deckPlaying}
                onTogglePlay={() => setDeckPlaying(!deckPlaying)}
                currentTime={deckTime}
                duration={205}
                volume={deckVolume}
                onVolumeChange={setDeckVolume}
              />
            </div>
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-neutral-500 font-mono">
            <Sparkles className="w-8 h-8 text-neutral-400 mb-2" />
            <p className="font-bold text-xs text-neutral-700">This album is empty</p>
            <p className="text-[11px] text-neutral-500 mt-1">
              Click &quot;⚡ iOS Share to Vault&quot; or &quot;Add Memory&quot; on the toolbar to add memories.
            </p>
          </div>
        ) : viewMode === 'deck' ? (
          /* Collectible Vault Card Deck View (Inspired by Image 2 - 100% Original Copyright-Safe) */
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="font-bold text-xs text-neutral-700">
                Collectible Trading Cards ({filteredItems.length} cards)
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">
                Hover to tilt 3D card & reveal holographic sheen
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center py-2">
              {filteredItems.map((item, index) => (
                <VaultCard
                  key={item.id}
                  item={item}
                  isSelected={selectedIds.includes(item.id)}
                  onToggleSelect={handleToggleSelectCard}
                  onOpenStory={() => onOpenStory(index)}
                  onToggleFavorite={onToggleFavorite}
                  onCopyItem={(id) => handleOpenMoveModal([id])}
                  onDeleteItem={onDeleteItem}
                  rarity={item.cardStyle?.rarity || 'trap-magenta'}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Classic Windows 95 Explorer Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
            {filteredItems.map((item, index) => {
              const isSelected = selectedIds.includes(item.id);
              const itemAlbumObj = albums.find((a) => a.id === item.album);

              return (
                <div
                  key={item.id}
                  className={`retro-box-outset p-2 bg-[#dfdbed] transition group flex flex-col justify-between relative ${
                    isSelected ? 'ring-2 ring-[#5a4897] bg-[#cec8e3]' : ''
                  }`}
                >
                  {/* Real, Clickable Checkbox Badge on Every Card */}
                  <div 
                    className="absolute top-2 left-2 z-20 flex items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <label 
                      className={`flex items-center gap-1 cursor-pointer px-1.5 py-0.5 rounded shadow border text-[10px] font-bold select-none transition ${
                        isSelected 
                          ? 'bg-[#5a4897] text-white border-white' 
                          : 'bg-white/90 text-neutral-800 border-black/40 hover:bg-white'
                      }`}
                      title={isSelected ? 'Deselect this story' : 'Select this story'}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectCard(item.id)}
                        className="w-3.5 h-3.5 cursor-pointer accent-[#5a4897]"
                      />
                      <span>{isSelected ? '✓' : 'Select'}</span>
                    </label>
                  </div>

                  {/* Media Viewport (Click to Play this story in StoryViewer) */}
                  <div 
                    onClick={() => onOpenStory(index)}
                    className="relative aspect-[4/3] retro-box-inset bg-black overflow-hidden mb-2 cursor-pointer"
                  >
                    {failedImages[item.id] ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-[#2d2642] p-4 text-center text-white">
                        <ImageIcon className="w-8 h-8 text-neutral-400 mb-1" />
                        <span className="text-[11px] font-bold line-clamp-1">{item.title}</span>
                        <span className="text-[9px] text-neutral-400 mt-0.5">Click to play sound</span>
                      </div>
                    ) : item.type === 'video' ? (
                      <video
                        src={item.url}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        onError={() => setFailedImages((prev) => ({ ...prev, [item.id]: true }))}
                        onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
                        onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumbnailUrl || item.url}
                        alt={item.title}
                        onError={() => setFailedImages((prev) => ({ ...prev, [item.id]: true }))}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    )}

                    {/* Top Badges */}
                    <div className="absolute top-1.5 right-1.5 flex items-center gap-1 pointer-events-none">
                      <span className="px-1.5 py-0.5 rounded-sm bg-black/75 text-white font-mono text-[9px] border border-white/20">
                        {item.type === 'video' ? '🎥 VIDEO' : '📸 PHOTO'}
                      </span>

                      {item.audioTrack && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-black/75 text-white font-mono text-[9px] border border-white/20 max-w-[60%] truncate">
                          <Music className="w-2.5 h-2.5 text-rose-400 flex-shrink-0" />
                          <span className="truncate">{item.audioTrack.title}</span>
                        </span>
                      )}
                    </div>

                    {/* Hover Play Icon Overlay */}
                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/80 border border-black flex items-center justify-center text-black shadow-lg">
                        <Play className="w-4 h-4 fill-black translate-x-0.5" />
                      </div>
                    </div>
                  </div>

                  {/* Card Metadata Details */}
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-1">
                      <h4 
                        onClick={() => onOpenStory(index)}
                        className="font-bold text-xs text-[#1a162b] truncate leading-tight cursor-pointer hover:underline"
                        title={item.title}
                      >
                        {item.title}
                      </h4>
                      
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenMoveModal([item.id])}
                          className="p-1 hover:bg-[#cec8e3] rounded text-[#5a4897]"
                          title="Copy to another album..."
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onToggleFavorite(item.id)}
                          className="p-1 hover:bg-[#cec8e3] rounded"
                          title="Favorite"
                        >
                          <Heart
                            className={`w-3.5 h-3.5 ${
                              item.isFavorite ? 'fill-rose-600 text-rose-600' : 'text-neutral-500'
                            }`}
                          />
                        </button>
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1 hover:bg-red-200 rounded text-neutral-500 hover:text-red-700"
                          title="Delete from Vault"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-neutral-600 font-mono">
                      <span>{item.takenAt}</span>
                      <span className="truncate max-w-[120px] font-bold text-[#5a4897]">
                        📁 {itemAlbumObj?.name || 'Vault'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. Bottom Status Bar */}
      <div className="px-3 py-1 bg-[#dfdbed] text-[11px] text-neutral-700 flex justify-between select-none border-t border-[#ffffff] flex-shrink-0">
        <span>{filteredItems.length} object(s) in album • {selectedIds.length} selected</span>
        <span className="flex items-center gap-2">
          <span>Mode: {viewMode === 'deck' ? 'TCG Cards' : 'Explorer'}</span>
          <span>•</span>
          <span>Disk: 100% Private Encrypted Vault</span>
        </span>
      </div>

      {/* Copy / Add to Album Dialog */}
      <MoveToAlbumModal
        isOpen={moveModalOpen}
        onClose={() => setMoveModalOpen(false)}
        selectedItemIds={targetMoveIds}
        albums={albums}
        firstItemThumbnail={firstItemThumbnail}
        onConfirm={handleConfirmMove}
      />
    </div>
  );
}