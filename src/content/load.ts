import { CONTENT_VERSION, type Schedule, type Section, type SiteContent } from './schema';
import { snapshot } from './snapshot';

/**
 * Where published content is fetched from. Plain HTTP against Supabase Storage
 * — deliberately not the Supabase SDK, which would add ~35KB to a bundle that
 * every visitor downloads for the sake of one GET the site can survive without.
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const PUBLISHED_PATH = '/storage/v1/object/public/site/content.json';

/** Give up quickly — the snapshot is already on screen, this is only an upgrade. */
const FETCH_TIMEOUT_MS = 6000;

export function publishedContentUrl(): string | null {
  return SUPABASE_URL ? `${SUPABASE_URL.replace(/\/$/, '')}${PUBLISHED_PATH}` : null;
}

/** Local calendar date as yyyy-mm-dd — schedules are set and read in the venue's own terms. */
function today(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Inclusive on both bounds; an omitted bound is open-ended. */
export function isWithinSchedule(schedule: Schedule | undefined, now = new Date()): boolean {
  if (!schedule) return true;
  const d = today(now);
  if (schedule.from && d < schedule.from) return false;
  if (schedule.to && d > schedule.to) return false;
  return true;
}

/** Sections a visitor should actually see right now. */
export function visibleSections(content: SiteContent, now = new Date()): Section[] {
  return content.sections.filter((s) => s.enabled && isWithinSchedule(s.schedule, now));
}

/** Nav entries derive from the sections themselves, so adding a section can add its own link. */
export function navFromSections(sections: Section[]): { href: string; label: string }[] {
  return sections
    .filter((s): s is Section & { navLabel: string } => Boolean(s.navLabel))
    .map((s) => ({ href: `#${s.id}`, label: s.navLabel }));
}

function isSiteContent(value: unknown): value is SiteContent {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<SiteContent>;
  return (
    typeof v.version === 'number' &&
    Array.isArray(v.sections) &&
    typeof v.contact === 'object' &&
    v.contact !== null
  );
}

/**
 * Fetch the published document. Returns null on any failure — a missing or
 * malformed response must never be able to blank the site, so every error path
 * simply leaves the snapshot in place.
 */
export async function fetchPublished(): Promise<SiteContent | null> {
  const url = publishedContentUrl();
  if (!url) return null;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(`${url}?t=${Date.now()}`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);

    if (!res.ok) return null;
    const json: unknown = await res.json();
    if (!isSiteContent(json)) return null;
    if (json.version > CONTENT_VERSION) return null; // built by a newer app than this one
    return json;
  } catch {
    return null;
  }
}

export { snapshot };
