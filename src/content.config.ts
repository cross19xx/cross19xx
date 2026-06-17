import { defineCollection, reference } from 'astro:content';
import { z } from 'astro:schema';

import { glob } from 'astro/loaders';

import { turso } from './turso';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lede: z.string(),
    date: z.coerce.date(),
    readingTime: z.number(),
    topic: z.enum(['Engineering', 'Photography', 'Life']),
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
        name: string;
        makeAndModel: string;
        lens: string;
        aperture: string;
        shutterSpeed: string;
        iso: number;
      };

      return {
        id: String(row.id),
        label: String(row.label),
        url: String(row.url),
        featured: row.featured === 1,
        width: Number(row.width),
        height: Number(row.height),
        tags: JSON.parse(String(row.tags)) as string[],
        description: row.description === null ? '' : String(row.description),

        // Metadata details
        name: String(metadata.name),
        makeAndModel: String(metadata.makeAndModel),
        lens: String(metadata.lens),
        aperture: String(metadata.aperture),
        shutterSpeed: String(metadata.shutterSpeed),
        iso: Number(metadata.iso),

        imageDate: row.image_date === null ? null : Number(row.image_date),
        album: String(row.album_id),
        blurhash: String(row.blurhash),
      };
    });
  },
  schema: z.object({
    label: z.string(),
    url: z.string(),
    featured: z.boolean(),
    width: z.number(),
    height: z.number(),
    tags: z.array(z.string()),
    description: z.string(),
    name: z.string(),
    makeAndModel: z.string(),
    lens: z.string(),
    aperture: z.string(),
    shutterSpeed: z.string(),
    iso: z.number(),
    imageDate: z.number().nullable(),
    blurhash: z.string(),
    album: reference('albums'),
  }),
});

export const collections = { albums, blog, photos };
