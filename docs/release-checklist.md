# Release Verification Checklist

Use this checklist after every deploy to verify no regressions.

## 1. Server Health
- [ ] 1.1 `GET /health` returns `{"status":"ok","version":"X.Y.Z"}`
- [ ] 1.2 Version matches the expected release
- [ ] 1.3 `GET /api/v1/status` returns valid response (message or null)

## 2. Registration & Auth
- [ ] 2.1 Register parent (valid email + password ≥ 6 chars)
- [ ] 2.2 Register parent with invalid email → descriptive error
- [ ] 2.3 Register parent with short password → descriptive error
- [ ] 2.4 Login parent (correct credentials)
- [ ] 2.5 Login parent (wrong credentials) → error
- [ ] 2.6 Create child user (from parent dashboard)
- [ ] 2.7 Login as child (from user select)
- [ ] 2.8 Login as __parent__ virtual user
- [ ] 2.9 Logout parent
- [ ] 2.10 Logout child

## 3. Password Management
- [ ] 3.1 Change password (valid old + new password ≥ 6 chars)
- [ ] 3.2 Change password with wrong old password → error
- [ ] 3.3 Change password with short new password → error
- [ ] 3.4 Change password with new = old → error
- [ ] 3.5 Request reset → confirmation message shown
- [ ] 3.6 Email with OTP arrives at destination
- [ ] 3.7 Confirm reset with valid OTP → password changed
- [ ] 3.8 Confirm reset with invalid OTP → error
- [ ] 3.9 Login with new password after reset
- [ ] 3.10 Too many reset requests → rate limit error (429)
- [ ] 3.11 Request reset for non-existent email → same response (no info leak)

## 4. Discovery & Connections
- [ ] 4.1 Discover parent by email
- [ ] 4.2 View discovered parent's children
- [ ] 4.3 Request connection between two children
- [ ] 4.4 Approve connection (from recipient's parent)
- [ ] 4.5 Reject connection (from recipient's parent)
- [ ] 4.6 Both children see each other in "My Contacts"
- [ ] 4.7 View sent connection requests with status
- [ ] 4.8 Duplicate connection request → error
- [ ] 4.9 Discovery rate limiting (too many searches → 429)
- [ ] 4.10 Parent removes a connection → both sides deleted, contact disappears
- [ ] 4.11 Removed contact receives system message notification

## 5. Messaging — Text
- [ ] 5.1 Send text message
- [ ] 5.2 Recipient receives message (Refresh inbox)
- [ ] 5.3 Message appears in local messages for both
- [ ] 5.4 Withdraw unread message
- [ ] 5.5 Withdraw already-read message → error
- [ ] 5.6 Send to non-existent user → 404
- [ ] 5.7 Send to existing but non-connected user → 403
- [ ] 5.8 Empty message → error with descriptive message

## 6. Messaging — Emoji
- [ ] 6.1 Emoji picker populates from server (not empty)
- [ ] 6.2 Insert emoji into text field
- [ ] 6.3 Send message with emoji
- [ ] 6.4 Emoji displays correctly on recipient side

## 7. Messaging — Sticker
- [ ] 7.1 Sticker picker populates from server
- [ ] 7.2 Send sticker (tap to send)
- [ ] 7.3 Sticker renders large (4em) in sender's chat
- [ ] 7.4 Sticker renders correctly on recipient side
- [ ] 7.5 Unknown sticker ID shows placeholder ❓

## 8. Messaging — Audio PTT
- [ ] 8.1 PTT button 🎙️ visible
- [ ] 8.2 Tap starts recording (microphone permission granted)
- [ ] 8.3 Timer countdown visible
- [ ] 8.4 Tap stop sends the message
- [ ] 8.5 Auto-stop at 20s
- [ ] 8.6 Audio player visible in sender's chat
- [ ] 8.7 Audio player visible and playable on recipient side

## 9. Parent ↔ Child Messaging
- [ ] 9.1 Parent virtual user sees child in contacts
- [ ] 9.2 Child sees parent in contacts
- [ ] 9.3 Bidirectional messages work

## 10. Multi-device / Real-time
- [ ] 10.1 Two different browsers/devices communicate
- [ ] 10.2 WebSocket notification arrives in real-time

## 11. Client-Seeded Recovery
- [ ] 11.1 State certificate saved in localStorage after parent login
- [ ] 11.2 State certificate updated after child creation
- [ ] 11.3 State certificate updated after connection approval
- [ ] 11.4 After DB wipe: parent login triggers automatic restore
- [ ] 11.5 After restore: parent dashboard shows children correctly
- [ ] 11.6 After restore: child login works with existing credentials
- [ ] 11.7 After restore: contacts list shows connected users
- [ ] 11.8 Partial restore: contact shows N/D when other parent has not restored yet
- [ ] 11.9 After full restore from both parents: contacts show correct nicks
- [ ] 11.10 Restore with invalid certificate → error message (no loop)
- [ ] 11.11 Restore without certificate → normal login error

## 12. Edge Cases & Errors
- [ ] 12.1 Login with wrong credentials → clear error message
- [ ] 12.2 Duplicate parent registration → error
- [ ] 12.3 Edit child nickname → updated in login select
- [ ] 12.4 Delete child → connections removed, system message sent to contacts
- [ ] 12.5 Rate limiting on auth endpoints (too many attempts → 429)

## 13. Device Re-provisioning
- [ ] 13.1 Re-provision child device (parent auth) → old device deleted, new device created
- [ ] 13.2 Re-provision updates public key for the child
- [ ] 13.3 Online contacts receive `key_changed` WebSocket notification
- [ ] 13.4 After re-provision: child can login and send/receive messages with new keys
- [ ] 13.5 Re-provision non-existent user → 404
- [ ] 13.6 Re-provision without parent auth → 401
- [ ] 13.7 Connection list includes public key (`key` field)

## 14. Push Notifications
- [ ] 14.1 VAPID keys configured on Render (env vars present)
- [ ] 14.2 Register push subscription on device (endpoint returns 200)
- [ ] 14.3 Send message to offline user → push notification received
- [ ] 14.4 Push suppressed when recipient is in foreground (no double notification)
- [ ] 14.5 Push disabled gracefully when VAPID keys missing (no crash, warning logged)
- [ ] 14.6 Invalid/expired subscription → server removes it (no repeated errors)