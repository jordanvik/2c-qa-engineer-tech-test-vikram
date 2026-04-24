// Stable identifiers for the app's built-in seed catalog (used in UI + API assertions).

export const SEED_BOOK = {
  gatsbyTitle: 'The Great Gatsby',
  gatsbyAuthor: 'F. Scott Fitzgerald',
  gatsbyId: 1,
  // An id that is never to exist in the seed data.
  nonExistentId: 999_999,
} as const;
