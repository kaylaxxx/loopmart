// Fix — applies the minimal patch for a diagnosed fault pattern.
// Deliberately narrow: it only rewrites the one wrong expression in the
// total formula, and refuses anything it does not recognise, so the loop
// can never "fix" a failure by rewriting the app around it.
import { readFile, writeFile } from "node:fs/promises";

const PRICING = new URL("../src/pricing.mjs", import.meta.url);
const BUGGY = "round2(taxable - discount + tax + shipping)";
const CORRECT = "round2(taxable + tax + shipping)";

export async function applyFix(diagnoses) {
  const fixable = diagnoses.find((d) =>
    ["DISCOUNT_APPLIED_TWICE", "TOTAL_FORMULA"].includes(d.code),
  );
  if (!fixable) {
    return { patched: false, description: "No recognised fixable diagnosis; refusing to patch blindly." };
  }
  const source = await readFile(PRICING, "utf8");
  if (source.includes(CORRECT) && !source.includes(BUGGY)) {
    return { patched: false, description: "Pricing total formula is already correct; nothing to patch." };
  }
  if (!source.includes(BUGGY)) {
    return { patched: false, description: "Expected buggy expression not found in src/pricing.mjs; refusing to guess." };
  }
  await writeFile(PRICING, source.replace(BUGGY, CORRECT));
  return {
    patched: true,
    description: `Patched src/pricing.mjs for ${fixable.code}: total = ${CORRECT} — the discount is already inside 'taxable', so it must not be subtracted again.`,
  };
}
