import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme, BackgroundTheme } from '../context/ThemeContext';

export const BackgroundSelector: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { bgTheme, setBgTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const themes: { id: BackgroundTheme; label: string; previewColor: string; desc: string }[] = [
    {
      id: 'blueprint',
      label: 'Blueprint Grid',
      previewColor: 'bg-indigo-100 border-indigo-300',
      desc: 'Technical coaching graph grid',
    },
    {
      id: 'studio',
      label: 'Studio Minimal',
      previewColor: 'bg-slate-100 border-slate-300',
      desc: 'Clean paper with dot matrix',
    },
    {
      id: 'aurora',
      label: 'Aurora Glow',
      previewColor: 'bg-purple-100 border-purple-300',
      desc: 'Ambient violet & cyan light',
    },
    {
      id: 'academic',
      label: 'Academic Ivy',
      previewColor: 'bg-emerald-100 border-emerald-400',
      desc: 'Refined sage & botanical tint',
    },
    {
      id: 'sunset',
      label: 'Sunset Amber',
      previewColor: 'bg-amber-100 border-amber-400',
      desc: 'Warm golden hour energy',
    },
    {
      id: 'nebula',
      label: 'Slate Nebula',
      previewColor: 'bg-slate-900 border-indigo-500',
      desc: 'Deep modern night mode',
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
        title="Change Background Style"
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200/80 bg-white/80 hover:bg-white text-slate-700 hover:text-indigo-600 shadow-2xs backdrop-blur-xs transition-all cursor-pointer text-xs font-semibold ${
          open ? 'ring-2 ring-indigo-500/20 border-indigo-500' : ''
        }`}
      >
        <Palette className="w-3.5 h-3.5 text-indigo-600" />
        {!compact && <span className="hidden sm:inline">Theme</span>}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-slate-200/90 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Background Aesthetic
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
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/80 text-indigo-950 font-bold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-4 h-4 rounded-full border shadow-2xs ${t.previewColor}`} />
                    <div>
                      <p className="text-xs font-semibold">{t.label}</p>
                      <p className="text-[10px] text-slate-400 leading-none mt-0.5">{t.desc}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
