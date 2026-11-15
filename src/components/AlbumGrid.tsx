'use client';

import React, { useState } from 'react';
import { MediaItem, Album } from '@/lib/types';
import { 
  Play, Film, Music, Heart, MapPin, Calendar, 
  Trash2, Sparkles, Image as ImageIcon, Folder, ArrowLeft, ArrowRight,
  HardDrive, Plus, Search, Download, FolderPlus, CheckSquare, Square,
  Copy, Layers, Check, X, Smartphone, Share2, Disc3, Eye, Grid
} from 'lucide-react';
import MoveToAlbumModal from '@/components/MoveToAlbumModal';
import VaultCard from '@/components/VaultCard';
import VaultCardDeckSlider from '@/components/VaultCardDeckSlider';
import RetroPlayerCard from '@/components/RetroPlayerCard';

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
  // View Mode: 'classic' (Retro Player Grid - user default) vs 'deck' (Collectible Trading Cards Deck)
  const [viewMode, setViewMode] = useState<'classic' | 'deck'>('classic');

  // Deck sub-mode: 'slider' (Swipe/Slide 1 card at a time) vs 'grid' (All cards overview)
  const [deckSubMode, setDeckSubMode] = useState<'slider' | 'grid'>('slider');

  // Window State
  const [isMaximized, setIsMaximized] = useState(false);

  // Checkbox Selection & Album Organize
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [targetMoveIds, setTargetMoveIds] = useState<string[]>([]);
  const [successToast, setSuccessToast] = useState('');

  // Filter items by album
  const filteredItems = selectedAlbum === 'all'
    ? items
    : items.filter((item) => item.album === selectedAlbum);

  const activeAlbumObj = albums.find((a) => a.id === selectedAlbum) || albums[0];

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
    <div className={`retro-box-outset shadow-2xl font-mono text-xs transition-all w-full max-w-full overflow-x-hidden ${
      isMaximized 
        ? 'fixed inset-3 z-40 max-w-none mb-0 flex flex-col bg-[#dfdbed]' 
        : 'w-full mb-12 flex flex-col'
    }`}>
      
      {/* 1. Retro Title Bar with Working Minimize, Maximize, and Exit Buttons */}
      <div className="retro-titlebar select-none flex-shrink-0">
        <div className="flex items-center gap-2 truncate min-w-0">
          <Folder className="w-3.5 h-3.5 text-amber-300 flex-shrink-0" />
          <span className="truncate">
            My Memories — [C:\Vault\{activeAlbumObj?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'All'}]
          </span>
          <span className="text-[10px] text-amber-200 ml-1 hidden md:inline-block truncate">
            {viewMode === 'classic' ? '🎵 Player Grid Mode' : '🎴 Collectible Deck Mode'}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button 
            type="button" 
            onClick={onClose} 
            className="retro-win-ctrl font-bold" 
            title="Minimize window"
          >
            _
          </button>
          <button 
            type="button" 
            onClick={() => setIsMaximized(!isMaximized)} 
            className="retro-win-ctrl font-bold" 
            title={isMaximized ? "Restore window size" : "Maximize window full screen"}
          >
            {isMaximized ? '❐' : '□'}
          </button>
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
      <div className="px-2 py-1 bg-[#dfdbed] border-b border-[#a09bb8] flex items-center justify-between text-[11px] text-[#2d2642] select-none flex-shrink-0 overflow-x-auto">
        <div className="flex gap-2 sm:gap-3 flex-shrink-0">
          <span className="hover:bg-[#5a4897] hover:text-white px-1 cursor-pointer">File</span>
          <span className="hover:bg-[#5a4897] hover:text-white px-1 cursor-pointer">Edit</span>
          <span 
            onClick={() => setViewMode(viewMode === 'classic' ? 'deck' : 'classic')}
            className="hover:bg-[#5a4897] hover:text-white px-1 cursor-pointer font-bold"
          >
            View ({viewMode === 'classic' ? 'Player Grid' : 'Trading Cards'})
          </span>
          <span className="hover:bg-[#5a4897] hover:text-white px-1 cursor-pointer">Favorites</span>
          <span 
            onClick={() => onOpenShareExtension && onOpenShareExtension()}
            className="hover:bg-[#5a4897] hover:text-white px-1 cursor-pointer text-indigo-800 font-bold"
          >
            iOS Setup
          </span>
        </div>

        {selectedAlbum !== 'all' && (
          <button
            type="button"
            onClick={() => onDeleteAlbum(selectedAlbum)}
            className="text-rose-700 hover:bg-rose-100 hover:underline px-1 flex items-center gap-1 font-bold text-[10px] flex-shrink-0 ml-2"
          >
            <Trash2 className="w-3 h-3 text-rose-600" />
            <span className="hidden sm:inline">Delete Album</span>
          </button>
        )}
      </div>

      {/* 3. Retro Toolbar (Desktop 1999 Style + Solution A iOS Ingest + View Mode Toggles) */}
      <div className="px-2 py-1.5 bg-[#dfdbed] border-b border-[#a09bb8] flex flex-wrap items-center gap-1.5 select-none flex-shrink-0 max-w-full">
        
        {/* Solution A 1-Tap iOS Share Extension Simulator */}
        {onOpenShareExtension && (
          <button
            onClick={onOpenShareExtension}
            className="retro-btn bg-gradient-to-r from-amber-200 to-amber-300 font-bold border-amber-600 text-black flex items-center gap-1 shadow flex-shrink-0 text-[10px]"
            title="Solution A: 1-Tap iOS Share to Vault (App Store & Instagram)"
          >
            <Share2 className="w-3 h-3 text-indigo-900" />
            <span>⚡ Share Ingest</span>
          </button>
        )}

        {/* View Mode Switcher: Player Grid vs Trading Cards Deck */}
        <div className="flex items-center retro-box-inset p-0.5 bg-[#d4cee6] flex-shrink-0">
          <button
            onClick={() => setViewMode('classic')}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-xs flex items-center gap-1 transition ${
              viewMode === 'classic'
                ? 'bg-[#5a4897] text-white shadow-xs'
                : 'text-neutral-700 hover:text-black'
            }`}
            title="Retro Player Grid (Silk Sonic Player Style)"
          >
            <Grid className="w-3 h-3" />
            <span>🎵 Player Grid</span>
          </button>

          <button
            onClick={() => setViewMode('deck')}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-xs flex items-center gap-1 transition ${
              viewMode === 'deck'
                ? 'bg-[#5a4897] text-white shadow-xs'
                : 'text-neutral-700 hover:text-black'
            }`}
            title="Collectible Trading Cards Deck (TCG Style)"
          >
            <Layers className="w-3 h-3" />
            <span>🎴 Cards Deck</span>
          </button>
        </div>

        {/* Mobile iOS Simulator Mode Toggle */}
        {onToggleMobileSimulator && (
          <button
            onClick={onToggleMobileSimulator}
            className={`retro-btn flex items-center gap-1 flex-shrink-0 text-[10px] ${
              isMobileSimulator ? 'bg-indigo-200 font-bold' : ''
            }`}
            title="Toggle iPhone 16 Pro Frame"
          >
            <Smartphone className="w-3 h-3 text-indigo-800" />
            <span>{isMobileSimulator ? 'Desktop' : '📱 iOS View'}</span>
          </button>
        )}

        <button
          onClick={onOpenUpload}
          className="retro-btn flex items-center gap-1 flex-shrink-0 text-[10px]"
          title="Add New Memory"
        >
          <Plus className="w-3 h-3 text-emerald-700" />
          <span>Add</span>
        </button>

        <button
          onClick={onOpenNewAlbum}
          className="retro-btn flex items-center gap-1 flex-shrink-0 text-[10px]"
          title="Create New Album"
        >
          <FolderPlus className="w-3 h-3 text-amber-700" />
          <span>New Album</span>
        </button>

        {/* Master Select All Checkbox Button */}
        <label 
          className={`retro-btn flex items-center gap-1 cursor-pointer transition flex-shrink-0 text-[10px] ${
            selectedIds.length > 0 ? 'bg-[#5a4897] text-white font-bold' : 'bg-[#ede9f7]'
          }`}
          title="Select all stories in this album"
        >
          <input
            type="checkbox"
            checked={allFilteredSelected}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="w-3 h-3 cursor-pointer accent-[#5a4897]"
          />
          <span>
            {allFilteredSelected 
              ? 'Deselect All' 
              : `Select (${filteredItems.length})`}
          </span>
        </label>

        {filteredItems.length > 0 && (
          <button
            onClick={() => onOpenStory(0)}
            className="retro-btn bg-[#c5bee6] font-bold flex items-center gap-1 flex-shrink-0 text-[10px]"
            title="Play All Stories in Player"
          >
            <Play className="w-3 h-3 fill-black" />
            <span>Play All</span>
          </button>
        )}

        <button
          onClick={onExportVault}
          className="retro-btn flex items-center gap-1 flex-shrink-0 text-[10px]"
          title="Backup Vault"
        >
          <Download className="w-3 h-3 text-blue-700" />
          <span>Backup</span>
        </button>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs flex items-center justify-between border-b border-emerald-800 animate-fadeIn select-none flex-shrink-0">
          <span className="flex items-center gap-1.5 truncate">
            <Check className="w-3.5 h-3.5 text-emerald-200 flex-shrink-0" />
            <span className="truncate">{successToast}</span>
          </span>
          <button
            onClick={() => setSuccessToast('')}
            className="text-white hover:text-emerald-200 text-[10px] font-bold px-1 py-0.5 retro-box-outset bg-emerald-700 flex-shrink-0 ml-2"
          >
            ✕ Dismiss
          </button>
        </div>
      )}

      {/* Multi-Select Floating Action Bar */}
      {selectedIds.length > 0 && (
        <div className="px-3 py-1.5 bg-[#483a78] text-white border-b border-[#302554] flex flex-wrap items-center justify-between gap-2 select-none shadow-md flex-shrink-0">
          <span className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5" />
            {selectedIds.length} Stories Selected
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedIds([])}
              className="px-2 py-0.5 retro-btn text-[10px] text-black"
            >
              Clear
            </button>

            <button
              onClick={() => handleOpenMoveModal(selectedIds)}
              className="px-2.5 py-0.5 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs retro-box-outset flex items-center gap-1 shadow"
            >
              <Copy className="w-3 h-3 text-black" />
              <span>Copy to Album...</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Address Bar */}
      <div className="px-2 py-1 bg-[#dfdbed] border-b border-[#a09bb8] flex items-center gap-2 text-[11px] select-none flex-shrink-0">
        <span className="text-neutral-600 font-bold hidden sm:inline">Address:</span>
        <div className="flex-1 retro-box-inset px-2 py-0.5 bg-white text-black font-mono text-[10px] sm:text-[11px] truncate flex items-center justify-between">
          <span className="truncate">C:\MemoryVault\Albums\{activeAlbumObj?.name || 'All_Memories'}</span>
          <span className="text-neutral-400 text-[9px] ml-1">▼</span>
        </div>
      </div>

      {/* 5. Highlight Folders (Story Circles — 1999 Edition with Delete Option) */}
      <div className="p-2 sm:p-3 bg-[#e8e5f2] border-b border-[#a09bb8] flex items-center gap-2 sm:gap-3 overflow-x-auto select-none flex-shrink-0">
        {albums.map((album) => {
          const isSelected = selectedAlbum === album.id;
          return (
            <div
              key={album.id}
              onClick={() => {
                onSelectAlbum(album.id);
                setSelectedIds([]);
              }}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 retro-box-outset cursor-pointer transition flex-shrink-0 ${
                isSelected
                  ? 'border-t-[#332d47] border-l-[#332d47] border-b-white border-r-white bg-[#cec8e3]'
                  : 'hover:bg-[#f1effa]'
              }`}
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md overflow-hidden border border-[#332d47] flex-shrink-0 bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={album.coverUrl}
                  alt={album.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="truncate text-[10px] sm:text-[11px] max-w-[90px] sm:max-w-none">
                <span className={`block truncate ${isSelected ? 'font-bold text-[#1a162b]' : 'text-neutral-700'}`}>
                  {album.name}
                </span>
                <span className="text-[8px] sm:text-[9px] text-neutral-500">
                  {album.itemCount} items
                </span>
              </div>

              {album.id !== 'all' && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAlbum(album.id);
                  }}
                  className="p-0.5 hover:bg-rose-200 rounded text-neutral-400 hover:text-rose-700 ml-0.5 transition"
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
      <div className={`p-2 sm:p-4 bg-[#f4f2fa] retro-box-inset m-1 max-w-full overflow-x-hidden ${
        isMaximized ? 'flex-1 overflow-y-auto min-h-0' : 'min-h-[480px]'
      }`}>
        
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-neutral-500 font-mono">
            <Sparkles className="w-8 h-8 text-neutral-400 mb-2" />
            <p className="font-bold text-xs text-neutral-700">This album is empty</p>
            <p className="text-[11px] text-neutral-500 mt-1">
              Click &quot;⚡ Share Ingest&quot; or &quot;Add&quot; on the toolbar to add memories.
            </p>
          </div>
        ) : viewMode === 'classic' ? (
          /* 1. Retro Player Grid View: Each item is formatted like the Silk Sonic / Winamp Player Widget! */
          <div className="max-w-full overflow-hidden">
            <div className="flex items-center justify-between mb-3 px-1 flex-wrap gap-2">
              <span className="font-bold text-xs text-neutral-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Retro Sound Players ({filteredItems.length} memories)
              </span>
              <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded-xs border border-emerald-300">
                Click any player to open
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 justify-items-center py-2 max-w-full">
              {filteredItems.map((item, index) => (
                <RetroPlayerCard
                  key={item.id}
                  item={item}
                  isSelected={selectedIds.includes(item.id)}
                  onToggleSelect={handleToggleSelectCard}
                  onOpenStory={() => onOpenStory(index)}
                  onToggleFavorite={onToggleFavorite}
                  onCopyItem={(id) => handleOpenMoveModal([id])}
                  onDeleteItem={onDeleteItem}
                />
              ))}
            </div>
          </div>
        ) : (
          /* 2. Collectible Trading Cards Deck View with Swipe Slider */
          <div className="max-w-full overflow-hidden">
            <div className="flex items-center justify-between mb-3 px-1 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-neutral-800">
                  Collectible Cards ({filteredItems.length})
                </span>
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-1.5 py-0.2 rounded-xs border border-emerald-300">
                  Tap card to open
                </span>
              </div>

              <div className="flex items-center retro-box-inset p-0.5 bg-[#dfdbed]">
                <button
                  onClick={() => setDeckSubMode('slider')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-xs flex items-center gap-1 transition ${
                    deckSubMode === 'slider'
                      ? 'bg-[#5a4897] text-white shadow-xs'
                      : 'text-neutral-700 hover:text-black'
                  }`}
                  title="Swipeable 1-Card Slider Mode"
                >
                  <Layers className="w-3 h-3" />
                  <span>🎴 Swipe Deck</span>
                </button>
                <button
                  onClick={() => setDeckSubMode('grid')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-xs flex items-center gap-1 transition ${
                    deckSubMode === 'grid'
                      ? 'bg-[#5a4897] text-white shadow-xs'
                      : 'text-neutral-700 hover:text-black'
                  }`}
                  title="Card Grid Mode (All Cards)"
                >
                  <Grid className="w-3 h-3" />
                  <span>📑 Grid</span>
                </button>
              </div>
            </div>

            {deckSubMode === 'slider' ? (
              <VaultCardDeckSlider
                items={filteredItems}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelectCard}
                onOpenStory={(idx) => onOpenStory(idx)}
                onToggleFavorite={onToggleFavorite}
                onCopyItem={(id) => handleOpenMoveModal([id])}
                onDeleteItem={onDeleteItem}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center py-2 max-w-full">
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
            )}
          </div>
        )}
      </div>

      {/* 7. Bottom Status Bar */}
      <div className="px-3 py-1 bg-[#dfdbed] text-[10px] sm:text-[11px] text-neutral-700 flex justify-between select-none border-t border-[#ffffff] flex-shrink-0">
        <span>{filteredItems.length} items • {selectedIds.length} selected</span>
        <span className="flex items-center gap-1.5">
          <span>{viewMode === 'classic' ? 'Player Grid' : 'Trading Cards'}</span>
          <span>•</span>
          <span>100% Encrypted</span>
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