FROM node:20-bookworm-slim AS dependencies

ENV NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false

WORKDIR /app

# The image must be built with the repository root as its build context so npm
# can resolve both workspaces from the root lockfile.
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/storefront/package.json ./apps/storefront/package.json

RUN npm ci --workspace=@dtc/storefront --include-workspace-root


FROM node:20-bookworm-slim AS builder

ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
ARG NEXT_PUBLIC_DEFAULT_REGION=us
ARG NEXT_PUBLIC_BASE_URL=http://localhost:8000
ARG NEXT_PUBLIC_STRIPE_KEY
ARG NEXT_PUBLIC_MEDIA_URL
ARG NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID
ARG NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY
ARG MEDUSA_CLOUD_S3_HOSTNAME
ARG MEDUSA_CLOUD_S3_PATHNAME

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY \
    NEXT_PUBLIC_MEDUSA_BACKEND_URL=$NEXT_PUBLIC_MEDUSA_BACKEND_URL \
    NEXT_PUBLIC_DEFAULT_REGION=$NEXT_PUBLIC_DEFAULT_REGION \
    NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_STRIPE_KEY=$NEXT_PUBLIC_STRIPE_KEY \
    NEXT_PUBLIC_MEDIA_URL=$NEXT_PUBLIC_MEDIA_URL \
    NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID=$NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID \
    NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY \
    MEDUSA_CLOUD_S3_HOSTNAME=$MEDUSA_CLOUD_S3_HOSTNAME \
    MEDUSA_CLOUD_S3_PATHNAME=$MEDUSA_CLOUD_S3_PATHNAME

WORKDIR /app

COPY --from=dependencies /app ./
COPY apps/storefront/check-env-variables.js ./apps/storefront/check-env-variables.js
COPY apps/storefront/next-env.d.ts ./apps/storefront/next-env.d.ts
COPY apps/storefront/next.config.js ./apps/storefront/next.config.js
COPY apps/storefront/next-sitemap.js ./apps/storefront/next-sitemap.js
COPY apps/storefront/postcss.config.js ./apps/storefront/postcss.config.js
COPY apps/storefront/tailwind.config.js ./apps/storefront/tailwind.config.js
COPY apps/storefront/tsconfig.json ./apps/storefront/tsconfig.json
COPY apps/storefront/public ./apps/storefront/public
COPY apps/storefront/src ./apps/storefront/src

RUN npm run build --workspace=@dtc/storefront


FROM node:20-bookworm-slim AS runner

ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
ARG NEXT_PUBLIC_DEFAULT_REGION=us
ARG NEXT_PUBLIC_BASE_URL=http://localhost:8000
ARG NEXT_PUBLIC_STRIPE_KEY
ARG NEXT_PUBLIC_MEDIA_URL
ARG NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID
ARG NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY
ARG MEDUSA_CLOUD_S3_HOSTNAME
ARG MEDUSA_CLOUD_S3_PATHNAME

ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=8000 \
    NEXT_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY \
    NEXT_PUBLIC_MEDUSA_BACKEND_URL=$NEXT_PUBLIC_MEDUSA_BACKEND_URL \
    NEXT_PUBLIC_DEFAULT_REGION=$NEXT_PUBLIC_DEFAULT_REGION \
    NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_STRIPE_KEY=$NEXT_PUBLIC_STRIPE_KEY \
    NEXT_PUBLIC_MEDIA_URL=$NEXT_PUBLIC_MEDIA_URL \
    NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID=$NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID \
    NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY \
    MEDUSA_CLOUD_S3_HOSTNAME=$MEDUSA_CLOUD_S3_HOSTNAME \
    MEDUSA_CLOUD_S3_PATHNAME=$MEDUSA_CLOUD_S3_PATHNAME

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/storefront/package.json ./apps/storefront/package.json

RUN npm ci --omit=dev --workspace=@dtc/storefront --include-workspace-root \
    && npm cache clean --force

COPY --chown=node:node --from=builder /app/apps/storefront/.next ./apps/storefront/.next
COPY --chown=node:node apps/storefront/check-env-variables.js ./apps/storefront/check-env-variables.js
COPY --chown=node:node apps/storefront/next.config.js ./apps/storefront/next.config.js
COPY --chown=node:node apps/storefront/public ./apps/storefront/public

WORKDIR /app/apps/storefront

USER node

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:8000/').then(r => { if (!r.ok) process.exit(1) }).catch(() => process.exit(1))"]

CMD ["npm", "run", "start"]
