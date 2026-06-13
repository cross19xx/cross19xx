import { getEntry } from 'astro:content';

// Curated homepage picks (photo IDs from the seed) + layout overrides.
const featuredPicks: { id: string; aspect: string; delay?: string }[] = [
  { id: '1', aspect: 'aspect-4/5' },
  { id: '14', aspect: 'aspect-square', delay: '[--reveal-delay:75ms]' },
  { id: '11', aspect: 'aspect-3/4', delay: '[--reveal-delay:150ms]' },
  { id: '5', aspect: 'aspect-square' },
  { id: '6', aspect: 'aspect-4/5', delay: '[--reveal-delay:75ms]' },
  { id: '12', aspect: 'aspect-3/4', delay: '[--reveal-delay:150ms]' },
];

/**
 * Reads from the content store (populated once per build by the Turso loader in content.config.ts)
 * — no query runs here.
 * @returns An array of featured photos with their aspect ratio and delay class.
 */
export async function getFeaturedPhotos() {
  const entries = await Promise.all(
    featuredPicks.map(async (pick) => {
      const entry = await getEntry('photos', pick.id);
      if (!entry) return null;
      const { title, alt, url, file } = entry.data;
      return { photo: { title, alt, url, file }, aspect: pick.aspect, delay: pick.delay };
    }),
  );

  return entries.filter((entry) => entry !== null);
}
