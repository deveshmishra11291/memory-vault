'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MediaItem } from '@/lib/types';
import VaultCard from '@/components/VaultCard';
import { 
  ChevronLeft, ChevronRight, Play, Eye, Sparkles, 
  Layers, Grid, SkipBack, SkipForward, CheckSquare
} from 'lucide-react';

interface VaultCardDeckSliderProps {
  items: MediaItem[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onOpenStory: (index: number) => void;
  onToggleFavorite: (id: string) => void;
  onCopyItem: (id: string) => void;
  onDeleteItem: (id: string) => void;
}

export default function VaultCardDeckSlider({
  items,
  selectedIds,
  onToggleSelect,
  onOpenStory,
  onToggleFavorite,
  onCopyItem,
  onDeleteItem,
}: VaultCardDeckSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  // Clamped index
  const safeIndex = Math.min(Math.max(0, currentIndex), Math.max(0, items.length - 1));
  const activeItem = items[safeIndex];

  // Keyboard navigation (Left / Right arrow)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => Math.min(items.length - 1, prev + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items.length]);

  if (!items || items.length === 0) return null;

  // Touch Swipe Handlers for Mobile (Android & iOS)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchDeltaX(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const delta = e.touches[0].clientX - touchStartX;
    setTouchDeltaX(delta);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null) return;
    if (touchDeltaX < -45 && safeIndex < items.length - 1) {
      // Swiped Left -> Next Card
      setCurrentIndex((prev) => prev + 1);
    } else if (touchDeltaX > 45 && safeIndex > 0) {
      // Swiped Right -> Previous Card
      setCurrentIndex((prev) => prev - 1);
    }
    setTouchStartX(null);
    setTouchDeltaX(0);
  };

  // Mouse Drag Handlers for Desktop Trackpad / Mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag if not clicking a button/input
    if ((e.target as HTMLElement).closest('button, input, label, a')) return;
    setIsDragging(true);
    setDragStartX(e.clientX);
    setTouchDeltaX(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || dragStartX === null) return;
    setTouchDeltaX(e.clientX - dragStartX);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    if (touchDeltaX < -50 && safeIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else if (touchDeltaX > 50 && safeIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
    setIsDragging(false);
    setDragStartX(null);
    setTouchDeltaX(0);
  };

  const prevItem = safeIndex > 0 ? items[safeIndex - 1] : null;
  const nextItem = safeIndex < items.length - 1 ? items[safeIndex + 1] : null;

  return (
    <div className="w-full flex flex-col items-center select-none overflow-hidden py-2 font-mono">
      
      {/* 1. Header Bar: Navigation Counter & Instructions */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#dfdbed] retro-box-outset text-xs mb-3 text-neutral-800">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#5a4897] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Card {safeIndex + 1} of {items.length}
          </span>
          <span className="text-[10px] text-neutral-500 hidden sm:inline">
            • Swipe or use ◀ ▶ arrows to slide
          </span>
        </div>

        {/* Quick Scrubber / Slider */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-neutral-500 font-mono">Jump:</span>
          <input
            type="range"
            min="0"
            max={items.length - 1}
            value={safeIndex}
            onChange={(e) => setCurrentIndex(parseInt(e.target.value, 10))}
            className="w-24 sm:w-36 h-2 accent-[#5a4897] cursor-pointer"
          />
        </div>
      </div>

      {/* 2. Main Sliding Stage with Touch & Drag Support */}
      <div 
        className="relative w-full flex items-center justify-center min-h-[500px] overflow-hidden px-2 cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Left Side: Peek Previous Card (on wider screens) */}
        {prevItem && (
          <div 
            onClick={() => setCurrentIndex((prev) => prev - 1)}
            className="hidden md:block absolute -left-20 lg:-left-12 opacity-35 hover:opacity-75 transition-all transform scale-80 cursor-pointer pointer-events-auto filter blur-[0.5px]"
            title="Click to slide to Previous Card"
          >
            <VaultCard item={prevItem} />
          </div>
        )}

        {/* Center: Active Card (with smooth drag translation) */}
        <div 
          className="z-10 transition-transform duration-200 ease-out flex flex-col items-center max-w-full"
          style={{
            transform: `translateX(${touchDeltaX * 0.75}px) rotate(${touchDeltaX * 0.04}deg)`,
          }}
        >
          {activeItem && (
            <VaultCard
              item={activeItem}
              isSelected={selectedIds.includes(activeItem.id)}
              onToggleSelect={onToggleSelect}
              onOpenStory={() => onOpenStory(safeIndex)}
              onToggleFavorite={onToggleFavorite}
              onCopyItem={onCopyItem}
              onDeleteItem={onDeleteItem}
              rarity={activeItem.cardStyle?.rarity || 'trap-magenta'}
            />
          )}
        </div>

        {/* Right Side: Peek Next Card (on wider screens) */}
        {nextItem && (
          <div 
            onClick={() => setCurrentIndex((prev) => prev + 1)}
            className="hidden md:block absolute -right-20 lg:-right-12 opacity-35 hover:opacity-75 transition-all transform scale-80 cursor-pointer pointer-events-auto filter blur-[0.5px]"
            title="Click to slide to Next Card"
          >
            <VaultCard item={nextItem} />
          </div>
        )}
      </div>

      {/* 3. Tactile Slider Navigation Controls */}
      <div className="w-full max-w-sm flex items-center justify-between gap-2 mt-4 px-2">
        {/* Previous Button */}
        <button
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={safeIndex === 0}
          className={`flex-1 py-2 px-3 retro-btn font-bold text-xs flex items-center justify-center gap-1.5 shadow ${
            safeIndex === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#cec8e3]'
          }`}
          title="Previous Card (Left Arrow)"
        >
          <ChevronLeft className="w-4 h-4 text-black" />
          <span>◀ Prev Card</span>
        </button>

        {/* Open Fullscreen Story Button */}
        <button
          onClick={() => onOpenStory(safeIndex)}
          className="flex-1 py-2 px-3 bg-[#5a4897] hover:bg-[#48397a] text-white font-bold text-xs retro-box-outset flex items-center justify-center gap-1.5 shadow active:scale-95 transition"
          title="Open in Story Player with Music"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Open Story</span>
        </button>

        {/* Next Button */}
        <button
          onClick={() => setCurrentIndex((prev) => Math.min(items.length - 1, prev + 1))}
          disabled={safeIndex === items.length - 1}
          className={`flex-1 py-2 px-3 retro-btn font-bold text-xs flex items-center justify-center gap-1.5 shadow ${
            safeIndex === items.length - 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#cec8e3]'
          }`}
          title="Next Card (Right Arrow)"
        >
          <span>Next Card ▶</span>
          <ChevronRight className="w-4 h-4 text-black" />
        </button>
      </div>

      {/* Mobile Swipe Hint */}
      <p className="text-[10px] text-neutral-500 mt-2 text-center">
        👉 Swipe left or right with your finger to slide cards • Tap card to open
      </p>

    </div>
  );
}