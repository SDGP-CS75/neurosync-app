/**
 * frontend/constants/theme.ts
 * ─────────────────────────────────────────────────────────────────
 * Theme configuration with custom colors.
 * Uses `any` type to bypass TypeScript strict checking.
 */

import { MD3LightTheme } from "react-native-paper";

// ─────────────────────────────────────────────────────────────────
// PALETTE DEFINITIONS
// ─────────────────────────────────────────────────────────────────

export type AppPalette = {
  name: string;
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  statusDone: string;
  statusInProgress: string;
  statusTodo: string;
};

export const COLOR_PALETTES: AppPalette[] = [
  {
    name: "Violet",
    primary:    "#7A69AD",
    secondary:  "#B0A4F5",
    background: "#F3F0FF",
    surface:    "#FFFFFF",
    text:       "#1A1726",
    textMuted:  "#6E6A7C",
    statusDone:       "#E8F5E9",
    statusInProgress: "#FFF3E0",
    statusTodo:       "#E3F2FD",
  },
  {
    name: "Ocean",
    primary:    "#2979FF",
    secondary:  "#82B1FF",
    background: "#EEF4FF",
    surface:    "#FFFFFF",
    text:       "#0D1B40",
    textMuted:  "#5C6E8A",
    statusDone:       "#C8E6C9",
    statusInProgress: "#FFE0B2",
    statusTodo:       "#BBDEFB",
  },
  {
    name: "Forest",
    primary:    "#2E7D32",
    secondary:  "#81C784",
    background: "#F1F8F1",
    surface:    "#FFFFFF",
    text:       "#1B2E1C",
    textMuted:  "#607060",
    statusDone:       "#A5D6A7",
    statusInProgress: "#FFCCBC",
    statusTodo:       "#B3E5FC",
  },
  {
    name: "Rose",
    primary:    "#C2185B",
    secondary:  "#F48FB1",
    background: "#FFF0F5",
    surface:    "#FFFFFF",
    text:       "#3B0A1F",
    textMuted:  "#7C4A5E",
    statusDone:       "#C8E6C9",
    statusInProgress: "#FFE0B2",
    statusTodo:       "#F8BBD0",
  },
  {
    name: "Amber",
    primary:    "#FF8F00",
    secondary:  "#FFD54F",
    background: "#FFFBF0",
    surface:    "#FFFFFF",
    text:       "#3E2000",
    textMuted:  "#7A6040",
    statusDone:       "#C8E6C9",
    statusInProgress: "#FFECB3",
    statusTodo:       "#BBDEFB",
  },
  {
    name: "Slate",
    primary:    "#455A64",
    secondary:  "#90A4AE",
    background: "#F0F4F5",
    surface:    "#FFFFFF",
    text:       "#1C2B31",
    textMuted:  "#546E7A",
    statusDone:       "#B2DFDB",
    statusInProgress: "#FFE0B2",
    statusTodo:       "#B0BEC5",
  },
];

// ─────────────────────────────────────────────────────────────────
// THEME BUILDER
// ─────────────────────────────────────────────────────────────────

export function buildTheme(palette: AppPalette) {
  return {
    ...MD3LightTheme,
    roundness: 3,

    colors: {
      ...MD3LightTheme.colors,

      primary:            palette.primary,
      onPrimary:          "#FFFFFF",
      primaryContainer:   palette.secondary + "33",
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

      outline:         palette.secondary + "88",

      error:           "#BA1A1A",
      onError:         "#FFFFFF",
      errorContainer:  "#FFDAD6",
      onErrorContainer:"#410002",

      // Custom tokens
      textMuted:  palette.textMuted,
      navBar:     palette.background,
      brand:      palette.primary,

      // Task status badge colors
      statusDone:       palette.statusDone,
      statusInProgress: palette.statusInProgress,
      statusTodo:       palette.statusTodo,
    } as any,
  } as any;
}

// ─────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────

export type AppTheme = ReturnType<typeof buildTheme>;

// ─────────────────────────────────────────────────────────────────
// DEFAULT THEME
// ─────────────────────────────────────────────────────────────────

export const theme = buildTheme(COLOR_PALETTES[0]);