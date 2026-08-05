import { useEffect, useRef, useState } from 'react';
import type { ImageBreakData } from '../content/schema';
import { mediaUrl } from '../lib/media';

/**
 * Full-bleed image band with one line of text, dropped between content
 * sections. Ten sections that each open with a centred heading read as one
 * undifferentiated column; a photograph that runs edge to edge resets the eye
 * and marks that a new part of the page has begun.
 *
 * The image drifts slightly against the scroll — enough to feel alive, not
 * enough to notice as an effect.
 */

export default function ImageBreak({ data, id }: { data: ImageBreakData; id: string }) {
  const { alt, line, attribution } = data;
  const ref = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const el = ref.current;
        if (!el) return;
        const { top, height } = el.getBoundingClientRect();
        // -1 when the band is entering from below, +1 when leaving above.
        const seen = (window.innerHeight - top) / (window.innerHeight + height);
        setShift((seen - 0.5) * 2 * 28);
      });
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div id={id} ref={ref} className="relative h-64 overflow-hidden bg-navy-950 sm:h-80 lg:h-96">
      <img
        src={data.imageUrl ?? mediaUrl(data.image, 'lg')}
        srcSet={`${data.imageUrl ?? mediaUrl(data.image, 'sm')} 600w, ${data.imageUrl ?? mediaUrl(data.image, 'lg')} 1600w`}
        sizes="100vw"
        alt={alt}
        loading="lazy"
        decoding="async"
        // Over-tall so the drift never exposes an edge.
        className="absolute inset-x-0 -top-[8%] h-[116%] w-full object-cover"
        style={{ transform: `translate3d(0, ${shift}px, 0)` }}
      />
      {/* Flat wash for legibility, plus a vertical gradient so the band reads
          as depth rather than as a photo behind grey glass. */}
      <div className="absolute inset-0 bg-navy-950/70" />
      <div className="absolute inset-0 bg-gradient-to-b from-navy-950/50 via-transparent to-navy-950/50" />

      <div className="relative flex h-full items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <p className="font-display text-2xl font-bold leading-snug text-cream-50 sm:text-3xl lg:text-4xl">
            {line}
          </p>
          {attribution && (
            <p className="mt-3 font-display text-xs font-bold tracking-[0.2em] text-gold-300 sm:text-sm">
              {attribution}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
