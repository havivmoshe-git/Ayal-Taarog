export type GalleryCategory = 'rooms' | 'food' | 'venue' | 'docs';

export type GalleryImage = {
  /** Base filename in public/gallery, without the -sm/-lg suffix. */
  slug: string;
  category: GalleryCategory;
  alt: string;
  caption: string;
};

export const categories: { id: GalleryCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'הכול' },
  { id: 'rooms', label: 'חדרי לינה' },
  { id: 'food', label: 'קולינריה' },
  { id: 'venue', label: 'אולם ובית כנסת' },
  { id: 'docs', label: 'שרטוט' },
];

/** Ordered for visual rhythm — the grid alternates between wide venue shots,
 *  close-up plates and calm room interiors rather than grouping by category. */
export const images: GalleryImage[] = [
  {
    slug: 'hall-shabbat-meal',
    category: 'venue',
    alt: 'אולם האירוח מלא באורחים במהלך סעודת שבת, שולחנות ערוכים עם סלטים ומנות פתיחה',
    caption: 'סעודת שבת באולם האירוח',
  },
  {
    slug: 'food-salmon-tartare',
    category: 'food',
    alt: 'טרטר סלמון עם ירקות קצוצים וקוויאר, מוגש בצלחת קרמיקה מעוטרת',
    caption: 'טרטר סלמון וקוויאר',
  },
  {
    slug: 'room-family-01',
    category: 'rooms',
    alt: 'חדר לינה משפחתי ובו מיטה זוגית ומיטת קומתיים, מול חלון עם נוף',
    caption: 'חדר משפחתי — מיטה זוגית וקומתיים',
  },
  {
    slug: 'hall-tables-set',
    category: 'venue',
    alt: 'שולחן עגול ערוך באולם עם סלטים, כיסאות מוזהבים ומפה בגוון שמנת',
    caption: 'שולחן ערוך לקראת הסעודה',
  },
  {
    slug: 'food-lamb-chops',
    category: 'food',
    alt: 'צלעות טלה צלויות לצד פירה וירקות שורש בתנור',
    caption: 'צלעות טלה על מצע פירה',
  },
  {
    slug: 'synagogue-main',
    category: 'venue',
    alt: 'בית הכנסת חסדי שמואל מבפנים, ספסלי עץ וארון קודש',
    caption: 'בית הכנסת ״חסדי שמואל״',
  },
  {
    slug: 'room-family-02',
    category: 'rooms',
    alt: 'חדר לינה מרווח עם מיטה זוגית ומיטת קומתיים לבנה ורצפת שיש',
    caption: 'חדר לינה מרווח',
  },
  {
    slug: 'food-salmon-carpaccio',
    category: 'food',
    alt: 'קרפצ׳יו סלמון עם בצל ירוק, קוויאר וקרוטון אפוי',
    caption: 'קרפצ׳יו סלמון',
  },
  {
    slug: 'hall-place-setting',
    category: 'venue',
    alt: 'עריכת שולחן עם כוסות יין, מפיות מקופלות וסכו״ם מוזהב',
    caption: 'עריכת שולחן אישית',
  },
  {
    slug: 'food-kitchen-prep',
    category: 'food',
    alt: 'שף מכין עשרות מנות סלט עגבניות במטבח המקצועי',
    caption: 'הכנות במטבח השף',
  },
  {
    slug: 'room-bunk-window',
    category: 'rooms',
    alt: 'מיטת קומתיים מוצעת מול חלון גדול עם נוף העיר',
    caption: 'מיטה מוצעת מול הנוף',
  },
  {
    slug: 'food-beet-carpaccio',
    category: 'food',
    alt: 'קרפצ׳יו סלק עם עלי חסה, צנונית ועגבנייה בצלחת כחול־לבן',
    caption: 'קרפצ׳יו סלק',
  },
  {
    slug: 'lounge-seating',
    category: 'venue',
    alt: 'טרקלין ישיבה עם ספות אפורות ושלט ״מזמור לתודה״ על הקיר',
    caption: 'טרקלין הישיבה',
  },
  {
    slug: 'food-potatoes',
    category: 'food',
    alt: 'תפוחי אדמה קטנים צלויים עם עשבי תיבול, מוגשים על קרש עץ',
    caption: 'תפוחי אדמה צלויים',
  },
  {
    slug: 'room-bathroom',
    category: 'rooms',
    alt: 'חדר רחצה פרטי עם כיור לבן, מראה וקיר שיש כהה',
    caption: 'שירותים ומקלחת בכל חדר',
  },
  {
    slug: 'food-antipasti',
    category: 'food',
    alt: 'מנת ירקות צלויים — פלפל, שום ופלפלון עם עשבי תיבול',
    caption: 'ירקות צלויים בתנור',
  },
  {
    slug: 'floorplan',
    category: 'docs',
    alt: 'שרטוט חדרי האירוח של מתחם כאייל תערוג, ובו 10 חדרים סביב היכל בית הכנסת',
    caption: 'שרטוט ופירוט החדרים',
  },
];

/** Public URL for a variant. Respects Vite's base path on GitHub Pages. */
export function galleryUrl(slug: string, size: 'sm' | 'lg'): string {
  return `${import.meta.env.BASE_URL}gallery/${slug}-${size}.webp`;
}
