# Loop report — 2026-11-19T10-34-05-832Z

Engine: local · Result: VERIFIED

## Iteration 1 — failed

2 check(s) failed. First: kane-checkout: expected total $37.79, page pricing gives $34.41
- Diagnosis DISCOUNT_APPLIED_TWICE: Total is exactly one discount (3.38) too low while subtotal, discount, tax and shipping are all correct: the discount is subtracted a second time inside the total formula.
- Diagnosis DISCOUNT_APPLIED_TWICE: Total is exactly one discount (7.5) too low while subtotal, discount, tax and shipping are all correct: the discount is subtracted a second time inside the total formula.
- Fix: Patched src/pricing.mjs for DISCOUNT_APPLIED_TWICE: total = round2(taxable + tax + shipping) — the discount is already inside 'taxable', so it must not be subtracted again.

## Iteration 2 — passed

All pricing scenarios match the spec and the page loads.
