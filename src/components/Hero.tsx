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

      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 pt-20 sm:px-6 sm:pb-20 sm:pt-28">
        {/*
          The crest, sized from the viewport rather than fixed.

          The rest of the hero needs about 650px, and a real phone offers
          around 664px of visible page once the browser's own chrome is taken
          out. A fixed 150px crest therefore did not sit in spare room — there
          was none — it pushed the second button and the scroll hint off the
          bottom. The height here is what is genuinely left over: 100svh minus
          what the hero below needs, floored so it never shrinks to a speck and
          capped so it never dominates. On a tall screen it is 104px, on a
          short one 60px, and the page keeps the shape it had before.

          Below 620px of viewport there is no room for it at any size — the
          hero alone needs 617px — so it is hidden rather than allowed to push
          the WhatsApp button off the screen. A crest is worth less than a way
          to make contact.

          The top padding drops from 28 to 20 on a phone when the crest is
          there: that padding existed to clear the fixed header, and the crest
          now occupies part of the same band. Reclaiming it is what buys the
          mark a presentable size instead of a 36px speck.

          A drop shadow rather than a plate behind it: the plaque already has
          its own gold edge, and a second frame would fight it. The shadow is
          what keeps that edge legible over a bright ceiling.
        */}
        {data.logo && (
          <img
            src={mediaUrl(data.logo, 'sm')}
            srcSet={`${mediaUrl(data.logo, 'sm')} 600w, ${mediaUrl(data.logo, 'lg')} 1600w`}
            sizes="(max-width: 640px) 120px, 190px"
            alt={data.logoAlt || data.brand}
            width={890}
            height={814}
            className="hero-in mx-auto mb-2 [@media(max-height:620px)]:hidden h-[clamp(60px,calc(100svh-620px),104px)] w-auto drop-shadow-[0_6px_20px_rgba(0,0,0,0.55)] sm:mb-6 sm:ms-0 sm:me-auto sm:h-[clamp(72px,calc(100svh-748px),144px)]"
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
