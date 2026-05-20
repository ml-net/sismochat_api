# Release Verification Checklist

Use this checklist after every deploy to verify no regressions.

## 1. Server Health
- [ ] 1.1 `GET /health` returns `{"status":"ok","version":"X.Y.Z"}`
- [ ] 1.2 Version matches the expected release

## 2. Registration & Auth
- [ ] 2.1 Register parent (valid email + password ≥ 6 chars)
- [ ] 2.2 Register parent with invalid email → descriptive error
- [ ] 2.3 Register parent with short password → descriptive error
- [ ] 2.4 Login parent (correct credentials)
- [ ] 2.5 Login parent (wrong credentials) → error
- [ ] 2.6 Change password (from parent dashboard)
- [ ] 2.7 Password reset request → email/OTP received
- [ ] 2.8 Password reset confirm with valid OTP
- [ ] 2.9 Create child user (from parent dashboard)
- [ ] 2.10 Login as child (from user select)
- [ ] 2.11 Login as __parent__ virtual user
- [ ] 2.12 Logout parent
- [ ] 2.13 Logout child

## 3. Discovery & Connections
- [ ] 3.1 Discover parent by email
- [ ] 3.2 View discovered parent's children
- [ ] 3.3 Request connection between two children
- [ ] 3.4 Approve connection (from recipient's parent)
- [ ] 3.5 Reject connection (from recipient's parent)
- [ ] 3.6 Both children see each other in "My Contacts"
- [ ] 3.7 View sent connection requests with status
- [ ] 3.8 Duplicate connection request → error

## 4. Messaging — Text
- [ ] 4.1 Send text message
- [ ] 4.2 Recipient receives message (Refresh inbox)
- [ ] 4.3 Message appears in local messages for both
- [ ] 4.4 Withdraw unread message
- [ ] 4.5 Send to non-connected user → error

## 5. Messaging — Emoji
- [ ] 5.1 Emoji picker populates from server (not empty)
- [ ] 5.2 Insert emoji into text field
- [ ] 5.3 Send message with emoji
- [ ] 5.4 Emoji displays correctly on recipient side

## 6. Messaging — Sticker
- [ ] 6.1 Sticker picker populates from server
- [ ] 6.2 Send sticker (tap to send)
- [ ] 6.3 Sticker renders large (4em) in sender's chat
- [ ] 6.4 Sticker renders correctly on recipient side
- [ ] 6.5 Unknown sticker ID shows placeholder ❓

## 7. Messaging — Audio PTT
- [ ] 7.1 PTT button 🎙️ visible
- [ ] 7.2 Tap starts recording (microphone permission granted)
- [ ] 7.3 Timer countdown visible
- [ ] 7.4 Tap stop sends the message
- [ ] 7.5 Auto-stop at 20s
- [ ] 7.6 Audio player visible in sender's chat
- [ ] 7.7 Audio player visible and playable on recipient side

## 8. Parent ↔ Child Messaging
- [ ] 8.1 Parent virtual user sees child in contacts
- [ ] 8.2 Child sees parent in contacts
- [ ] 8.3 Bidirectional messages work

## 9. Multi-device / Real-time
- [ ] 9.1 Two different browsers/devices communicate
- [ ] 9.2 WebSocket notification arrives in real-time

## 10. Edge Cases & Errors
- [ ] 10.1 Empty message → error
- [ ] 10.2 Message to non-existent user → error
- [ ] 10.3 Login with wrong credentials → clear error message
- [ ] 10.4 Duplicate parent registration → error
- [ ] 10.5 Edit child nickname
- [ ] 10.6 Delete child → connections removed, system message sent to contacts
- [ ] 10.7 Rate limiting on auth endpoints (too many attempts → 429)
