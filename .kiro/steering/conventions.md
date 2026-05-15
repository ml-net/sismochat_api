# Project Conventions — SiSMoChat API

## Language
- English for: commit messages, PR descriptions, code comments, documentation
- Italian is fine for conversation

## Git Workflow
- Never push directly to main (branch protection + pre-push hook)
- Always work on feature branches, named as `type/issue-short-desc` (e.g. `feat/12-add-pagination`)
- Conventional Commits enforced (commitlint + husky)
- Allowed types: feat, fix, refactor, docs, chore, test, style, perf
- Squash merge PRs (one commit per PR on main)
- Delete branch after merge
- Never amend commits — use new commits (PR history shows all changes, squash merges them)

## Pull Requests
- Always create as draft (--draft), wait for explicit approval before marking ready and merging
- Always assign to @me (--assignee @me)
- Wait for CI to pass before merging
- Do NOT commit and push automatically — always ask for confirmation first
- Before finalizing, check if changes impact documentation (Swagger, README, ADRs, issue comments) and update accordingly

## Issues
- Every task should be tracked as a GitHub issue before working on it
- Assign issue to @me before starting work
- Reference issue in commit message (Closes #N)

## CI/CD
- GitHub Actions runs tests on Node 18 + 20
- JWT_SECRET comes from GitHub Secrets, never hardcoded

## Architecture Decisions
- Server is a temporary message relay (not persistent store)
- Client is the source of truth for messages
- SQLite is the production DB (low data volume, relay pattern)
- E2E encryption with RSA (server cannot read messages)
