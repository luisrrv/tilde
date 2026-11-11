import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://rodluis.com',
  // Pages are built as dir/index.html, so link to /log/ (not /log) --
  // otherwise Netlify answers every nav click with a redirect first.
  trailingSlash: 'always',
  // Fetch the (tiny, static) pages behind visible links once the
  // browser is idle, so a click usually finds the page already loaded.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
});
