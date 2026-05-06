# Deploy to VPS (64.188.92.174)

## 1) Prepare environment

1. Copy `.env.example` to `.env`.
2. Set secure MinIO credentials (do not use defaults in production):
   - `MINIO_ROOT_PASSWORD`
   - `MINIO_SECRET_KEY`
3. Keep:
   - `MINIO_PUBLIC_URL=http://64.188.92.174:9000`
   - `COMPOSE_PROJECT_NAME=stylish-paradise`

## 2) Restore persisted data

If you already exported volumes from old host:

- MinIO archive: `minio_data.tar.gz`
- SQLite archive: `sqlite_data.tar.gz`

Restore into compose volumes:

```bash
docker compose down
docker volume create stylish-paradise_minio_data
docker volume create stylish-paradise_sqlite_data
docker run --rm -v stylish-paradise_minio_data:/to -v "$PWD":/from alpine sh -c "cd /to && tar -xzf /from/minio_data.tar.gz"
docker run --rm -v stylish-paradise_sqlite_data:/to -v "$PWD":/from alpine sh -c "cd /to && tar -xzf /from/sqlite_data.tar.gz"
```

## 3) Start stack

```bash
docker compose up -d --build
```

## 4) Verify services

```bash
docker compose ps
curl -I http://64.188.92.174
curl -I http://64.188.92.174:9000
```

## 5) Nginx Proxy Manager note

If `http://64.188.92.174/` shows the default NPM page, frontend host routing is not configured yet.
Create Proxy Hosts in NPM admin (`:81`) for frontend and API if you want domain-based routing without explicit ports.
