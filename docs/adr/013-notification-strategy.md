# ADR 013 — Notification strategy

## Status

Accepted

## Context

The system needs to notify users of new messages and events. Two channels are available, each with different characteristics.

## Decision

Use **WebSocket** and **Web Push** as complementary notification channels.

| Channel | Role | Reliability | Works when |
|---------|------|-------------|------------|
| WebSocket | Real-time UI updates | Low (drops on Render, proxy timeouts) | App in foreground, connection active |
| Web Push | User notification (system banner) | High (browser vendor infrastructure) | Always, including app in background/closed |

### Responsibilities

- **WebSocket:** signal the client to refresh data (e.g. new message arrived, connection status changed, state cert updated). Does not carry message content (ADR 003).
- **Web Push:** alert the user via OS-level notification. Brings attention back to the app. Payload is minimal (sender info, not message content — E2E encrypted anyway).

### Delivery logic

On new message:
1. Always attempt WS notification to recipient (real-time UI update)
2. Always send Web Push to recipient if they have a valid subscription (user notification)
3. Client in foreground: suppress push display (avoid double notification)
4. Client in background: push shows as system notification

### Subscription lifecycle

- Client registers push subscription on login
- Subscription stored in `pushSubscription` field on device model
- On server wipe: subscriptions lost, clients re-register on next login
- On subscription expiry/error: server removes invalid subscription from DB

## Consequences

- Both channels fire independently — no "fallback" logic needed
- WS instability (known issue on Render) no longer means missed notifications
- Push requires user permission (browser prompt)
- Push not available until client has logged in and registered subscription
- E2E encryption preserved — push payload contains no message content

## Related

- ADR 003 — WebSocket notification-only (WS does not carry content)
- ADR 012 — Server persistence and sleep (subscriptions lost on wipe)
