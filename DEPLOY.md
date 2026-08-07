# פריסה

האתר בנוי כך שאותו commit נבנה נכון גם ב-Vercel וגם ב-GitHub Pages. ההבדל היחיד הוא שני משתני סביבה, כך שאפשר להקים את Vercel בלי להפיל את האתר הקיים.

| משתנה | Vercel | GitHub Pages |
|---|---|---|
| `VITE_BASE_PATH` | לא מוגדר (ברירת מחדל `/`) | `/Ayal-Taarog/` |
| `VITE_SITE_URL` | הכתובת המלאה של האתר | `https://havivmoshe-git.github.io/Ayal-Taarog` |

`VITE_SITE_URL` **חובה**. בלעדיו תגיות ה-Open Graph יוצאות יחסיות, ותצוגה המקדימה בוואטסאפ תישבר — וזו הסיבה המרכזית שאנשים לוחצים על הקישור. הבנייה תדפיס אזהרה אם הוא חסר.

---

## הקמת Vercel

חד־פעמי, כ-10 דקות.

### 1. חיבור הריפו

1. https://vercel.com → הרשמה **עם חשבון GitHub** (זה חוסך את שלב ההרשאות).
2. **Add New → Project**.
3. ליד `havivmoshe-git/Ayal-Taarog` → **Import**.
4. Vercel יזהה Vite לבד. **אל תשנו** את הגדרות הבנייה — `vercel.json` כבר מגדיר אותן.

### 2. הגדרת משתני הסביבה

לפני שלוחצים Deploy, לפתוח **Environment Variables** ולהוסיף:

| Name | Value |
|---|---|
| `VITE_SITE_URL` | `https://ayal-taarog.vercel.app` |

(אם תחברו דומיין משלכם בהמשך — עדכנו את הערך הזה לכתובת החדשה ופרסו מחדש.)

כשיגיעו פרטי Supabase יתווספו כאן עוד שניים:

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` |

### 3. Deploy

ללחוץ **Deploy**. תוך כדקה תקבלו כתובת.

### 4. בדיקה

- האתר נטען ונראה תקין
- `/#/admin` פותח את הפאנל
- הדבקת הכתובת בוואטסאפ מציגה תצוגה מקדימה **עם תמונה** — אם התמונה חסרה, `VITE_SITE_URL` שגוי או לא הוגדר

מכאן כל push לענף פורס אוטומטית.

---

## דומיין משלכם

**Settings → Domains** → להוסיף את הדומיין. Vercel יראה אילו רשומות DNS להוסיף אצל ספק הדומיין.

אחרי שהדומיין פעיל — לעדכן את `VITE_SITE_URL` לכתובת החדשה ולפרוס מחדש, אחרת תגיות השיתוף עדיין יצביעו לכתובת הישנה.

---

## GitHub Pages

ממשיך לעבוד במקביל ללא שינוי, כגיבוי. אחרי ש-Vercel יציב אפשר לכבות אותו: למחוק את `.github/workflows/deploy.yml`, או להשאיר — הוא לא מפריע ולא עולה כסף.

---

## בנייה מקומית

```bash
npm install
npm run images   # פעם אחת — מייצר את תמונות הגלריה
npm run dev
```

לבדיקת בנייה כמו בפרודקשן:

```bash
VITE_SITE_URL=http://localhost:4173 npm run build && npm run preview
```
