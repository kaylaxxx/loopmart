// LoopMart pricing engine — the single source of truth for cart maths.
// The browser UI and the verification engines both import this module,
// so a bug here is exactly the bug a shopper (and Kane) sees on the page.

export const TAX_RATE = 0.08;
export const FREE_SHIPPING_THRESHOLD = 75;
export const FLAT_SHIPPING = 4.99;

export const PROMOS = {
  SAVE10: 0.1,
  STUDENT15: 0.15,
};

export function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function formatUSD(n) {
  return `$${n.toFixed(2)}`;
}

// items: [{ price, qty }]
export function cartTotals(items, promoCode = "") {
  const subtotal = round2(
    items.reduce((sum, it) => sum + it.price * it.qty, 0),
  );
  const rate = PROMOS[promoCode] ?? 0;
  const discount = round2(subtotal * rate);
  const taxable = round2(subtotal - discount);
  const tax = round2(taxable * TAX_RATE);
  const shipping =
    subtotal === 0 || taxable >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;
  const total = round2(taxable - discount + tax + shipping);
  return { subtotal, discount, taxable, tax, shipping, total };
}
