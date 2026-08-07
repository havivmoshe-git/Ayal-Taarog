import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Section, SectionType, SiteContent } from '../content/schema';
import { REPEATABLE, SECTION_LABELS } from '../content/schema';
import { isWithinSchedule } from '../content/load';
import { FORM_SPEC, NEW_SECTION_DATA, SITE_GROUPS } from './formSpec';
import { FieldRenderer } from './Fields';
import { useReorder } from './useReorder';
import { isConfigured, store, type Session } from './store';

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
  return <Workspace session={session} onSignOut={() => setSession(null)} />;
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
      onSignedIn(await store.signIn(email.trim(), password));
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
            הפאנל לא מחובר לשרת. אפשר להיכנס עם כל אימייל כדי להתנסות — השינויים יישמרו בדפדפן הזה
            בלבד.
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

/* ── Workspace ────────────────────────────────────────────────────────── */

type Pane = 'edit' | 'preview';

function Workspace({ session, onSignOut }: { session: Session; onSignOut: () => void }) {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editingSite, setEditingSite] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [settings, setSettings] = useState(false);
  const [pane, setPane] = useState<Pane>('edit');

  const frame = useRef<HTMLIFrameElement>(null);
  const frameReady = useRef(false);

  useEffect(() => {
    store
      .loadDraft()
      .then(setContent)
      .catch((e) => setLoadError(e instanceof Error ? e.message : 'טעינת התוכן נכשלה'));
  }, []);

  // Push every change into the preview frame, so it tracks typing live.
  const pushToPreview = useCallback((next: SiteContent, focus?: string) => {
    if (!frameReady.current) return;
    frame.current?.contentWindow?.postMessage(
      { type: 'ayal:preview', content: next, focus },
      window.location.origin,
    );
  }, []);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if ((e.data as { type?: string })?.type === 'ayal:preview-ready') {
        frameReady.current = true;
        if (content) pushToPreview(content);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [content, pushToPreview]);

  // Autosave shortly after typing stops — losing edits to a closed tab is the
  // one failure this panel must not have.
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

  const update = useCallback(
    (next: SiteContent) => {
      setContent(next);
      setDirty(true);
      pushToPreview(next);
    },
    [pushToPreview],
  );

  // Drag-and-drop reports indices, not identity, and the callback outlives any
  // one render — so read the current document from a ref rather than closing
  // over it, and keep the state updater itself free of side effects.
  const latest = useRef<SiteContent | null>(null);
  latest.current = content;

  const moveSection = useCallback(
    (from: number, to: number) => {
      const c = latest.current;
      if (!c) return;
      const sections = [...c.sections];
      const [s] = sections.splice(from, 1);
      sections.splice(to, 0, s);
      update({ ...c, sections });
    },
    [update],
  );

  // Point the preview at whatever is open in the editor — when a section is
  // picked, and when a phone switches to the preview tab. Not on every
  // keystroke: that would yank the page away from someone scrolling it.
  useEffect(() => {
    if (editing && latest.current) pushToPreview(latest.current, editing);
  }, [editing, pane, pushToPreview]);

  const sectionCount = content?.sections.length ?? 0;
  const reorder = useReorder(sectionCount, moveSection);

  const previewSrc = useMemo(() => `${window.location.pathname}#preview`, []);

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-100 px-6">
        <div className="max-w-sm text-center">
          <h2 className="text-lg font-bold">לא הצלחתי לטעון את התוכן</h2>
          <p dir="ltr" className="mt-2 break-words rounded-lg bg-white p-3 text-xs text-stone-600">
            {loadError}
          </p>
          <button type="button" onClick={() => window.location.reload()} className="btn btn-gold mt-5">
            ניסיון נוסף
          </button>
        </div>
      </div>
    );
  }

  if (!content) return <Splash>טוען תוכן…</Splash>;

  const patchSection = (id: string, patch: Partial<Section>) =>
    update({
      ...content,
      sections: content.sections.map((s) => (s.id === id ? ({ ...s, ...patch } as Section) : s)),
    });

  const remove = (id: string) => {
    const s = content.sections.find((x) => x.id === id);
    if (!s) return;
    if (!confirm(`למחוק את "${SECTION_LABELS[s.type]}"?\n\nאם רק לא רוצים שיוצג — עדיף לכבות במתג.`))
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

  const publish = async () => {
    if (!confirm('לפרסם את השינויים? הם יופיעו באתר מיד.')) return;
    setStatus('מפרסם…');
    try {
      await store.publish(content);
      setDirty(false);
      setStatus(isConfigured ? 'פורסם! השינויים באוויר' : 'פורסם מקומית (לא מחובר לשרת)');
      setTimeout(() => setStatus(null), 4000);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'הפרסום נכשל');
    }
  };

  const current = content.sections.find((s) => s.id === editing);

  return (
    <div className="h-screen overflow-hidden bg-cream-100">
      <header className="flex h-14 items-center gap-2 border-b border-cream-200 bg-cream-50 px-3">
        <button
          type="button"
          onClick={() => setSettings(true)}
          aria-label="הגדרות"
          className="flex size-10 shrink-0 items-center justify-center rounded-lg text-navy-950 hover:bg-cream-100"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
          </svg>
        </button>

        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-bold text-navy-950">ניהול האתר</p>
          <p className="truncate text-[11px] text-stone-500">
            {status ?? (dirty ? 'שומר…' : 'הכול שמור')}
          </p>
        </div>

        {/* On a phone there is room for one pane at a time. */}
        <div className="flex shrink-0 rounded-lg bg-cream-200 p-0.5 lg:hidden">
          {(['edit', 'preview'] as Pane[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPane(p)}
              className={`min-h-9 rounded-md px-3 text-xs font-bold transition-colors ${
                pane === p ? 'bg-white text-navy-950 shadow-sm' : 'text-stone-600'
              }`}
            >
              {p === 'edit' ? 'עריכה' : 'תצוגה'}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={publish}
          className="min-h-10 shrink-0 rounded-lg bg-gold-500 px-4 text-sm font-bold text-navy-950 active:scale-95"
        >
          פרסום
        </button>
      </header>

      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Editor */}
        <div
          className={`w-full overflow-y-auto lg:w-[440px] lg:shrink-0 lg:border-l lg:border-cream-200 ${
            pane === 'edit' ? '' : 'hidden lg:block'
          }`}
        >
          <div className="p-3">
            {editingSite ? (
              <SiteForm
                content={content}
                onBack={() => setEditingSite(false)}
                onChange={(patch) => update({ ...content, ...patch })}
              />
            ) : current ? (
              <SectionForm
                section={current}
                onBack={() => setEditing(null)}
                onChange={(patch) => patchSection(current.id, patch)}
              />
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setEditingSite(true)}
                  className="mb-3 flex w-full items-center gap-2 rounded-xl border border-cream-200 bg-white px-3 py-3 text-right hover:border-gold-500"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cream-100 text-base">
                    ☎
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-sm font-bold text-navy-950">
                      פרטי קשר והגדרות האתר
                    </span>
                    <span className="block text-[11px] text-stone-500">
                      טלפון, כתובת, מפה, כותרת תחתונה, כותרת בגוגל
                    </span>
                  </span>
                  <span className="shrink-0 text-stone-400">‹</span>
                </button>

                <ol className="space-y-1.5">
                  {content.sections.map((s, i) => (
                    <SectionRow
                      key={s.id}
                      ref={reorder.setRow(i)}
                      section={s}
                      isDragging={reorder.dragging === i}
                      isTarget={reorder.dragging !== null && reorder.over === i}
                      onDragStart={reorder.start(i)}
                      onEdit={() => setEditing(s.id)}
                      onToggle={() => patchSection(s.id, { enabled: !s.enabled })}
                      onRemove={() => remove(s.id)}
                    />
                  ))}
                </ol>

                {adding ? (
                  <div className="mt-2 rounded-xl border border-cream-200 bg-white p-3">
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
                    className="mt-2 w-full rounded-xl border border-dashed border-stone-400 py-3 font-display text-sm font-bold text-stone-600 hover:border-gold-500 hover:text-navy-950"
                  >
                    + הוספת מקטע
                  </button>
                )}

                <p className="mt-4 text-center text-[11px] leading-relaxed text-stone-500">
                  גררו מהידית <span className="font-bold">⠿</span> כדי לשנות סדר · המתג מכבה מקטע
                  בלי למחוק אותו
                </p>
              </>
            )}
          </div>
        </div>

        {/* Live preview */}
        <div className={`flex-1 bg-stone-500/10 ${pane === 'preview' ? '' : 'hidden lg:block'}`}>
          <iframe
            ref={frame}
            src={previewSrc}
            title="תצוגה מקדימה חיה"
            className="size-full border-0 bg-white"
          />
        </div>
      </div>

      {settings && (
        <SettingsSheet
          email={session.email}
          onClose={() => setSettings(false)}
          onSignOut={async () => {
            await store.signOut();
            onSignOut();
          }}
        />
      )}
    </div>
  );
}

