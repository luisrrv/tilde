#!/usr/bin/env node
/**
 * Proves the `logs` RLS policies actually work — not just that they
 * exist (blueprint.md §13, scaffold Definition of done #5).
 *
 * What it does, in order:
 *   1. Uses the SERVICE ROLE key to insert one throwaway unpublished
 *      test row into `logs`.
 *   2. Uses the ANON key to confirm that row is invisible via SELECT.
 *   3. Uses the ANON key to attempt an INSERT, and confirms it is
 *      rejected.
 *   4. Uses the SERVICE ROLE key to delete every row it created,
 *      regardless of what happened above.
 *   5. Prints a PASS/FAIL summary and exits non-zero on any failure.
 *
 * Usage:
 *   SUPABASE_URL=https://xxxx.supabase.co \
 *   SUPABASE_ANON_KEY=... \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/verify-rls.mjs
 *
 * Pass the service role key as a shell env var, not in a .env file —
 * it must never end up on disk in this repo, even ignored. It is only
 * ever needed for this one-off, local, manual check.
 */

const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = process.env;

for (const [name, value] of Object.entries({
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
})) {
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
}

const TEST_SLUG = `rls-test-${Date.now()}`;
const ANON_INSERT_SLUG = `rls-test-anon-insert-${Date.now()}`;

const rest = (path) => `${SUPABASE_URL}/rest/v1/${path}`;

function headers(key, extra = {}) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

let failures = 0;

function report(label, ok, detail) {
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`[${mark}] ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
}

async function cleanup() {
  await fetch(rest(`logs?slug=eq.${encodeURIComponent(TEST_SLUG)}`), {
    method: 'DELETE',
    headers: headers(SUPABASE_SERVICE_ROLE_KEY),
  }).catch(() => {});
  await fetch(rest(`logs?slug=eq.${encodeURIComponent(ANON_INSERT_SLUG)}`), {
    method: 'DELETE',
    headers: headers(SUPABASE_SERVICE_ROLE_KEY),
  }).catch(() => {});
}

async function main() {
  // 1. seed one unpublished row with the service role key
  const seedRes = await fetch(rest('logs'), {
    method: 'POST',
    headers: headers(SUPABASE_SERVICE_ROLE_KEY, { Prefer: 'return=representation' }),
    body: JSON.stringify({
      slug: TEST_SLUG,
      body: 'rls verification row — safe to delete',
      published: false,
    }),
  });
  report('seed unpublished test row (service role)', seedRes.ok, `HTTP ${seedRes.status}`);
  if (!seedRes.ok) {
    console.error(await seedRes.text());
    await cleanup();
    process.exit(1);
  }

  // 2. anon SELECT must not see it
  const selectRes = await fetch(rest(`logs?slug=eq.${encodeURIComponent(TEST_SLUG)}`), {
    headers: headers(SUPABASE_ANON_KEY),
  });
  const selectBody = await selectRes.json().catch(() => null);
  const invisible = selectRes.ok && Array.isArray(selectBody) && selectBody.length === 0;
  report(
    'anon SELECT cannot see the unpublished row',
    invisible,
    `HTTP ${selectRes.status}, ${Array.isArray(selectBody) ? selectBody.length : '?'} row(s) returned`
  );

  // 3. anon INSERT must be rejected
  const insertRes = await fetch(rest('logs'), {
    method: 'POST',
    headers: headers(SUPABASE_ANON_KEY, { Prefer: 'return=representation' }),
    body: JSON.stringify({
      slug: ANON_INSERT_SLUG,
      body: 'this insert should be rejected by RLS',
      published: true,
    }),
  });
  const insertRejected = !insertRes.ok;
  report('anon INSERT is rejected', insertRejected, `HTTP ${insertRes.status}`);
  if (!insertRejected) {
    console.error(
      'anon insert succeeded — RLS is not enforcing owner-only writes. Body:',
      await insertRes.text()
    );
  }

  await cleanup();

  console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (err) => {
  console.error('Unexpected error:', err);
  await cleanup();
  process.exit(1);
});
