# ADR-002: Deployment Platform

## Status
Accepted

## Context
Need a free, reliable hosting platform for the API with HTTPS and WebSocket support. No budget for infrastructure at this stage.

## Options Considered

1. **Render.com (free tier)** ✅
   - Pro: free, HTTPS, WebSocket, no credit card, manual or auto deploy
   - Con: cold start after 15min inactivity, 1 service only, no preview environments
   - Mitigation: UptimeRobot ping or accept cold start for beta

2. **Fly.io (free tier)**
   - Pro: no cold start, 3 free VMs, Docker native
   - Con: requires credit card to activate
   - Decision: future option when scaling or needing always-on

3. **Railway**
   - Pro: generous free credits, good DX
   - Con: $5/month after credits, less predictable costs

4. **Self-hosted (Mac Mini)**
   - Pro: full control, no limits
   - Con: not reachable from internet without tunneling, maintenance burden

## Decision
Render.com for beta. Single environment, manual deploy. Test locally before deploying. Migrate to Fly.io if cold start becomes unacceptable.

## Consequences
- Cold start ~30s acceptable for beta (few users)
- No cloud TEST environment - test locally before deploy
- Deploy triggered manually (dashboard or CI workflow_dispatch)
- HTTPS and WebSocket provided by platform
- Future: consider Fly.io for always-on when user base grows
