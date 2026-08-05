import { useCallback, useEffect, useState } from 'react';
import type { Section, SectionType, SiteContent } from '../content/schema';
import { REPEATABLE, SECTION_LABELS } from '../content/schema';
import { isWithinSchedule } from '../content/load';
import { FORM_SPEC, NEW_SECTION_DATA } from './formSpec';
import { FieldRenderer } from './Fields';
import { isConfigured, store, type Session } from './store';

const PREVIEW_KEY = 'ayal:preview';

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    store
      .currentSession()
      .then(setSession)
      .finally(() => setChecking(false));
  }, []);

  if (checking) return <Splash>בודק התחברות…</Splash>;
  if (!session) return <Login onSignedIn={setSession} />;
  return <Editor session={session} onSignOut={() => setSession(null)} />;
}

function Splash({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-100 font-display text-navy-950">
      {children}
    </div>
  );
}

/* ── Login ────────────────────────────────────────────────────────────── */

function Login({ onSignedIn }: { onSignedIn: (s: Session) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onSignedIn(await store.signIn(email, password));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ההתחברות נכשלה');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-5">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-cream-50 p-7 shadow-2xl">
        <h1 className="text-center text-2xl font-bold">ניהול האתר</h1>
        <p className="mt-1 text-center text-sm text-stone-600">כאייל תערוג</p>

        {!isConfigured && (
          <p className="mt-5 rounded-lg bg-gold-100 p-3 text-xs leading-relaxed text-navy-950">
            הפאנל עדיין לא מחובר לשרת. אפשר להתחבר עם כל אימייל כדי להתנסות — השינויים יישמרו
            בדפדפן הזה בלבד ולא יופיעו באתר.
          </p>
        )}

        <div className="mt-5 space-y-3">
          <input
            type="email"
            required
            autoComplete="username"
            placeholder="אימייל"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full min-h-12 rounded-lg border border-cream-200 bg-white px-3 text-[15px] focus:border-gold-500 focus:outline-none"
          />
          <input
            type="password"
            required={isConfigured}
            autoComplete="current-password"
            placeholder="סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full min-h-12 rounded-lg border border-cream-200 bg-white px-3 text-[15px] focus:border-gold-500 focus:outline-none"
          />
        </div>

        {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={busy} className="btn btn-gold mt-5 w-full disabled:opacity-60">
          {busy ? 'מתחבר…' : 'כניסה'}
        </button>

        <a href="#/" className="mt-4 block text-center text-xs text-stone-500 hover:text-navy-950">
          חזרה לאתר
        </a>
      </form>
    </div>
  );
}

/* ── Editor ───────────────────────────────────────────────────────────── */

function Editor({ session, onSignOut }: { session: Session; onSignOut: () => void }) {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    store.loadDraft().then(setContent);
  }, []);

  // Autosave the draft shortly after typing stops. Losing edits to a closed
  // tab is the one failure this panel must not have.
  useEffect(() => {
    if (!content || !dirty) return;
    const t = setTimeout(async () => {
      try {
        await store.saveDraft(content);
        setDirty(false);
        setStatus('נשמר');
        setTimeout(() => setStatus(null), 1500);
      } catch (e) {
        setStatus(e instanceof Error ? e.message : 'השמירה נכשלה');
      }
    }, 900);
    return () => clearTimeout(t);
  }, [content, dirty]);

  const update = useCallback((next: SiteContent) => {
    setContent(next);
    setDirty(true);
  }, []);

  if (!content) return <Splash>טוען תוכן…</Splash>;

  const patchSection = (id: string, patch: Partial<Section>) =>
    update({
      ...content,
      sections: content.sections.map((s) => (s.id === id ? ({ ...s, ...patch } as Section) : s)),
    });

  const move = (index: number, delta: number) => {
    const to = index + delta;
    if (to < 0 || to >= content.sections.length) return;
    const sections = [...content.sections];
    const [s] = sections.splice(index, 1);
    sections.splice(to, 0, s);
    update({ ...content, sections });
  };

  const remove = (id: string) => {
    const s = content.sections.find((x) => x.id === id);
    if (!s) return;
    const label = SECTION_LABELS[s.type];
    if (!confirm(`למחוק את המקטע "${label}"?\n\nאם רק לא רוצים שיוצג — עדיף לכבות אותו במתג.`))
      return;
    update({ ...content, sections: content.sections.filter((x) => x.id !== id) });
    setEditing(null);
  };

  const add = (type: SectionType) => {
    const section = {
      id: `${type}-${Date.now().toString(36)}`,
      type,
      enabled: true,
      data: structuredClone(NEW_SECTION_DATA[type] ?? {}),
    } as Section;
    update({ ...content, sections: [...content.sections, section] });
    setAdding(false);
    setEditing(section.id);
  };

  const preview = async () => {
    await store.saveDraft(content);
    setDirty(false);
    sessionStorage.setItem(PREVIEW_KEY, JSON.stringify(content));
    window.open(`${window.location.pathname}#preview`, '_blank');
  };

  const publish = async () => {
    if (!confirm('לפרסם את השינויים? הם יופיעו באתר מיד.')) return;
    setStatus('מפרסם…');
    try {
      await store.publish(content);
      setDirty(false);
      setStatus(isConfigured ? 'פורסם! השינויים באוויר.' : 'פורסם מקומית (הפאנל לא מחובר לשרת)');
      setTimeout(() => setStatus(null), 4000);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'הפרסום נכשל');
    }
  };

  const current = content.sections.find((s) => s.id === editing);

  return (
    <div className="min-h-screen bg-cream-100 pb-24">
      <header className="sticky top-0 z-30 border-b border-cream-200 bg-cream-50/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-bold text-navy-950">ניהול האתר</p>
            <p className="truncate text-xs text-stone-500">
              {status ?? (dirty ? 'שינויים לא שמורים…' : session.email)}
            </p>
          </div>
          <button
            type="button"
            onClick={preview}
            className="min-h-10 rounded-lg border border-navy-950 px-3 text-xs font-bold text-navy-950"
          >
            תצוגה מקדימה
          </button>
          <button
            type="button"
            onClick={publish}
            className="min-h-10 rounded-lg bg-gold-500 px-4 text-xs font-bold text-navy-950"
          >
            פרסום
          </button>
        </div>
      </header>

      {!isConfigured && (
        <div className="mx-auto max-w-3xl px-4 pt-4">
          <p className="rounded-lg bg-gold-100 p-3 text-xs leading-relaxed text-navy-950">
            <strong>מצב הדגמה.</strong> הפאנל שומר בדפדפן הזה בלבד. אחרי חיבור ל-Supabase הכול
            יעבוד זהה, רק שהשינויים יגיעו לאתר.
          </p>
        </div>
      )}

      <main className="mx-auto max-w-3xl px-4 py-4">
        {current ? (
          <SectionForm
            section={current}
            onBack={() => setEditing(null)}
            onChange={(patch) => patchSection(current.id, patch)}
          />
        ) : (
          <>
            <ol className="space-y-2">
              {content.sections.map((s, i) => (
                <SectionRow
                  key={s.id}
                  section={s}
                  index={i}
                  total={content.sections.length}
                  onEdit={() => setEditing(s.id)}
                  onToggle={() => patchSection(s.id, { enabled: !s.enabled })}
                  onMove={(d) => move(i, d)}
                  onRemove={() => remove(s.id)}
                />
              ))}
            </ol>

            {adding ? (
              <div className="mt-3 rounded-xl border border-cream-200 bg-white p-3">
                <p className="mb-2 font-display text-sm font-bold">איזה מקטע להוסיף?</p>
                <div className="grid grid-cols-2 gap-2">
                  {REPEATABLE.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => add(t)}
                      className="min-h-11 rounded-lg border border-cream-200 text-sm font-bold text-navy-950 hover:border-gold-500"
                    >
                      {SECTION_LABELS[t]}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="mt-2 w-full text-xs text-stone-500"
                >
                  ביטול
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="mt-3 w-full rounded-xl border border-dashed border-stone-400 py-3 font-display text-sm font-bold text-stone-600 hover:border-gold-500 hover:text-navy-950"
              >
                + הוספת מקטע
              </button>
            )}

            <button
              type="button"
              onClick={async () => {
                await store.signOut();
                onSignOut();
              }}
              className="mt-8 w-full text-center text-xs text-stone-500"
            >
              יציאה
            </button>
          </>
        )}
      </main>
    </div>
  );
}

