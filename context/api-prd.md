# PRD API — Detail Produk

**Status:** Draft untuk implementasi  
**Produk:** Atelier Audio — MW75 Custom Wireless ANC Headphones  
**Versi:** 1.0

## 1. Ringkasan

REST API Express.js untuk mengambil daftar produk, detail satu produk, dan membuat produk baru. API memasok informasi yang ditampilkan halaman detail: nama, harga Rupiah, deskripsi, gambar, varian warna, serta stok. Request pembuatan produk divalidasi sebelum diproses agar data konsisten dan aman.

Mini-PRD halaman menyebut backend/API sebagai non-goal untuk prototipe HTML lokal. PRD ini memperluas cakupan menjadi layanan backend yang memasok halaman tersebut; checkout dan pembayaran tetap tidak termasuk.

## 2. Konteks, masalah, dan tujuan

Halaman menampilkan headphone MW75, harga Rp8.999.000, pilihan Matte Black, Gunmetal, dan Silver, kontrol jumlah, opsi engraving, serta ringkasan pesanan. Pengguna API utama adalah frontend halaman detail dan klien internal tepercaya yang membuat data produk.

**Masalah:** frontend membutuhkan sumber data produk konsisten, sementara data produk baru perlu diperiksa sebelum disimpan agar halaman tidak menerima data rusak atau berbahaya.

**Tujuan:**

- Mengembalikan daftar dan detail produk dalam JSON yang stabil.
- Membuat produk melalui `POST` dengan validasi semua field body.
- Mengembalikan status HTTP dan error terstruktur yang dapat ditangani frontend.
- Menyediakan data stok dan varian untuk pemilihan warna serta batas jumlah.

**Bukan tujuan:** autentikasi/otorisasi admin, pembayaran, keranjang persisten, pemesanan, unggah berkas, pengelolaan stok transaksi, pembaruan/penghapusan produk, pencarian/filter, atau pilihan vendor database.

## 3. Asumsi dan keputusan

- Prefix endpoint: `/api`.
- ID produk adalah string unik yang dibuat server; klien tidak mengirim ID saat membuat produk.
- `price` adalah bilangan bulat Rupiah, tanpa pecahan.
- `stock` adalah kuantitas total yang tersedia. Stok nol tetap dapat dibaca.
- Varian MW75 dikirim sebagai daftar objek dengan nama, gambar, dan stok opsional. Bila stok semua varian tersedia, jumlahnya harus sama dengan stok total.
- Gambar hanya menerima path relatif lokal atau URL HTTPS. API tidak menerima data URL, markup, atau unggahan biner.
- Engraving merupakan opsi personalisasi frontend (tambahan Rp350.000 dan maksimum 12 karakter sesuai mini-PRD), bukan field katalog pada endpoint ini.
- Sampel MW75 adalah ilustrasi produk awal, bukan jaminan bahwa seed data atau stok per warna sudah dikonfigurasi.

## 4. Kebutuhan fungsional

| ID | Kebutuhan |
|---|---|
| FR-01 | `GET /api/products` mengembalikan daftar produk JSON. |
| FR-02 | `GET /api/products/:id` mengembalikan satu produk berdasarkan ID. |
| FR-03 | `POST /api/products` memvalidasi dan membuat produk baru. |
| FR-04 | Seluruh respons sukses dan error mengikuti JSON:API (`application/vnd.api+json`). |
| FR-05 | Request body diperiksa tipe, field wajib, batas nilai, format URL, dan field tak dikenal sebelum diproses. |
| FR-06 | Error validasi mengidentifikasi field bermasalah tanpa membocorkan stack trace atau detail internal. |
| FR-07 | Input string ditrim; teks disimpan dan dirender sebagai teks, bukan markup yang dieksekusi. |
| FR-08 | Rute yang tidak ditemukan dan method yang tidak didukung menghasilkan error JSON terstruktur. |

## 5. User stories

