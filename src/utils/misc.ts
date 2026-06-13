export const MASONRY_BREAKPOINTS = {
  default: 3,
  700: 2,
  500: 1,
} as const;

export const padNumber = (n: string | number, pad = 2) => String(n).padStart(pad, '0');

export const topicLabel = (topic: string) => {
  switch (topic) {
    case 'engineering':
      return 'Engineering';
    case 'photography':
      return 'Photography';
    default:
      return topic;
  }
};

export const blobUrl = (path: string) => {
  const BLOB_STORE_URL = 'https://ro5duieh0n6tvtsi.public.blob.vercel-storage.com';
  return `${BLOB_STORE_URL}/${path}`;
};
