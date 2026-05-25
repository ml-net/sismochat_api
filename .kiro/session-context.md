# SiSMoChat API — Session Context (2026-05-22)

## Current State
- On branch: `main` (up to date)
- Last release: v0.8.0
- Next release: v0.9.0 (milestone "v0.9.0 - Beta")

## PRs Open
- **#173** (draft) — `docs/release-0.9.0` — CHANGELOG + bump to v0.9.0. Merge LAST before tagging.
- **#161** (draft) — `test/17-coverage-threshold` — Jest coverage thresholds (9 lines, CI green). Part of #17.

## Remaining work for v0.9.0 release (server-side)

### To do (in order of complexity)
1. **#157** — enable Dependabot (chore, just `.github/dependabot.yml` config)
2. **#161 / PR already open** — coverage threshold enforcement (merge the existing draft PR)
3. **#147** — parent remove connection for child (feature: DELETE endpoint, WS notification, tests)

### After all above are merged:
4. Rebase PR #173 if needed, merge it (CHANGELOG + bump)
5. Tag `v0.9.0` on main → triggers deploy
6. Post-deploy verification with release checklist (13 sections, including new section 13: device re-provisioning)

## Already done in v0.9.0
- #170 — device re-provisioning endpoint (PR #172, merged)
- #168 — standardized error codes (merged)
- #163 — GET /status endpoint (merged)
- #169 — ADR-006 state cert encryption decision (merged)

## Client-side only (not blocking API release)
- #171 — parent certificate backup export (QR/email)
- #136 — single message deletion from local history
- #165 — i18n in definitive client
- #142 — device loss recovery story (server part done, client remains)
