import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.PUBLIC_SUPABASE_URL;
const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Missing PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY. ' +
      'Set them in .env locally (see .env.example) or in Netlify env vars.'
  );
}

/**
 * Build-time / server-side client. Anon-key, read-only in practice
 * (RLS only grants anon SELECT on published rows — see blueprint.md
 * §13). No session persistence: there is no browser at build time, and
 * persisting to localStorage would throw under Node.
 *
 * Used by /log, /log/[slug] and /now to fetch published content when
 * the static pages are generated.
 */
export const supabase: SupabaseClient = createClient(url, anonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

/**
 * Browser client for /admin only. Full magic-link session handling —
 * persists the session, refreshes it silently, and picks up the token
 * Supabase appends to the URL after a magic-link redirect.
 *
 * Call this from client-side <script> code, never from .astro
 * frontmatter (it assumes `window`/`localStorage` exist).
 */
export function createBrowserSupabaseClient(): SupabaseClient {
  return createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
