import { Suspense, lazy, useEffect, useState } from 'react';
import App from './App';
import { ContentProvider } from './content/ContentContext';

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
    <ContentProvider>
      <App />
    </ContentProvider>
  );
}
