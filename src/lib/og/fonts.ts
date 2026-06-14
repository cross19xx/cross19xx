import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Font } from 'satori';

// Resolved from the project root — the cwd during `astro build`, which is when
// the OG endpoint runs. The font files are committed under src/assets/fonts.
const FONTS_DIR = join(process.cwd(), 'src/assets/fonts');

let cache: Font[] | null = null;

/** Fonts handed to satori. Read from disk once and reused across every card. */
export const loadFonts = (): Font[] => {
  if (cache) return cache;

  // Static-weight instances — satori's font parser can't read variable
  // tables, so these are pinned slices of the variable fonts used on the site.
  const read = (file: string) => readFileSync(join(FONTS_DIR, file));

  cache = [
    { name: 'Geist', data: read('Geist-Regular.ttf'), weight: 400, style: 'normal' },
    { name: 'Geist', data: read('Geist-Medium.ttf'), weight: 500, style: 'normal' },
    { name: 'Geist Mono', data: read('GeistMono-Medium.ttf'), weight: 500, style: 'normal' },
    { name: 'Lora', data: read('Lora-SemiBold.ttf'), weight: 600, style: 'normal' },
  ];

  return cache;
};
