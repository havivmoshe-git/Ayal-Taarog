import { useEffect, useRef, useState } from 'react';
import { trustBar } from '../data/content';

/** Counts up to `value` once the bar scrolls into view. Non-numeric values
 *  (like the kashrut label) are rendered as-is. */
function Stat({ value }: { value: string }) {
  const target = Number(value);
  const isNumber = !Number.isNaN(target);
  const ref = useRef<HTMLParagraphElement>(null);
  const [shown, setShown] = useState(isNumber ? 0 : target);

  useEffect(() => {
    if (!isNumber) return;
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(target);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();

        const DURATION = 900;
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / DURATION);
          // Ease-out so the number settles rather than stopping dead.
          setShown(Math.round(target * (1 - Math.pow(1 - t, 3))));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isNumber, target]);

  return (
    <p
      ref={ref}
      className={`font-display text-4xl font-black text-gold-400 sm:text-5xl ${
        isNumber ? 'ltr-nums' : ''
      }`}
    >
      {isNumber ? shown : value}
    </p>
  );
}

export default function TrustBar() {
  return (
    <section className="relative z-20 bg-navy-900 px-5 py-9 sm:px-6 md:py-12">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-x-4 gap-y-7 md:grid-cols-4">
        {trustBar.map((item) => (
          <div
            key={item.label}
            className="border-gold-500/25 text-center md:border-l md:last:border-l-0"
          >
            <Stat value={item.value} />
            <p className="mt-1 font-display text-sm font-bold text-cream-50 sm:text-base">
              {item.label}
            </p>
            <p className="mt-0.5 text-xs text-cream-200/70 sm:text-sm">{item.note}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
