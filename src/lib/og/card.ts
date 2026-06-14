import type { OgContent } from './render';

/**
 * Satori renders a React-element tree, but we don't need a JSX runtime in an
 * endpoint — a plain `{ type, props }` object is exactly what it consumes. `h`
 * is a minimal hyperscript so the layout below still reads like markup.
 */
type Style = Record<string, string | number>;
type Child = Element | string;
interface Element {
  type: string;
  props: { style?: Style; children?: Child | Child[]; [key: string]: unknown };
}

const h = (
  type: string,
  props: Omit<Element['props'], 'children'>,
  ...children: Child[]
): Element => ({
  type,
  // An empty array reads as "multiple children" to satori; childless nodes
  // (the divider, the icons) must pass `undefined` instead.
  props: {
    ...props,
    children: children.length === 0 ? undefined : children.length === 1 ? children[0] : children,
  },
});

// Palette — mirrors the site's dark theme (theme-color #181818).
const BG = '#181818';
const FOREGROUND = '#fafafa';
const MUTED = '#a1a1a1';
const DIVIDER = 'rgba(255, 255, 255, 0.2)';

// Fixed brand marks. The domain matches `site` in astro.config.mjs.
const MARK = 'K_';
const LOCATION = 'Accra, Ghana';
const DOMAIN = 'www.kwakye-gyamfi.com';

/** A lucide icon as a data-URI <img> src, stroked in the muted colour. */
const icon = (paths: string): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${MUTED}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const PIN_ICON = icon(
  '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
);
const GLOBE_ICON = icon(
  '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
);

const footerItem = (iconSrc: string, label: string): Element =>
  h(
    'div',
    {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontFamily: 'Geist Mono',
        fontSize: '22px',
        color: MUTED,
      },
    },
    h('img', { src: iconSrc, width: 22, height: 22 }),
    label,
  );

/** Build the 1200×630 card element tree for a page's title + description. */
export const ogCard = ({ title, description }: OgContent): Element =>
  h(
    'div',
    {
      style: {
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 80px',
        backgroundColor: BG,
        color: FOREGROUND,
        fontFamily: 'Geist',
      },
    },
    // Brand mark
    h(
      'div',
      {
        style: {
          display: 'flex',
          fontFamily: 'Geist Mono',
          fontSize: '32px',
          fontWeight: 500,
          letterSpacing: '0.05em',
        },
      },
      MARK,
    ),
    // Title → divider → description
    h(
      'div',
      { style: { display: 'flex', flexDirection: 'column' } },
      h(
        'div',
        {
          style: {
            display: 'flex',
            fontFamily: 'Lora',
            fontWeight: 600,
            fontSize: '76px',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            maxWidth: '960px',
            // satori's multi-line truncation: clamp to 3 lines with an ellipsis.
            lineClamp: 3,
          },
        },
        title,
      ),
      h('div', {
        style: { width: '64px', height: '2px', backgroundColor: DIVIDER, margin: '32px 0' },
      }),
      h(
        'div',
        {
          style: {
            display: 'flex',
            fontSize: '28px',
            lineHeight: 1.45,
            color: MUTED,
            maxWidth: '820px',
            lineClamp: 2,
          },
        },
        description,
      ),
    ),
    // Location + domain
    h(
      'div',
      { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
      footerItem(PIN_ICON, LOCATION),
      footerItem(GLOBE_ICON, DOMAIN),
    ),
  );
