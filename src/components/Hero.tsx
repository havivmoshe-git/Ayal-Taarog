import { useContact } from '../content/ContentContext';
import type { HeroData } from '../content/schema';
import { mediaUrl } from '../lib/media';
import { GENERAL_ENQUIRY, whatsappLink } from '../lib/whatsapp';
import { ArrowDownIcon, PinIcon, WhatsAppIcon } from './Icons';

/* The wide banquet shot fills a landscape screen beautifully, but `object-cover`
   on a portrait phone keeps only the centre ~30% of its width — which happens to
   be the drinks on the near table. On narrow screens we swap in a close, shallow
   depth-of-field table shot that was framed vertically to begin with. */

export default function Hero({ data, id }: { data: HeroData; id: string }) {
  const contact = useContact();

  return (
    <section id={id} className="relative flex min-h-[100svh] items-end overflow-hidden bg-navy-950">
      {/* The hero image is the one asset worth loading eagerly — it is the
          largest contentful paint and the first impression. */}
      <picture>
        <source
          media="(max-width: 640px)"
          srcSet={`${mediaUrl(data.imagePortrait, 'sm')} 600w, ${mediaUrl(data.imagePortrait, 'lg')} 1600w`}
          sizes="100vw"
        />
        <img
          src={mediaUrl(data.imageWide, 'lg')}
          srcSet={`${mediaUrl(data.imageWide, 'sm')} 600w, ${mediaUrl(data.imageWide, 'lg')} 1600w`}
          sizes="100vw"
          alt={`${data.brand} — ${data.titleAccent}`}
          fetchPriority="high"
          className="absolute inset-0 size-full object-cover"
        />
      </picture>

      {/* Three overlays: a vertical gradient for text contrast, a navy wash that
          pulls the photo toward the site palette, and a top scrim so the
          transparent header stays legible over bright ceilings and windows. */}
      <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/70 to-navy-950/40" />
      <div className="absolute inset-0 bg-navy-900/25 mix-blend-multiply" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-navy-950/80 to-transparent" />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 pt-28 sm:px-6 sm:pb-20">
        {/*
          The crest, sized to be recognised rather than read. Its inner lines
          are a few pixels tall here and the hero repeats all of them
          underneath in type meant for reading — this is a mark, and it earns
          its place by looking like one.

          A drop shadow rather than a plate behind it: the plaque already has
          its own gold edge, and a second frame would fight it. The shadow is
          what keeps that edge legible over a bright ceiling.
        */}
        {data.logo && (
          <img
            src={mediaUrl(data.logo, 'sm')}
            srcSet={`${mediaUrl(data.logo, 'sm')} 600w, ${mediaUrl(data.logo, 'lg')} 1600w`}
            sizes="(max-width: 640px) 150px, 200px"
            alt={data.logoAlt || data.brand}
            width={890}
            height={814}
            // Centred on a phone, where the column is narrow enough that it
            // reads as one composition. From `sm` up it aligns with the start
            // of the text instead — a crest floating in the middle of an
            // otherwise right-aligned block looks stranded.
            className="hero-in mx-auto mb-6 h-auto w-[150px] drop-shadow-[0_6px_20px_rgba(0,0,0,0.55)] sm:mb-8 sm:ms-0 sm:me-auto sm:w-[200px]"
          />
        )}

        <p className="hero-in mb-4 font-display text-sm font-bold tracking-[0.3em] text-gold-300">
          {data.eyebrow}
        </p>

        <div className="hero-in" style={{ animationDelay: '80ms' }}>
          <p className="font-display text-base font-semibold text-cream-200 sm:text-lg">{data.kicker}</p>
          <h1 className="mt-1 font-display text-5xl font-black !text-cream-50 sm:text-6xl md:text-7xl lg:text-8xl">
            {data.brand}
          </h1>
        </div>

        <div className="hero-in mt-6 max-w-2xl" style={{ animationDelay: '180ms' }}>
          <div className="rule-gold mb-6 h-px w-28" />
          <h2 className="font-display text-2xl font-bold !text-gold-300 sm:text-3xl md:text-4xl">
            {data.title}
          </h2>
          <p className="mt-2 font-display text-xl font-semibold text-cream-50 sm:text-2xl">
            {data.titleAccent}
          </p>
          <p className="mt-4 text-base text-cream-200 sm:text-lg">{data.subtitle}</p>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-cream-200/80 sm:text-base">
            <PinIcon className="size-4 shrink-0 text-gold-400" />
            {data.location}
          </p>
        </div>

        <div
          className="hero-in mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
          style={{ animationDelay: '280ms' }}
        >
          <a href="#contact" className="btn btn-gold w-full sm:w-auto">
            {data.ctaPrimary}
          </a>
          <a
            href={whatsappLink(contact.whatsappNumber, GENERAL_ENQUIRY)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline w-full sm:w-auto"
          >
            <WhatsAppIcon className="size-5" />
            {data.ctaSecondary}
          </a>
        </div>

        <a
          href="#contact"
          className="hero-in mt-12 hidden items-center gap-2 text-xs font-semibold tracking-widest text-cream-200/70 sm:inline-flex"
          style={{ animationDelay: '450ms' }}
        >
          <ArrowDownIcon className="size-4 animate-bounce" />
          {data.scrollHint}
        </a>
      </div>

      <a
        href={`tel:${contact.phoneHref}`}
        className="sr-only"
        aria-label={`התקשרו אלינו ${contact.phoneDisplay}`}
      >
        {contact.phoneDisplay}
      </a>
    </section>
  );
}
