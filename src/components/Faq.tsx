import { faq } from '../data/content';
import Section from './Section';
import Reveal from './Reveal';
import { ChevronIcon } from './Icons';

export default function Faq() {
  return (
    <Section id="faq" eyebrow="לפני שפונים" title="שאלות נפוצות" className="bg-cream-100">
      <div className="mx-auto max-w-3xl space-y-3">
        {faq.map((item, i) => (
          <Reveal
            as="details"
            key={item.q}
            delay={Math.min(i, 4) * 50}
            className="group overflow-hidden rounded-xl border border-cream-200 bg-white"
          >
            {/* Native <details> keeps this keyboard- and screen-reader-friendly
                without any custom ARIA wiring. */}
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-display text-base font-bold text-navy-950 sm:text-lg [&::-webkit-details-marker]:hidden">
              {item.q}
              <ChevronIcon className="size-5 shrink-0 rotate-90 text-gold-700 transition-transform duration-300 group-open:-rotate-90" />
            </summary>
            <div className="px-5 pb-5 text-sm leading-relaxed text-stone-600 sm:text-base">{item.a}</div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
