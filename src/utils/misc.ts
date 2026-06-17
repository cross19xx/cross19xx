import { SITE_NAME } from '_/data/site';

export const MASONRY_BREAKPOINTS = {
  default: 4,
  700: 3,
  500: 2,
} as const;

export const constructPageTitle = (prefix: string) => `${prefix} - ${SITE_NAME}`;

export const blobUrl = (path: string) => {
  const BLOB_STORE_URL = 'https://ro5duieh0n6tvtsi.public.blob.vercel-storage.com';
  return `${BLOB_STORE_URL}/${path}`;
};

export const padNumber = (n: string | number, pad = 2) => String(n).padStart(pad, '0');
