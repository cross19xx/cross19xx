export interface Photo {
  variant: string;
  alt: string;
  /** Frame titles stay untranslated — they're artwork captions, like the file numbers */
  title: string;
  file: string;
  exif: string;
  tags: string[];
  /** Tailwind aspect-ratio class controlling the masonry rhythm */
  aspect: 'aspect-square' | 'aspect-4/5' | 'aspect-3/4' | 'aspect-4/3';
}

export interface Album {
  title: string;
  label: string;
  description: string;
  photos: Photo[];
}

export const photoSrc = (variant: string) =>
  `https://assets.ui.sh/wallpapers/landscapes.webp?variant=${variant}`;

export const filters = [
  { tag: 'all', label: 'All' },
  { tag: 'coast', label: 'Coast' },
  { tag: 'water', label: 'Water' },
  { tag: 'landscape', label: 'Landscape' },
  { tag: 'golden-hour', label: 'Golden hour' },
  { tag: 'minimal', label: 'Minimal' },
  { tag: 'travel', label: 'Travel' },
] as const;

export const albums: Album[] = [
  {
    title: 'Coastlines',
    label: 'Album 01 · 2024–25',
    description:
      "The Gulf of Guinea, mostly at the ends of the day — from Labadi's surf to the still water of the Volta estuary.",
    photos: [
      {
        variant: 'coast',
        alt: 'Waves rolling onto a quiet beach at dusk',
        title: 'Labadi shoreline',
        file: 'DSC_0142',
        exif: 'X-T4 · XF 23mm · ƒ/8 · 1/250s · ISO 160',
        tags: ['coast', 'golden-hour'],
        aspect: 'aspect-4/5',
      },
      {
        variant: 'fossil-cliffs',
        alt: 'Chalk cliffs overlooking a pale sea',
        title: 'Cape ridge',
        file: 'DSC_0166',
        exif: 'X-T4 · XF 16mm · ƒ/11 · 1/125s · ISO 100',
        tags: ['coast', 'minimal'],
        aspect: 'aspect-3/4',
      },
      {
        variant: 'limestone-karst',
        alt: 'Limestone pillars rising from a calm misty bay',
        title: 'Still bay',
        file: 'DSC_0181',
        exif: 'X-T4 · XF 35mm · ƒ/5.6 · 1/500s · ISO 200',
        tags: ['coast', 'water', 'travel'],
        aspect: 'aspect-square',
      },
      {
        variant: 'lake',
        alt: 'Still lake at twilight with forested shoreline',
        title: 'Volta at dusk',
        file: 'DSC_0203',
        exif: 'X-T4 · XF 56mm · ƒ/4 · 1/60s · ISO 400',
        tags: ['water', 'golden-hour'],
        aspect: 'aspect-4/3',
      },
      {
        variant: 'misty-marshland',
        alt: 'Wetlands with still pools and tall reeds',
        title: 'Volta delta',
        file: 'DSC_0395',
        exif: 'X-T4 · XF 56mm · ƒ/5.6 · 1/125s · ISO 320',
        tags: ['water', 'landscape'],
        aspect: 'aspect-square',
      },
    ],
  },
  {
    title: 'Up Country',
    label: 'Album 02 · 2023–24',
    description:
      'Weekend drives out of the city — the Aburi hills, the Kwahu plateau, and the forest reserves that still hold their morning mist.',
    photos: [
      {
        variant: 'hills',
        alt: 'Rolling hills with scattered autumn trees',
        title: 'Aburi ridge',
        file: 'DSC_0408',
        exif: 'X-T4 · XF 35mm · ƒ/8 · 1/320s · ISO 160',
        tags: ['landscape', 'travel'],
        aspect: 'aspect-4/5',
      },
      {
        variant: 'valley',
        alt: 'Misty mountain valley with scattered trees',
        title: 'Kwahu morning',
        file: 'DSC_0421',
        exif: 'X-T4 · XF 16mm · ƒ/9 · 1/200s · ISO 100',
        tags: ['landscape'],
        aspect: 'aspect-square',
      },
      {
        variant: 'forest',
        alt: 'Misty pine forest valley',
        title: 'Atewa mist',
        file: 'DSC_0436',
        exif: 'X-T4 · XF 56mm · ƒ/2.8 · 1/160s · ISO 640',
        tags: ['landscape', 'minimal'],
        aspect: 'aspect-3/4',
      },
      {
        variant: 'meadow',
        alt: 'Alpine meadow with distant mountains',
        title: 'High pasture',
        file: 'DSC_0450',
        exif: 'X-T4 · XF 23mm · ƒ/7.1 · 1/400s · ISO 125',
        tags: ['landscape', 'travel'],
        aspect: 'aspect-4/3',
      },
      {
        variant: 'highland-moors',
        alt: 'Highland moorland with heather and moss',
        title: 'Heather line',
        file: 'DSC_0473',
        exif: 'X-T4 · XF 35mm · ƒ/6.4 · 1/250s · ISO 200',
        tags: ['landscape', 'travel'],
        aspect: 'aspect-square',
      },
    ],
  },
  {
    title: 'Dry Season',
    label: 'Album 03 · 2025',
    description:
      'Harmattan months, when the dust flattens the light and the whole country turns the color of clay — shot on the roads north of Tamale.',
    photos: [
      {
        variant: 'dunes',
        alt: 'Sand dunes glowing at sunset',
        title: 'Harmattan light',
        file: 'DSC_0311',
        exif: 'X-T4 · XF 56mm · ƒ/8 · 1/640s · ISO 100',
        tags: ['golden-hour', 'minimal'],
        aspect: 'aspect-3/4',
      },
      {
        variant: 'weathered-badlands',
        alt: 'Eroded sedimentary hills with layered strata',
        title: 'Northern road',
        file: 'DSC_0467',
        exif: 'X-T4 · XF 16mm · ƒ/10 · 1/320s · ISO 125',
        tags: ['landscape', 'travel'],
        aspect: 'aspect-4/5',
      },
      {
        variant: 'salt-crust-expanse',
        alt: 'Dry salt flats with distant mountain silhouettes',
        title: 'Salt flats, Ada',
        file: 'DSC_0489',
        exif: 'X-T4 · XF 23mm · ƒ/11 · 1/500s · ISO 100',
        tags: ['minimal'],
        aspect: 'aspect-square',
      },
      {
        variant: 'pampas-grassland',
        alt: 'Tall grass plains under a wide open sky',
        title: 'Shai grass',
        file: 'DSC_0277',
        exif: 'X-T4 · XF 35mm · ƒ/4 · 1/800s · ISO 200',
        tags: ['landscape', 'minimal'],
        aspect: 'aspect-4/3',
      },
      {
        variant: 'basalt-plateau',
        alt: 'Basalt plateau with distant volcanic ridges',
        title: 'Basalt country',
        file: 'DSC_0502',
        exif: 'X-T4 · XF 16mm · ƒ/8 · 1/250s · ISO 160',
        tags: ['minimal', 'travel'],
        aspect: 'aspect-square',
      },
    ],
  },
];

/** Homepage gallery picks */
export const featured: { photo: Photo; aspect: Photo['aspect']; delay?: string }[] = [
  { photo: albums[0].photos[0], aspect: 'aspect-4/5' },
  { photo: albums[2].photos[3], aspect: 'aspect-square', delay: '[--reveal-delay:75ms]' },
  { photo: albums[2].photos[0], aspect: 'aspect-3/4', delay: '[--reveal-delay:150ms]' },
  { photo: albums[0].photos[4], aspect: 'aspect-square' },
  { photo: albums[1].photos[0], aspect: 'aspect-4/5', delay: '[--reveal-delay:75ms]' },
  { photo: albums[2].photos[1], aspect: 'aspect-3/4', delay: '[--reveal-delay:150ms]' },
];
