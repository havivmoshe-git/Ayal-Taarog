import { useMemo, useState } from 'react';
import type { GalleryData } from '../content/schema';
import { useContact } from '../content/ContentContext';
import { imageSrc } from '../lib/media';
import Section from './Section';
import Lightbox from './Lightbox';
import { ExpandIcon } from './Icons';

export default function Gallery({ data, id }: { data: GalleryData; id: string }) {
  const contact = useContact();
  const [active, setActive] = useState<string>('all');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const visible = useMemo(
    () => (active === 'all' ? data.images : data.images.filter((img) => img.category === active)),
    [active, data.images],
  );

  return (
    <Section
      id={id}
      eyebrow="גלריה"
      title={data.title}
      subtitle={data.subtitle}
      className="bg-cream-100"
    >
      <div role="tablist" aria-label="סינון גלריה" className="mb-7 flex flex-wrap justify-center gap-2">
        {data.categories.map((cat) => {
          const isActive = active === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(cat.id)}
              className={`min-h-11 rounded-full px-5 font-display text-sm font-bold transition-colors duration-200 ${
                isActive
                  ? 'bg-navy-950 text-gold-300'
                  : 'bg-white text-stone-600 hover:bg-white/70 hover:text-navy-950'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/*
        Seventeen photographs in a two-column grid is nine screens of scrolling
        on a phone. As a swipe rail it is one — and browsing pictures sideways
        is closer to how people already look at photos on a phone anyway.
        From `sm` up there is room for the grid, so it becomes one.
      */}
      <div
        key={active}
        className="fade-in -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-3"
      >
        {visible.map((img, i) => (
          <button
            key={img.slug ?? img.urlSmall ?? String(i)}
            type="button"
            onClick={() => setOpenIndex(i)}
            aria-label={`הגדלת תמונה: ${img.caption}`}
            className="group relative aspect-[4/3] shrink-0 basis-[72%] snap-center overflow-hidden rounded-xl bg-cream-200 text-right sm:aspect-[3/2] sm:basis-auto"
          >
            <img
              src={imageSrc(img, 'sm')}
              alt={img.alt}
              loading={i < 3 ? 'eager' : 'lazy'}
              decoding="async"
              width={600}
              height={400}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-navy-950/15 to-transparent" />
            <span className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 p-3 font-display text-xs font-bold text-cream-50 sm:text-sm">
              <ExpandIcon className="size-3.5 shrink-0 text-gold-400" />
              {img.caption}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-stone-500 sm:hidden">
        {data.swipeHint}
      </p>

      <div className="mt-8 text-center">
        <a
          href={contact.catalogUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn border-2 border-navy-950 text-navy-950 hover:bg-navy-950 hover:text-cream-50"
        >
          {data.catalogCta}
        </a>
      </div>

      {openIndex !== null && (
        <Lightbox
          images={visible}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onNavigate={setOpenIndex}
        />
      )}
    </Section>
  );
}
