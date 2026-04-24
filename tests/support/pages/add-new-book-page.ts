import type { Locator } from '@playwright/test';
import { BasePage } from './base-page';

// `/add-book` — create-book form. No assertions here.

export class AddNewBookPage extends BasePage {
  formHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Add New Book' });
  }

  successHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Book Added Successfully!' });
  }

  async open(): Promise<void> {
    await this.navigate('/add-book');
  }

  async fillTitle(title: string): Promise<void> {
    await this.page.locator('#title').fill(title);
  }

  async fillAuthor(author: string): Promise<void> {
    await this.page.locator('#author').fill(author);
  }

  async fillRequired(title: string, author: string): Promise<void> {
    await this.fillTitle(title);
    await this.fillAuthor(author);
  }

  async fillPages(pages: string): Promise<void> {
    await this.page.locator('#pages').fill(pages);
  }

  async fillPublishedYear(year: string): Promise<void> {
    await this.page.locator('#publishedYear').fill(year);
  }

  async fillRating(rating: string): Promise<void> {
    await this.page.locator('#rating').fill(rating);
  }

  async fillIsbn(isbn: string): Promise<void> {
    await this.page.locator('#isbn').fill(isbn);
  }

  async fillDescription(description: string): Promise<void> {
    await this.page.locator('#description').fill(description);
  }

  ratingInput(): Locator {
    return this.page.locator('#rating');
  }

  pagesInput(): Locator {
    return this.page.locator('#pages');
  }

  errorBanner(): Locator {
    return this.page.locator('[class*="error"], [role="alert"]').filter({ hasText: /error|required|invalid/i });
  }

  async submit(): Promise<void> {
    await this.page.getByRole('button', { name: 'Add Book' }).click();
  }

  /** Cancel is a Next.js `<Link>` inside the form — scope to the form to avoid matching dev overlays / other UI. */
  cancelLink(): Locator {
    return this.page.locator('form').getByRole('link', { name: /^Cancel$/i });
  }
}
