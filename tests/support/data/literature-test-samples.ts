// literature rows for synthetic POST bodies (not the app’s five seed titles).
// Pair with `unique-literature-book-payload-factory.ts` for unique author tags per run.

export type LiteratureTestSampleRow = {
  title: string;
  author: string;
  genre: string;
  publishedYear: number;
  description: string;
  pages: number;
  isbn: string;
  rating: number;
};

export const LITERATURE_TEST_SAMPLES: readonly LiteratureTestSampleRow[] = [
  {
    title: 'Crime and Punishment',
    author: 'Fyodor Dostoevsky',
    genre: 'Classic',
    publishedYear: 1866,
    description:
      'Raskolnikov, a former student in Saint Petersburg, plans and commits murder to test whether he can transcend moral law—and then faces the psychological and moral consequences.',
    pages: 671,
    isbn: '978-0140449136',
    rating: 4.6,
  },
  {
    title: 'Jane Eyre',
    author: 'Charlotte Brontë',
    genre: 'Classic',
    publishedYear: 1847,
    description:
      'An orphaned governess finds work at Thornfield Hall, where her independence and conscience are tested by secrets tied to the brooding Mr. Rochester.',
    pages: 532,
    isbn: '978-0141441146',
    rating: 4.5,
  },
  {
    title: 'Moby-Dick',
    author: 'Herman Melville',
    genre: 'Classic',
    publishedYear: 1851,
    description:
      'Captain Ahab’s obsessive hunt for the white whale drives a richly symbolic story of fate, nature, and the limits of human knowledge.',
    pages: 635,
    isbn: '978-0142437247',
    rating: 4.3,
  },
  {
    title: 'War and Peace',
    author: 'Leo Tolstoy',
    genre: 'Classic',
    publishedYear: 1869,
    description:
      'Interwoven stories of aristocratic families and historical events explore love, duty, and the search for meaning against the backdrop of the Napoleonic Wars.',
    pages: 1296,
    isbn: '978-0140447934',
    rating: 4.5,
  },
  {
    title: 'Catch-22',
    author: 'Joseph Heller',
    genre: 'Fiction',
    publishedYear: 1961,
    description:
      'Yossarian and his bomber squadron navigate absurd military bureaucracy where the only way to avoid dangerous missions is to be declared insane—and requesting evaluation proves you are sane.',
    pages: 544,
    isbn: '978-1451626650',
    rating: 4.2,
  },
  {
    title: 'Frankenstein',
    author: 'Mary Shelley',
    genre: 'Science Fiction',
    publishedYear: 1818,
    description:
      'Victor Frankenstein’s ambition to create life unleashes a being who confronts him with questions of responsibility, alienation, and what it means to be human.',
    pages: 280,
    isbn: '978-0141439471',
    rating: 4.4,
  },
  {
    title: 'Dracula',
    author: 'Bram Stoker',
    genre: 'Horror',
    publishedYear: 1897,
    description:
      'Letters and diary entries trace a small group’s struggle against Count Dracula as he spreads his influence from Transylvania to England.',
    pages: 488,
    isbn: '978-0141439846',
    rating: 4.3,
  },
  {
    title: 'Les Misérables',
    author: 'Victor Hugo',
    genre: 'Classic',
    publishedYear: 1862,
    description:
      'Jean Valjean’s life spans decades of French society as law, grace, and revolution collide in Hugo’s sweeping moral epic.',
    pages: 1488,
    isbn: '978-0451525260',
    rating: 4.6,
  },
  {
    title: 'Anna Karenina',
    author: 'Leo Tolstoy',
    genre: 'Classic',
    publishedYear: 1877,
    description:
      'Parallel love stories—Anna’s passionate affair and Levin’s search for purpose—examine marriage, faith, and social change in imperial Russia.',
    pages: 864,
    isbn: '978-0143035008',
    rating: 4.5,
  },
  {
    title: 'Brave New World',
    author: 'Aldous Huxley',
    genre: 'Dystopian',
    publishedYear: 1932,
    description:
      'A futuristic World State optimizes stability through conditioning and pleasure, until outsiders challenge whether happiness without freedom is worth having.',
    pages: 311,
    isbn: '978-0060850524',
    rating: 4.2,
  },
] as const;
