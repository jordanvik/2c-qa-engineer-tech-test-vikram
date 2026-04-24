import type { APIResponse } from '@playwright/test';
import { createCachedApiResponse } from './cached-api-response';

/** One HTTP round-trip through `BooksApiClient` (for Allure / CI transcripts). */
export type ApiCallSnapshot = {
  method: string;
  /** Logical path, e.g. `/api/books` or `/api/books/1` */
  path: string;
  status: number;
  statusText: string;
  responseUrl: string;
  /** May be truncated for very large payloads (e.g. huge `GET /api/books` arrays). */
  body: string;
};

const MAX_SNAPSHOT_BODY = 100_000;
const MAX_CONSOLE_BODY = 12_000;

/**
 * Consumes the live `APIResponse` once, builds a replayable cached response,
 * and returns metadata for logging / Allure.
 */
export async function drainResponseToCached(
  method: string,
  displayPath: string,
  res: APIResponse,
): Promise<{ cached: APIResponse; snapshot: ApiCallSnapshot }> {
  const status = res.status();
  const statusText = res.statusText();
  const headers = res.headers();
  const resUrl = res.url();
  const text = await res.text();

  const bodyForSnapshot =
    text.length > MAX_SNAPSHOT_BODY
      ? `${text.slice(0, MAX_SNAPSHOT_BODY)}\n… [truncated: ${text.length} bytes total]`
      : text;

  return {
    cached: createCachedApiResponse({
      status,
      statusText,
      headers,
      url: resUrl,
      bodyText: text,
    }),
    snapshot: {
      method,
      path: displayPath,
      status,
      statusText,
      responseUrl: resUrl,
      body: bodyForSnapshot,
    },
  };
}

/** Pretty-print JSON for console when the payload parses. */
export function formatSnapshotBodyForConsole(snapshot: ApiCallSnapshot): string {
  const raw = snapshot.body;
  const preview =
    raw.length > MAX_CONSOLE_BODY
      ? `${raw.slice(0, MAX_CONSOLE_BODY)}\n… [truncated: ${raw.length} bytes total]`
      : raw;
  try {
    return JSON.stringify(JSON.parse(preview), null, 2);
  } catch {
    return preview;
  }
}

/**
 * Opt-in stdout logging for local debugging (`PW_DEBUG_API=1`).
 * Returns a cached `APIResponse` so tests can still call `json()` / `text()`.
 */
export async function withApiResponseLog(
  method: string,
  displayUrl: string,
  res: APIResponse,
): Promise<APIResponse> {
  const { cached, snapshot } = await drainResponseToCached(method, displayUrl, res);
  const bodyForLog = formatSnapshotBodyForConsole(snapshot);

  // eslint-disable-next-line no-console -- intentional opt-in test debug channel
  console.log(`\n━━ ${method} ${displayUrl} → ${snapshot.status} ${snapshot.statusText}\n${bodyForLog}\n`);

  return cached;
}
