/**
 * The shape of everything editable on the site.
 *
 * Content used to live as two dozen named exports imported directly by
 * components. That made every string editable only by a developer, and made
 * the order of sections a property of App.tsx rather than of the content.
 * Here it is one document: an ordered list of sections, each of which can be
 * turned off, scheduled, reordered or removed without touching code.
 */

export type SectionType =
  | 'hero'
  | 'trustBar'
  | 'included'
  | 'rooms'
  | 'gallery'
  | 'timeline'
  | 'menu'
  | 'location'
  | 'faq'
  | 'downloads'
  | 'leadForm'
  | 'imageBreak'
  | 'banner'
  | 'richText';

/**
 * Optional visibility window, as ISO dates (yyyy-mm-dd).
 * A holiday section is set once and then manages itself: it appears on `from`
 * and disappears after `to`, with nobody having to remember to take it down.
 * Either bound may be omitted for an open-ended window.
 */
export type Schedule = { from?: string; to?: string };

type Base<T extends SectionType, D> = {
  id: string;
  type: T;
  /** Off keeps the content but hides the section — the reusable alternative to deleting. */
  enabled: boolean;
  schedule?: Schedule;
  /** Present means the section appears in the navigation under this label. */
  navLabel?: string;
  data: D;
};

/* ── Section payloads ─────────────────────────────────────────────────── */

export type HeroData = {
  eyebrow: string;
  brand: string;
  kicker: string;
  title: string;
  titleAccent: string;
  subtitle: string;
  location: string;
  ctaPrimary: string;
  ctaShort: string;
  ctaSecondary: string;
  scrollHint: string;
  imageWide: string;
  imagePortrait: string;
};

export type TrustBarData = {
  items: { value: string; label: string; note: string }[];
};

export type IncludedIcon =
  | 'bed'
  | 'chef'
  | 'hall'
  | 'prayer'
  | 'torah'
  | 'bath'
  | 'coffee'
  | 'shield';

export type IncludedData = {
  eyebrow: string;
  title: string;
  subtitle: string;
  items: { icon: IncludedIcon; title: string; body: string }[];
};

export type RoomsData = {
  eyebrow: string;
  title: string;
  subtitle: string;
  breakdown: { rooms: string; beds: string; occupancy: string; people: number }[];
  totalLabel: string;
  totalValue: string;
  totalNote: string;
  planCta: string;
  planAlt: string;
  planImage: string;
};

export type GalleryImage = {
  /** Bundled images are referenced by slug; uploaded ones carry absolute URLs. */
  slug?: string;
  urlSmall?: string;
  urlLarge?: string;
  category: string;
  alt: string;
  caption: string;
};

export type GalleryData = {
  title: string;
  subtitle: string;
  catalogCta: string;
  swipeHint: string;
  categories: { id: string; label: string }[];
  images: GalleryImage[];
};

export type TimelineData = {
  eyebrow: string;
  title: string;
  subtitle: string;
  items: { time: string; title: string; body: string }[];
};

export type MenuData = {
  eyebrow: string;
  title: string;
  subtitle: string;
  disclaimer: string;
  downloadCta: string;
  downloadFile: string;
  kosher: { label: string; value: string }[];
  culinaryIncluded: string[];
  culinaryTitle: string;
  meals: {
    id: string;
    tab: string;
    title: string;
    subtitle: string;
    dishes: { name: string; note?: string }[];
  }[];
};

export type LocationData = {
  eyebrow: string;
  title: string;
  subtitle: string;
  wazeCta: string;
  mapsCta: string;
  mapEmbed: string;
};

export type FaqData = {
  eyebrow: string;
  title: string;
  items: { q: string; a: string }[];
};

export type DownloadsData = {
  eyebrow: string;
  title: string;
  subtitle: string;
  items: {
    slug: string;
    kind: 'pdf' | 'image';
    title: string;
    body: string;
    file: string;
    cta: string;
    badge?: string;
  }[];
};

export type LeadFormData = {
  eyebrow: string;
  title: string;
  subtitle: string;
  labels: Record<string, string>;
  types: string[];
  submit: string;
  disclaimer: string;
  fallbackTitle: string;
  fallbackBody: string;
};

export type ImageBreakData = {
  image: string;
  imageUrl?: string;
  alt: string;
  line: string;
  attribution?: string;
};

/** The festive strip. Tone drives the colour treatment. */
export type BannerData = {
  tone: 'gold' | 'navy' | 'festive';
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export type RichTextData = {
  eyebrow?: string;
  title: string;
  paragraphs: string[];
  align: 'center' | 'start';
};

/* ── The union ────────────────────────────────────────────────────────── */

export type Section =
  | Base<'hero', HeroData>
  | Base<'trustBar', TrustBarData>
  | Base<'included', IncludedData>
  | Base<'rooms', RoomsData>
  | Base<'gallery', GalleryData>
  | Base<'timeline', TimelineData>
  | Base<'menu', MenuData>
  | Base<'location', LocationData>
  | Base<'faq', FaqData>
  | Base<'downloads', DownloadsData>
  | Base<'leadForm', LeadFormData>
  | Base<'imageBreak', ImageBreakData>
  | Base<'banner', BannerData>
  | Base<'richText', RichTextData>;

export type SectionOf<T extends SectionType> = Extract<Section, { type: T }>;

export type ContactInfo = {
  whatsappNumber: string;
  phoneDisplay: string;
  phoneHref: string;
  catalogUrl: string;
  instituteUrl: string;
  address: string;
  addressShort: string;
  synagogue: string;
  mapsUrl: string;
  wazeUrl: string;
};

export type FooterInfo = {
  tagline: string;
  aboutTitle: string;
  about: string;
  linksTitle: string;
  contactTitle: string;
  instituteLink: string;
  catalogLink: string;
  rights: string;
};

export type SeoInfo = {
  title: string;
  description: string;
};

export type SiteContent = {
  /** Bumped when the shape changes so old stored documents can be migrated. */
  version: number;
  /** Set on publish; used to decide whether remote content is newer. */
  updatedAt?: string;
  contact: ContactInfo;
  footer: FooterInfo;
  seo: SeoInfo;
  sections: Section[];
};

export const CONTENT_VERSION = 1;

/** Hebrew labels for the admin's section palette and list. */
export const SECTION_LABELS: Record<SectionType, string> = {
  hero: 'כותרת ראשית',
  trustBar: 'סרגל נתונים',
  included: 'מה כולל האירוח',
  rooms: 'הרכב החדרים',
  gallery: 'גלריה',
  timeline: 'ציר זמן השבת',
  menu: 'תפריט',
  location: 'מיקום ומפה',
  faq: 'שאלות נפוצות',
  downloads: 'חומרים להורדה',
  leadForm: 'טופס פנייה',
  imageBreak: 'רצועת תמונה',
  banner: 'רצועה חגיגית',
  richText: 'טקסט חופשי',
};

/** Types the editor may add more than one of. */
export const REPEATABLE: SectionType[] = ['imageBreak', 'banner', 'richText'];
