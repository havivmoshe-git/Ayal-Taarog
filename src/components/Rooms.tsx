import { useState } from 'react';
import type { RoomsData } from '../content/schema';
import { mediaUrl } from '../lib/media';
import Section from './Section';
import Reveal from './Reveal';
import Lightbox from './Lightbox';
import { ExpandIcon } from './Icons';

export default function Rooms({ data, id }: { data: RoomsData; id: string }) {
  const [planOpen, setPlanOpen] = useState(false);

  // The lightbox takes a list; the plan is a list of one.
  const plan = [
    { slug: data.planImage, category: 'docs', alt: data.planAlt, caption: data.planCta },
  ];

  return (
    <Section
      id={id}
      eyebrow={data.eyebrow}
      title={data.title}
      subtitle={data.subtitle}
      className="bg-cream-100"
    >
      <div className="grid items-start gap-8 lg:grid-cols-2">
        <div>
          <ul className="overflow-hidden rounded-2xl border border-cream-200 bg-white">
            {data.breakdown.map((row, i) => (
              <Reveal
                as="li"
                key={row.rooms + row.beds}
                from="right"
                delay={i * 60}
                className="flex items-center gap-3 border-b border-cream-200 px-4 py-3 last:border-b-0 sm:px-5 sm:py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-bold text-navy-950 sm:text-base">
                    {row.rooms}
                  </p>
                  <p className="mt-0.5 text-[13px] leading-snug text-stone-600">{row.beds}</p>
                  <p className="text-xs leading-snug text-stone-500">{row.occupancy}</p>
                </div>
                <div className="shrink-0 text-center">
                  <p className="ltr-nums font-display text-2xl font-black text-gold-700">
                    {row.people}
                  </p>
                  <p className="text-[10px] text-stone-500">נפשות</p>
                </div>
              </Reveal>
            ))}
          </ul>

          <Reveal from="scale" className="mt-3 flex items-center gap-3 rounded-2xl bg-navy-950 px-5 py-4">
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-bold text-cream-50">{data.totalLabel}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-cream-200/70">{data.totalNote}</p>
            </div>
            <p className="shrink-0 font-display text-lg font-black text-gold-400 sm:text-2xl">
              {data.totalValue}
            </p>
          </Reveal>
        </div>

        <Reveal delay={100}>
          {/* The plan is dense line art — the thumbnail is only an invitation to
              open it full-size, where it is actually readable. */}
          <button
            type="button"
            onClick={() => setPlanOpen(true)}
            className="group relative block w-full overflow-hidden rounded-2xl border border-cream-200 bg-white p-2"
            aria-label={data.planCta}
          >
            {/* Cropped to its header on phones — the thumbnail only has to say
                "this is a floorplan, tap it"; reading happens in the lightbox. */}
            <img
              src={mediaUrl(data.planImage, 'sm')}
              alt={data.planAlt}
              loading="lazy"
              decoding="async"
              className="h-56 w-full rounded-xl object-cover object-top sm:h-72 lg:h-auto"
            />
            <span className="pointer-events-none absolute inset-x-2 bottom-2 flex items-center justify-center gap-2 rounded-lg bg-navy-950/85 py-2.5 font-display text-sm font-bold text-cream-50 backdrop-blur-sm transition-colors group-hover:bg-navy-950">
              <ExpandIcon className="size-4 text-gold-400" />
              {data.planCta}
            </span>
          </button>
        </Reveal>
      </div>

      {planOpen && (
        <Lightbox images={plan} index={0} onClose={() => setPlanOpen(false)} onNavigate={() => {}} />
      )}
    </Section>
  );
}
