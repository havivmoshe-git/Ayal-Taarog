import { snapshot } from './snapshot';
import { __overlayForTests as overlay } from './load';
import type { SiteContent } from './schema';

/**
 * The published document is written by whatever version of the app last
 * pressed publish. These cover the rule that keeps a newly shipped field alive
 * without ever resurrecting something the owner deliberately removed.
 */

let pass = 0;
let fail = 0;
const check = (name: string, ok: boolean, extra = '') => {
  if (ok) {
    pass++;
    console.log('  ✓', name);
  } else {
    fail++;
    console.log('  ✗', name, extra);
  }
};

const clone = <T>(v: T): T => structuredClone(v);
const heroOf = (c: SiteContent) =>
  c.sections.find((s) => s.type === 'hero')!.data as Record<string, unknown>;

/** A document published before the logo field existed. */
function published(): SiteContent {
  const doc = clone(snapshot);
  const hero = heroOf(doc);
  delete hero.logo;
  delete hero.logoAlt;
  return doc;
}

console.log('\na field the code grew after the last publish');
{
  const before = published();
  check('the fixture really is missing it', !('logo' in heroOf(before)));
  const merged = overlay(before);
  check('the snapshot fills it back in', heroOf(merged).logo === heroOf(snapshot).logo);
  check('and its alt text too', heroOf(merged).logoAlt === heroOf(snapshot).logoAlt);
}

console.log('\nwhat the owner controls always wins');
{
  const doc = published();
  heroOf(doc).title = 'כותרת שנערכה';
  doc.contact.phoneDisplay = '050-000-0000';
  const merged = overlay(doc);
  check('an edited field is not overwritten', heroOf(merged).title === 'כותרת שנערכה');
  check('an edited contact detail is not overwritten', merged.contact.phoneDisplay === '050-000-0000');
}

console.log('\na field cleared to empty stays empty');
{
  const doc = published();
  heroOf(doc).subtitle = '';
  const merged = overlay(doc);
  check('an emptied string is a real value and wins', heroOf(merged).subtitle === '');
}

console.log('\ndecisions about sections are never undone');
{
  const doc = published();
  doc.sections = doc.sections.filter((s) => s.type !== 'gallery');
  const merged = overlay(doc);
  check('a deleted section stays deleted', !merged.sections.some((s) => s.type === 'gallery'));
}
{
  const doc = published();
  const gallery = doc.sections.find((s) => s.type === 'gallery')!;
  gallery.enabled = false;
  delete gallery.navLabel;
  const merged = overlay(doc);
  const after = merged.sections.find((s) => s.type === 'gallery')!;
  check('a section switched off stays off', after.enabled === false);
  check('a cleared nav label is not resurrected', after.navLabel === undefined);
}
{
  const doc = published();
  const [first, ...rest] = doc.sections;
  doc.sections = [...rest, first];
  const merged = overlay(doc);
  check(
    'the published order is preserved exactly',
    merged.sections.map((s) => s.id).join() === doc.sections.map((s) => s.id).join(),
  );
}

console.log('\nsections the snapshot has never heard of');
{
  const doc = published();
  doc.sections.push({
    id: 'testimonials-live',
    type: 'testimonials',
    enabled: true,
    data: {
      eyebrow: 'מה אומרים עלינו',
      title: 'פידבקים',
      subtitle: '',
      showSummary: true,
      summaryLabel: '',
      items: [{ name: 'איתן', context: 'שבת חתן', quote: 'היה מושלם', rating: 5 }],
    },
  } as SiteContent['sections'][number]);
  const merged = overlay(doc);
  const added = merged.sections.find((s) => s.id === 'testimonials-live');
  check('a section added from the panel passes through untouched', Boolean(added));
  check(
    'with its content intact',
    JSON.stringify(added) === JSON.stringify(doc.sections.at(-1)),
  );
}

console.log('\nan id reused for a different type is not merged across');
{
  const doc = published();
  const hero = doc.sections.find((s) => s.type === 'hero')!;
  const replaced = { ...hero, type: 'richText', data: { title: 'א', paragraphs: [], align: 'center' } };
  doc.sections[doc.sections.indexOf(hero)] = replaced as SiteContent['sections'][number];
  const merged = overlay(doc);
  const after = merged.sections.find((s) => s.id === hero.id)!;
  check('mismatched types are left alone', !('brand' in (after.data as Record<string, unknown>)));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
