'use client';

import React, { useState, useEffect } from 'react';
import { MediaItem, Album } from '@/lib/types';
import { 
  loadMemories, saveMemories, loadAlbums, saveAlbums 
} from '@/lib/storage';
import AlbumGrid from '@/components/AlbumGrid';
import StoryViewer from '@/components/StoryViewer';
import UploadModal from '@/components/UploadModal';
import NewAlbumModal from '@/components/NewAlbumModal';
import MusicSearchModal from '@/components/MusicSearchModal';
import ReadmeModal from '@/components/ReadmeModal';
import RetroTaskbar from '@/components/RetroTaskbar';
import InstagramImportModal from '@/components/InstagramImportModal';
import { 
  Folder, Monitor, Plus, Music, FileText, Trash2, 
  HardDrive, FolderPlus, Sparkles, Lock, Camera
} from 'lucide-react';

export default function Home() {
  const [memories, setMemories] = useState<MediaItem[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string>('all');
  
  // Windows & Modals state
  const [openWindows, setOpenWindows] = useState({
    gallery: true,
    story: false,
    upload: false,
    music: false,
    readme: false,
    igImport: false,
  });
  const [activeWindow, setActiveWindow] = useState<string>('gallery');

  const [storyIndex, setStoryIndex] = useState(0);
  const [newAlbumOpen, setNewAlbumOpen] = useState(false);

  // Initialize data on client load
  useEffect(() => {
    let loadedMemories = loadMemories();
    let loadedAlbums = loadAlbums();

    // Ensure all original stories remain preserved in the Instagram Archive vault
    const igAlbum = loadedAlbums.find(
      (a) => a.id.includes('instagram') || a.name.toLowerCase().includes('instagram')
    );
    if (igAlbum) {
      const missingFromIg: MediaItem[] = [];
      loadedMemories.forEach((mem) => {
        if (mem.album !== igAlbum.id && mem.album !== 'all') {
          const alreadyInIg = loadedMemories.some(
            (m) => m.album === igAlbum.id && (m.url === mem.url || m.title === mem.title)
          );
          if (!alreadyInIg) {
            missingFromIg.push({
              ...mem,
              id: `ig-orig-${Date.now()}-${mem.id}`,
              album: igAlbum.id,
            });
          }
        }
      });

      if (missingFromIg.length > 0) {
        loadedMemories = [...loadedMemories, ...missingFromIg];
        saveMemories(loadedMemories);
        loadedAlbums = loadedAlbums.map((alb) => {
          if (alb.id === 'all') return { ...alb, itemCount: loadedMemories.length };
          const count = loadedMemories.filter((m) => m.album === alb.id).length;
          return { ...alb, itemCount: count };
        });
        saveAlbums(loadedAlbums);
      }
    }

    setMemories(loadedMemories);
    setAlbums(loadedAlbums);
  }, []);

  const handleToggleWindow = (win: 'gallery' | 'story' | 'upload' | 'music' | 'readme' | 'igImport') => {
    setOpenWindows((prev) => {
      const nextState = !prev[win];
      return { ...prev, [win]: nextState };
    });
    setActiveWindow(win);
  };

  const handleOpenStory = (index: number) => {
    const playlist = selectedAlbum === 'all'
      ? memories
      : memories.filter((m) => m.album === selectedAlbum);
    const safeIdx = Math.min(Math.max(0, index), Math.max(0, playlist.length - 1));
    setStoryIndex(safeIdx);
    setOpenWindows((prev) => ({ ...prev, story: true }));
    setActiveWindow('story');
  };

  const handleSaveMemory = (newItem: MediaItem) => {
    const updated = [newItem, ...memories];
    setMemories(updated);
    saveMemories(updated);

    const updatedAlbums = albums.map((alb) => {
      if (alb.id === newItem.album || alb.id === 'all') {
        return { ...alb, itemCount: alb.itemCount + 1 };
      }
      return alb;
    });
    setAlbums(updatedAlbums);
    saveAlbums(updatedAlbums);
  };

  const handleToggleFavorite = (id: string) => {
    const updated = memories.map((m) =>
      m.id === id ? { ...m, isFavorite: !m.isFavorite } : m
    );
    setMemories(updated);
    saveMemories(updated);
  };

  const handleDeleteItem = (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this memory file?')) return;
    const updated = memories.filter((m) => m.id !== id);
    setMemories(updated);
    saveMemories(updated);
  };

  const handleSaveAlbum = (newAlbum: Album) => {
    const updated = [...albums, newAlbum];
    setAlbums(updated);
    saveAlbums(updated);
    setSelectedAlbum(newAlbum.id);
  };

  const handleDeleteAlbum = (albumId: string) => {
    if (albumId === 'all') {
      alert('Cannot delete the root "All Memories" collection.');
      return;
    }

    const target = albums.find((a) => a.id === albumId);
    const albumName = target ? target.name : 'this album';

    const confirmed = confirm(
      `Are you sure you want to delete the album "${albumName}"?\n\nNote: All your photos, videos, and music will remain 100% safe in "All Memories" and your archive.`
    );
    if (!confirmed) return;

    const updatedAlbums = albums.filter((a) => a.id !== albumId);

    // If active album was deleted, switch back to 'all'
    if (selectedAlbum === albumId) {
      setSelectedAlbum('all');
    }

    setAlbums(updatedAlbums);
    saveAlbums(updatedAlbums);
  };

  const handleMoveItemsToAlbum = (
    itemIds: string[],
    targetAlbumId: string,
    newAlbum?: Album,
    isMove: boolean = false
  ) => {
    let updatedAlbums = [...albums];
    let finalAlbumId = targetAlbumId;

    if (newAlbum && !updatedAlbums.some((a) => a.id === newAlbum.id)) {
      updatedAlbums.push(newAlbum);
      finalAlbumId = newAlbum.id;
    }

    let updatedMemories: MediaItem[];

    if (isMove) {
      // Transfer: modify item's album property
      updatedMemories = memories.map((m) => {
        if (itemIds.includes(m.id)) {
          return { ...m, album: finalAlbumId };
        }
        return m;
      });
    } else {
      // COPY: Keep original safe in archive/vault, add clone into destination album
      const itemsToCopy = memories.filter((m) => itemIds.includes(m.id));
      const copies: MediaItem[] = itemsToCopy.map((item, idx) => ({
        ...item,
        id: `copy-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        album: finalAlbumId,
      }));
      updatedMemories = [...copies, ...memories];
    }

    updatedAlbums = updatedAlbums.map((alb) => {
      if (alb.id === 'all') {
        return { ...alb, itemCount: updatedMemories.length };
      }
      const count = updatedMemories.filter((m) => m.album === alb.id).length;
      return { ...alb, itemCount: count };
    });

    setMemories(updatedMemories);
    setAlbums(updatedAlbums);
    saveMemories(updatedMemories);
    saveAlbums(updatedAlbums);
    // Stay in current album (do not auto-switch albums after copying)
  };

  const handleImportComplete = (importedItems: MediaItem[], newAlbums?: Album[]) => {
    const updatedMemories = [...importedItems, ...memories];
    let updatedAlbums = [...albums];

    if (newAlbums && newAlbums.length > 0) {
      for (const na of newAlbums) {
        if (!updatedAlbums.some((a) => a.id === na.id)) {
          updatedAlbums.push(na);
        }
      }
    }

    updatedAlbums = updatedAlbums.map((alb) => {
      if (alb.id === 'all') {
        return { ...alb, itemCount: updatedMemories.length };
      }
      const count = updatedMemories.filter((m) => m.album === alb.id).length;
      return { ...alb, itemCount: count };
    });

    setMemories(updatedMemories);
    setAlbums(updatedAlbums);
    saveMemories(updatedMemories);
    saveAlbums(updatedAlbums);

    if (newAlbums && newAlbums.length > 0 && newAlbums[0]) {
      setSelectedAlbum(newAlbums[0].id);
    }
  };

  const handleExportVault = () => {
    const vaultData = {
      version: '1.0-1999',
      exportedAt: new Date().toISOString(),
      albumCount: albums.length,
      memoryCount: memories.length,
      albums,
      memories,
    };
    const blob = new Blob([JSON.stringify(vaultData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory-vault-1999-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activePlaylist = selectedAlbum === 'all'
    ? memories
    : memories.filter((m) => m.album === selectedAlbum);

  return (
    <div className="min-h-screen retro-desktop-pattern flex flex-col justify-between font-mono pb-12 select-none relative overflow-x-hidden">
      
      {/* Desktop Workspace Canvas */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col md:flex-row gap-6 items-start">
        
        {/* Left Side: Desktop 1999 Pixel Icons Column */}
        <div className="flex flex-row md:flex-col gap-4 flex-wrap md:w-28 flex-shrink-0 z-10">
          
          {/* Icon: My Memories */}
          <div
            onClick={() => handleToggleWindow('gallery')}
            className="flex flex-col items-center gap-1 p-2 rounded cursor-pointer group hover:bg-[#b0a8d6]/50 transition w-20 text-center"
          >
            <div className="w-10 h-10 retro-box-outset bg-[#dfdbed] flex items-center justify-center group-hover:scale-105 transition shadow-md">
              <Folder className="w-6 h-6 text-amber-500 fill-amber-500/20" />
            </div>
            <span className="text-[10px] font-bold text-[#1a162b] leading-tight px-1 group-hover:bg-[#5a4897] group-hover:text-white rounded-sm">
              My Memories
            </span>
          </div>

          {/* Icon: Story Player */}
          <div
            onClick={() => handleOpenStory(0)}
            className="flex flex-col items-center gap-1 p-2 rounded cursor-pointer group hover:bg-[#b0a8d6]/50 transition w-20 text-center"
          >
            <div className="w-10 h-10 retro-box-outset bg-[#dfdbed] flex items-center justify-center group-hover:scale-105 transition shadow-md">
              <Monitor className="w-6 h-6 text-rose-500" />
            </div>
            <span className="text-[10px] font-bold text-[#1a162b] leading-tight px-1 group-hover:bg-[#5a4897] group-hover:text-white rounded-sm">
              Story_Player.exe
            </span>
          </div>

          {/* Icon: Add Memory */}
          <div
            onClick={() => handleToggleWindow('upload')}
            className="flex flex-col items-center gap-1 p-2 rounded cursor-pointer group hover:bg-[#b0a8d6]/50 transition w-20 text-center"
          >
            <div className="w-10 h-10 retro-box-outset bg-[#dfdbed] flex items-center justify-center group-hover:scale-105 transition shadow-md">
              <Plus className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-[10px] font-bold text-[#1a162b] leading-tight px-1 group-hover:bg-[#5a4897] group-hover:text-white rounded-sm">
              Add_Memory.exe
            </span>
          </div>

          {/* Icon: Music Catalog */}
          <div
            onClick={() => handleToggleWindow('music')}
            className="flex flex-col items-center gap-1 p-2 rounded cursor-pointer group hover:bg-[#b0a8d6]/50 transition w-20 text-center"
          >
            <div className="w-10 h-10 retro-box-outset bg-[#dfdbed] flex items-center justify-center group-hover:scale-105 transition shadow-md">
              <Music className="w-6 h-6 text-[#5a4897]" />
            </div>
            <span className="text-[10px] font-bold text-[#1a162b] leading-tight px-1 group-hover:bg-[#5a4897] group-hover:text-white rounded-sm">
              Music_Catalog.app
            </span>
          </div>

          {/* Icon: Instagram Importer */}
          <div
            onClick={() => handleToggleWindow('igImport')}
            className="flex flex-col items-center gap-1 p-2 rounded cursor-pointer group hover:bg-[#b0a8d6]/50 transition w-20 text-center"
          >
            <div className="w-10 h-10 retro-box-outset bg-[#dfdbed] flex items-center justify-center group-hover:scale-105 transition shadow-md">
              <Camera className="w-6 h-6 text-rose-600" />
            </div>
            <span className="text-[10px] font-bold text-[#1a162b] leading-tight px-1 group-hover:bg-[#5a4897] group-hover:text-white rounded-sm">
              IG_Import.exe
            </span>
          </div>

          {/* Icon: New Album */}
          <div
            onClick={() => setNewAlbumOpen(true)}
            className="flex flex-col items-center gap-1 p-2 rounded cursor-pointer group hover:bg-[#b0a8d6]/50 transition w-20 text-center"
          >
            <div className="w-10 h-10 retro-box-outset bg-[#dfdbed] flex items-center justify-center group-hover:scale-105 transition shadow-md">
              <FolderPlus className="w-6 h-6 text-amber-700" />
            </div>
            <span className="text-[10px] font-bold text-[#1a162b] leading-tight px-1 group-hover:bg-[#5a4897] group-hover:text-white rounded-sm">
              New_Album.fldr
            </span>
          </div>

          {/* Icon: README.txt */}
          <div
            onClick={() => handleToggleWindow('readme')}
            className="flex flex-col items-center gap-1 p-2 rounded cursor-pointer group hover:bg-[#b0a8d6]/50 transition w-20 text-center"
          >
            <div className="w-10 h-10 retro-box-outset bg-[#dfdbed] flex items-center justify-center group-hover:scale-105 transition shadow-md">
              <FileText className="w-6 h-6 text-neutral-600" />
            </div>
            <span className="text-[10px] font-bold text-[#1a162b] leading-tight px-1 group-hover:bg-[#5a4897] group-hover:text-white rounded-sm">
              README.txt
            </span>
          </div>

          {/* Icon: Recycle Bin */}
          <div
            onClick={() => alert('Recycle Bin is empty. Vault records are kept clean.')}
            className="flex flex-col items-center gap-1 p-2 rounded cursor-pointer group hover:bg-[#b0a8d6]/50 transition w-20 text-center"
          >
            <div className="w-10 h-10 retro-box-outset bg-[#dfdbed] flex items-center justify-center group-hover:scale-105 transition shadow-md">
              <Trash2 className="w-6 h-6 text-neutral-500" />
            </div>
            <span className="text-[10px] font-bold text-[#1a162b] leading-tight px-1 group-hover:bg-[#5a4897] group-hover:text-white rounded-sm">
              Trash.bin
            </span>
          </div>
        </div>

        {/* Center: Main Windows Area */}
        <div className="flex-1 w-full max-w-5xl z-20">
          {openWindows.gallery && (
            <AlbumGrid
              items={memories}
              albums={albums}
              selectedAlbum={selectedAlbum}
              onSelectAlbum={setSelectedAlbum}
              onOpenStory={handleOpenStory}
              onToggleFavorite={handleToggleFavorite}
              onDeleteItem={handleDeleteItem}
              onOpenUpload={() => handleToggleWindow('upload')}
              onOpenNewAlbum={() => setNewAlbumOpen(true)}
              onOpenMusicSearch={() => handleToggleWindow('music')}
              onExportVault={handleExportVault}
              onOpenIgImport={() => handleToggleWindow('igImport')}
              onMoveItemsToAlbum={handleMoveItemsToAlbum}
              onDeleteAlbum={handleDeleteAlbum}
              onClose={() => setOpenWindows((prev) => ({ ...prev, gallery: false }))}
            />
          )}
        </div>
      </div>

      {/* Retro Bottom Taskbar */}
      <RetroTaskbar
        openWindows={openWindows}
        activeWindow={activeWindow}
        onToggleWindow={handleToggleWindow}
        onExportVault={handleExportVault}
      />

      {/* Window: Story Viewer (Instagram Story in 1999 CRT Player) */}
      <StoryViewer
        items={activePlaylist}
        initialIndex={storyIndex}
        isOpen={openWindows.story}
        onClose={() => setOpenWindows((prev) => ({ ...prev, story: false }))}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Window: Add Memory Wizard */}
      <UploadModal
        isOpen={openWindows.upload}
        onClose={() => setOpenWindows((prev) => ({ ...prev, upload: false }))}
        albums={albums.filter((a) => a.id !== 'all')}
        onSave={handleSaveMemory}
      />

      {/* Window: Audio Catalog Explorer */}
      <MusicSearchModal
        isOpen={openWindows.music}
        onClose={() => setOpenWindows((prev) => ({ ...prev, music: false }))}
        onSelectTrack={() => {
          // Open upload modal with selected track
          setOpenWindows((prev) => ({ ...prev, upload: true, music: false }));
        }}
      />

      {/* Window: Instagram Archive Import Wizard */}
      <InstagramImportModal
        isOpen={openWindows.igImport}
        onClose={() => setOpenWindows((prev) => ({ ...prev, igImport: false }))}
        onImportComplete={handleImportComplete}
        albums={albums}
      />

      {/* Window: New Album Folder Dialog */}
      <NewAlbumModal
        isOpen={newAlbumOpen}
        onClose={() => setNewAlbumOpen(false)}
        onSave={handleSaveAlbum}
      />

      {/* Window: README.txt Notepad */}
      <ReadmeModal
        isOpen={openWindows.readme}
        onClose={() => setOpenWindows((prev) => ({ ...prev, readme: false }))}
      />
    </div>
  );
}
