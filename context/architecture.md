# Arsitektur API Detail Produk

**Status:** Draft  
**Runtime:** Node.js LTS  
**HTTP framework:** Express.js  
**Database:** PostgreSQL  
**Dokumentasi API:** OpenAPI 3.1 + Swagger UI  
**Kontrak API:** REST dengan resource dan error JSON:API (`application/vnd.api+json`)

## 1. Keputusan Teknologi

| Area | Keputusan | Alasan |
|---|---|---|
| Runtime | Node.js LTS | Runtime JavaScript untuk aplikasi server; Node.js bukan framework web. |
| HTTP framework | Express.js | Routing dan middleware HTTP sederhana untuk REST API. |
| Database | PostgreSQL | Constraint dan transaksi menjaga integritas data produk-variasi. |
| Driver PostgreSQL | `pg` (`node-postgres`) | Pool koneksi dan query terparameterisasi tanpa mengunci skema pada ORM. |
| Arsitektur aplikasi | Layered Architecture dengan pola MVC pada lapisan HTTP | Memisahkan controller dari aturan bisnis, database, dan serialisasi response. |
| Dokumentasi | OpenAPI 3.1 di `docs/openapi.yaml`, ditampilkan melalui Swagger UI | Kontrak API dapat dibaca manusia dan mesin serta dipakai untuk eksplorasi endpoint. |
| Format resource/error | JSON:API | Sukses dan error memakai `application/vnd.api+json` dengan struktur baku. |
| Database development | Docker Compose dengan image resmi PostgreSQL 18 | Menyamakan versi DB lokal; volume bernama mempertahankan data antar-restart. |

Versi paket dan Node.js ditetapkan melalui `package.json` dan lockfile saat implementasi.

## Daftar isi

