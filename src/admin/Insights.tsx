import { useEffect, useState } from 'react';
import { isConfigured, store, type Insights as Data, type LeadIntent } from './store';

/**
 * Who came, when, how far they got, and who nearly enquired.
 *
 * Deliberately answers questions rather than showing charts: "the busiest hour
 * is 21:00" is something to act on, "here is a line graph" is not. Everything
 * is computed in Postgres and arrives as one small object, so this screen is
 * usable on a phone on cellular.
 */

const RANGES = [
  { days: 7, label: '7 ימים' },
  { days: 30, label: '30 יום' },
  { days: 90, label: '3 חודשים' },
];

const CLICK_LABELS: Record<string, string> = {
  cta: 'כפתורי פעולה',
  whatsapp: 'וואטסאפ',
  phone: 'חיוג',
  waze: 'Waze',
  maps: 'Google Maps',
  download: 'הורדות',
  gallery: 'גלריה',
};

const DEVICE_LABELS: Record<string, string> = {
  mobile: 'טלפון',
  tablet: 'טאבלט',
  desktop: 'מחשב',
  unknown: 'לא ידוע',
};

function Stat({ value, label, note }: { value: string | number; label: string; note?: string }) {
  return (
    <div className="rounded-xl border border-cream-200 bg-white p-3 text-center">
      <p className="font-display text-2xl font-bold text-navy-950 ltr-nums">{value}</p>
      <p className="mt-0.5 text-[11px] font-bold text-navy-950">{label}</p>
      {note && <p className="text-[10px] leading-tight text-stone-500">{note}</p>}
    </div>
  );
}

/** A bar chart made of divs — a charting library would cost more than the
 *  whole panel, to draw twenty-four rectangles. */
