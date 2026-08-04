import { useState, type FormEvent } from 'react';
import { contact, leadForm } from '../data/content';
import { buildInquiryMessage, whatsappLink, type Inquiry } from '../lib/whatsapp';
import { SectionHeading } from './Section';
import Reveal from './Reveal';
import { PhoneIcon, WhatsAppIcon } from './Icons';

const EMPTY: Inquiry = {
  name: '',
  dateGregorian: '',
  dateHebrew: '',
  guests: '',
  type: leadForm.types[0],
  notes: '',
};

const fieldClass =
  'w-full min-h-12 rounded-xl border border-cream-200 bg-white px-4 py-3 text-base text-navy-950 placeholder:text-stone-500/70 transition-colors focus:border-gold-500 focus:outline-none';

const labelClass = 'mb-1.5 block font-display text-sm font-bold text-navy-950';

export default function LeadForm() {
  const [values, setValues] = useState<Inquiry>(EMPTY);
  const [sent, setSent] = useState(false);

  const update = (key: keyof Inquiry, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const url = whatsappLink(buildInquiryMessage(values));
    window.open(url, '_blank', 'noopener,noreferrer');
    setSent(true);
  };

  return (
    <section id="contact" className="bg-navy-950 px-5 py-16 sm:px-6 md:py-24">
      <div className="mx-auto w-full max-w-3xl">
        <SectionHeading eyebrow="יצירת קשר" title={leadForm.title} subtitle={leadForm.subtitle} dark />

        <Reveal
          as="form"
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 bg-cream-50 p-6 shadow-2xl sm:p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="name">
                {leadForm.fields.name}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder={leadForm.fields.namePlaceholder}
                value={values.name}
                onChange={(e) => update('name', e.target.value)}
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="dateGregorian">
                {leadForm.fields.dateGregorian}
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
                {leadForm.fields.dateHebrew}
              </label>
              <input
                id="dateHebrew"
                name="dateHebrew"
                type="text"
                placeholder={leadForm.fields.dateHebrewPlaceholder}
                value={values.dateHebrew}
                onChange={(e) => update('dateHebrew', e.target.value)}
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="guests">
                {leadForm.fields.guests}
              </label>
              <input
                id="guests"
                name="guests"
                type="number"
                inputMode="numeric"
                min={1}
                max={200}
                placeholder={leadForm.fields.guestsPlaceholder}
                value={values.guests}
                onChange={(e) => update('guests', e.target.value)}
                className={fieldClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="type">
                {leadForm.fields.type}
              </label>
              <select
                id="type"
                name="type"
                value={values.type}
                onChange={(e) => update('type', e.target.value)}
                className={fieldClass}
              >
                {leadForm.types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="notes">
                {leadForm.fields.notes}
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder={leadForm.fields.notesPlaceholder}
                value={values.notes}
                onChange={(e) => update('notes', e.target.value)}
                className={`${fieldClass} resize-y`}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-gold mt-7 w-full text-lg">
            <WhatsAppIcon className="size-5" />
            {leadForm.submit}
          </button>

          <p className="mt-3 text-center text-xs text-stone-500">{leadForm.disclaimer}</p>

          {/* Pop-up blockers and in-app browsers sometimes swallow window.open,
              so once we've tried, always offer a direct way through. */}
          {sent && (
            <div className="mt-5 rounded-xl border border-gold-500/40 bg-gold-100/50 p-4 text-center">
              <p className="font-display text-sm font-bold text-navy-950">{leadForm.fallbackTitle}</p>
              <p className="mt-1 text-sm text-stone-600">{leadForm.fallbackBody}</p>
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
