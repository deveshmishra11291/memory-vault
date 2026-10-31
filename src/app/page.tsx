'use client';

import React, { useState, useEffect } from 'react';
import { MediaItem, Album } from '@/lib/types';
import { 
  loadMemories, saveMemories, loadAlbums, saveAlbums 
} from '@/lib/storage';
import Navbar from '@/components/Navbar';
import PrivacyBanner from '@/components/PrivacyBanner';
import AlbumGrid from '@/components/AlbumGrid';
import StoryViewer from '@/components/StoryViewer';
import UploadModal from '@/components/UploadModal';
import NewAlbumModal from '@/components/NewAlbumModal';

export default function Home() {
  const [memories, setMemories] = useState<MediaItem[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string>('all');
  
  // Modals state
  const [storyOpen, setStoryOpen] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [newAlbumOpen, setNewAlbumOpen] = useState(false);

  // Initialize data on client load
  useEffect(() => {
    const loadedMemories = loadMemories();
    const loadedAlbums = loadAlbums();
    setMemories(loadedMemories);
    setAlbums(loadedAlbums);
  }, []);

  // Save memory handler
  const handleSaveMemory = (newItem: MediaItem) => {
    const updated = [newItem, ...memories];
    setMemories(updated);
    saveMemories(updated);

    // Update album count
    const updatedAlbums = albums.map((alb) => {
      if (alb.id === newItem.album || alb.id === 'all') {
        return { ...alb, itemCount: alb.itemCount + 1 };
      }
      return alb;
    });
    setAlbums(updatedAlbums);
    saveAlbums(updatedAlbums);
  };

  // Toggle favorite
  const handleToggleFavorite = (id: string) => {
    const updated = memories.map((m) =>
      m.id === id ? { ...m, isFavorite: !m.isFavorite } : m
    );
    setMemories(updated);
    saveMemories(updated);
  };

  // Delete item
  const handleDeleteItem = (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this memory?')) return;
    const updated = memories.filter((m) => m.id !== id);
    setMemories(updated);
    saveMemories(updated);
  };

  // Create new album
  const handleSaveAlbum = (newAlbum: Album) => {
    const updated = [...albums, newAlbum];
    setAlbums(updated);
    saveAlbums(updated);
    setSelectedAlbum(newAlbum.id);
  };

  // Export full vault as JSON backup
  const handleExportVault = () => {
    const vaultData = {
      version: '1.0',
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
    a.download = `memory-vault-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Open Story Viewer
  const handleOpenStory = (index: number) => {
    setStoryIndex(index);
    setStoryOpen(true);
  };

  // Active story playlist (either filtered by selected album or all)
  const activePlaylist = selectedAlbum === 'all'
    ? memories
    : memories.filter((m) => m.album === selectedAlbum);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col">
      {/* Navigation Bar */}
      <Navbar
        memoryCount={memories.length}
        onOpenUpload={() => setUploadOpen(true)}
        onOpenNewAlbum={() => setNewAlbumOpen(true)}
        onExportVault={handleExportVault}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Privacy & Lifetime Sanctuary Banner */}
        <PrivacyBanner />

        {/* Gallery / Feed / Highlights */}
        <AlbumGrid
          items={memories}
          albums={albums}
          selectedAlbum={selectedAlbum}
          onSelectAlbum={setSelectedAlbum}
          onOpenStory={handleOpenStory}
          onToggleFavorite={handleToggleFavorite}
          onDeleteItem={handleDeleteItem}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 py-8 text-center text-xs text-neutral-500">
        <p>© {new Date().getFullYear()} MemoryVault. Built for absolute privacy, longevity, and timeless memories.</p>
      </footer>

      {/* Fullscreen Instagram Story / Reel Viewer */}
      <StoryViewer
        items={activePlaylist}
        initialIndex={storyIndex}
        isOpen={storyOpen}
        onClose={() => setStoryOpen(false)}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Upload Memory Modal */}
      <UploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        albums={albums.filter((a) => a.id !== 'all')}
        onSave={handleSaveMemory}
      />

      {/* New Album Modal */}
      <NewAlbumModal
        isOpen={newAlbumOpen}
        onClose={() => setNewAlbumOpen(false)}
        onSave={handleSaveAlbum}
      />
    </div>
  );
}
