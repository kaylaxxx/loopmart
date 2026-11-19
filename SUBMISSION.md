# Submission pack — TestMu AI Kane CLI Hackathon
Deadline: 26 Nov 2026 23:59 IST = 27 Nov 01:29 WIB
Form: https://www.surveymonkey.com/r/kane-cli-hackathon-submission

## One-paragraph description (for the form)

LoopMart is a zero-dependency mini store with a pricing engine, built to
prove one idea: verification should talk back. An agent builds the store,
Kane CLI tests it in a real browser from a single plain-English objective
(add two mugs and a notebook, apply SAVE10, extract five totals, assert
$37.79), and the verdict returns as structured NDJSON. When Kane fails the
run, the agent does not just go red — it diagnoses the failure from its
own arithmetic (the total was exactly one discount too low, so the
discount was being subtracted twice), patches the single wrong
expression, and runs Kane again until it passes. The whole conversation —
failed verdict, diagnosis, patch, passing re-run — is preserved in the
repo's git history and in runs/ as evidence.

## Live / runnable

- Repo: PENDING — push to github.com/kaylaxxx/loopmart (public, init 19 Nov 2026)
- Run: `npm start` → http://localhost:4173 (Node 18+, zero deps, < 5 s)
- Loop (no credentials): `npm run loop`
- Loop (real Kane): `npm run loop:kane` after `kane-cli login`

## Video demo plan (YouTube, Unlisted, aim 2:45 — judges stop at 3:00)

1. 0:00–0:20 — Hook: "My agent built a store. Kane caught it lying about
   the total. Then the agent fixed itself." Show cart at $34.41 (buggy
   commit checked out).
2. 0:20–1:00 — The store + the objective: show agent/objective.txt, run
   `npm run loop:kane`, Kane drives Chrome: adds items, applies SAVE10,
   extracts totals, assertion FAILS at $34.41 vs $37.79.
3. 1:00–1:50 — The loop talks back: terminal shows diagnosis
   DISCOUNT_APPLIED_TWICE (delta = exactly −$3.38), the one-line patch
   in src/pricing.mjs, git diff.
4. 1:50–2:30 — Re-run: Kane passes, total $37.79, VERIFIED.md stamped,
   loop-report.md shown. Unit tests 4/4.
5. 2:30–2:45 — Close: architecture diagram (agent ⇄ Kane NDJSON loop),
   repo URL.

Recording needs: Kane login done + Chrome available for the real Kane
run. Fallback if Kane run is blocked on recording day: record with the
local engine and label it honestly as the local engine, then swap in
the Kane footage before submitting.

## Two public posts (required — draft, posting is the user's step)

Post 1 (X, on launch of the public repo):
"Built a store with an agent. Verified it with @testmuai Kane CLI. Kane
failed my checkout — total was $34.41, should be $37.79 — so the agent
diagnosed its own bug from the numbers, patched one line, and passed
the re-run. The whole loop is in the git history: [repo] #KaneCLI"

Post 2 (X or LinkedIn, after the Kane run passes):
"The interesting part of LoopMart isn't the store. It's the contract:
Kane speaks NDJSON, the agent speaks patches. run_end → diagnosis →
one-expression fix → run_end: passed. Evidence pack, loop report and
all: [repo]"

## Checklist before submit

- [ ] Kane login (username + access key) and `npm run loop:kane` PASSED,
      evidence pack + Test Manager link saved under runs/
- [ ] Public GitHub repo pushed (init date ≥ 12 Nov 2026 ✓ — 19 Nov)
- [ ] README setup verified from a clean clone (npm start, npm test)
- [ ] Video uploaded (Unlisted), ≤ 5 min, Kane footage real
- [ ] 2 public posts live, links saved here
- [ ] Form submitted before 27 Nov 01:29 WIB
