/**
 * ThemeContext.tsx
 * ─────────────────────────────────────────────────────────────────
 * Wraps the whole app so any screen can:
 *   1. Read the active theme     → const { theme } = useAppTheme()
 *   2. Read the active palette   → const { palette } = useAppTheme()
 *   3. Switch to another palette → setPalette(COLOR_PALETTES[2])
 *
 * Usage in a screen:
 *   import { useAppTheme } from "../context/ThemeContext";
 *   const { theme, palette, setPalette } = useAppTheme();
 */

import React, { createContext, useContext, useState } from "react";
import {
  buildTheme,
  COLOR_PALETTES,
  AppPalette,
  AppTheme,
} from "../constants/theme";

// ─────────────────────────────────────────────────────────────────
// Context shape
// ─────────────────────────────────────────────────────────────────

type ThemeContextType = {
  theme: AppTheme;
  palette: AppPalette;
  allPalettes: AppPalette[];
  setPalette: (palette: AppPalette) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

// ─────────────────────────────────────────────────────────────────
// Provider  (put this in your root _layout.tsx)
// ─────────────────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [palette, setPalette] = useState<AppPalette>(COLOR_PALETTES[0]);
  const theme = buildTheme(palette);

  return (
    <ThemeContext.Provider
      value={{ theme, palette, allPalettes: COLOR_PALETTES, setPalette }}
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