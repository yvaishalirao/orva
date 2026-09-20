const STEPS = ['Bag', 'Address', 'Payment'] as const;

// current: 1 = Bag, 2 = Address, 3 = Payment
export default function CheckoutSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="flex items-center justify-center gap-2 sm:gap-4 text-[11px] font-bold uppercase tracking-[0.18em] mb-10" aria-label="Checkout progress">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li key={label} className="flex items-center gap-2 sm:gap-4" aria-current={active ? 'step' : undefined}>
            <span className={active ? 'text-primary' : done ? 'text-primary-container' : 'text-on-surface-variant/50'}>
              {done ? '✓ ' : ''}{label}
            </span>
            {n < STEPS.length && (
              <span aria-hidden="true" className={`w-6 sm:w-14 h-px ${done ? 'bg-primary-container' : 'bg-outline-variant'}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
