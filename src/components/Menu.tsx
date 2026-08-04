import { useState } from 'react';
import { contact } from '../data/content';
import { culinaryIncluded, kosher, meals, menuSection } from '../data/menu';
import Section from './Section';
import Reveal from './Reveal';
import { DownloadIcon } from './Icons';

const PDF_PATH = 'docs/menu-shabbat.pdf';

export default function Menu() {
  const [active, setActive] = useState(meals[0].id);
  const meal = meals.find((m) => m.id === active) ?? meals[0];

  return (
    <Section
      id="menu"
      eyebrow={menuSection.eyebrow}
      title={menuSection.title}
      subtitle={menuSection.subtitle}
      className="bg-cream-50"
    >
      {/* Kashrut is the first thing this audience checks — it goes above the food. */}
      <Reveal className="mb-10 flex flex-wrap justify-center gap-3">
        {kosher.map((k) => (
          <div
            key={k.label}
            className="rounded-full border border-gold-500/40 bg-white px-5 py-2.5 text-center"
          >
            <span className="font-display text-xs font-bold tracking-wider text-gold-700">
              {k.label}
            </span>
            <span className="mx-2 text-cream-200">·</span>
            <span className="font-display text-sm font-bold text-navy-950">{k.value}</span>
          </div>
        ))}
      </Reveal>

      <Reveal
        // Same tab pattern as the gallery filter, so the page has one vocabulary.
        className="mb-8 flex flex-wrap justify-center gap-2"
        role="tablist"
        aria-label="בחירת סעודה"
      >
        {meals.map((m) => {
          const isActive = m.id === active;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(m.id)}
              className={`min-h-11 rounded-full px-5 font-display text-sm font-bold transition-colors duration-200 ${
                isActive
                  ? 'bg-navy-950 text-gold-300'
                  : 'bg-white text-stone-600 hover:text-navy-950'
              }`}
            >
              {m.tab}
            </button>
          );
        })}
      </Reveal>

      <div className="mx-auto max-w-3xl">
        <div key={meal.id} className="fade-in">
          <div className="mb-6 text-center">
            <h3 className="font-display text-2xl font-bold sm:text-3xl">{meal.title}</h3>
            <p className="mt-1 text-sm text-stone-600 sm:text-base">{meal.subtitle}</p>
          </div>

          <ul className="grid gap-x-8 gap-y-0 sm:grid-cols-2">
            {meal.dishes.map((dish) => (
              <li
                key={dish.name}
                className="border-b border-cream-200 py-3 last:border-b-0 sm:last:border-b"
              >
                <p className="font-display text-base font-semibold text-navy-950">{dish.name}</p>
                {dish.note && <p className="mt-0.5 text-sm text-stone-600">{dish.note}</p>}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-8 text-center text-xs leading-relaxed text-stone-500">
          {menuSection.disclaimer}
        </p>

        <div className="mt-8 text-center">
          <a
            href={`${import.meta.env.BASE_URL}${PDF_PATH}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn border-2 border-navy-950 text-navy-950 hover:bg-navy-950 hover:text-cream-50"
          >
            <DownloadIcon className="size-5" />
            {menuSection.downloadCta}
          </a>
        </div>
      </div>

      {/* What the culinary package covers, straight from the venue's flyer. */}
      <Reveal className="mt-14 rounded-2xl bg-navy-950 p-7 sm:p-9">
        <h3 className="mb-6 text-center font-display text-xl font-bold !text-cream-50 sm:text-2xl">
          מה כולל האירוח הקולינרי
        </h3>
        <ul className="mx-auto grid max-w-3xl gap-x-8 gap-y-3 sm:grid-cols-2">
          {culinaryIncluded.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-cream-200 sm:text-base">
              <svg
                viewBox="0 0 24 24"
                className="mt-1 size-4 shrink-0 text-gold-400"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="m5 12.5 4.5 4.5L19 7" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-7 text-center text-sm text-cream-200/70">
          לפרטים והזמנות:{' '}
          <a
            href={`tel:${contact.phoneHref}`}
            className="ltr-nums font-display font-bold text-gold-300"
          >
            {contact.phoneDisplay}
          </a>
        </p>
      </Reveal>
    </Section>
  );
}
