import Constants from "expo-constants";

function expoBundlerOrigin(): string | null {
  const constants = Constants as {
    expoConfig?: { hostUri?: string };
    expoGoConfig?: { debuggerHost?: string };
    manifest?: { debuggerHost?: string; hostUri?: string };
  };
  const candidates = [
    constants.expoConfig?.hostUri,
    constants.expoGoConfig?.debuggerHost,
    constants.manifest?.debuggerHost,
    constants.manifest?.hostUri,
  ];
  for (const candidate of candidates) {
    if (typeof candidate !== "string" || candidate.length === 0) continue;
    const hostPort = candidate
      .replace(/^https?:\/\//, "")
      .replace(/^exp:\/\//, "")
      .split("/")[0]
      ?.trim();
    if (!hostPort) continue;
    const host = hostPort.split(":")[0];
    if (!host || host.endsWith("exp.direct") || host.endsWith("expo.dev")) continue;
    return `http://${hostPort}`;
  }
  return null;
}

function isLoopback(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host === "[::1]";
}

/**
 * In Expo Go, talk to Metro on the same host the app already uses (LAN IP:8081).
 * Metro proxies `/api` to the Node server so the phone never has to open port 4000.
 */
function resolveBackendUrl(): string {
  const fromEnv = (process.env.EXPO_PUBLIC_BACKEND_URL ?? "").trim().replace(/\/$/, "");
  if (!__DEV__) return fromEnv;

  const metro = expoBundlerOrigin();
  if (metro) return metro;

  const envHost = fromEnv.replace(/^https?:\/\//, "").split("/")[0]?.split(":")[0] ?? "";
  if (fromEnv && !isLoopback(envHost)) return fromEnv;
  return fromEnv || "http://localhost:4000";
}

export function getBackendUrl(): string {
  return resolveBackendUrl();
}

export function getApiUrl(): string {
  const backendUrl = resolveBackendUrl();
  return backendUrl ? `${backendUrl}/api` : "";
}

/** Metro first, then EXPO_PUBLIC_BACKEND_URL, so a dead proxy can still reach :4000. */
export function getApiUrlCandidates(): string[] {
  const urls: string[] = [];
  const primary = getApiUrl();
  if (primary) urls.push(primary);
  const fromEnv = (process.env.EXPO_PUBLIC_BACKEND_URL ?? "").trim().replace(/\/$/, "");
  if (fromEnv) {
    const envApi = `${fromEnv}/api`;
    if (!urls.includes(envApi)) urls.push(envApi);
  }
  return urls;
}

export function isLiveApiEnabled(): boolean {
  return resolveBackendUrl().length > 0;
}

/** @deprecated use getApiUrl() — kept for existing imports */
export const config = {
  get backendUrl() {
    return resolveBackendUrl();
  },
} as const;

export const isLiveApi = isLiveApiEnabled();
export const API_URL = getApiUrl();
