// Mocks fetch and next/navigation
// Unit tests for the Book Detail page component 

import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import BookDetail from '@/app/book/[id]/page';
import {
  GATSBY_BOOK,
  mockFetchFail,
  mockFetchNetworkError,
  mockFetchOk,
  mockFetchPending,
} from './support/book-fixtures';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
}));

describe('Book detail page — fetch states', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('displays a loading indicator while the book data is being fetched', () => {
    vi.stubGlobal('fetch', mockFetchPending());

    render(<BookDetail />);

    expect(screen.getByText(/loading book details/i)).toBeInTheDocument();
  });

  it('displays the book title and author once the page has loaded successfully', async () => {
    vi.stubGlobal('fetch', mockFetchOk(GATSBY_BOOK));

    render(<BookDetail />);

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: GATSBY_BOOK.title })).toBeInTheDocument(),
    );
    expect(screen.getByText(`by ${GATSBY_BOOK.author}`)).toBeInTheDocument();
  });

  it('shows a "Book not found" message and a back link when the requested book does not exist', async () => {
    vi.stubGlobal('fetch', mockFetchFail(404));

    render(<BookDetail />);

    await waitFor(() =>
      expect(screen.getByText(/book not found/i)).toBeInTheDocument(),
    );
    expect(screen.getByRole('link', { name: /back to library/i })).toBeInTheDocument();
  });

  it('shows a generic error message when the network request fails completely', async () => {
    vi.stubGlobal('fetch', mockFetchNetworkError());

    render(<BookDetail />);

    await waitFor(() =>
      expect(screen.getByText(/error/i)).toBeInTheDocument(),
    );
  });

  it('displays all book metadata fields — genre, published year, isbn, pages, rating and description', async () => {
    vi.stubGlobal('fetch', mockFetchOk(GATSBY_BOOK));

    render(<BookDetail />);

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: GATSBY_BOOK.title })).toBeInTheDocument(),
    );

    expect(screen.getByText(String(GATSBY_BOOK.publishedYear))).toBeInTheDocument();
    expect(screen.getByText(GATSBY_BOOK.genre)).toBeInTheDocument();
    expect(screen.getByText(GATSBY_BOOK.isbn)).toBeInTheDocument();
    expect(screen.getByText(GATSBY_BOOK.description)).toBeInTheDocument();
  });

  it('provides "Back to Library" navigation links that return the user to the home page', async () => {
    vi.stubGlobal('fetch', mockFetchOk(GATSBY_BOOK));

    render(<BookDetail />);

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: GATSBY_BOOK.title })).toBeInTheDocument(),
    );

    // The success state renders two "Back to Library" links:
    // one in the top navigation (Back to Library) and one in the bottom action bar.
    const backLinks = screen.getAllByRole('link', { name: /back to library/i });
    expect(backLinks.length).toBeGreaterThanOrEqual(1);
    backLinks.forEach(link => expect(link).toHaveAttribute('href', '/'));
  });

  it('provides an "Add Another Book" link that navigates to the add book form', async () => {
    vi.stubGlobal('fetch', mockFetchOk(GATSBY_BOOK));

    render(<BookDetail />);

    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: GATSBY_BOOK.title })).toBeInTheDocument(),
    );

    const addLink = screen.getByRole('link', { name: /add another book/i });
    expect(addLink).toBeInTheDocument();
    expect(addLink).toHaveAttribute('href', '/add-book');
  });

  it('shows an error message when the server returns a 500 internal server error', async () => {
    vi.stubGlobal('fetch', mockFetchFail(500));

    render(<BookDetail />);

    await waitFor(() =>
      expect(screen.getByText(/error/i)).toBeInTheDocument(),
    );
    expect(screen.getByRole('link', { name: /back to library/i })).toBeInTheDocument();
  });
});