- **US-01:** Sebagai pengunjung halaman produk, saya ingin daftar produk agar dapat menelusuri produk yang tersedia.
- **US-02:** Sebagai calon pembeli, saya ingin detail produk berdasarkan ID agar dapat melihat nama, harga, gambar, varian, dan stok produk terpilih.
- **US-03:** Sebagai pengelola katalog melalui klien tepercaya, saya ingin menambahkan produk dengan data valid agar katalog dapat diperbarui.
- **US-04:** Sebagai pemanggil API, saya ingin error validasi menunjuk field bermasalah agar request dapat diperbaiki.
- **US-05:** Sebagai frontend, saya ingin bentuk respons konsisten agar status loading, stok habis, dan data produk dapat ditangani.

## 6. Skema data

### Product

| Field | Tipe | Wajib | Aturan |
|---|---|---:|---|
| `id` | string | respons saja | Unik, dibuat server, tidak dapat ditentukan klien. |
| `name` | string | ya | Setelah trim 1–120 karakter; bukan whitespace saja. |
| `price` | integer | ya | Rupiah; 0–2.147.483.647. |
| `description` | string | ya | Setelah trim 1–2.000 karakter; teks biasa. |
| `image` | string | ya | Maksimum 2.048 karakter; path relatif lokal atau URL HTTPS yang valid. |
| `stock` | integer | ya | 0–1.000.000. |
| `variants` | object | ya | Berisi `colorOrSize`, array minimal satu varian. |
| `variants.colorOrSize` | array | ya | 1–50 objek varian. |
| `variants.colorOrSize[].name` | string | ya | 1–60 karakter setelah trim; unik tanpa membedakan kapitalisasi. |
| `variants.colorOrSize[].image` | string | tidak | Path lokal atau HTTPS; jika tidak ada gunakan gambar produk. |
| `variants.colorOrSize[].stock` | integer | tidak | 0–1.000.000. Jika diberikan, harus ada pada semua varian dan jumlahnya sama dengan `stock`. |
| `createdAt` | string | respons saja | Waktu ISO 8601 UTC yang dibuat server. |

Nama `colorOrSize` dipertahankan agar dapat dipetakan oleh frontend yang ada; isinya berupa objek agar gambar dan stok per varian dapat dideskripsikan.

## 7. Kontrak endpoint

### 7.1 Daftar produk

`GET /api/products`  
`Accept: application/vnd.api+json`

**Sukses — `200 OK`**

```json
{
  "data": [
    {
      "type": "products",
      "id": "mw75-custom",
      "attributes": {
        "name": "MW75 Custom Wireless ANC Headphones",
        "price": 8999000,
        "description": "Headphone over-ear premium dengan ANC dan opsi engraving.",
        "image": "/images/headphone-matte-black.jpg.jpeg",
        "stock": 12,
        "variants": {
          "colorOrSize": [
            { "name": "Matte Black", "image": "/images/headphone-matte-black.jpg.jpeg", "stock": 4 },
            { "name": "Gunmetal", "image": "/images/headphone-gunmetal.jpg.jpeg", "stock": 4 },
            { "name": "Silver", "image": "/images/headphone-silver.jpg.jpeg", "stock": 4 }
          ]
        },
        "createdAt": "2026-01-15T00:00:00.000Z"
      },
      "links": { "self": "/api/products/mw75-custom" }
    }
  ]
}
```

Respons sukses memakai `Content-Type: application/vnd.api+json`. Daftar kosong menghasilkan `200` dan `{ "data": [] }`. Urutan konsisten, produk terbaru terlebih dahulu. Pagination belum disediakan; perlu ditambahkan sebelum katalog membesar.

### 7.2 Detail produk

`GET /api/products/:id`

**Sukses — `200 OK`** mengembalikan satu resource JSON:API: `{ "data": { "type": "products", "id": "...", "attributes": { ... } } }`, dengan `Content-Type: application/vnd.api+json`.

**ID tidak ditemukan — `404 Not Found`**

