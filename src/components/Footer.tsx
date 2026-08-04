import { contact, footer, hero, nav } from '../data/content';
import { PhoneIcon, PinIcon, WhatsAppIcon } from './Icons';
import { GENERAL_ENQUIRY, whatsappLink } from '../lib/whatsapp';

export default function Footer() {
  return (
    // Extra bottom padding on phones so the fixed action bar never covers the
    // last line of contact details.
    <footer className="bg-navy-900 px-5 pb-28 pt-14 sm:px-6 lg:pb-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <p className="font-display text-2xl font-black text-cream-50">{hero.brand}</p>
            <p className="mt-1 font-display text-sm font-semibold text-gold-300">{footer.tagline}</p>
            <p className="mt-4 text-sm leading-relaxed text-cream-200/75">{footer.about}</p>
          </div>

          <div>
            <h3 className="font-display text-base font-bold text-cream-50">{footer.linksTitle}</h3>
            <ul className="mt-4 space-y-2.5">
              {nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-sm text-cream-200/75 transition-colors hover:text-gold-300"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={contact.catalogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-cream-200/75 transition-colors hover:text-gold-300"
                >
                  {footer.catalogLink}
                </a>
              </li>
              <li>
                <a
                  href={contact.instituteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-cream-200/75 transition-colors hover:text-gold-300"
                >
                  {footer.instituteLink}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-base font-bold text-cream-50">{footer.contactTitle}</h3>
            <ul className="mt-4 space-y-3.5">
              <li className="flex items-start gap-2.5 text-sm text-cream-200/75">
                <PinIcon className="mt-0.5 size-4 shrink-0 text-gold-400" />
                <span>
                  {contact.synagogue}
                  <br />
                  {contact.address}
                </span>
              </li>
              <li>
                <a
                  href={`tel:${contact.phoneHref}`}
                  className="flex items-center gap-2.5 text-sm text-cream-200/75 transition-colors hover:text-gold-300"
                >
                  <PhoneIcon className="size-4 shrink-0 text-gold-400" />
                  <span className="ltr-nums">{contact.phoneDisplay}</span>
                </a>
              </li>
              <li>
                <a
                  href={whatsappLink(GENERAL_ENQUIRY)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-gold mt-1 !min-h-11 !px-5 !text-sm"
                >
                  <WhatsAppIcon className="size-4" />
                  {hero.ctaSecondary}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="rule-gold mt-12 h-px w-full opacity-30" />

        <p className="mt-5 text-center text-xs text-cream-200/50">
          © {new Date().getFullYear()} {hero.brand} · {footer.rights}
        </p>
      </div>
    </footer>
  );
}
