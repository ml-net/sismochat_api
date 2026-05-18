# Changelog

All notable changes to this project are documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
