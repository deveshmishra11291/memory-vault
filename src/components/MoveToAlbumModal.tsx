'use client';

import React, { useState } from 'react';
import { Album } from '@/lib/types';
import { Folder, FolderPlus, Check, X, Copy, ArrowRight } from 'lucide-react';

interface MoveToAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItemIds: string[];
  albums: Album[];
  firstItemThumbnail?: string;
  onConfirm: (itemIds: string[], targetAlbumId: string, newAlbum?: Album, isMove?: boolean) => void;
}

export default function MoveToAlbumModal({
  isOpen,
  onClose,
  selectedItemIds,
  albums,
  firstItemThumbnail,
  onConfirm,
}: MoveToAlbumModalProps) {
  const availableAlbums = albums.filter((a) => a.id !== 'all');

  const [mode, setMode] = useState<'existing' | 'new'>(
    availableAlbums.length > 0 ? 'existing' : 'new'
  );
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>(
    availableAlbums[0]?.id || ''
  );
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDescription, setNewAlbumDescription] = useState('');
  
  // Default to COPY so original archive remains 100% intact!
  const [isMove, setIsMove] = useState(false);

  if (!isOpen) return null;

  const handleApply = () => {
    if (mode === 'existing') {
      if (!selectedAlbumId) {
        alert('Please select an album!');
        return;
      }
      onConfirm(selectedItemIds, selectedAlbumId, undefined, isMove);
      onClose();
    } else {
      if (!newAlbumName.trim()) {
        alert('Please enter a name for the new album!');
        return;
      }

      const generatedId = newAlbumName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
      const newAlbum: Album = {
        id: generatedId,
        name: newAlbumName.trim(),
        description: newAlbumDescription.trim() || 'Created from selected stories',
        coverUrl: firstItemThumbnail || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        itemCount: selectedItemIds.length,
      };

      onConfirm(selectedItemIds, generatedId, newAlbum, isMove);
      setNewAlbumName('');
      setNewAlbumDescription('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] font-mono text-xs select-none">
      <div className="w-full max-w-md retro-box-outset shadow-2xl flex flex-col overflow-hidden">
        
        {/* Title Bar */}
        <div className="retro-titlebar select-none">
          <div className="flex items-center gap-2">
            <Copy className="w-3.5 h-3.5 text-white" />
            <span>Copy / Add Stories to Album — [1999 Vault]</span>
          </div>
          <button onClick={onClose} className="retro-win-ctrl font-bold">✕</button>
        </div>

        {/* Header summary */}
        <div className="px-4 py-2 bg-[#dfdbed] border-b border-[#a09bb8] flex items-center justify-between">
          <div>
            <h4 className="font-bold text-xs text-[#1a162b]">
              Adding {selectedItemIds.length} Story{selectedItemIds.length === 1 ? '' : 'ies'} to Album
            </h4>
            <p className="text-[10px] text-emerald-800 font-bold">
              ✓ Originals remain safe inside your Instagram Archive
            </p>
          </div>
          <span className="px-2 py-0.5 retro-box-inset bg-white text-[10px] text-[#5a4897] font-bold">
            {selectedItemIds.length} selected
          </span>
        </div>

        {/* Modal Body */}
        <div className="p-4 bg-[#f4f2fa] retro-box-inset m-1 space-y-3">
          
          {/* Copy vs Move Choice */}
          <div className="p-2.5 retro-box-outset bg-[#e7e4f2] space-y-1.5">
            <span className="block font-bold text-[10px] text-neutral-700">Storage Behavior:</span>
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-2 text-xs font-bold text-[#1a162b] cursor-pointer">
                <input
                  type="radio"
                  name="storageAction"
                  checked={!isMove}
                  onChange={() => setIsMove(false)}
                  className="accent-[#5a4897] cursor-pointer"
                />
                <span>Copy &amp; Add (Keep original in Instagram Archive)</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-neutral-600 cursor-pointer">
                <input
                  type="radio"
                  name="storageAction"
                  checked={isMove}
                  onChange={() => setIsMove(true)}
                  className="accent-[#5a4897] cursor-pointer"
                />
                <span>Move &amp; Transfer (Remove from original folder)</span>
              </label>
            </div>
          </div>

          {/* Option 1: Existing Album */}
          <div 
            onClick={() => setMode('existing')}
            className={`p-2.5 retro-box-outset cursor-pointer transition ${
              mode === 'existing' ? 'bg-[#cec8e3]' : 'bg-[#dfdbed] opacity-80'
            }`}
          >
            <label className="flex items-center gap-2 font-bold text-neutral-800 cursor-pointer mb-2">
              <input
                type="radio"
                name="albumMode"
                checked={mode === 'existing'}
                onChange={() => setMode('existing')}
                className="cursor-pointer accent-[#5a4897]"
              />
              <Folder className="w-4 h-4 text-amber-600" />
              <span>Choose an Existing Album</span>
            </label>

            {mode === 'existing' && (
              <div className="pl-6 pt-1">
                {availableAlbums.length === 0 ? (
                  <p className="text-[10px] text-neutral-500 italic">No custom albums created yet. Choose &quot;Create New Album&quot; below.</p>
                ) : (
                  <select
                    value={selectedAlbumId}
                    onChange={(e) => setSelectedAlbumId(e.target.value)}
                    className="w-full retro-box-inset px-2 py-1 text-xs text-black bg-white"
                  >
                    {availableAlbums.map((alb) => (
                      <option key={alb.id} value={alb.id}>
                        📁 {alb.name} ({alb.itemCount} memories)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Option 2: Create New Album */}
          <div 
            onClick={() => setMode('new')}
            className={`p-2.5 retro-box-outset cursor-pointer transition ${
              mode === 'new' ? 'bg-[#cec8e3]' : 'bg-[#dfdbed] opacity-80'
            }`}
          >
            <label className="flex items-center gap-2 font-bold text-neutral-800 cursor-pointer mb-2">
              <input
                type="radio"
                name="albumMode"
                checked={mode === 'new'}
                onChange={() => setMode('new')}
                className="cursor-pointer accent-[#5a4897]"
              />
              <FolderPlus className="w-4 h-4 text-emerald-700" />
              <span>Create a New Album in Vault</span>
            </label>

            {mode === 'new' && (
              <div className="pl-6 space-y-2 pt-1" onClick={(e) => e.stopPropagation()}>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-700 mb-0.5">New Album Name:</label>
                  <input
                    type="text"
                    placeholder="e.g. Delhi Trip, College Friends..."
                    value={newAlbumName}
                    onChange={(e) => setNewAlbumName(e.target.value)}
                    className="w-full retro-box-inset px-2 py-1 text-xs text-black bg-white"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-700 mb-0.5">Description (Optional):</label>
                  <input
                    type="text"
                    placeholder="e.g. Unforgettable memories from the trip"
                    value={newAlbumDescription}
                    onChange={(e) => setNewAlbumDescription(e.target.value)}
                    className="w-full retro-box-inset px-2 py-1 text-xs text-black bg-white"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-2 bg-[#dfdbed] border-t border-white flex items-center justify-between">
          <span className="text-[10px] text-neutral-500 font-bold">100% Private Lifetime Vault</span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="retro-btn">Cancel</button>
            <button
              onClick={handleApply}
              className="retro-btn bg-[#c5bee6] font-bold flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isMove ? 'Move' : 'Copy & Add'} to Album</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
