import { useRef, useState } from 'react';
import type { GalleryData, Section, SectionOf } from '../content/schema';
import { mediaUrl } from '../lib/media';
import { resizeForUpload } from '../lib/imageResize';
import { store } from './store';

/**
 * The gallery, as a wall of pictures rather than a list of form fields.
 *
 * Photographs are the one part of this site edited by looking, not by reading:
 * the generic list editor showed seventeen collapsed rows labelled by caption,
 * which is the wrong shape for "remove that one, it is blurry". This is a
 * grid of thumbnails, several files at a time, with the caption and category
 * on the picture itself.
 */

type Img = GalleryData['images'][number];

export default function GalleryManager({
  section,
  onChange,
  onBack,
}: {
  section: SectionOf<'gallery'>;
  onChange: (patch: Partial<Section>) => void;
  onBack: () => void;
}) {
  const data = section.data;
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [filter, setFilter] = useState('all');

  const setImages = (images: Img[]) => onChange({ data: { ...data, images } } as Partial<Section>);

  const categories = data.categories.filter((c) => c.id !== 'all');

  const add = async (files: File[]) => {
    setError(null);
    setUploading({ done: 0, total: files.length });
    const added: Img[] = [];
    try {
      for (const [i, file] of files.entries()) {
        const { large, small } = await resizeForUpload(file);
        const path = `uploads/${Date.now()}-${i}`;
        const lgUrl = await store.uploadImage(`${path}-lg.webp`, large);
        await store.uploadImage(`${path}-sm.webp`, small);
        added.push({
          slug: lgUrl.replace(/-lg\.webp$/, ''),
          // A new photograph lands in whichever category is being viewed, which
          // is almost always the one the person adding it means.
          category: filter === 'all' ? (categories[0]?.id ?? '') : filter,
          caption: file.name.replace(/\.[^.]+$/, '').slice(0, 60),
          alt: '',
        });
        setUploading({ done: i + 1, total: files.length });
      }
      setImages([...data.images, ...added]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ההעלאה נכשלה');
      // Whatever did upload is kept: losing four successful uploads because
      // the fifth failed would be the worst possible response.
      if (added.length) setImages([...data.images, ...added]);
    } finally {
      setUploading(null);
    }
  };

  const remove = (index: number) => {
    const img = data.images[index];
    if (!confirm(`להסיר את "${img.caption || 'התמונה'}" מהגלריה?`)) return;
    setImages(data.images.filter((_, i) => i !== index));
    setEditing(null);
  };

  const move = (index: number, by: number) => {
    const target = index + by;
    if (target < 0 || target >= data.images.length) return;
    const next = [...data.images];
    [next[index], next[target]] = [next[target], next[index]];
    setImages(next);
    setEditing(target);
  };

  const patch = (index: number, values: Partial<Img>) =>
    setImages(data.images.map((img, i) => (i === index ? { ...img, ...values } : img)));

  const shown = data.images
    .map((img, index) => ({ img, index }))
    .filter(({ img }) => filter === 'all' || img.category === filter);

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-3 flex items-center gap-1 text-sm font-bold text-stone-600 hover:text-navy-950"
      >
        → חזרה לעריכה
      </button>

      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-bold">גלריה</h2>
        <span className="text-xs text-stone-500">{data.images.length} תמונות</span>
      </div>

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={Boolean(uploading)}
        className="w-full rounded-xl border-2 border-dashed border-stone-400 py-5 font-display text-sm font-bold text-stone-600 hover:border-gold-500 hover:text-navy-950 disabled:opacity-60"
      >
        {uploading
          ? `מעלה ${uploading.done} מתוך ${uploading.total}…`
          : '+ הוספת תמונות'}
      </button>
      <p className="mt-1.5 text-center text-[11px] text-stone-500">
        אפשר לבחור כמה תמונות יחד. הן מכווצות בטלפון לפני ההעלאה, כך שגם תמונה
        של 6MB לא תתקע את החיבור.
      </p>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          if (files.length) void add(files);
          e.target.value = '';
        }}
      />

      {error && <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-1.5">
        {data.categories.map((cat) => {
          const count =
            cat.id === 'all'
              ? data.images.length
              : data.images.filter((i) => i.category === cat.id).length;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilter(cat.id)}
              className={`min-h-9 rounded-full px-3 text-xs font-bold transition-colors ${
                filter === cat.id
                  ? 'bg-navy-950 text-gold-300'
                  : 'bg-cream-100 text-stone-600 hover:text-navy-950'
              }`}
            >
              {cat.label} <span className="opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {shown.map(({ img, index }) => (
          <button
            key={`${img.slug}-${index}`}
            type="button"
            onClick={() => setEditing(editing === index ? null : index)}
            className={`relative aspect-square overflow-hidden rounded-lg border-2 bg-cream-100 ${
              editing === index ? 'border-gold-500' : 'border-transparent'
            }`}
          >
            <img
              src={mediaUrl(img.slug, 'sm')}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
            {!img.alt && (
              // A missing alt is invisible on the site and costs real search
              // ranking, so it is flagged where the picture is, not in a report.
              <span className="absolute right-1 top-1 rounded bg-red-600 px-1 text-[9px] font-bold text-white">
                חסר תיאור
              </span>
            )}
          </button>
        ))}
      </div>

      {shown.length === 0 && (
        <p className="mt-4 rounded-xl bg-cream-50 p-4 text-center text-sm text-stone-600">
          אין תמונות בקטגוריה הזו.
        </p>
      )}

      {editing !== null && data.images[editing] && (
        <div className="mt-3 rounded-xl border border-gold-500 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-display text-sm font-bold">תמונה {editing + 1}</p>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => move(editing, -1)}
                aria-label="הזזה אחורה"
                className="size-8 rounded-lg border border-cream-200 text-stone-600"
              >
                ›
              </button>
              <button
                type="button"
                onClick={() => move(editing, 1)}
                aria-label="הזזה קדימה"
                className="size-8 rounded-lg border border-cream-200 text-stone-600"
              >
                ‹
              </button>
            </div>
          </div>

          <label className="mb-1 block text-xs font-bold text-navy-950">כיתוב</label>
          <input
            value={data.images[editing].caption}
            onChange={(e) => patch(editing, { caption: e.target.value })}
            className="mb-2 w-full min-h-11 rounded-lg border border-cream-200 px-3 text-[15px] focus:border-gold-500 focus:outline-none"
          />

          <label className="mb-1 block text-xs font-bold text-navy-950">
            תיאור לקוראי מסך ולגוגל
          </label>
          <input
            value={data.images[editing].alt}
            onChange={(e) => patch(editing, { alt: e.target.value })}
            placeholder="מה רואים בתמונה"
            className="mb-2 w-full min-h-11 rounded-lg border border-cream-200 px-3 text-[15px] focus:border-gold-500 focus:outline-none"
          />

          <label className="mb-1 block text-xs font-bold text-navy-950">קטגוריה</label>
          <select
            value={data.images[editing].category}
            onChange={(e) => patch(editing, { category: e.target.value })}
            className="mb-3 w-full min-h-11 rounded-lg border border-cream-200 px-3 text-[15px] focus:border-gold-500 focus:outline-none"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => remove(editing)}
            className="w-full rounded-lg border border-red-200 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
          >
            הסרה מהגלריה
          </button>
        </div>
      )}
    </div>
  );
}
