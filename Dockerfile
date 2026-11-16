FROM node:20-alpine

LABEL org.opencontainers.image.source="https://github.com/BalbyyO/VLP-manual-generator"
LABEL org.opencontainers.image.description="Self-contained air-gapped VLP Manual HTML Formatter & XML Builder"
LABEL org.opencontainers.image.version="0.2.1-beta"

WORKDIR /app

# Install production dependencies at image build time for air-gapped runtime
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

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
