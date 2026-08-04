import { useEffect, useState } from 'react';

/**
 * Reports the section currently filling the viewport, plus how far down the
 * page the reader is. Both feed the header: knowing where you are — and how
 * much is left — is most of what separates a long page from an endless one.
 */
export function useScrollSpy(ids: string[]) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollable = document.body.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0);

      // The section that owns the line a third of the way down the screen.
      const probe = window.innerHeight * 0.34;
      let current: string | null = null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const { top, bottom } = el.getBoundingClientRect();
        if (top <= probe && bottom > probe) {
          current = id;
          break;
        }
      }
      setActiveId(current);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ids]);

  return { activeId, progress };
}
