import { defineCollection, reference } from 'astro:content';
import { z } from 'astro:schema';

import { glob } from 'astro/loaders';

import { turso } from './turso';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lede: z.string(),
    date: z.coerce.date(),
    readingTime: z.number(),
    topic: z.enum(['engineering', 'photography']),
  }),
});

/**
 * Pulled from Turso once per build. The deploy hook triggers a rebuild
 * whenever the data changes, so there are no runtime queries.
 */
const albums = defineCollection({
  loader: async () => {
    const { rows } = await turso.execute('SELECT * FROM albums ORDER BY id');

    return rows.map((row) => ({
      id: String(row.id),
      albumId: Number(row.id),
      title: String(row.title),
      label: row.label === null ? null : String(row.label),
      description: String(row.description),
    }));
  },
  schema: z.object({
    albumId: z.number(),
    title: z.string(),
    label: z.string().nullable(),
    description: z.string(),
  }),
});

const photos = defineCollection({
  loader: async () => {
    const { rows } = await turso.execute('SELECT * FROM photos ORDER BY id');
    return rows.map((row) => {
      const metadata = JSON.parse(String(row.metadata)) as {
        exif?: string;
        variant?: string;
        file?: string;
        aspect?: string;
      };

      return {
        id: String(row.id),
        title: String(row.label),
        alt: row.description === null ? '' : String(row.description),
        url: String(row.url),
        tags: JSON.parse(String(row.tags)) as string[],
        file: metadata.file ?? '',
        exif: metadata.exif ?? '',
        aspect: metadata.aspect ?? '',
        variant: metadata.variant ?? '',
        imageDate: row.image_date === null ? null : Number(row.image_date),
        album: String(row.album_id),
      };
    });
  },
  schema: z.object({
    title: z.string(),
    alt: z.string(),
    url: z.string(),
    tags: z.array(z.string()),
    file: z.string(),
    exif: z.string(),
    aspect: z.string(),
    variant: z.string(),
    imageDate: z.number().nullable(),
    album: reference('albums'),
  }),
});

export const collections = { albums, blog, photos };
