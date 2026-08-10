import { useEffect, useState, type FormEvent } from 'react';
import { useContact, useContent, useSection } from '../content/ContentContext';
import { mediaUrl } from '../lib/media';
import { submitFeedback } from '../lib/feedback';
import { PhoneIcon, WhatsAppIcon } from './Icons';
import { GENERAL_ENQUIRY, whatsappLink } from '../lib/whatsapp';

/**
 * The page guests are sent after their stay.
 *
 * Deliberately not part of the home page and deliberately short. It is opened
 * from a WhatsApp message by someone who has already left, is doing the venue
 * a favour, and will close the tab the moment it feels like work — so there is
 * no navigation, no scroll hint, and nothing above the form but one sentence
 * saying why it is worth two minutes.
 *
 * The two text boxes are the point. "What did you like" is offered for
 * publication; "what could we improve" is marked, on screen, as never
 * published. One box for both would force a choice between a useful private
 * answer and a publishable public one, and most people would resolve it by
 * writing something bland.
 */

const field =
  'w-full min-h-12 rounded-xl border border-cream-200 bg-white px-4 py-3 text-base text-navy-950 placeholder:text-stone-500/70 transition-colors focus:border-gold-500 focus:outline-none';
const label = 'mb-1.5 block font-display text-sm font-bold text-navy-950';
const hint = 'mt-1 text-xs leading-relaxed text-stone-600';

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div
      className="flex justify-center gap-1.5"
      role="radiogroup"
      aria-label="דירוג"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} מתוך 5`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          // Generous hit area: this is the one control everyone will use, on a
          // phone, probably one-handed.
          className="p-1 transition-transform active:scale-90"
        >
          <svg
            viewBox="0 0 20 20"
            className={`size-10 transition-colors duration-150 ${
              n <= shown ? 'text-gold-500' : 'text-stone-400/35'
            }`}
            fill="currentColor"
            aria-hidden
          >
            <path d="M10 1.6l2.47 5.01 5.53.8-4 3.9.94 5.5L10 14.21l-4.94 2.6.94-5.5-4-3.9 5.53-.8z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const { content } = useContent();
  const contact = useContact();
  const hero = useSection('hero')?.data;
  const copy = content.feedbackPage;

  const [name, setName] = useState('');
  const [context, setContext] = useState('');
  const [rating, setRating] = useState(0);
  const [quote, setQuote] = useState('');
  const [note, setNote] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // The tab title is the site's by default, which reads oddly on a page that
  // is a form. Set on mount only; it is not worth an effect dependency.
  useEffect(() => {
    if (copy?.title) document.title = `${copy.title} — ${content.seo.title}`;

    // This page is a private link sent to a guest, not a search result.
    // robots.txt keeps crawlers from fetching it; this keeps it out of the
    // index even if someone links to it publicly.
    const tag = document.createElement('meta');
    tag.name = 'robots';
    tag.content = 'noindex, nofollow';
    document.head.appendChild(tag);
    return () => tag.remove();
  }, [copy?.title, content.seo.title]);

  if (!copy) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return setError('נשמח לדעת מי אתם');
    if (!rating) return setError('בחרו דירוג בכוכבים');
    if (!quote.trim() && !note.trim()) return setError('כתבו לנו משהו — בכל אחד משני השדות');

    setBusy(true);
    try {
      await submitFeedback({ name, context, rating, quote, note, phone, consent });
      setSent(true);
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'השליחה נכשלה, נסו שוב');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-[100svh] bg-cream-100 px-5 py-10 sm:px-6 sm:py-16">
      <div className="mx-auto w-full max-w-xl">
        <a href="#/" className="mb-8 flex items-center justify-center gap-3">
          {hero?.logo && (
            <img src={mediaUrl(hero.logo, 'sm')} alt="" width={890} height={814} className="h-12 w-auto" />
          )}
          <span className="font-display text-xl font-black text-navy-950">{hero?.brand}</span>
        </a>

        {sent ? (
          <div className="rounded-2xl border border-gold-500/40 bg-white p-8 text-center shadow-[0_2px_24px_-12px_rgba(11,26,47,0.25)]">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-gold-500 text-navy-950">
              <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">{copy.thanksTitle}</h1>
            <p className="mt-2 text-base leading-relaxed text-stone-600">{copy.thanksBody}</p>

            <div className="mt-7 flex flex-col gap-2">
              <a href="#/" className="btn btn-gold w-full">
                {copy.backCta}
              </a>
              <a
                href={whatsappLink(contact.whatsappNumber, GENERAL_ENQUIRY)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 py-2 text-sm font-bold text-stone-600 hover:text-navy-950"
              >
                <WhatsAppIcon className="size-4" />
                דברו איתנו
              </a>
            </div>
          </div>
        ) : (
          <>
            <header className="mb-7 text-center">
              <p className="mb-2 font-display text-sm font-bold tracking-[0.25em] text-gold-700">
                {copy.eyebrow}
              </p>
              <h1 className="text-3xl sm:text-4xl">{copy.title}</h1>
              <div className="rule-gold mx-auto mt-4 h-px w-24" />
              <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-stone-600">
                {copy.intro}
              </p>
            </header>

            <form
              onSubmit={submit}
              className="rounded-2xl border border-cream-200 bg-white p-5 shadow-[0_2px_24px_-12px_rgba(11,26,47,0.25)] sm:p-7"
            >
              <div className="space-y-5">
                <div>
                  <label className={label} htmlFor="fb-name">
                    {copy.nameLabel}
                  </label>
                  <input
                    id="fb-name"
                    name="name"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={field}
                  />
                </div>

                <div>
                  <label className={label} htmlFor="fb-context">
                    {copy.contextLabel}
                  </label>
                  <input
                    id="fb-context"
                    name="context"
                    placeholder={copy.contextHint}
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    className={field}
                  />
                </div>

                <div className="rounded-xl bg-cream-50 p-4">
                  <span className={`${label} text-center`}>{copy.ratingLabel}</span>
                  <StarPicker value={rating} onChange={setRating} />
                </div>

                <div>
                  <label className={label} htmlFor="fb-quote">
                    {copy.quoteLabel}
                  </label>
                  <textarea
                    id="fb-quote"
                    name="quote"
                    rows={4}
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                    className={`${field} resize-y`}
                  />
                  <p className={hint}>{copy.quoteHint}</p>
                </div>

                {/* Visually separated, because the promise attached to it is
                    the whole reason anyone will write here honestly. */}
                <div className="rounded-xl border border-cream-200 bg-cream-50 p-4">
                  <label className={label} htmlFor="fb-note">
                    {copy.privateLabel}
                  </label>
                  <textarea
                    id="fb-note"
                    name="note"
                    rows={4}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className={`${field} resize-y`}
                  />
                  <p className={`${hint} font-semibold text-navy-950`}>🔒 {copy.privateHint}</p>
                </div>

                <div>
                  <label className={label} htmlFor="fb-phone">
                    {copy.phoneLabel}
                  </label>
                  <input
                    id="fb-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`${field} ltr-nums text-right`}
                  />
                  <p className={hint}>{copy.phoneHint}</p>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-cream-50 p-4">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 size-5 shrink-0 accent-gold-500"
                  />
                  <span className="text-sm leading-relaxed text-navy-950">{copy.consentLabel}</span>
                </label>
              </div>

              {error && (
                <p className="mt-4 rounded-lg bg-red-50 p-3 text-center text-sm font-semibold text-red-700">
                  {error}
                </p>
              )}

              <button type="submit" disabled={busy} className="btn btn-gold mt-6 w-full text-lg disabled:opacity-60">
                {busy ? 'שולח…' : copy.submit}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-stone-600">
              מעדיפים לדבר?{' '}
              <a href={`tel:${contact.phoneHref}`} className="inline-flex items-center gap-1 font-bold text-navy-950">
                <PhoneIcon className="size-4 text-gold-700" />
                <span className="ltr-nums">{contact.phoneDisplay}</span>
              </a>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
