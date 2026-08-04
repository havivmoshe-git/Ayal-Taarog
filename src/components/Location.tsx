import { contact } from '../data/content';
import Section from './Section';
import Reveal from './Reveal';
import { PhoneIcon, PinIcon } from './Icons';

const MAP_EMBED =
  'https://www.google.com/maps?q=%D7%94%D7%A8%D7%91%20%D7%9E%D7%9F%20%D7%94%D7%94%D7%A8%204%20%D7%94%D7%A8%20%D7%97%D7%95%D7%9E%D7%94%20%D7%99%D7%A8%D7%95%D7%A9%D7%9C%D7%99%D7%9D&hl=he&z=15&output=embed';

export default function Location() {
  return (
    <Section
      id="location"
      eyebrow="איפה אנחנו"
      title="מיקום והגעה"
      subtitle="בלב שכונת הר חומה בירושלים — כמה דקות מהכניסה לעיר ומכביש 60, עם חניה נוחה בסביבה."
      className="bg-cream-50"
    >
      <div className="grid items-stretch gap-6 lg:grid-cols-5">
        <Reveal className="lg:col-span-2">
          <div className="flex h-full flex-col justify-center rounded-2xl border border-cream-200 bg-white p-7">
            <div className="flex items-start gap-3">
              <PinIcon className="mt-1 size-6 shrink-0 text-gold-700" />
              <div>
                <h3 className="text-lg font-bold">{contact.synagogue}</h3>
                <p className="mt-1 text-stone-600">{contact.address}</p>
              </div>
            </div>

            <div className="rule-gold my-6 h-px w-full opacity-40" />

            <a
              href={`tel:${contact.phoneHref}`}
              className="flex items-center gap-3 text-navy-950 transition-colors hover:text-gold-700"
            >
              <PhoneIcon className="size-5 shrink-0 text-gold-700" />
              <span className="ltr-nums font-display text-lg font-bold">{contact.phoneDisplay}</span>
            </a>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <a
                href={contact.wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-gold flex-1 !text-sm"
              >
                ניווט ב-Waze
              </a>
              <a
                href={contact.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn flex-1 border-2 border-navy-950 !text-sm text-navy-950 hover:bg-navy-950 hover:text-cream-50"
              >
                Google Maps
              </a>
            </div>
          </div>
        </Reveal>

        <Reveal delay={100} className="lg:col-span-3">
          <div className="h-72 overflow-hidden rounded-2xl border border-cream-200 sm:h-96 lg:h-full lg:min-h-[24rem]">
            <iframe
              src={MAP_EMBED}
              title="מפת המיקום של מתחם האירוח כאייל תערוג"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="size-full border-0"
            />
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
