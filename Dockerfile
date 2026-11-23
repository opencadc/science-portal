# =============================================================================
# Multi-stage Dockerfile for Next.js Science Portal
# =============================================================================

# Stage 1: Dependencies
# Install dependencies only when needed
FROM node:22-trixie-slim AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Stage 2: Builder
# Rebuild the source code only when needed
FROM node:22-trixie-slim AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files (includes patches/ for patch-package).
COPY . .

# Apply dependency patches. The deps stage only had package.json + lockfile, so postinstall
# could not apply patches there; @auth/core OAuth redirect_uri fix must run before next build.
RUN npx patch-package

# Build-time: basePath and client-bundled flags. External API URLs are optional here;
# set LOGIN_API, SKAHA_API, SERVICE_STORAGE_API, SRC_*, etc. at container runtime.
ARG NEXT_PUBLIC_LOGIN_API=
ARG NEXT_PUBLIC_SKAHA_API=
ARG NEXT_PUBLIC_SRC_SKAHA_API=https://src.canfar.net/skaha
ARG NEXT_PUBLIC_SRC_CAVERN_API=https://src.canfar.net/cavern
ARG NEXT_PUBLIC_API_TIMEOUT=30000
ARG NEXT_PUBLIC_USE_CANFAR=true
ARG NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS=false
ARG NEXT_PUBLIC_EXPERIMENTAL=true
ARG NEXT_PUBLIC_BASE_PATH=/science-portal

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_LOGIN_API=$NEXT_PUBLIC_LOGIN_API
ENV NEXT_PUBLIC_SKAHA_API=$NEXT_PUBLIC_SKAHA_API
ENV NEXT_PUBLIC_SRC_SKAHA_API=$NEXT_PUBLIC_SRC_SKAHA_API
ENV NEXT_PUBLIC_SRC_CAVERN_API=$NEXT_PUBLIC_SRC_CAVERN_API
ENV NEXT_PUBLIC_API_TIMEOUT=$NEXT_PUBLIC_API_TIMEOUT
ENV NEXT_PUBLIC_USE_CANFAR=$NEXT_PUBLIC_USE_CANFAR
ENV NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS=$NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS
ENV NEXT_PUBLIC_EXPERIMENTAL=$NEXT_PUBLIC_EXPERIMENTAL
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH

# Build Next.js application
# The standalone output will be in .next/standalone
RUN npm run build

# Stage 3: Init
# The distroless runner has no package manager, so fetch dumb-init here and copy the
# binary across. Same Debian release as the runner, so its glibc dependency matches.
FROM node:22-trixie-slim AS init
RUN apt update \
  && apt install -y --no-install-recommends dumb-init \
  && rm -rf /var/lib/apt/lists/*

# Stage 4: Runner
# Production image, copy all the files and run next.
# Distroless Node 22 on Debian 13: no shell, package manager, npm, or Debian base
# utilities (util-linux, perl, sqlite, ncurses, ...), which is where the unfixed
# Trivy HIGH findings of the previous `node:22-trixie-slim` runner came from.
# There is nothing to `apt upgrade` here; OS fixes arrive by rebuilding on a fresh base.
FROM gcr.io/distroless/nodejs22-debian13:nonroot AS runner

ARG NEXT_PUBLIC_BASE_PATH=/science-portal
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# dumb-init for signal handling (graceful shutdown) and zombie reaping
COPY --from=init /usr/bin/dumb-init /usr/bin/dumb-init

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone build output, owned by the image's built-in non-root user
# (`nonroot`, uid/gid 65532)
COPY --from=builder --chown=65532:65532 /app/.next/standalone ./
COPY --from=builder --chown=65532:65532 /app/.next/static ./.next/static

# Run as the non-root user (already the default of the `:nonroot` tag; explicit here)
USER 65532:65532

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check for container orchestration (basePath from runner ENV).
# Exec form with an absolute path: the image has no shell and `node` is not on PATH.
# Health checks use Node, not curl.
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD ["/nodejs/bin/node", "-e", "const p=process.env.NEXT_PUBLIC_BASE_PATH||'';require('http').get('http://127.0.0.1:3000'+p+'/api/health',(r)=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"]

# Use dumb-init to handle signals properly (graceful shutdown)
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start the Next.js server
CMD ["/nodejs/bin/node", "server.js"]
