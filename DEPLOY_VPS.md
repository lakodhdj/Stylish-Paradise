# Deploy to VPS (64.188.92.174)

## 1) Prepare environment

1. Copy `.env.example` to `.env`.
2. Set secure MinIO credentials (do not use defaults in production):
   - `MINIO_ROOT_USER`
   - `MINIO_ROOT_PASSWORD`
3. Set public MinIO URLs via your domain (without `:9000`):
   - `MINIO_PUBLIC_URL=https://imgstylish.conperf.pro`
   - `MINIO_SERVER_URL=https://imgstylish.conperf.pro`
   - `MINIO_BROWSER_REDIRECT_URL=https://imgstylish.conperf.pro`
4. Keep:
   - `COMPOSE_PROJECT_NAME=stylish-paradise`

## 2) Choose one data mode

### A. Clean start (empty DB + empty MinIO)

Use this if you want to create products from scratch:

```bash
docker compose down -v --remove-orphans
docker volume rm stylish-paradise_minio_data stylish-paradise_sqlite_data 2>/dev/null || true
docker compose up -d --build
```

### B. Restore persisted data from old host

If you exported volumes from old host:

- MinIO archive: `minio_data.tar.gz`
- SQLite archive: `sqlite_data.tar.gz`

Restore into compose volumes:

```bash
docker compose down
docker volume create stylish-paradise_minio_data
docker volume create stylish-paradise_sqlite_data
docker run --rm -v stylish-paradise_minio_data:/to -v "$PWD":/from alpine sh -c "cd /to && tar -xzf /from/minio_data.tar.gz"
docker run --rm -v stylish-paradise_sqlite_data:/to -v "$PWD":/from alpine sh -c "cd /to && tar -xzf /from/sqlite_data.tar.gz"
docker compose up -d --build
```

## 3) Verify services

```bash
docker compose ps
curl -I http://64.188.92.174
curl -I https://imgstylish.conperf.pro
```

## 4) Nginx Proxy Manager note

If `http://64.188.92.174/` shows the default NPM page, frontend host routing is not configured yet.
Create Proxy Hosts in NPM admin (`:81`) for frontend and API if you want domain-based routing without explicit ports.
