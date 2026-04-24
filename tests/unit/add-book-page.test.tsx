// Mocks fetch and next/navigation
// Unit tests for the Add Book page component 

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AddBook from '@/app/add-book/page';
import {
  mockFetchFail,
  mockFetchNetworkError,
  mockFetchOk,
  mockFetchPending,
} from './support/book-fixtures';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const CREATED_BOOK = {
  id: 99,
  title: 'Test Title',
  author: 'Test Author',
  genre: 'Fiction',
  publishedYear: 2024,
  pages: 100,
  rating: 3,
  description: 'A test book.',
  isbn: '000-0000000000',
} as const;


// Fill title + author + pages using fireEvent 
function fillRequiredFields(title = 'Any Title', author = 'Any Author', pages = '100') {
  fireEvent.change(screen.getByLabelText(/title \*/i), { target: { value: title } });
  fireEvent.change(screen.getByLabelText(/author \*/i), { target: { value: author } });
  fireEvent.change(screen.getByLabelText(/pages/i), { target: { value: pages } });
}

describe('Add Book page', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    mockPush.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('displays the Add New Book heading and all required form fields on load', () => {
    vi.stubGlobal('fetch', mockFetchPending());

    render(<AddBook />);

    expect(screen.getByRole('heading', { name: /add new book/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/author/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add book/i })).toBeInTheDocument();
  });

  it('shows "Book added successfully" banner and redirects to the new book page after a valid submission', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal('fetch', mockFetchOk(CREATED_BOOK, 201));

    render(<AddBook />);

    fillRequiredFields(CREATED_BOOK.title, CREATED_BOOK.author, '100');
    fireEvent.submit(screen.getByRole('button', { name: /add book/i }).closest('form')!);

    await waitFor(() =>
      expect(screen.getByText(/book added successfully/i)).toBeInTheDocument(),
      { timeout: 3000 },
    );

    vi.advanceTimersByTime(1500);
    expect(mockPush).toHaveBeenCalledWith(`/book/${CREATED_BOOK.id}`);
  });

  it('displays the server error message inline when the API rejects the submission', async () => {
    vi.stubGlobal('fetch', mockFetchFail(400, { error: 'Title and author are required' }));

    render(<AddBook />);
    fillRequiredFields('  ', '  ', '1');
    fireEvent.submit(screen.getByRole('button', { name: /add book/i }).closest('form')!);

    await waitFor(() =>
      expect(screen.getByText(/title and author are required/i)).toBeInTheDocument(),
    );
  });

  it('displays an error message when the network request fails completely', async () => {
    vi.stubGlobal('fetch', mockFetchNetworkError('Network failure'));

    render(<AddBook />);
    fillRequiredFields();
    fireEvent.submit(screen.getByRole('button', { name: /add book/i }).closest('form')!);

    await waitFor(() =>
      expect(screen.getByText(/network failure/i)).toBeInTheDocument(),
    );
  });

  it('disables the submit button and shows "Adding book..." while the request is in progress', async () => {
    vi.stubGlobal('fetch', mockFetchPending());

    render(<AddBook />);
    fillRequiredFields();
    fireEvent.submit(screen.getByRole('button', { name: /add book/i }).closest('form')!);

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /adding book/i })).toBeDisabled(),
    );
  });

  it('truncates a decimal rating to a whole number before submitting — e.g. 4.5 is sent as 4 (BUG-002)', async () => {
    vi.stubGlobal('fetch', mockFetchOk(CREATED_BOOK, 201));

    render(<AddBook />);
    fillRequiredFields('Any', 'Anyone', '100');
    fireEvent.change(screen.getByLabelText(/rating/i), { target: { value: '4.5' } });
    fireEvent.submit(screen.getByRole('button', { name: /add book/i }).closest('form')!);

    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalled());
    const body = JSON.parse(
      (vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string,
    ) as { rating: number };
    // BUG-002: parseInt truncates 4.5 → 4
    expect(body.rating).toBe(4);
  });

  it('provides a Cancel link that returns the user to the home page without submitting', () => {
    vi.stubGlobal('fetch', mockFetchPending());

    render(<AddBook />);

    const cancelLink = screen.getByRole('link', { name: /cancel/i });
    expect(cancelLink).toHaveAttribute('href', '/');
  });

  it('renders all optional fields — genre, published year, isbn, description, pages and rating', () => {
    vi.stubGlobal('fetch', mockFetchPending());

    render(<AddBook />);

    expect(screen.getByLabelText(/genre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/published year/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/isbn/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pages/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/rating/i)).toBeInTheDocument();
  });

  it('clears the previous error and shows the success banner when a corrected submission succeeds', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 400, json: () => Promise.resolve({ error: 'Title and author are required' }) })
      .mockResolvedValue({ ok: true, status: 201, json: () => Promise.resolve({ ...CREATED_BOOK, id: 100 }) });

    vi.stubGlobal('fetch', fetchSpy);

    render(<AddBook />);

    fillRequiredFields('  ', '  ', '1');
    fireEvent.submit(screen.getByRole('button', { name: /add book/i }).closest('form')!);
    await waitFor(() =>
      expect(screen.getByText(/title and author are required/i)).toBeInTheDocument(),
    );

    fillRequiredFields(CREATED_BOOK.title, CREATED_BOOK.author, '100');
    fireEvent.submit(screen.getByRole('button', { name: /add book/i }).closest('form')!);
    await waitFor(() =>
      expect(screen.getByText(/book added successfully/i)).toBeInTheDocument(),
    );
    expect(screen.queryByText(/title and author are required/i)).not.toBeInTheDocument();
  });
});
