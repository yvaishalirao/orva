export type DiscountType = 'percent' | 'fixed';

export function calculateDiscountAmount(subtotal: number, type: DiscountType, value: number): number {
  return type === 'percent' ? subtotal * (value / 100) : value;
}

// INV-08: discount can never take the total below zero
export function applyDiscount(subtotal: number, type: DiscountType, value: number): number {
  return Math.max(0, subtotal - calculateDiscountAmount(subtotal, type, value));
}
