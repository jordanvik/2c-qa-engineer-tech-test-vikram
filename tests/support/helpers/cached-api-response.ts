import type { APIResponse } from '@playwright/test';

/**
 * Replays an HTTP body after the real `APIResponse` has been consumed once
 * (Playwright allows only a single read of `text()` / `json()` / `body()`).
 */
export function createCachedApiResponse(params: {
  status: number;
  statusText: string;
  headers: { [key: string]: string };
  url: string;
  bodyText: string;
}): APIResponse {
  const { status, statusText, headers, url, bodyText } = params;

  const headersArray = (): Array<{ name: string; value: string }> =>
    Object.entries(headers).map(([name, value]) => ({ name, value }));

  return {
    status: () => status,
    statusText: () => statusText,
    headers: () => ({ ...headers }),
    headersArray,
    ok: () => status >= 200 && status < 300,
    url: () => url,
    text: async () => bodyText,
    json: async () => JSON.parse(bodyText),
    body: async () => Buffer.from(bodyText, 'utf-8'),
    dispose: async () => {},
    [Symbol.asyncDispose]: async () => {},
  } as APIResponse;
}
