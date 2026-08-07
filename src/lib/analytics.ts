/**
 * First-party analytics.
 *
 * No third-party script, no cookie, no cross-site identifier, nothing loaded
 * from another domain — a marketing site that leaks its visitors to an ad
 * network to find out how many there were has made a bad trade. `visitor` is a
 * random string this browser made up about itself; clearing site data ends it.
 *
 * Two rules govern every line here: it must never throw into the page, and it
 * must never delay it. Analytics failing is not a reason for the site to fail.
 */

const URL_BASE = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export type EventType =
  | 'view' | 'section' | 'scroll' | 'cta' | 'whatsapp' | 'phone'
  | 'waze' | 'maps' | 'download' | 'gallery'
  | 'form_start' | 'form_submit' | 'form_abandon' | 'leave';

type Event = {
  visitor: string;
  session: string;
  type: EventType;
  label: string | null;
  value: number | null;
  device: string;
  referrer: string;
};

const enabled =
  Boolean(URL_BASE && KEY) &&
  typeof window !== 'undefined' &&
  // Someone who has asked not to be tracked has asked clearly enough.
  window.navigator?.doNotTrack !== '1' &&
  !/bot|crawl|spider|lighthouse|headless/i.test(navigator.userAgent);

function id(): string {
  return Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 6);
}

function stored(store: Storage, key: string): string {
  try {
    const existing = store.getItem(key);
    if (existing) return existing;
    const fresh = id();
    store.setItem(key, fresh);
    return fresh;
  } catch {
    // Private mode, or storage disabled. A per-page-load identity still gives
    // usable session numbers, and nothing anywhere depends on this persisting.
    return id();
  }
}

let visitor = '';
let session = '';

function device(): string {
  const w = window.innerWidth;
  return w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop';
}

function referrer(): string {
  try {
    if (!document.referrer) return '';
    const host = new URL(document.referrer).hostname;
    return host === location.hostname ? '' : host.replace(/^www\./, '').slice(0, 200);
  } catch {
    return '';
  }
}

/* ── Sending ──────────────────────────────────────────────────────────── */

let queue: Event[] = [];
let timer: number | undefined;

function flush(useBeacon = false) {
  if (!queue.length || !URL_BASE || !KEY) return;
  const batch = queue;
  queue = [];
  const url = `${URL_BASE}/rest/v1/events`;
  const body = JSON.stringify(batch);
  try {
    if (useBeacon && navigator.sendBeacon) {
      // A page being closed will not wait for fetch; sendBeacon survives it.
      // The key rides in the query string because Beacon cannot set headers.
      navigator.sendBeacon(`${url}?apikey=${encodeURIComponent(KEY)}`, new Blob([body], { type: 'application/json' }));
      return;
    }
    void fetch(url, {
      method: 'POST',
      keepalive: true,
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body,
    }).catch(() => {});
  } catch {
    // Swallowed on purpose. See the note at the top of this file.
  }
}

export function track(type: EventType, label?: string, value?: number) {
  if (!enabled) return;
  // Every event carries every key, including the null ones. PostgREST rejects
  // a batch whose objects have differing key sets ("All object keys must
  // match"), so omitting `label` on a scroll event would fail the entire
  // request — and analytics that quietly record nothing are worse than none.
  queue.push({
    visitor,
    session,
    type,
    label: label ? label.slice(0, 120) : null,
    value: value === undefined ? null : Math.round(value),
    device: device(),
    referrer: referrer(),
  });
  // Batched: a visitor scrolling past nine sections is one request, not nine.
  window.clearTimeout(timer);
  timer = window.setTimeout(() => flush(), 1200);
}

/* ── Wiring ───────────────────────────────────────────────────────────── */

