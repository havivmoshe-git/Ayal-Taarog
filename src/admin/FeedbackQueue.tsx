import { useEffect, useMemo, useState } from 'react';
import type { Section, SectionOf, SiteContent } from '../content/schema';
import { store, type Feedback, type FeedbackStatus } from './store';

/**
 * What guests wrote, and what to do about it.
 *
 * Approving is not a rubber stamp: the quote is editable before it goes to the
 * site, because a warm three-paragraph message usually contains one sentence
 * worth publishing and the owner is the one who knows which. Nothing reaches
 * the site by itself — approving adds it to the testimonials section as an
 * ordinary content edit, which then goes through the same review-and-publish
 * as everything else, and can be undone the same way.
 *
 * The private note is never publishable from here. There is no button for it.
 */

const STATUS_TABS: { key: FeedbackStatus | 'all'; label: string }[] = [
  { key: 'pending', label: 'ממתין' },
  { key: 'approved', label: 'אושר' },
  { key: 'rejected', label: 'נדחה' },
  { key: 'all', label: 'הכול' },
];

function Stars({ n }: { n: number | null }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${n ?? 0} מתוך 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`size-4 ${i <= (n ?? 0) ? 'text-gold-500' : 'text-stone-400/30'}`}
          fill="currentColor"
          aria-hidden
        >
          <path d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.21l-4.94 2.6.94-5.5-4-3.9 5.53-.8z" />
        </svg>
      ))}
    </span>
  );
}

