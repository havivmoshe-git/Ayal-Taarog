import { useEffect, useState } from 'react';
import { hero, nav } from '../data/content';
import { GENERAL_ENQUIRY, whatsappLink } from '../lib/whatsapp';
import { useScrollSpy } from '../hooks/useScrollSpy';
import { CloseIcon, WhatsAppIcon } from './Icons';

const SECTION_IDS = nav.map((n) => n.href.slice(1));

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { activeId, progress } = useScrollSpy(SECTION_IDS);

  const activeLabel = nav.find((n) => n.href === `#${activeId}`)?.label;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
          scrolled ? 'bg-navy-950/90 py-2 shadow-lg backdrop-blur-xl' : 'bg-transparent py-4'
        }`}
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-6">
          <a href="#top" className="flex min-w-0 items-baseline gap-2 text-cream-50">
            <span className="font-display text-lg font-black sm:text-xl">{hero.brand}</span>
            {/* On a phone the header doubles as a "you are here" marker. */}
            <span
              className={`truncate text-xs font-semibold text-gold-300 transition-opacity duration-300 ${
                scrolled && activeLabel ? 'opacity-100' : 'opacity-0'
              } lg:hidden`}
            >
              {activeLabel && `· ${activeLabel}`}
            </span>
            <span className="hidden text-xs font-medium text-gold-300 lg:inline">{hero.kicker}</span>
          </a>

          <nav className="hidden items-center gap-6 lg:flex">
            {nav.map((item) => {
              const isActive = item.href === `#${activeId}`;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`relative py-1 text-sm font-semibold transition-colors ${
                    isActive ? 'text-gold-300' : 'text-cream-100 hover:text-gold-300'
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute inset-x-0 -bottom-0.5 h-px origin-right bg-gold-400 transition-transform duration-300 ${
                      isActive ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </a>
              );
            })}
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

        {/* Reading progress — turns "how much more is there?" into a glance. */}
        <div
          className={`absolute inset-x-0 bottom-0 h-0.5 origin-right bg-gold-500 transition-opacity duration-300 ${
            scrolled ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ transform: `scaleX(${progress})` }}
        />
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

          <nav className="flex flex-1 flex-col justify-center gap-1 px-8 pb-24">
            {nav.map((item, i) => {
              const isActive = item.href === `#${activeId}`;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="hero-in flex items-baseline gap-3 border-b border-white/10 py-3.5"
                  style={{ animationDelay: `${i * 45}ms` }}
                >
                  <span className="ltr-nums font-display text-xs font-bold text-gold-500/70">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={`font-display text-2xl font-bold ${
                      isActive ? 'text-gold-300' : 'text-cream-50'
                    }`}
                  >
                    {item.label}
                  </span>
                </a>
              );
            })}
            <a href="#contact" onClick={() => setMenuOpen(false)} className="btn btn-gold mt-7 w-full">
              {hero.ctaPrimary}
            </a>
          </nav>
        </div>
      )}
    </>
  );
}
