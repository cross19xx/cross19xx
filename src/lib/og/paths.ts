/**
 * The URL contract between the OG endpoint and BaseHead. The endpoint names
 * each generated file with `pathToOgSlug`; BaseHead points `og:image` at the
 * same path with `ogImagePath`. Keep this the only place the scheme is defined.
 */

/** Card dimensions — the render canvas and the `og:image` meta must agree. */
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** `/` → `index`, `/about` → `about`, `/posts/foo` → `posts/foo`. */
export const pathToOgSlug = (pathname: string): string => {
  const trimmed = pathname.replace(/^\/+|\/+$/g, '');
  return trimmed === '' ? 'index' : trimmed;
};

/** The site-relative path of a page's generated card, e.g. `/og/about.png`. */
export const ogImagePath = (pathname: string): string => `/og/${pathToOgSlug(pathname)}.png`;
