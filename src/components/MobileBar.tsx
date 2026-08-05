import { useEffect, useState } from 'react';
import { useContact, useSection } from '../content/ContentContext';
import { GENERAL_ENQUIRY, whatsappLink } from '../lib/whatsapp';
import { PhoneIcon, WhatsAppIcon } from './Icons';

/**
 * Persistent action bar on phones, replacing the single floating button.
 *
 * On a page this long the moment someone decides to enquire can land anywhere,
 * and scrolling back to a CTA loses them. Three taps stay within thumb reach
 * the whole way down. Desktop keeps the header CTA and needs none of this.
 */
export default function MobileBar() {
  const contact = useContact();
  const hero = useSection('hero')?.data;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Held back through the hero, which carries its own two CTAs.
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.75);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-navy-950/95 backdrop-blur-xl transition-transform duration-300 lg:hidden ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch gap-2 px-3 py-2.5">
        <a
          href={`tel:${contact.phoneHref}`}
          aria-label={`התקשרו אלינו ${contact.phoneDisplay}`}
          className="flex min-h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 text-cream-50 active:scale-95"
        >
          <PhoneIcon className="size-5" />
        </a>

        <a
          href={whatsappLink(contact.whatsappNumber, GENERAL_ENQUIRY)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="שיחה בוואטסאפ"
          className="flex min-h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white active:scale-95"
        >
          <WhatsAppIcon className="size-5" />
        </a>

        <a
          href="#contact"
          className="flex min-h-12 flex-1 items-center justify-center rounded-xl bg-gold-500 font-display text-base font-bold text-navy-950 active:scale-[0.98]"
        >
          {hero?.ctaShort}
        </a>
      </div>
    </div>
  );
}
