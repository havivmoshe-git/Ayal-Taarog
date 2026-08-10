/**
 * Lifts the logo plaque off the photograph it was delivered on.
 *
 * The supplied artwork is a composite: an ogee cartouche and a ribbon sitting
 * over a Jerusalem sunset, books and a lantern. The site needs the plaque
 * alone, on transparency, so it can sit over the hero photograph.
 *
 * Colour thresholding alone will not do it — the background is full of golds
 * that match the plaque's border, and full of darks that match its shadow. But
 * the plaque's *fill* is a flat, deep navy that appears nowhere else in the
 * photograph, so the shape can be recovered from the fill and then grown back
 * out to include the border:
 *
 *   1. mark every navy pixel
 *   2. keep the large connected regions — the cartouche and the ribbon
 *   3. fill their interiors, so the gold lettering inside stops being a hole
 *   4. grow the silhouette outwards by the border's width
 *   5. feather the last pixel or two so the edge is not a staircase
 *
 * Run with: npm run logo
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const SOURCE = process.argv[2];
const OUT_DIR = 'assets/source';

if (!SOURCE) {
  console.error('usage: node scripts/cutout-logo.mjs <source-image>');
  process.exit(1);
}

const image = sharp(await readFile(SOURCE));
const { width: W, height: H } = await image.metadata();
const { data } = await image.clone().removeAlpha().raw().toBuffer({ resolveWithObject: true });

const at = (x, y) => (y * W + x) * 3;

/**
 * The plaque fill: dark, and distinctly bluer than it is red.
 *
 * The threshold on `b - r` is the whole trick, and it is measured rather than
 * guessed. Sampling the artwork puts the plaque and the ribbon at 28-36, and
 * the dark stone floor they sit on — which is navy to the eye — at 5-19. At 24
 * the mark separates from its own shadow.
 */
function isNavy(i) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  return b < 110 && r < 80 && b - r >= 24 && b >= g;
}

const navy = new Uint8Array(W * H);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (isNavy(at(x, y))) navy[y * W + x] = 1;
  }
}

/* ── Connected components, keeping only the substantial ones ───────────── */

const label = new Int32Array(W * H).fill(-1);
const sizes = [];
const stack = new Int32Array(W * H);

for (let start = 0; start < W * H; start++) {
  if (!navy[start] || label[start] !== -1) continue;
  const id = sizes.length;
  let count = 0;
  let top = 0;
  stack[top++] = start;
  label[start] = id;
  while (top > 0) {
    const p = stack[--top];
    count++;
    const x = p % W;
    const y = (p / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const q = ny * W + nx;
      if (navy[q] && label[q] === -1) {
        label[q] = id;
        stack[top++] = q;
      }
    }
  }
  sizes.push(count);
}

/**
 * The cartouche only.
 *
 * The artwork also carries a ribbon reading "בראשות הרב אייל עמרמי שליט״א",
 * but it cannot be lifted off cleanly: in the source the tallit lies across
 * its right-hand end, so recovering it would mean inventing pixels that were
 * never photographed. It is also the part that goes unreadable first — at the
 * size a hero logo is displayed, that line is a few pixels tall — and the hero
 * already states it underneath in type meant to be read.
 *
 * So: the single largest region, which is the plaque.
 */
const largest = sizes.indexOf(Math.max(...sizes));
const keep = new Set([largest]);
console.log(`components: ${sizes.length}, keeping the plaque (${sizes[largest]}px)`);

let mask = new Uint8Array(W * H);
for (let p = 0; p < W * H; p++) if (label[p] >= 0 && keep.has(label[p])) mask[p] = 1;

/* ── Fill interiors ────────────────────────────────────────────────────── */
// Flood the outside from the image border; whatever the flood never reaches is
// enclosed by the mark — the gold lettering and the ornaments.

const outside = new Uint8Array(W * H);
{
  let top = 0;
  const push = (p) => {
    if (!mask[p] && !outside[p]) {
      outside[p] = 1;
      stack[top++] = p;
    }
  };
  for (let x = 0; x < W; x++) {
    push(x);
    push((H - 1) * W + x);
  }
  for (let y = 0; y < H; y++) {
    push(y * W);
    push(y * W + W - 1);
  }
  while (top > 0) {
    const p = stack[--top];
    const x = p % W;
    const y = (p / W) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      push(ny * W + nx);
    }
  }
}
let filled = 0;
for (let p = 0; p < W * H; p++) {
  if (!mask[p] && !outside[p]) {
    mask[p] = 1;
    filled++;
  }
}
console.log(`filled ${filled}px of enclosed lettering and ornament`);

/* ── Grow out to cover the gold border ─────────────────────────────────── */
// A two-pass chamfer distance is far cheaper than dilating one ring at a time,
// and gives a smooth edge to feather against.

const GROW = Math.round(W * 0.021);
const INF = 1e9;
const dist = new Float32Array(W * H);
for (let p = 0; p < W * H; p++) dist[p] = mask[p] ? 0 : INF;

const relax = (p, q, cost) => {
  const d = dist[q] + cost;
  if (d < dist[p]) dist[p] = d;
};
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const p = y * W + x;
    if (x > 0) relax(p, p - 1, 1);
    if (y > 0) relax(p, p - W, 1);
    if (x > 0 && y > 0) relax(p, p - W - 1, 1.414);
    if (x < W - 1 && y > 0) relax(p, p - W + 1, 1.414);
  }
}
for (let y = H - 1; y >= 0; y--) {
  for (let x = W - 1; x >= 0; x--) {
    const p = y * W + x;
    if (x < W - 1) relax(p, p + 1, 1);
    if (y < H - 1) relax(p, p + W, 1);
    if (x < W - 1 && y < H - 1) relax(p, p + W + 1, 1.414);
    if (x > 0 && y < H - 1) relax(p, p + W - 1, 1.414);
  }
}

// One pixel of ramp at the outer edge, so the cutout does not look cut out.
const FEATHER = 1.5;
const alpha = Buffer.alloc(W * H);
for (let p = 0; p < W * H; p++) {
  const d = dist[p];
  alpha[p] = d <= GROW ? 255 : d >= GROW + FEATHER ? 0 : Math.round(255 * (1 - (d - GROW) / FEATHER));
}
console.log(`grew ${GROW}px to cover the gold border`);

/* ── Compose and export ────────────────────────────────────────────────── */

await mkdir(OUT_DIR, { recursive: true });

const cut = await sharp(await image.clone().removeAlpha().png().toBuffer())
  .ensureAlpha()
  .joinChannel(await sharp(alpha, { raw: { width: W, height: H, channels: 1 } }).png().toBuffer())
  .png()
  .toBuffer();

// Trim the transparent margin so the logo's own box is the logo, and layout
// does not have to compensate for whitespace baked into the file.
const trimmed = await sharp(cut).trim({ threshold: 1 }).toBuffer();
const meta = await sharp(trimmed).metadata();
console.log(`trimmed to ${meta.width}x${meta.height}`);

await writeFile(`${OUT_DIR}/logo.png`, trimmed);
console.log(`wrote ${OUT_DIR}/logo.png`);
