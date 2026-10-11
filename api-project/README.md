# Product Detail API

Express REST API dengan PostgreSQL. Kontrak JSON:API/OpenAPI ada di `docs/openapi.yaml`; Swagger UI tersedia di `/api-docs`.

## Persiapan lokal

1. Pasang Node.js versi LTS 22 atau 24 dan Docker Compose.
2. Salin `.env.example` ke `.env`. Ganti `POSTGRES_PASSWORD` dan `PRODUCT_WRITE_API_KEY` dengan nilai acak lokal minimal 32 karakter. Samakan password pada `DATABASE_URL`.
3. Jalankan `docker compose up -d db` dan tunggu status container menjadi `healthy` (`docker compose ps`).
4. Jalankan `npm ci`, lalu `npm run migrate` dan `npm run seed`.
5. Jalankan `npm run dev`. API lokal mendengarkan `127.0.0.1:3000`; Swagger UI: `http://127.0.0.1:3000/api-docs`.

`POST /api/products` memerlukan header `X-API-Key` dengan nilai `PRODUCT_WRITE_API_KEY` dari `.env`. Jangan menaruh key ini di bundle frontend. Endpoint tulis digunakan oleh klien internal tepercaya.

Contoh akses:

```powershell
curl.exe -H "Accept: application/vnd.api+json" http://127.0.0.1:3000/api/products
curl.exe -H "Accept: application/vnd.api+json" http://127.0.0.1:3000/api/products/b6ed8dd3-03d6-4b7e-8a92-659f5cbdde78
```

## Development commands

```powershell
npm run dev
npm run migrate
npm run seed
npm run check
npm run test:integration
```

`npm run test:integration` memerlukan PostgreSQL Compose berstatus healthy dan memuat data seed.

Migration bersifat berurutan dan dicatat pada `schema_migrations`. Seed hanya dapat dijalankan saat `NODE_ENV` bukan `production`.

## Backup dan restore lokal

Dengan service `db` berjalan, backup database:

```powershell
New-Item -ItemType Directory -Force backups
docker compose exec db pg_dump -U product_app -d product_db -Fp -f /tmp/product_db.sql
docker compose cp db:/tmp/product_db.sql ./backups/product_db.sql
docker compose exec -T db rm /tmp/product_db.sql
```

Restore ke database yang sudah dibuat (akan mengganti objek dengan nama yang sama):

```powershell
docker compose cp ./backups/product_db.sql db:/tmp/product_db.sql
docker compose exec -T db psql -U product_app -d product_db -v ON_ERROR_STOP=1 -f /tmp/product_db.sql
docker compose exec -T db rm /tmp/product_db.sql
```

Jangan menyimpan backup berisi data produksi ke repository. Untuk deployment, gunakan backup terenkripsi dan secret manager yang dikelola platform.

## Deployment notes

- Atur TLS pada reverse proxy/platform deployment dan simpan secret di secret manager.
- Batasi `CORS_ORIGINS` ke origin frontend yang sah.
- `HOST=127.0.0.1` adalah default development; atur binding jaringan melalui deployment environment saat berjalan di container/server.
- Endpoint POST harus tetap di belakang kontrol akses internal; lakukan review autentikasi/otorisasi sebelum membuatnya publik.
