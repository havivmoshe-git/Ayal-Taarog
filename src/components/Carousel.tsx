import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Horizontal snap rail on phones, plain grid from `sm` up.
 *
 * A list of eight cards stacked vertically is eight screens of scrolling on a
 * phone; the same eight as a swipe rail is half a screen. That single change
 * is what stops the page reading as an endless column — and swiping is the
 * gesture people already use everywhere else on their phone.
 */

type CarouselProps = {
  children: ReactNode[];
  /** Tailwind grid classes applied from `sm` upward. */
  gridClass?: string;
  /** Card width on phones, as a CSS basis value. */
  cardWidth?: string;
  ariaLabel: string;
};

export default function Carousel({
  children,
  gridClass = 'sm:grid-cols-2 lg:grid-cols-3',
  cardWidth = '78%',
  ariaLabel,
}: CarouselProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const onScroll = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const first = rail.firstElementChild as HTMLElement | null;
    if (!first) return;
    // RTL reports scrollLeft as negative in Chromium, positive elsewhere.
    const step = first.offsetWidth + 12;
    const offset = Math.abs(rail.scrollLeft);
    setIndex(Math.round(offset / step));
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    rail.addEventListener('scroll', onScroll, { passive: true });
    return () => rail.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  const goTo = (i: number) => {
    const rail = railRef.current;
    const first = rail?.firstElementChild as HTMLElement | null;
    if (!rail || !first) return;
    const step = first.offsetWidth + 12;
    // Preserve the sign the browser uses for this writing direction.
    const dir = rail.scrollLeft <= 0 ? -1 : 1;
    rail.scrollTo({ left: dir * step * i, behavior: 'smooth' });
  };

  return (
    <div>
      <div
        ref={railRef}
        role="group"
        aria-label={ariaLabel}
        className={`-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 ${gridClass}`}
      >
        {children.map((child, i) => (
          <div
            key={i}
            className="shrink-0 snap-center sm:shrink sm:!basis-auto"
            style={{ flexBasis: cardWidth }}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Progress dots double as the affordance that tells you to swipe. */}
      <div className="mt-4 flex justify-center gap-1.5 sm:hidden">
        {children.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`מעבר לפריט ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === index ? 'w-6 bg-gold-500' : 'w-1.5 bg-navy-950/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
