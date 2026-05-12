# Project Conventions — SiSMoChat API

## Language
- English for: commit messages, PR descriptions, code comments, documentation
- Italian is fine for conversation

## Git Workflow
- Never push directly to main (branch protection + pre-push hook)
- Always work on feature branches
- Conventional Commits enforced (commitlint + husky)
- Squash merge PRs (one commit per PR on main)
- Delete branch after merge

## Pull Requests
- Always assign to @me (--assignee @me)
- Wait for CI to pass before merging
- Do NOT commit and push automatically — always ask for confirmation first

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
