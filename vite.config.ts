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
    plugins: [react(), tailwindcss(), stampUrls(base, siteUrl)],
    build: {
      target: 'es2020',
      assetsInlineLimit: 2048,
    },
  };
});
