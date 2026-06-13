// Triggers a fresh Vercel production build via a Deploy Hook, so the
// Turso-backed content collections are re-fetched. Run after changing
// album/photo data: `pnpm deploy`
const url = process.env.VERCEL_DEPLOY_HOOK_URL;

if (!url) {
  console.error(
    'VERCEL_DEPLOY_HOOK_URL is not set. Add it to .env\n' +
      '(Vercel → Project → Settings → Git → Deploy Hooks).',
  );
  process.exit(1);
}

const response = await fetch(url, { method: 'POST' });

if (!response.ok) {
  console.error(`Deploy hook failed: ${response.status} ${response.statusText}`);
  process.exit(1);
}

const { job } = await response.json();
console.log(`Deploy triggered — job ${job?.id ?? '(unknown)'}, state ${job?.state ?? 'pending'}.`);
