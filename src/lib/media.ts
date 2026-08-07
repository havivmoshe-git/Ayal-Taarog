import type { GalleryImage } from '../content/schema';

/**
 * Resolves an image reference to a URL.
 *
 * Three kinds coexist, and callers should not have to care which is which:
 *
 * - A slug, for photographs shipped with the build and served from
 *   `public/gallery/` — `hall-shabbat-meal` becomes `…/hall-shabbat-meal-sm.webp`.
 * - An upload base, for pictures added through the panel. The panel stores both
 *   sizes side by side and keeps the shared prefix, so a `-sm`/`-lg` pair
 *   resolves exactly like a bundled slug does. Without this an uploaded photo
 *   would serve its 1600px copy to every phone, and the small file the panel
 *   had already produced and paid to upload would never be used.
 * - A complete URL ending in an image extension, for a link pasted by hand.
 *   Used as-is; there is no second size to reach for.
 */
export function mediaUrl(ref: string | undefined, size: 'sm' | 'lg'): string {
  if (!ref) return '';
  if (/^https?:\/\//.test(ref)) {
    return /\.(webp|avif|jpe?g|png|gif|svg)$/i.test(ref) ? ref : `${ref}-${size}.webp`;
  }
  return `${import.meta.env.BASE_URL}gallery/${ref}-${size}.webp`;
}

export function imageSrc(image: Pick<GalleryImage, 'slug' | 'urlSmall' | 'urlLarge'>, size: 'sm' | 'lg'): string {
  const uploaded = size === 'sm' ? image.urlSmall : image.urlLarge;
  if (uploaded) return uploaded;
  return mediaUrl(image.slug, size);
}

/** Public URL for a file under `public/`, respecting the GitHub Pages base path. */
export function assetUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}
