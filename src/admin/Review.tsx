import { useMemo, useState } from 'react';
import type { SiteContent } from '../content/schema';
import { diffContent, groupChanges, revertChange, type Change } from './diff';

/**
 * What publishing is about to do, before it does it.
 *
 * The draft autosaves continuously, so by the time someone reaches for
 * "publish" the changes may be an hour old and half-forgotten. This lists them
 * in Hebrew, grouped by where they live, each one with its own "undo" — so a
 * single regretted edit does not cost the other twenty.
 */

const KIND_STYLE: Record<Change['kind'], string> = {
  field: 'bg-gold-100 text-navy-950',
  'section-added': 'bg-green-100 text-green-900',
  'section-removed': 'bg-red-100 text-red-900',
  'section-moved': 'bg-cream-200 text-navy-950',
  'item-added': 'bg-green-100 text-green-900',
  'item-removed': 'bg-red-100 text-red-900',
};

const KIND_LABEL: Record<Change['kind'], string> = {
  field: 'שינוי',
  'section-added': 'מקטע חדש',
  'section-removed': 'נמחק',
  'section-moved': 'סדר',
  'item-added': 'נוסף',
  'item-removed': 'נמחק',
};

export default function Review({
  draft,
  published,
  busy,
  onRevert,
  onPublish,
  onBack,
}: {
  draft: SiteContent;
  published: SiteContent | null;
  busy: boolean;
  onRevert: (next: SiteContent) => void;
  onPublish: (note: string) => void;
  onBack: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  const changes = useMemo(
    () => (published ? diffContent(published, draft) : []),
    [published, draft],
  );
  const groups = useMemo(() => groupChanges(changes), [changes]);

  const revertAll = () => {
    if (!published) return;
    if (!confirm('לבטל את כל השינויים ולחזור למה שמופיע באתר כרגע?')) return;
    onRevert(structuredClone(published));
  };

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-3 flex items-center gap-1 text-sm font-bold text-stone-600 hover:text-navy-950"
      >
        → חזרה לעריכה
      </button>

      <h2 className="text-lg font-bold">לפני פרסום</h2>

      {!published ? (
        <p className="mt-3 rounded-xl bg-gold-100 p-3 text-sm leading-relaxed text-navy-950">
          עוד לא פורסם שום דבר, אז אין למול מה להשוות. הפרסום הראשון יעלה את כל
          התוכן הקיים לאתר.
        </p>
      ) : changes.length === 0 ? (
        <p className="mt-3 rounded-xl bg-cream-50 p-4 text-center text-sm text-stone-600">
          אין שינויים. מה שבטיוטה זהה למה שמופיע באתר.
        </p>
      ) : (
        <>
          <p className="mt-1 text-sm text-stone-600">
            {changes.length === 1 ? 'שינוי אחד' : `${changes.length} שינויים`} יעלו לאתר.
          </p>

          <div className="mt-4 space-y-3">
            {groups.map((group) => (
              <div key={group.scope} className="overflow-hidden rounded-xl border border-cream-200 bg-white">
                <p className="border-b border-cream-200 bg-cream-50 px-3 py-2 font-display text-[13px] font-bold text-navy-950">
                  {group.scope}
                </p>
                <ul className="divide-y divide-cream-200">
                  {group.changes.map((change) => (
                    <li key={change.id} className="flex items-start gap-2 p-3">
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${KIND_STYLE[change.kind]}`}
                      >
                        {KIND_LABEL[change.kind]}
                      </span>
                      <span className="min-w-0 flex-1 text-[13px] leading-relaxed text-navy-950">
                        {change.summary}
                      </span>
                      <button
                        type="button"
                        onClick={() => onRevert(revertChange(draft, change))}
                        className="shrink-0 rounded-lg border border-cream-200 px-2 py-1 text-[11px] font-bold text-stone-600 hover:border-red-300 hover:text-red-600"
                      >
                        ביטול
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={revertAll}
            className="mt-3 w-full rounded-lg border border-cream-200 py-2 text-xs font-bold text-stone-600 hover:border-red-300 hover:text-red-600"
          >
            ביטול כל השינויים
          </button>
        </>
      )}

      {confirming ? (
        <div className="mt-5 rounded-xl border border-gold-500 bg-cream-50 p-3">
          <p className="text-sm font-bold text-navy-950">לפרסם עכשיו?</p>
          <p className="mt-1 text-xs leading-relaxed text-stone-600">
            השינויים יופיעו באתר תוך שניות. נשמרת גרסה, אז תמיד אפשר לחזור אחורה.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                onPublish(
                  changes.length === 0
                    ? 'פרסום ללא שינויים'
                    : `${changes.length} שינויים · ${groups.map((g) => g.scope).slice(0, 3).join(', ')}`,
                )
              }
              className="min-h-11 flex-1 rounded-lg bg-gold-500 text-sm font-bold text-navy-950 disabled:opacity-60"
            >
              {busy ? 'מפרסם…' : 'כן, פרסם'}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="min-h-11 rounded-lg border border-cream-200 px-4 text-sm font-bold text-stone-600"
            >
              ביטול
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="btn btn-gold mt-5 w-full"
        >
          פרסום לאתר
        </button>
      )}
    </div>
  );
}
