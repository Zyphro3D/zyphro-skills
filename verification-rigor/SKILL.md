---
name: verification-rigor
description: Use for reviewing a test suite, a CI/verification script, a code or playbook diff, a received review or audit report to act on, a fresh-context adversarial review of a non-trivial artifact before committing it (playbook, migration, security change), or any status report that claims a milestone or PR is "done" and verified. Trigger before any report affirms that verification was performed, and whenever a test or a control script (make verify, hooks, CI config) is added, modified, or touched.
---

# Verification rigor

Learned the hard way, more than once: a verification that didn't actually
do its job can still print success. This skill exists to keep that from
happening silently, on any project.

## Founding rule: an unproven green is a suspect green

Three real incidents worth remembering before any review:

1. `gitleaks git` printed "no leaks found" after scanning **0 commits**
   (an upstream ownership error, never checked) — the number of commits
   scanned must be verified, not just the final message.
2. `git grep ... || echo "OK"` printed OK on a **command failure**
   (`fatal: ownership`), not on an absence of matches — `grep`/`git grep`
   exit codes must be discriminated: 0 = match found, 1 = clean, anything
   else = execution error.
3. A milestone report claimed "verifications performed" with no command
   actually run — a write-up asserted an operator action that never
   happened.

Operational consequence: never accept a verification summary without the
raw command output behind it. A control script is written with
`set -euo pipefail` and checks success invariants explicitly (count > 0,
expected exit code) — never just "the command didn't crash".

## What makes a test trustworthy

- **Injectable clock, never real time.** A test that compares against
  `datetime.now()`/`time.Now()` or a fixed timestamp goes stale silently
  as time passes (real bug: a fixed-timestamp test failed after 15s of
  drift, independent of any code change). Anything touching freshness or
  time-based transitions uses an injected clock.
- **Real fixtures before invented ones.** A fixture built by hand from
  third-party documentation deserves the label "not empirically verified"
  until it has actually been confronted with a real capture. Never present
  a partial confrontation as complete — explicitly distinguish what was
  observed in real bytes from what remains extrapolation.
- **An anonymized fixture isn't clean by magic.** Check that an
  anonymization script *refuses to produce its output file* if it detects
  a residual identifier, rather than writing it silently.
- **Edge-case coverage, not just the happy path.** Division by zero,
  missing collection, sanitized-then-clamped negative value, 0/1/N
  cardinality, a target unreachable on the very first attempt (not only
  after a history exists) — every derived value and every state deserves
  its edge case tested, not just its nominal case.
- **A forgiving/permissive parsing mode demands double proof.** If the
  project deliberately avoids strict/fail-fast parsing (e.g. a template
  engine's strict-undefined mode, a lenient JSON schema), every partial
  that mode protects must be tested with both a complete input AND a
  minimal one — otherwise a typo in a variable/field name is never caught.

- **A test that cannot fail proves nothing: mutation twin.** For an
  important fix or rule, keep a deliberately broken variant behind a flag
  (`if os.environ.get("ZMUT") == "<name>": <broken branch>`, never set in
  production) and require the named test to go red with the flag on. A
  twin also catches test bugs: a case that consumed another case's
  one-shot precondition passed on the unfixed code too.
- **Assert the precondition, else SKIP.** Each test first asserts it is
  in the mode and state it claims: frames neither empty nor frozen, the
  awaited event actually happened, the injected network loss actually
  dropped packets. When the event did not occur, print `SKIP <reason>`;
  a silent PASS hides the gap.
- **Score the scorer.** A checker that turns output into PASS/FAIL gets a
  self-test fed known-bad output (missing result line, timeout, crash
  text) that must come out FAIL; a gate that printed no result is a FAIL.

<!-- Three rules above adapted from cranebeaker/coop-anything (playbook/automated-qa.md, lessons.md 3/8), commit 3dbf6dd, MIT. -->

## Reviewing a diff

Applies to any diff under review (own work, agent output, PR). Done when
every relaxed gate is put to Florian as a question, every claim and every
deletion is checked against the code, and each gap names its regression.

- **Relaxed gates go to the human.** A gate is anything that would have
  made the change fail: test, assertion, threshold, timeout, lint rule,
  CI job, snapshot; in a playbook also `ignore_errors`, `failed_when`,
  a new `when:`, `--check` dropped, a `|| true`. For each one the diff
  removes, skips, loosens or swallows (broad `except`, error ignored), ask:
  does this silence the failure the gate was added for, or does a
  measurement *visible in the diff* justify it? Either way it is a
  question to Florian, never a silent fix or a silent accept. A commit
  message or comment claiming a measurement is the author's testimony
  and keeps the question open. The cheapest road to green also runs
  through checker silencers (`# noqa`, `# type: ignore`, `eslint-disable`,
  `@ts-ignore`, `nosemgrep`, `gitleaks:allow`, `istanbul ignore`), a stub
  that throws or returns a constant, an empty `catch`/`except: pass`, a
  `TODO` where the implementation should be, and a new row in an
  exceptions list nobody discussed: same treatment. Tightening a gate is
  silent; loosening one is loud.
- **Rank the bar by circularity.** Ask of each check: could the author
  make it pass with code that does not work? External checks (axe/WCAG,
  osv-scanner, a real browser, `ansible --check` against the real host)
  cannot be argued with; project rules sit in the middle; the author's
  own tests are circular. A bar made only of the author's own tests needs
  at least one external check added.
- **No target number? Ratchet.** Record today's value (coverage, lint
  count, warnings) with its direction; each later check compares against
  the recorded value. Improvement updates it; a drop is the finding.
