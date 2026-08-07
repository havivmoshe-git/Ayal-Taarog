import { useRef, useState } from 'react';
import type { Field } from './formSpec';
import { resizeForUpload } from '../lib/imageResize';
import { store } from './store';
import { mediaUrl } from '../lib/media';

/** One renderer for every field kind in formSpec. */

const input =
  'w-full min-h-11 rounded-lg border border-cream-200 bg-white px-3 py-2 text-[15px] text-navy-950 focus:border-gold-500 focus:outline-none';
const label = 'mb-1 block font-display text-[13px] font-bold text-navy-950';
const hint = 'mt-1 text-xs text-stone-500';

type Rec = Record<string, unknown>;

export function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: Rec;
  onChange: (next: Rec) => void;
}) {
  const set = (key: string, v: unknown) => onChange({ ...value, [key]: v });
  const current = value[field.key];

  switch (field.kind) {
    case 'text':
      return (
        <div>
          <label className={label}>{field.label}</label>
          <input
            className={field.ltr ? `${input} text-left` : input}
            dir={field.ltr ? 'ltr' : undefined}
            value={(current as string) ?? ''}
            onChange={(e) => set(field.key, e.target.value)}
          />
          {field.hint && <p className={hint}>{field.hint}</p>}
        </div>
      );

    case 'textarea':
      return (
        <div>
          <label className={label}>{field.label}</label>
          <textarea
            className={`${input} resize-y`}
            rows={field.rows ?? 3}
            value={(current as string) ?? ''}
            onChange={(e) => set(field.key, e.target.value)}
          />
          {field.hint && <p className={hint}>{field.hint}</p>}
        </div>
      );

    case 'number':
      return (
        <div>
          <label className={label}>{field.label}</label>
          <input
            type="number"
            inputMode="numeric"
            className={`${input} ltr-nums text-right`}
            value={(current as number) ?? 0}
            onChange={(e) => set(field.key, Number(e.target.value))}
          />
        </div>
      );

    case 'select':
      return (
        <div>
          <label className={label}>{field.label}</label>
          <select
            className={input}
            value={(current as string) ?? field.options[0].value}
            onChange={(e) => set(field.key, e.target.value)}
          >
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      );

    case 'image':
      return (
        <ImageField
          label={field.label}
          hint={field.hint}
          value={(current as string) ?? ''}
          onChange={(v) => set(field.key, v)}
        />
      );

    case 'strings':
      return (
        <StringListField
          label={field.label}
          itemLabel={field.itemLabel}
          value={(current as string[]) ?? []}
          onChange={(v) => set(field.key, v)}
        />
      );

    case 'list':
      return (
        <ListField
          field={field}
          value={(current as Rec[]) ?? []}
          onChange={(v) => set(field.key, v)}
        />
      );
  }
}

/* ── Image ────────────────────────────────────────────────────────────── */

function ImageField({
  label: text,
  hint: hintText,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      // Shrink in the browser before upload: a 6MB phone photo becomes a
      // couple of hundred KB, and the phone doing it costs nothing.
      const { large, small } = await resizeForUpload(file);
      const stamp = Date.now();
      const base = `uploads/${stamp}`;
      const lg = await store.uploadImage(`${base}-lg.webp`, large);
      await store.uploadImage(`${base}-sm.webp`, small);
      onChange(lg);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ההעלאה נכשלה');
    } finally {
      setBusy(false);
    }
  };

  const preview = value ? (/^https?:\/\//.test(value) ? value : mediaUrl(value, 'sm')) : '';

  return (
    <div>
      <label className={label}>{text}</label>
      <div className="flex items-center gap-3">
        {preview && (
          <img
            src={preview}
            alt=""
            className="size-16 shrink-0 rounded-lg border border-cream-200 object-cover"
          />
        )}
        <div className="min-w-0 flex-1">
          <input
            className={input}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="שם תמונה או כתובת"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="mt-2 rounded-lg bg-navy-950 px-3 py-1.5 text-xs font-bold text-cream-50 disabled:opacity-50"
          >
            {busy ? 'מעלה…' : 'העלאת תמונה'}
          </button>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void pick(f);
          e.target.value = '';
        }}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {hintText && <p className={hint}>{hintText}</p>}
    </div>
  );
}

/* ── Simple string list ───────────────────────────────────────────────── */

function StringListField({
  label: text,
  itemLabel,
  value,
  onChange,
}: {
  label: string;
  itemLabel: string;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div>
      <label className={label}>{text}</label>
      <div className="space-y-2">
        {value.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              className={input}
              value={item}
              onChange={(e) => {
                const next = [...value];
                next[i] = e.target.value;
                onChange(next);
              }}
            />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              aria-label="מחיקה"
              className="shrink-0 rounded-lg border border-cream-200 px-3 text-stone-500 hover:border-red-300 hover:text-red-600"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...value, ''])}
        className="mt-2 rounded-lg border border-dashed border-cream-200 px-3 py-1.5 text-xs font-bold text-stone-600"
      >
        + {itemLabel}
      </button>
    </div>
  );
}

/* ── Object list ──────────────────────────────────────────────────────── */

function ListField({
  field,
  value,
  onChange,
}: {
  field: Extract<Field, { kind: 'list' }>;
  value: Rec[];
  onChange: (v: Rec[]) => void;
}) {
  const [open, setOpen] = useState<number | null>(null);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
    setOpen(to);
  };

  const blank = (): Rec => {
    const o: Rec = {};
    for (const f of field.fields) {
      o[f.key] = f.kind === 'number' ? 0 : f.kind === 'list' || f.kind === 'strings' ? [] : '';
    }
    return o;
  };

  return (
    <div className="rounded-xl border border-cream-200 bg-cream-50 p-3">
      <label className={label}>
        {field.label} <span className="ltr-nums font-normal text-stone-500">({value.length})</span>
      </label>

      <div className="space-y-2">
        {value.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={i} className="overflow-hidden rounded-lg border border-cream-200 bg-white">
              <div className="flex items-center gap-1 px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="min-w-0 flex-1 truncate py-1.5 text-right text-[13px] font-semibold text-navy-950"
                >
                  {String(item[field.titleKey] || `${field.itemLabel} ${i + 1}`)}
                </button>
                <button
                  type="button"
                  onClick={() => move(i, i - 1)}
                  disabled={i === 0}
                  aria-label="הזזה למעלה"
                  className="size-7 shrink-0 rounded text-stone-400 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, i + 1)}
                  disabled={i === value.length - 1}
                  aria-label="הזזה למטה"
                  className="size-7 shrink-0 rounded text-stone-400 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange(value.filter((_, j) => j !== i));
                    setOpen(null);
                  }}
                  aria-label="מחיקה"
                  className="size-7 shrink-0 rounded text-stone-400 hover:text-red-600"
                >
                  ✕
                </button>
              </div>

              {isOpen && (
                <div className="space-y-3 border-t border-cream-200 p-3">
                  {field.fields.map((f) => (
                    <FieldRenderer
                      key={f.key}
                      field={f}
                      value={item}
                      onChange={(next) => {
                        const list = [...value];
                        list[i] = next;
                        onChange(list);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => {
          onChange([...value, blank()]);
          setOpen(value.length);
        }}
        className="mt-2 rounded-lg border border-dashed border-cream-200 px-3 py-1.5 text-xs font-bold text-stone-600"
      >
        + {field.itemLabel}
      </button>
    </div>
  );
}
