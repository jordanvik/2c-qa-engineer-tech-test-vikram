import { expect } from '@playwright/test';

// Asserts a JSON book row has required fields and sensible primitive types.

export function expectRequiredBookFields(row: unknown): void {
  expect(row).toBeTruthy();
  expect(typeof row).toBe('object');
  const b = row as Record<string, unknown>;
  expect(typeof b.id).toBe('number');
  expect(b.id as number).toBeGreaterThan(0);
  expect(typeof b.title).toBe('string');
  expect(String(b.title).length).toBeGreaterThan(0);
  expect(typeof b.author).toBe('string');
  expect(String(b.author).length).toBeGreaterThan(0);
  expect(typeof b.genre).toBe('string');
  expect(typeof b.publishedYear).toBe('number');
  expect(typeof b.description).toBe('string');
  expect(typeof b.isbn).toBe('string');
  expect(typeof b.pages).toBe('number');
  expect(typeof b.rating).toBe('number');
}
