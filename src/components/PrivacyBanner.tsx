'use client';

import React from 'react';
import { ShieldCheck, HardDrive, Lock, HeartHandshake } from 'lucide-react';

export default function PrivacyBanner() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-r from-neutral-900 via-neutral-900/90 to-neutral-900/60 p-6 shadow-xl mb-8">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Lock className="w-3 h-3" />
            Your Private Lifetime Sanctuary
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            No followers, no algorithms, no ads. Just your life in pictures and sound.
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Every photo and video is paired with your chosen soundtrack and preserved in a private cloud vault. Encrypted at rest, protected with multi-region redundancy, and accessible only by you.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs flex-shrink-0">
          <div className="p-3 rounded-2xl bg-neutral-800/50 border border-neutral-700/60 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold text-white block">100% Private</span>
              <span className="text-[10px] text-neutral-400">Zero public access</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-800/50 border border-neutral-700/60 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <span className="font-semibold text-white block">Saved for Life</span>
              <span className="text-[10px] text-neutral-400">Permanent archival tier</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
