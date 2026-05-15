# ADR-004: SQLite as Production Database

## Status
Accepted

## Context
The server needs a database for users, connections, devices, and temporary messages. Traditional choice would be PostgreSQL or MySQL, but the relay pattern means data volume is low.

## Options Considered

1. **PostgreSQL**
   - Pro: scalable, standard, managed options available
   - Con: cost ($7+/month), overkill for relay pattern, adds infrastructure complexity

2. **SQLite** ✅
   - Pro: zero cost, zero infrastructure, file-based, sufficient for relay pattern
   - Con: single-writer, not suitable for horizontal scaling
   - Mitigation: relay pattern keeps data volume low; future options (LiteFS, Turso) exist

3. **No database (in-memory only)**
   - Pro: simplest possible
   - Con: all data lost on restart, no persistence at all

## Decision
SQLite for all environments (dev, test, production). The relay pattern ensures data volume stays low (messages are ephemeral, only users/connections/devices are persistent).

## Scalability Path
If needed in the future:
- **LiteFS (Fly.io)** - SQLite replication across nodes
- **Turso (libSQL)** - distributed SQLite as a service (generous free tier)
- **Sticky sessions** - route users to same instance
- **PostgreSQL** - last resort, only if data model changes significantly

## Consequences
- No database costs
- Single file to backup (nice-to-have, not critical since client holds all messages)
- Volume persistent recommended but not required (client can re-register on server state loss)
- Handles 10k+ active users comfortably with relay pattern
