export const STATUS_SEQUENCE = ['paid', 'confirmed', 'out_for_delivery', 'delivered'] as const;
export type OrderStatus = typeof STATUS_SEQUENCE[number] | 'pending' | 'cancelled';

export function isValidTransition(current: string, next: string): boolean {
  const currentIdx = STATUS_SEQUENCE.indexOf(current as any);
  const nextIdx = STATUS_SEQUENCE.indexOf(next as any);
  // Must be exactly one step forward in the sequence (INV-07)
  return currentIdx !== -1 && nextIdx === currentIdx + 1;
}
