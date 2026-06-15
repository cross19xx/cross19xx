/**
 * Single source of truth for the copy on every standalone page. Static pages
 * read their title/description from here, and the OG image endpoint reads the
 * same entries to decide which cards to generate — so the two never drift.
 *
 * A page that sets `image` ships its own social image and is skipped by the
 * generator; BaseHead references that image instead.
 */
export interface PageMeta {
  /** Card heading and the basis of the page <title>. Kept brand-suffix free. */
  title: string;
  description: string;
  /** Explicit social image. Present = opt out of OG generation. */
  image?: string;
}

export const PAGE_META = {
  '/': {
    title: 'Kenneth Kwakye-Gyamfi',
    description:
      'Kenneth Kwakye-Gyamfi is a senior mobile & web full stack engineer, husband, father, photographer, and a proud Ghanaian.',
  },
  '/about': {
    title: 'About',
    description: 'Full stack mobile and web developer and photographer based in Accra, Ghana.',
  },
  '/projects': {
    title: 'Projects',
    description: 'Apps, tools, and ideas in various states of done.',
  },
  '/photography': {
    title: 'Photography',
    description: 'Albums from Accra, the Ghanaian coast, and beyond.',
  },
  '/blog': {
    title: 'Writing',
    description: 'Notes on building software, making pictures, life and the places they overlap.',
  },
  '/uses': {
    title: 'Uses',
    description: 'The hardware, software, and camera gear I actually reach for.',
  },
  '/404': {
    title: 'Page not found',
    description: 'That link may be broken or the page may have moved.',
  },
  '/token-usage': {
    title: 'Token Usage',
    description: 'A comprehensive breakdown of my AI token usage',
  },
};

export type PageRoute = keyof typeof PAGE_META;
