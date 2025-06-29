// src/context/ThemeContext.ts
"use client"; // Bahut zaroori hai ye line!

// Zaroori React imports
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Theme context ka type define karo
export interface ThemeContextType {
  theme: "light" | "dark" | "talesy-accent";
  setTheme: (theme: "light" | "dark" | "talesy-accent") => void;
  getDynamicThemeClass: (prop: string) => string;
}

// ThemeContext ko banaya
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ThemeProvider component
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Theme state
  const [theme, setTheme] = useState<"light" | "dark" | "talesy-accent">("talesy-accent");

  // Jab component mount ho, localStorage se theme load karo
  useEffect(() => {
    // Ye check browser environment ke liye hai
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as "light" | "dark" | "talesy-accent" | null;
      if (savedTheme && ['light', 'dark', 'talesy-accent'].includes(savedTheme)) {
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
      } else {
        setTheme("talesy-accent"); // Default theme
        localStorage.setItem("theme", "talesy-accent");
        document.documentElement.setAttribute('data-theme', 'talesy-accent');
      }
    }
  }, []); // [] matlab sirf ek baar component load hone par chalega

  // Jab theme change ho, localStorage aur data-theme attribute update karo
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]); // 'theme' state change hone par dobara chalega

  // CSS variable values ko dynamically get karne ka function
  const getDynamicThemeClass = useCallback((prop: string): string => {
    return `var(--${prop})`; // Example: var(--background-primary)
  }, []); // Koi dependency nahi hai, so useCallback is fine.

  // Context value jo provide kiya jayega
  const contextValue: ThemeContextType = {
    theme,
    setTheme,
    getDynamicThemeClass,
  };

  // Provider ko render karo
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}; // <--- Ensure this closing brace for ThemeProvider is there

// useTheme custom hook
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};