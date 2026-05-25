# ADR 010 — Message deletion policy

## Status

Accepted

## Context

Users accumulate messages in local storage over time, especially audio PTT messages which are significantly larger than text. We need a mechanism to allow message cleanup while preserving the parental control model.

Key constraints:
- Server is a temporary relay — messages are deleted after download
- Client (localStorage) is the source of truth for message history
- Parental control must remain enforceable
- No server-side changes should be required for a client-side operation

## Decision

Message deletion is a **client-only operation** governed by the existing permissions model.

### Mechanism

A new permission flag `delete_messages` is added to the user's `permissions` JSON field:

```json
{ "audio": true, "sticker": true, "delete_messages": false }
```

- **`delete_messages: true`** — child can freely delete messages from local history
- **`delete_messages: false`** (default) — delete option is hidden in the child's UI

### Control flow

1. Parent enables/disables `delete_messages` in the child's permissions (client-side toggle)
2. Permission is synced to server via the existing state certificate mechanism
3. Child's client reads the permission and shows/hides the delete UI accordingly
4. Deletion is purely local (removes from localStorage), no API call needed

### Parental control scenarios

| Trust level | Parent action |
|-------------|--------------|
| Strict | Keep `delete_messages: false` (default). Child cannot delete anything. |
| Supervised | Enable temporarily, supervise what gets deleted, then disable again. |
| Trusted | Keep `delete_messages: true`. Child manages their own storage freely. |

## Consequences

- No new API endpoints required
- No server-side enforcement needed (deletion is local)
- Consistent with existing permission model (same pattern as `audio`, `sticker`)
- Parent retains full control over whether the feature is available
- Default is restrictive (opt-in, not opt-out)

## Alternatives considered

1. **Approval workflow via WebSocket** — child requests deletion, parent approves via notification. Rejected: parent rarely has client active, adds complexity, requires new API endpoints.
2. **Child can always delete** — privacy-first but breaks parental control contract.
3. **Server-side audit log** — child deletes locally but server keeps a record. Rejected: violates relay pattern, server cannot read E2E encrypted messages anyway.
