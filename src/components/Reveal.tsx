import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';

/**
 * Scroll-triggered reveal. Replaces an animation library that would have cost
 * ~100KB gzip for what amounts to a handful of transitions.
 *
 * The `from` variants exist so a long page does not animate identically for
 * fifteen screens — a list that slides in from the right reads differently
 * from a card that scales up, and that variation is most of what stops a
 * scroll feeling endless.
 */

type Variant = 'up' | 'right' | 'left' | 'scale' | 'fade';

type RevealProps = {
  children: ReactNode;
  /** Stagger within a group, in ms. */
  delay?: number;
  from?: Variant;
  className?: string;
  as?: ElementType;
} & Record<string, unknown>;

export default function Reveal({
  children,
  delay = 0,
  from = 'up',
  className = '',
  as: Tag = 'div',
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -50px 0px', threshold: 0.03 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal reveal-${from} ${shown ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
