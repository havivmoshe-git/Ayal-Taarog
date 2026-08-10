import { snapshot } from '../content/snapshot';
import { diffContent, revertChange } from './diff';
import type { SiteContent, Section } from '../content/schema';

let pass = 0;
let fail = 0;
const clone = (c: SiteContent) => structuredClone(c);
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function check(name: string, ok: boolean, extra = '') {
  if (ok) { pass++; console.log('  ✓', name); }
  else { fail++; console.log('  ✗', name, extra); }
}

/** Every test: change something, expect N changes, revert them all, expect the original back. */
function roundTrip(name: string, mutate: (c: SiteContent) => void, expected: number, expectSummary?: RegExp) {
  const before = snapshot;
  const after = clone(before);
  mutate(after);
  const changes = diffContent(before, after);
  check(`${name} — ${expected} change(s)`, changes.length === expected,
    `got ${changes.length}: ${changes.map(c => c.summary).join(' | ')}`);
  if (expectSummary) {
    check(`${name} — wording`, changes.some(c => expectSummary.test(c.summary)),
      changes.map(c => c.summary).join(' | '));
  }
  let reverted = after;
  for (const c of changes) reverted = revertChange(reverted, c);
  check(`${name} — reverts to the original`, eq(reverted, before),
    JSON.stringify(diffContent(before, reverted).map(c => c.summary)));
}

console.log('\nno change');
check('identical documents produce nothing', diffContent(snapshot, clone(snapshot)).length === 0);

console.log('\nsimple field');
roundTrip('hero title', (c) => {
  (c.sections.find(s => s.type === 'hero')!.data as Record<string, unknown>).title = 'כותרת חדשה';
}, 1, /כותרת ראשית/);

console.log('\ncontact details');
roundTrip('phone number', (c) => { c.contact.phoneDisplay = '050-000-0000'; }, 1, /טלפון/);

console.log('\nsection toggled off');
roundTrip('gallery off', (c) => {
  c.sections.find(s => s.type === 'gallery')!.enabled = false;
}, 1, /כובה/);

console.log('\nscheduling');
roundTrip('holiday window', (c) => {
  c.sections[1].schedule = { from: '2027-03-25', to: '2027-04-03' };
}, 2, /הצג מתאריך/);

console.log('\nnested list item edited');
roundTrip('one dish renamed', (c) => {
  const menu = c.sections.find(s => s.type === 'menu')!.data as any;
  menu.meals[0].dishes[0].name = 'מנה אחרת';
}, 1, /מנה/);

console.log('\nlist item added');
roundTrip('extra FAQ', (c) => {
  const faq = c.sections.find(s => s.type === 'faq')!.data as any;
  faq.items.push({ q: 'שאלה חדשה?', a: 'תשובה.' });
}, 1, /נוסף פריט/);

console.log('\nlist item removed');
roundTrip('one gallery photo removed', (c) => {
  const g = c.sections.find(s => s.type === 'gallery')!.data as any;
  g.images.pop();
}, 1, /נמחק פריט/);

console.log('\nsection added');
roundTrip('holiday banner', (c) => {
  c.sections.push({ id: 'banner-test', type: 'banner', enabled: true,
    data: { tone: 'gold', title: 'חג שמח', body: 'ברוכים הבאים', ctaLabel: '', ctaHref: '' } } as Section);
}, 1, /נוסף מקטע/);

console.log('\nsection removed');
roundTrip('downloads removed', (c) => {
  c.sections = c.sections.filter(s => s.type !== 'downloads');
}, 1, /נמחק מקטע/);

console.log('\nreorder');
roundTrip('menu moved to the top', (c) => {
  const i = c.sections.findIndex(s => s.type === 'menu');
  const [s] = c.sections.splice(i, 1);
  c.sections.splice(1, 0, s);
}, 1, /סדר המקטעים/);

console.log('\ntestimonials');
roundTrip('a feedback section added', (c) => {
  c.sections.push({ id: 'testimonials-test', type: 'testimonials', enabled: true, data: {
    eyebrow: 'מה אומרים עלינו', title: 'פידבקים מהאורחים', subtitle: '',
    showSummary: true, summaryLabel: '',
    items: [{ name: 'איתן', context: 'שבת חתן', quote: 'היה מושלם.', rating: 5 }],
  } } as Section);
}, 1, /נוסף מקטע/);

{
  const before = clone(snapshot);
  before.sections.push({ id: 'testimonials-test', type: 'testimonials', enabled: true, data: {
    eyebrow: 'מה אומרים עלינו', title: 'פידבקים מהאורחים', subtitle: '',
    showSummary: true, summaryLabel: '',
    items: [{ name: 'איתן', context: 'שבת חתן', quote: 'היה מושלם.', rating: 5 }],
  } } as Section);

  const after = clone(before);
  (after.sections.at(-1)!.data as any).items.push({ name: 'דוד', context: '', quote: 'מעולה.', rating: 4 });
  const added = diffContent(before, after);
  check('adding a feedback is one change', added.length === 1, added.map(c => c.summary).join('|'));
  check('described by the reviewer name', /דוד/.test(added[0].summary), added[0].summary);
  check('reverting removes just that one', eq(revertChange(after, added[0]), before));

  const rated = clone(before);
  (rated.sections.at(-1)!.data as any).items[0].rating = 3;
  const change = diffContent(before, rated);
  check('changing a rating is one change', change.length === 1, change.map(c => c.summary).join('|'));
  check('rating named in Hebrew', /דירוג/.test(change[0].summary), change[0].summary);
  check('rating reverts to a number, not a string',
    (revertChange(rated, change[0]).sections.at(-1)!.data as any).items[0].rating === 5);
}

console.log('\nmany changes at once, reverting only one');
{
  const before = snapshot;
  const after = clone(before);
  (after.sections.find(s => s.type === 'hero')!.data as any).title = 'כותרת א';
  (after.sections.find(s => s.type === 'faq')!.data as any).title = 'כותרת ב';
  after.contact.phoneDisplay = '050-000-0000';
  const changes = diffContent(before, after);
  check('three independent changes', changes.length === 3, `got ${changes.length}`);
  const phone = changes.find(c => c.summary.includes('טלפון'))!;
  const partial = revertChange(after, phone);
  check('reverting one restores only that field',
    partial.contact.phoneDisplay === before.contact.phoneDisplay
    && (partial.sections.find(s => s.type === 'hero')!.data as any).title === 'כותרת א'
    && (partial.sections.find(s => s.type === 'faq')!.data as any).title === 'כותרת ב');
  check('the other two changes survive', diffContent(before, partial).length === 2);
}

console.log('\nadding a section does not report the rest as reordered');
{
  const before = snapshot;
  const after = clone(before);
  after.sections.splice(2, 0, { id: 'rt-test', type: 'richText', enabled: true,
    data: { title: 'כותרת', paragraphs: ['טקסט'], align: 'center' } } as Section);
  const kinds = diffContent(before, after).map(c => c.kind);
  check('exactly one change, and it is the addition', kinds.length === 1 && kinds[0] === 'section-added',
    kinds.join(','));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
