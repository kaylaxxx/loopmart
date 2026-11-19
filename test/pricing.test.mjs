import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { cartTotals } from "../src/pricing.mjs";

const spec = JSON.parse(
  await readFile(new URL("../spec/pricing.spec.json", import.meta.url)),
);

for (const s of spec.scenarios) {
  test(s.label, () => {
    assert.deepEqual(cartTotals(s.items, s.promo), s.expected);
  });
}
