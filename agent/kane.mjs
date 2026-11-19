// Kane CLI engine — runs the real Kane CLI in Agent Mode and normalises
// its NDJSON stream into the same verdict shape as the local engine.
// Contract (from the official Kane CLI Agent Mode docs):
//   kane-cli run "<objective>" --url <url> --headless --agent
//   stdout = NDJSON, one JSON object per line; last line type "run_end"
//   carries status "passed" | "failed", summary, final_state, credits.
//   Exit codes: 0 passed, 1 did not pass, 2 run never started
//   (auth / config / no URL / no Chrome), 3 cancelled or timeout.
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

function kaneBinary() {
  if (process.env.KANE_CLI) return process.env.KANE_CLI;
  const persistent = join(homedir(), ".local", "bin", "kane-cli");
  return existsSync(persistent) ? persistent : "kane-cli";
}

export async function verifyKane(baseUrl = "http://localhost:4173") {
  const objective = (
    await readFile(new URL("./objective.txt", import.meta.url), "utf8")
  ).trim();

  const { code, stdout, stderr } = await new Promise((resolve) => {
    const child = spawn(
      kaneBinary(),
      ["run", objective, "--url", baseUrl, "--headless", "--agent"],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let stdout = "", stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", (err) => resolve({ code: 2, stdout, stderr: String(err) }));
    child.on("close", (code) => resolve({ code, stdout, stderr }));
    setTimeout(() => child.kill("SIGTERM"), 10 * 60 * 1000);
  });

  const lines = stdout.split("\n").filter(Boolean).flatMap((l) => {
    try { return [JSON.parse(l)]; } catch { return []; }
  });
  const runEnd = [...lines].reverse().find((l) => l.type === "run_end");
  const failedSteps = lines
    .filter((l) => l.status === "failed")
    .map((l) => ({ step: l.step, remark: l.remark || "step failed" }));

  if (code === 2 || !runEnd) {
    return {
      engine: "kane",
      status: "not_started",
      exitCode: code,
      summary:
        "Kane run never started (exit 2): sign-in, configuration, or Chrome is missing. No credits are used for a refused run.",
      stderr_tail: stderr.slice(-800),
      steps: [],
      failures: [],
      final_state: null,
    };
  }
  return {
    engine: "kane",
    status: runEnd.status,
    exitCode: code,
    summary: runEnd.summary || runEnd.one_liner || "",
    credits_consumed: runEnd.credits_consumed ?? null,
    test_url: runEnd.test_url ?? null,
    session_dir: runEnd.session_dir ?? null,
    final_state: runEnd.final_state ?? null,
    steps: lines
      .filter((l) => l.status)
      .map((l) => ({ step: l.step, status: l.status === "done" ? "done" : l.status, remark: l.remark || "" })),
    failures: failedSteps.map((f) => ({ scenario: "kane-checkout", remark: f.remark })),
  };
}
