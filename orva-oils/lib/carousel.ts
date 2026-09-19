// Homepage carousel lives in site_settings as carousel_<n>_image / carousel_<n>_caption.
export const CAROUSEL_SLOTS = 5;

export interface CarouselSlot { slot: number; image: string; caption: string; }

export function readCarouselSlots(rows: { key: string; value: string }[]): CarouselSlot[] {
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  return Array.from({ length: CAROUSEL_SLOTS }, (_, i) => ({
    slot: i + 1,
    image: byKey.get(`carousel_${i + 1}_image`)?.trim() ?? '',
    caption: byKey.get(`carousel_${i + 1}_caption`)?.trim() ?? '',
  }));
}

// Slots without an image are skipped on the storefront.
export function activeSlides(rows: { key: string; value: string }[]): CarouselSlot[] {
  return readCarouselSlots(rows).filter((s) => s.image);
}
