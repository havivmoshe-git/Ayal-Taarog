import { included } from '../data/content';
import Section from './Section';
import Reveal from './Reveal';
import Carousel from './Carousel';
import { includedIcons } from './Icons';

export default function Included() {
  return (
    <Section
      id="included"
      eyebrow="הכול במקום אחד"
      title="מה כולל האירוח"
      subtitle="לינה, סעודות, תפילות ושיעורים — בלי להזיז את האורחים בין מקומות, ובלי להתעסק בתיאומים."
      className="bg-cream-50"
    >
      <Carousel ariaLabel="מה כולל האירוח" gridClass="sm:grid-cols-2 lg:grid-cols-4">
        {included.map((item, i) => {
          const Icon = includedIcons[item.icon];
          return (
            <Reveal
              key={item.title}
              from="scale"
              delay={(i % 4) * 70}
              className="h-full"
            >
              <article className="group flex h-full flex-col rounded-2xl border border-cream-200 bg-white p-5 shadow-[0_2px_16px_-8px_rgba(11,26,47,0.12)] transition-shadow duration-300 hover:shadow-[0_12px_32px_-12px_rgba(11,26,47,0.22)]">
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-navy-950 text-gold-400 transition-colors duration-300 group-hover:bg-gold-500 group-hover:text-navy-950">
                  <Icon className="size-5" />
                </div>
                <h3 className="text-base font-bold sm:text-lg">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">{item.body}</p>
              </article>
            </Reveal>
          );
        })}
      </Carousel>
    </Section>
  );
}
