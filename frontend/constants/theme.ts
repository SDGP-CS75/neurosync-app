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
  { name: "Violet", primary: "#6C5BA1", secondary: "#8d87b1ff", background: "#eeeaff", surface: "#FFFFFF", text: "#1A1726", textMuted: "#6E6A7C", statusDone: "#E8F5E9", statusInProgress: "#FFF3E0", statusTodo: "#E3F2FD", },
  {
    name: "Ocean",
    primary: "#466babff",
    secondary: "#7f9ccaff",
    background: "#EEF4FF",
    surface: "#FFFFFF",
    text: "#0D1B40",
    textMuted: "#5C6E8A",
    statusDone: "#C8E6C9",
    statusInProgress: "#FFE0B2",
    statusTodo: "#BBDEFB",
  },
  {
    name: "Forest Calm",
    primary: "#388E3C",      // strong green for focus
    secondary: "#81C784",    // lighter green for secondary
    background: "#F1F8E9",   // very soft green background
    surface: "#FFFFFF",
    text: "#1B2E1C",         // dark green text
    textMuted: "#607060",     // muted green-grey
    statusDone: "#A5D6A7",   // calming green
    statusInProgress: "#FFCC80", // gentle orange for tasks
    statusTodo: "#B3E5FC",   // soft blue for todo
  },
  {
    name: "Rose",
    primary: "#c85482ff",
    secondary: "#e493aeff",
    background: "#FFF0F5",
    surface: "#FFFFFF",
    text: "#301923ff",
    textMuted: "#7C4A5E",
    statusDone: "#c8e6c9ff",
    statusInProgress: "#FFE0B2",
    statusTodo: "#F8BBD0",
  },
  {
    name: "Amber",
    primary: "#dd973aff",
    secondary: "#f8d45eff",
    background: "#FFFBF0",
    surface: "#FFFFFF",
    text: "#3E2000",
    textMuted: "#7A6040",
    statusDone: "#C8E6C9",
    statusInProgress: "#FFECB3",
    statusTodo: "#BBDEFB",
  },
  {
    name: "Slate",
    primary: "#455A64",
    secondary: "#90A4AE",
    background: "#F0F4F5",
    surface: "#FFFFFF",
    text: "#1C2B31",
    textMuted: "#546E7A",
    statusDone: "#B2DFDB",
    statusInProgress: "#FFE0B2",
    statusTodo: "#B0BEC5",
  },
  {
    name: "Calm Ocean",
    primary: "#0077b6",      // bright but not harsh blue
    secondary: "#4FC3F7",    // lighter blue for accents
    background: "#E1F5FE",   // soft sky-blue background
    surface: "#FFFFFF",
    text: "#0D1B2A",         // dark text for readability
    textMuted: "#607D8B",     // muted grey-blue
    statusDone: "#A5D6A7",   // soft green for completed
    statusInProgress: "#FFE082", // gentle yellow/orange
    statusTodo: "#B3E5FC",   // soft blue
  },

  {
    name: "Vivid Coral",
    primary: "#E64A19",           // strong coral, grabs attention
    secondary: "#FF8A65",         // lighter coral for highlights
    background: "#FFF3E0",        // soft peachy background
    surface: "#FFFFFF",
    text: "#3E2723",              // dark brown text, easy on eyes
    textMuted: "#8D6E63",         // muted brown for secondary text
    statusDone: "#C8E6C9",        // soft green for completed tasks
    statusInProgress: "#FFD54F",  // amber/orange for in-progress
    statusTodo: "#FFCCBC",        // soft peach for todo
  },
  {
    name: "Calm Teal",
    primary: "#00796B",           // strong teal for main focus
    secondary: "#4DB6AC",         // soft teal for accents
    background: "#E0F2F1",        // pale teal background
    surface: "#FFFFFF",
    text: "#004D40",              // dark teal text
    textMuted: "#607D73",         // muted teal-grey
    statusDone: "#A5D6A7",        // calming green for done
    statusInProgress: "#FFB74D",  // gentle orange for active tasks
    statusTodo: "#80CBC4",        // light teal for todo
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

      primary: palette.primary,
      onPrimary: "#FFFFFF",
      primaryContainer: palette.secondary + "33",
      onPrimaryContainer: palette.primary,

      secondary: palette.secondary,
      onSecondary: "#FFFFFF",
      secondaryContainer: palette.secondary + "22",
      onSecondaryContainer: palette.text,

      background: palette.background,
      onBackground: palette.text,

      surface: palette.surface,
      onSurface: palette.text,
      surfaceVariant: palette.background,
      onSurfaceVariant: palette.textMuted,

      outline: palette.secondary + "88",

      error: "#BA1A1A",
      onError: "#FFFFFF",
      errorContainer: "#FFDAD6",
      onErrorContainer: "#410002",

      // Custom tokens
      textMuted: palette.textMuted,
      navBar: palette.background,
      brand: palette.primary,

      // Task status badge colors
      statusDone: palette.statusDone,
      statusInProgress: palette.statusInProgress,
      statusTodo: palette.statusTodo,
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