import { timeline } from '../data/content';
import Section from './Section';
import Reveal from './Reveal';

export default function ShabbatTimeline() {
  return (
    <Section
      id="shabbat"
      eyebrow="מהכניסה ועד ההבדלה"
      title="השבת אצלנו"
      subtitle="כך נראית שבת חתן במתחם — מקבלת השבת ועד המלווה מלכה."
      className="bg-navy-950"
      dark
    >
      <div className="relative mx-auto max-w-3xl">
        {/* The rail sits on the right edge in RTL, with the markers on top of it. */}
        <div className="absolute bottom-2 right-[15px] top-2 w-px bg-gradient-to-b from-transparent via-gold-500/40 to-transparent sm:right-[19px]" />

        <ol className="space-y-8">
          {timeline.map((item, i) => (
            <Reveal as="li" key={item.title} className="relative pr-12 sm:pr-16">
              <span className="absolute right-0 top-0.5 flex size-8 items-center justify-center rounded-full border border-gold-500/50 bg-navy-900 font-display text-sm font-bold text-gold-400 sm:size-10 sm:text-base">
                {i + 1}
              </span>

              <p className="font-display text-xs font-bold tracking-[0.18em] text-gold-400 sm:text-sm">
                {item.time}
              </p>
              <h3 className="mt-1 text-xl font-bold !text-cream-50 sm:text-2xl">{item.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-cream-200/85 sm:text-base">{item.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </Section>
  );
}
