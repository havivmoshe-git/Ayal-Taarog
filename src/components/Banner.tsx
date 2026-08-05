import type { BannerData } from '../content/schema';
import Reveal from './Reveal';

/**
 * The festive strip — the section this whole content model exists for.
 *
 * It is added before a holiday, given a date window, and then takes itself
 * down. Nobody has to remember to remove it, and next year it is switched
 * back on rather than rewritten.
 */

const TONES = {
  gold: {
    wrap: 'bg-gradient-to-l from-gold-600 via-gold-500 to-gold-400',
    title: '!text-navy-950',
    body: 'text-navy-950/80',
    cta: 'bg-navy-950 text-gold-300 hover:bg-navy-900',
  },
  navy: {
    wrap: 'bg-navy-950',
    title: '!text-cream-50',
    body: 'text-cream-200/85',
    cta: 'bg-gold-500 text-navy-950 hover:bg-gold-400',
  },
  festive: {
    wrap: 'bg-gradient-to-l from-navy-950 via-navy-800 to-navy-950',
    title: '!text-gold-300',
    body: 'text-cream-200/85',
    cta: 'bg-gold-500 text-navy-950 hover:bg-gold-400',
  },
} as const;

export default function Banner({ data, id }: { data: BannerData; id: string }) {
  const tone = TONES[data.tone] ?? TONES.gold;

  return (
    <section id={id} className={`relative overflow-hidden px-5 py-8 sm:px-6 sm:py-10 ${tone.wrap}`}>
      {/* Faint repeating diamond, to read as "occasion" without shouting. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, currentColor 0 1px, transparent 1px 14px)',
        }}
      />

      <Reveal from="scale" className="relative mx-auto flex w-full max-w-4xl flex-col items-center gap-4 text-center sm:flex-row sm:text-right">
        <div className="min-w-0 flex-1">
          <h2 className={`font-display text-xl font-black leading-tight sm:text-2xl ${tone.title}`}>
            {data.title}
          </h2>
          {data.body && (
            <p className={`mt-1.5 text-sm leading-snug sm:text-base ${tone.body}`}>{data.body}</p>
          )}
        </div>

        {data.ctaLabel && data.ctaHref && (
          <a
            href={data.ctaHref}
            {...(/^https?:\/\//.test(data.ctaHref)
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {})}
            className={`btn shrink-0 !min-h-11 !px-6 !text-sm ${tone.cta}`}
          >
            {data.ctaLabel}
          </a>
        )}
      </Reveal>
    </section>
  );
}
