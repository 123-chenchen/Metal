<p align="center">
  <a href="https://www.medusajs.com">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/59018053/229103275-b5e482bb-4601-46e6-8142-244f531cebdb.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    <img alt="Medusa logo" src="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    </picture>
  </a>
</p>
<h1 align="center">
  Medusa DTC Starter
</h1>

<h4 align="center">
  <a href="https://docs.medusajs.com">Documentation</a> |
  <a href="https://www.medusajs.com">Website</a>
</h4>

<p align="center">
  Building blocks for digital commerce
</p>
<p align="center">
  <a href="https://github.com/medusajs/medusa/blob/develop/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="Medusa is released under the MIT license." />
  </a>
  <a href="https://circleci.com/gh/medusajs/medusa">
    <img src="https://circleci.com/gh/medusajs/medusa.svg?style=shield" alt="Current CircleCI build status." />
  </a>
  <a href="https://github.com/medusajs/medusa/blob/develop/CONTRIBUTING.md">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat" alt="PRs welcome!" />
  </a>
    <a href="https://www.producthunt.com/posts/medusa"><img src="https://img.shields.io/badge/Product%20Hunt-%231%20Product%20of%20the%20Day-%23DA552E" alt="Product Hunt"></a>
  <a href="https://discord.gg/xpCwq3Kfn8">
    <img src="https://img.shields.io/badge/chat-on%20discord-7289DA.svg" alt="Discord Chat" />
  </a>
  <a href="https://twitter.com/intent/follow?screen_name=medusajs">
    <img src="https://img.shields.io/twitter/follow/medusajs.svg?label=Follow%20@medusajs" alt="Follow @medusajs" />
  </a>
</p>

# Medusa DTC Starter

A production-ready monorepo starter for direct-to-consumer ecommerce stores powered by Medusa and Next.js. Includes a fully featured storefront with product browsing, cart, checkout, customer accounts, and order management.

## Features

- All of [Medusa's commerce features](https://docs.medusajs.com/resources/commerce-modules)
- Multi-region support with automatic country detection
- Product catalog with variant selection
- Cart with promotion codes
- Multi-step checkout with shipping and payment
- Customer accounts with order history and address management
- Order transfer between accounts

## Getting Started

### Deploy with Medusa Cloud

The fastest way to get started is deploying with [Medusa Cloud](https://cloud.medusajs.com):

1. [Create a Medusa Cloud account](https://cloud.medusajs.com)
2. Deploy this starter directly from your dashboard

### Local Installation

> **Prerequisites:**
>
> - [Node.js](https://nodejs.org/) v20+
> - [npm](https://www.npmjs.com/) v10+ (this repo's package manager — see `packageManager` in `package.json`; don't use pnpm/yarn, it'll create a second lockfile)
> - [Docker](https://www.docker.com/) (to run Postgres + Redis locally via the included `docker-compose.yml`), **or** your own local [PostgreSQL](https://www.postgresql.org/) v15+ and Redis

1. Clone the repository and install dependencies:

```bash
git clone https://github.com/123-chenchen/Metal.git
cd Metal
npm install
```

2. Start Postgres and Redis (skip this if you're pointing at your own instances instead):

```bash
npm run docker:up
```

This starts a `medusa`/`medusa` Postgres database on `localhost:5432` and Redis on `localhost:6379`, matching the defaults in the env template below.

3. Set up environment variables for the backend:

```bash
cp apps/backend/.env.template apps/backend/.env
```

The template's `DATABASE_URL` already matches step 2's Docker setup. If you're using your own Postgres instance instead, edit `DATABASE_URL` accordingly (make sure the database exists first). File uploads (product images, custom-poster uploads) also need the `S3_*` Cloudflare R2 variables in that file filled in — ask a teammate for dev credentials, or the backend will start fine but any upload will fail until they're set.

4. Run migrations:

```bash
cd apps/backend
npm exec medusa db:migrate
```

5. Add an admin user:

```bash
npm exec medusa user -e admin@test.com -p supersecret
```

6. (Optional) Seed initial store data — regions, sales channels, shipping, and the product categories used by this store:

```bash
cd ..
npm run backend:seed
```

> **Region gotcha:** the storefront defaults to region code `vn` (`NEXT_PUBLIC_DEFAULT_REGION` in its env template). If you seed fresh data or start from an empty database, make sure a Region covering that country exists (Admin > Settings > Regions) — without one, every product page 404s. If you're instead pointing at an existing database that already has data (e.g. a teammate's export), you can skip seeding entirely.

7. Start the Medusa backend:

```bash
npm run backend:dev
```

8. Open the admin dashboard at `localhost:9000/app`, log in, and retrieve your publishable API key at Settings > Publishable API Keys. Make sure it's linked to a Sales Channel (Settings > Publishable API Keys > your key > Sales Channels) — an unlinked key causes storefront product requests to fail.

9. Set up environment variables for the storefront:

```bash
cp apps/storefront/.env.template apps/storefront/.env.local
```

10. Update `apps/storefront/.env.local` with your Medusa publishable API key from step 8:

```bash
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_6c3...
```

11. Start the storefront:

```bash
npm run storefront:dev
```

The storefront runs on `http://localhost:8000`.

You can also run the following command from the root to start both backend and storefront together:

```bash
npm run dev
```

### Getting an exact copy of a teammate's local data

`npm run backend:seed` only sets up a *baseline* store (region, shipping, categories, and the two Custom poster products) — it does **not** carry over anything created by hand in Admin (extra products, catalog images, sales channel tweaks, etc.). To hand a teammate an exact copy of your local database instead of having them reseed from scratch:

1. Export a dump (run this yourself, not something committed to git — the file is data, not code):

```bash
docker exec metal-postgres pg_dump -U medusa -d medusa --no-owner --no-privileges -F c -f /tmp/medusa-dump.dump
docker cp metal-postgres:/tmp/medusa-dump.dump ./medusa-dump.dump
docker exec metal-postgres rm /tmp/medusa-dump.dump
```

2. Share `medusa-dump.dump` with your teammate directly (Slack, shared drive, etc.) — don't commit it to the repo.
3. They restore it into their own (empty, freshly migrated) database:

```bash
docker exec -i metal-postgres pg_restore -U medusa -d medusa --clean --if-exists --no-owner --no-privileges < medusa-dump.dump
```

Product/media images themselves stay in Cloudflare R2 — the dump only carries the URLs pointing at them, so as long as everyone's `S3_FILE_URL`/`NEXT_PUBLIC_MEDIA_URL` point at the same bucket, images just work after a restore.

## Configuration

The storefront is configured via environment variables in `apps/storefront/.env.local`:

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Publishable API key from your Medusa backend | — |
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | URL of your Medusa backend | `http://localhost:9000` |
| `NEXT_PUBLIC_DEFAULT_REGION` | Default region country code | `vn` |
| `NEXT_PUBLIC_BASE_URL` | Base URL of the storefront | `http://localhost:8000` |
| `NEXT_PUBLIC_STRIPE_KEY` | Stripe publishable key (optional) | — |
| `NEXT_PUBLIC_MEDIA_URL` | Public base URL for R2-hosted product/media images (should match backend's `S3_FILE_URL`) | — |

The backend is configured via environment variables in `apps/backend/.env` — see `apps/backend/.env.template` for the full list, including the Cloudflare R2 (`S3_*`) variables required for image uploads.

## Resources

- [Medusa Documentation](https://docs.medusajs.com)
- [Medusa Cloud](https://cloud.medusajs.com)
