import rss from '@astrojs/rss';
import { supabase } from '../lib/supabase';
import { renderMarkdown } from '../lib/markdown';

// blueprint.md §5: "roughly twenty lines in Astro" — RSS for /log,
// full content per entry (not excerpts), since entries are already
// only a few sentences long (§9).
export async function GET(context) {
  const { data, error } = await supabase
    .from('logs')
    .select('slug, title, body, tags, created_at')
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch logs for feed.xml: ${error.message}`);
  }

  const entries = data ?? [];

  return rss({
    title: 'tilde — log',
    description: 'Short, chronological notebook entries.',
    site: context.site,
    items: entries.map((entry) => ({
      title: entry.title ?? entry.slug,
      link: `/log/${entry.slug}`,
      pubDate: new Date(entry.created_at),
      content: renderMarkdown(entry.body),
      categories: entry.tags ?? [],
    })),
  });
}
