import React, { createContext, useContext, useEffect, useState } from 'react';

export type BackgroundTheme = 'studio' | 'blueprint' | 'aurora' | 'nebula' | 'academic' | 'sunset';

interface ThemeContextType {
  bgTheme: BackgroundTheme;
  setBgTheme: (theme: BackgroundTheme) => void;
  themeClass: string;
}

const ThemeContext = createContext<ThemeContextType>({
  bgTheme: 'studio',
  setBgTheme: () => {},
  themeClass: 'bg-theme-studio',
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bgTheme, setBgThemeState] = useState<BackgroundTheme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tutorflow_bg_theme') as BackgroundTheme;
      if (['studio', 'blueprint', 'aurora', 'nebula', 'academic', 'sunset'].includes(saved)) {
        return saved;
      }
    }
    return 'blueprint'; // Start with the stunning blueprint / coaching aesthetic
  });

  const setBgTheme = (theme: BackgroundTheme) => {
    setBgThemeState(theme);
    localStorage.setItem('tutorflow_bg_theme', theme);
  };

  const themeClass = `bg-theme-${bgTheme}`;

  return (
    <ThemeContext.Provider value={{ bgTheme, setBgTheme, themeClass }}>
      <div className={`min-h-screen transition-colors duration-300 ${themeClass}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  return useContext(ThemeContext);
}
