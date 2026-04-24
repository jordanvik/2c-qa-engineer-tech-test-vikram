import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { CreateBookRequest } from '@/types/book';
import { BooksApiClient } from './books-api-client';
import type { ApiCallSnapshot } from '../helpers/api-response-capture';
import {
  drainResponseToCached,
  formatSnapshotBodyForConsole,
  withApiResponseLog,
} from '../helpers/api-response-capture';

const BOOKS = '/api/books';

/**
 * Same as {@link BooksApiClient}, but:
 * - When `transcript` is set, every response is drained once, re-buffered, and appended as an
 *   {@link ApiCallSnapshot} (for Allure / CI — see fixture teardown in `playwright-book-app-fixtures.ts`).
 * - When `PW_DEBUG_API` is `1` or `true`, bodies are also printed to stdout.
 */
export class LoggingBooksApiClient extends BooksApiClient {
  constructor(
    request: APIRequestContext,
    private readonly debug: boolean,
    private readonly transcript: ApiCallSnapshot[] | undefined,
  ) {
    super(request);
  }

  private async wrap(method: string, displayUrl: string, promise: Promise<APIResponse>): Promise<APIResponse> {
    const res = await promise;
    if (!this.debug && !this.transcript) {
      return res;
    }
    if (this.debug && !this.transcript) {
      return withApiResponseLog(method, displayUrl, res);
    }
    if (!this.debug && this.transcript) {
      const { cached, snapshot } = await drainResponseToCached(method, displayUrl, res);
      this.transcript.push(snapshot);
      return cached;
    }
    const { cached, snapshot } = await drainResponseToCached(method, displayUrl, res);
    this.transcript.push(snapshot);
    const bodyForLog = formatSnapshotBodyForConsole(snapshot);
    // eslint-disable-next-line no-console -- PW_DEBUG_API
    console.log(`\n━━ ${method} ${displayUrl} → ${snapshot.status} ${snapshot.statusText}\n${bodyForLog}\n`);
    return cached;
  }

  override list(): Promise<APIResponse> {
    return this.wrap('GET', BOOKS, super.list());
  }

  override getById(id: number): Promise<APIResponse> {
    return this.wrap('GET', `${BOOKS}/${id}`, super.getById(id));
  }

  override getByPathSegment(segment: string): Promise<APIResponse> {
    return this.wrap('GET', `${BOOKS}/${segment}`, super.getByPathSegment(segment));
  }

  override create(body: CreateBookRequest): Promise<APIResponse> {
    return this.wrap('POST', BOOKS, super.create(body));
  }

  override createFromObject(body: Record<string, unknown>): Promise<APIResponse> {
    return this.wrap('POST', BOOKS, super.createFromObject(body));
  }
}

export function createBooksApiClient(
  request: APIRequestContext,
  options?: { transcript?: ApiCallSnapshot[] },
): BooksApiClient {
  const debug = process.env.PW_DEBUG_API === '1' || process.env.PW_DEBUG_API === 'true';
  const transcript = options?.transcript;
  if (debug || transcript) {
    return new LoggingBooksApiClient(request, debug, transcript);
  }
  return new BooksApiClient(request);
}
