import Constants from "expo-constants";

/**
 * Backend API base URL.
 * - When opened via Expo QR (Expo Go): uses same host as the dev server (e.g. your PC's LAN IP) on port 8080, so it works without editing .env.
 * - If EXPO_PUBLIC_API_URL is set, that is used instead.
 * - Otherwise falls back to http://localhost:8080 (simulator/emulator).
 * - No trailing slash.
 */
function getApiBase(): string {
  const envUrl =
    typeof process !== "undefined" && process.env?.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) {
    return envUrl;
  }

  // In Expo Go / dev, use the same host as the packager (from the QR code) so API works when scanning QR
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as unknown as { manifest?: { debuggerHost?: string } }).manifest
      ?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    const resolved = host ? `http://${host}:8080` : null;
    if (resolved) return resolved;
  }
  return "http://localhost:8080";
}

export const API_BASE = getApiBase();
