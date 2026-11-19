# LoopMart

**Built by an agent. Verified by Kane. Fixed by the loop.**

LoopMart is a tiny zero-dependency store with a pricing engine — and an
agent loop around it that treats verification as a conversation, not a
gate screenshot. The agent builds the store, Kane CLI tests it in a real
browser from a plain-English objective, the verdict comes back as
structured NDJSON, the agent diagnoses the failure *from its own
arithmetic*, patches the code, and runs Kane again — until it passes.

## The story in this repo's history

1. `feat:` — the store ships with a real pricing bug: the promo discount
   is subtracted **twice** in the total. A cart of 2× Ceramic Mug +
   1× Linen Notebook with promo `SAVE10` shows **$34.41** instead of
   **$37.79**. Every other component (subtotal, discount, tax, shipping)
   is correct — only the total lies.
2. The loop runs verification. Iteration 1 **fails** with exactly that
   $3.38 gap (= one discount, to the cent). Diagnosis:
   `DISCOUNT_APPLIED_TWICE`. The agent patches one expression in
   `src/pricing.mjs`. Iteration 2 **passes**.
   Evidence: `runs/2026-11-19T10-34-05-832Z/loop-report.md`.
3. `fix:` — that repair, committed with the loop's evidence attached.

## Run it (< 30 seconds, no install)

```bash
npm start            # http://localhost:4173 — Node 18+, zero dependencies
```

Try it: add 2× Ceramic Mug and 1× Linen Notebook, apply promo `SAVE10`,
and check the total is **$37.79** (subtotal $33.75 − discount $3.38 +
tax $2.43 + shipping $4.99).

## Run the loop

```bash
npm run loop         # local engine — same verdict shape, no credentials
npm run loop:kane    # real Kane CLI in Agent Mode (needs `kane-cli login`)
npm test             # pricing spec as unit tests (node:test)
```

The Kane objective lives in `agent/objective.txt` — one plain-English
paragraph that clicks, types, extracts five values with `store … as`,
and ends in an assertion on the total, exactly as the Kane docs
prescribe. The Kane engine (`agent/kane.mjs`) parses the Agent Mode
NDJSON stream, reads the `run_end` event, and normalises it into the
same verdict shape the local engine produces — so the loop's diagnose →
fix → re-verify cycle is identical whichever engine ran. A Kane run
that never starts (exit code 2: sign-in, config, or Chrome missing)
stops the loop cleanly instead of patching blindly.

## How the loop works

| Step | File | What happens |
| --- | --- | --- |
| Verify | `agent/kane.mjs` / `agent/local-verify.mjs` | Run the objective, return `{status, steps, final_state, failures}` |
| Diagnose | `agent/diagnose.mjs` | Compare components against `spec/pricing.spec.json`; a total off by exactly −discount with all components correct is `DISCOUNT_APPLIED_TWICE` |
| Fix | `agent/fix.mjs` | Minimal, recognised patches only — it rewrites the one wrong expression and refuses anything else |
| Re-verify | `agent/loop.mjs` | Fresh verification after every patch (the pricing module is imported cache-busted — a stale ESM cache once hid the fix, and the loop now proves that lesson in a comment) |

## Layout

```
server.mjs            zero-dependency static server (port 4173)
public/               store UI (vanilla HTML/CSS/JS)
src/pricing.mjs       pricing engine — the module the UI and verifiers share
spec/                 human-written pricing spec (source of truth)
test/                 spec as unit tests
agent/                objective, engines, diagnosis, fix, loop orchestrator
runs/                 per-run evidence: iteration verdicts + loop report
VERIFIED.md           current verification status, stamped by the loop
```

## Pricing rules (the spec)

Total = (subtotal − discount) + tax + shipping. Tax is 8% of the
discounted subtotal. Shipping is $4.99, free at $75+ after discount.
Promos: `SAVE10` = 10%, `STUDENT15` = 15%. The discount applies
**exactly once** — that is the rule the bug broke, and the rule the
loop now defends.

## Status

Local loop: **VERIFIED** (2 iterations, 2026-11-19). Kane CLI run:
pending Kane login on this machine (OAuth needs a local browser; the
username + access-key login is the remaining step), then
`npm run loop:kane` produces the real Kane evidence pack and Test
Manager link. See `VERIFIED.md`.

Built for the TestMu AI Kane CLI Hackathon (deadline 26 Nov 2026).
