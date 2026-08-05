/**
 * Shrinks a picked photo in the browser before upload.
 *
 * Mirrors what `scripts/optimize-images.mjs` does at build time — two WebP
 * sizes, same widths — so an uploaded photo behaves exactly like a bundled
 * one. Doing it here means a 6MB phone photo never crosses the network, which
 * matters when the person adding it is standing in the venue on cellular.
 */

const LARGE_WIDTH = 1600;
const SMALL_WIDTH = 600;
const LARGE_QUALITY = 0.8;
const SMALL_QUALITY = 0.72;

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    // Honours EXIF orientation, so photos taken sideways come out upright.
    return createImageBitmap(file, { imageOrientation: 'from-image' });
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('לא ניתן לקרוא את התמונה'));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function draw(
  source: ImageBitmap | HTMLImageElement,
  width: number,
  quality: number,
): Promise<Blob> {
  const sw = 'width' in source ? source.width : 0;
  const sh = 'height' in source ? source.height : 0;
  // Never upscale — a small original stays small.
  const targetWidth = Math.min(width, sw);
  const targetHeight = Math.round((sh / sw) * targetWidth);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('הדפדפן לא תומך בעיבוד תמונה');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('המרת התמונה נכשלה'))),
      'image/webp',
      quality,
    );
  });
}

export async function resizeForUpload(file: File): Promise<{ large: Blob; small: Blob }> {
  if (!file.type.startsWith('image/')) {
    throw new Error('אפשר להעלות רק קובצי תמונה');
  }

  const source = await loadBitmap(file);
  try {
    const [large, small] = await Promise.all([
      draw(source, LARGE_WIDTH, LARGE_QUALITY),
      draw(source, SMALL_WIDTH, SMALL_QUALITY),
    ]);
    return { large, small };
  } finally {
    if ('close' in source) source.close();
  }
}