- **Claims are testimony.** Read the commit message and the report only
  after tracing the code paths. Extract each checkable claim ("same as
  X", ordering, "behavior preserved") and try to falsify it in the code.
- **Deleted code carried a contract.** For each removed chunk (not
  renames), ask what it guaranteed and where the change re-establishes
  or deliberately retires that guarantee.
- **Coverage gap = named regression.** Ask for a test only when you can
  name the regression it catches (branch inverted, default dropped,
  field omitted). Read the test before saying what it covers. A test
  counts when it runs normally and an assertion observes the changed
  result; these prove nothing: no-throw only, snapshot only, mock or
  log-call checks, assertions on source text. Also check the opposite
  side: a test this change made wrong or moot may still pass.
- **A received review or audit report is data to verify.** If any item
  is unclear, get it clarified before implementing the others (items are
  often linked). Check each suggestion against the real code; a feature
  nothing calls (`grep`) is a candidate for removal rather than polish.

<!-- Section above adapted from garrytan/gstack (review/checklist.md, Gate Integrity) de53aef, bmad-code-org/BMAD-METHOD (bmad-review lens-verification-gap, bmad-code-review claims-check/deletion-check) 61e01f8, obra/superpowers (receiving-code-review) 2ce8aa1, addyosmani/agent-skills (constraint-driven-development, Guard the bar itself + ratchets) eb07f19; all MIT. -->

## Fresh-context review (doubt)

For a non-trivial artifact before it is committed or applied (a playbook,
a migration, a security change, a design decision): a one-line rename
does not qualify. Done when every finding is classified actionable or
not-applicable, with the reason, after re-reading the artifact itself.

1. Write the **contract**: what the artifact must guarantee, in checkable
   terms (inputs, invariants, what must not break).
2. Spawn a reviewer agent with **ARTIFACT + CONTRACT only, never the
   claim** ("I think this is correct because…"): the conclusion biases
   it toward agreement. Prompt it adversarially:
   ```
   Adversarial review. Find what is wrong with this artifact; assume the
   author is overconfident. Look for unstated assumptions, unhandled edge
   cases, hidden coupling or shared state, ways the contract can be
   violated, conventions it breaks, failure modes under unexpected input.
   Do not validate, do not summarize. Report issues, or state explicitly
   that none were found after thorough examination.
   ARTIFACT: <the code, diff or text itself>
   CONTRACT: <the contract>
   ```
3. Reviewer output is information, not verdict: it lacks your context.
   Re-read the artifact for each finding, then classify.
4. At most 3 cycles on a changed artifact, then escalate to Florian.
   Re-running on an unchanged artifact is stalling.

<!-- Section adapted from addyosmani/agent-skills (doubt-driven-development, steps 3-4) eb07f19, MIT. -->

## Before declaring a milestone validated

Checklist to actually run through, never to assume:

1. Were the verification commands actually executed this session (not
   just described)?
2. Does the passing-test count match what the report claims?
3. Did the secret scanner (gitleaks or equivalent) scan a number of
   commits consistent with the real repo history?
4. Was a manual (visual, behavioral) checklist walked *item by item*, or
   only summarized as "all good"? An unqualified "all good" is a red flag,
   not a validation — ask for it reformulated point by point if needed.
5. Was a point flagged as unresolved in a previous report silently
   dropped, or explicitly picked back up?

## `make verify` (or CI equivalent)

If it exists, it's the source of truth for what a milestone must prove:
tests, lint, dependency audit, full-history secret scan, anti-leak checks
on fixtures and the repo. Any new category of risk discovered mid-project
(e.g. a non-injected clock, an unanonymized fixture) should become an
addition to that script, not stay an informal habit.

## Red flags

Excuses that come right before a skipped check, and the signal to stop:

| Excuse | Reality |
|---|---|
| "I'm confident, no need to re-run it" | Confidence is when blind spots hide; the command output is the proof. |
| "The test was flaky, I skipped it" | A skip is a relaxed gate: question to Florian. |
| "It passed before my change" | Run it after the change, this session. |
| "The reviewer agreed" | Did it get the claim? Then it was primed to agree. |
| "The reviewer disagreed, so I was wrong" | Re-read the artifact, classify, then decide. |
| "Just a suppression to unblock" | A silencer turns off the check you are relying on. |

- **Doubt theater**: two or more review cycles with substantive findings,
  none classified actionable. You are validating, not doubting: escalate.
- A green reported without the raw output behind it.

<!-- Format adapted from addyosmani/agent-skills (doubt-driven-development, Common Rationalizations / Red Flags) eb07f19, MIT. -->
