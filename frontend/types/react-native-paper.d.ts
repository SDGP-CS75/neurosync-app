/**
 * frontend/types/react-native-paper.d.ts
 * ─────────────────────────────────────────────────────────────────
 * TypeScript module augmentation for React Native Paper custom colors.
 * 
 * CRITICAL: This file MUST be in frontend/types/ for TypeScript to find it.
 */

declare module 'react-native-paper' {
  namespace ReactNativePaper {
    interface MD3Colors {
      textMuted: string;
      navBar: string;
      brand: string;
      statusDone: string;
      statusInProgress: string;
      statusTodo: string;
    }
  }
}

// This empty export makes it a module
export {};