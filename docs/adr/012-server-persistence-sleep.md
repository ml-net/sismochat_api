# ADR 012 — Server persistence and sleep strategy

## Status

Accepted

## Context

SiSMoChat API is deployed on Render free tier. Free tier services:
- Go to sleep after ~15 minutes of inactivity
- Lose the SQLite database on sleep/restart (ephemeral filesystem)
- Wake up on the next incoming request (~30s cold start)

This means that after every sleep cycle, the server starts with an empty database.

## Impact on users

| Actor | Impact |
|-------|--------|
| Parent | Must login first after a sleep cycle to trigger automatic restore |
| Children | Cannot access the system until their parent has restored |
| Contacts (other family) | Show as N/D until the other parent also restores |

The system is designed to handle this gracefully via client-seeded recovery (ADR 006), but it creates a daily operational requirement: **at least one parent must login before their children can use the app**.

## Decision

Accept the current behavior for internal testing and early development. The client-seeded recovery mechanism makes this transparent — the parent logs in, restore happens automatically, children can then use the system normally.

### Mitigation options for beta/production

| Option | Cost | Reliability | Notes |
|--------|------|-------------|-------|
| Render paid tier | ~$7/month | High | Persistent disk, no sleep |
| Keep-alive ping (UptimeRobot, cron-job.org) | Free | Medium | Prevents sleep; Render may restrict in future |
| External DB (e.g. Turso, PlanetScale) | Free tier available | High | Decouples data from server lifecycle |
| Self-hosted (VPS) | ~$5/month | High | Full control, more maintenance |

### Decision timeline

- **Now (internal testing):** accept daily restore requirement
- **Beta launch (external testers):** implement keep-alive OR upgrade to paid tier
- **Production:** paid tier or external DB (non-negotiable for real users)

## Consequences

- Parent must login at least once per sleep cycle for their family to function
- No data is ever lost (client holds the certificate)
- Cold start adds ~30s delay on first request after sleep
- Architecture remains sound — the limitation is purely infrastructure cost, not design

## Related

- ADR 004 — SQLite as production DB
- ADR 006 — Client-seeded recovery
- Known issue: Render free tier DB resets on deploy/sleep
