import type { Section, SiteContent } from '../content/schema';
import { SECTION_LABELS } from '../content/schema';
import { FORM_SPEC, SITE_GROUPS, type Field } from './formSpec';

/**
 * What changed between two versions of the site, in words.
 *
 * "Publish" is the one irreversible-looking button in the panel, and until now
 * it was pressed blind: the draft had been autosaving for an hour and there
 * was no way to see what that hour had actually done. This produces a list of
 * individual changes, each one described in Hebrew and each one revertable on
 * its own — so reviewing before publishing is reading a list, and undoing one
 * mistake does not mean throwing away the other twelve edits.
 *
 * The Hebrew comes from the same `FORM_SPEC` the editor draws its forms from,
 * so a field renamed in the editor is renamed here too, automatically.
 */

export type Change =
  | {
      id: string;
      kind: 'field';
      /** Which section or settings group this belongs to, for grouping. */
      scope: string;
      label: string;
      path: (string | number)[];
      before: unknown;
      after: unknown;
      summary: string;
    }
  | { id: string; kind: 'section-added'; scope: string; index: number; section: Section; summary: string }
  | { id: string; kind: 'section-removed'; scope: string; index: number; section: Section; summary: string }
  | { id: string; kind: 'section-moved'; scope: string; order: string[]; summary: string }
  | {
      id: string;
      kind: 'item-added' | 'item-removed';
      scope: string;
      label: string;
      path: (string | number)[];
      index: number;
      item: unknown;
      summary: string;
    };

/* ── Labels ───────────────────────────────────────────────────────────── */

/** Walks a form spec alongside a data path to name the field in Hebrew. */
function labelFor(fields: Field[], path: (string | number)[]): string {
  const [head, ...rest] = path;
  const field = fields.find((f) => f.key === head);
  if (!field) return String(head);
  if (rest.length === 0) return field.label;

  if (field.kind === 'list') {
    const [index, ...tail] = rest;
    const position = typeof index === 'number' ? ` ${index + 1}` : '';
    const inner = tail.length ? ` · ${labelFor(field.fields, tail)}` : '';
    return `${field.label} — ${field.itemLabel}${position}${inner}`;
  }
  if (field.kind === 'strings') {
    const position = typeof rest[0] === 'number' ? ` ${rest[0] + 1}` : '';
    return `${field.label} — ${field.itemLabel}${position}`;
  }
  return field.label;
}

/** A value shown to a human: short, single-line, and never "[object Object]". */
export function preview(value: unknown): string {
  if (value === undefined || value === null || value === '') return '(ריק)';
  if (typeof value === 'boolean') return value ? 'כן' : 'לא';
  if (Array.isArray(value)) return `${value.length} פריטים`;
  if (typeof value === 'object') {
    const first = Object.values(value as Record<string, unknown>).find(
      (v) => typeof v === 'string' && v,
    );
    return first ? String(first) : 'פריט';
  }
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text.length > 70 ? `${text.slice(0, 70)}…` : text;
}

/* ── Diff ─────────────────────────────────────────────────────────────── */

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

type Ctx = { scope: string; fields: Field[]; base: (string | number)[]; out: Change[] };

