---
sidebar_position: 2
title: Installation & First-Run Setup
---

# Installation & First-Run Setup

VLP Manual Generator ships as a hardened, minimal Alpine Linux container image (`alpine:latest` + Node.js runtime only, zero `npm`/`corepack`/`yarn` CLI leftovers) that runs cleanly even under `docker run --network none`.

## Option 1: Docker Compose (Recommended)

Create a `docker-compose.yml` file on your host:

```yaml
services:
  vlp-manual-generator:
    image: ghcr.io/balbyyo/vlp-manual-generator:latest
    container_name: vlp-manual-generator
    ports:
      - "8080:8080"
    volumes:
      - ./data:/data
    environment:
      - PORT=8080
      - DATA_DIR=/data
    restart: unless-stopped
```

Start the studio:

```bash
docker compose up -d
```

Open **`http://localhost:8080`** in your browser.

## Option 2: Air-Gapped `.tar` Deployment

On an internet-connected machine, download `vlp-manual-generator-0.3.5-beta.tar` from the [GitHub Release page](https://github.com/BalbyyO/VLP-manual-generator/releases) and transfer it to your isolated lab network.

Load and run the image with zero network access:

```bash
docker load -i vlp-manual-generator-0.3.5-beta.tar
docker run -d --name vlp-manual-generator \
  -p 8080:8080 \
  -v "$(pwd)/data:/data" \
  ghcr.io/balbyyo/vlp-manual-generator:0.3.5-beta
```

:::info Persistent Data Volume (`/data`)
Mounting `/data` preserves all encrypted user accounts (`users.json`), authentication settings (`auth-config.json`), per-user autosaves and snapshots (`/data/users/<id>/sessions/`), shared team manuals (`/data/shared-sessions/`), and uploaded screenshots (`/data/images/`).
:::

## First-Run Administrator Bootstrap

When you visit `http://localhost:8080` on a fresh `/data` volume, the **Create First Administrator Account** overlay appears automatically:

![First-Run Administrator Account Setup](/img/screenshots/01-first-run-admin-setup.png)

1. Enter your **Full Name**, **Email Address**, **Username**, and a **Password** (minimum 8 characters).
2. Click **Create Admin Account** to sign in.
3. On your first sign-in, the **Button Demo Guide** pops up automatically so you can preview every formatting button and shortcut:

![Startup Button Demo Guide Modal](/img/screenshots/02-button-demo-guide.png)

:::tip Automated Headless Bootstrap
For automated deployments, you can pre-seed the initial administrator using environment variables `ADMIN_EMAIL` and `ADMIN_PASSWORD` (and optionally `APP_SECRET_KEY` for deterministic AES-256-GCM encryption across container rebuilds).
:::
