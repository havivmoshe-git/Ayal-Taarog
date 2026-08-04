import { downloads, downloadsSection } from '../data/content';
import Section from './Section';
import Reveal from './Reveal';
import { DownloadIcon } from './Icons';

export default function Downloads() {
  return (
    <Section
      id="downloads"
      eyebrow={downloadsSection.eyebrow}
      title={downloadsSection.title}
      subtitle={downloadsSection.subtitle}
      className="bg-cream-100"
    >
      {/* Two cards side by side even on a phone — they are small, and stacking
          them costs half a screen for no gain in legibility. */}
      <div className="mx-auto grid max-w-3xl grid-cols-2 gap-3 sm:gap-5">
        {downloads.map((item, i) => {
          const href = `${import.meta.env.BASE_URL}${item.file}`;
          const isPdf = item.kind === 'pdf';
          return (
            <Reveal key={item.slug} from="scale" delay={i * 80} className="h-full">
              <a
                href={href}
                // `download` on a same-origin file saves it rather than navigating,
                // which is what people want for material they intend to forward.
                download
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-cream-200 bg-white transition-shadow duration-300 hover:shadow-[0_12px_32px_-12px_rgba(11,26,47,0.22)]"
              >
                <div className="aspect-[5/4] overflow-hidden bg-cream-100 sm:aspect-[4/3]">
                  {isPdf ? (
                    <div className="flex size-full flex-col items-center justify-center gap-1 bg-navy-950">
                      <span className="font-display text-3xl font-black text-gold-400 sm:text-4xl">
                        PDF
                      </span>
                      <span className="text-xs text-cream-200/70">4 עמודים</span>
                    </div>
                  ) : (
                    <img
                      src={href}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      className="size-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                </div>

                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <h3 className="font-display text-sm font-bold text-navy-950 sm:text-lg">
                    {item.title}
                  </h3>
                  <p className="mt-1 flex-1 text-xs leading-relaxed text-stone-600 sm:mt-1.5 sm:text-sm">
                    {item.body}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1.5 font-display text-xs font-bold text-gold-700 sm:mt-4 sm:gap-2 sm:text-sm">
                    <DownloadIcon className="size-4" />
                    {item.cta}
                  </span>
                </div>
              </a>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
