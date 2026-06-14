import { getCollection } from 'astro:content';

import { PAGE_META, type PageMeta } from '_/data/pages';
import { pathToOgSlug } from '_/lib/og/paths';
import { renderOgImage } from '_/lib/og/render';

import type { APIRoute, GetStaticPaths } from 'astro';

interface Props {
  title: string;
  description: string;
}

/**
 * Enumerate every route that should get a generated card. A route is included
 * only when it has no explicit `image` of its own — those opt out of generation
 * and BaseHead references their declared image instead.
 *
 * The slug is derived from the page's own pathname (`pathToOgSlug`), the same
 * helper BaseHead uses to point `og:image` here, so the two never drift.
 */
export const getStaticPaths: GetStaticPaths = async () => {
  const staticPages = Object.entries(PAGE_META)
    .filter(([, meta]) => !(meta as PageMeta).image)
    .map(([pathname, meta]) => ({
      params: { slug: pathToOgSlug(pathname) },
      props: { title: meta.title, description: meta.description } satisfies Props,
    }));

  const posts = (await getCollection('blog')).map((post) => ({
    params: { slug: pathToOgSlug(`/posts/${post.id}`) },
    props: {
      title: post.data.title,
      description: post.data.description,
    } satisfies Props,
  }));

  const albums = (await getCollection('albums')).map((album) => ({
    params: { slug: pathToOgSlug(`/albums/${album.id}`) },
    props: {
      title: album.data.title,
      description: album.data.description,
    } satisfies Props,
  }));

  return [...staticPages, ...posts, ...albums];
};

export const GET: APIRoute<Props> = async ({ props }) => {
  const png = await renderOgImage(props);

  return new Response(png as BodyInit, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
