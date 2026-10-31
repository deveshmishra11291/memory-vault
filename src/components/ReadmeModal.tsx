'use client';

import React from 'react';
import { FileText, X } from 'lucide-react';

interface ReadmeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReadmeModal({ isOpen, onClose }: ReadmeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <div className="w-full max-w-lg retro-box-outset shadow-2xl flex flex-col font-mono text-xs overflow-hidden">
        
        {/* Title Bar */}
        <div className="retro-titlebar">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-white" />
            <span>README.txt — Notepad 1999</span>
          </div>
          <button onClick={onClose} className="retro-win-ctrl">✕</button>
        </div>

        {/* Menu Bar */}
        <div className="px-2 py-1 bg-[#dfdbed] border-b border-[#a09bb8] flex gap-3 text-[11px] text-[#2d2642]">
          <span className="hover:bg-[#5a4897] hover:text-white px-1 cursor-pointer">File</span>
          <span className="hover:bg-[#5a4897] hover:text-white px-1 cursor-pointer">Edit</span>
          <span className="hover:bg-[#5a4897] hover:text-white px-1 cursor-pointer">Search</span>
          <span className="hover:bg-[#5a4897] hover:text-white px-1 cursor-pointer">Help</span>
        </div>

        {/* Text Document Content */}
        <div className="p-4 retro-box-inset m-1 bg-white text-[#111111] overflow-y-auto max-h-[60vh] space-y-3 font-mono text-xs leading-relaxed select-text">
          <p className="font-bold border-b border-neutral-300 pb-1">
            ========================================<br />
            MEMORY VAULT 1999 — PRIVATE LIFE SYSTEM<br />
            ========================================
          </p>

          <p>
            Welcome to your permanent digital sanctuary.
          </p>

          <p>
            1. ZERO ALGORITHMS & 100% PRIVATE<br />
            ------------------------------------<br />
            Unlike modern social networks, your photos and videos are strictly yours. There are no follower counts, no advertisements, and zero telemetry.
          </p>

          <p>
            2. SOUNDTRACK SYNCHRONIZATION<br />
            ------------------------------------<br />
            Every memory is paired with a chosen audio soundtrack from the global music catalog (or your own custom MP3 files), reproducing the classic story experience with timeless audio-visual playback.
          </p>

          <p>
            3. SAVED FOR LIFE (PERMANENT STORAGE)<br />
            ------------------------------------<br />
            Your media files are stored directly to disk and multi-region cloud archives. Use the "Export Vault (.json)" button anytime to generate an offline snapshot of your complete history.
          </p>

          <p className="pt-2 text-[10px] text-neutral-500">
            [Build 1999.10 - System Active - All Rights Reserved]
          </p>
        </div>

        {/* Bottom Status Bar */}
        <div className="px-2 py-1 bg-[#dfdbed] text-[10px] text-neutral-600 flex justify-between border-t border-[#ffffff]">
          <span>Ln 1, Col 1</span>
          <span>100% Private</span>
        </div>
      </div>
    </div>
  );
}