function when(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' }) +
    ', ' + d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

export default function FeedbackQueue({
  content,
  onChange,
  onBack,
}: {
  content: SiteContent;
  onChange: (next: SiteContent) => void;
  onBack: () => void;
}) {
  const [items, setItems] = useState<Feedback[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<FeedbackStatus | 'all'>('pending');
  const [edited, setEdited] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);

  const load = () => {
    store
      .feedback()
      .then(setItems)
      .catch((e) => setError(e instanceof Error ? e.message : 'טעינת הפידבקים נכשלה'));
  };
  useEffect(load, []);

  const testimonials = content.sections.find((s) => s.type === 'testimonials') as
    | SectionOf<'testimonials'>
    | undefined;

  const shown = useMemo(
    () => (items ?? []).filter((f) => tab === 'all' || f.status === tab),
    [items, tab],
  );
  const pendingCount = (items ?? []).filter((f) => f.status === 'pending').length;

  /** Adds the feedback to the testimonials section and marks it approved. */
  const approve = async (f: Feedback) => {
    const quote = (edited[f.id] ?? f.quote ?? '').trim();
    if (!quote) {
      setError('אין טקסט לפרסום. אפשר לכתוב אותו כאן, או לדחות.');
      return;
    }
    setBusy(f.id);
    setError(null);
    const entry = {
      name: f.name ?? '',
      context: f.context ?? '',
      quote,
      rating: f.rating ?? 5,
    };

    try {
      if (testimonials) {
        onChange({
          ...content,
          sections: content.sections.map((s) =>
            s.id === testimonials.id
              ? ({
                  ...s,
                  data: { ...testimonials.data, items: [...testimonials.data.items, entry] },
                } as Section)
              : s,
          ),
        });
      } else {
        // No feedback section yet. Creating one here rather than sending the
        // owner away to build it first: the whole point of this screen is that
        // approving is one tap, and the very first approval is exactly when
        // the section will be missing. It lands as a draft change like any
        // other, so it is reviewed before it goes anywhere.
        const section = {
          id: `testimonials-${Date.now().toString(36)}`,
          type: 'testimonials',
          enabled: true,
          data: {
            eyebrow: 'מה אומרים עלינו',
            title: 'פידבקים מהאורחים',
            subtitle: '',
            showSummary: true,
            summaryLabel: '',
            items: [entry],
          },
        } as Section;

        // Just before the enquiry form, where it does the most good: read what
        // other guests said, then make contact.
        const sections = [...content.sections];
        const formIndex = sections.findIndex((s) => s.type === 'leadForm');
        sections.splice(formIndex >= 0 ? formIndex : sections.length, 0, section);
        onChange({ ...content, sections });
      }
      await store.setFeedbackStatus(f.id, 'approved', new Date().toISOString());
      setItems((all) =>
        (all ?? []).map((x) => (x.id === f.id ? { ...x, status: 'approved' as const } : x)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'האישור נכשל');
    } finally {
      setBusy(null);
    }
  };

  const setStatus = async (f: Feedback, status: FeedbackStatus) => {
    setBusy(f.id);
    try {
      await store.setFeedbackStatus(f.id, status);
      setItems((all) => (all ?? []).map((x) => (x.id === f.id ? { ...x, status } : x)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'העדכון נכשל');
    } finally {
      setBusy(null);
    }
  };

  const remove = async (f: Feedback) => {
    if (!confirm('למחוק את הפידבק לצמיתות? גם ההערה הפרטית תימחק.')) return;
    setBusy(f.id);
    try {
      await store.deleteFeedback(f.id);
      setItems((all) => (all ?? []).filter((x) => x.id !== f.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'המחיקה נכשלה');
    } finally {
      setBusy(null);
    }
  };

  const shareUrl = `${window.location.origin}/feedback`;

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-3 flex items-center gap-1 text-sm font-bold text-stone-600 hover:text-navy-950"
      >
        → חזרה לעריכה
      </button>

      <h2 className="mb-1 text-lg font-bold">פידבקים מאורחים</h2>
      <p className="mb-3 text-xs leading-relaxed text-stone-500">
        אישור מוסיף את הפידבק למקטע הפידבקים כטיוטה — הוא יעלה לאתר רק אחרי פרסום,
        ותראו אותו קודם במסך "לפני פרסום".
        {!testimonials && ' אין עדיין מקטע פידבקים באתר — האישור הראשון ייצור אותו.'}
      </p>

      {/* The link is the whole point of the page; make it one tap to send. */}
      <div className="mb-4 rounded-xl border border-cream-200 bg-white p-3">
        <p className="mb-1.5 font-display text-[13px] font-bold text-navy-950">
          הקישור לשליחה לאורחים
        </p>
        <p dir="ltr" className="mb-2 truncate rounded-lg bg-cream-50 px-2 py-1.5 text-left text-xs text-stone-600">
          {shareUrl}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void navigator.clipboard?.writeText(shareUrl)}
            className="min-h-9 flex-1 rounded-lg border border-cream-200 text-xs font-bold text-navy-950"
          >
            העתקה
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`תודה שהתארחתם אצלנו! נשמח מאוד אם תשתפו אותנו איך הייתה השבת — זה לוקח שתי דקות:\n${shareUrl}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-9 flex-1 rounded-lg bg-navy-950 text-center text-xs font-bold leading-9 text-cream-50"
          >
            שליחה בוואטסאפ
          </a>
        </div>
      </div>

      <div className="mb-3 flex gap-1">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`min-h-9 flex-1 rounded-lg text-xs font-bold transition-colors ${
              tab === t.key ? 'bg-navy-950 text-gold-300' : 'bg-cream-100 text-stone-600'
            }`}
          >
            {t.label}
            {t.key === 'pending' && pendingCount > 0 && (
              <span className="mr-1 ltr-nums">({pendingCount})</span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 p-3 text-xs leading-relaxed text-red-700">{error}</p>
      )}

      {items === null && !error && <p className="text-sm text-stone-500">טוען…</p>}

      {items !== null && shown.length === 0 && (
        <p className="rounded-xl bg-cream-50 p-4 text-center text-sm leading-relaxed text-stone-600">
          {tab === 'pending'
            ? 'אין פידבקים שממתינים. שלחו את הקישור למעלה לאורחים שהתארחו לאחרונה.'
            : 'אין פידבקים בקטגוריה הזו.'}
        </p>
      )}

      <div className="space-y-3">
        {shown.map((f) => (
          <article
            key={f.id}
            className={`rounded-xl border p-3 ${
              f.status === 'pending' ? 'border-gold-500 bg-gold-100/30' : 'border-cream-200 bg-white'
            }`}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-display text-sm font-bold text-navy-950">{f.name || 'ללא שם'}</p>
                {f.context && <p className="text-[11px] text-stone-500">{f.context}</p>}
              </div>
              <div className="shrink-0 text-left">
                <Stars n={f.rating} />
                <p className="mt-0.5 text-[10px] text-stone-500 ltr-nums">{when(f.at)}</p>
              </div>
            </div>

            {!f.consent && (
              <p className="mb-2 rounded-lg bg-red-50 px-2 py-1.5 text-[11px] font-bold leading-relaxed text-red-700">
                האורח/ת לא אישרו פרסום. לא לפרסם בלי לבקש רשות.
              </p>
            )}

            {f.quote !== null && (
              <label className="mb-2 block">
                <span className="mb-1 block text-[11px] font-bold text-navy-950">
                  לפרסום {f.status === 'pending' && '· אפשר לערוך ולקצר'}
                </span>
                <textarea
                  value={edited[f.id] ?? f.quote ?? ''}
                  onChange={(e) => setEdited((m) => ({ ...m, [f.id]: e.target.value }))}
                  rows={3}
                  disabled={f.status !== 'pending'}
                  className="w-full rounded-lg border border-cream-200 bg-white p-2 text-[13px] leading-relaxed text-navy-950 focus:border-gold-500 focus:outline-none disabled:bg-cream-50"
                />
              </label>
            )}

            {f.privateNote && (
              // Never publishable, and shown as such. There is no control here
              // that can move this text to the site.
              <div className="mb-2 rounded-lg border border-stone-400/30 bg-cream-50 p-2">
                <p className="mb-1 text-[11px] font-bold text-stone-600">🔒 פרטי — לא יפורסם</p>
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-navy-950">
                  {f.privateNote}
                </p>
              </div>
            )}

            {f.phone && (
              <p className="mb-2 text-[12px] text-stone-600">
                טלפון:{' '}
                <a href={`tel:${f.phone}`} className="font-bold text-navy-950 underline ltr-nums">
                  {f.phone}
                </a>
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              {f.status === 'pending' ? (
                <>
                  <button
                    type="button"
                    disabled={busy === f.id}
                    onClick={() => void approve(f)}
                    className="min-h-9 flex-1 rounded-lg bg-gold-500 px-3 text-xs font-bold text-navy-950 disabled:opacity-50"
                  >
                    {busy === f.id ? '…' : 'אישור והוספה לאתר'}
                  </button>
                  <button
                    type="button"
                    disabled={busy === f.id}
                    onClick={() => void setStatus(f, 'rejected')}
                    className="min-h-9 rounded-lg border border-cream-200 px-3 text-xs font-bold text-stone-600 disabled:opacity-50"
                  >
                    דחייה
                  </button>
                </>
              ) : (
                <>
                  <span
                    className={`min-h-9 rounded-lg px-3 text-xs font-bold leading-9 ${
                      f.status === 'approved'
                        ? 'bg-cream-200 text-navy-950'
                        : 'bg-cream-100 text-stone-500'
                    }`}
                  >
                    {f.status === 'approved' ? 'אושר והתווסף' : 'נדחה'}
                  </span>
                  <button
                    type="button"
                    disabled={busy === f.id}
                    onClick={() => void setStatus(f, 'pending')}
                    className="min-h-9 rounded-lg border border-cream-200 px-3 text-xs font-bold text-stone-600 disabled:opacity-50"
                  >
                    החזרה לממתינים
                  </button>
                </>
              )}
              <button
                type="button"
                disabled={busy === f.id}
                onClick={() => void remove(f)}
                aria-label="מחיקה"
                className="min-h-9 rounded-lg px-2 text-xs font-bold text-stone-400 hover:text-red-600 disabled:opacity-50"
              >
                מחיקה
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
