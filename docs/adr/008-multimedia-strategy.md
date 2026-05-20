# ADR 008 — Multimedia messaging strategy

## Status

Accepted

## Context

Milestone v0.6.0 addresses multimedia messaging. We evaluated three approaches for visual/expressive content: emoji, stickers, and images. A fourth feature (audio PTT) was evaluated but deferred. All decisions must align with parental control principles, E2E encryption, and the relay architecture.

## Decision summary

| Feature | Status | Rationale |
|---------|--------|-----------|
| Emoji | ✅ Accepted | Unicode characters, no server changes needed for messaging |
| Stickers | ✅ Accepted | Predefined asset pack, controlled set, message type field |
| Images | ❌ Rejected | Violates parental control, breaks E2E or relay model |
| Audio PTT | ⏸️ Deferred | Requires microphone access — parental control implications to evaluate |

## Emoji

Standard Unicode emoji sent as regular text. No server changes required for messaging — the existing message infrastructure handles them transparently.

### Emoji list management

The list of allowed emoji is **server-authoritative** and stored in an external resource file (`data/emojis.json`). The server exposes `GET /api/v1/assets/emojis` to serve the current list. The client fetches this list at login and populates the picker.

**Why externalize:** updating the allowed emoji set requires only a change to the resource file and a server deploy — no client code changes needed.

**Fallback for unknown emoji:** not needed. If a user receives an emoji not in the current picker list, the Unicode character still renders correctly via the device font. The picker list only controls what's *selectable*, not what's *displayable*.

## Stickers

Predefined, curated set of stickers. Sent as messages with `type: 'sticker'` and a sticker ID in the body. The server relays the message without interpreting the content.

### Sticker list management

The server exposes `GET /api/v1/assets/stickers` returning the available sticker set (ID, label, category). Clients fetch this at login.

### Fallback for unknown sticker IDs

If a client receives a sticker ID it doesn't recognize (e.g., sender has a newer sticker set), it displays a **predefined placeholder sticker**. This ensures graceful degradation without breaking the chat flow.

### Alternatives evaluated for sticker delivery

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Assets bundled in client | Fast rendering, offline | Requires client release for updates | Rejected |
| Assets served from server/CDN | Always up to date, no client release | Requires network, latency | **Accepted** (via assets endpoint) |
| Inline base64 in message | Self-contained | Huge payload, defeats purpose of IDs | Rejected |

## Images — rejected

See detailed rationale:

1. **Parental control violation** — requires access to device camera or photo gallery
2. **E2E encryption conflict** — parental review would break E2E model (see ADR 001)
3. **Relay architecture mismatch** — base64 images (1-2 MB) impractical for SQLite relay (see ADR 004)

## Audio PTT — deferred

Evaluated but not included in v0.6.0. Key concerns:

- **Microphone access** — less problematic than camera/gallery (doesn't expose existing content on device), but still a permission that parents may want to control
- **Payload size** — 60s Opus audio ≈ 60-120KB base64, manageable but requires body size limit adjustment
- **E2E on large payloads** — needs verification of current RSA/AES hybrid encryption on larger data

Will be revisited after sticker implementation, with a separate ADR if accepted.

## Update strategy

Both sticker and emoji lists are server-authoritative. Clients fetch lists at login from `/api/v1/assets/*` endpoints.

### Sticker sync flow (at client startup)

1. Client calls `GET /api/v1/assets/stickers` → receives current ID list
2. Compares with local cache (localStorage):
   - **New IDs** (on server, not in local) → downloads image from server, saves locally
   - **Removed IDs** (in local, not on server) → removes from local cache
   - **Unchanged IDs** → no action
3. Picker displays only the synced set

Sticker images are served by the server (`GET /api/v1/assets/stickers/:id/image`). Clients cache images locally after first download. This ensures all clients stay aligned with the server-defined set without requiring client releases.

### Emoji sync flow (at client startup)

1. Client calls `GET /api/v1/assets/emojis` → receives current Unicode list
2. Replaces local picker list entirely (emoji are Unicode — no image download needed)

### Design principle

The server is the single source of truth for available content. Client updates are limited to UI/UX changes — content (stickers, emoji sets) is managed entirely server-side.

## Consequences

- Children express themselves visually through emoji and a safe, predefined sticker set
- No file uploads, no media permissions — minimal attack surface
- The `type` field on messages (migration 06) supports future message types without schema changes
- Sticker/emoji sets can evolve with server updates — no client release needed
- Unknown sticker IDs degrade gracefully via placeholder
