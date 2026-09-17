import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

// §9's examples use single newlines as rhythm inside an entry, so
// `breaks: true` turns those into <br> rather than requiring a blank
// line for every line break.
marked.setOptions({ breaks: true });

/**
 * Renders a log entry's raw markdown body to sanitized HTML.
 *
 * Sanitizing even though there is a single author (§11): a compromised
 * admin session should not be able to inject script into the built
 * pages that every visitor loads. This runs at build time for the
 * static /log pages, and again client-side for the /admin live preview
 * — same renderer, same sanitizer, so the preview matches what actually
 * gets published (§12).
 */
export function renderMarkdown(raw: string): string {
  const html = marked.parse(raw, { async: false }) as string;
  return DOMPurify.sanitize(html);
}