/* ── Section row ──────────────────────────────────────────────────────── */

function SectionRow({
  section,
  index,
  total,
  onEdit,
  onToggle,
  onMove,
  onRemove,
}: {
  section: Section;
  index: number;
  total: number;
  onEdit: () => void;
  onToggle: () => void;
  onMove: (delta: number) => void;
  onRemove: () => void;
}) {
  const scheduled = Boolean(section.schedule?.from || section.schedule?.to);
  const liveNow = section.enabled && isWithinSchedule(section.schedule);

  return (
    <li
      className={`flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 ${
        liveNow ? 'border-cream-200' : 'border-cream-200 opacity-60'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        role="switch"
        aria-checked={section.enabled}
        aria-label={section.enabled ? 'כיבוי המקטע' : 'הדלקת המקטע'}
        className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${
          section.enabled ? 'bg-gold-500' : 'bg-stone-400/40'
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${
            section.enabled ? 'right-0.5' : 'right-[18px]'
          }`}
        />
      </button>

      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-right">
        <span className="block font-display text-sm font-bold text-navy-950">
          {SECTION_LABELS[section.type]}
        </span>
        <span className="block text-xs text-stone-500">
          {!section.enabled && 'כבוי'}
          {section.enabled && scheduled && (liveNow ? 'מתוזמן · מוצג כעת' : 'מתוזמן · לא מוצג כעת')}
          {section.enabled && !scheduled && 'מוצג'}
        </span>
      </button>

      <button
        type="button"
        onClick={() => onMove(-1)}
        disabled={index === 0}
        aria-label="הזזה למעלה"
        className="size-8 shrink-0 rounded text-stone-400 disabled:opacity-25"
      >
        ↑
      </button>
      <button
        type="button"
        onClick={() => onMove(1)}
        disabled={index === total - 1}
        aria-label="הזזה למטה"
        className="size-8 shrink-0 rounded text-stone-400 disabled:opacity-25"
      >
        ↓
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label="מחיקה"
        className="size-8 shrink-0 rounded text-stone-400 hover:text-red-600"
      >
        ✕
      </button>
    </li>
  );
}

