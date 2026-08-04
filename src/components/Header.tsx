import { useEffect, useState } from 'react';
import { hero, nav } from '../data/content';
import { GENERAL_ENQUIRY, whatsappLink } from '../lib/whatsapp';
import { CloseIcon, WhatsAppIcon } from './Icons';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Keep the page behind a full-screen mobile menu from scrolling.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
          scrolled ? 'bg-navy-950/95 py-2 shadow-lg backdrop-blur-md' : 'bg-transparent py-4'
        }`}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-6">
          <a href="#top" className="flex items-baseline gap-2 text-cream-50">
            <span className="font-display text-lg font-black sm:text-xl">{hero.brand}</span>
            <span className="hidden text-xs font-medium text-gold-300 sm:inline">{hero.kicker}</span>
          </a>

          <nav className="hidden items-center gap-7 lg:flex">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-cream-100 transition-colors hover:text-gold-300"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={whatsappLink(GENERAL_ENQUIRY)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-gold hidden !min-h-11 !px-5 !text-sm sm:inline-flex"
            >
              <WhatsAppIcon className="size-4" />
              דברו איתנו
            </a>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="פתיחת תפריט"
              className="flex size-11 items-center justify-center rounded-full text-cream-50 lg:hidden"
            >
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-navy-950 lg:hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <span className="font-display text-lg font-black text-cream-50">{hero.brand}</span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="סגירת תפריט"
              className="flex size-11 items-center justify-center rounded-full text-cream-50"
            >
              <CloseIcon className="size-6" />
            </button>
          </div>

          <nav className="flex flex-1 flex-col justify-center gap-2 px-8 pb-20">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="border-b border-white/10 py-4 font-display text-2xl font-bold text-cream-50"
              >
                {item.label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={() => setMenuOpen(false)}
              className="btn btn-gold mt-8 w-full"
            >
              {hero.ctaPrimary}
            </a>
          </nav>
        </div>
      )}
    </>
  );
}
