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
      <Reveal from="scale" className="mb-8 flex flex-wrap justify-center gap-2 sm:gap-3">
        {kosher.map((k) => (
          <div
            key={k.label}
            className="rounded-full border border-gold-500/40 bg-white px-3.5 py-2 text-center sm:px-5 sm:py-2.5"
          >
            <span className="font-display text-[11px] font-bold tracking-wider text-gold-700 sm:text-xs">
              {k.label}
            </span>
            <span className="mx-1.5 text-cream-200">·</span>
            <span className="font-display text-xs font-bold text-navy-950 sm:text-sm">{k.value}</span>
          </div>
        ))}
      </Reveal>

      <Reveal
        // Same tab pattern as the gallery filter, so the page has one
        // vocabulary. A three-column grid on phones keeps the three meals on
        // one line instead of wrapping two-and-one.
        className="mb-8 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:justify-center"
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
              className={`min-h-11 rounded-full px-2 font-display text-[13px] font-bold transition-colors duration-200 sm:px-5 sm:text-sm ${
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

          {/* Two columns even on a phone. A menu is scanned, not read line by
              line, and a single column of sixteen dishes was two full screens
              on its own — by far the tallest thing on the page. */}
          <ul className="grid grid-cols-2 gap-x-4 sm:gap-x-8">
            {meal.dishes.map((dish) => (
              <li
                key={dish.name}
                className="flex gap-2 border-b border-cream-200/70 py-2.5 sm:gap-2.5"
              >
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-gold-500" aria-hidden />
                <span className="min-w-0">
                  <span className="font-display text-[13px] font-semibold leading-snug text-navy-950 sm:text-[15px]">
                    {dish.name}
                  </span>
                  {dish.note && (
                    <span className="block text-[11px] leading-snug text-stone-600 sm:text-[13px]">
                      {dish.note}
                    </span>
                  )}
                </span>
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
        <ul className="mx-auto grid max-w-3xl gap-x-6 gap-y-2.5 sm:grid-cols-2">
          {culinaryIncluded.map((item) => (
            <li key={item} className="flex items-start gap-2 text-[13px] leading-snug text-cream-200 sm:text-base">
              <svg
                viewBox="0 0 24 24"
                className="mt-0.5 size-3.5 shrink-0 text-gold-400 sm:mt-1 sm:size-4"
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