/* ── Section row ──────────────────────────────────────────────────────── */

const SectionRow = ({
  ref,
  section,
  isDragging,
  isTarget,
  onDragStart,
  onEdit,
  onToggle,
  onRemove,
}: {
  ref: (el: HTMLElement | null) => void;
  section: Section;
  isDragging: boolean;
  isTarget: boolean;
  onDragStart: (e: React.PointerEvent) => void;
  onEdit: () => void;
  onToggle: () => void;
  onRemove: () => void;
}) => {
  const scheduled = Boolean(section.schedule?.from || section.schedule?.to);
  const liveNow = section.enabled && isWithinSchedule(section.schedule);

  return (
    <li
      ref={ref}
      className={`flex items-center gap-1 rounded-xl border bg-white px-1.5 py-2 transition-all ${
        isDragging ? 'opacity-40' : ''
      } ${isTarget && !isDragging ? 'border-gold-500 shadow-md' : 'border-cream-200'} ${
        liveNow ? '' : 'opacity-60'
      }`}
    >
      <button
        type="button"
        onPointerDown={onDragStart}
        aria-label="גרירה לשינוי סדר"
        className="flex size-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-stone-400 hover:bg-cream-100 active:cursor-grabbing"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
          <circle cx="9" cy="6" r="1.6" /><circle cx="15" cy="6" r="1.6" />
          <circle cx="9" cy="12" r="1.6" /><circle cx="15" cy="12" r="1.6" />
          <circle cx="9" cy="18" r="1.6" /><circle cx="15" cy="18" r="1.6" />
        </svg>
      </button>

      <button type="button" onClick={onEdit} className="min-w-0 flex-1 py-1 text-right">
        <span className="block font-display text-sm font-bold text-navy-950">
          {SECTION_LABELS[section.type]}
        </span>
        <span className="block text-[11px] text-stone-500">
          {!section.enabled
            ? 'כבוי'
            : scheduled
              ? liveNow
                ? 'מתוזמן · מוצג כעת'
                : 'מתוזמן · לא מוצג כעת'
              : 'מוצג'}
        </span>
      </button>

      <button
        type="button"
        onClick={onToggle}
        role="switch"
        aria-checked={section.enabled}
        aria-label={section.enabled ? 'כיבוי' : 'הדלקה'}
        className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${
          section.enabled ? 'bg-gold-500' : 'bg-stone-400/40'
        }`}
      >
        {/* In an RTL panel the switch travels the other way: off sits at the
            start of the track (right), on at the end (left). */}
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${
            section.enabled ? 'left-0.5' : 'right-0.5'
          }`}
        />
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
};

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
  const [showAdvanced, setShowAdvanced] = useState(
    Boolean(section.schedule?.from || section.schedule?.to || section.navLabel),
  );

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-3 flex items-center gap-1 text-sm font-bold text-stone-600 hover:text-navy-950"
      >
        → כל המקטעים
      </button>

      <h2 className="mb-4 text-lg font-bold">{SECTION_LABELS[section.type]}</h2>

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

      {/* Scheduling and nav are secondary — folded away so the common case
          (changing words) is not buried under settings. */}
      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="mt-5 flex w-full items-center justify-between rounded-lg bg-cream-50 px-3 py-2.5 text-[13px] font-bold text-navy-950"
      >
        תזמון וקישור בתפריט
        <span className="text-stone-400">{showAdvanced ? '−' : '+'}</span>
      </button>

      {showAdvanced && (
        <div className="mt-2 space-y-3 rounded-xl border border-cream-200 bg-white p-3">
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
          <p className="text-xs text-stone-500">
            ריק = מוצג תמיד. מקטע חג שמוגדר כאן יעלה ויירד לבד.
          </p>

          <label className="block">
            <span className="mb-1 block text-xs text-stone-600">קישור בתפריט העליון</span>
            <input
              value={section.navLabel ?? ''}
              onChange={(e) => onChange({ navLabel: e.target.value || undefined })}
              placeholder="ריק = לא מופיע בתפריט"
              className="w-full min-h-11 rounded-lg border border-cream-200 px-3 text-[15px] focus:border-gold-500 focus:outline-none"
            />
          </label>
        </div>
      )}

      <button type="button" onClick={onBack} className="btn btn-gold mt-5 w-full">
        סיום
      </button>
    </div>
  );
}

