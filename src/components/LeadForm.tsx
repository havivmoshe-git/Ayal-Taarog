import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { LeadFormData } from '../content/schema';
import { useContact } from '../content/ContentContext';
import { buildInquiryMessage, whatsappLink, type Inquiry } from '../lib/whatsapp';
import { SectionHeading } from './Section';
import Reveal from './Reveal';
import { PhoneIcon, WhatsAppIcon } from './Icons';
import { recordLead, track } from '../lib/analytics';

const EMPTY = (firstType: string): Inquiry => ({
  name: '',
  phone: '',
  dateGregorian: '',
  dateHebrew: '',
  guests: '',
  type: firstType,
  notes: '',
});

const fieldClass =
  'w-full min-h-12 rounded-xl border border-cream-200 bg-white px-4 py-3 text-base text-navy-950 placeholder:text-stone-500/70 transition-colors focus:border-gold-500 focus:outline-none';

const labelClass = 'mb-1.5 block font-display text-sm font-bold text-navy-950';

export default function LeadForm({ data, id }: { data: LeadFormData; id: string }) {
  const contact = useContact();
  const [values, setValues] = useState<Inquiry>(() => EMPTY(data.types[0]));
  const [sent, setSent] = useState(false);
  const started = useRef(false);
  const latest = useRef(values);
  latest.current = values;
  const sentRef = useRef(false);

  const update = (key: keyof Inquiry, value: string) => {
    if (!started.current && value) {
      started.current = true;
      track('form_start');
    }
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  // Someone who filled the form in and left without sending it is the most
  // valuable visitor the site ever loses, and until now they vanished without
  // trace. The notice under the button says this is recorded — that notice is
  // what separates following up from harvesting.
  useEffect(() => {
    const report = () => {
      const v = latest.current;
      const filled = [v.name, v.phone, v.dateGregorian, v.dateHebrew, v.guests, v.notes]
        .filter((x) => x.trim()).length;
      if (!filled || sentRef.current) return;
      track('form_abandon', undefined, filled);
      recordLead({
        filled,
        sent: false,
        name: v.name.trim() || undefined,
        phone: v.phone.trim() || undefined,
        date_greg: v.dateGregorian || undefined,
        date_heb: v.dateHebrew.trim() || undefined,
        guests: v.guests.trim() || undefined,
        kind: v.type || undefined,
        notes: v.notes.trim().slice(0, 500) || undefined,
      });
    };
    window.addEventListener('pagehide', report);
    return () => window.removeEventListener('pagehide', report);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sentRef.current = true;
    track('form_submit');
    recordLead({
      filled: 6,
      sent: true,
      name: values.name.trim() || undefined,
      phone: values.phone.trim() || undefined,
      date_greg: values.dateGregorian || undefined,
      date_heb: values.dateHebrew.trim() || undefined,
      guests: values.guests.trim() || undefined,
      kind: values.type || undefined,
      notes: values.notes.trim().slice(0, 500) || undefined,
    });
    const url = whatsappLink(contact.whatsappNumber, buildInquiryMessage(values));
    window.open(url, '_blank', 'noopener,noreferrer');
    setSent(true);
  };

  return (
    <section id={id} className="bg-navy-950 px-5 py-16 sm:px-6 md:py-24">
      <div className="mx-auto w-full max-w-3xl">
        <SectionHeading eyebrow={data.eyebrow} title={data.title} subtitle={data.subtitle} dark />

        <Reveal
          as="form"
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 bg-cream-50 p-6 shadow-2xl sm:p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="name">
                {data.labels.name}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder={data.labels.namePlaceholder}
                value={values.name}
                onChange={(e) => update('name', e.target.value)}
                className={fieldClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="phone">
                {data.labels.phone ?? 'טלפון'}
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={data.labels.phonePlaceholder ?? '050-0000000'}
                value={values.phone}
                onChange={(e) => update('phone', e.target.value)}
                className={`${fieldClass} ltr-nums text-right`}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="dateGregorian">
                {data.labels.dateGregorian}
              </label>
              <input
                id="dateGregorian"
                name="dateGregorian"
                type="date"
                value={values.dateGregorian}
                onChange={(e) => update('dateGregorian', e.target.value)}
                className={`${fieldClass} ltr-nums text-right`}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="dateHebrew">
                {data.labels.dateHebrew}
              </label>
              <input
                id="dateHebrew"
                name="dateHebrew"
                type="text"
                placeholder={data.labels.dateHebrewPlaceholder}
                value={values.dateHebrew}
                onChange={(e) => update('dateHebrew', e.target.value)}
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="guests">
                {data.labels.guests}
              </label>
              <input
                id="guests"
                name="guests"
                type="number"
                inputMode="numeric"
                min={1}
                max={200}
                placeholder={data.labels.guestsPlaceholder}
                value={values.guests}
                onChange={(e) => update('guests', e.target.value)}
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="type">
                {data.labels.type}
              </label>
              <select
                id="type"
                name="type"
                value={values.type}
                onChange={(e) => update('type', e.target.value)}
                className={fieldClass}
              >
                {data.types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="notes">
                {data.labels.notes}
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder={data.labels.notesPlaceholder}
                value={values.notes}
                onChange={(e) => update('notes', e.target.value)}
                className={`${fieldClass} resize-y`}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-gold mt-7 w-full text-lg">
            <WhatsAppIcon className="size-5" />
            {data.submit}
          </button>

          <p className="mt-3 text-center text-xs text-stone-500">{data.disclaimer}</p>
          <p className="mt-1 text-center text-[11px] leading-relaxed text-stone-500">
            {data.labels.privacy ??
              'הפרטים שתמלאו כאן נשמרים אצלנו כדי שנוכל לחזור אליכם, גם אם לא תשלחו את הפנייה.'}
          </p>

          {/* Pop-up blockers and in-app browsers sometimes swallow window.open,
              so once we've tried, always offer a direct way through. */}
          {sent && (
            <div className="mt-5 rounded-xl border border-gold-500/40 bg-gold-100/50 p-4 text-center">
              <p className="font-display text-sm font-bold text-navy-950">{data.fallbackTitle}</p>
              <p className="mt-1 text-sm text-stone-600">{data.fallbackBody}</p>
              <a
                href={`tel:${contact.phoneHref}`}
                className="mt-2 inline-flex items-center gap-2 font-display text-lg font-bold text-navy-950"
              >
                <PhoneIcon className="size-5 text-gold-700" />
                <span className="ltr-nums">{contact.phoneDisplay}</span>
              </a>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
