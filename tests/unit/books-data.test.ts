import { describe, expect, it } from 'vitest';
import { getBookById, getBooks } from '@/lib/books-data';
import { GATSBY_BOOK } from './support/book-fixtures';

describe('books-data', () => {
  it('returns the seeded Gatsby entry with the correct id, title, author, genre, year, isbn, pages and rating', () => {
    const books = getBooks();
    const gatsby = books.find(b => b.id === GATSBY_BOOK.id);
    expect(gatsby).toBeDefined();
    expect(gatsby?.title).toBe(GATSBY_BOOK.title);
    expect(gatsby?.author).toBe(GATSBY_BOOK.author);
    expect(gatsby?.genre).toBe(GATSBY_BOOK.genre);
    expect(gatsby?.publishedYear).toBe(GATSBY_BOOK.publishedYear);
    expect(gatsby?.isbn).toBe(GATSBY_BOOK.isbn);
    expect(gatsby?.pages).toBe(GATSBY_BOOK.pages);
    expect(gatsby?.rating).toBe(GATSBY_BOOK.rating);
  });

  it('looks up a book by id and returns the matching entry', () => {
    const book = getBookById(GATSBY_BOOK.id);
    expect(book?.title).toBe(GATSBY_BOOK.title);
  });

  it('returns undefined when the requested id does not exist in the catalog', () => {
    expect(getBookById(GATSBY_BOOK.id + 1_000_000)).toBeUndefined();
  });
});
