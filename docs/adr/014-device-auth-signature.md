# ADR 014 — Device authentication signature scheme

## Status

Accepted

## Context

Child devices authenticate to the API via `POST /api/v1/auth/user` using a token composed of:

```
base64(userId).base64(deviceId).signedDeviceId
```

The original implementation used Node's `crypto.privateEncrypt` (client-side) and `crypto.publicDecrypt` (server-side) with PKCS#1 v1.5 padding. This is a raw RSA operation that the Web Crypto API does not support — Web Crypto only exposes standard sign/verify and encrypt/decrypt operations.

The client (PWA) must authenticate using browser-native APIs without external cryptographic libraries.

## Decision

Replace `publicDecrypt` verification with `crypto.verify` using **RSASSA-PKCS1-v1_5 with SHA-256**.

### Server (Node.js)

```javascript
const verified = crypto.verify(
  'sha256',
  Buffer.from(deviceId),
  { key: publicKey, padding: crypto.constants.RSA_PKCS1_PADDING },
  Buffer.from(signature, 'base64')
);
```

### Client (Web Crypto API)

```javascript
const privateKey = await crypto.subtle.importKey(
  'pkcs8', keyData,
  { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA256' },
  false, ['sign']
);
const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, encodedDeviceId);
```

### Key pair usage

Each child device has one RSA-2048 key pair stored as SPKI (public) / PKCS#8 (private) PEM:

| Purpose | Algorithm | Operations |
|---------|-----------|------------|
| Device authentication | RSASSA-PKCS1-v1_5 + SHA-256 | sign (client) / verify (server) |
| Message encryption | RSA-OAEP + AES-256-GCM | encrypt (sender) / decrypt (recipient) |

The same key pair serves both purposes. Web Crypto allows importing the same PKCS#8 key under different algorithm parameters.

## Consequences

- No external crypto libraries required on the client (pure Web Crypto API)
- Standard sign/verify is semantically correct for authentication (vs. encrypt/decrypt abuse)
- Breaking change: existing device tokens created with `privateEncrypt` will not verify — devices must re-authenticate (acceptable since child tokens are short-lived and device profiles can be re-provisioned)
- The `pubDecode` utility function in the API is no longer used for auth (may still be used elsewhere)
