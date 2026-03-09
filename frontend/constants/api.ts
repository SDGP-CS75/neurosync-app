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
    // #region agent log
    fetch(`${envUrl}/api/debug-log`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:getApiBase',message:'API_BASE from env',data:{apiBase:envUrl,source:'EXPO_PUBLIC_API_URL'},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
    // #endregion
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
    // #region agent log
    if (resolved) fetch(`${resolved}/api/debug-log`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:getApiBase',message:'API_BASE from hostUri',data:{hostUri,host,apiBase:resolved},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (resolved) return resolved;
  } else {
    const fallback = "http://localhost:8080";
    // #region agent log
    fetch(`${fallback}/api/debug-log`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:getApiBase',message:'API_BASE fallback localhost',data:{expoConfigHostUri:Constants.expoConfig?.hostUri,manifestDebuggerHost:(Constants as unknown as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return fallback;
  }
  return "http://localhost:8080";
}

export const API_BASE = getApiBase();
