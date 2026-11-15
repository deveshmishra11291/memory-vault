'use client';

import React, { useState, useEffect } from 'react';
import { 
  Lock, Volume2, VolumeX, Folder, Plus, Music, 
  FileText, Download, ShieldCheck, Sparkles, Monitor, Camera,
  Share2, Smartphone
} from 'lucide-react';

interface RetroTaskbarProps {
  openWindows: {
    gallery: boolean;
    story: boolean;
    upload: boolean;
    music: boolean;
    readme: boolean;
    igImport?: boolean;
    shareExtension?: boolean;
  };
  activeWindow: string;
  onToggleWindow: (win: 'gallery' | 'story' | 'upload' | 'music' | 'readme' | 'igImport' | 'shareExtension') => void;
  onExportVault: () => void;
}

export default function RetroTaskbar({
  openWindows,
  activeWindow,
  onToggleWindow,
  onExportVault,
}: RetroTaskbarProps) {
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  // Live retro clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close start menu on outside click
  useEffect(() => {
    const handleClick = () => setStartMenuOpen(false);
    if (startMenuOpen) {
      window.addEventListener('click', handleClick);
    }
    return () => window.removeEventListener('click', handleClick);
  }, [startMenuOpen]);

  return (
    <>
      {/* 1999 Start Menu Pop-up */}
      {startMenuOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-10 left-1 z-50 w-72 retro-box-outset flex overflow-hidden shadow-2xl font-mono text-xs animate-in slide-in-from-bottom-2 duration-100"
        >
          {/* Left Vertical Banner (Desktop 1999 Style) */}
          <div className="w-8 bg-gradient-to-t from-[#362959] via-[#5a4897] to-[#8070b8] text-white flex items-end justify-center pb-3 select-none">
            <span
              className="text-[11px] font-bold tracking-widest text-[#dfdbed] transform -rotate-90 origin-bottom-left whitespace-nowrap ml-6 mb-2"
            >
              MEMORY 1999
            </span>
          </div>

          {/* Menu Items */}
          <div className="flex-1 p-1 bg-[#dfdbed] space-y-0.5 text-black">
            <button
              onClick={() => {
                onToggleWindow('shareExtension');
                setStartMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left bg-amber-100/70 hover:bg-[#5a4897] hover:text-white transition font-bold"
            >
              <Share2 className="w-4 h-4 text-amber-700" />
              <span>⚡ iOS Share to Vault...</span>
            </button>

            <button
              onClick={() => {
                onToggleWindow('upload');
                setStartMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#5a4897] hover:text-white transition font-medium"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Add New Memory...</span>
            </button>

            <button
              onClick={() => {
                onToggleWindow('gallery');
                setStartMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#5a4897] hover:text-white transition font-medium"
            >
              <Folder className="w-4 h-4 text-amber-600" />
              <span>My Memories [Gallery]</span>
            </button>

            <button
              onClick={() => {
                onToggleWindow('music');
                setStartMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#5a4897] hover:text-white transition font-medium"
            >
              <Music className="w-4 h-4 text-rose-500" />
              <span>Music Catalog [Spotify]</span>
            </button>

            <button
              onClick={() => {
                onToggleWindow('igImport');
                setStartMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#5a4897] hover:text-white transition font-medium"
            >
              <Camera className="w-4 h-4 text-rose-500" />
              <span>Import IG Archive (ZIP)...</span>
            </button>

            <div className="border-t border-[#807a99] border-b border-white my-1" />

            <button
              onClick={() => {
                onExportVault();
                setStartMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#5a4897] hover:text-white transition font-medium"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>Export Vault (.json)</span>
            </button>

            <button
              onClick={() => {
                onToggleWindow('readme');
                setStartMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#5a4897] hover:text-white transition font-medium"
            >
              <FileText className="w-4 h-4 text-neutral-600" />
              <span>README.txt</span>
            </button>
          </div>
        </div>
      )}

      {/* Main 1999 Taskbar */}
      <footer className="fixed bottom-0 left-0 right-0 h-10 retro-box-outset z-40 px-1.5 flex items-center justify-between text-xs font-mono select-none">
        
        {/* Left: Start Button + Open Task Tabs */}
        <div className="flex items-center gap-1.5 h-full py-0.5">
          {/* Start Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setStartMenuOpen((prev) => !prev);
            }}
            className={`h-7 px-2.5 retro-btn flex items-center gap-1.5 ${
              startMenuOpen ? 'border-t-[#332d47] border-l-[#332d47] border-b-white border-r-white bg-[#cec8e3]' : ''
            }`}
          >
            {/* 1999 Retro Logo */}
            <div className="w-4 h-4 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 rounded-sm flex items-center justify-center p-0.5 shadow-sm">
              <Lock className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="font-bold tracking-wide">Start</span>
          </button>

          {/* Vertical Separator */}
          <div className="w-[2px] h-5 border-l border-[#807a99] border-r border-white mx-0.5" />

          {/* Active Window Taskbar Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-[70vw]">
            {openWindows.gallery && (
              <button
                onClick={() => onToggleWindow('gallery')}
                className={`h-7 px-3 max-w-[150px] truncate retro-btn text-[11px] flex items-center gap-1.5 ${
                  activeWindow === 'gallery'
                    ? 'border-t-[#332d47] border-l-[#332d47] border-b-white border-r-white bg-[#cec8e3]'
                    : ''
                }`}
              >
                <Folder className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <span className="truncate">My Memories</span>
              </button>
            )}

            {openWindows.shareExtension && (
              <button
                onClick={() => onToggleWindow('shareExtension')}
                className={`h-7 px-3 max-w-[170px] truncate retro-btn text-[11px] flex items-center gap-1.5 ${
                  activeWindow === 'shareExtension'
                    ? 'border-t-[#332d47] border-l-[#332d47] border-b-white border-r-white bg-[#cec8e3]'
                    : 'bg-amber-100/60'
                }`}
              >
                <Share2 className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                <span className="truncate">⚡ iOS Share Sheet</span>
              </button>
            )}

            {openWindows.story && (
              <button
                onClick={() => onToggleWindow('story')}
                className={`h-7 px-3 max-w-[150px] truncate retro-btn text-[11px] flex items-center gap-1.5 ${
                  activeWindow === 'story'
                    ? 'border-t-[#332d47] border-l-[#332d47] border-b-white border-r-white bg-[#cec8e3]'
                    : ''
                }`}
              >
                <Monitor className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                <span className="truncate">Story Viewer</span>
              </button>
            )}

            {openWindows.upload && (
              <button
                onClick={() => onToggleWindow('upload')}
                className={`h-7 px-3 max-w-[150px] truncate retro-btn text-[11px] flex items-center gap-1.5 ${
                  activeWindow === 'upload'
                    ? 'border-t-[#332d47] border-l-[#332d47] border-b-white border-r-white bg-[#cec8e3]'
                    : ''
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span className="truncate">Add Memory</span>
              </button>
            )}

            {openWindows.music && (
              <button
                onClick={() => onToggleWindow('music')}
                className={`h-7 px-3 max-w-[150px] truncate retro-btn text-[11px] flex items-center gap-1.5 ${
                  activeWindow === 'music'
                    ? 'border-t-[#332d47] border-l-[#332d47] border-b-white border-r-white bg-[#cec8e3]'
                    : ''
                }`}
              >
                <Music className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                <span className="truncate">Music Catalog</span>
              </button>
            )}

            {openWindows.readme && (
              <button
                onClick={() => onToggleWindow('readme')}
                className={`h-7 px-3 max-w-[150px] truncate retro-btn text-[11px] flex items-center gap-1.5 ${
                  activeWindow === 'readme'
                    ? 'border-t-[#332d47] border-l-[#332d47] border-b-white border-r-white bg-[#cec8e3]'
                    : ''
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0" />
                <span className="truncate">README.txt</span>
              </button>
            )}

            {openWindows.igImport && (
              <button
                onClick={() => onToggleWindow('igImport')}
                className={`h-7 px-3 max-w-[150px] truncate retro-btn text-[11px] flex items-center gap-1.5 ${
                  activeWindow === 'igImport'
                    ? 'border-t-[#332d47] border-l-[#332d47] border-b-white border-r-white bg-[#cec8e3]'
                    : ''
                }`}
              >
                <Camera className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                <span className="truncate">IG Importer</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Retro System Tray */}
        <div className="flex items-center gap-2 h-7 px-2.5 retro-box-inset bg-[#dfdbed] text-[#1a162b]">
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-800 font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            100% PRIVATE
          </span>

          <div className="w-[1px] h-3.5 bg-[#a09bb8] hidden sm:block" />

          {/* Time display */}
          <span className="font-mono text-xs font-bold tracking-tight">
            {currentTime || '05:40 PM'}
          </span>
        </div>
      </footer>
    </>
  );
}