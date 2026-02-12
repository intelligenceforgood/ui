import { getIapHeaders } from "./auth-helpers";

/**
 * Resolve the backend API base URL from environment variables.
 */
export function resolveApiBase(): string | null {
  return (
    process.env.I4G_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? null
  );
}

/**
 * Resolve the optional API key from environment variables.
 */
export function resolveApiKey(): string | null {
  return process.env.I4G_API_KEY ?? null;
}

export interface ApiFetchOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
  /** Query parameters appended to the URL. */
  queryParams?: Record<string, string>;
}

/**
 * Issue an authenticated fetch against the i4g backend API.
 *
 * Resolves the base URL and API key from env vars, injects IAP headers,
 * and returns the parsed JSON response. Empty response bodies return null.
 *
 * @throws {Error} If the API URL is not configured or the response is not OK.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const baseUrl = resolveApiBase();
  if (!baseUrl) {
    throw new Error("API URL not configured");
  }

  const url = new URL(path, baseUrl);
  if (options.queryParams) {
    for (const [key, value] of Object.entries(options.queryParams)) {
      if (value !== undefined) {
        url.searchParams.set(key, value);
      }
    }
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.headers ?? {}),
  };

  const iapHeaders = await getIapHeaders();
  Object.assign(headers, iapHeaders);

  const apiKey = resolveApiKey();
  if (apiKey) {
    headers["X-API-KEY"] = apiKey;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { queryParams: _, ...fetchInit } = options;
  const response = await fetch(url, {
    ...fetchInit,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `API request to ${path} failed (${response.status}): ${body || "no payload"}`,
    );
  }

  const text = await response.text();
  if (!text) {
    return null as T;
  }
  return JSON.parse(text) as T;
}
