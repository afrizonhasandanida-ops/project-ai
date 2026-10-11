# Product Detail — Atelier Audio

Proyek full-stack halaman detail produk MW75 Custom Wireless ANC Headphones. Proyek ini terdiri dari dua versi frontend, backend Node.js vanilla JavaScript, PostgreSQL, REST API JSON:API, dan dokumentasi OpenAPI/Swagger.

## Fitur Utama

- Halaman 1 dengan data produk hardcode.
- Halaman 2 dengan data produk dari backend API.
- Pemilihan varian warna dan pengaturan jumlah produk.
- Perhitungan total harga dan personal engraving.
- REST API produk dengan format JSON:API.
- PostgreSQL dengan migration dan seed SQL.
- Swagger UI untuk mencoba endpoint API.
- Validasi request, error response, CORS, dan API key untuk operasi `POST`.

## Struktur Direktori

```text
.
├── Page1/project-AI/             # Halaman 1: data hardcode
├── Page2/project-AI/             # Halaman 2: fetch data dari API
├── frontend/                     # Frontend API-driven dengan server lokal
├── api-project/                  # Backend Node.js dan database
│   ├── src/
│   ├── database/migrations/
│   ├── database/seeds/
│   ├── docs/openapi.yaml
│   ├── tests/
│   └── .env.example
├── docs/openapi.yaml
└── README.md
```

## Prasyarat

- Node.js versi 22 atau lebih baru dan di bawah versi 25.
- npm.
- Docker Desktop dengan Docker Compose.

## Konfigurasi Backend

Buat file `.env` dari template:

```powershell
Copy-Item api-project/.env.example api-project/.env
```

Konfigurasi utama:

```env
NODE_ENV=development
HOST=127.0.0.1
PORT=3000
DATABASE_URL=postgresql://product_app:change_this_local_password@localhost:5432/product_db
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
PRODUCT_WRITE_API_KEY=replace_with_at_least_32_random_characters
```

Ganti `PRODUCT_WRITE_API_KEY` dengan string acak minimal 32 karakter.

## Menjalankan Database

Dari root proyek:

```powershell
docker compose -f api-project/docker-compose.yml up -d
```

PostgreSQL berjalan pada `127.0.0.1:5432`.

## Menjalankan Backend

```powershell
npm --prefix api-project install
npm --prefix api-project run migrate
npm --prefix api-project run seed
npm --prefix api-project start
```

Backend berjalan pada `http://127.0.0.1:3000`.

## Menjalankan Frontend

```powershell
npm --prefix frontend start
```

Buka `http://127.0.0.1:5500/frontend/`.

Halaman individual:

- `Page1/project-AI/index.html` — data hardcode.
- `Page2/project-AI/index.html` — mengambil data dari API.

Untuk Halaman 2, backend harus aktif pada `http://127.0.0.1:3000`.

## Swagger dan API

Swagger UI tersedia di:

```text
http://127.0.0.1:3000/api-docs/
```

Spesifikasi OpenAPI tersedia di `api-project/docs/openapi.yaml` dan `docs/openapi.yaml`.

### Daftar produk

```http
GET /api/products
Accept: application/vnd.api+json
```

### Detail produk

```http
GET /api/products/{id}
Accept: application/vnd.api+json
```

ID produk seed:

```text
b6ed8dd3-03d6-4b7e-8a92-659f5cbdde78
```

### Membuat produk

```http
POST /api/products
Accept: application/vnd.api+json
Content-Type: application/vnd.api+json
X-API-Key: <PRODUCT_WRITE_API_KEY>
```

Request create harus berisi atribut `name`, `price`, `image`, `description`, dan `variants.colorOrSize` sesuai skema OpenAPI.

## Database dan SQL

Skema tabel tersedia pada:

```text
api-project/database/migrations/001_create_products.sql
```

File tersebut membuat tabel `products` dan `product_variants`, relasi foreign key, validasi harga/stok, serta unique index nama variasi.

Data awal tersedia pada:

```text
api-project/database/seeds/001_mw75.sql
```

Seed memasukkan satu produk MW75 dan tiga variasi warna dengan stok awal.

## Pengujian dan Validasi

Validasi backend:

```powershell
npm --prefix api-project run check
```

Perintah tersebut menjalankan syntax check, validasi OpenAPI, dan unit test.

Integration test:

```powershell
npm --prefix api-project run test:integration
```

Validasi syntax frontend:

```powershell
node --check frontend/app.js
node --check frontend/server.js
```

## CORS Lokal

Backend mengizinkan origin yang tercantum pada `CORS_ORIGINS`. Pada mode development, halaman yang dibuka langsung dari `file://` dengan origin `null` juga diizinkan agar Halaman 2 dapat mengambil data API.

Untuk production, gunakan allowlist origin yang spesifik dan jangan mengandalkan origin `null`.

## Troubleshooting

Jika PostgreSQL belum aktif:

```powershell
docker compose -f api-project/docker-compose.yml ps
docker compose -f api-project/docker-compose.yml up -d
```

Jika produk tidak muncul, pastikan database sudah di-migrate dan di-seed, backend aktif pada port `3000`, lalu buka ulang frontend.

Jika Swagger tidak terbuka, gunakan URL dengan trailing slash: `http://127.0.0.1:3000/api-docs/`.

## Status Proyek

Frontend hardcode dan API-driven, backend Node.js, PostgreSQL, migration, seed SQL, endpoint produk, Swagger UI, CORS lokal, unit test, dan validasi OpenAPI sudah tersedia.
