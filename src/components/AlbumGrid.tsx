'use client';

import React from 'react';
import { MediaItem, Album } from '@/lib/types';
import { 
  Play, Film, Music, Heart, MapPin, Calendar, 
  Trash2, Sparkles
} from 'lucide-react';

interface AlbumGridProps {
  items: MediaItem[];
  albums: Album[];
  selectedAlbum: string;
  onSelectAlbum: (albumId: string) => void;
  onOpenStory: (index: number) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteItem: (id: string) => void;
}

export default function AlbumGrid({
  items,
  albums,
  selectedAlbum,
  onSelectAlbum,
  onOpenStory,
  onToggleFavorite,
  onDeleteItem,
}: AlbumGridProps) {
  // Filter items by album
  const filteredItems = selectedAlbum === 'all'
    ? items
    : items.filter((item) => item.album === selectedAlbum);

  return (
    <div className="space-y-8">
      
      {/* 1. Instagram-Style Story Circles (Top Highlights) */}
      <div className="flex items-center gap-4 overflow-x-auto pb-4 pt-1 no-scrollbar">
        {albums.map((album) => {
          const isSelected = selectedAlbum === album.id;
          return (
            <div
              key={album.id}
              onClick={() => onSelectAlbum(album.id)}
              className="flex flex-col items-center gap-1.5 cursor-pointer group flex-shrink-0"
            >
              <div
                className={`w-18 h-18 rounded-full p-0.5 transition transform group-hover:scale-105 ${
                  isSelected
                    ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-lg shadow-rose-500/20'
                    : 'bg-neutral-800 hover:bg-neutral-700'
                }`}
              >
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-neutral-950 bg-neutral-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={album.coverUrl}
                    alt={album.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <span className={`text-xs font-medium max-w-[80px] truncate text-center ${
                isSelected ? 'text-white font-semibold' : 'text-neutral-400 group-hover:text-neutral-200'
              }`}>
                {album.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* 2. Grid Items Counter & Album Title */}
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>
              {albums.find((a) => a.id === selectedAlbum)?.name || 'Memories'}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-normal">
              {filteredItems.length} {filteredItems.length === 1 ? 'memory' : 'memories'}
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            {albums.find((a) => a.id === selectedAlbum)?.description || 'Lifetime collection'}
          </p>
        </div>

        {filteredItems.length > 0 && (
          <button
            onClick={() => onOpenStory(0)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-semibold text-xs shadow-md shadow-rose-500/20 transition"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            Play All Stories
          </button>
        )}
      </div>

      {/* 3. Media Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-neutral-800 rounded-3xl bg-neutral-900/30">
          <Sparkles className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white mb-1">No memories in this album yet</h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Upload your favorite photos or videos and pair them with your chosen soundtrack!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
          {filteredItems.map((item, index) => {
            // Find global index in master items array for story opening
            const globalIndex = items.findIndex((m) => m.id === item.id);

            return (
              <div
                key={item.id}
                className="group relative rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800/80 hover:border-neutral-700 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/5 aspect-[4/5] cursor-pointer"
                onClick={() => onOpenStory(globalIndex >= 0 ? globalIndex : index)}
              >
                {/* Media Thumbnail */}
                {item.type === 'video' ? (
                  <video
                    src={item.url}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    muted
                    loop
                    onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
                    onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumbnailUrl || item.url}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}

                {/* Top Badges (Type & Music) */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
                  {/* Media Type Badge */}
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-medium border border-white/10">
                    {item.type === 'video' ? (
                      <>
                        <Film className="w-3 h-3 text-amber-400" />
                        <span>Video</span>
                      </>
                    ) : (
                      <span>Photo</span>
                    )}
                  </span>

                  {/* Paired Soundtrack Badge */}
                  {item.audioTrack && (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-medium border border-white/10 max-w-[55%] truncate">
                      <Music className="w-3 h-3 text-rose-400 flex-shrink-0 animate-pulse" />
                      <span className="truncate">{item.audioTrack.title}</span>
                    </span>
                  )}
                </div>

                {/* Hover Play Button Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                  <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-xl transform scale-90 group-hover:scale-100 transition duration-200">
                    <Play className="w-6 h-6 fill-white translate-x-0.5" />
                  </div>
                </div>

                {/* Bottom Metadata & Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent z-10">
                  <div className="flex items-end justify-between">
                    <div className="space-y-0.5 pr-2">
                      <h4 className="font-semibold text-sm text-white drop-shadow line-clamp-1">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-300">
                        <span>{item.takenAt}</span>
                        {item.location && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-0.5 truncate max-w-[120px]">
                              <MapPin className="w-3 h-3 text-rose-400" />
                              {item.location}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions: Favorite & Delete */}
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onToggleFavorite(item.id)}
                        className="p-2 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white transition"
                        title="Favorite"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            item.isFavorite ? 'fill-rose-500 text-rose-500' : 'text-white/80 hover:text-rose-400'
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="p-2 rounded-full bg-black/50 hover:bg-red-500/30 backdrop-blur-md text-white/70 hover:text-red-400 transition"
                        title="Delete from Vault"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