```json
{
  "errors": [
    {
      "status": "404",
      "code": "PRODUCT_NOT_FOUND",
      "title": "Product not found",
      "detail": "Produk dengan ID 'unknown' tidak ditemukan."
    }
  ]
}
```

Error juga mengikuti JSON:API dan memakai `Content-Type: application/vnd.api+json`. Body error memiliki anggota top-level `errors` berisi satu atau lebih error object. Setiap `status` memakai string kode HTTP; `code` stabil untuk pemetaan aplikasi, sedangkan `source.pointer` menunjuk field bermasalah.

### 7.3 Buat produk

`POST /api/products`  
Request header: `Content-Type: application/vnd.api+json` dan `Accept: application/vnd.api+json`.

**Request** (klien tidak mengirim `id` atau `createdAt`):

```json
{
  "data": {
    "type": "products",
    "attributes": {
      "name": "MW75 Custom Wireless ANC Headphones",
      "price": 8999000,
      "description": "Headphone over-ear premium dengan ANC dan opsi engraving.",
      "image": "/images/headphone-matte-black.jpg.jpeg",
      "stock": 12,
      "variants": {
        "colorOrSize": [
          { "name": "Matte Black", "image": "/images/headphone-matte-black.jpg.jpeg", "stock": 4 },
          { "name": "Gunmetal", "image": "/images/headphone-gunmetal.jpg.jpeg", "stock": 4 },
          { "name": "Silver", "image": "/images/headphone-silver.jpg.jpeg", "stock": 4 }
        ]
      }
    }
  }
}
```

**Sukses — `201 Created`:** resource JSON:API `{ "data": { "type": "products", "id": "...", "attributes": { ... }, "links": { "self": "/api/products/{id}" } } }`, dengan header `Location: /api/products/{id}` dan `Content-Type: application/vnd.api+json`.

**Validasi gagal — `400 Bad Request`:**

```json
{
  "errors": [
    {
      "status": "400",
      "code": "INVALID_TYPE",
      "title": "Invalid attribute type",
      "detail": "price harus berupa bilangan bulat.",
      "source": { "pointer": "/data/attributes/price" }
    },
    {
      "status": "400",
      "code": "REQUIRED",
      "title": "Required attribute missing",
      "detail": "Minimal satu varian harus disediakan.",
      "source": { "pointer": "/data/attributes/variants/colorOrSize" }
    }
  ]
}
```

Error object mengikuti anggota JSON:API (`status`, `code`, `title`, `detail`, dan `source.pointer`). Field `code` stabil untuk pemetaan UI; klien memakai HTTP status respons sebagai status utama. Jika satu request memiliki beberapa kesalahan, API boleh mengembalikan semuanya dalam array `errors`.

### 7.4 Schema konseptual JSON

```json 

{
  "succes": true,
  "data": {},
  "message": "message success",
  "responseCode": 200
}

```
## 8. Validasi dan keamanan

Middleware validasi dipasang sebelum handler `POST` menyentuh penyimpanan. Urutan: parsing JSON dengan batas 32 KB, pemeriksaan media type JSON:API, validasi bentuk dan tipe, normalisasi trim, pemeriksaan konflik, lalu penyimpanan.

