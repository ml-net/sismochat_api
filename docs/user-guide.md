# SiSMoChat User Guide

SiSMoChat is a privacy-first messaging system designed for families. Parents maintain full control over their children's communications while messages remain end-to-end encrypted.

## Key Concepts

- **Parent account**: the administrator. Manages children, approves connections, controls permissions.
- **Child account**: a user managed by a parent. Can chat only with approved contacts.
- **Connection**: a friendship link between two children, approved by both parents.
- **End-to-end encryption**: the server cannot read messages. Only sender and recipient can.

## Getting Started

### 1. Register as a Parent

Create an account with your email and a password (minimum 6 characters). You'll use these credentials to manage your family.

### 2. Create a Child

From the parent dashboard, create one or more child profiles. Each child gets:
- A nickname (visible to contacts)
- A unique device with encryption keys
- A set of permissions you control

### 3. Child Login

Children access the system using their profile (selected from the parent's device or on their own device). No email or password needed for children — access is managed by the parent.

## Connecting with Others

### Discovery

Find another parent by their email address. You'll see their children's nicknames (no other personal data is exposed).

### Requesting a Connection

Select your child and the other parent's child to send a connection request. The other parent must approve it before the children can communicate.

### Approving Requests

When someone requests a connection with your child, you'll see it in your pending approvals. You can approve or reject.

### Removing a Connection

You can remove any of your child's connections at any time. Both sides are disconnected and the other user receives a notification.

## Messaging

### Text Messages

Children can send text messages to their approved contacts. Messages are encrypted end-to-end — the server relays them but cannot read the content.

### Emoji

An emoji picker is available with a curated set of emoji. Select and insert into your message.

### Stickers

A predefined sticker pack is available. Tap a sticker to send it directly.

### Audio (Push-to-Talk)

Record and send short audio messages (max 20 seconds). Press to start recording, press again to send. The recording stops automatically at 20 seconds.

## Parental Controls

### Permissions

Parents control what each child can do. Available permissions:

| Permission | Effect when disabled |
|-----------|---------------------|
| `audio` | Child cannot send or receive audio messages |
| `sticker` | Child cannot send or receive stickers |
| `delete_messages` | Child cannot delete messages from local history |

Permissions can be changed at any time from the parent dashboard.

### Connection Management

- Only parents can request, approve, or remove connections
- Children cannot add contacts on their own
- Parents see all sent/received connection requests with status

## Device Management

### Re-provisioning

If a child's device is lost, broken, or compromised:
1. Parent clicks "Re-provision" from the dashboard
2. The old device is immediately invalidated
3. A new device with fresh encryption keys is created
4. Connections and permissions are preserved
5. The child logs in from the new device

The old device can no longer access the system.

### Multiple Devices

Each child has exactly one active device. Re-provisioning replaces it.

## Recovery

### Server Restart

The system automatically recovers from server restarts. Each parent must login once after a restart to restore their family's data — this happens automatically, no manual action needed. Once a parent has logged in, all their children can login and chat normally. Contacts from other families will appear once the other parent has also logged in.

### Device Loss (Parent)

If the parent device is lost but the server is active: simply login with email and password from any device.

If both the parent device and server data are lost: restore from a backup of the state certificate (QR code or encrypted email export — feature coming soon).

### Device Loss (Child)

Parent re-provisions the child from the dashboard. The child then logs in from the new device. Local message history on the old device is lost (messages are stored locally, not on the server).

## Privacy & Security

- **End-to-end encryption**: messages are encrypted with RSA keys. The server cannot read them.
- **Server as relay**: messages are stored temporarily until downloaded, then deleted from the server.
- **Client as source of truth**: your message history lives on your device, not in the cloud.
- **No tracking**: no analytics, no ads, no data collection beyond what's needed to relay messages.
- **Open source**: the code is publicly available under AGPL-3.0.

## Known Limitations (Beta)

- After a period of inactivity, the first login of the day may take a few extra seconds (server waking up)
- Safari on iOS with strict privacy settings may have issues with local storage — Chrome is recommended
- Audio format varies by browser (mp4 on Safari, webm on Chrome)
