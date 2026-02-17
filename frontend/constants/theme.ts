/**
 * theme.ts
 * ─────────────────────────────────────────────────────────────────
 * Simple, readable theme file.
 *
 * HOW IT WORKS
 * ─────────────────────────────────────────────────────────────────
 * 1. Pick a palette (or let the user pick one).
 * 2. `buildTheme(palette)` turns that palette into a full
 *    React Native Paper v5 (MD3) theme.
 * 3. The default export `theme` uses the Violet palette so your
 *    existing screens keep working with zero changes.
 *
 * ADDING A NEW PALETTE
 * ─────────────────────────────────────────────────────────────────
 * Just add an entry to `COLOR_PALETTES` below — everything else
 * is derived automatically.
 */

import { MD3LightTheme } from "react-native-paper";

// ─────────────────────────────────────────────────────────────────
// 1. PALETTE DEFINITIONS
//    Each palette needs exactly these five colours.
//    primary   → buttons, active icons, links
//    secondary → muted accents, dividers
//    background → screen background
//    surface   → cards, modals, inputs
//    text      → main text colour
//    textMuted → secondary / helper text
// ─────────────────────────────────────────────────────────────────

export type AppPalette = {
  name: string;          // display name shown in the picker
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
};

export const COLOR_PALETTES: AppPalette[] = [
  {
    name: "Violet",       // ← your original brand colour
    primary:    "#5838b5",
    secondary:  "#9c8bfc",
    background: "#e1d8ff",
    surface:    "#FFFFFF",
    text:       "#1A1726",
    textMuted:  "#9f96bc",
  },
  {
    name: "Ocean",
    primary:    "#005eff",
    secondary:  "#4a8fff",
    background: "#EEE9FF",
    surface:    "#FFFFFF",
    text:       "#0D1B40",
    textMuted:  "#5C6E8A",
  },
  {
    name: "Forest",
    primary:    "#207f25",
    secondary:  "#77cf7b",
    background: "#d6f5d6",
    surface:    "#FFFFFF",
    text:       "#1B2E1C",
    textMuted:  "#607060",
  },
  {
    name: "Rose",
    primary:    "#C2185B",
    secondary:  "#F48FB1",
    background: "#fde0e9",
    surface:    "#FFFFFF",
    text:       "#3B0A1F",
    textMuted:  "#7C4A5E",
  },
  {
    name: "Amber",
    primary:    "#FF8F00",
    secondary:  "#f7c934",
    background: "#f9ecc9",
    surface:    "#FFFFFF",
    text:       "#3E2000",
    textMuted:  "#7A6040",
  },
  {
    name: "Slate",
    primary:    "#455A64",
    secondary:  "#90A4AE",
    background: "#cdeff8",
    surface:    "#FFFFFF",
    text:       "#1C2B31",
    textMuted:  "#546E7A",
  },
    {
    name: "Teal",
    primary:    "#2e708f",
    secondary:  "#678da0",
    background: "#b1eeff",
    surface:    "#FFFFFF",
    text:       "#10232a",
    textMuted:  "#4a6c7c",
  },
];

// ─────────────────────────────────────────────────────────────────
// 2. THEME BUILDER
//    Takes a palette and returns a full Paper v5 (MD3) theme.
// ─────────────────────────────────────────────────────────────────

export function buildTheme(palette: AppPalette) {
  return {
    ...MD3LightTheme,

    // roundness: 1 unit = 4 px  →  3 = 12 px corners
    roundness: 3,

    colors: {
      // ── MD3 required roles ───────────────────────────────────────
      ...MD3LightTheme.colors,

      primary:            palette.primary,
      onPrimary:          "#FFFFFF",
      primaryContainer:   palette.secondary + "33",  // 20 % opacity tint
      onPrimaryContainer: palette.primary,

      secondary:            palette.secondary,
      onSecondary:          "#FFFFFF",
      secondaryContainer:   palette.secondary + "22",
      onSecondaryContainer: palette.text,

      background:   palette.background,
      onBackground: palette.text,

      surface:         palette.surface,
      onSurface:       palette.text,
      surfaceVariant:  palette.background,
      onSurfaceVariant:palette.textMuted,

      outline:         palette.secondary + "88",  // 53 % opacity border

      error:           "#BA1A1A",
      onError:         "#FFFFFF",
      errorContainer:  "#FFDAD6",
      onErrorContainer:"#410002",

      // ── Custom tokens (use useAppTheme() for autocomplete) ───────
      // These are NOT standard MD3 but are safe to add here.
      textMuted:  palette.textMuted,   // replaces `otherText` from old theme
      navBar:     palette.background,  // nav bar background colour
      brand:      palette.primary,     // same as primary, convenient alias
    },
  } as const;
}

// ─────────────────────────────────────────────────────────────────
// 3. TYPE HELPERS
// ─────────────────────────────────────────────────────────────────

// The shape of a fully built theme
export type AppTheme = ReturnType<typeof buildTheme>;

// ─────────────────────────────────────────────────────────────────
// 4. DEFAULT THEME  (Violet — your original brand)
//    Import this in screens that don't need dynamic switching.
// ─────────────────────────────────────────────────────────────────

export const theme = buildTheme(COLOR_PALETTES[0]);

// Convenience: screens use theme.colors.primary, theme.colors.textMuted etc.
// No more buttonTheme / inputTheme / cardTheme needed — Paper v5 reads
// `primary` and `surface` from the provider theme automatically.