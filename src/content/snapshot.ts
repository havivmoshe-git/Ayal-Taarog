/**
 * The content baked into the bundle — layer one of three.
 *
 * This renders instantly, works with no network, and is what visitors see if
 * Supabase is slow, paused or gone. Remote content replaces it only once it
 * has actually arrived.
 *
 * It is assembled from the original `src/data/*` modules rather than retyped,
 * so the starting point is provably identical to what is already live. Once
 * the weekly sync workflow starts running it will overwrite this file with a
 * literal of the published document, and `src/data/*` can be retired.
 */
import * as c from '../data/content';
import * as m from '../data/menu';
import * as g from '../data/gallery';
import { CONTENT_VERSION, type SiteContent } from './schema';

const MAP_EMBED =
  'https://www.google.com/maps?q=%D7%94%D7%A8%D7%91%20%D7%9E%D7%9F%20%D7%94%D7%94%D7%A8%204%20%D7%94%D7%A8%20%D7%97%D7%95%D7%9E%D7%94%20%D7%99%D7%A8%D7%95%D7%A9%D7%9C%D7%99%D7%9D&hl=he&z=15&output=embed';

export const snapshot: SiteContent = {
  version: CONTENT_VERSION,
  contact: { ...c.contact },
  footer: { ...c.footer },
  seo: {
    title: 'מתחם האירוח כאייל תערוג | שבתות חתן ואירועים — הר חומה, ירושלים',
    description:
      'מתחם האירוח ״כאייל תערוג״ בבית הכנסת ״חסדי שמואל״. 14 חדרי לינה, עד 79 אורחים, שף פרטי ו-3 סעודות שבת בכשרות מחפוד. הר חומה, ירושלים.',
  },
  sections: [
    {
      id: 'hero',
      type: 'hero',
      enabled: true,
      data: {
        ...c.hero,
        imageWide: 'hall-shabbat-meal',
        imagePortrait: 'hall-place-setting',
      },
    },
    {
      id: 'trustBar',
      type: 'trustBar',
      enabled: true,
      data: { items: c.trustBar.map((i) => ({ ...i })) },
    },
    {
      id: 'included',
      type: 'included',
      enabled: true,
      navLabel: 'מה כלול',
      data: {
        eyebrow: 'הכול במקום אחד',
        title: 'מה כולל האירוח',
        subtitle:
          'לינה, סעודות, תפילות ושיעורים — בלי להזיז את האורחים בין מקומות, ובלי להתעסק בתיאומים.',
        items: c.included.map((i) => ({ ...i })),
      },
    },
    {
      id: 'rooms',
      type: 'rooms',
      enabled: true,
      navLabel: 'החדרים',
      data: {
        ...c.rooms,
        breakdown: c.rooms.breakdown.map((r) => ({ ...r })),
        planImage: 'floorplan',
      },
    },
    {
      id: 'break-synagogue',
      type: 'imageBreak',
      enabled: true,
      data: {
        image: 'synagogue-main',
        alt: 'בית הכנסת חסדי שמואל מבפנים',
        line: c.strapline,
        attribution: 'בית הכנסת ״חסדי שמואל״',
      },
    },
    {
      id: 'gallery',
      type: 'gallery',
      enabled: true,
      navLabel: 'גלריה',
      data: {
        ...c.gallerySection,
        swipeHint: 'החליקו לצדדים · הקישו להגדלה',
        categories: g.categories.map((x) => ({ ...x })),
        images: g.images.map((i) => ({ ...i })),
      },
    },
    {
      id: 'shabbat',
      type: 'timeline',
      enabled: true,
      navLabel: 'השבת אצלנו',
      data: {
        eyebrow: 'מהכניסה ועד ההבדלה',
        title: 'השבת אצלנו',
        subtitle: 'כך נראית שבת חתן במתחם — מקבלת השבת ועד המלווה מלכה.',
        items: c.timeline.map((t) => ({ ...t })),
      },
    },
    {
      id: 'menu',
      type: 'menu',
      enabled: true,
      navLabel: 'התפריט',
      data: {
        ...m.menuSection,
        downloadFile: 'docs/menu-shabbat.pdf',
        culinaryTitle: 'מה כולל האירוח הקולינרי',
        kosher: m.kosher.map((k) => ({ ...k })),
        culinaryIncluded: [...m.culinaryIncluded],
        meals: m.meals.map((meal) => ({
          id: meal.id,
          tab: meal.tab,
          title: meal.title,
          subtitle: meal.subtitle,
          dishes: meal.dishes.map((d) => ({ name: d.name, ...(d.note ? { note: d.note } : {}) })),
        })),
      },
    },
    {
      id: 'break-table',
      type: 'imageBreak',
      enabled: true,
      data: {
        image: 'hall-place-setting',
        alt: 'שולחן ערוך לסעודת שבת עם כוסות יין וסכו״ם מוזהב',
        line: 'הכול מוכן. אתם רק צריכים להגיע.',
      },
    },
    {
      id: 'location',
      type: 'location',
      enabled: true,
      navLabel: 'מיקום',
      data: {
        eyebrow: 'איפה אנחנו',
        title: 'מיקום והגעה',
        subtitle:
          'בלב שכונת הר חומה בירושלים — כמה דקות מהכניסה לעיר ומכביש 60, עם חניה נוחה בסביבה.',
        wazeCta: 'ניווט ב-Waze',
        mapsCta: 'Google Maps',
        mapEmbed: MAP_EMBED,
      },
    },
    {
      id: 'faq',
      type: 'faq',
      enabled: true,
      navLabel: 'שאלות נפוצות',
      data: {
        eyebrow: 'לפני שפונים',
        title: 'שאלות נפוצות',
        items: c.faq.map((f) => ({ ...f })),
      },
    },
    {
      id: 'downloads',
      type: 'downloads',
      enabled: true,
      data: {
        ...c.downloadsSection,
        items: c.downloads.map((d) => ({
          ...d,
          ...(d.kind === 'pdf' ? { badge: '4 עמודים' } : {}),
        })),
      },
    },
    {
      id: 'contact',
      type: 'leadForm',
      enabled: true,
      data: {
        eyebrow: 'יצירת קשר',
        title: c.leadForm.title,
        subtitle: c.leadForm.subtitle,
        labels: { ...c.leadForm.fields },
        types: [...c.leadForm.types],
        submit: c.leadForm.submit,
        disclaimer: c.leadForm.disclaimer,
        fallbackTitle: c.leadForm.fallbackTitle,
        fallbackBody: c.leadForm.fallbackBody,
      },
    },
  ],
};
