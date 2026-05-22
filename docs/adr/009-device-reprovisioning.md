# ADR-009: Device Re-provisioning and Key Rotation

## Status
Accepted

## Context
When a child's device is lost, broken, or factory-reset, the child loses their private key and device credentials. We need a mechanism to re-provision the child on a new device while preserving their identity (userId, connections, permissions).

Two distinct scenarios exist:
- **Device crash/breakage** (device in our hands, no security risk): re-provision same userId
- **Device theft** (risk of unauthorized access): delete child entirely, recreate from scratch

## Options Considered

### Key distribution after re-provisioning

1. **N+1 calls** — client fetches each contact's pubkey individually via `GET /user/pubkey/:userid`
   - Pro: simple, endpoint exists
   - Con: N+1 problem, slow with many contacts

2. **Include pubkey in `GET /connection/`** — single call returns contacts with their public keys ✅
   - Pro: one call, ~450 bytes per key (negligible even with 100 contacts ≈ 50KB < one audio message)
   - Con: slightly larger response

3. **WebSocket notification only** — server pushes `key_changed` to online contacts
   - Pro: real-time
   - Con: doesn't cover offline contacts

### Chosen: option 2 + 3 combined
- At login: `GET /connection/` returns pubkeys → client refreshes all keys
- Real-time: WS `key_changed` notification to online contacts when a reprovision occurs

## Decision

### Scenario 1 — Crash/breakage (re-provisioning)

**Flow:**
1. Parent logs into the child's new device (as Parent)
2. Parent selects existing child from list → chooses "reprovision"
3. Client generates new RSA key pair (or server generates if client doesn't provide `pk`)
4. Client calls `PUT /api/v1/device/:userid` with new public key
5. Server: deletes old device, creates new device, updates user's pubkey
6. Server: notifies online contacts via WS (`key_changed`)
7. Server: returns `{ deviceId, keys, stateCert }`

**REST semantics:**
- `POST /device/:userid` — create (fails if device exists) → first provisioning
- `PUT /device/:userid` — replace (deletes old, creates new) → re-provisioning

### Scenario 2 — Theft

**Flow:**
1. Parent from own dashboard → deletes the child (`DELETE /user/:userid`)
2. This removes user + device + connections (attacker can no longer access anything)
3. Parent creates new child from scratch on new device
4. Connections must be re-established (acceptable trade-off for security)

No new endpoints needed — existing `DELETE /user/:userid` + `POST /user` + `POST /device/:userid` cover this.

### Key refresh mechanism

- `GET /connection/` response includes `key` field (public key) for each contact
- Client refreshes all contact keys at every login
- On reprovision, server sends WS notification `{ type: 'key_changed', userId, key }` to all online contacts of the re-provisioned user

## Consequences

- Child identity (userId, nick, connections, permissions) survives device loss
- Contacts automatically get updated keys (at login or in real-time)
- Theft scenario prioritizes child safety over convenience (connections lost)
- ~450 bytes per contact added to connection list response (negligible)
