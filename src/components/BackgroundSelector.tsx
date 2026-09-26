import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sparkles } from 'lucide-react';
import { useTheme, BackgroundTheme } from '../context/ThemeContext';

export const BackgroundSelector: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { bgTheme, setBgTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const themes: { id: BackgroundTheme; label: string; previewGrad: string; desc: string }[] = [
    {
      id: 'blueprint',
      label: 'Blueprint Grid',
      previewGrad: 'from-blue-500 to-indigo-600',
      desc: 'Technical coaching graph & cyan aura',
    },
    {
      id: 'studio',
      label: 'Studio Minimal',
      previewGrad: 'from-slate-400 to-indigo-500',
      desc: 'Clean paper with dual gradient glows',
    },
    {
      id: 'aurora',
      label: 'Aurora Glow',
      previewGrad: 'from-purple-500 via-pink-500 to-cyan-400',
      desc: 'Luminous violet & cyan light mesh',
    },
    {
      id: 'academic',
      label: 'Academic Ivy',
      previewGrad: 'from-emerald-500 to-teal-600',
      desc: 'Refined emerald botanical tint',
    },
    {
      id: 'sunset',
      label: 'Sunset Amber',
      previewGrad: 'from-amber-400 via-orange-500 to-rose-500',
      desc: 'Warm golden hour radiant energy',
    },
    {
      id: 'nebula',
      label: 'Slate Nebula',
      previewGrad: 'from-indigo-600 via-purple-600 to-pink-600',
      desc: 'Deep modern night mode galaxy',
    },
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        title="Switch Visual Background Theme"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border border-slate-200/80 bg-white/90 hover:bg-white text-slate-700 hover:text-indigo-600 shadow-2xs backdrop-blur-md transition-all duration-200 cursor-pointer text-xs font-bold active:scale-95 ${
          open ? 'ring-2 ring-indigo-500/30 border-indigo-500 text-indigo-600' : ''
        }`}
      >
        <Palette className="w-3.5 h-3.5 text-indigo-600" />
        {!compact && <span className="hidden sm:inline">Theme</span>}
      </button>

      {open && (
        <div className="absolute right-0 mt-2.5 w-64 rounded-3xl bg-white/95 backdrop-blur-2xl shadow-2xl border border-slate-200/90 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Visual Aura & Theme
            </span>
          </div>
          <div className="space-y-1">
            {themes.map((t) => {
              const isSelected = bgTheme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setBgTheme(t.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-950 font-bold border border-indigo-200/60 shadow-xs'
                      : 'hover:bg-slate-50 text-slate-700 hover:translate-x-0.5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-full bg-gradient-to-br ${t.previewGrad} shadow-xs ring-1 ring-black/5`} />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{t.label}</p>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{t.desc}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-indigo-600 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
