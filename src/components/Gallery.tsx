import { useMemo, useState } from 'react';
import { categories, galleryUrl, images, type GalleryCategory } from '../data/gallery';
import { contact, gallerySection } from '../data/content';
import Section from './Section';
import Reveal from './Reveal';
import Lightbox from './Lightbox';

export default function Gallery() {
  const [active, setActive] = useState<GalleryCategory | 'all'>('all');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const visible = useMemo(
    () => (active === 'all' ? images : images.filter((img) => img.category === active)),
    [active],
  );

  return (
    <Section
      id="gallery"
      eyebrow="גלריה"
      title={gallerySection.title}
      subtitle={gallerySection.subtitle}
      className="bg-cream-100"
    >
      <div role="tablist" aria-label="סינון גלריה" className="mb-8 flex flex-wrap justify-center gap-2">
        {categories.map((cat) => {
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

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {visible.map((img, i) => (
          <Reveal
            /* Keying on category too restarts the reveal when the filter changes,
               so newly shown tiles animate in rather than appearing abruptly. */
            key={`${active}-${img.slug}`}
            delay={Math.min(i, 5) * 45}
          >
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label={`הגדלת תמונה: ${img.caption}`}
              className="group relative block aspect-[3/2] w-full overflow-hidden rounded-xl bg-cream-200 text-right"
            >
              <img
                src={galleryUrl(img.slug, 'sm')}
                alt={img.alt}
                loading="lazy"
                decoding="async"
                width={600}
                height={400}
                className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/80 via-navy-950/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="absolute inset-x-0 bottom-0 translate-y-2 p-3 font-display text-xs font-bold text-cream-50 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:text-sm">
                {img.caption}
              </span>
            </button>
          </Reveal>
        ))}
      </div>

      <div className="mt-10 text-center">
        <a
          href={contact.catalogUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn border-2 border-navy-950 text-navy-950 hover:bg-navy-950 hover:text-cream-50"
        >
          {gallerySection.catalogCta}
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
