import type { TestimonialsData } from '../content/schema';
import Section from './Section';
import Reveal from './Reveal';
import Carousel from './Carousel';

/**
 * What guests said.
 *
 * On a venue site this is the section that does the persuading — everything
 * else is the owner describing their own hall. So the stars are large and gold
 * rather than tasteful and grey, and the quote is set at reading size instead
 * of caption size.
 *
 * No `Review` structured data. Google treats reviews a business collects about
 * itself on its own site as self-serving and will not show them as rich
 * results, so the markup would add weight and risk for nothing.
 */

function Stars({ rating, className = '' }: { rating: number; className?: string }) {
  const filled = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return (
    <span
      className={`inline-flex gap-0.5 ${className}`}
      role="img"
      aria-label={`דירוג ${filled} מתוך 5`}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`size-[18px] ${i < filled ? 'text-gold-500' : 'text-stone-400/30'}`}
          fill="currentColor"
          aria-hidden
        >
          <path d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.21l-4.94 2.6.94-5.5-4-3.9 5.53-.8z" />
        </svg>
      ))}
    </span>
  );
}

export default function Testimonials({ data, id }: { data: TestimonialsData; id: string }) {
  const items = data.items ?? [];
  if (items.length === 0) return null;

  // Coerced rather than trusted: this document can be restored from an old
  // version or edited by hand, and a rating that arrived as a string would
  // turn the average into concatenation.
  const average = items.reduce((sum, t) => sum + (Number(t.rating) || 0), 0) / items.length;

  return (
    <Section
      id={id}
      eyebrow={data.eyebrow}
      title={data.title}
      subtitle={data.subtitle}
      className="bg-cream-50"
    >
      {/* An average needs something to average. "5.0 out of 1 review" reads as
          a boast rather than evidence and undercuts the very section it sits
          on, so the strip waits until there are three. */}
      {data.showSummary && items.length >= 3 && (
        <Reveal from="scale" className="mb-8 flex justify-center">
          <div className="flex items-center gap-4 rounded-2xl border border-gold-500/30 bg-white px-6 py-4 shadow-[0_2px_16px_-8px_rgba(11,26,47,0.12)]">
            <span className="font-display text-4xl font-bold text-navy-950 ltr-nums">
              {average.toFixed(1)}
            </span>
            <span>
              <Stars rating={average} />
              <span className="mt-1 block text-xs text-stone-600">
                {data.summaryLabel || `מתוך ${items.length} חוות דעת`}
              </span>
            </span>
          </div>
        </Reveal>
      )}

      {/* A swipe rail on a phone, a grid from `sm` up — the same shape as the
          gallery, and the reason this section costs one screen of scroll
          instead of one screen per quote. */}
      <Carousel ariaLabel={data.title} gridClass="sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <Reveal key={`${item.name}-${i}`} from="scale" delay={(i % 3) * 70} className="h-full">
            <figure className="flex h-full flex-col rounded-2xl border border-cream-200 bg-white p-5 shadow-[0_2px_16px_-8px_rgba(11,26,47,0.12)] transition-shadow duration-300 hover:shadow-[0_12px_32px_-12px_rgba(11,26,47,0.22)]">
              <Stars rating={item.rating} className="mb-3" />

              <blockquote className="flex-1 text-[15px] leading-relaxed text-navy-950">
                {/* The mark sits outside the text so it cannot be read aloud
                    as part of the quote. */}
                <span aria-hidden className="ml-1 font-display text-2xl leading-none text-gold-500">
                  ״
                </span>
                {item.quote}
              </blockquote>

              <figcaption className="mt-4 border-t border-cream-200 pt-3">
                <span className="block font-display text-sm font-bold text-navy-950">
                  {item.name}
                </span>
                {item.context && (
                  <span className="block text-xs text-stone-600">{item.context}</span>
                )}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </Carousel>
    </Section>
  );
}
