import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { Book } from '@/lib/books-data';
import type { CreateBookRequest } from '@/types/book';

const BOOKS_PATH = '/api/books';

// HTTP client for the books REST resource (`/api/books`).
// No assertions here — tests/services own expectations (common “*Client” pattern for API access).

export class BooksApiClient {
  constructor(private readonly request: APIRequestContext) {}

  list(): Promise<APIResponse> {
    return this.request.get(BOOKS_PATH);
  }

  getById(id: number): Promise<APIResponse> {
    return this.request.get(`${BOOKS_PATH}/${id}`);
  }

  // GET `/api/books/{segment}` — for ambiguous or invalid id path tests (e.g. `1.5`, `abc`).
   
  getByPathSegment(segment: string): Promise<APIResponse> {
    return this.request.get(`${BOOKS_PATH}/${encodeURIComponent(segment)}`);
  }

  create(body: CreateBookRequest): Promise<APIResponse> {
    return this.request.post(BOOKS_PATH, {
      headers: { 'Content-Type': 'application/json' },
      data: body,
    });
  }

  // POST JSON body as a plain object (e.g. extra keys for contract / abuse tests).
  createFromObject(body: Record<string, unknown>): Promise<APIResponse> {
    return this.request.post(BOOKS_PATH, {
      headers: { 'Content-Type': 'application/json' },
      data: body,
    });
  }

  async listJson(): Promise<Book[]> {
    const res = await this.list();
    return res.json() as Promise<Book[]>;
  }

  async getByIdJson(id: number): Promise<Book> {
    const res = await this.getById(id);
    return res.json() as Promise<Book>;
  }
}