- Body wajib object JSON, bukan array atau `null`.
- Field wajib yang hilang menghasilkan `REQUIRED`; tipe salah `INVALID_TYPE`; nilai di luar batas `OUT_OF_RANGE` atau `INVALID_FORMAT`.
- Tolak properti yang tidak dikenal (`UNKNOWN_FIELD`), termasuk `id` dan `createdAt`; jangan menyimpan field tambahan diam-diam.
- Tolak nama varian duplikat tanpa peka kapitalisasi.
- Stok semua varian harus diberikan bersama-sama; jumlahnya harus sama dengan `stock`.
- Tolak URL `javascript:`, `data:`, protokol selain HTTPS, URL dengan kredensial, dan nilai selain path lokal yang diizinkan atau URL HTTPS. Path tidak boleh berisi traversal `..`.
- `Content-Type` selain `application/vnd.api+json` menghasilkan `415` dengan JSON:API error; JSON rusak `400`; body di atas batas `413`. `Accept` yang tidak menerima media type JSON:API menghasilkan `406`.
- ID dibuat server dan harus unik. Konflik menghasilkan `409 PRODUCT_CONFLICT`.
- Error tak terduga menghasilkan `500 INTERNAL_ERROR` dengan pesan generik. Log server tidak menyimpan body sensitif penuh.
- CORS dibatasi ke origin frontend saat deployment. Terapkan rate limit pada endpoint tulis. Jangan membuka origin wildcard dengan credentials.

| Status | Penggunaan |
|---|---|
| `400` | JSON atau input tidak valid (`INVALID_JSON`, `VALIDATION_ERROR`). |
| `404` | Produk/rute tidak ditemukan (`PRODUCT_NOT_FOUND`, `ROUTE_NOT_FOUND`). |
| `406` | `Accept` tidak mendukung JSON:API (`NOT_ACCEPTABLE`). |
| `409` | Konflik produk (`PRODUCT_CONFLICT`). |
| `413` | Payload terlalu besar (`PAYLOAD_TOO_LARGE`). |
| `415` | Media type request tidak didukung (`UNSUPPORTED_MEDIA_TYPE`). |
| `500` | Kegagalan internal (`INTERNAL_ERROR`). |

Semua error memakai top-level `errors` JSON:API dengan `Content-Type: application/vnd.api+json`. Gunakan `source.pointer` untuk kesalahan terkait atribut/body, `source.parameter` untuk query parameter, dan `source.header` untuk header. Error umum boleh tidak memiliki `source`. Pertahankan `code` stabil untuk makna error yang sama; jangan mengirim stack trace atau detail internal.

## 9. Acceptance criteria

- **AC-01:** `GET /api/products` mengembalikan `200`, `Content-Type: application/vnd.api+json`, top-level `data` berupa resource `products`, dan setiap resource memenuhi skema Product pada `attributes`.
- **AC-02:** Daftar kosong mengembalikan `200` dan `{ "data": [] }`.
- **AC-03:** `GET /api/products/:id` untuk produk yang ada mengembalikan `200` dan produk yang diminta.
- **AC-04:** ID tak dikenal mengembalikan `404`, `Content-Type: application/vnd.api+json`, serta `errors` JSON:API dengan `code: PRODUCT_NOT_FOUND`.
- **AC-05:** `POST` dengan request JSON:API valid membuat satu produk, mengembalikan resource JSON:API dengan `201`, ID dan waktu server, serta header `Location`.
- **AC-06:** Field wajib hilang, tipe salah, string kosong, angka pecahan/negatif, panjang berlebih, URL terlarang, varian duplikat, atau stok varian tidak konsisten ditolak `400 VALIDATION_ERROR` dengan pointer JSON Pointer ke field terkait.
- **AC-07:** Field tak dikenal, `id`, atau `createdAt` pada body create ditolak dan tidak tersimpan.
- **AC-08:** Media type body bukan `application/vnd.api+json` ditolak `415`; JSON malformed `400`; payload di atas 32 KB `413`.
- **AC-09:** Markup dalam teks tidak dieksekusi; frontend merender deskripsi/nama sebagai teks.
- **AC-10:** Produk stok nol dapat dibaca dengan `stock: 0`.
- **AC-11:** Respons sukses dan error memakai `application/vnd.api+json`; error internal tidak membocorkan stack trace.
- **AC-12:** Harga memakai integer Rupiah dan data varian MW75 sesuai halaman produk.

## 10. Kebutuhan nonfungsional