1. [Keputusan Teknologi](#1-keputusan-teknologi)
2. [Diagram Arsitektur](#2-diagram-arsitektur)
3. [Struktur direktori](#3-struktur-direktori--layered-architecture-mvc)
4. [Model Data](#4-model-data)
5. [Relasi](#relasi)
6. [Tabel Product](#tabel-product)
7. [Tabel product_variants](#tabel-product_variants)
8. [Schema SQL Awal](#schema-sql-awal)
9. [Pemetaan database response](#9-pemetaan-database-response)
10. [Alur setiap operasi](#10-alur-setiap-operasi)
11. [Aturan validasi dan pertahanan data](#11-aturan-validasi-dan-pertahanan-data)
12. [Swagger / OpenAPI](#12-swagger--openapi)

## Tujuan dan cakupan

Dokumen ini menjelaskan arsitektur backend untuk menyediakan data halaman Detail Produk. API mendukung membaca daftar produk, membaca detail produk, dan menambahkan produk. Skema database mencakup informasi produk, variasi warna/ukuran, serta quantity per variasi.

Checkout, pembayaran, unggah foto, autentikasi admin, dan operasi update/delete belum termasuk. Endpoint `POST` hanya boleh digunakan klien internal tepercaya sampai mekanisme autentikasi ditetapkan.

## 2. Diagram Arsitektur

```mermaid
flowchart LR
    Client[Frontend / API client] -->|HTTP JSON:API| Router[Express routes]
    Router --> Middleware[Validation and error middleware]
    Middleware --> Controller[Controllers]
    Controller --> Service[Services / use cases]
    Service --> Repository[Product repository]
    Repository -->|SQL via parameterized queries| DB[(PostgreSQL)]
    DB --> Repository --> Service --> Serializer[JSON:API serializer]
    Serializer --> Client
```

Aliran request: route memilih handler; middleware memeriksa media type dan validasi input; controller menerjemahkan HTTP ke pemanggilan use case; service menerapkan aturan domain; repository menjalankan query terparameterisasi; serializer membentuk respons JSON:API. Error ditangani satu middleware terpusat agar bentuk respons konsisten.

## 3. Struktur direktori — Layered Architecture MVC

```text
project-root/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   ├── env.js
│   │   ├── database.js
│   │   └── swagger.js
│   ├── routes/
│   │   ├── index.js
│   │   └── product.routes.js
│   ├── controllers/
│   │   └── product.controller.js
│   ├── services/
│   │   └── product.service.js
│   ├── repositories/
│   │   └── product.repository.js
│   ├── models/
│   │   └── product.model.js
│   ├── validators/
│   │   └── product.validator.js
│   ├── middleware/
│   │   ├── validate-request.js
│   │   ├── not-found.js
│   │   └── error-handler.js
│   ├── serializers/
│   │   ├── product.serializer.js
│   │   └── error.serializer.js
│   └── errors/
│       └── api-error.js
├── docs/
│   └── openapi.yaml
├── docker-compose.yml
├── .env.example
├── database/
│   ├── migrations/
│   │   └── 001_create_products.sql
│   └── seeds/
│       └── products.sql
└── tests/
    ├── unit/
    └── integration/
```

| Lapisan | Tanggung jawab |
|---|---|
| `routes/` | Mendaftarkan method/path, middleware, dan controller; tidak berisi query atau aturan bisnis. |
| `controllers/` | Membaca parameter/body, memanggil service, menetapkan status/header, dan mengirim hasil serializer. |
| `services/` | Menjalankan use case serta aturan domain, misalnya validasi konflik dan agregasi data produk. |
| `repositories/` | Menyediakan operasi baca/tulis PostgreSQL dengan query terparameterisasi; tidak membentuk HTTP response. |
| `models/` | Mendefinisikan bentuk entitas produk dan variasi pada domain aplikasi. |
| `validators/` | Memvalidasi struktur JSON:API dan aturan field sebelum service dipanggil. |
| `middleware/` | Menangani parsing, validasi request, 404, dan pemetaan error secara terpusat. |
| `serializers/` | Mengubah entitas domain menjadi resource/error JSON:API tanpa mengekspos baris database mentah. |
| `config/` | Membaca environment dan menginisialisasi pool koneksi PostgreSQL. |
| `database/migrations/` | Menyimpan perubahan skema yang dapat diterapkan berurutan dan dilacak. |

`app.js` menyusun middleware dan routes tanpa membuka port. `server.js` memuat konfigurasi lalu menjalankan listener; pemisahan ini memudahkan aplikasi diuji integrasi.

## 4. Model Data

Relasi memisahkan data katalog produk dari variasi yang dapat dipilih dan jumlah stok tiap variasi. Setiap baris variasi adalah pilihan jual yang memiliki quantity sendiri. `name` dapat berisi warna, ukuran, atau kombinasi seperti `Matte Black / Large`.

### Relasi

```mermaid
erDiagram
    PRODUCTS ||--|{ PRODUCT_VARIANTS : has
    PRODUCTS {
        uuid id PK
        varchar name
        integer price
        text photo_url
        text description
        timestamptz created_at
        timestamptz updated_at
    }
    PRODUCT_VARIANTS {
        uuid id PK
        uuid product_id FK
        varchar name
        text photo_url
        integer quantity
        timestamptz created_at
        timestamptz updated_at
    }
```

Satu `products` memiliki satu atau lebih `product_variants` (1:N). Setiap variasi dimiliki satu produk melalui foreign key. Quantity disimpan per variasi, lalu stok produk dihitung dengan `SUM(quantity)`. Nama variasi dapat berupa warna, ukuran, atau kombinasi keduanya.

### Tabel Product

| Kolom | Tipe PostgreSQL | Aturan | Keterangan |
|---|---|---|---|
| `id` | `UUID` | Primary key | Dibuat aplikasi menggunakan UUID. |
| `name` | `VARCHAR(120)` | NOT NULL, tidak kosong | Nama produk. |
| `price` | `INTEGER` | NOT NULL, `>= 0` | Harga integer dalam Rupiah. |
| `photo_url` | `TEXT` | NOT NULL, tidak kosong | URL/path gambar utama; file tidak disimpan di database. |
| `description` | `TEXT` | NOT NULL, tidak kosong | Deskripsi produk sebagai teks. |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `NOW()` | Waktu pembuatan. |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, default `NOW()` | Waktu perubahan terakhir. |

### Tabel product_variants

| Kolom | Tipe PostgreSQL | Aturan | Keterangan |
|---|---|---|---|
| `id` | `UUID` | Primary key | Dibuat aplikasi menggunakan UUID. |
| `product_id` | `UUID` | NOT NULL, foreign key | Referensi ke `products.id`. |
| `name` | `VARCHAR(60)` | NOT NULL, unik per produk tanpa membedakan kapitalisasi | Nilai seperti `Matte Black`, `Large`, atau `Matte Black / Large`. |
| `photo_url` | `TEXT` | Nullable | Foto variasi; jika kosong gunakan foto produk. |
| `quantity` | `INTEGER` | NOT NULL, default 0, `>= 0` | Jumlah tersedia pada variasi. |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, default `NOW()` | Waktu pembuatan. |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, default `NOW()` | Waktu perubahan terakhir. |

### Schema SQL Awal

```sql
CREATE TABLE products (
    id UUID PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    price INTEGER NOT NULL CHECK (price >= 0),
    photo_url TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT products_name_not_blank CHECK (length(trim(name)) > 0),
    CONSTRAINT products_photo_url_not_blank CHECK (length(trim(photo_url)) > 0),
    CONSTRAINT products_description_not_blank CHECK (length(trim(description)) > 0)
);

CREATE TABLE product_variants (
    id UUID PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(60) NOT NULL,
    photo_url TEXT,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT product_variants_name_not_blank CHECK (length(trim(name)) > 0),
    CONSTRAINT product_variants_product_name_unique UNIQUE (product_id, name)
);

CREATE UNIQUE INDEX product_variants_product_name_ci_unique
    ON product_variants (product_id, lower(name));

```

UUID dibuat aplikasi menggunakan `crypto.randomUUID()` sebelum insert, sehingga tidak perlu extension PostgreSQL tambahan. `ON DELETE CASCADE` hanya mengatur konsistensi relasi bila penghapusan produk ditambahkan pada fase berikutnya; endpoint delete belum termasuk.

### Pemetaan kebutuhan ke kolom

| Kebutuhan | Tabel/kolom | Catatan |
|---|---|---|
| Nama product | `products.name` | 1–120 karakter setelah trim. |
| Harga product | `products.price` | Integer Rupiah, tidak negatif; batas API mengikuti PRD (`2.147.483.647`). |
| Foto product | `products.photo_url` | URL HTTPS atau path relatif; file gambar tidak disimpan di PostgreSQL. |
| Variasi warna/ukuran | `product_variants.name` | Misalnya `Matte Black`, `Large`, atau `Matte Black / Large`. |
| Foto variasi (opsional) | `product_variants.photo_url` | Jika kosong, API menggunakan `products.photo_url`. |
| Jumlah/quantity | `product_variants.quantity` | Stok tersedia untuk variasi tersebut; bilangan bulat tidak negatif. |
| Deskripsi | `products.description` | Teks biasa, bukan HTML yang dirender mentah. |

Jumlah stok produk untuk respons API dihitung dari variasi, bukan disimpan ulang, agar tidak ada dua nilai stok yang dapat berbeda:

```sql
SELECT COALESCE(SUM(quantity), 0)::INTEGER AS stock
FROM product_variants
WHERE product_id = $1;
```

Produk tanpa variasi sebaiknya ditolak oleh service pada saat create; kebutuhan minimal ini memodelkan produk yang memiliki setidaknya satu pilihan warna/ukuran.

## 9. Pemetaan database response

Prefix `/api`; endpoint mengikuti PRD:

| Method | Path | Fungsi | Status sukses |
|---|---|---|---|
| `GET` | `/api/products` | Daftar produk | `200 OK` |
| `GET` | `/api/products/:id` | Detail satu produk | `200 OK` |
| `POST` | `/api/products` | Buat produk dan variasinya | `201 Created` |

Request dan response memakai `application/vnd.api+json`. Resource product memiliki `type: "products"`, `id`, dan `attributes`.

| Database | Response API | Pemetaan |
|---|---|---|
| `products.id` | `data.id` | UUID menjadi string. |
| `products.name` | `data.attributes.name` | Langsung. |
| `products.price` | `data.attributes.price` | Integer Rupiah; jangan format menjadi string `Rp...` pada API. |
| `products.photo_url` | `data.attributes.image` | Nama kolom disesuaikan dengan kontrak frontend. |
| `products.description` | `data.attributes.description` | Teks biasa. |
| `products.created_at` | `data.attributes.createdAt` | ISO 8601 UTC. |
| `product_variants.name` | `data.attributes.variants.colorOrSize[].name` | Nama warna/ukuran. |
| `product_variants.photo_url` | `data.attributes.variants.colorOrSize[].image` | Jika null, serializer memakai foto utama produk. |
| `product_variants.quantity` | `data.attributes.variants.colorOrSize[].stock` | Quantity variasi. |
| `SUM(product_variants.quantity)` | `data.attributes.stock` | Stok agregat produk; tidak disimpan ulang. |

Contoh resource response:

```json
{
  "data": {
    "type": "products",
    "id": "b6ed8dd3-03d6-4b7e-8a92-659f5cbdde78",
    "attributes": {
      "name": "MW75 Custom Wireless ANC Headphones",
      "price": 8999000,
      "image": "/images/headphone-matte-black.jpg.jpeg",
      "description": "Headphone over-ear premium dengan ANC.",
      "stock": 12,
      "variants": {
        "colorOrSize": [
          { "name": "Matte Black", "stock": 4 },
          { "name": "Gunmetal", "stock": 4 },
          { "name": "Silver", "stock": 4 }
        ]
      },
      "createdAt": "2026-10-09T00:00:00.000Z"
    },
    "links": { "self": "/api/products/b6ed8dd3-03d6-4b7e-8a92-659f5cbdde78" }
  }
}
```

Error menggunakan top-level `errors` JSON:API dan status HTTP yang sesuai, seperti didefinisikan pada `context/api-prd.md`.

## 10. Alur setiap operasi

### `GET /api/products`

1. Route mengirim request ke controller daftar produk.
2. Service meminta daftar produk, variasi, dan stok agregat dari repository.
3. Repository menjalankan query PostgreSQL read-only dengan urutan deterministik.
4. Serializer membentuk collection resource JSON:API. Daftar kosong menghasilkan `data: []`.
5. Controller mengirim `200 OK` dengan `Content-Type: application/vnd.api+json`.

### `GET /api/products/:id`

1. Middleware memvalidasi format ID UUID; format salah menghasilkan `400` JSON:API error.
2. Controller meminta service mengambil produk, variasi, dan stok agregat.
3. Jika tidak ditemukan, error `PRODUCT_NOT_FOUND` dipetakan menjadi `404` JSON:API error.
4. Jika ditemukan, serializer membentuk resource dan controller mengirim `200 OK`.

### `POST /api/products`

1. Parser membatasi ukuran body dan memeriksa media type `application/vnd.api+json`.
2. Middleware memvalidasi struktur JSON:API, field produk, dan seluruh variasi.
3. Controller mengirim data tervalidasi ke service.
4. Service memulai transaksi; repository memasukkan produk dan seluruh variasinya menggunakan query terparameterisasi.
5. Jika semua insert berhasil, transaksi commit; jika satu gagal, semua insert rollback.
6. Serializer membentuk resource; controller mengirim `201 Created`, header `Location`, dan JSON:API content type.

Kesalahan pada tahap mana pun dipetakan error middleware ke status HTTP dan anggota `errors` JSON:API.

## Prinsip konsistensi dan transaksi

- Create product beserta semua variasi dijalankan dalam satu transaksi PostgreSQL (`BEGIN`/`COMMIT`); kegagalan insert satu variasi menyebabkan seluruh transaksi `ROLLBACK`.
- Query menggunakan parameter binding (`$1`, `$2`, dan seterusnya). Jangan menggabungkan input pengguna langsung ke SQL.
- `UNIQUE (product_id, name)` mencegah nama variasi duplikat untuk produk yang sama; pelanggaran dipetakan ke error konflik JSON:API.
- Stok tidak boleh negatif dan harga tidak boleh negatif pada tingkat database, selain validasi middleware.
- Pembacaan daftar/detail mengambil produk dan variasi dengan query terkontrol; agregasi stok dihitung dari data variasi.
- Pool koneksi PostgreSQL dikonfigurasi dari environment dan ditutup saat proses menerima sinyal shutdown.

## 11. Aturan validasi dan pertahanan data

### Validasi request

- Body create harus berupa JSON:API dengan `data.type` bernilai `products` dan `data.attributes` berupa object.
- Terima hanya field yang didokumentasikan; tolak field tak dikenal serta `id`/timestamp yang ditetapkan server.
- `name`: string setelah trim, 1–120 karakter. `description`: string setelah trim, 1–2.000 karakter.
- `price`: integer Rupiah 0–2.147.483.647; tolak pecahan, string angka, `NaN`, dan nilai negatif.
- Foto: path lokal yang diizinkan atau URL HTTPS. Tolak `javascript:`, `data:`, protokol lain, URL berkredensial, dan path traversal.
- Minimal satu variasi dan maksimum 50 variasi. Nama variasi wajib, 1–60 karakter setelah trim, unik tanpa membedakan kapitalisasi.
- Quantity variasi integer 0–1.000.000; tolak pecahan, string, dan nilai negatif.
- `Content-Type` selain `application/vnd.api+json` menghasilkan `415`; `Accept` yang tidak menerima format ini `406`; JSON rusak `400`; payload di atas 32 KB `413`.
- Validasi server wajib meskipun frontend juga memvalidasi. Sertakan `source.pointer` dalam JSON:API error untuk field bermasalah.

### Pertahanan aplikasi dan database

- Jalankan SQL dengan parameter binding `pg`; jangan gabungkan input pengguna ke query.
- Cegah mass assignment dengan membentuk objek domain hanya dari field allowlist.
- Batasi ukuran body dan jumlah variasi untuk mengendalikan payload.
- Gunakan `NOT NULL`, `CHECK`, foreign key, dan unique constraint sebagai lapisan integritas kedua.
- Simpan produk dan semua variasinya dalam satu transaksi.
- Simpan deskripsi sebagai teks dan render pada frontend sebagai teks, bukan HTML mentah.
- Jangan kirim SQL, kredensial, stack trace, atau detail internal ke response. Log request ID tanpa mencatat body sensitif secara penuh.
- Simpan kredensial PostgreSQL di environment/secret manager, gunakan TLS saat deployment, dan berikan role database hak minimum.
- Batasi akses endpoint `POST` ke klien internal tepercaya; tambahkan autentikasi dan otorisasi sebelum API dipublikasikan.

Semua error memakai top-level `errors` JSON:API, `status` string, `code` stabil, `title`/`detail`, dan `source.pointer` untuk lokasi field. Status HTTP response menjadi sumber status utama.

## 12. Swagger / OpenAPI

OpenAPI adalah kontrak mesin untuk API; Swagger UI menampilkan dokumentasi interaktif. `docs/openapi.yaml` menjadi source of truth untuk endpoint, parameter, media type, schema JSON:API, contoh, serta status sukses dan error. Swagger UI tersedia di `/api-docs`; file spesifikasi tersedia di `/api-docs/openapi.yaml`. Perubahan endpoint atau schema harus memperbarui OpenAPI bersamaan dengan implementasi.

Gunakan paket `swagger-ui-express` dan `yaml`, dengan versi dikunci di `package.json` serta lockfile. `src/config/swagger.js` memuat YAML dan mendaftarkan UI. Route dokumentasi didaftarkan di `app.js` sebelum fallback 404.

Contoh integrasi Express:

```js
// src/config/swagger.js
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import { readFile } from "node:fs/promises";

export async function mountSwagger(app) {
  const openapiText = await readFile(
    new URL("../../docs/openapi.yaml", import.meta.url),
    "utf8"
  );
  const openapiDocument = YAML.parse(openapiText);

  app.get("/api-docs/openapi.yaml", (_req, res) => {
    res.type("application/yaml").send(openapiText);
  });
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));
}
```

`src/app.js` membuat instance Express dan memanggil `await mountSwagger(app)` sebelum middleware 404.

Cuplikan ilustratif struktur OpenAPI 3.1 (spesifikasi lengkap dan authoritative berada di `docs/openapi.yaml`):

```yaml
openapi: 3.1.0
info:
  title: Product Detail API
  version: 1.0.0
  description: API katalog produk dan variasinya.
servers:
  - url: http://localhost:3000
paths:
  /api/products:
    get:
      summary: Daftar produk
      responses:
        '200':
          description: Collection JSON:API; data dapat berupa array kosong
          content:
            application/vnd.api+json:
              schema:
                type: object
                required: [data]
                properties:
                  data:
                    type: array
                    items: { $ref: '#/components/schemas/ProductResource' }
    post:
      summary: Buat produk beserta variasi
      requestBody:
        required: true
        content:
          application/vnd.api+json:
            schema: { $ref: '#/components/schemas/CreateProductDocument' }
      responses:
        '201':
          description: Produk berhasil dibuat
          headers:
            Location:
              schema: { type: string, format: uri-reference }
          content:
            application/vnd.api+json:
              schema:
                type: object
                required: [data]
                properties:
                  data: { $ref: '#/components/schemas/ProductResource' }
        '400': { $ref: '#/components/responses/JsonApiError' }
        '406': { $ref: '#/components/responses/JsonApiError' }
        '409': { $ref: '#/components/responses/JsonApiError' }
        '413': { $ref: '#/components/responses/JsonApiError' }
        '415': { $ref: '#/components/responses/JsonApiError' }
        '500': { $ref: '#/components/responses/JsonApiError' }
  /api/products/{id}:
    get:
      summary: Detail produk
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        '200':
          description: Resource JSON:API
          content:
            application/vnd.api+json:
              schema:
                type: object
                required: [data]
                properties:
                  data: { $ref: '#/components/schemas/ProductResource' }
        '400': { $ref: '#/components/responses/JsonApiError' }
        '404': { $ref: '#/components/responses/JsonApiError' }
        '406': { $ref: '#/components/responses/JsonApiError' }
        '500': { $ref: '#/components/responses/JsonApiError' }
components:
  schemas:
    ProductResource:
      type: object
      required: [type, id, attributes]
      properties:
        type: { const: products }
        id: { type: string, format: uuid }
        attributes: { $ref: '#/components/schemas/ProductAttributes' }
    ProductAttributes:
      type: object
      required: [name, price, image, description, stock, variants, createdAt]
      properties:
        name: { type: string, maxLength: 120 }
        price: { type: integer, minimum: 0, maximum: 2147483647 }
        image: { type: string }
        description: { type: string, maxLength: 2000 }
        stock: { type: integer, minimum: 0 }
        variants:
          type: object
          required: [colorOrSize]
          properties:
            colorOrSize:
              type: array
              items: { $ref: '#/components/schemas/ProductVariant' }
        createdAt: { type: string, format: date-time }
    ProductVariant:
      type: object
      required: [name, stock]
      properties:
        name: { type: string, maxLength: 60 }
        image: { type: string }
        stock: { type: integer, minimum: 0, maximum: 1000000 }
    CreateProductDocument:
      type: object
      required: [data]
      properties:
        data:
          type: object
          required: [type, attributes]
          properties:
            type: { const: products }
            attributes:
              type: object
              required: [name, price, image, description, variants]
              properties:
                name: { type: string, maxLength: 120 }
                price: { type: integer, minimum: 0, maximum: 2147483647 }
                image: { type: string }
                description: { type: string, maxLength: 2000 }
                variants:
                  type: object
                  required: [colorOrSize]
                  properties:
                    colorOrSize:
                      type: array
                      minItems: 1
                      maxItems: 50
                      items:
                        type: object
                        required: [name, stock]
                        properties:
                          name: { type: string, maxLength: 60 }
                          image: { type: string }
                          stock: { type: integer, minimum: 0, maximum: 1000000 }
    JsonApiError:
      type: object
      required: [errors]
      properties:
        errors:
          type: array
          items:
            type: object
            required: [status, code, title, detail]
            properties:
              status: { type: string }
              code: { type: string }
              title: { type: string }
              detail: { type: string }
              source:
                type: object
                properties:
                  pointer: { type: string }
  responses:
    JsonApiError:
      description: Error JSON:API
      content:
        application/vnd.api+json:
          schema: { $ref: '#/components/schemas/JsonApiError' }
```

`docs/openapi.yaml` adalah file spesifikasi yang dimuat Swagger UI dan harus ditinjau setiap kali kontrak berubah. Swagger UI tidak menggantikan validasi runtime. Batasi akses dokumentasi pada deployment internal bila endpoint bersifat privat; jangan masukkan credential atau data rahasia ke contoh.

## 13. Konfigurasi dan operasi

### PostgreSQL lokal dengan Docker Compose

`docker-compose.yml` hanya menjalankan PostgreSQL untuk development lokal. Backend dan frontend tidak menjadi service Compose pada tahap ini. File ini memakai PostgreSQL 18, volume bernama `product_postgres_data`, port yang hanya di-bind ke localhost, serta healthcheck `pg_isready`. Pada image PostgreSQL 18, mount data diarahkan ke `/var/lib/postgresql`.

Langkah developer:

```powershell
Copy-Item .env.example .env
# Ganti POSTGRES_PASSWORD di .env dan samakan kredensial DATABASE_URL.
docker compose up -d db
docker compose ps
```

Tunggu service berstatus `healthy`, lalu backend lokal menjalankan migration dan seed sesuai tasklist backend. Backend yang berjalan langsung pada host memakai `localhost:5432`; bila backend kelak dijalankan di Compose, gunakan hostname service `db` dan port `5432`. Frontend hanya berkomunikasi dengan HTTP API backend dan tidak menggunakan koneksi database.

`POSTGRES_*` dipakai image untuk inisialisasi pertama pada volume kosong. Mengubah variabel tersebut setelah volume terisi tidak mengubah user/password/database yang sudah dibuat. `docker compose down` mempertahankan volume; penghapusan volume akan menghapus data database lokal.

PostgreSQL 18 dipilih sebagai major version yang masih didukung; perbarui patch image secara berkala dan rencanakan upgrade major terpisah.

Referensi: [kebijakan dukungan versi PostgreSQL](https://www.postgresql.org/support/versioning/), [dokumentasi image resmi PostgreSQL tentang lokasi volume PG 18+](https://github.com/docker-library/docs/blob/master/postgres/content.md#pgdata), dan [startup order serta healthcheck Docker Compose](https://docs.docker.com/compose/how-tos/startup-order/).

Environment minimum:

```text
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/product_db
```

Jangan commit nilai kredensial nyata. Gunakan file environment lokal yang masuk `.gitignore` atau secret manager deployment. Jalankan migrasi sebagai langkah deployment yang eksplisit; aplikasi tidak membuat atau mengubah tabel secara otomatis ketika startup.

## 14. Keputusan dan batasan

- Node.js adalah runtime, sedangkan Express.js adalah framework HTTP.
- Skema memisahkan produk dan variasi; quantity selalu berada pada variasi.
- Satu variasi mewakili satu pilihan yang dapat dijual. Untuk kombinasi warna dan ukuran, nama variasi memuat keduanya. Jika inventori kombinatorial dibutuhkan, pecah atribut menjadi tabel option/option value pada iterasi berikutnya.
- `photo_url` menyimpan referensi ke aset; simpan file pada storage media terpisah bila fitur upload ditambahkan.
- `price` memakai PostgreSQL `INTEGER`, sejalan dengan batas harga pada PRD API.
- Autentikasi endpoint `POST`, format gambar final, strategi seed, serta backup/retensi database masih perlu ditetapkan sebelum deployment.

## 15. Kriteria penerimaan arsitektur

- Tabel `products` dan `product_variants` dapat dibuat melalui migration PostgreSQL.
- Produk dapat memiliki beberapa variasi dengan quantity independen.
- Total stok API konsisten dengan penjumlahan quantity variasi.
- Create produk dan variasi bersifat atomik dalam satu transaksi.
- Route, controller, service, repository, validator, dan serializer berada pada lapisan terpisah sesuai struktur direktori.
- Respons endpoint tetap menggunakan JSON:API sesuai `context/api-prd.md`.
