/// <reference types="expo/types" />

declare namespace NodeJS {
  interface ProcessEnv {
    // Expo Configuration
    readonly EXPO_PUBLIC_API_URL: string;

    // Supabase Configuration
    readonly EXPO_PUBLIC_SUPABASE_URL: string;
    readonly EXPO_PUBLIC_SUPABASE_ANON_KEY: string;

    // Firebase Configuration
    readonly EXPO_PUBLIC_FIREBASE_API_KEY: string;
    readonly EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
    readonly EXPO_PUBLIC_FIREBASE_PROJECT_ID: string;
    readonly EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
    readonly EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
    readonly EXPO_PUBLIC_FIREBASE_APP_ID: string;
    readonly EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID: string;

    // Google OAuth Configuration
    readonly EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: string;
    readonly EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?: string;
    readonly EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?: string;

    // Backend API URL (runtime resolved)
    readonly EXPO_PUBLIC_BACKEND_URL?: string;
  }
}

// Extend ImportMeta for Expo
interface ImportMetaEnv {
  readonly EXPO_PUBLIC_API_URL: string;
  readonly EXPO_PUBLIC_SUPABASE_URL: string;
  readonly EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
  readonly EXPO_PUBLIC_FIREBASE_API_KEY: string;
  readonly EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
  readonly EXPO_PUBLIC_FIREBASE_PROJECT_ID: string;
  readonly EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
  readonly EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly EXPO_PUBLIC_FIREBASE_APP_ID: string;
  readonly EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID: string;
  readonly EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: string;
  readonly EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?: string;
  readonly EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?: string;
  readonly EXPO_PUBLIC_BACKEND_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
