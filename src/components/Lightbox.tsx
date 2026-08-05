import { useCallback, useEffect, useRef } from 'react';
import type { GalleryImage } from '../content/schema';
import { imageSrc } from '../lib/media';
import { ChevronIcon, CloseIcon } from './Icons';

type Props = {
  images: GalleryImage[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

const SWIPE_THRESHOLD = 55;

export default function Lightbox({ images, index, onClose, onNavigate }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);
  const current = images[index];

  const goNext = useCallback(
    () => onNavigate((index + 1) % images.length),
    [index, images.length, onNavigate],
  );
  const goPrev = useCallback(
    () => onNavigate((index - 1 + images.length) % images.length),
    [index, images.length, onNavigate],
  );

  useEffect(() => {
    // In RTL the "next" item sits to the left, so the arrow keys are mirrored.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goNext();
      if (e.key === 'ArrowRight') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, goNext, goPrev]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!current) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={current.caption}
      className="fixed inset-0 z-50 flex flex-col bg-navy-950/95 backdrop-blur-sm"
      onClick={onClose}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        // Swiping rightwards pulls in the next (left-hand) image in RTL.
        if (delta > SWIPE_THRESHOLD) goNext();
        else if (delta < -SWIPE_THRESHOLD) goPrev();
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <span className="ltr-nums font-display text-sm font-bold text-cream-200">
          {index + 1} / {images.length}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="סגירה"
          className="flex size-11 items-center justify-center rounded-full text-cream-50 hover:bg-white/10"
        >
          <CloseIcon className="size-6" />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2 pb-4">
        <img
          key={current.slug}
          src={imageSrc(current, 'lg')}
          alt={current.alt}
          onClick={(e) => e.stopPropagation()}
          className="fade-in max-h-full max-w-full rounded-lg object-contain shadow-2xl"
        />

        {/* Arrows are pointer-only; touch users swipe. */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          aria-label="התמונה הבאה"
          className="absolute left-2 hidden size-12 items-center justify-center rounded-full bg-white/10 text-cream-50 hover:bg-white/20 sm:flex"
        >
          <ChevronIcon className="size-6" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          aria-label="התמונה הקודמת"
          className="absolute right-2 hidden size-12 rotate-180 items-center justify-center rounded-full bg-white/10 text-cream-50 hover:bg-white/20 sm:flex"
        >
          <ChevronIcon className="size-6" />
        </button>
      </div>

      <p className="px-6 pb-8 text-center font-display text-base font-semibold text-cream-50">
        {current.caption}
      </p>
    </div>
  );
}
