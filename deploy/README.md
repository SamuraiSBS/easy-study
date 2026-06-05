# Production deploy

This setup runs the API on one VPS while the frontend stays on Vercel:

- Caddy terminates HTTPS for `api.uchebalegho.ru`.
- Frontend is served by Vercel on `uchebalegho.ru` and `www.uchebalegho.ru`.
- Backend is available at `https://api.uchebalegho.ru/api`.
- PostgreSQL data is stored in the `postgres_data` Docker volume.

## DNS

Point these records to the VPS public IP:

```text
api.uchebalegho.ru  A 178.209.127.121
```

Keep Vercel records for the frontend:

```text
uchebalegho.ru      A     216.198.79.1
www.uchebalegho.ru  CNAME 6a1aa8c9d5da6402.vercel-dns-017.com
```

## Server

Install Docker and the Compose plugin, then copy the repository to the server.
Create the real production env file:

```bash
cp backend/.env.production.example backend/.env.production
nano backend/.env.production
```

Set a strong `POSTGRES_PASSWORD` and the real `TELEGRAM_BOT_TOKEN`.

Start production:

```bash
docker compose --env-file backend/.env.production -f docker-compose.production.yml up -d --build
docker compose --env-file backend/.env.production -f docker-compose.production.yml ps
```

Check health:

```bash
curl -fsS https://api.uchebalegho.ru/health
curl -fsS https://api.uchebalegho.ru/api/health/db
```

Set Telegram webhook:

```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=https://api.uchebalegho.ru/api/telegram/webhook"
```
