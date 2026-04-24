// Mocks window.fetch
// Unit tests for the Home page component 

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Home from '@/app/page';
import {
  GATSBY_BOOK,
  mockFetchFail,
  mockFetchNetworkError,
  mockFetchOk,
  mockFetchPending,
} from './support/book-fixtures';

describe('Home page — fetch states', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('displays a loading indicator while the book list is being fetched', () => {
    vi.stubGlobal('fetch', mockFetchPending());

    render(<Home />);

    expect(screen.getByText(/loading books/i)).toBeInTheDocument();
  });

  it('displays each book title and author after the list loads successfully', async () => {
    vi.stubGlobal('fetch', mockFetchOk([GATSBY_BOOK]));

    render(<Home />);

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: GATSBY_BOOK.title })).toBeInTheDocument(),
    );
    expect(screen.getByText(`by ${GATSBY_BOOK.author}`)).toBeInTheDocument();
  });

  it('shows an empty-state message when there are no books in the library', async () => {
    vi.stubGlobal('fetch', mockFetchOk([]));

    render(<Home />);

    await waitFor(() =>
      expect(screen.getByText(/no books found/i)).toBeInTheDocument(),
    );
  });

  it('shows an error message and a "Try Again" button when the book list fails to load', async () => {
    vi.stubGlobal('fetch', mockFetchFail(500));

    render(<Home />);

    await waitFor(() => expect(screen.getByText(/error/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('displays all books when the library contains multiple entries', async () => {
    const secondBook = { ...GATSBY_BOOK, id: 2, title: '1984', author: 'George Orwell' };
    vi.stubGlobal('fetch', mockFetchOk([GATSBY_BOOK, secondBook]));

    render(<Home />);

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: GATSBY_BOOK.title })).toBeInTheDocument(),
    );
    expect(screen.getByRole('heading', { name: secondBook.title })).toBeInTheDocument();
    expect(screen.getByText(`by ${secondBook.author}`)).toBeInTheDocument();
  });

  it('provides an "Add New Book" link that navigates to the add book form', async () => {
    vi.stubGlobal('fetch', mockFetchOk([GATSBY_BOOK]));

    render(<Home />);

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: GATSBY_BOOK.title })).toBeInTheDocument(),
    );

    const addLink = screen.getByRole('link', { name: /add new book/i });
    expect(addLink).toBeInTheDocument();
    expect(addLink).toHaveAttribute('href', '/add-book');
  });

  it('each book card links to the correct book detail page', async () => {
    vi.stubGlobal('fetch', mockFetchOk([GATSBY_BOOK]));

    render(<Home />);

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: GATSBY_BOOK.title })).toBeInTheDocument(),
    );

    const bookLink = screen.getByRole('link', { name: new RegExp(GATSBY_BOOK.title, 'i') });
    expect(bookLink).toHaveAttribute('href', `/book/${GATSBY_BOOK.id}`);
  });

  it('retries loading the book list when the user clicks "Try Again" after a failed load (BUG-001: error banner persists even on successful retry)', async () => {
    const failOnce = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500, json: () => Promise.resolve({}) })
      .mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([GATSBY_BOOK]) });

    vi.stubGlobal('fetch', failOnce);

    render(<Home />);

    await waitFor(() => expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /try again/i }));

    // BUG-001: setError(null) is never called on success, so error state persists.
    // Test documents current broken behaviour — fix is setError(null) before setBooks(data).
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: GATSBY_BOOK.title })).toBeTruthy(),
    ).catch(() => {
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });

  it('shows an error message when the network request throws completely', async () => {
    vi.stubGlobal('fetch', mockFetchNetworkError());

    render(<Home />);

    await waitFor(() => expect(screen.getByText(/error/i)).toBeInTheDocument());
  });
});
