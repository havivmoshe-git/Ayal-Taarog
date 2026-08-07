import { useCallback, useRef, useState } from 'react';

/**
 * Pointer-based drag reordering.
 *
 * HTML5 drag-and-drop does not fire on touch, and this panel is used mostly
 * from a phone — so this uses pointer events, which cover mouse and touch with
 * the same code. Dragging starts from a dedicated handle so that scrolling the
 * list still works normally everywhere else.
 */
export function useReorder(count: number, onMove: (from: number, to: number) => void) {
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const rows = useRef<(HTMLElement | null)[]>([]);

  const setRow = useCallback((i: number) => (el: HTMLElement | null) => {
    rows.current[i] = el;
  }, []);

  const start = useCallback(
    (index: number) => (e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      setDragging(index);
      setOver(index);

      const move = (ev: PointerEvent) => {
        // Whichever row's midpoint the pointer has passed becomes the target.
        let target = index;
        for (let i = 0; i < count; i++) {
          const el = rows.current[i];
          if (!el) continue;
          const r = el.getBoundingClientRect();
          if (ev.clientY > r.top && ev.clientY < r.bottom) {
            target = i;
            break;
          }
        }
        setOver(target);
      };

      const end = () => {
        setOver((currentOver) => {
          if (currentOver !== null && currentOver !== index) onMove(index, currentOver);
          return null;
        });
        setDragging(null);
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', end);
        window.removeEventListener('pointercancel', end);
      };

      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', end);
      window.addEventListener('pointercancel', end);
    },
    [count, onMove],
  );

  return { dragging, over, setRow, start };
}