/** Classifies a click by where it goes, so components need no tracking code. */
function classify(href: string): EventType | null {
  if (/wa\.me|whatsapp/i.test(href)) return 'whatsapp';
  if (href.startsWith('tel:')) return 'phone';
  if (/waze\.com/i.test(href)) return 'waze';
  if (/google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps/i.test(href)) return 'maps';
  if (/\.(pdf|jpe?g|png|webp|docx?)$/i.test(href)) return 'download';
  if (href.startsWith('#')) return 'cta';
  return null;
}

export function initAnalytics() {
  if (!enabled) return;
  visitor = stored(localStorage, 'ayal:visitor');
  session = stored(sessionStorage, 'ayal:session');

  track('view', location.hash || '/');

  // Clicks, by destination rather than by hand-placed handlers.
  document.addEventListener(
    'click',
    (e) => {
      const link = (e.target as Element | null)?.closest?.('a[href], [data-track]');
      if (!link) return;
      const explicit = link.getAttribute('data-track') as EventType | null;
      const href = link.getAttribute('href') ?? '';
      const type = explicit ?? classify(href);
      if (type) track(type, (link.textContent ?? '').trim().slice(0, 60) || href.slice(0, 60));
    },
    { capture: true, passive: true },
  );

  // How far down the page people actually get.
  let deepest = 0;
  const onScroll = () => {
    const max = document.body.scrollHeight - window.innerHeight;
    if (max <= 0) return;
    deepest = Math.max(deepest, Math.min(100, Math.round(((window.scrollY + window.innerHeight) / document.body.scrollHeight) * 100)));
  };
  window.addEventListener('scroll', onScroll, { passive: true });

  // Which sections were actually reached. Reported once each — the interest is
  // "did they get here", not how many times they scrolled past.
  const seen = new Set<string>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        const name = el.getAttribute('data-name') || el.id;
        if (!name || seen.has(name)) continue;
        seen.add(name);
        track('section', name);
      }
    },
    { threshold: 0.35 },
  );
  // Deferred so it observes the sections React has rendered, not none of them.
  window.setTimeout(() => {
    document.querySelectorAll('section[id]').forEach((s) => observer.observe(s));
  }, 1500);

  const start = Date.now();
  const leave = () => {
    track('scroll', undefined, deepest);
    track('leave', undefined, Math.round((Date.now() - start) / 1000));
    flush(true);
  };
  // `pagehide` fires on mobile where `unload` does not.
  window.addEventListener('pagehide', leave);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') leave();
  });
}

/* ── Unfinished enquiries ─────────────────────────────────────────────── */

export type LeadDraft = {
  filled: number;
  sent: boolean;
  name?: string;
  phone?: string;
  date_greg?: string;
  date_heb?: string;
  guests?: string;
  kind?: string;
  notes?: string;
};

/**
 * Records an enquiry that was typed but not sent, so it can be followed up.
 *
 * The form says on screen that this happens. Capturing details a person
 * deliberately chose not to send, without telling them, would be a dark
 * pattern and a problem under חוק הגנת הפרטיות — the notice is what makes the
 * difference, so it is not optional.
 */
export function recordLead(draft: LeadDraft) {
  if (!enabled || !URL_BASE || !KEY) return;
  try {
    // Through a function rather than a table upsert. PostgREST's upsert issues
    // ON CONFLICT DO UPDATE, which needs to read the conflicting row — and
    // giving visitors read access to this table would hand every visitor
    // everyone else's contact details. The function owns the write instead.
    void fetch(`${URL_BASE}/rest/v1/rpc/record_lead`, {
      method: 'POST',
      keepalive: true,
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        p_visitor: visitor,
        p_device: device(),
        p_filled: draft.filled,
        p_sent: draft.sent,
        p_name: draft.name ?? null,
        p_phone: draft.phone ?? null,
        p_date_greg: draft.date_greg ?? null,
        p_date_heb: draft.date_heb ?? null,
        p_guests: draft.guests ?? null,
        p_kind: draft.kind ?? null,
        p_notes: draft.notes ?? null,
      }),
    }).catch(() => {});
  } catch {
    // As above: never throw into the page.
  }
}
