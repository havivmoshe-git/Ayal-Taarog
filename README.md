# מתחם האירוח ״כאייל תערוג״ — אתר שיווקי

אתר תדמית ושיווק למתחם האירוח של מוסדות הרב אייל עמרמי שליט״א, בבית הכנסת ״חסדי שמואל״ בהר חומה, ירושלים.

עמוד יחיד, בעברית RTL, מותאם קודם כול לטלפון. מחליף את הודעת ההפצה בוואטסאפ בקישור אחד שאפשר לשתף בכל פלטפורמה.

**כתובת האתר:** https://havivmoshe-git.github.io/Ayal-Taarog/

---

## הפעלה מקומית

```bash
npm install
npm run images   # פעם אחת — מייצר את תמונות הגלריה
npm run dev
```

| פקודה | מה היא עושה |
|---|---|
| `npm run dev` | שרת פיתוח |
| `npm run images` | ממיר את `assets/source/` ל-WebP רספונסיבי ב-`public/gallery/` |
| `npm run build` | בדיקת טיפוסים + build לפרודקשן ל-`dist/` |
| `npm run preview` | תצוגה מקומית של ה-build |

> `public/gallery/` נוצר אוטומטית ואינו נשמר ב-git. חובה להריץ `npm run images` לפני `dev` או `build` בפעם הראשונה. ב-CI זה קורה מעצמו.

---

## עריכת תוכן

כמעט כל שינוי טקסטואלי נעשה בקובץ אחד:

**`src/data/content.ts`** — טלפון, כתובת, כותרות, רשימת ״מה כלול״, ציר הזמן של השבת, שאלות נפוצות, טקסטים של הטופס והפוטר.

לדוגמה, החלפת מספר הוואטסאפ:

```ts
export const contact = {
  whatsappNumber: '972522701187',  // פורמט בינלאומי, ספרות בלבד
  phoneDisplay: '052-270-1187',
  phoneHref: '+972522701187',
  ...
};
```

**`src/data/gallery.ts`** — רשימת התמונות, הקטגוריה של כל אחת, טקסט חלופי (alt) וכיתוב.

### הוספת תמונה לגלריה

1. שמרו את קובץ ה-JPG ב-`assets/source/` בשם באנגלית (למשל `room-family-03.jpg`).
2. הריצו `npm run images`.
3. הוסיפו רשומה ל-`images` ב-`src/data/gallery.ts` עם ה-`slug` (שם הקובץ ללא הסיומת), הקטגוריה, ה-`alt` והכיתוב.

---

## איך עובד טופס הפנייה

אין שרת ואין בסיס נתונים. הטופס אוסף שם, תאריך (לועזי ועברי), כמות אורחים, סוג אירוע והערות, מרכיב מהם הודעה מעוצבת ופותח את וואטסאפ עם ההודעה מוכנה לשליחה — כך שהפנייה מגיעה מסודרת ואפשר להשיב עליה עם הצעת מחיר בלי סבב שאלות.

הלוגיקה נמצאת ב-`src/lib/whatsapp.ts`.

---

## פריסה

כל push לענף `claude/hosting-complex-marketing-app-1xe0va` או `main` מפעיל את `.github/workflows/deploy.yml`, שבונה את האתר ומפרסם אותו ל-GitHub Pages.

**הגדרה חד-פעמית:** ב-GitHub, תחת `Settings → Pages`, יש לבחור ב-**Source: GitHub Actions**.

### דומיין משלכם

1. הוסיפו קובץ `public/CNAME` המכיל את הדומיין (למשל `hosting.ayal-taarog.org.il`).
2. שנו ב-`vite.config.ts` את `base` ל-`'/'`.
3. עדכנו את הכתובות המוחלטות ב-`index.html` (`og:image`, `og:url`, `canonical`) וב-`public/404.html`.

---

## מבנה

```
assets/source/          תמונות מקור (JPG מהצלם)
scripts/                סקריפט אופטימיזציית התמונות
src/data/               תוכן ומטא-דאטה — כאן עורכים
src/components/         רכיבי העמוד
src/lib/whatsapp.ts     בניית הודעת הוואטסאפ
index.html              meta, Open Graph, JSON-LD
```

## סטאק

Vite · React 19 · TypeScript · Tailwind CSS v4 · sharp (בזמן build בלבד)

ללא ספריות אנימציה או אייקונים — ההנפשות נעשות ב-CSS עם `IntersectionObserver`, והאייקונים הם SVG מוטמע. ה-bundle יוצא כ-72KB gzip, מתוך הנחה שרוב המבקרים פותחים את הקישור מוואטסאפ ברשת סלולרית.
