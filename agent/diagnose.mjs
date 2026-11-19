// Diagnosis — compares a failed verdict against the spec, component by
// component, and names the fault pattern. This is the "Kane talks back"
// half of the loop: a failed assertion is not just red, it is arithmetic,
// and the arithmetic points at the broken component.

const COMPONENTS = ["subtotal", "discount", "taxable", "tax", "shipping", "total"];
const cents = (n) => Math.round(n * 100);

export function diagnose(verdict) {
  const out = [];
  for (const f of verdict.failures || []) {
    if (!f.expected || !f.actual) {
      out.push({ code: "UNSTRUCTURED_FAILURE", scenario: f.scenario, detail: f.remark });
      continue;
    }
    const off = COMPONENTS.filter((k) => cents(f.actual[k]) !== cents(f.expected[k]));
    if (off.length === 1 && off[0] === "total") {
      const delta = cents(f.actual.total) - cents(f.expected.total);
      if (f.expected.discount > 0 && delta === -cents(f.expected.discount)) {
        out.push({
          code: "DISCOUNT_APPLIED_TWICE",
          scenario: f.scenario,
          detail: `Total is exactly one discount (${f.expected.discount}) too low while subtotal, discount, tax and shipping are all correct: the discount is subtracted a second time inside the total formula.`,
        });
      } else {
        out.push({
          code: "TOTAL_FORMULA",
          scenario: f.scenario,
          detail: `Only the total is off (delta ${delta / 100}); every component is correct, so the total formula itself is wrong. Spec: total = taxable + tax + shipping.`,
        });
      }
    } else {
      out.push({
        code: "COMPONENT_MISMATCH",
        scenario: f.scenario,
        detail: `Components off: ${off.join(", ")}`,
        components: off,
      });
    }
  }
  return out;
}
