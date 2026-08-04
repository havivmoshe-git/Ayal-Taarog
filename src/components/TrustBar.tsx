import { trustBar } from '../data/content';
import Reveal from './Reveal';

export default function TrustBar() {
  return (
    <section className="relative z-20 bg-navy-900 px-5 py-10 sm:px-6 md:py-12">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
        {trustBar.map((item, i) => (
          <Reveal
            key={item.label}
            delay={i * 80}
            className="border-gold-500/25 text-center md:border-l md:last:border-l-0"
          >
            <p className="font-display text-4xl font-black text-gold-400 sm:text-5xl">{item.value}</p>
            <p className="mt-1 font-display text-sm font-bold text-cream-50 sm:text-base">{item.label}</p>
            <p className="mt-0.5 text-xs text-cream-200/70 sm:text-sm">{item.note}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
