/**
 * app/context/ThemeContext.tsx
 * ─────────────────────────────────────────────────────────────────
 * Global theme state management.
 * 
 * Usage in any screen:
 *   const { theme, palette, setPalette } = useAppTheme();
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  buildTheme,
  COLOR_PALETTES,
  AppPalette,
  AppTheme,
} from "../constants/theme";

// Helper to find palette by name
export function getPaletteByName(name: string | null | undefined): AppPalette {
  if (!name) return COLOR_PALETTES[0];
  const found = COLOR_PALETTES.find(p => p.name.toLowerCase() === name.toLowerCase());
  return found || COLOR_PALETTES[0];
}

// ─────────────────────────────────────────────────────────────────
// Context shape
// ─────────────────────────────────────────────────────────────────

type ThemeContextType = {
  theme: AppTheme;
  palette: AppPalette;
  allPalettes: AppPalette[];
  setPalette: (palette: AppPalette) => void;
  // Optional callback to save theme preference when changed
  onPaletteChange?: (paletteName: string) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

// ─────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────

type ThemeProviderProps = {
  children: React.ReactNode;
  initialPaletteName?: string | null;
  onPaletteChange?: (paletteName: string) => void;
};

export function ThemeProvider({ children, initialPaletteName, onPaletteChange }: ThemeProviderProps) {
  const [palette, setPalette] = useState<AppPalette>(() => {
    // Use initial palette name if provided (from stored user preference)
    if (initialPaletteName) {
      return getPaletteByName(initialPaletteName);
    }
    return COLOR_PALETTES[0];
  });
  
  // Update palette when initialPaletteName changes (e.g., after user login)
  useEffect(() => {
    if (initialPaletteName) {
      const newPalette = getPaletteByName(initialPaletteName);
      // Only update if different to avoid unnecessary re-renders
      setPalette(current => {
        if (current.name !== newPalette.name) {
          return newPalette;
        }
        return current;
      });
    }
  }, [initialPaletteName]);
  
  const theme = buildTheme(palette);

  // Handle palette change and notify parent if callback provided
  const handleSetPalette = (newPalette: AppPalette) => {
    setPalette(newPalette);
    if (onPaletteChange) {
      onPaletteChange(newPalette.name);
    }
  };

  return (
    <ThemeContext.Provider
      value={{ 
        theme, 
        palette, 
        allPalettes: COLOR_PALETTES, 
        setPalette: handleSetPalette,
        onPaletteChange 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────

export function useAppTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useAppTheme must be used inside <ThemeProvider>");
  }
  return ctx;
}