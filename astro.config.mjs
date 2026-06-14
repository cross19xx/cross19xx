import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';

export default defineConfig({
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Geist',
      cssVariable: '--font-geist',
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/Geist-VariableFont_wght.ttf'],
            weight: '300 400 500 600',
            style: 'normal',
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Geist Mono',
      cssVariable: '--font-geist-mono',
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/GeistMono-VariableFont_wght.ttf'],
            weight: '300 400 500 600',
            style: 'normal',
          },
        ],
      },
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Lora',
      cssVariable: '--font-lora',
      weights: ['600', '700'],
    },
  ],
  image: {
    domains: [
      'assets.ui.sh', // TODO: Remove this once the images are hosted on the blob store
      'ro5duieh0n6tvtsi.public.blob.vercel-storage.com',
    ],
  },
  integrations: [sitemap(), mdx(), tailwindcss()],
  markdown: {
    shikiConfig: {
      theme: 'dracula',
    },
  },
  site: 'https://www.kwakye-gyamfi.com',
  vite: {
    plugins: [tailwindcss()],
  },
});
