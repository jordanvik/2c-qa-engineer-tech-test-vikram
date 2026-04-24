# QA Engineer Tech Test - Book Library Application

## Overview

This is a technical test for QA Engineer applicants. The application is a simple book library built with Next.js that allows users to view a list of books, see detailed information about individual books, and add new books to the library.

## Application Features

### Core Functionality
- **Home Page**: Displays a list of all books with basic information (title, author, genre, rating, etc.)
- **Book Detail Page**: Shows comprehensive information about a specific book when clicked
- **Add Book Form**: Allows users to add new books to the library with validation

### Technical Stack
- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: Next.js API routes (fake backend with in-memory storage)
- **Testing**: Playwright (E2E) and Vitest (Unit) configured and ready to use

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository (or unzip the tech test).
2. **Open a terminal in this folder** — the one that contains `package.json` and this `README.md`.  
   If you are in a parent directory (for example `Book App`) and see `npm error enoent` / “could not find `package.json`”, change into the project root first, e.g. `cd 2c-qa-engineer-tech-test-vikram` (use your actual folder name).
3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run unit tests with Vitest (watch mode)
- `npm run test:coverage` - Run unit tests with V8 coverage report
- `npm run test:e2e` - Run E2E tests with Playwright
- `npm run allure:generate` - Generate Allure HTML report from `allure-results/`
- `npm run allure:open` - Open the generated Allure report in a browser
- `npm run allure:report` - Generate and open Allure report in one step

> **Note:** The `allure:*` scripts require the [Allure CLI](https://allurereport.org/docs/install/) installed globally (`npm install -g allure-commandline`).

See [TESTING.md](./TESTING.md) for full details on running tests, filtering by tag, trace-on-failure behaviour, and CI integration.

### Automated tests (layout)

| Path | Role |
|------|------|
| `tests/ui/` | Product browser journeys — library, add-book, responsive, `test.fail()` bug regressions |
| `tests/accessibility/` | axe WCAG AA smoke; **BUG-015** (`test.fail()` on home/detail until contrast fixed) + JSON report attachments |
| `tests/api/` | `books-api.spec.ts` (contract, boundary, repeat), `books-api-path-hygiene.spec.ts`, `books-api-injection-literals.spec.ts` |
| `tests/security/` | Stored-markup smoke on `/book/[id]` after API create |
| `tests/integration/` | POST `/api/books` then verify catalog JSON and/or home + detail UI |
| `tests/unit/` | Vitest — same screens as UI tests but mocked `fetch` (fast regression on render logic) |
| `tests/support/` | Fixtures, POMs, clients, factories (not executed as specs) |

## API Endpoints

### GET /api/books
Returns a list of all books

**Response:**
```json
[
  {
    "id": 1,
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "genre": "Classic",
    "publishedYear": 1925,
    "description": "A story of decadence and excess...",
    "isbn": "978-0743273565",
    "pages": 180,
    "rating": 4.2
  }
]
```

### GET /api/books/[id]
Returns details of a specific book by ID

**Response:**
```json
{
  "id": 1,
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "genre": "Classic",
  "publishedYear": 1925,
  "description": "A story of decadence and excess...",
  "isbn": "978-0743273565",
  "pages": 180,
  "rating": 4.2
}
```

### POST /api/books
Adds a new book to the library

**Request Body:**
```json
{
  "title": "Book Title",
  "author": "Author Name",
  "genre": "Fiction",
  "publishedYear": 2024,
  "description": "Book description",
  "isbn": "978-1234567890",
  "pages": 300,
  "rating": 4.5
}
```

**Required Fields:** `title`, `author`