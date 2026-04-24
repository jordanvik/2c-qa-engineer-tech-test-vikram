import type { Locator } from '@playwright/test';
import { expectBooksCatalogRequest } from '../helpers/wait-for-books-catalog';
import { BasePage } from './base-page';

// `/` — grid of books and entry points (add book, open detail). No assertions here.

export class BookLibraryHomePage extends BasePage {
  libraryHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Book Library' });
  }

  bookCardHeading(title: string): Locator {
    return this.page.getByRole('heading', { level: 2, name: title });
  }

  async open(): Promise<void> {
    const catalog = expectBooksCatalogRequest(this.page);
    await this.navigate('/');
    await catalog;
  }

  private bookCardLink(title: string): Locator {
    return this.page
      .getByRole('link')
      .filter({ has: this.page.getByRole('heading', { level: 2, name: title }) });
  }

  async openBookByTitle(title: string): Promise<void> {
    const card = this.bookCardLink(title).first();
    await card.waitFor({ state: 'visible' });
    await card.scrollIntoViewIfNeeded();
    await card.click();
  }

  // Card links include author in their accessible name; when many books share the same title (factory templates), use the unique author string from `buildUniqueLiteratureBookPayload()`.

  bookCardLinkWhereAuthor(author: string): Locator {
    return this.page.getByRole('link').filter({ hasText: author });
  }

  async openBookWhereAuthor(author: string): Promise<void> {
    await this.bookCardLinkWhereAuthor(author).click();
  }

  addNewBookLink(): Locator {
    return this.page.getByRole('link', { name: 'Add New Book' });
  }

  async goToAddBook(): Promise<void> {
    await this.addNewBookLink().click();
  }
}