function walk(before: unknown, after: unknown, path: (string | number)[], ctx: Ctx) {
  if (Object.is(before, after)) return;

  if (Array.isArray(before) && Array.isArray(after)) {
    const label = labelFor(ctx.fields, path);
    // Compare position by position. Reordering a list therefore reads as a
    // series of changed items rather than one "moved" — which is honest: the
    // panel has no stable identity for a dish or a card to track it by.
    const shared = Math.min(before.length, after.length);
    for (let i = 0; i < shared; i++) walk(before[i], after[i], [...path, i], ctx);
    for (let i = shared; i < after.length; i++) {
      ctx.out.push({
        id: `${ctx.scope}:${[...path, i].join('.')}:add`,
        kind: 'item-added',
        scope: ctx.scope,
        label,
        path: [...ctx.base, ...path],
        index: i,
        item: after[i],
        summary: `נוסף פריט ל"${label}": ${preview(after[i])}`,
      });
    }
    for (let i = shared; i < before.length; i++) {
      ctx.out.push({
        id: `${ctx.scope}:${[...path, i].join('.')}:remove`,
        kind: 'item-removed',
        scope: ctx.scope,
        label,
        path: [...ctx.base, ...path],
        index: i,
        item: before[i],
        summary: `נמחק פריט מ"${label}": ${preview(before[i])}`,
      });
    }
    return;
  }

  if (isPlainObject(before) && isPlainObject(after)) {
    for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
      walk(before[key], after[key], [...path, key], ctx);
    }
    return;
  }

  if (JSON.stringify(before) === JSON.stringify(after)) return;

  const label = labelFor(ctx.fields, path);
  ctx.out.push({
    id: `${ctx.scope}:${path.join('.')}`,
    kind: 'field',
    scope: ctx.scope,
    label,
    path: [...ctx.base, ...path],
    before,
    after,
    summary: `${label}: ${preview(before)} ← ${preview(after)}`,
  });
}

const META_LABELS: Record<string, string> = {
  enabled: 'הצגה',
  navLabel: 'קישור בתפריט',
  from: 'הצג מתאריך',
  to: 'הסתר אחרי',
};

export function diffContent(before: SiteContent, after: SiteContent): Change[] {
  const out: Change[] = [];

  // Site-wide settings, named from the same groups the settings screen uses.
  for (const group of SITE_GROUPS) {
    walk(
      (before as unknown as Record<string, unknown>)[group.key],
      (after as unknown as Record<string, unknown>)[group.key],
      [],
      { scope: group.label, fields: group.fields, base: [group.key], out },
    );
  }

  const beforeById = new Map(before.sections.map((s) => [s.id, s]));
  const afterById = new Map(after.sections.map((s) => [s.id, s]));

  after.sections.forEach((section, index) => {
    if (beforeById.has(section.id)) return;
    out.push({
      id: `section:${section.id}:add`,
      kind: 'section-added',
      scope: SECTION_LABELS[section.type],
      index,
      section,
      summary: `נוסף מקטע חדש: ${SECTION_LABELS[section.type]}`,
    });
  });

  before.sections.forEach((section, index) => {
    if (afterById.has(section.id)) return;
    out.push({
      id: `section:${section.id}:remove`,
      kind: 'section-removed',
      scope: SECTION_LABELS[section.type],
      index,
      section,
      summary: `נמחק מקטע: ${SECTION_LABELS[section.type]}`,
    });
  });

  // Order, considering only sections present on both sides — otherwise adding
  // one section would report every section below it as reordered.
  const beforeOrder = before.sections.filter((s) => afterById.has(s.id)).map((s) => s.id);
  const afterOrder = after.sections.filter((s) => beforeById.has(s.id)).map((s) => s.id);
  if (beforeOrder.join() !== afterOrder.join()) {
    out.push({
      id: 'sections:order',
      kind: 'section-moved',
      scope: 'סדר המקטעים',
      order: before.sections.map((s) => s.id),
      summary: 'סדר המקטעים שונה',
    });
  }

  for (const [id, next] of afterById) {
    const prev = beforeById.get(id);
    if (!prev) continue;
    const scope = SECTION_LABELS[next.type];
    const base = ['sections', after.sections.findIndex((s) => s.id === id)];

    if (prev.enabled !== next.enabled) {
      out.push({
        id: `section:${id}:enabled`,
        kind: 'field',
        scope,
        label: META_LABELS.enabled,
        path: [...base, 'enabled'],
        before: prev.enabled,
        after: next.enabled,
        summary: `המקטע "${scope}" ${next.enabled ? 'הודלק' : 'כובה'}`,
      });
    }
    if (prev.navLabel !== next.navLabel) {
      out.push({
        id: `section:${id}:navLabel`,
        kind: 'field',
        scope,
        label: META_LABELS.navLabel,
        path: [...base, 'navLabel'],
        before: prev.navLabel,
        after: next.navLabel,
        summary: `${scope} · קישור בתפריט: ${preview(prev.navLabel)} ← ${preview(next.navLabel)}`,
      });
    }
    for (const key of ['from', 'to'] as const) {
      if (prev.schedule?.[key] !== next.schedule?.[key]) {
        out.push({
          id: `section:${id}:schedule.${key}`,
          kind: 'field',
          scope,
          label: META_LABELS[key],
          path: [...base, 'schedule', key],
          before: prev.schedule?.[key],
          after: next.schedule?.[key],
          summary: `${scope} · ${META_LABELS[key]}: ${preview(prev.schedule?.[key])} ← ${preview(next.schedule?.[key])}`,
        });
      }
    }

    walk(prev.data, next.data, [], {
      scope,
      fields: FORM_SPEC[next.type] ?? [],
      base: [...base, 'data'],
      out,
    });
  }

  return out;
}

