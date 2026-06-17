import { createClient } from '@libsql/client/web';

// `import.meta.env` is populated at build time (content-collection loaders);
// `process.env` is populated at request time on Vercel (the on-demand
// /projects/kitchen route). The fallback covers both contexts.
const url = (import.meta.env.TURSO_DATABASE_URL ?? process.env.TURSO_DATABASE_URL) as string;
const authToken = (import.meta.env.TURSO_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN) as string;

export const turso = createClient({ url, authToken });
