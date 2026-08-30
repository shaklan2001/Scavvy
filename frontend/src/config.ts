const rawBackendUrl = (process.env.EXPO_PUBLIC_BACKEND_URL ?? "").trim();

export const config = {
  backendUrl: rawBackendUrl.replace(/\/$/, ""),
} as const;

export const isLiveApi = config.backendUrl.length > 0;
export const API_URL = isLiveApi ? `${config.backendUrl}/api` : "";
