# Stage 1: Install vetted production Node dependencies cleanly
FROM node:22-alpine AS builder

WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

# Stage 2: Minimal hardened Alpine runtime (patched libcrypto3/libssl3/musl/zlib & zero npm/tar CLI CVEs)
FROM alpine:latest

LABEL org.opencontainers.image.source="https://github.com/BalbyyO/VLP-manual-generator"
LABEL org.opencontainers.image.description="Self-contained air-gapped VLP Manual HTML Formatter & XML Builder"
LABEL org.opencontainers.image.version="0.3.3-beta"

# Install latest Alpine OS security upgrades + Node.js runtime only (no npm/corepack/yarn CLI packages)
RUN apk update \
 && apk upgrade --no-cache \
 && apk add --no-cache nodejs \
 && rm -rf /var/cache/apk/* /tmp/*

WORKDIR /app

COPY --from=builder /build/package.json /build/package-lock.json ./
COPY --from=builder /build/node_modules ./node_modules

# Copy application source and offline reference manuals
COPY server.js ./
COPY public ./public
COPY dsac.annexb.lab01-en ./dsac.annexb.lab01-en
COPY dsac.annexc.lab01-en ./dsac.annexc.lab01-en
COPY vlp-manual-html-formatter.txt ./vlp-manual-html-formatter.txt

# Prepare persistent data directory for sessions and uploaded images
RUN mkdir -p /data/sessions /data/images

ENV NODE_ENV=production
ENV PORT=8080
ENV DATA_DIR=/data

VOLUME ["/data"]
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
