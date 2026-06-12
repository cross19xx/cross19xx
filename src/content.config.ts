import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

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

export const collections = { blog };
