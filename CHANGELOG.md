# Changelog

All notable changes to this project are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [v0.8.0] - 2026-05-22 — Security hardening

### Changed
- Upgrade Express from v4.18 to v5 (resolves 5 high-severity CVEs)
- Upgrade sqlite3 from v5.1 to v6.0 (resolves tar/node-gyp path traversal vulnerabilities)
- Upgrade swagger-ui-express from v4.6 to v5 (Express 5 compatibility)
- Replace `body-parser` with built-in `express.json()` / `express.urlencoded()`
- Replace deprecated `url.parse()` with WHATWG `URL` API in WebSocket service
- Deploy now triggers only on version tag (`v*`), not on every merge to main (#141)

### Fixed
- Guard against `req.body` being `undefined` in Express 5 (connection status, user auth)

### Removed
- `body-parser` dependency (functionality now built into Express 5)

### Security
- Sequelize v7 upgrade deferred (still in alpha); vulnerability (GHSA-6457-6jrx-69cr) does not affect us (no `Sequelize.cast()` usage)
- Remaining 2 moderate vulnerabilities (uuid bounds check) not exploitable in our code

## [v0.7.4] - 2026-05-21 — Final v0.7 stabilization

### Fixed
- Package.json version aligned with git tags
- Restore creates bidirectional connections regardless of restore order

### Added
- Test for reverse-order restore scenario (101 tests total)

## [v0.7.2] - 2026-05-21 — Restore connections fix

### Fixed
- Restore now creates inverse connections (if A→B exists, creates B→A for restored children)
- Restore returns fresh stateCert with complete state (including new inverse connections)

## [v0.7.1] - 2026-05-21 — Recovery fix

### Fixed
- Models `beforeCreate` hooks no longer overwrite explicitly provided IDs (broke restore)
- Syncing indicator shows blue instead of red during recovery

### Changed
- Convention: every merge to main must have a version tag
- Release checklist numbering fixed (sections 11-12)

## [v0.7.0] - 2026-05-21 — Resilience

### Added
- Client-seeded recovery: server generates signed state certificates on state changes (#94)
- `POST /api/v1/sync/restore` endpoint for automatic state recovery after DB wipe
- `GET /api/v1/sync/cert` endpoint for on-demand certificate retrieval
- State certificate included in parent login response
- State certificate pushed via WebSocket on connection approval (for both parents)
- WebSocket ping/pong heartbeat every 30s for connection reliability (#134)
- Release checklist updated with recovery section

## [v0.6.2] - 2026-05-21 — Audio and validation fixes

### Fixed
- Body size limit increased to 1mb (20s audio on iOS exceeded 500kb)
- Empty message validation returns "Message cannot be empty" instead of "Invalid value"

## [v0.6.1] - 2026-05-21 — Post-release fixes

### Added
- Version field in `/health` endpoint response
- Release verification checklist (`docs/release-checklist.md`)
- Validation tests for registration (invalid email, short password)

### Fixed
- Validation errors now return descriptive messages instead of generic "Invalid input"
- Removed `normalizeEmail()` — email addresses preserved as entered by user
- Body size limit increased to 500kb (audio messages support)

### Changed
- Commit conventions updated (subject only, no body)
- CHANGELOG flow: last commit in feature PR before merge

## [v0.6.0] - 2026-05-20 — Multimedia

### Added
- Emoji assets endpoint `GET /api/v1/assets/emojis` — server-authoritative emoji list (#125)
- Sticker assets endpoint `GET /api/v1/assets/stickers` — predefined sticker set (#125)
- Message type support — `type` field on message send (sticker, audio) (#74, #73)
- Parental permissions system — JSON permissions on users, server enforces per message type (#128)
- Audio message support — body size limit increased to 500kb (#129)
- ADR 008 — multimedia messaging strategy

### Changed
- Body parser limit increased from 100kb to 500kb
- `.gitignore` updated to track `data/*.json` resource files

## [v0.5.1] - 2026-05-19 — POC test fixes

### Fixed
- Block duplicate connection requests (409 if already ACCEPTED or REQUESTED) (#119)

### Changed
- `GET /connection/` returns `[{id, nick}, ...]` instead of plain UUIDs (#120)

## [v0.5.0] - 2026-05-19 — Discovery & Communication

### Added
- Parent virtual user pattern — auto-created at registration for parent-to-child messaging (#102, #106-109)
- In-app connection discovery — search parent by email, view children (#103)
- System messages — server-generated notifications on connection accept/reject and child deletion (#54, #98-101)
- Discovery rate limiting — 10 req/hour per user, configurable via `DISCOVERY_RATE_LIMIT_PER_HOUR` (#105)
- ADR-007: Parent Virtual User Pattern

### Changed
- REST resource nesting — mount point `/api/v1/super/` renamed to `/api/v1/parent/` (#104)
- `GET /user/parent/:email` → `GET /parent/:email/children`
- `GET /connection/sent/:parent` → `GET /parent/me/connections/sent`
- `GET /connection/approvalList/:parent` → `GET /parent/me/connections/pending`
- Message list includes `type` field (`user` or `system`)

### Fixed
- Reject password change when new password equals old (#63)

## [v0.4.0] - 2026-05-18 — Pre-beta essentials

### Added
- Password reset via email — 6-digit OTP, Resend integration, rate limited, max 5 attempts (#57)
- Deploy on Render — live at https://sismochat-api.onrender.com (#77)
- Health check endpoint — `GET /health` with DB connectivity check (#92)
- CI pipeline — ESLint linting, npm audit security scan, Jest coverage (#20)
- ADR-005: Password Reset via OTP
- ADR-006: Client-Seeded Recovery (proposed, for v0.8.0)
- CONTRIBUTING.md: local testing instructions for password reset

### Fixed
- Descriptive 404 on withdraw after recipient ACK (#55)
- OTP attempts counter off-by-one (#87)

### Changed
- Rate limit window parametrized via `RESET_RATE_LIMIT_WINDOW_MINUTES` env var
- Husky gracefully skipped in production (`husky || true`)
- npm audit fix resolved critical vulnerabilities

## [v0.3.0] - 2026-05-15 — Real-time & Scale

### Added
- WebSocket real-time notifications (`new_message`, `connection_request`, `connection_status`)
- Password change — `PATCH /api/v1/super/password`
- Pagination on message and connection list endpoints (`?limit=N&offset=N`)

### Changed
- Messages ordered chronologically (ASC)
- 74 tests passing (2 test suites: REST + WebSocket)

## [v0.2.0] - 2026-05-15 — Parental Control & API Stability

### Added
- API versioning — all routes under `/api/v1/`
- Connection check — messages rejected (403) if not connected
- Sent requests status endpoint
- Delete child user
- Edit child nickname
- Parent ownership validation on delete/edit

### Fixed
- Route ordering in connections (static paths before parametric)

## [v0.1.1] - 2026-05-14 — POC Test Fixes

### Fixed
- Duplicate messages — server creates single message copy
- Server crash on invalid RSA token
- Redundant query in parent login
- Validation error messages

## [v0.1.0] - 2026-05-14 — Message Relay MVP

### Added
- Message relay pattern — messages deleted after recipient ACK
- Sender withdrawal (retract unread messages)
- Auto-download marking (GET → DOWNLOADED)
- TTL cleanup (undelivered messages purged after 30 days)
- E2E encryption (RSA-based)
- bcrypt password hashing
- JWT authentication with role-based access (Parent/User)
- Helmet.js security headers, CORS, rate limiting
- Input validation with express-validator
- Swagger/OpenAPI documentation at `/doc`
- Docker support
- GitHub Actions CI (Node 18 + 20)
- Conventional Commits (commitlint + husky)
- 62 tests passing
