import type { SectionType } from '../content/schema';

/**
 * What each section type exposes to the editor, declared as data.
 *
 * Fourteen hand-written forms would be fourteen places to keep in sync with
 * the schema. One spec per type plus one renderer means adding a field is a
 * single line, and every section gets the same list-reordering, validation and
 * RTL behaviour for free.
 */

export type Field =
  /** `ltr` is for URLs and phone numbers: right-aligned in an RTL form they
   *  render with their punctuation reordered and become unreadable. */
  | { kind: 'text'; key: string; label: string; hint?: string; ltr?: boolean }
  | { kind: 'textarea'; key: string; label: string; rows?: number; hint?: string }
  | { kind: 'number'; key: string; label: string }
  /** `coerce` converts the option's string back to the type the schema
   *  declares. Without it a rating select writes "5" into a number field, and
   *  averaging it concatenates instead of adding. */
  | {
      kind: 'select';
      key: string;
      label: string;
      options: { value: string; label: string }[];
      coerce?: 'number' | 'boolean';
      hint?: string;
    }
  | { kind: 'image'; key: string; label: string; hint?: string }
  | { kind: 'strings'; key: string; label: string; itemLabel: string }
  | {
      kind: 'list';
      key: string;
      label: string;
      itemLabel: string;
      /** Which sub-field to show as the row's title in the collapsed list. */
      titleKey: string;
      fields: Field[];
    };

const ICON_OPTIONS = [
  { value: 'bed', label: 'מיטה' },
  { value: 'chef', label: 'שף' },
  { value: 'hall', label: 'אולם' },
  { value: 'prayer', label: 'תפילה' },
  { value: 'torah', label: 'ספר תורה' },
  { value: 'bath', label: 'מקלחת' },
  { value: 'coffee', label: 'קפה' },
  { value: 'shield', label: 'מגן' },
];

const HEADING: Field[] = [
  { kind: 'text', key: 'eyebrow', label: 'כותרת עליונה קטנה' },
  { kind: 'text', key: 'title', label: 'כותרת' },
  { kind: 'textarea', key: 'subtitle', label: 'כותרת משנה', rows: 2 },
];

