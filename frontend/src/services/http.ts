import { getApiUrlCandidates, isLiveApiEnabled } from "@/src/config";

const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);
const NEXT_ORIGIN_STATUS = new Set([404, 502, 503, 504]);

function backoffMs(attempt: number): number {
  const base = 200 * 2 ** attempt;
  const jitter = base * (0.2 + Math.random() * 0.3);
  return Math.min(4_000, base + jitter);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === "AbortError") return false;
  return /network|fetch|failed/i.test(error.message);
}

function statusFromError(error: unknown): number | undefined {
  if (!(error instanceof Error)) return undefined;
  const match = /Request failed \((\d+)\)/.exec(error.message);
  if (!match) return undefined;
  return Number(match[1]);
}

async function postOnce<T>(
  apiUrl: string,
  path: string,
  body: Record<string, unknown>,
  timeoutMs: number,
): Promise<T> {
  const maxAttempts = timeoutMs >= 15_000 ? 2 : 3;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${apiUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) {
        if (RETRYABLE_STATUS.has(res.status) && attempt < maxAttempts - 1) {
          const retryAfter = Number(res.headers.get("retry-after"));
          const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : backoffMs(attempt);
          await sleep(waitMs);
          continue;
        }
        throw new Error(`Request failed (${res.status})`);
      }
      return (await res.json()) as T;
    } catch (error) {
      lastError = error;
      if (__DEV__ && attempt === 0) {
        const reason = error instanceof Error ? `${error.name}: ${error.message}` : "unknown";
        console.warn("[scavvy] API request failed", path, reason);
      }
      if (!isRetryableError(error) || attempt >= maxAttempts - 1) {
        throw error;
      }
      await sleep(backoffMs(attempt));
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Request failed");
}

export async function apiPost<T>(path: string, body: Record<string, unknown>, timeoutMs = 6000): Promise<T> {
  const origins = getApiUrlCandidates();
  if (!isLiveApiEnabled() || origins.length === 0) {
    throw new Error("offline");
  }

  let lastError: unknown;
  for (let index = 0; index < origins.length; index += 1) {
    try {
      return await postOnce<T>(origins[index]!, path, body, timeoutMs);
    } catch (error) {
      lastError = error;
      const status = statusFromError(error);
      const canTryNext =
        index < origins.length - 1 &&
        (NEXT_ORIGIN_STATUS.has(status ?? -1) || isRetryableError(error) || (error instanceof Error && error.name === "AbortError"));
      if (!canTryNext) throw error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Request failed");
}

export async function apiGetJson<T>(path: string, timeoutMs = 5000): Promise<T | null> {
  const origins = getApiUrlCandidates();
  if (!isLiveApiEnabled() || origins.length === 0) return null;

  let lastError: unknown;
  for (let index = 0; index < origins.length; index += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${origins[index]}${path}`, { signal: controller.signal });
      if (res.status === 204) return null;
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      return (await res.json()) as T;
    } catch (error) {
      lastError = error;
      const status = statusFromError(error);
      const canTryNext =
        index < origins.length - 1 &&
        (NEXT_ORIGIN_STATUS.has(status ?? -1) || isRetryableError(error) || (error instanceof Error && error.name === "AbortError"));
      if (!canTryNext) return null;
    } finally {
      clearTimeout(timer);
    }
  }

  if (__DEV__ && lastError instanceof Error) {
    console.warn("[scavvy] API GET failed", path, lastError.name);
  }
  return null;
}
