import { renderToString } from 'react-dom/server';
import App from './App';
import { ContentProvider } from './content/ContentContext';

/**
 * Renders the site's markup at build time.
 *
 * Until now the HTML a crawler received was `<div id="root"></div>` and
 * nothing else — every word of the page existed only after JavaScript ran.
 * Google does execute JavaScript, but it does so on a slower second pass, and
 * on a site whose whole purpose is to be found that is a needless handicap.
 *
 * `Root` is deliberately not used here: it reads `window.location` while
 * choosing a route, which does not exist during a build. The site route is the
 * only one worth pre-rendering anyway — the panel is private and the feedback
 * page is a link sent to guests, not a search result.
 *
 * The client mounts with `createRoot`, not `hydrateRoot`, so this markup is
 * replaced rather than matched against. That is deliberate: sections can be
 * scheduled by date, so a page built on Sunday and opened on Friday can
 * legitimately differ, and hydration would call that an error.
 */
export function render(): string {
  return renderToString(
    <ContentProvider>
      <App />
    </ContentProvider>,
  );
}
