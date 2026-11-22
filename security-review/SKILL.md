---
name: security-review
description: Anti-leak and hygiene review before a commit, push or publication: secrets and infrastructure topology (IPs, hostnames), gitleaks/dependency-audit checks, container hardening, or whenever a config file, fixture, screenshot or document might contain real infrastructure data. Trigger before every validation milestone and every push, especially on a repo that may become or already is public. Vulnerability hunting belongs to security-audit; the homelab fleet audit to homelab-audit-infra.
---

# Security review

## The real risk is usually topology, not secrets

On most personal/infra projects, the sources being queried carry almost no
application secrets. The real risk is **topology disclosure**: a real IP,
hostname, device GUID, or VPN name in a versioned file is a published,
indexable map of someone's infrastructure. Git history is final — every
commit is a one-way trip. Treat topology leaks with the same seriousness
as credential leaks, not as a lesser concern.

## Rule zero: a check that didn't actually run must never show green

Founding incidents (gitleaks scanning 0 commits, `|| echo OK` masking a
`git grep` failure): see `verification-rigor`. Consequences here:

- After `gitleaks git`, verify the number of commits scanned is strictly
  positive; zero commits scanned = audit failure, not a pass.
- For `git grep`, discriminate exit codes: 0 = match found (leak → fail),
  1 = nothing found (clean → pass), any other code = execution error
  (→ fail, never an OK).
- Every audit script is written with `set -euo pipefail`.

## Anti-leak battery

Run from the repo root (or via `make verify`/equivalent if it exists — that
script is the source of truth, this list is its minimum contract):

```bash
gitleaks git -v                     # FULL history; commits scanned > 0
pip-audit  # or the project's dependency-audit equivalent
grep -rEn "192\.168\.|\b10\.[0-9]+\.[0-9]+\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|\.(local|lan|home)\b" path/to/fixtures/ \
  && echo "FIXTURE LEAK" || true   # fixtures: RFC 5737 (192.0.2.0/24 etc.) only
git grep -nE "192\.168\.|\b10\.[0-9]+\.[0-9]+\.|172\.(1[6-9]|2[0-9]|3[0-1])\." -- ':!uv.lock' ':!package-lock.json'
# exit code 1 expected; 0 = leak; >=2 = execution error
```

Adjust the exclusions to the current project (lockfiles, arbitration docs
or skills that intentionally *describe* forbidden patterns as prose rather
than leak them) — their content is reviewed on read, not scanned. Never
widen exclusions without a deliberate decision.

## Fixtures and real data

- Any capture taken from a real machine/service goes through an
  anonymization step with a built-in check that **refuses to produce**
  the output file if a real identifier survives — never write it silently.
- Look beyond IPs: hostnames, interface/device GUIDs (raw AND URL-encoded
  forms), instance numbers, serial numbers, VPN adapter names, volume
  labels.
- Anonymization preserves structure: same keys, same formats (an IP stays
  an IP in 192.0.2.0/24, a decimal comma stays a comma) — otherwise the
  fixture no longer exercises the real parsing path.
- Screenshots for docs/README are generated from a demo/seeded scenario,
  never from real infrastructure.

## Container and exposure hardening

Check in the deployment config: non-root user, `read_only: true` root
filesystem, `cap_drop: [ALL]`, `tmpfs` for the paths that truly need
write access, no inbound port from consumers/dependents unless strictly
required (prefer outbound-only, read-only flows), no debug mode or
development server in the production image.

## Supply chain and served pages

- Pinned dependencies (lockfile committed), a dependency-vulnerability
  scanner and a secret scanner in CI, automated dependency updates active.
- No remote/CDN resources in pages served to a client that may have no
  route to the public internet (kiosk, air-gapped, restricted network) —
  vendor everything locally.
- Keep the project's security/threat-model doc (e.g. `SECURITY.md`)
  accurate: if a change contradicts the documented threat model (new
  inbound port, new auth requirement, new exposure), stop and flag it
  rather than letting the doc go stale.

## On discovery

A leak found in history is never "removed" by a follow-up commit — that
commit doesn't erase it from history. Stop, don't push, report the exact
offending commit to the owner: history rewriting is a deliberate decision,
and it's far less painful the earlier it's caught.
