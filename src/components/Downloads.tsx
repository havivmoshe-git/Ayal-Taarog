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
      <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">
        {downloads.map((item, i) => {
          const href = `${import.meta.env.BASE_URL}${item.file}`;
          const isPdf = item.kind === 'pdf';
          return (
            <Reveal key={item.slug} delay={i * 80}>
              <a
                href={href}
                // `download` on a same-origin file saves it rather than navigating,
                // which is what people want for material they intend to forward.
                download
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-cream-200 bg-white transition-shadow duration-300 hover:shadow-[0_12px_32px_-12px_rgba(11,26,47,0.22)]"
              >
                <div className="aspect-[4/3] overflow-hidden bg-cream-100">
                  {isPdf ? (
                    <div className="flex size-full flex-col items-center justify-center gap-2 bg-navy-950">
                      <span className="font-display text-4xl font-black text-gold-400">PDF</span>
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

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-base font-bold text-navy-950 sm:text-lg">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-stone-600">{item.body}</p>
                  <span className="mt-4 inline-flex items-center gap-2 font-display text-sm font-bold text-gold-700">
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