function Bars({ data, format }: { data: [string, number][]; format?: (k: string) => string }) {
  const max = Math.max(1, ...data.map(([, v]) => v));
  return (
    <div className="space-y-1">
      {data.map(([key, value]) => (
        <div key={key} className="flex items-center gap-2">
          <span className="w-14 shrink-0 text-left text-[11px] text-stone-500 ltr-nums">
            {format ? format(key) : key}
          </span>
          <span className="h-4 flex-1 overflow-hidden rounded bg-cream-100">
            <span
              className="block h-full rounded bg-gold-500"
              style={{ width: `${(value / max) * 100}%` }}
            />
          </span>
          <span className="w-8 shrink-0 text-[11px] font-bold text-navy-950 ltr-nums">{value}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * A health check run from this browser, right now.
 *
 * The scheduled check in CI is the one that raises an alarm at three in the
 * morning; this one answers "is it working?" the moment someone wonders,
 * without leaving the panel to go and look at a workflow log.
 */
function Health() {
  const [checks, setChecks] = useState<{ name: string; ok: boolean; detail: string }[] | null>(null);

  const run = async () => {
    setChecks(null);
    const out: { name: string; ok: boolean; detail: string }[] = [];

    const time = async (name: string, url: string, validate?: (body: string) => string) => {
      const t = Date.now();
      try {
        const res = await fetch(url, { cache: 'no-store' });
        const ms = Date.now() - t;
        const body = validate ? await res.text() : '';
        const extra = validate ? validate(body) : '';
        out.push({ name, ok: res.ok && !extra.startsWith('!'), detail: `${ms}ms${extra ? ` · ${extra.replace(/^!/, '')}` : ''}` });
      } catch {
        out.push({ name, ok: false, detail: 'לא נענה' });
      }
    };

    await time('האתר', `${location.origin}/?health=${Date.now()}`);
    const base = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    if (base) {
      await time('התוכן המפורסם', `${base}/storage/v1/object/public/site/content.json`, (body) => {
        try {
          const doc = JSON.parse(body);
          const live = (doc.sections ?? []).filter((s: { enabled: boolean }) => s.enabled).length;
          return live > 0 ? `${live} מקטעים מוצגים` : '!אין מקטעים מוצגים';
        } catch {
          return '!התוכן פגום';
        }
      });
    }
    setChecks(out);
  };

  useEffect(() => {
    void run();
  }, []);

  return (
    <section className="rounded-xl border border-cream-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-display text-sm font-bold">תקינות עכשיו</h3>
        <button type="button" onClick={() => void run()} className="text-[11px] font-bold text-stone-500 hover:text-navy-950">
          בדיקה מחדש
        </button>
      </div>
      {checks === null ? (
        <p className="text-xs text-stone-500">בודק…</p>
      ) : (
        <ul className="space-y-1">
          {checks.map((c) => (
            <li key={c.name} className="flex items-center gap-2 text-[13px]">
              <span className={c.ok ? 'text-green-600' : 'text-red-600'}>{c.ok ? '✓' : '✗'}</span>
              <span className="flex-1 text-navy-950">{c.name}</span>
              <span className="text-[11px] text-stone-500 ltr-nums">{c.detail}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-[11px] leading-relaxed text-stone-500">
        בדיקה מלאה רצה אוטומטית כל ארבע שעות ושולחת מייל אם משהו נשבר.
      </p>
    </section>
  );
}

export default function Insights({ onBack }: { onBack: () => void }) {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Data | null>(null);
  const [leads, setLeads] = useState<LeadIntent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'stats' | 'leads'>('stats');

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    setLoading(true);
    Promise.all([store.insights(days), store.leads(100)])
      .then(([insights, intents]) => {
        if (cancelled) return;
        setData(insights);
        setLeads(intents);
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'טעינת הנתונים נכשלה'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [days]);

  const abandoned = (leads ?? []).filter((l) => !l.sent && l.filled > 0);
  const peakHour = data
    ? Object.entries(data.by_hour).sort((a, b) => b[1] - a[1])[0]
    : undefined;

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-3 flex items-center gap-1 text-sm font-bold text-stone-600 hover:text-navy-950"
      >
        → חזרה לעריכה
      </button>

      <h2 className="mb-3 text-lg font-bold">נתוני האתר</h2>

      <div className="mb-3 flex rounded-lg bg-cream-200 p-0.5">
        {(['stats', 'leads'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`min-h-9 flex-1 rounded-md text-xs font-bold transition-colors ${
              tab === t ? 'bg-white text-navy-950 shadow-sm' : 'text-stone-600'
            }`}
          >
            {t === 'stats' ? 'תנועה' : `פניות (${abandoned.length})`}
          </button>
        ))}
      </div>

      {error && (
        <p dir="ltr" className="mb-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
          {error}
        </p>
      )}

      {tab === 'stats' && (
        <>
          <div className="mb-3 flex gap-1.5">
            {RANGES.map((r) => (
              <button
                key={r.days}
                type="button"
                onClick={() => setDays(r.days)}
                className={`min-h-9 flex-1 rounded-lg text-xs font-bold transition-colors ${
                  days === r.days ? 'bg-navy-950 text-gold-300' : 'bg-cream-100 text-stone-600'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="mb-3">
            <Health />
          </div>

          {loading && <p className="text-sm text-stone-500">טוען…</p>}

          {!loading && !data && !error && (
            <p className="rounded-xl bg-gold-100 p-4 text-center text-sm leading-relaxed text-navy-950">
              {isConfigured
                ? 'לא הצלחתי לקרוא את הנתונים. ודאו שהרצתם את supabase/insights.sql.'
                : 'מדידת תנועה עובדת רק מול השרת. בפאנל המקומי אין מה להציג.'}
            </p>
          )}

          {data && data.visits === 0 && (
            <p className="rounded-xl bg-cream-50 p-4 text-center text-sm leading-relaxed text-stone-600">
              עוד אין נתונים בטווח הזה. המדידה מתחילה מהרגע שהגרסה הזו עלתה לאתר —
              תנו לה יום-יומיים.
            </p>
          )}

          {data && data.visits > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <Stat value={data.visitors} label="מבקרים" note="ייחודיים" />
                <Stat value={data.visits} label="כניסות" />
                <Stat value={data.returning} label="חזרו שוב" note="סימן להתעניינות" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Stat value={`${data.scroll_depth}%`} label="עומק גלילה" note="ממוצע" />
                <Stat value={data.form.started} label="התחילו טופס" />
                <Stat value={data.form.sent} label="שלחו" />
              </div>

              {peakHour && (
                <p className="rounded-xl bg-gold-100 p-3 text-center text-[13px] leading-relaxed text-navy-950">
                  שעת השיא היא <span className="font-bold ltr-nums">{peakHour[0]}:00</span> — זה
                  הזמן הטוב ביותר לשלוח הודעה בקבוצות ההפצה.
                </p>
              )}

              <section>
                <h3 className="mb-2 font-display text-sm font-bold">כניסות לפי שעה</h3>
                <Bars
                  data={Array.from({ length: 24 }, (_, h) => [
                    String(h),
                    data.by_hour[String(h)] ?? 0,
                  ])}
                  format={(h) => `${h.padStart(2, '0')}:00`}
                />
              </section>

              <section>
                <h3 className="mb-2 font-display text-sm font-bold">מכשירים</h3>
                <Bars
                  data={Object.entries(data.by_device)}
                  format={(k) => DEVICE_LABELS[k] ?? k}
                />
              </section>

              {data.referrers.length > 0 && (
                <section>
                  <h3 className="mb-2 font-display text-sm font-bold">מאיפה הגיעו</h3>
                  <Bars data={data.referrers.map((r) => [r.source, r.visits])} />
                </section>
              )}

              {data.sections.length > 0 && (
                <section>
                  <h3 className="mb-1 font-display text-sm font-bold">עד לאן הגיעו בעמוד</h3>
                  <p className="mb-2 text-[11px] leading-relaxed text-stone-500">
                    מקטע שרוב האנשים לא מגיעים אליו לא משכנע אף אחד. שקלו להעלות אותו למעלה.
                  </p>
                  <Bars data={data.sections.map((s) => [s.label, s.visitors])} />
                </section>
              )}

              {Object.keys(data.clicks).length > 0 && (
                <section>
                  <h3 className="mb-2 font-display text-sm font-bold">לחיצות</h3>
                  <Bars
                    data={Object.entries(data.clicks)}
                    format={(k) => CLICK_LABELS[k] ?? k}
                  />
                </section>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'leads' && (
        <div className="space-y-2">
          <p className="rounded-xl bg-cream-50 p-3 text-[12px] leading-relaxed text-stone-600">
            אנשים שמילאו את הטופס. מי שלא שלח מסומן — אלה הפניות ששוות טלפון חוזר.
            הטופס מודיע למבקרים שהפרטים נשמרים.
          </p>

          {loading && <p className="text-sm text-stone-500">טוען…</p>}
          {!loading && leads?.length === 0 && (
            <p className="rounded-xl bg-cream-50 p-4 text-center text-sm text-stone-600">
              עוד לא מילאו את הטופס.
            </p>
          )}

          {(leads ?? []).map((lead) => (
            <div
              key={lead.id}
              className={`rounded-xl border p-3 ${
                lead.sent ? 'border-cream-200 bg-white' : 'border-gold-500 bg-gold-100/40'
              }`}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="font-display text-sm font-bold text-navy-950">
                  {lead.name || 'ללא שם'}
                </span>
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    lead.sent ? 'bg-cream-200 text-stone-600' : 'bg-gold-500 text-navy-950'
                  }`}
                >
                  {lead.sent ? 'נשלח' : 'לא נשלח'}
                </span>
              </div>

              <p className="text-[11px] text-stone-500 ltr-nums">
                {new Date(lead.at).toLocaleString('he-IL', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {lead.device ? ` · ${DEVICE_LABELS[lead.device] ?? lead.device}` : ''}
              </p>

              <dl className="mt-2 space-y-0.5 text-[13px] text-navy-950">
                {lead.phone && (
                  <div className="flex gap-1">
                    <dt className="text-stone-500">טלפון:</dt>
                    <dd>
                      <a href={`tel:${lead.phone}`} className="font-bold underline ltr-nums">
                        {lead.phone}
                      </a>
                    </dd>
                  </div>
                )}
                {(lead.dateGreg || lead.dateHeb) && (
                  <div className="flex gap-1">
                    <dt className="text-stone-500">תאריך:</dt>
                    <dd className="ltr-nums">{[lead.dateGreg, lead.dateHeb].filter(Boolean).join(' · ')}</dd>
                  </div>
                )}
                {lead.guests && (
                  <div className="flex gap-1">
                    <dt className="text-stone-500">אורחים:</dt>
                    <dd>{lead.guests}</dd>
                  </div>
                )}
                {lead.kind && (
                  <div className="flex gap-1">
                    <dt className="text-stone-500">סוג:</dt>
                    <dd>{lead.kind}</dd>
                  </div>
                )}
                {lead.notes && <p className="pt-1 text-stone-600">{lead.notes}</p>}
              </dl>

              <div className="mt-2 flex gap-2">
                {lead.phone && (
                  <a
                    href={`https://wa.me/${lead.phone.replace(/\D/g, '').replace(/^0/, '972')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-9 flex-1 rounded-lg bg-navy-950 px-3 text-center text-xs font-bold leading-9 text-cream-50"
                  >
                    וואטסאפ
                  </a>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm('למחוק את הפנייה הזו?')) return;
                    await store.deleteLead(lead.id);
                    setLeads((all) => (all ?? []).filter((l) => l.id !== lead.id));
                  }}
                  className="min-h-9 rounded-lg border border-cream-200 px-3 text-xs font-bold text-stone-500 hover:text-red-600"
                >
                  מחיקה
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
