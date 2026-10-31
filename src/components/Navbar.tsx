'use client';

import React from 'react';
import { 
  ShieldCheck, Plus, Sparkles, FolderPlus, Download, Lock
} from 'lucide-react';

interface NavbarProps {
  memoryCount: number;
  onOpenUpload: () => void;
  onOpenNewAlbum: () => void;
  onExportVault: () => void;
}

export default function Navbar({
  memoryCount,
  onOpenUpload,
  onOpenNewAlbum,
  onExportVault,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-white tracking-tight">
                MemoryVault
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" />
                Private & Permanent
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Photos, Videos & Soundtracks • Saved for Life
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          {/* Export Vault Backup */}
          <button
            onClick={onExportVault}
            title="Download complete private vault backup"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-900 text-neutral-300 hover:text-white text-xs font-medium transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Backup</span>
          </button>

          {/* New Album */}
          <button
            onClick={onOpenNewAlbum}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-900 text-neutral-300 hover:text-white text-xs font-medium transition"
          >
            <FolderPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>New Album</span>
          </button>

          {/* Upload Button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white text-xs font-semibold shadow-lg shadow-rose-500/20 transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Memory</span>
          </button>
        </div>
      </div>
    </header>
  );
}
