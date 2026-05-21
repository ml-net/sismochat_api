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

## Commit Messages
- Subject: concise, lowercase, no period (enforced by commitlint)
- Subject ONLY — no body, no bullet points, no details
- Implementation details go as comments on the GitHub issue, NOT in commits
- Do NOT put `Closes #N` in commit messages — put it in the PR description
- The PR description is the right place for details and issue references

## Pull Requests
- Always create as draft (--draft), wait for explicit approval before marking ready and merging
- Always assign to @me (--assignee @me)
- Wait for CI to pass before merging
- Do NOT commit and push automatically — always ask for confirmation first
- Use `Closes #N` in PR description for auto-closing issues on merge
- Before finalizing, check if changes impact documentation (Swagger, README, ADRs, issue comments) and update accordingly

## Issues
- Every task should be tracked as a GitHub issue before working on it
- Assign issue to @me before starting work
- Add implementation details as comments on the issue (not in commit messages)

## CI/CD
- GitHub Actions runs tests on Node 18 + 20
- JWT_SECRET comes from GitHub Secrets, never hardcoded
- CHANGELOG: update as the last commit in the feature PR, just before merge. Then tag on main after merge.
- Every merge to main that triggers a deploy MUST have a corresponding version tag.

## Architecture Decisions
- Server is a temporary message relay (not persistent store)
- Client is the source of truth for messages
- SQLite is the production DB (low data volume, relay pattern)
- E2E encryption with RSA (server cannot read messages)
