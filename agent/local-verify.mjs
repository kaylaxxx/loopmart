// Local verification engine — a browser-less stand-in for Kane CLI that
// speaks the same verdict shape (status, steps, final_state, failures).
// It verifies two things, honestly:
//   1. The store page actually loads over HTTP and exposes the cart UI hooks.
//   2. The pricing module the page imports produces spec-correct totals
//      for every scenario in spec/pricing.spec.json.
// When Kane login is available, `agent/loop.mjs --engine kane` runs the
// real Kane CLI instead; this engine exists so the loop can be built and
// demonstrated before credentials are in place, and as a CI fallback.
import { readFile } from "node:fs/promises";

// NOTE: pricing is imported fresh inside verifyLocal() on every call,
// with a cache-busting query. The loop patches src/pricing.mjs on disk
// between iterations; a static import would keep serving the buggy
// module from the ESM cache and the fix would never be seen.

const spec = JSON.parse(
  await readFile(new URL("../spec/pricing.spec.json", import.meta.url)),
);

function sameTotals(a, b) {
  return ["subtotal", "discount", "taxable", "tax", "shipping", "total"].every(
    (k) => a[k] === b[k],
  );
}

export async function verifyLocal(baseUrl = "http://localhost:4173") {
  const { cartTotals, formatUSD } = await import(
    new URL(`../src/pricing.mjs?run=${Date.now()}`, import.meta.url)
  );
  const steps = [];
  const failures = [];

  const page = await fetch(baseUrl).then((r) => r.text());
  const hooks = ["products", "promo", "subtotal", "discount", "tax", "shipping", "total", "checkout"];
  const missing = hooks.filter((h) => !page.includes(`id="${h}"`));
  steps.push({
    step: 1,
    status: missing.length === 0 ? "done" : "failed",
    remark:
      missing.length === 0
        ? "Store page loads and exposes all cart UI hooks"
        : `Store page is missing UI hooks: ${missing.join(", ")}`,
  });
  if (missing.length) {
    failures.push({ scenario: "page", remark: steps[0].remark });
  }

  let kaneFinalState = null;
  spec.scenarios.forEach((s, i) => {
    const actual = cartTotals(s.items, s.promo);
    const ok = sameTotals(actual, s.expected);
    steps.push({
      step: i + 2,
      status: ok ? "done" : "failed",
      remark: ok
        ? `${s.id}: total ${formatUSD(actual.total)} matches spec`
        : `${s.id}: expected total ${formatUSD(s.expected.total)}, page pricing gives ${formatUSD(actual.total)}`,
    });
    if (!ok) {
      failures.push({ scenario: s.id, expected: s.expected, actual, remark: steps.at(-1).remark });
    }
    if (s.id === "kane-checkout") {
      kaneFinalState = {
        subtotal: formatUSD(actual.subtotal),
        discount: formatUSD(actual.discount),
        tax: formatUSD(actual.tax),
        shipping: formatUSD(actual.shipping),
        total: formatUSD(actual.total),
      };
    }
  });

  return {
    engine: "local",
    status: failures.length === 0 ? "passed" : "failed",
    summary:
      failures.length === 0
        ? "All pricing scenarios match the spec and the page loads."
        : `${failures.length} check(s) failed. First: ${failures[0].remark}`,
    final_state: kaneFinalState,
    steps,
    failures,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { spawn } = await import("node:child_process");
  const server = spawn("node", ["server.mjs"], {
    cwd: new URL("..", import.meta.url).pathname,
    env: { ...process.env, PORT: "4173" },
    stdio: "ignore",
  });
  try {
    for (let i = 0; i < 50; i++) {
      try { await fetch("http://localhost:4173"); break; }
      catch { await new Promise((r) => setTimeout(r, 100)); }
    }
    const verdict = await verifyLocal();
    console.log(JSON.stringify({ v: 1, type: "stream_start", surface: "run", engine: "local" }));
    for (const s of verdict.steps) console.log(JSON.stringify({ v: 1, ...s }));
    console.log(JSON.stringify({
      v: 1, type: "run_end", status: verdict.status,
      summary: verdict.summary, final_state: verdict.final_state,
    }));
    process.exitCode = verdict.status === "passed" ? 0 : 1;
  } finally {
    server.kill();
  }
}
