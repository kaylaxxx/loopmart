// LoopMart closed loop — the agent half of "agent <-> Kane".
//
//   start app -> verify (Kane CLI, or the local engine) -> parse verdict
//   -> if failed: diagnose from the arithmetic -> patch -> verify again
//   -> if passed: stamp VERIFIED.md and write the loop report.
//
// Usage:
//   node agent/loop.mjs --engine local   (default; no credentials needed)
//   node agent/loop.mjs --engine kane    (real Kane CLI, needs login)
// Exit codes: 0 verified, 1 failed and unfixable, 2 verifier never started.
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { verifyLocal } from "./local-verify.mjs";
import { verifyKane } from "./kane.mjs";
import { diagnose } from "./diagnose.mjs";
import { applyFix } from "./fix.mjs";

const engine = (process.argv.find((a) => a.startsWith("--engine"))?.split("=")[1])
  || (process.argv.includes("--engine") ? process.argv[process.argv.indexOf("--engine") + 1] : null)
  || "local";
const MAX_ITERATIONS = 3;
const BASE = "http://localhost:4173";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const runDir = new URL(`../runs/${stamp}/`, import.meta.url);
await mkdir(runDir, { recursive: true });
await mkdir(new URL("../runs/", import.meta.url), { recursive: true });

const server = spawn("node", ["server.mjs"], {
  cwd: new URL("..", import.meta.url).pathname,
  env: { ...process.env, PORT: "4173" },
  stdio: "ignore",
});

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(BASE); if (r.ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("server did not come up");
}

const iterations = [];
let exitCode = 1;
try {
  await waitForServer();
  for (let n = 1; n <= MAX_ITERATIONS; n++) {
    const verdict = engine === "kane" ? await verifyKane(BASE) : await verifyLocal(BASE);
    const record = { iteration: n, engine, verdict, diagnosis: [], fix: null };
    iterations.push(record);
    await writeFile(new URL(`iter-${n}.json`, runDir), JSON.stringify(record, null, 2));
    console.log(`[loop] iteration ${n} (${engine}): ${verdict.status} — ${verdict.summary}`);

    if (verdict.status === "passed") {
      exitCode = 0;
      await writeFile(new URL("../VERIFIED.md", import.meta.url),
        `# LoopMart — verification status\n\n` +
        (engine === "kane"
          ? `Verified with Kane CLI on ${new Date().toISOString()} after ${n} iteration(s).\n\n`
          : `Passed the local verification engine on ${new Date().toISOString()} after ${n} iteration(s). ` +
            `The local engine speaks the same verdict shape as Kane Agent Mode; the real Kane CLI run ` +
            `(npm run loop:kane) replaces it as soon as Kane login is configured, and only that run earns the "Verified with Kane CLI" claim.\n\n`) +
        `Kane scenario: 2x Ceramic Mug + 1x Linen Notebook, promo SAVE10 -> total $37.79.\n` +
        `Run evidence: runs/${stamp}/\n`);
      break;
    }
    if (verdict.status === "not_started") {
      exitCode = 2;
      console.log(`[loop] verifier never started: ${verdict.stderr_tail || verdict.summary}`);
      break;
    }
    record.diagnosis = diagnose(verdict);
    for (const d of record.diagnosis) console.log(`[loop] diagnosis: ${d.code} — ${d.detail}`);
    if (n === MAX_ITERATIONS) break;
    record.fix = await applyFix(record.diagnosis);
    console.log(`[loop] fix: ${record.fix.description}`);
    await writeFile(new URL(`iter-${n}.json`, runDir), JSON.stringify(record, null, 2));
    if (!record.fix.patched) break;
  }
} finally {
  server.kill();
  const lines = [
    `# Loop report — ${stamp}`,
    ``,
    `Engine: ${engine} · Result: ${exitCode === 0 ? "VERIFIED" : exitCode === 2 ? "VERIFIER NOT STARTED" : "FAILED"}`,
    ``,
    ...iterations.flatMap((r) => [
      `## Iteration ${r.iteration} — ${r.verdict.status}`,
      ``,
      `${r.verdict.summary}`,
      ...(r.diagnosis || []).map((d) => `- Diagnosis ${d.code}: ${d.detail}`),
      ...(r.fix ? [`- Fix: ${r.fix.description}`] : []),
      ``,
    ]),
  ];
  await writeFile(new URL("loop-report.md", runDir), lines.join("\n"));
  console.log(`[loop] report: runs/${stamp}/loop-report.md`);
}
process.exitCode = exitCode;