export const FORM_SPEC: Record<SectionType, Field[]> = {
  hero: [
    // No alt-text field: the crest sits directly beside the venue's name in
    // the header, so a screen reader announcing it too would say the same
    // thing twice. It ships with an empty alt, which is the correct markup
    // for an image a neighbouring label already covers.
    { kind: 'image', key: 'logo', label: 'לוגו', hint: 'מוצג בסרגל העליון לצד שם המתחם. ריק = לא מוצג.' },
    { kind: 'text', key: 'eyebrow', label: 'בס״ד / כיתוב עליון' },
    { kind: 'text', key: 'kicker', label: 'שורה מעל השם' },
    { kind: 'text', key: 'brand', label: 'שם המתחם' },
    { kind: 'text', key: 'title', label: 'כותרת ראשית' },
    { kind: 'text', key: 'titleAccent', label: 'שורת הדגשה' },
    { kind: 'textarea', key: 'subtitle', label: 'תיאור', rows: 2 },
    { kind: 'text', key: 'location', label: 'מיקום' },
    { kind: 'text', key: 'ctaPrimary', label: 'כפתור ראשי' },
    { kind: 'text', key: 'ctaShort', label: 'כפתור ראשי — גרסה קצרה', hint: 'לסרגל התחתון בטלפון' },
    { kind: 'text', key: 'ctaSecondary', label: 'כפתור וואטסאפ' },
    { kind: 'text', key: 'scrollHint', label: 'רמז גלילה' },
    { kind: 'image', key: 'imageWide', label: 'תמונת רקע — מסך רחב' },
    { kind: 'image', key: 'imagePortrait', label: 'תמונת רקע — טלפון', hint: 'תמונה מאונכת נחתכת יפה יותר' },
  ],

  trustBar: [
    {
      kind: 'list',
      key: 'items',
      label: 'נתונים',
      itemLabel: 'נתון',
      titleKey: 'label',
      fields: [
        { kind: 'text', key: 'value', label: 'מספר או מילה' },
        { kind: 'text', key: 'label', label: 'כותרת' },
        { kind: 'text', key: 'note', label: 'הערה' },
      ],
    },
  ],

  included: [
    ...HEADING,
    {
      kind: 'list',
      key: 'items',
      label: 'כרטיסים',
      itemLabel: 'כרטיס',
      titleKey: 'title',
      fields: [
        { kind: 'select', key: 'icon', label: 'אייקון', options: ICON_OPTIONS },
        { kind: 'text', key: 'title', label: 'כותרת' },
        { kind: 'textarea', key: 'body', label: 'תיאור', rows: 3 },
      ],
    },
  ],

  rooms: [
    ...HEADING,
    {
      kind: 'list',
      key: 'breakdown',
      label: 'הרכב החדרים',
      itemLabel: 'שורה',
      titleKey: 'rooms',
      fields: [
        { kind: 'text', key: 'rooms', label: 'כמות חדרים' },
        { kind: 'text', key: 'beds', label: 'מיטות' },
        { kind: 'text', key: 'occupancy', label: 'תפוסה' },
        { kind: 'number', key: 'people', label: 'נפשות' },
      ],
    },
    { kind: 'text', key: 'totalLabel', label: 'תווית סה״כ' },
    { kind: 'text', key: 'totalValue', label: 'ערך סה״כ' },
    { kind: 'text', key: 'totalNote', label: 'הערת סה״כ' },
    { kind: 'image', key: 'planImage', label: 'שרטוט' },
    { kind: 'text', key: 'planCta', label: 'כיתוב על השרטוט' },
    { kind: 'text', key: 'planAlt', label: 'תיאור השרטוט', hint: 'לקוראי מסך ולגוגל' },
  ],

  gallery: [
    { kind: 'text', key: 'title', label: 'כותרת' },
    { kind: 'textarea', key: 'subtitle', label: 'כותרת משנה', rows: 2 },
    { kind: 'text', key: 'catalogCta', label: 'כפתור הקטלוג' },
    { kind: 'text', key: 'swipeHint', label: 'רמז החלקה בטלפון' },
    {
      kind: 'list',
      key: 'categories',
      label: 'קטגוריות סינון',
      itemLabel: 'קטגוריה',
      titleKey: 'label',
      fields: [
        { kind: 'text', key: 'id', label: 'מזהה', hint: 'באנגלית, חייב להתאים לקטגוריה של התמונות' },
        { kind: 'text', key: 'label', label: 'תווית' },
      ],
    },
    {
      kind: 'list',
      key: 'images',
      label: 'תמונות',
      itemLabel: 'תמונה',
      titleKey: 'caption',
      fields: [
        { kind: 'image', key: 'slug', label: 'תמונה' },
        { kind: 'text', key: 'category', label: 'קטגוריה' },
        { kind: 'text', key: 'caption', label: 'כיתוב' },
        { kind: 'textarea', key: 'alt', label: 'תיאור לקוראי מסך', rows: 2 },
      ],
    },
  ],

  timeline: [
    ...HEADING,
    {
      kind: 'list',
      key: 'items',
      label: 'שלבים',
      itemLabel: 'שלב',
      titleKey: 'title',
      fields: [
        { kind: 'text', key: 'time', label: 'זמן' },
        { kind: 'text', key: 'title', label: 'כותרת' },
        { kind: 'textarea', key: 'body', label: 'תיאור', rows: 3 },
      ],
    },
  ],

  menu: [
    ...HEADING,
    {
      kind: 'list',
      key: 'kosher',
      label: 'תגיות כשרות',
      itemLabel: 'תגית',
      titleKey: 'label',
      fields: [
        { kind: 'text', key: 'label', label: 'נושא' },
        { kind: 'text', key: 'value', label: 'פירוט' },
      ],
    },
    {
      kind: 'list',
      key: 'meals',
      label: 'סעודות',
      itemLabel: 'סעודה',
      titleKey: 'title',
      fields: [
        { kind: 'text', key: 'id', label: 'מזהה', hint: 'באנגלית' },
        { kind: 'text', key: 'tab', label: 'תווית הטאב' },
        { kind: 'text', key: 'title', label: 'כותרת' },
        { kind: 'text', key: 'subtitle', label: 'כותרת משנה' },
        {
          kind: 'list',
          key: 'dishes',
          label: 'מנות',
          itemLabel: 'מנה',
          titleKey: 'name',
          fields: [
            { kind: 'text', key: 'name', label: 'שם המנה' },
            { kind: 'text', key: 'note', label: 'הערה' },
          ],
        },
      ],
    },
    { kind: 'text', key: 'culinaryTitle', label: 'כותרת "מה כולל"' },
    { kind: 'strings', key: 'culinaryIncluded', label: 'מה כולל האירוח הקולינרי', itemLabel: 'פריט' },
    { kind: 'textarea', key: 'disclaimer', label: 'הבהרה', rows: 2 },
    { kind: 'text', key: 'downloadCta', label: 'כפתור ההורדה' },
    { kind: 'text', key: 'downloadFile', label: 'קובץ התפריט' },
  ],

  location: [
    ...HEADING,
    { kind: 'text', key: 'wazeCta', label: 'כפתור Waze' },
    { kind: 'text', key: 'mapsCta', label: 'כפתור Google Maps' },
    { kind: 'textarea', key: 'mapEmbed', label: 'כתובת המפה המוטמעת', rows: 3 },
  ],

  faq: [
    { kind: 'text', key: 'eyebrow', label: 'כותרת עליונה קטנה' },
    { kind: 'text', key: 'title', label: 'כותרת' },
    {
      kind: 'list',
      key: 'items',
      label: 'שאלות',
      itemLabel: 'שאלה',
      titleKey: 'q',
      fields: [
        { kind: 'text', key: 'q', label: 'שאלה' },
        { kind: 'textarea', key: 'a', label: 'תשובה', rows: 4 },
      ],
    },
  ],

  downloads: [
    ...HEADING,
    {
      kind: 'list',
      key: 'items',
      label: 'קבצים',
      itemLabel: 'קובץ',
      titleKey: 'title',
      fields: [
        { kind: 'text', key: 'slug', label: 'מזהה', hint: 'באנגלית' },
        {
          kind: 'select',
          key: 'kind',
          label: 'סוג',
          options: [
            { value: 'pdf', label: 'PDF' },
            { value: 'image', label: 'תמונה' },
          ],
        },
        { kind: 'text', key: 'title', label: 'כותרת' },
        { kind: 'textarea', key: 'body', label: 'תיאור', rows: 2 },
        { kind: 'text', key: 'file', label: 'נתיב הקובץ', ltr: true },
        { kind: 'text', key: 'cta', label: 'כפתור' },
        { kind: 'text', key: 'badge', label: 'תגית', hint: 'למשל: 4 עמודים' },
      ],
    },
  ],

  leadForm: [
    ...HEADING,
    { kind: 'strings', key: 'types', label: 'סוגי אירוע', itemLabel: 'סוג' },
    { kind: 'text', key: 'submit', label: 'כפתור השליחה' },
    { kind: 'textarea', key: 'disclaimer', label: 'הבהרה', rows: 2 },
    { kind: 'text', key: 'fallbackTitle', label: 'כותרת גיבוי' },
    { kind: 'text', key: 'fallbackBody', label: 'טקסט גיבוי' },
    {
      kind: 'textarea',
      key: 'labels.privacy',
      label: 'הודעת הפרטיות מתחת לכפתור',
      rows: 2,
      hint: 'זו ההודעה שמאפשרת לשמור פנייה שלא נשלחה. אל תסירו אותה.',
    },
  ],

  testimonials: [
    ...HEADING,
    {
      kind: 'list',
      key: 'items',
      label: 'פידבקים',
      itemLabel: 'פידבק',
      titleKey: 'name',
      fields: [
        { kind: 'text', key: 'name', label: 'שם הכותב' },
        { kind: 'text', key: 'context', label: 'מתי ומה', hint: 'למשל: שבת חתן, אלול תשפ״ה' },
        { kind: 'textarea', key: 'quote', label: 'מה כתבו', rows: 4 },
        {
          kind: 'select',
          key: 'rating',
          label: 'דירוג',
          coerce: 'number',
          options: [
            { value: '5', label: '★★★★★' },
            { value: '4', label: '★★★★' },
            { value: '3', label: '★★★' },
            { value: '2', label: '★★' },
            { value: '1', label: '★' },
          ],
        },
      ],
    },
    {
      kind: 'select',
      key: 'showSummary',
      label: 'רצועת הדירוג הממוצע',
      coerce: 'boolean',
      hint: 'מופיעה רק משלושה פידבקים ומעלה — ממוצע על פידבק אחד לא אומר כלום.',
      options: [
        { value: 'true', label: 'מוצגת' },
        { value: 'false', label: 'מוסתרת' },
      ],
    },
    {
      kind: 'text',
      key: 'summaryLabel',
      label: 'הכיתוב מתחת לממוצע',
      hint: 'ריק = "מתוך N חוות דעת"',
    },
  ],

  imageBreak: [
    { kind: 'image', key: 'image', label: 'תמונה' },
    { kind: 'text', key: 'line', label: 'המשפט' },
    { kind: 'text', key: 'attribution', label: 'שורת ייחוס' },
    { kind: 'textarea', key: 'alt', label: 'תיאור לקוראי מסך', rows: 2 },
  ],

  banner: [
    {
      kind: 'select',
      key: 'tone',
      label: 'גוון',
      options: [
        { value: 'gold', label: 'זהב' },
        { value: 'navy', label: 'כחול' },
        { value: 'festive', label: 'חגיגי' },
      ],
    },
    { kind: 'text', key: 'title', label: 'כותרת' },
    { kind: 'textarea', key: 'body', label: 'טקסט', rows: 2 },
    { kind: 'text', key: 'ctaLabel', label: 'כפתור', hint: 'לא חובה' },
    { kind: 'text', key: 'ctaHref', label: 'קישור הכפתור', hint: 'למשל #contact', ltr: true },
  ],

  richText: [
    { kind: 'text', key: 'eyebrow', label: 'כותרת עליונה קטנה' },
    { kind: 'text', key: 'title', label: 'כותרת' },
    { kind: 'strings', key: 'paragraphs', label: 'פסקאות', itemLabel: 'פסקה' },
    {
      kind: 'select',
      key: 'align',
      label: 'יישור',
      options: [
        { value: 'center', label: 'מרכז' },
        { value: 'start', label: 'ימין' },
      ],
    },
  ],
};

