import { useState } from 'react';
import { rooms } from '../data/content';
import { galleryUrl, images } from '../data/gallery';
import Section from './Section';
import Reveal from './Reveal';
import Lightbox from './Lightbox';
import { ExpandIcon } from './Icons';

const PLAN_SLUG = 'floorplan';

export default function Rooms() {
  const [planOpen, setPlanOpen] = useState(false);
  const plan = images.filter((img) => img.slug === PLAN_SLUG);

  return (
    <Section
      id="rooms"
      eyebrow={rooms.eyebrow}
      title={rooms.title}
      subtitle={rooms.subtitle}
      className="bg-cream-100"
    >
      <div className="grid items-start gap-8 lg:grid-cols-2">
        <Reveal>
          <ul className="space-y-3">
            {rooms.breakdown.map((row) => (
              <li
                key={row.rooms + row.beds}
                className="flex items-center gap-4 rounded-xl border border-cream-200 bg-white p-4 sm:p-5"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-bold text-navy-950 sm:text-lg">
                    {row.rooms}
                  </p>
                  <p className="mt-0.5 text-sm text-stone-600">{row.beds}</p>
                  <p className="mt-0.5 text-xs text-stone-500">{row.occupancy}</p>
                </div>
                <div className="shrink-0 text-center">
                  <p className="font-display text-2xl font-black text-gold-700 sm:text-3xl">
                    {row.people}
                  </p>
                  <p className="text-xs text-stone-500">נפשות</p>
                </div>
              </li>
            ))}

            <li className="flex items-center gap-4 rounded-xl bg-navy-950 p-5">
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-bold text-cream-50">{rooms.totalLabel}</p>
                <p className="mt-0.5 text-xs text-cream-200/70">{rooms.totalNote}</p>
              </div>
              <p className="shrink-0 font-display text-xl font-black text-gold-400 sm:text-2xl">
                {rooms.totalValue}
              </p>
            </li>
          </ul>
        </Reveal>

        <Reveal delay={100}>
          {/* The plan is dense line art — the thumbnail is only an invitation to
              open it full-size, where it is actually readable. */}
          <button
            type="button"
            onClick={() => setPlanOpen(true)}
            className="group relative block w-full overflow-hidden rounded-2xl border border-cream-200 bg-white p-2"
            aria-label={rooms.planCta}
          >
            <img
              src={galleryUrl(PLAN_SLUG, 'sm')}
              alt={rooms.planAlt}
              loading="lazy"
              decoding="async"
              className="w-full rounded-xl"
            />
            <span className="pointer-events-none absolute inset-x-2 bottom-2 flex items-center justify-center gap-2 rounded-lg bg-navy-950/85 py-2.5 font-display text-sm font-bold text-cream-50 backdrop-blur-sm transition-colors group-hover:bg-navy-950">
              <ExpandIcon className="size-4 text-gold-400" />
              {rooms.planCta}
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