/* ── Site-wide form ───────────────────────────────────────────────────── */

/**
 * Contact details, footer and page title. These belong to no section, so
 * without this screen they would be the one part of the site still needing a
 * developer — which defeats the point of the panel.
 */
function SiteForm({
  content,
  onBack,
  onChange,
}: {
  content: SiteContent;
  onBack: () => void;
  onChange: (patch: Partial<SiteContent>) => void;
}) {
  const [open, setOpen] = useState<string>(SITE_GROUPS[0].key);

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-3 flex items-center gap-1 text-sm font-bold text-stone-600 hover:text-navy-950"
      >
        → כל המקטעים
      </button>

      <h2 className="mb-4 text-lg font-bold">פרטי קשר והגדרות האתר</h2>

      <div className="space-y-2">
        {SITE_GROUPS.map((group) => {
          const isOpen = open === group.key;
          const values = content[group.key] as unknown as Record<string, unknown>;
          return (
            <div key={group.key} className="overflow-hidden rounded-xl border border-cream-200 bg-white">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? '' : group.key)}
                className="flex w-full items-center justify-between px-3 py-3 text-right font-display text-sm font-bold text-navy-950"
              >
                {group.label}
                <span className="text-stone-400">{isOpen ? '−' : '+'}</span>
              </button>
              {isOpen && (
                <div className="space-y-4 border-t border-cream-200 p-3">
                  {group.fields.map((field) => (
                    <FieldRenderer
                      key={field.key}
                      field={field}
                      value={values}
                      onChange={(next) =>
                        onChange({ [group.key]: next } as unknown as Partial<SiteContent>)
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-stone-500">
        שינוי הטלפון או הוואטסאפ כאן משנה אותם בכל מקום באתר — בכפתורים, בסרגל התחתון ובכותרת התחתונה.
      </p>

      <button type="button" onClick={onBack} className="btn btn-gold mt-5 w-full">
        סיום
      </button>
    </div>
  );
}

/* ── Settings ─────────────────────────────────────────────────────────── */

function SettingsSheet({
  email,
  onClose,
  onSignOut,
}: {
  email: string;
  onClose: () => void;
  onSignOut: () => void;
}) {
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const change = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return setMsg('הסיסמה צריכה להיות באורך 8 תווים לפחות');
    if (pw !== pw2) return setMsg('הסיסמאות אינן תואמות');
    setBusy(true);
    setMsg(null);
    try {
      await store.changePassword(pw);
      setPw('');
      setPw2('');
      setMsg(isConfigured ? 'הסיסמה הוחלפה' : 'לא מחובר לשרת — אין מה להחליף');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'החלפת הסיסמה נכשלה');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-navy-950/50 sm:items-center sm:justify-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-cream-50 p-5 sm:max-w-md sm:rounded-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">הגדרות</h2>
          <button type="button" onClick={onClose} aria-label="סגירה" className="size-9 text-stone-500">
            ✕
          </button>
        </div>

        <p className="mb-5 text-sm text-stone-600">
          מחובר כ־<span className="font-bold text-navy-950">{email}</span>
        </p>

        <form onSubmit={change} className="rounded-xl border border-cream-200 bg-white p-4">
          <p className="mb-3 font-display text-sm font-bold">החלפת סיסמה</p>
          <div className="space-y-2">
            <input
              type="password"
              autoComplete="new-password"
              placeholder="סיסמה חדשה"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="w-full min-h-11 rounded-lg border border-cream-200 px-3 text-[15px] focus:border-gold-500 focus:outline-none"
            />
            <input
              type="password"
              autoComplete="new-password"
              placeholder="שוב, לאימות"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
              className="w-full min-h-11 rounded-lg border border-cream-200 px-3 text-[15px] focus:border-gold-500 focus:outline-none"
            />
          </div>
          {msg && <p className="mt-2 text-xs text-navy-950">{msg}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-3 w-full rounded-lg bg-navy-950 py-2.5 text-sm font-bold text-cream-50 disabled:opacity-50"
          >
            {busy ? 'מחליף…' : 'החלפת סיסמה'}
          </button>
        </form>

        <a
          href="#/"
          className="mt-4 block rounded-lg border border-cream-200 py-2.5 text-center text-sm font-bold text-navy-950"
        >
          פתיחת האתר
        </a>

        <button
          type="button"
          onClick={onSignOut}
          className="mt-2 w-full py-2.5 text-center text-sm text-stone-500 hover:text-red-600"
        >
          יציאה
        </button>
      </div>
    </div>
  );
}