/* ── Section form ─────────────────────────────────────────────────────── */

function SectionForm({
  section,
  onBack,
  onChange,
}: {
  section: Section;
  onBack: () => void;
  onChange: (patch: Partial<Section>) => void;
}) {
  const spec = FORM_SPEC[section.type] ?? [];
  const data = section.data as Record<string, unknown>;

  return (
    <div>
      <button type="button" onClick={onBack} className="mb-3 text-sm font-bold text-stone-600">
        → חזרה לרשימה
      </button>

      <h2 className="mb-4 text-xl font-bold">{SECTION_LABELS[section.type]}</h2>

      {/* Scheduling: set once, and a holiday section takes itself down. */}
      <div className="mb-5 rounded-xl border border-cream-200 bg-white p-3">
        <p className="mb-2 font-display text-[13px] font-bold text-navy-950">
          תזמון <span className="font-normal text-stone-500">— לא חובה</span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1 block text-xs text-stone-600">הצג מתאריך</span>
            <input
              type="date"
              value={section.schedule?.from ?? ''}
              onChange={(e) =>
                onChange({ schedule: { ...section.schedule, from: e.target.value || undefined } })
              }
              className="ltr-nums w-full min-h-11 rounded-lg border border-cream-200 px-2 text-right text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs text-stone-600">הסתר אחרי</span>
            <input
              type="date"
              value={section.schedule?.to ?? ''}
              onChange={(e) =>
                onChange({ schedule: { ...section.schedule, to: e.target.value || undefined } })
              }
              className="ltr-nums w-full min-h-11 rounded-lg border border-cream-200 px-2 text-right text-sm"
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-stone-500">
          ריק = מוצג תמיד. מקטע חג שמוגדר כאן יעלה ויירד לבד.
        </p>
      </div>

      <label className="mb-5 block rounded-xl border border-cream-200 bg-white p-3">
        <span className="mb-1 block font-display text-[13px] font-bold text-navy-950">
          קישור בתפריט העליון
        </span>
        <input
          value={section.navLabel ?? ''}
          onChange={(e) => onChange({ navLabel: e.target.value || undefined })}
          placeholder="ריק = לא מופיע בתפריט"
          className="w-full min-h-11 rounded-lg border border-cream-200 px-3 text-[15px] focus:border-gold-500 focus:outline-none"
        />
      </label>

      <div className="space-y-4">
        {spec.map((field) => (
          <FieldRenderer
            key={field.key}
            field={field}
            value={data}
            onChange={(next) => onChange({ data: next } as Partial<Section>)}
          />
        ))}
      </div>

      <button type="button" onClick={onBack} className="btn btn-gold mt-6 w-full">
        סיום עריכה
      </button>
    </div>
  );
}
