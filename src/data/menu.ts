/**
 * Shabbat menu, transcribed from the four-page PDF the venue supplied
 * (public/docs/menu-shabbat.pdf — that file remains the authoritative version
 * and is linked for download from the menu section).
 *
 * ── VERIFICATION NOTE ─────────────────────────────────────────────────────
 * The source PDF draws each Hebrew glyph as a separately positioned element,
 * with headings layered on top of body text. Most dishes extracted cleanly.
 * The eight entries tagged `unverified: true` below sat under an overlapping
 * layer and are a best reconstruction — they should be checked against the
 * printed menu before anyone relies on them. Remove the flag once confirmed;
 * it is data-only and does not affect what renders.
 * ──────────────────────────────────────────────────────────────────────────
 */

export type Dish = {
  name: string;
  /** Shown as a small tag beside the dish, e.g. served family-style. */
  note?: string;
  /** See the verification note above. Not rendered. */
  unverified?: boolean;
};

export type Meal = {
  id: string;
  /** Tab label — short enough for a phone. */
  tab: string;
  title: string;
  subtitle: string;
  dishes: Dish[];
};

export const meals: Meal[] = [
  {
    id: 'friday',
    tab: 'ערב שבת',
    title: 'סעודה ראשונה',
    subtitle: 'ליל שבת — מנות פתיחה ומנות ראשונות',
    dishes: [
      { name: 'חלה אישית לכל סועד' },
      { name: 'בבא גנוש עם טוויסט שף' },
      { name: 'מטבוחה חריפה מסורתית' },
      { name: 'פלטת חריפים מפנקת' },
      { name: 'סלט חומוס עם גרגרים' },
      { name: 'סלט עגבניות עם חריף עדין' },
      { name: 'סלק וגזר בסגנון מרוקאי' },
      { name: 'סלט ירקות מרענן עם נענע ולימון' },
      { name: 'סלט קינואה עם ירקות צבעוניים ורוטב ויניגרט הדרים' },
      { name: 'סלט סלק צלוי עם בצל מקורמל ואגוזי מלך' },
      { name: 'טרטר טונה עם אבוקדו ופניני פנקו פריך' },
      { name: 'פלטת סשימי סלמון ודגים טריים', note: 'ברוטב סויה ושומשום' },
      { name: 'מאפה במילוי בשר כבש עם טחינה גולמית וסילאן' },
      { name: 'בשר מפורק על מצע פירה תפוחי אדמה בניחוח כמהין' },
      { name: 'פילה לברק עם קרם גזר וסלסה צ׳ימיצ׳ורי' },
      { name: 'פילה סלמון ברוטב חריימה', note: 'מרכז שולחן' },
    ],
  },
  {
    id: 'morning',
    tab: 'שבת בבוקר',
    title: 'סעודה שנייה',
    subtitle: 'מנות עיקריות לאחר התפילה',
    dishes: [
      { name: 'סטייק פרגית בתיבול מזרחי' },
      { name: 'סיגר במילוי בשר טחון על מצע קרם חציל' },
      { name: 'אסאדו מבושל שעות ארוכות', unverified: true },
      { name: 'פילה לברק אפוי עם רוטב מזרחי' },
      { name: 'פילה דניס ברוטב לימוני' },
      { name: 'סלמון על מצע קרם אפונה' },
      { name: 'עוף ממולא בצימוקים ואגוזים', note: 'עם תפוחי אדמה וערמונים', unverified: true },
      { name: 'תבשיל קרמי עם ירקות מהגינה', unverified: true },
      { name: 'צלי בקר ברוטב עגבניות וירקות שורש', unverified: true },
      { name: 'סלטים קלים ומרעננים לפי בחירה', unverified: true },
    ],
  },
  {
    id: 'third',
    tab: 'סעודה שלישית',
    title: 'סעודה שלישית',
    subtitle: 'מרכז שולחן עשיר לקראת צאת השבת',
    dishes: [
      { name: 'חמין שף', note: 'בשר איכותי, גרגרי חומוס ושעועית, תפוחי אדמה קטנים' },
      { name: 'צלי בקר ברוטב פטריות עשיר' },
      { name: 'כרעיים עוף בדבש וסילאן' },
      { name: 'קיגל אטריות מסורתי' },
      { name: 'סוגי קישים מעוצבים' },
      { name: 'סלמון גרבלקס ודגים מעושנים' },
      { name: 'מיני קרואסונים ממולאים בסלמון כבוש' },
      { name: 'אנטיפסטי ירקות קלויים עם שמן זית', note: 'מרכז שולחן' },
      { name: 'תפוחי אדמה' },
      { name: 'אורז לבן רך' },
      { name: 'שעועית ירוקה' },
      { name: 'ירקות בגריל', unverified: true },
      { name: 'חיטה מעושנת', unverified: true },
      {
        name: 'מבחר סלטים',
        note: 'סלט טונה · סלט ביצים · סלט אבוקדו · סלט קולסלו · סלט כרוב',
      },
      { name: 'סלט כרוב אדום עם מיונז', unverified: true },
      { name: 'סלט ירקות' },
      { name: 'פירות חתוכים צבעוניים' },
    ],
  },
];

export const menuSection = {
  eyebrow: 'תפריט שף',
  title: 'סעודות שבת ברמה שלא הכרתם',
  subtitle:
    'כל האוכל מוכן במקום על ידי שף פרטי, מחומרי גלם מובחרים ובכשרות מהודרת. התפריט מגוון וכולל מנות לבחירה.',
  disclaimer: 'התפריט כולל מנות לבחירה ואינו כולל קינוחים ושתייה חריפה. ייתכנו שינויים לפי עונה וזמינות.',
  downloadCta: 'להורדת התפריט המלא',
};

/** Displayed as three badges above the menu. */
export const kosher = [
  { label: 'ירקות', value: 'גוש קטיף' },
  { label: 'בשר', value: 'חלק — הרב מחפוד' },
  { label: 'האולם', value: 'תחת מו״ר הרב אייל עמרמי שליט״א' },
];

/** What the culinary package covers, from the venue's menu flyer. */
export const culinaryIncluded = [
  '3 סעודות שבת מלאות + יין לקידוש',
  'שתייה קלה ללא הגבלה + פירות בכל סעודה',
  'משגיח כשרות לאורך כל השבת',
  'כל האוכל מוכן במקום על ידי שף פרטי',
  'אולם אירוח פרטי לכל האורחים',
  'צוות הגשה ועריכת שולחנות מלאה — מפות, מפיות, סכו״ם וכלי הגשה',
  'ניקיון לאורך כל השבת',
];