/* ── Revert ───────────────────────────────────────────────────────────── */

/** Immutably writes `value` at `path`, cloning only what it passes through. */
function setAt(root: unknown, path: (string | number)[], value: unknown): unknown {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  if (Array.isArray(root)) {
    const copy = [...root];
    copy[head as number] = setAt(copy[head as number], rest, value);
    return copy;
  }
  const copy = { ...(isPlainObject(root) ? root : {}) };
  if (rest.length === 0) {
    if (value === undefined) delete copy[head as string];
    else copy[head as string] = value;
    return copy;
  }
  const child = setAt(copy[head as string], rest, value);
  // A container emptied by a deletion is itself noise: `schedule: {}` and no
  // schedule at all mean the same thing to the site, but leaving the husk
  // behind makes a fully reverted document differ from the one it reverted
  // to — which would make "no changes to publish" quietly untrue.
  if (value === undefined && isPlainObject(child) && Object.keys(child).length === 0) {
    delete copy[head as string];
  } else {
    copy[head as string] = child;
  }
  return copy;
}

function spliceAt(root: unknown, path: (string | number)[], index: number, item?: unknown): unknown {
  const list = path.reduce<unknown>(
    (acc, key) => (acc as Record<string, unknown>)?.[key as string],
    root,
  );
  const next = Array.isArray(list) ? [...list] : [];
  if (item === undefined) next.splice(index, 1);
  else next.splice(index, 0, item);
  return setAt(root, path, next);
}

/** Undoes one change, leaving every other change in the draft intact. */
export function revertChange(doc: SiteContent, change: Change): SiteContent {
  switch (change.kind) {
    case 'field':
      return setAt(doc, change.path, change.before) as SiteContent;

    case 'item-added':
      return spliceAt(doc, change.path, change.index) as SiteContent;

    case 'item-removed':
      return spliceAt(doc, change.path, change.index, change.item) as SiteContent;

    case 'section-added':
      return { ...doc, sections: doc.sections.filter((s) => s.id !== change.section.id) };

    case 'section-removed': {
      const sections = [...doc.sections];
      sections.splice(Math.min(change.index, sections.length), 0, change.section);
      return { ...doc, sections };
    }

    case 'section-moved': {
      // Restore the old order for the sections that still exist, and leave any
      // added since then at the end rather than dropping them.
      const byId = new Map(doc.sections.map((s) => [s.id, s]));
      const restored = change.order.map((id) => byId.get(id)).filter(Boolean) as Section[];
      const known = new Set(change.order);
      return { ...doc, sections: [...restored, ...doc.sections.filter((s) => !known.has(s.id))] };
    }
  }
}

/** Groups changes for display, preserving the order they were produced in. */
export function groupChanges(changes: Change[]): { scope: string; changes: Change[] }[] {
  const groups = new Map<string, Change[]>();
  for (const change of changes) {
    const list = groups.get(change.scope) ?? [];
    list.push(change);
    groups.set(change.scope, list);
  }
  return [...groups].map(([scope, list]) => ({ scope, changes: list }));
}
