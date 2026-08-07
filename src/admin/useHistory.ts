import { useCallback, useRef, useState } from 'react';

/**
 * Undo and redo over whole documents.
 *
 * The panel autosaves, which protects against losing work but does nothing
 * about work that was wrong — and with no undo, a mistyped paragraph or a
 * deleted card had to be retyped from memory. This keeps the last `LIMIT`
 * states in memory so a mistake costs one tap.
 *
 * Consecutive edits inside `COALESCE_MS` collapse into one step, so undo moves
 * back by an edit rather than by a keystroke. Anything that names a different
 * `group` — switching sections, dragging, deleting — always starts a new step,
 * so a structural change is never swallowed into the middle of some typing.
 */

const LIMIT = 40;
const COALESCE_MS = 900;

export type History<T> = {
  present: T | null;
  canUndo: boolean;
  canRedo: boolean;
  set: (next: T, group?: string) => void;
  undo: () => T | null;
  redo: () => T | null;
  /** Replaces everything, discarding both stacks — for load and restore. */
  reset: (value: T) => void;
  depth: number;
};

export function useHistory<T>(): History<T> {
  const [present, setPresent] = useState<T | null>(null);
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const lastAt = useRef(0);
  const lastGroup = useRef<string | undefined>(undefined);
  // Only exists to re-render the buttons when the stacks change shape.
  const [, bump] = useState(0);

  const set = useCallback((next: T, group?: string) => {
    setPresent((current) => {
      if (current !== null) {
        const now = Date.now();
        const sameEdit =
          group !== undefined && group === lastGroup.current && now - lastAt.current < COALESCE_MS;
        // Coalescing replaces the top of the stack rather than pushing, so a
        // sentence typed letter by letter is one undo step, not forty.
        if (!sameEdit) {
          past.current = [...past.current, current].slice(-LIMIT);
        }
        lastAt.current = now;
        lastGroup.current = group;
      }
      future.current = [];
      return next;
    });
    bump((n) => n + 1);
  }, []);

  const undo = useCallback(() => {
    let taken: T | null = null;
    setPresent((current) => {
      const previous = past.current[past.current.length - 1];
      if (previous === undefined || current === null) return current;
      past.current = past.current.slice(0, -1);
      future.current = [current, ...future.current].slice(0, LIMIT);
      lastGroup.current = undefined;
      taken = previous;
      return previous;
    });
    bump((n) => n + 1);
    return taken;
  }, []);

  const redo = useCallback(() => {
    let taken: T | null = null;
    setPresent((current) => {
      const next = future.current[0];
      if (next === undefined || current === null) return current;
      future.current = future.current.slice(1);
      past.current = [...past.current, current].slice(-LIMIT);
      lastGroup.current = undefined;
      taken = next;
      return next;
    });
    bump((n) => n + 1);
    return taken;
  }, []);

  const reset = useCallback((value: T) => {
    past.current = [];
    future.current = [];
    lastGroup.current = undefined;
    setPresent(value);
    bump((n) => n + 1);
  }, []);

  return {
    present,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    set,
    undo,
    redo,
    reset,
    depth: past.current.length,
  };
}
