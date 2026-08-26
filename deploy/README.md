# Production deployment bootstrap

Run every command from the repository root on the EC2 server.

## 1. Create the real environment files

```bash
cp deploy/env/backend.env.example deploy/env/backend.env
cp deploy/env/storefront.env.example deploy/env/storefront.env
```

Replace every `CHANGE_ME` value. The real `.env` files are ignored by both Git
and Docker.

Generate different values for `JWT_SECRET` and `COOKIE_SECRET`:

```bash
openssl rand -hex 32
openssl rand -hex 32
```

## 2. Define the Compose command

All production Compose commands need both environment files:

```bash
docker compose \
  --env-file deploy/env/backend.env \
  --env-file deploy/env/storefront.env \
  -f docker-compose.production.yml config
```

## 3. Start the backend first

The storefront cannot be built until the public Medusa API is online.

```bash
docker compose \
  --env-file deploy/env/backend.env \
  --env-file deploy/env/storefront.env \
  -f docker-compose.production.yml \
  up -d --build backend
```

This starts PostgreSQL and Redis, runs `medusa db:migrate`, and then starts the
Medusa backend. Check it locally on the EC2 server:

```bash
curl --fail http://127.0.0.1:9000/health
```

Configure DNS, Nginx, and HTTPS for `api.tranhtranvienmetal.com` before moving
to the storefront build.

## 4. Configure Nginx

Install Nginx on the EC2 host, then copy and enable the repository config:

```bash
sudo cp deploy/nginx/tranhtranvienmetal.conf \
  /etc/nginx/sites-available/tranhtranvienmetal.conf

sudo ln -s /etc/nginx/sites-available/tranhtranvienmetal.conf \
  /etc/nginx/sites-enabled/tranhtranvienmetal.conf

sudo nginx -t
sudo systemctl reload nginx
```

At this point, both DNS records must point to the EC2 Elastic IP and port `80`
must be open in the EC2 security group. Verify HTTP before requesting HTTPS:

```bash
curl --fail http://api.tranhtranvienmetal.com/health
curl --head http://staging.tranhtranvienmetal.com
```

The API can be enabled first. The staging check will succeed only after the
storefront container has been built and started.

Use Certbot after the DNS records resolve correctly:

```bash
sudo certbot --nginx \
  -d api.tranhtranvienmetal.com \
  -d staging.tranhtranvienmetal.com

sudo certbot renew --dry-run
```

Certbot updates the enabled config on the EC2 server with the HTTPS certificate
and HTTP-to-HTTPS redirects.

## 5. Create the publishable API key

Open `https://api.tranhtranvienmetal.com/app`, create a publishable API key,
and assign the default sales channel. Put the key in:

```text
deploy/env/storefront.env
```

## 6. Build and start the storefront

```bash
docker compose \
  --env-file deploy/env/backend.env \
  --env-file deploy/env/storefront.env \
  -f docker-compose.production.yml \
  up -d --build storefront
```

The staging storefront listens only on `127.0.0.1:8000`. Nginx should proxy
`staging.tranhtranvienmetal.com` to that address.

## Routine updates

After the first deployment, rebuild and restart the full stack with:

```bash
docker compose \
  --env-file deploy/env/backend.env \
  --env-file deploy/env/storefront.env \
  -f docker-compose.production.yml \
  up -d --build
```
