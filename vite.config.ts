import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Stamps the host-specific absolute URLs into index.html.
 *
 * The canonical link, the Open Graph tags and the JSON-LD all need a full
 * URL, which differs per host. Deriving `%VITE_BASE_URL%` from the resolved
 * base keeps it from being declared twice and drifting.
 */
function stampUrls(base: string, siteUrl: string): Plugin {
  return {
    name: 'stamp-urls',
    buildStart() {
      if (!siteUrl) {
        // og:image must be absolute or WhatsApp cannot fetch it, and the
        // preview card is most of why anyone taps the link.
        this.warn(
          'VITE_SITE_URL is not set — Open Graph tags will be relative and the ' +
            'WhatsApp preview image will not load. Set it to the full site URL.',
        );
      }
    },
    transformIndexHtml(html) {
      return html
        .replaceAll('%VITE_BASE_URL%', base)
        .replaceAll('%VITE_SITE_URL%', siteUrl.replace(/\/$/, ''));
    },
  };
}

/**
 * Emits robots.txt and sitemap.xml, with the live domain baked in.
 *
 * They cannot be static files in `public/` because the host's URL is not known
 * until build time — and they were previously missing entirely, which meant
 * the SPA rewrite answered `/robots.txt` with the site's HTML. To a crawler
 * that reads as no crawl directives at all and no sitemap, on a site whose
 * entire purpose is being found.
 *
 * The feedback page is deliberately excluded and marked `noindex`: it is a
 * private link sent to a guest after their stay, not a page anyone should
 * arrive at from a search.
 */
function seoFiles(siteUrl: string): Plugin {
  const site = siteUrl.replace(/\/$/, '');
  return {
    name: 'seo-files',
    generateBundle() {
      const today = new Date().toISOString().slice(0, 10);

      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: [
          'User-agent: *',
          'Allow: /',
          '',
          '# A private link sent to guests after their stay, not a search result.',
          'Disallow: /feedback',
          'Disallow: /#/admin',
          '',
          site ? `Sitemap: ${site}/sitemap.xml` : '',
          '',
        ].join('\n'),
      });

      if (!site) return;
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          '  <url>',
          `    <loc>${site}/</loc>`,
          `    <lastmod>${today}</lastmod>`,
          '    <changefreq>weekly</changefreq>',
          '    <priority>1.0</priority>',
          '  </url>',
          '</urlset>',
          '',
        ].join('\n'),
      });
    },
  };
}

/**
 * The base path is configuration, not a constant: Vercel serves from the
 * domain root, GitHub Pages from a repository sub-path. Both build from this
 * same commit, so the live site keeps running while Vercel is set up.
 */
export default defineConfig(({ mode }) => {
  // `''` loads every variable, not just the VITE_-prefixed ones, so the
  // deploy hosts can set VITE_BASE_PATH without a prefix dance.
  const env = loadEnv(mode, '.', '');
  const base = env.VITE_BASE_PATH || '/';
  const siteUrl = env.VITE_SITE_URL || '';

  return {
    base,
    plugins: [react(), tailwindcss(), stampUrls(base, siteUrl), seoFiles(siteUrl)],
    build: {
      target: 'es2020',
      assetsInlineLimit: 2048,
    },
  };
});
