/**
 * Turns the raw photos in assets/source/ into the responsive WebP set the site
 * actually ships. The originals are ~3MB total at full camera resolution, which
 * is far too heavy for a page most visitors open on 4G from a WhatsApp link.
 *
 * For each source image we emit:
 *   <name>-sm.webp   600px wide  — grid thumbnails on phones
 *   <name>-lg.webp  1600px wide  — lightbox and the hero
 *
 * Plus a single og-image.jpg at 1200x630 for the WhatsApp/social preview card
 * (JPEG, because some scrapers still refuse WebP).
 *
 * Run with: npm run images
 */
import { readdir, mkdir, rm } from 'node:fs/promises';
import { join, parse } from 'node:path';
import sharp from 'sharp';

const SOURCE_DIR = 'assets/source';
const OUT_DIR = 'public/gallery';
const OG_SOURCE = 'hall-tables-set.jpg';

const VARIANTS = [
  { suffix: 'sm', width: 600, quality: 72 },
  { suffix: 'lg', width: 1600, quality: 80 },
];

/**
 * The floorplan is dense Hebrew text and line art, not a photograph. At q72
 * WebP smears small letterforms into mush, and the whole point of opening it
 * is to read it — so it keeps full resolution and a much higher quality. The
 * extra weight is fine: it loads only on demand.
 */
const TEXT_HEAVY = new Set(['floorplan']);

const TEXT_VARIANTS = [
  { suffix: 'sm', width: 900, quality: 86 },
  { suffix: 'lg', width: 2000, quality: 90 },
];

await rm(OUT_DIR, { recursive: true, force: true });
await mkdir(OUT_DIR, { recursive: true });

const files = (await readdir(SOURCE_DIR)).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();

if (files.length === 0) {
  console.error(`No source images found in ${SOURCE_DIR}`);
  process.exit(1);
}

let totalBytes = 0;

for (const file of files) {
  const { name } = parse(file);
  const input = join(SOURCE_DIR, file);

  for (const { suffix, width, quality } of TEXT_HEAVY.has(name) ? TEXT_VARIANTS : VARIANTS) {
    const output = join(OUT_DIR, `${name}-${suffix}.webp`);
    const info = await sharp(input)
      .rotate() // honour EXIF orientation before we strip metadata
      .resize({ width, withoutEnlargement: true })
      .webp({ quality, effort: 5 })
      .toFile(output);

    totalBytes += info.size;
    console.log(`  ${output.padEnd(48)} ${String(info.width).padStart(5)}px  ${(info.size / 1024).toFixed(0)}KB`);
  }
}

// Social preview card: fixed 1200x630, cropped to the centre of the frame.
const ogInfo = await sharp(join(SOURCE_DIR, OG_SOURCE))
  .rotate()
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(join(OUT_DIR, 'og-image.jpg'));

totalBytes += ogInfo.size;

console.log(`\n${files.length} images → ${files.length * VARIANTS.length + 1} files, ${(totalBytes / 1024 / 1024).toFixed(2)}MB total`);
