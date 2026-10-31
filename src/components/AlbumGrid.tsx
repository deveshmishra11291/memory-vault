'use client';

import React, { useState } from 'react';
import { MediaItem, Album } from '@/lib/types';
import { 
  Play, Film, Music, Heart, MapPin, Calendar, 
  Trash2, Sparkles, Image as ImageIcon, Folder, ArrowLeft, ArrowRight,
  HardDrive, Plus, Search, Download, FolderPlus
} from 'lucide-react';

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
}: AlbumGridProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Filter items by album
  const filteredItems = selectedAlbum === 'all'
    ? items
    : items.filter((item) => item.album === selectedAlbum);

  const activeAlbumObj = albums.find((a) => a.id === selectedAlbum) || albums[0];

  return (
    <div className="retro-box-outset shadow-2xl overflow-hidden font-mono text-xs w-full mb-12">
      
      {/* 1. Retro Title Bar */}
      <div className="retro-titlebar select-none">
        <div className="flex items-center gap-2">
          <Folder className="w-3.5 h-3.5 text-amber-300" />
          <span>My Memories — [C:\Vault\{activeAlbumObj?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'All'}]</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="retro-win-ctrl">_</button>
          <button className="retro-win-ctrl">□</button>
          <button className="retro-win-ctrl">✕</button>
        </div>
      </div>

      {/* 2. Menu Bar */}
      <div className="px-2 py-1 bg-[#dfdbed] border-b border-[#a09bb8] flex gap-3 text-[11px] text-[#2d2642] select-none">
        <span className="hover:bg-[#5a4897] hover:text-white px-1 cursor-pointer">File</span>
        <span className="hover:bg-[#5a4897] hover:text-white px-1 cursor-pointer">Edit</span>
        <span className="hover:bg-[#5a4897] hover:text-white px-1 cursor-pointer">View</span>
        <span className="hover:bg-[#5a4897] hover:text-white px-1 cursor-pointer">Favorites</span>
        <span className="hover:bg-[#5a4897] hover:text-white px-1 cursor-pointer">Help</span>
      </div>

      {/* 3. Retro Toolbar (Desktop 1999 Style) */}
      <div className="px-2 py-1.5 bg-[#dfdbed] border-b border-[#a09bb8] flex flex-wrap items-center gap-2 select-none">
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
            <span>Play Stories (90s)</span>
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

      {/* 4. Address Bar */}
      <div className="px-2 py-1 bg-[#dfdbed] border-b border-[#a09bb8] flex items-center gap-2 text-[11px] select-none">
        <span className="text-neutral-600 font-bold">Address:</span>
        <div className="flex-1 retro-box-inset px-2 py-0.5 bg-white text-black font-mono text-[11px] truncate flex items-center justify-between">
          <span>C:\MemoryVault\Albums\{activeAlbumObj?.name || 'All_Memories'}</span>
          <span className="text-neutral-400 text-[10px]">▼</span>
        </div>
      </div>

      {/* 5. Highlight Folders (Instagram Story Circles — 1999 Edition) */}
      <div className="p-3 bg-[#e8e5f2] border-b border-[#a09bb8] flex items-center gap-3 overflow-x-auto select-none">
        {albums.map((album) => {
          const isSelected = selectedAlbum === album.id;
          return (
            <div
              key={album.id}
              onClick={() => onSelectAlbum(album.id)}
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
              </div>
            </div>
          );
        })}
      </div>

      {/* 6. Media Cards Grid (Inside Retro Inset Viewport) */}
      <div className="p-4 bg-[#f4f2fa] retro-box-inset m-1 min-h-[480px]">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-neutral-500 font-mono">
            <Sparkles className="w-8 h-8 text-neutral-400 mb-2" />
            <p className="font-bold text-xs text-neutral-700">This album is empty</p>
            <p className="text-[11px] text-neutral-500 mt-1">
              Click &quot;Add Memory&quot; on the toolbar to upload photos and videos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
            {filteredItems.map((item, index) => {
              const globalIndex = items.findIndex((m) => m.id === item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => onOpenStory(globalIndex >= 0 ? globalIndex : index)}
                  className="retro-box-outset p-2 bg-[#dfdbed] cursor-pointer hover:bg-[#eae7f7] transition group flex flex-col justify-between"
                >
                  {/* Media Viewport */}
                  <div className="relative aspect-[4/3] retro-box-inset bg-black overflow-hidden mb-2">
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
                    <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
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
                      <h4 className="font-bold text-xs text-[#1a162b] truncate leading-tight">
                        {item.title}
                      </h4>
                      
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
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
                      {item.location && <span className="truncate max-w-[100px]">📍 {item.location}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 7. Bottom Status Bar */}
      <div className="px-3 py-1 bg-[#dfdbed] text-[11px] text-neutral-700 flex justify-between select-none border-t border-[#ffffff]">
        <span>{filteredItems.length} object(s) in album</span>
        <span>Disk: 100% Private Encrypted Vault</span>
      </div>
    </div>
  );
}
