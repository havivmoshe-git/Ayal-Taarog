import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import App from './App';
import FeedbackPage from './components/FeedbackPage';
import { ContentProvider } from './content/ContentContext';
import type { SiteContent } from './content/schema';

const PREVIEW_KEY = 'ayal:preview';

/** The draft the panel handed over, if this tab was opened as a preview. */
function readPreview(): SiteContent | null {
  try {
    const raw = sessionStorage.getItem(PREVIEW_KEY);
    return raw ? (JSON.parse(raw) as SiteContent) : null;
  } catch {
    return null;
  }
}

/**
 * Routing, hand-rolled: no router dependency in a bundle every visitor
 * downloads.
 *
 * Primarily by hash — `#/admin`, `#/feedback` — which needs no server rewrites
 * and therefore works on GitHub Pages as well as Vercel. But the path is read
 * too, so `/feedback` reaches the same page wherever a rewrite sends unknown
 * paths to index.html. That matters for exactly one reason: the feedback page
 * is pasted into a WhatsApp message to a guest, and `…vercel.app/feedback`
 * is a link a person will trust, while `…vercel.app/#/feedback` looks like
 * something went wrong.
 *
 * The admin is a lazy chunk: the Supabase SDK and the whole editor never reach
 * a visitor who only came to look at the venue.
 */
const Admin = lazy(() => import('./admin/Admin'));

/** Routes reachable by path as well as by hash. */
const PATH_ROUTES = new Set(['feedback']);

function currentRoute(): string {
  const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0];
  if (hash) return hash;
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  return PATH_ROUTES.has(path) ? path : '';
}

export default function Root() {
  const [route, setRoute] = useState(currentRoute);

  useEffect(() => {
    const onHash = () => setRoute(currentRoute());
    window.addEventListener('hashchange', onHash);
    window.addEventListener('popstate', onHash);
    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('popstate', onHash);
    };
  }, []);

  // Analytics belong to the public site only: not to the panel, and not to the
  // preview pane, where every keystroke would otherwise look like a visit.
  const measured = useRef(false);
  useEffect(() => {
    // The feedback page is excluded too. It is opened by a guest who has
    // already stayed, so counting it as a visit would inflate the marketing
    // numbers with traffic that was never a lead — and the feedback table is
    // already the record of who used it.
    if (route === 'admin' || route === 'preview' || route === 'feedback' || measured.current) return;
    measured.current = true;
    void import('./lib/analytics').then((m) => m.initAnalytics());
  }, [route]);

  // Every hook runs before the first branch: leaving `#/admin` for the site
  // must not change how many hooks this component called.
  const isPreview = route === 'preview';
  const draft = useMemo(() => (isPreview ? readPreview() : null), [isPreview]);

  if (route === 'feedback') {
    return (
      <ContentProvider>
        <FeedbackPage />
      </ContentProvider>
    );
  }

  if (route === 'admin') {
    return (
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-cream-50 font-display text-navy-950">
            טוען…
          </div>
        }
      >
        <Admin />
      </Suspense>
    );
  }

  return (
    <ContentProvider override={draft} previewMode={isPreview}>
      {isPreview && (
        <div className="fixed inset-x-0 top-0 z-50 bg-gold-500 py-1 text-center font-display text-xs font-bold text-navy-950">
          תצוגה מקדימה — כך ייראה האתר אחרי פרסום
        </div>
      )}
      <App />
    </ContentProvider>
  );
}
