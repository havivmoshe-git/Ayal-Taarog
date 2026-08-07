import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import App from './App';
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
 * Hash routing, hand-rolled.
 *
 * `#/admin` opens the panel, anything else is the site. Hash routing needs no
 * server rewrites, which matters on GitHub Pages, and no router dependency,
 * which matters for a bundle every visitor downloads.
 *
 * The admin is a lazy chunk: the Supabase SDK and the whole editor never reach
 * a visitor who only came to look at the venue.
 */
const Admin = lazy(() => import('./admin/Admin'));

function currentRoute(): string {
  return window.location.hash.replace(/^#\/?/, '').split('?')[0];
}

export default function Root() {
  const [route, setRoute] = useState(currentRoute);

  useEffect(() => {
    const onHash = () => setRoute(currentRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Analytics belong to the public site only: not to the panel, and not to the
  // preview pane, where every keystroke would otherwise look like a visit.
  const measured = useRef(false);
  useEffect(() => {
    if (route === 'admin' || route === 'preview' || measured.current) return;
    measured.current = true;
    void import('./lib/analytics').then((m) => m.initAnalytics());
  }, [route]);

  // Every hook runs before the first branch: leaving `#/admin` for the site
  // must not change how many hooks this component called.
  const isPreview = route === 'preview';
  const draft = useMemo(() => (isPreview ? readPreview() : null), [isPreview]);

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
