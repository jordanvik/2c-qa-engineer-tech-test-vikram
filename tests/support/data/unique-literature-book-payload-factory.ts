import type { CreateBookRequest } from '@/types/book';
import { LITERATURE_TEST_SAMPLES } from './literature-test-samples';

let counter = 0;

// Builds a POST-ready payload from `literature-test-samples.ts`, with a unique author tag
// so parallel workers do not clash in the in-memory store.

export function buildUniqueLiteratureBookPayload(
  overrides: Partial<CreateBookRequest> = {},
): CreateBookRequest {
  counter += 1;
  const runId = `${Date.now()}-${counter}`;
  const template = LITERATURE_TEST_SAMPLES[(counter - 1) % LITERATURE_TEST_SAMPLES.length];
  const authorWithRun = `${template.author} (automation run ${runId})`;

  return {
    title: template.title,
    author: authorWithRun,
    genre: template.genre,
    publishedYear: template.publishedYear,
    description: template.description,
    isbn: template.isbn,
    pages: template.pages,
    rating: template.rating,
    ...overrides,
  };
}
