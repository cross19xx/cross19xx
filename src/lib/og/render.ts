import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';

import { ogCard } from './card';
import { loadFonts } from './fonts';
import { OG_HEIGHT, OG_WIDTH } from './paths';

export interface OgContent {
  title: string;
  description: string;
}

/**
 * Render a card to PNG bytes. Satori turns the element tree into an SVG with
 * glyphs already traced to vector paths, so resvg can rasterise it without
 * needing the fonts itself.
 */
export const renderOgImage = async (content: OgContent): Promise<Uint8Array> => {
  const svg = await satori(ogCard(content) as unknown as Parameters<typeof satori>[0], {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: loadFonts(),
  });

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: OG_WIDTH } });

  return resvg.render().asPng();
};
