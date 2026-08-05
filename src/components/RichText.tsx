import type { RichTextData } from '../content/schema';
import Section from './Section';
import Reveal from './Reveal';

/** Free-form heading and paragraphs, for anything that does not fit an
 *  existing section shape. Kept deliberately plain so it inherits the page's
 *  typography rather than inventing its own. */
export default function RichText({ data, id }: { data: RichTextData; id: string }) {
  const alignStart = data.align === 'start';

  return (
    <Section
      id={id}
      eyebrow={data.eyebrow}
      title={alignStart ? undefined : data.title}
      className="bg-cream-50"
    >
      <div className={`mx-auto max-w-3xl ${alignStart ? '' : 'text-center'}`}>
        {alignStart && (
          <Reveal from="fade">
            <h2 className="mb-5 text-2xl sm:text-3xl">{data.title}</h2>
          </Reveal>
        )}
        {data.paragraphs.map((p, i) => (
          <Reveal key={i} delay={i * 60}>
            <p className="mb-4 text-base leading-relaxed text-stone-600 last:mb-0 sm:text-lg">{p}</p>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
