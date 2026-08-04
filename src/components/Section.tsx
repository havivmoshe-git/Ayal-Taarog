import type { ReactNode } from 'react';
import Reveal from './Reveal';

type SectionProps = {
  id?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  dark?: boolean;
};

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  dark = false,
}: Pick<SectionProps, 'eyebrow' | 'title' | 'subtitle' | 'dark'>) {
  return (
    <Reveal className="mb-10 text-center md:mb-14">
      {eyebrow && (
        <p
          className={`mb-3 font-display text-sm font-bold tracking-[0.25em] ${
            dark ? 'text-gold-300' : 'text-gold-700'
          }`}
        >
          {eyebrow}
        </p>
      )}
      {title && (
        <h2 className={`text-3xl sm:text-4xl md:text-5xl ${dark ? '!text-cream-50' : ''}`}>{title}</h2>
      )}
      <div className="rule-gold mx-auto mt-5 h-px w-24" />
      {subtitle && (
        <p
          className={`mx-auto mt-5 max-w-2xl text-base sm:text-lg ${
            dark ? 'text-cream-200' : 'text-stone-600'
          }`}
        >
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}

export default function Section({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  className = '',
  dark = false,
}: SectionProps) {
  return (
    <section id={id} className={`px-5 py-16 sm:px-6 md:py-24 ${className}`}>
      <div className="mx-auto w-full max-w-6xl">
        {(eyebrow || title || subtitle) && (
          <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} dark={dark} />
        )}
        {children}
      </div>
    </section>
  );
}
