import type { AddNewBookPage } from '../pages/add-new-book-page';
import { buildUniqueLiteratureBookPayload } from '../data/unique-literature-book-payload-factory';

// Performs the add-book form steps only. Callers in specs own waits and assertions.

export class SubmitNewBookFormWorkflow {
  constructor(private readonly addNewBookPage: AddNewBookPage) {}

  // Fills title, author and pages with a realistic literature payload.
  // Pages is explicitly filled because the field defaults to 0 and min="1" prevents
  // submission until a valid value is entered — this is correct form behaviour.

  async fillSubmitWithUniqueLiteraturePayload(): Promise<{ title: string; author: string }> {
    const payload = buildUniqueLiteratureBookPayload();
    await this.addNewBookPage.open();
    await this.addNewBookPage.fillRequired(payload.title, payload.author);
    await this.addNewBookPage.fillPages(String(payload.pages));
    await this.addNewBookPage.submit();
    return { title: payload.title, author: payload.author };
  }
}
