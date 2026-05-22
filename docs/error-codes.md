# Error Codes Reference

Standard error codes returned by the API in the `errCode` field.

## Codes

| Code | HTTP Status | Meaning | Endpoints |
|------|-------------|---------|-----------|
| -1 | 500 | Internal server error | Any |
| 0 | 200 | Success (internal use) | auth service |
| 1 | 401 | Authentication required (no/invalid JWT) | Any authenticated endpoint |
| 2 | 400/409 | Already exists (email, connection) | POST /parent, POST /sync/restore |
| 3 | 404 | Not found (user, parent) | Various |
| 4 | 400 | Validation error (invalid input) | Any with express-validator |
| 5 | 400 | Invalid or expired OTP | POST /parent/reset |
| 6 | 401 | Token not valid (user auth) | POST /auth/user |
| 7 | 401 | Profile mismatch (wrong profile for endpoint) | Any with authorize() |
| 8 | 401 | Wrong device (device ID mismatch) | POST /auth/user |
| 9 | 400 | Status field missing | PATCH /connection/:id |
| 10 | 400 | Status value not recognized | PATCH /connection/:id |
| 11 | 409 | Connection already exists or pending | POST /connection/:from/:to |
| 12 | 401 | Password mismatch | POST /auth/parent, PATCH /parent/password |
| 13 | 401 | Missing credentials (no token/email/pwd) | POST /auth/parent, POST /auth/user |
| 14 | 401 | No device registered for user | POST /auth/user |
| 15 | 429 | Rate limited | Auth, reset, discovery |

## Notes

- Code -1 is intentionally vague for security (no internal details exposed)
- Code 4 is used for all express-validator failures; `details` array contains field-level errors
- Code 5 includes attempt counting (`N attempts remaining` in errDesc)
- The client should use `errCode` for programmatic handling and `errDesc` for fallback display
