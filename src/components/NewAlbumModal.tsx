'use client';

import React, { useState } from 'react';
import { Album } from '@/lib/types';
import { X, FolderPlus, Sparkles, Check } from 'lucide-react';

interface NewAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (album: Album) => void;
}

export default function NewAlbumModal({
  isOpen,
  onClose,
  onSave,
}: NewAlbumModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState(
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'
  );

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter an album name!');
      return;
    }

    const newAlbum: Album = {
      id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: name.trim(),
      description: description.trim() || 'A private memory collection',
      coverUrl: coverUrl.trim(),
      itemCount: 0,
    };

    onSave(newAlbum);
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-900/60">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Create New Album</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Album Name
            </label>
            <input
              type="text"
              placeholder="e.g. Summer Memories 2024"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Description
            </label>
            <input
              type="text"
              placeholder="e.g. Road trips, camping, and laughs with friends"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              Cover Image URL
            </label>
            <input
              type="text"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition"
            />
            <div className="mt-2 h-24 rounded-xl overflow-hidden border border-neutral-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverUrl}
                alt="Cover Preview"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-800 bg-neutral-900/80">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white rounded-xl shadow-lg transition flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Create Album
          </button>
        </div>
      </div>
    </div>
  );
}
