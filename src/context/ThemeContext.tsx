import React, { createContext, useContext, useEffect, useState } from 'react';

export type BackgroundTheme = 'studio' | 'blueprint' | 'aurora' | 'academic' | 'sunset' | 'nebula' | 'obsidian';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  bgTheme: BackgroundTheme;
  setBgTheme: (theme: BackgroundTheme) => void;
  themeClass: string;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleDarkMode: () => {},
  bgTheme: 'blueprint',
  setBgTheme: () => {},
  themeClass: 'bg-theme-blueprint',
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tutorflow_dark_mode');
      if (saved !== null) {
        return saved === 'true';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [bgTheme, setBgThemeState] = useState<BackgroundTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tutorflow_bg_theme') as BackgroundTheme;
      if (['studio', 'blueprint', 'aurora', 'academic', 'sunset', 'nebula', 'obsidian'].includes(saved)) {
        return saved;
      }
    }
    return 'blueprint';
  });

  // Keep theme class and dark mode class in sync on the root body
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('tutorflow_dark_mode', String(next));
      // Auto-switch to nebula dark theme if turning dark on and current is light
      if (next && ['studio', 'blueprint', 'aurora', 'academic', 'sunset'].includes(bgTheme)) {
        setBgThemeState('nebula');
        localStorage.setItem('tutorflow_bg_theme', 'nebula');
      }
      // Auto-switch to blueprint light theme if turning dark off and current is dark
      if (!next && ['nebula', 'obsidian'].includes(bgTheme)) {
        setBgThemeState('blueprint');
        localStorage.setItem('tutorflow_bg_theme', 'blueprint');
      }
      return next;
    });
  };

  const setBgTheme = (theme: BackgroundTheme) => {
    setBgThemeState(theme);
    localStorage.setItem('tutorflow_bg_theme', theme);
    // If user explicitly picks a dark theme, turn on dark mode
    if (['nebula', 'obsidian'].includes(theme)) {
      setIsDarkMode(true);
      localStorage.setItem('tutorflow_dark_mode', 'true');
    } else {
      setIsDarkMode(false);
      localStorage.setItem('tutorflow_dark_mode', 'false');
    }
  };

  const themeClass = `bg-theme-${bgTheme}`;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, bgTheme, setBgTheme, themeClass }}>
      <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark' : ''} ${themeClass}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  return useContext(ThemeContext);
}
