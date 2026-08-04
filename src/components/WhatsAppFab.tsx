import { useEffect, useState } from 'react';
import { GENERAL_ENQUIRY, whatsappLink } from '../lib/whatsapp';
import { WhatsAppIcon } from './Icons';

export default function WhatsAppFab() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Hold the button back until the hero is behind the user — before that the
    // hero's own WhatsApp CTA is already on screen.
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <a
      href={whatsappLink(GENERAL_ENQUIRY)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="פתיחת שיחה בוואטסאפ"
      className="pop-in fixed bottom-5 left-5 z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_28px_-6px_rgba(37,211,102,0.6)] transition-transform active:scale-95"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      <WhatsAppIcon className="size-7" />
    </a>
  );
}
