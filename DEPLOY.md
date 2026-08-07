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

**וגם שני אלה — בלעדיהם העריכות לא יופיעו באתר:**

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://jgrpwwkpfnykapkmefqp.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncnB3d2twZm55a2Fwa21lZnFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwOTk1NTcsImV4cCI6MjEwMTY3NTU1N30.w4muiqbkV68k1u4WsIrPo8ubEB56-dMyROjVWRIj5Rk` |

מפתח ה-`anon` נמצא כאן בכוונה — הוא מיועד לחשיפה פומבית ומגיע ממילא לכל מבקר בתוך קוד האתר. נבדק בפועל שהוא **לא** מאפשר כתיבה: ניסיון עריכה איתו לא שינה דבר, וניסיון העלאת קובץ הוחזר עם `403 row-level security policy`.

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