- Express.js dan REST/JSON; pisahkan route, middleware validasi, handler, serta lapisan penyimpanan.
- Untuk penyimpanan lokal kecil, target p95 daftar/detail di bawah 300 ms; tinjau kembali setelah deployment dan pertumbuhan katalog.
- Semua request body endpoint tulis divalidasi di server.
- Log mencatat metode, path, status, durasi, dan request ID; jangan log payload lengkap atau rahasia.
- Origin, port, dan penyimpanan dikonfigurasi melalui environment, bukan rahasia hard-code.
- Dokumentasi endpoint menjadi kontrak tunggal; perubahan field memerlukan migrasi yang kompatibel.

## 11. Struktur direktori — Layered Architecture MVC

Susunan ini memisahkan transport HTTP (MVC) dari aturan bisnis dan akses data. Controller menangani request/response; service memegang use case; repository menjadi batas ke penyimpanan. Model/domain tidak bergantung pada Express.

```text
src/
├── app.js
├── server.js
├── config/
│   ├── env.js
│   └── cors.js
├── routes/
│   ├── index.js
│   └── product.routes.js
├── controllers/
│   └── product.controller.js
├── services/
│   └── product.service.js
├── repositories/
│   ├── product.repository.js
│   └── product-memory.repository.js
├── models/
│   └── product.model.js
├── validators/
│   └── product.validator.js
├── middleware/
│   ├── validate-request.js
│   ├── not-found.js
│   └── error-handler.js
├── errors/
│   └── api-error.js
├── serializers/
│   ├── product.serializer.js
│   └── problem.serializer.js
└── utils/
    └── request-id.js
tests/
├── unit/
├── integration/
└── fixtures/
```

**Tanggung jawab dan aliran request:**

1. `server.js` memuat konfigurasi dan menjalankan listener; `app.js` menyusun middleware Express, parser JSON terbatas, routes, fallback 404, dan error handler.
2. `routes/product.routes.js` mendeklarasikan method/path dan memasang middleware validasi untuk `POST` sebelum controller.
3. `validators/product.validator.js` memeriksa media type, struktur JSON:API, field dan aturan skema. Validator mengembalikan kesalahan domain yang diserialisasi sebagai error JSON:API.
4. `controllers/product.controller.js` membaca parameter/body, memanggil service, menetapkan status dan header, lalu memakai serializer JSON:API. Controller tidak memuat aturan bisnis atau query database.
5. `services/product.service.js` menerapkan use case dan aturan domain (ID, konflik, stok/varian) dan berkoordinasi dengan repository.
6. `repositories/product.repository.js` mendefinisikan kontrak akses produk; implementasi memory saat exercise dapat diganti adapter database tanpa mengubah controller.
7. `models/product.model.js` memuat entitas/aturan dasar produk, bukan model ORM yang bocor ke respons.
8. `serializers/` membentuk resource dan error JSON:API; `middleware/error-handler.js` menjadi satu tempat memetakan exception ke status dan format error.
9. `tests/` memisahkan unit untuk validator/service dan integration untuk kontrak endpoint.

## 12. Pertanyaan terbuka dan dependensi

- Pilih database dan strategi seed produk MW75 untuk deployment; stok per warna pada contoh perlu dikonfirmasi pemilik katalog.
- Tentukan autentikasi/otorisasi untuk `POST` sebelum endpoint dapat diakses publik. PRD membatasi akses endpoint tulis ke klien internal/tepercaya, namun mekanisme auth belum ditentukan.
- Pastikan apakah harga engraving perlu menjadi bagian data katalog pada fase berikutnya. Untuk saat ini, tetap opsi frontend terpisah.
- Tetapkan format URL gambar untuk lingkungan lokal dan produksi.

## 13. Ukuran keberhasilan

- Seluruh acceptance criteria terpenuhi pada pengujian integrasi API.
- Frontend detail produk dapat memuat daftar/detail dan menampilkan informasi serta stok dari API.
- Semua request create yang tidak valid ditolak sebelum mencapai lapisan penyimpanan.
- Tidak ada error tak tertangani atau stack trace dalam respons API.
