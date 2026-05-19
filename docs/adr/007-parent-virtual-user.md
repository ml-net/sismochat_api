# ADR-007: Parent Virtual User Pattern

## Status

Accepted

## Context

Parents need to message their children directly ("come home", "all ok?") without requiring an explicit connection approval flow. The messaging infrastructure is designed around user-to-user communication with E2E encryption via RSA keypairs.

Options considered:
1. **Plaintext parent messages** — parent sends without encryption, server can read them. Breaks privacy model.
2. **Special parent endpoint** — separate messaging path for parents. Duplicates logic, complicates client.
3. **Virtual user** — parent gets a regular user identity at registration, reuses all existing messaging infra.

## Decision

At registration, the server automatically creates a **virtual child user** for the parent with:
- Reserved nick `__parent__` (constant, never shown in discovery)
- RSA keypair (enables E2E encryption like any other user)
- Device record (enables standard user authentication)

When a new child is created, the server auto-creates a bidirectional ACCEPTED connection between the virtual user and the child.

## Consequences

### Positive
- Zero changes to messaging, encryption, or WebSocket infrastructure
- Parent-to-child messages are E2E encrypted (same as child-to-child)
- Client can reuse the same message send/receive flow
- Virtual user is excluded from discovery endpoints (filtered by reserved nick)

### Negative
- Each parent creates an extra user + device + connection records
- Client must store virtual user credentials separately
- Existing parents need a one-time migration to create their virtual user

## Sequence

```
Registration:
  Parent registers → server creates parent record
                   → server creates virtual user (__parent__)
                   → server creates device for virtual user
                   → returns virtual user credentials to client

Child creation:
  Parent creates child → server creates child user
                       → server auto-connects virtual user ↔ child (ACCEPTED)
                       → parent can immediately message child
```
