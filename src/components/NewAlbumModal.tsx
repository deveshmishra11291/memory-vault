'use client';

import React, { useState } from 'react';
import { Album } from '@/lib/types';
import { FolderPlus, X, Check } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] font-mono text-xs select-none">
      <div className="w-full max-w-md retro-box-outset shadow-2xl flex flex-col overflow-hidden">
        
        {/* Title Bar */}
        <div className="retro-titlebar select-none">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-3.5 h-3.5 text-white" />
            <span>New Album Folder — [C:\Vault\Albums]</span>
          </div>
          <button onClick={onClose} className="retro-win-ctrl font-bold">✕</button>
        </div>

        {/* Content */}
        <div className="p-4 bg-[#f4f2fa] retro-box-inset m-1 space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-neutral-700 mb-0.5">Album Folder Name:</label>
            <input
              type="text"
              placeholder="e.g. Summer Memories 1999"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full retro-box-inset px-2 py-1 text-xs text-black"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-neutral-700 mb-0.5">Description:</label>
            <input
              type="text"
              placeholder="e.g. Road trips, camping, and laughs"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full retro-box-inset px-2 py-1 text-xs text-black"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-neutral-700 mb-0.5">Cover Image URL:</label>
            <input
              type="text"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              className="w-full retro-box-inset px-2 py-1 text-xs text-black"
            />
            <div className="mt-2 h-20 retro-box-inset overflow-hidden bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 py-2 bg-[#dfdbed] border-t border-white flex justify-end gap-2">
          <button onClick={onClose} className="retro-btn">Cancel</button>
          <button onClick={handleSave} className="retro-btn bg-[#c5bee6] font-bold">
            Create Folder
          </button>
        </div>
      </div>
    </div>
  );
}
