import type { GalleryImage } from '../content/schema';

/**
 * Resolves an image reference to a URL.
 *
 * Two kinds coexist: photographs shipped with the build, referenced by slug and
 * served from `public/gallery/`, and pictures uploaded through the admin panel,
 * which carry absolute URLs. Callers should not have to care which is which.
 */
export function mediaUrl(ref: string | undefined, size: 'sm' | 'lg'): string {
  if (!ref) return '';
  if (/^https?:\/\//.test(ref)) return ref;
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
