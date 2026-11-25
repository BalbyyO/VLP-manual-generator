---
sidebar_position: 1
title: Accounts, Offline MFA & Admin Panel
---

# Multi-User Accounts, Sessions & Admin Panel

VLP Manual Generator supports up to **30 concurrent instructors** on a shared air-gapped host, with per-user isolated autosave workspaces, shared team manuals, offline TOTP multi-factor authentication, and an Open WebUI-style Account & Admin Settings panel.

![Account Settings and Offline TOTP MFA QR Setup](/img/screenshots/10-account-mfa-admin.png)

## Opening Settings & Admin Panel

Click your **Account pill** in the top-right corner of the header to open the Settings modal.

### Personal Tabs (All Active Users)

- **Account**:
  - Update your display name and password (8–128 characters, hashed with salted `scrypt`).
  - **Multi-Factor Authentication (Offline TOTP)**: Click **Enable MFA (Offline TOTP)** to generate an offline QR code PNG (scannable with Google Authenticator, Microsoft Authenticator, Authy, or KeePassXC) plus a grouped Base32 manual setup key with a one-click **Copy Key** button. Enter a 6-digit code to activate MFA.
  - **Personal API Key**: Generate a scoped `vlp_sk_...` bearer token if enabled by your administrator.
- **My Projects (Multi-Manual Workspace)**:

![My Projects Multi-Manual Workspace](/img/screenshots/11-my-projects.png)

  - Work on multiple separate lab manuals concurrently without overwriting other work. Click **Save as Project** to create a named project under `/data/users/<id>/projects/`.
  - Whenever you edit, add screenshots, or change pages while a project is active, changes **auto-save directly to that project**. Use **Resume**, **+ New Blank Project**, **Rename**, **Duplicate**, or **Delete** to switch between manuals and pick up right where you left off.
  - Uploaded images are deduplicated on disk in `/data/images/` so even manuals with dozens of high-resolution screenshots save instantaneously without hitting payload limits.
- **Sessions**:
  - **Private Snapshots**: Save named checkpoints in your isolated `/data/users/<id>/sessions/` directory and restore them anytime without affecting other authors.
  - **Shared Team Manuals**: Publish a manual snapshot to `/data/shared-sessions/` so other instructors on the host can load or collaborate from a shared baseline.
  - **JSON Backups**: Export or import portable `.json` project files for offline archival.
- **Data Controls**: Inspect browser `IndexedDB` autosave status or clear local cache safely.
- **About**: View version info (`v0.3.5-beta`), security architecture summary, and **Report Bug on GitHub**.

### Admin &bull; System Tabs (Administrators Only)

- **Users**: Create accounts directly, approve or reject `pending` sign-ups, assign roles (`admin`, `user`, `pending`), assign groups, reset passwords, or reset a user's MFA if they lose their authenticator device.
- **Groups**: Organize instructors into course or team groups.
- **Authentication**:
  - Toggle **Login Form**, **New Sign Ups**, **API Keys**, **Default User Role** (`pending` or `user`), **JWT Session Expiration** (e.g., `4w`), and **Require MFA for all users**.
  - Customize the **Pending Accounts** overlay title, message, and admin contact details.
  - Configure optional **LDAP** and **OAuth / OIDC** settings (secrets are encrypted at rest with AES-256-GCM).
- **Security Audit**: Review timestamped authentication, account creation, role change, and admin configuration audit events.

## Security & PII Protection Summary

| Control | Implementation |
| --- | --- |
| **Password Hashing** | Per-user 32-byte CSPRNG salt + `crypto.scryptSync` (`N=16384, r=8, p=1`, 64-byte key) verified via `crypto.timingSafeEqual`. |
| **PII & Secret Encryption** | Names, emails, usernames, MFA secrets, LDAP bind passwords, and OAuth client secrets are encrypted on disk using **AES-256-GCM**. |
| **Blind Lookup Indexes** | Email and username lookups use keyed **HMAC-SHA256** blind indexes so plaintext PII never appears in `/data/users.json`. |
| **Session Cookies** | HMAC-SHA256 signed `HttpOnly; SameSite=Strict` cookies with server-side `sessionVersion` revocation and brute-force login throttling (`HTTP 429`). |
