FROM node:20-bookworm-slim AS dependencies

ENV NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false

WORKDIR /app

# The image must be built with the repository root as its build context so npm
# can resolve both workspaces from the root lockfile.
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/storefront/package.json ./apps/storefront/package.json

RUN npm ci --workspace=@dtc/backend --include-workspace-root


FROM node:20-bookworm-slim AS builder

ENV NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false

WORKDIR /app

COPY --from=dependencies /app ./
COPY apps/backend/medusa-config.ts ./apps/backend/medusa-config.ts
COPY apps/backend/instrumentation.ts ./apps/backend/instrumentation.ts
COPY apps/backend/tsconfig.json ./apps/backend/tsconfig.json
COPY apps/backend/src ./apps/backend/src

# These placeholders are scoped to the build command. Real production values
# must be injected into the server and worker containers at runtime.
RUN NODE_ENV=production \
    DATABASE_URL=postgresql://build:build@localhost:5432/build \
    STORE_CORS=http://localhost:8000 \
    ADMIN_CORS=http://localhost:9000 \
    AUTH_CORS=http://localhost:8000,http://localhost:9000 \
    JWT_SECRET=build-only-jwt-secret \
    COOKIE_SECRET=build-only-cookie-secret \
    npm run build --workspace=@dtc/backend

# Medusa Admin is React 18. Fail the image build if the React 19 runtime from
# the storefront workspace is ever bundled into it, which would crash Admin
# with React error #31 in the browser.
RUN if grep -R -q "react.transitional.element" \
      apps/backend/.medusa/server/public/admin/assets; then \
      echo "React 19 was bundled into the Medusa Admin build" >&2; \
      exit 1; \
    fi


FROM node:20-bookworm-slim AS runner

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=9000 \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false

WORKDIR /app

# A Medusa production build is a standalone application generated here.
COPY --from=builder /app/apps/backend/.medusa/server ./

RUN npm install --omit=dev \
    && npm cache clean --force \
    && chown -R node:node /app

USER node

EXPOSE 9000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:9000/health').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"]

CMD ["npm", "run", "start"]
