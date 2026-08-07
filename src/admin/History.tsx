import { useEffect, useMemo, useState } from 'react';
import type { SiteContent } from '../content/schema';
import { diffContent } from './diff';
import { store, type Version } from './store';

/**
 * Every published version, and the way back to any of them.
 *
 * Undo covers the current sitting; this covers "it was fine on Tuesday".
 * Picking a version shows what restoring it would change relative to the
 * current draft before anything is touched — restoring is itself just another
 * edit, which the draft holds until it is published.
 */

const KIND_LABEL: Record<Version['kind'], string> = {
  publish: 'פורסם',
  autosave: 'שמירה אוטומטית',
  restore: 'שחזור',
};

const KIND_STYLE: Record<Version['kind'], string> = {
  publish: 'bg-gold-500 text-navy-950',
  autosave: 'bg-cream-200 text-stone-600',
  restore: 'bg-navy-950 text-cream-50',
};

function when(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const time = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return `היום, ${time}`;
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `אתמול, ${time}`;
  return `${d.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })}, ${time}`;
}

export default function History({
  draft,
  onRestore,
  onBack,
}: {
  draft: SiteContent;
  onRestore: (content: SiteContent, label: string) => void;
  onBack: () => void;
}) {
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<{ version: Version; content: SiteContent } | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  useEffect(() => {
    store
      .listVersions(60)
      .then(setVersions)
      .catch((e) => setError(e instanceof Error ? e.message : 'טעינת ההיסטוריה נכשלה'));
  }, []);

  const changes = useMemo(
    () => (picked ? diffContent(draft, picked.content) : []),
    [draft, picked],
  );

  const open = async (version: Version) => {
    setLoadingId(version.id);
    try {
      setPicked({ version, content: await store.loadVersion(version.id) });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'טעינת הגרסה נכשלה');
    } finally {
      setLoadingId(null);
    }
  };

  // Grouped by day, because "return to a particular day" is how people
  // actually remember when the site was right.
  const byDay = useMemo(() => {
    const map = new Map<string, Version[]>();
    for (const v of versions ?? []) {
      const day = new Date(v.createdAt).toLocaleDateString('he-IL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      map.set(day, [...(map.get(day) ?? []), v]);
    }
    return [...map];
  }, [versions]);

  if (picked) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setPicked(null)}
          className="mb-3 flex items-center gap-1 text-sm font-bold text-stone-600 hover:text-navy-950"
        >
          → כל הגרסאות
        </button>
        <h2 className="text-lg font-bold">{when(picked.version.createdAt)}</h2>
        <p className="mt-1 text-xs text-stone-500">
          {KIND_LABEL[picked.version.kind]}
          {picked.version.note ? ` · ${picked.version.note}` : ''}
        </p>

        {changes.length === 0 ? (
          <p className="mt-4 rounded-xl bg-cream-50 p-4 text-center text-sm text-stone-600">
            הגרסה הזו זהה למה שיש בטיוטה עכשיו.
          </p>
        ) : (
          <>
            <p className="mt-4 text-sm text-stone-600">
              שחזור יבצע {changes.length === 1 ? 'שינוי אחד' : `${changes.length} שינויים`}:
            </p>
            <ul className="mt-2 max-h-80 space-y-1 overflow-y-auto rounded-xl border border-cream-200 bg-white p-2">
              {changes.map((c) => (
                <li key={c.id} className="rounded-lg px-2 py-1.5 text-[13px] leading-relaxed text-navy-950 odd:bg-cream-50">
                  {c.summary}
                </li>
              ))}
            </ul>
          </>
        )}

        <button
          type="button"
          onClick={() =>
            onRestore(picked.content, `שוחזר ממצב ${when(picked.version.createdAt)}`)
          }
          disabled={changes.length === 0}
          className="btn btn-gold mt-5 w-full disabled:opacity-50"
        >
          שחזור הגרסה הזו לטיוטה
        </button>
        <p className="mt-2 text-center text-[11px] leading-relaxed text-stone-500">
          השחזור נכנס לטיוטה בלבד. האתר לא ישתנה עד שתפרסמו — ואפשר לבטל לפני כן.
        </p>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-3 flex items-center gap-1 text-sm font-bold text-stone-600 hover:text-navy-950"
      >
        → חזרה לעריכה
      </button>
      <h2 className="mb-1 text-lg font-bold">היסטוריית שינויים</h2>
      <p className="mb-4 text-xs leading-relaxed text-stone-500">
        כל פרסום נשמר. בחרו גרסה כדי לראות מה בדיוק היא תשנה לפני שמחזירים אותה.
      </p>

      {error && (
        <p dir="ltr" className="mb-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
          {error}
        </p>
      )}

      {versions === null && !error && <p className="text-sm text-stone-500">טוען…</p>}

      {versions?.length === 0 && (
        <p className="rounded-xl bg-cream-50 p-4 text-center text-sm text-stone-600">
          עוד אין גרסאות שמורות. הפרסום הבא ייצור את הראשונה.
        </p>
      )}

      <div className="space-y-4">
        {byDay.map(([day, list]) => (
          <div key={day}>
            <p className="mb-1.5 font-display text-[12px] font-bold text-stone-500">{day}</p>
            <ul className="space-y-1.5">
              {list.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => open(v)}
                    disabled={loadingId === v.id}
                    className="flex w-full items-center gap-2 rounded-xl border border-cream-200 bg-white px-3 py-2.5 text-right hover:border-gold-500 disabled:opacity-60"
                  >
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${KIND_STYLE[v.kind]}`}>
                      {KIND_LABEL[v.kind]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-bold text-navy-950">
                        {when(v.createdAt)}
                      </span>
                      {v.note && (
                        <span className="block truncate text-[11px] text-stone-500">{v.note}</span>
                      )}
                    </span>
                    <span className="shrink-0 text-stone-400">
                      {loadingId === v.id ? '…' : '‹'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
