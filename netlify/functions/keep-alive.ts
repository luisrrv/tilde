// Netlify scheduled function (blueprint.md §13). Runs every 5 days —
// not daily, since /now's relative timestamps are computed in the
// browser (§5) so a daily rebuild buys nothing; not 6-day, since that
// would leave only a day of margin against Supabase's ~7-day
// inactivity pause, which is too thin to call a safety net.
//
// This deliberately does NOT touch Supabase itself — it only POSTs to
// the Netlify build hook. The *build* that triggers is what reads
// Supabase (for /log and /now), and that read is the activity that
// resets the inactivity clock. Keeping this function that dumb is the
// point: it also must never write to `now` (§13) — forging the very
// freshness data the eight-week hide depends on — and a function that
// does nothing but poke Netlify can't do that by construction.
export default async () => {
  const buildHookUrl = process.env.BUILD_HOOK_URL;

  if (!buildHookUrl) {
    console.error('keep-alive: BUILD_HOOK_URL is not set — cannot trigger a rebuild.');
    return new Response('Missing BUILD_HOOK_URL', { status: 500 });
  }

  const res = await fetch(buildHookUrl, { method: 'POST' });

  if (!res.ok) {
    console.error(`keep-alive: build hook responded ${res.status}`);
    return new Response(`build hook responded ${res.status}`, { status: 502 });
  }

  console.log('keep-alive: build hook triggered successfully.');
  return new Response('ok', { status: 200 });
};

export const config = {
  schedule: '0 0 */5 * *',
};
