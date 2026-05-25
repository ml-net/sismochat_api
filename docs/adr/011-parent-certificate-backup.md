# ADR 011 — Parent certificate backup strategy

## Status

Accepted

## Context

The client-seeded recovery model (ADR 006) relies on the parent device holding the state certificate in localStorage. If the parent device is lost/broken/reset AND the server is wiped, there is no way to recover without a backup of the certificate.

### Scenarios

| Parent device | Server | Outcome |
|---------------|--------|---------|
| ✅ Intact | ❌ Wiped | Normal restore (existing flow) |
| ❌ Lost | ✅ Active | Login with email/password (no issue) |
| ❌ Lost | ❌ Wiped | **Catastrophic — needs backup** |

## Decision

The parent certificate backup is a **client-side feature**. No API changes are required.

### Backup mechanism

1. Certificate encrypted with parent password (AES-256, key derived via PBKDF2)
2. Exported as QR code (printable, offline) and/or encrypted blob (email-able)
3. Only the parent can decrypt (must remember password)

### Recovery flow (catastrophic scenario)

1. Install app on new device
2. Choose "Recover from backup"
3. Scan QR code or paste encrypted blob from email
4. Enter password → client decrypts → certificate restored to localStorage
5. Normal login (email + password)
6. Client detects server has no data → triggers `POST /sync/restore` with the restored certificate
7. Server rebuilt, children can login from their devices

### Key insight

The recovery flow after backup import is **identical** to the existing restore flow. The only difference is the source of the certificate:
- Normal: localStorage (device intact)
- From backup: QR/email → decrypt → localStorage → same flow

### When to export

- Manual: parent explicitly exports from settings
- Prompted: after important state changes (new child, new connection, password change)
- Reminder: periodic nudge if backup is stale

### Size constraints

- Typical cert (1 parent + 2 children + 3 connections) ≈ 2000 bytes encrypted+base64
- QR code capacity: ~2900 bytes binary — fits up to ~3-4 children
- Beyond QR capacity: email export only

## Consequences

- No new API endpoints required
- `POST /sync/restore` already handles the server-side reconstruction
- Implementation is entirely in the client (encrypt, export, import, decrypt)
- Deferred to client repo (sismochat_web) — depends on final client architecture
- Accepted risk for beta: if parent has no backup in catastrophic scenario, data is lost

## Related

- ADR 006 — Client-seeded recovery
- ADR 009 — Device re-provisioning (child device lost)
- #142 — Device loss recovery story
- #171 — Implementation task (moved to client repo)
