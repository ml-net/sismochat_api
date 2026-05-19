# Copilot instructions for sismochat_api

## Build, test, and (non-existent) lint commands
- Install deps: `npm install`
- Start (production): `npm start` (runs `node server.js`)
- Start (dev): `npm run start-dev` (nodemon)
- Run migrations: `npm run migrate` (alias: `npx sequelize-cli db:migrate`)
- Reset & migrate: `npm run migrate:reset`
- Generate swagger JSON: `npm run swagger-autogen` (runs `node swagger.js`)

Tests
- Run full test suite: `npm test` (runs migrations reset first via `pretest`)
- Run a single test file: `npm test -- tests/app.test.js` or `NODE_ENV=test npx jest tests/app.test.js`
- Run a single test case by name: `npx jest -t "test name"` (add `--runInBand` if needed)

Notes: There is no dedicated "lint" script. Commit messages are validated with `commitlint` via Husky hooks; follow Conventional Commits.

## High-level architecture
- Express-based REST API exported from `app.js` and started by `server.js`.
- Endpoints are organized per-resource under `routes/` (auth, parent, user, message, connection, device).
- Sequelize ORM for DB models and migrations (`models/`, `migrations/`), using sqlite for local/dev/test based on `NODE_ENV`.
- JWT-based authentication (expects `JWT_SECRET` env var). Bearer token passed in `Authorization` header.
- Security: helmet, CORS, and a rate limiter applied to `/api/auth/` in `app.js`.
- Crypto utilities (public/private encrypt/decrypt) and helper functions in `util.js`.
- OpenAPI (swagger) generated via `swagger-autogen` and served at `/doc` using `swagger_output.json`.

## Key conventions and repository specifics
- Environment: Node >= 18. Required env: `JWT_SECRET`. `NODE_ENV=test` uses a test DB and `pretest` resets migrations.
- DB: Run `npx sequelize-cli db:migrate` for schema; tests run migrations automatically via `pretest`.
- Scripts: `npm run migrate`, `migrate:reset`, `swagger-autogen`, and `start-dev` are useful shortcuts.
- Tests: Jest + Supertest. `pretest` resets the DB; be cautious running `npm test` locally as it resets the test DB.
- Commits: Conventional Commits enforced via `commitlint` and Husky; use the allowed commit types in CONTRIBUTING.md.
- API docs: Generated to `swagger_output.json`. Routes listed in `swagger.js` — update that file when adding route files.
- Rate limiting: Auth endpoints intentionally rate-limited (see `app.js`)—when adding auth-like endpoints, follow same pattern.
- Error handling: global error handler in `app.js` returns concise JSON { errCode, errDesc } and hides messages in production.
- Docker: Dockerfile exists; see CONTRIBUTING.md for run examples.

## Where to look next
- `README.md` and `CONTRIBUTING.md` for setup and workflow details
- `app.js` for middleware, route wiring and security defaults
- `routes/*.js` and `models/` for endpoint & data model specifics
- `swagger.js` and `swagger_output.json` for contract and client expectations


## Additional conventions (from .kiro/steering/conventions.md)
- Language: English for commit messages, PR descriptions, code comments and documentation; Italian is acceptable for conversations.
- Git workflow: never push directly to `main`; work on feature branches; Conventional Commits enforced (commitlint + husky); allowed types: feat, fix, refactor, docs, chore, test, style, perf; squash-merge PRs and delete branches after merge.
- Pull Requests: assign to @me, wait for CI to pass before merging, and do not use automated commit+push without confirmation.
- Issues: track every task as a GitHub issue, assign before starting, and add implementation details as comments on the issue (not in commit messages).
- Commit messages: concise subject (lowercase, no period), optional 1-2 line body for context. Do NOT put `Closes #N` in commit messages — put it in the PR description.
- CI/CD: GitHub Actions runs tests on Node 18 and 20; `JWT_SECRET` is provided from GitHub Secrets and must never be hardcoded.
- Architecture decisions recorded here: the server acts as a temporary message relay (not the single source of truth); the client is the source of truth for messages; SQLite is used for low-volume production as a relay pattern; end-to-end encryption uses RSA so the server cannot read message contents.

## Copilot PR/branch workflow
- Branch naming: use the pattern `type/issue-short-desc` (e.g., `feat/123-add-auth`). Include the issue number in the branch name and PR title.
- Pre-PR checklist: run `npm install`; if you changed DB schema run `npm run migrate`; run `npm test` (or `npx jest <file>` for a single test); if you changed routes run `npm run swagger-autogen`. Verify no secrets are added. Check if changes impact documentation (Swagger, README, ADRs, issue comments) and update accordingly.
- PR creation: open a draft PR with an English description, use `Closes #N` in the PR description (not in commit messages) for auto-closing issues, assign to @me, add relevant labels, and wait for CI to pass before marking as ready for review.
- Merge: use squash merge into `main`, delete the branch after merge.
- Copilot-specific rules: never push directly to `main`; when proposing changes create a branch and PR; do not auto-merge; ensure commit messages follow Conventional Commits (concise subject, optional 1-2 line body, no `Closes #N`); never commit secrets or hard-coded secrets (JWT_SECRET must come from environment/secrets); always create PRs as draft (mark ready only after explicit approval); never amend commits — use new commits (PR history shows all changes, squash merges them); put `Closes #N` in PR description only.

--
Generated from repository files: README.md, CONTRIBUTING.md, package.json, app.js, server.js, routes/, models/, tests/, swagger.js, .kiro/steering/conventions.md
