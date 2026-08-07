/**
 * Health checks for the live site.
 *
 * Run from CI on a schedule. Every check answers a question that has actually
 * broken this site before, or would break it silently:
 *
 * - Is it up, and how slow is it? A marketing site nobody can open on a phone
 *   on cellular is down in every way that matters.
 * - Does the published content still parse, and does it still have sections?
 *   A bad publish can empty the page while the server keeps returning 200.
 * - Is Supabase awake? The free tier pauses a project after a week of
 *   inactivity, and a paused project is how the content stops updating.
 * - Did the bundle quietly grow? Page weight is a slow leak, not an event.
 *
 * Exit code 1 fails the workflow, which is what raises the alarm.
 */

const SITE = process.env.SITE_URL || 'https://ayal-taarog.vercel.app';
const SUPABASE = process.env.SUPABASE_URL || '';
const ANON = process.env.SUPABASE_ANON_KEY || '';

// Budgets, chosen from what the site does today with room to move. Passing
// them is not a crash, so they warn rather than fail — except availability.
// `bundleKb` is measured over the wire (compressed), which is what a phone on
// cellular actually pays — the decoded size is nearly three times larger and
// budgeting against it would be measuring the wrong number.
const BUDGET = { html: 1500, content: 3000, bundleKb: 120, p95: 2000 };

const results = [];
let failed = false;

function record(name, ok, detail, fatal = true) {
  results.push({ name, ok, detail });
  if (!ok && fatal) failed = true;
}

async function once(url, options) {
  const started = Date.now();
  try {
    const res = await fetch(url, { redirect: 'follow', ...options });
    return { res, ms: Date.now() - started, body: await res.text() };
  } catch (error) {
    return { error, ms: Date.now() - started };
  }
}

/**
 * One retry after a short pause.
 *
 * A single dropped connection is not an outage, and a monitor that emails
 * about one is a monitor people learn to ignore — at which point it stops
 * working for the outage that is real. Retries are skipped for the load burst,
 * where a failure is the measurement.
 */
async function timed(url, options, retry = true) {
  const first = await once(url, options);
  if (!retry || (first.res && first.res.ok)) return first;
  await new Promise((r) => setTimeout(r, 2000));
  return once(url, options);
}

/* 1. The site itself. */
const home = await timed(`${SITE}/?monitor=${Date.now()}`);
if (home.error || !home.res.ok) {
  record('האתר עולה', false, home.error ? String(home.error) : `HTTP ${home.res.status}`);
} else {
  record('האתר עולה', true, `HTTP 200 · ${home.ms}ms`);
  record('זמן תגובה', home.ms < BUDGET.html, `${home.ms}ms (תקציב ${BUDGET.html}ms)`, false);

  // A 200 that renders nothing is the failure a plain uptime check misses.
  const hasRoot = home.body.includes('id="root"');
  const scripts = [...home.body.matchAll(/assets\/[\w-]+\.js/g)].map((m) => m[0]);
  record('העמוד שלם', hasRoot && scripts.length > 0, `${scripts.length} קבצי סקריפט`);

  if (scripts.length) {
    const main = await timed(`${SITE}/${scripts[0]}`);
    // fetch decompresses transparently and Vercel streams without a
    // content-length, so the wire size is not observable here. Re-compressing
    // the body locally gets within a few percent of what is actually sent,
    // which is the number worth budgeting against.
    const { gzipSync } = await import('node:zlib');
    const kb = Math.round(gzipSync(Buffer.from(main.body ?? '')).length / 1024);
    record('קובץ הקוד נטען', Boolean(main.res?.ok), `${kb}KB דחוס`);
    record('משקל העמוד', kb < BUDGET.bundleKb, `${kb}KB (תקציב ${BUDGET.bundleKb}KB)`, false);
  }

  /* 1b. Under load. The site is static files on a CDN, so this is not expected
         to strain anything — the point is to have the number rather than to
         assume it, and to notice the day it changes. */
  const BURST = 25;
  const burst = await Promise.all(
    Array.from({ length: BURST }, (_, i) => timed(`${SITE}/?load=${Date.now()}-${i}`, undefined, false)),
  );
  const oks = burst.filter((b) => b.res?.ok).length;
  const times = burst.map((b) => b.ms).sort((a, b) => a - b);
  const p50 = times[Math.floor(times.length * 0.5)];
  const p95 = times[Math.floor(times.length * 0.95)] ?? times.at(-1);
  record('עומס — כל הבקשות נענו', oks === BURST, `${oks}/${BURST} בו-זמנית`);
  record('עומס — זמן תגובה', p95 < BUDGET.p95, `חציון ${p50}ms · p95 ${p95}ms`, false);
}

/* 2. The published content the site reads at runtime. */
if (SUPABASE) {
  const content = await timed(`${SUPABASE}/storage/v1/object/public/site/content.json`);
  if (content.error || !content.res.ok) {
    record('התוכן המפורסם זמין', false, content.error ? String(content.error) : `HTTP ${content.res.status}`);
  } else {
    record('התוכן המפורסם זמין', true, `${content.ms}ms`);
    record('מהירות התוכן', content.ms < BUDGET.content, `${content.ms}ms`, false);
    try {
      const doc = JSON.parse(content.body);
      const sections = Array.isArray(doc.sections) ? doc.sections.length : 0;
      const live = (doc.sections ?? []).filter((s) => s.enabled).length;
      record('התוכן תקין', sections > 0 && live > 0, `${sections} מקטעים, ${live} מוצגים`);
      record('פרטי קשר קיימים', Boolean(doc.contact?.whatsappNumber && doc.contact?.phoneHref),
        doc.contact?.phoneDisplay ?? 'חסר');
    } catch (error) {
      record('התוכן תקין', false, `JSON לא תקין: ${error.message}`);
    }
  }
}

/* 3. Supabase awake. Reading the published row is also what keeps it awake:
      the free tier pauses a project that sees no traffic for a week. */
if (SUPABASE && ANON) {
  const api = await timed(`${SUPABASE}/rest/v1/site_content?select=published_at&id=eq.1`, {
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}` },
  });
  const ok = Boolean(api.res?.ok);
  record('מסד הנתונים ער', ok, ok ? `${api.ms}ms` : api.error ? String(api.error) : `HTTP ${api.res?.status}`);

  // A write path that has silently stopped working is worse than a read one.
  const guard = await timed(`${SUPABASE}/rest/v1/site_content?id=eq.1`, {
    method: 'PATCH',
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({ draft: { hijacked: true } }),
  });
  // RLS filters the row out, so PostgREST reports success over zero rows.
  // Anything that actually came back means anonymous writes are getting in.
  const blocked = guard.res?.status === 401 || guard.res?.status === 403 || guard.body === '[]';
  record('כתיבה אנונימית חסומה', blocked, blocked ? 'נדחתה כמצופה' : `נענתה: ${guard.body?.slice(0, 80)}`);
}

/* Report. */
const pad = (s, n) => s + ' '.repeat(Math.max(0, n - [...s].length));
console.log(`\nבדיקת תקינות — ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}\n`);
for (const r of results) console.log(`${r.ok ? '✓' : '✗'} ${pad(r.name, 24)} ${r.detail}`);
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} עברו\n`);

if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFileSync } = await import('node:fs');
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `## בדיקת תקינות\n\n| | בדיקה | תוצאה |\n|---|---|---|\n` +
      results.map((r) => `| ${r.ok ? '✅' : '❌'} | ${r.name} | ${r.detail} |`).join('\n') +
      '\n',
  );
}

process.exit(failed ? 1 : 0);