/**
 * The values that belong to the site rather than to any one section: phone
 * numbers, the footer, and the text search engines and WhatsApp previews show.
 * Same field vocabulary as the sections, so the same renderer draws them.
 */
export const SITE_GROUPS: {
  key: 'contact' | 'footer' | 'seo' | 'feedbackPage';
  label: string;
  fields: Field[];
}[] = [
  {
    key: 'contact',
    label: 'פרטי קשר',
    fields: [
      { kind: 'text', key: 'whatsappNumber', label: 'מספר וואטסאפ', hint: 'בפורמט בינלאומי, למשל 972501234567', ltr: true },
      { kind: 'text', key: 'phoneDisplay', label: 'טלפון כפי שמוצג', ltr: true },
      { kind: 'text', key: 'phoneHref', label: 'טלפון לחיוג', hint: 'הספרות בלבד, ללא מקפים', ltr: true },
      { kind: 'text', key: 'synagogue', label: 'שם בית הכנסת' },
      { kind: 'text', key: 'address', label: 'כתובת מלאה' },
      { kind: 'text', key: 'addressShort', label: 'כתובת מקוצרת' },
      { kind: 'text', key: 'mapsUrl', label: 'קישור ל-Google Maps', ltr: true },
      { kind: 'text', key: 'wazeUrl', label: 'קישור ל-Waze', ltr: true },
      { kind: 'text', key: 'catalogUrl', label: 'קישור לקטלוג', ltr: true },
      { kind: 'text', key: 'instituteUrl', label: 'קישור לאתר המוסדות', ltr: true },
    ],
  },
  {
    key: 'footer',
    label: 'כותרת תחתונה',
    fields: [
      { kind: 'textarea', key: 'tagline', label: 'משפט פתיחה', rows: 2 },
      { kind: 'text', key: 'aboutTitle', label: 'כותרת "אודות"' },
      { kind: 'textarea', key: 'about', label: 'טקסט אודות', rows: 4 },
      { kind: 'text', key: 'linksTitle', label: 'כותרת הקישורים' },
      { kind: 'text', key: 'contactTitle', label: 'כותרת יצירת הקשר' },
      { kind: 'text', key: 'instituteLink', label: 'תווית הקישור למוסדות' },
      { kind: 'text', key: 'catalogLink', label: 'תווית הקישור לקטלוג' },
      { kind: 'text', key: 'rights', label: 'שורת זכויות' },
    ],
  },
  {
    key: 'feedbackPage',
    label: 'דף הפידבק',
    fields: [
      { kind: 'text', key: 'eyebrow', label: 'כותרת עליונה קטנה' },
      { kind: 'text', key: 'title', label: 'כותרת' },
      { kind: 'textarea', key: 'intro', label: 'משפט הפתיחה', rows: 3 },
      { kind: 'text', key: 'nameLabel', label: 'תווית — שם' },
      { kind: 'text', key: 'contextLabel', label: 'תווית — מתי התארחתם' },
      { kind: 'text', key: 'contextHint', label: 'דוגמה — מתי התארחתם' },
      { kind: 'text', key: 'ratingLabel', label: 'תווית — דירוג' },
      { kind: 'text', key: 'quoteLabel', label: 'תווית — מה אהבתם' },
      { kind: 'textarea', key: 'quoteHint', label: 'הסבר — מה אהבתם', rows: 2 },
      { kind: 'text', key: 'privateLabel', label: 'תווית — מה לשפר' },
      {
        kind: 'textarea',
        key: 'privateHint',
        label: 'הסבר — מה לשפר',
        rows: 3,
        hint: 'ההבטחה שהטקסט הזה לא יפורסם היא מה שגורם לאנשים לכתוב בכנות. אל תסירו אותה.',
      },
      { kind: 'text', key: 'phoneLabel', label: 'תווית — טלפון' },
      { kind: 'text', key: 'phoneHint', label: 'הסבר — טלפון' },
      { kind: 'textarea', key: 'consentLabel', label: 'תיבת האישור לפרסום', rows: 2 },
      { kind: 'text', key: 'submit', label: 'כפתור השליחה' },
      { kind: 'text', key: 'thanksTitle', label: 'כותרת תודה' },
      { kind: 'textarea', key: 'thanksBody', label: 'טקסט תודה', rows: 2 },
      { kind: 'text', key: 'backCta', label: 'כפתור חזרה לאתר' },
    ],
  },
  {
    key: 'seo',
    label: 'כותרת בגוגל ובשיתוף',
    fields: [
      { kind: 'text', key: 'title', label: 'כותרת הדף' },
      {
        kind: 'textarea',
        key: 'description',
        label: 'תיאור',
        rows: 3,
        hint: 'עד כ-160 תווים. זה הטקסט שנראה בתוצאות החיפוש ובשיתוף בוואטסאפ.',
      },
    ],
  },
];

/** Blank payloads for sections the editor can create. */
export const NEW_SECTION_DATA: Partial<Record<SectionType, unknown>> = {
  banner: {
    tone: 'gold',
    title: 'חג שמח!',
    body: 'המתחם פתוח להזמנות לשבתות החג — מספר המקומות מוגבל.',
    ctaLabel: 'לקבלת הצעה',
    ctaHref: '#contact',
  },
  testimonials: {
    eyebrow: 'מה אומרים עלינו',
    title: 'פידבקים מהאורחים',
    subtitle: '',
    showSummary: true,
    summaryLabel: '',
    // Deliberately obvious placeholders. A plausible-looking name attached to
    // a review nobody wrote is a fabricated record, and the whole point of
    // this section is that visitors believe it.
    items: [
      { name: 'שם הכותב', context: 'שבת חתן, חודש ושנה', quote: 'הטקסט של הפידבק כאן.', rating: 5 },
    ],
  },
  richText: {
    title: 'כותרת חדשה',
    paragraphs: ['הטקסט שלכם כאן.'],
    align: 'center',
  },
  imageBreak: {
    image: 'synagogue-main',
    alt: 'תמונה מהמתחם',
    line: 'המשפט שלכם כאן',
    attribution: '',
  },
};
