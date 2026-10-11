# Task List Backend — Product Detail API

Gunakan bersama [PRD API](api-prd.md), [Architecture](architecture.md), dan [OpenAPI](../docs/openapi.yaml).

> Status: implementasi lokal dan verifikasi selesai. Kontrol akses dokumentasi, TLS, dan secret manager produksi menunggu environment deployment serta kebijakan akses yang ditentukan.

## 1. Setup proyek

- [x] Gunakan `docker-compose.yml` PostgreSQL yang sudah tersedia; jangan jalankan migration/seed sebelum healthcheck database berstatus healthy.
- [x] Inisialisasi proyek Node.js dan tetapkan versi Node.js LTS.
- [x] Pasang Express.js, `pg`, `swagger-ui-express`, parser YAML, dan dependensi validasi yang dipilih.
- [x] Aktifkan ES modules dan tambahkan scripts untuk start, development, migration, serta pemeriksaan kode.
- [x] Salin `.env.example` menjadi `.env`, ganti password lokal, dan pastikan `DATABASE_URL` cocok dengan `POSTGRES_*` serta port Compose.
- [x] Masukkan `.env` dan kredensial lokal ke `.gitignore`; jangan commit nilai rahasia.
- [x] Buat struktur Layered Architecture MVC sesuai `architecture.md`.
- [x] Baca dan validasi konfigurasi environment saat startup; hentikan startup jika konfigurasi wajib tidak tersedia.

**Selesai bila:** `docker compose up -d db` menghasilkan service `healthy`, aplikasi lokal dapat membaca konfigurasi `.env`, dan tidak ada rahasia di repository.

## 2. PostgreSQL dan migrasi

- [x] Hubungkan backend ke service PostgreSQL Compose melalui `DATABASE_URL` (`localhost:5432` saat backend berjalan di host; `db:5432` jika backend kelak ikut berada di Compose).
- [x] Siapkan connection pool `pg` dan penutupan pool saat shutdown.
- [x] Buat migration tabel `products` dengan UUID, nama, harga Rupiah, foto, deskripsi, dan timestamp.
- [x] Buat migration tabel `product_variants` dengan foreign key, nama variasi, foto opsional, quantity, dan timestamp.
- [x] Terapkan constraint `NOT NULL`, `CHECK`, foreign key, dan unique `(product_id, name)` seperti di `architecture.md`.
- [x] Buat migration runner yang menerapkan migration berurutan dan mencatat migration yang sudah diterapkan.
- [x] Buat seed development untuk produk MW75 dan variasi; pastikan stok seed variasi berjumlah 12 sesuai contoh.
- [x] Tambahkan graceful shutdown untuk menutup pool database.

**Selesai bila:** database kosong dapat dimigrasikan, di-seed, lalu dibaca; data tidak valid ditolak constraint database.

**Batas tanggung jawab:** backend memiliki migration dan seed. Frontend tidak mengakses PostgreSQL dan tidak menjalankan migration.

## 3. Data access dan aturan domain

- [x] Definisikan kontrak `product.repository` untuk list, find-by-id, dan create.
- [x] Implementasikan query PostgreSQL dengan parameter binding; jangan interpolasi input ke SQL.
- [x] Buat query list/detail yang mengambil variasi dan menghitung total stok dari `SUM(quantity)`.
- [x] Implementasikan create produk dan variasi dalam satu transaksi; rollback seluruh transaksi jika satu insert gagal.
- [x] Tangani produk tidak ditemukan, UUID tidak valid, nama variasi duplikat, dan konflik penyimpanan.
- [x] Pastikan produk tanpa variasi ditolak pada use case create.

**Selesai bila:** repository tidak bergantung pada Express dan semua operasi tulis menjaga konsistensi produk-variasi secara atomik.

## 4. Routes, controller, dan validasi

- [x] Implementasikan `GET /api/products`.
- [x] Implementasikan `GET /api/products/:id`.
- [x] Implementasikan `POST /api/products`.
- [x] Validasi struktur JSON:API: `data.type = products`, atribut wajib, tipe, panjang, rentang angka, dan field yang diizinkan.
- [x] Tolak field tak dikenal dan field yang dikelola server seperti `id` serta timestamp.
- [x] Validasi foto sebagai path lokal yang diizinkan atau URL HTTPS; tolak protokol dan path berbahaya.
- [x] Validasi 1–50 variasi, nama 1–60 karakter yang unik tanpa membedakan kapitalisasi, dan quantity integer 0–1.000.000.
- [x] Periksa media type JSON:API; batasi body maksimal 32 KB.
- [x] Petakan error ke status HTTP dan format JSON:API `errors`, termasuk `source.pointer` untuk kesalahan field.
- [x] Tambahkan fallback 404 dan error handler terpusat tanpa stack trace pada response.

**Selesai bila:** semua endpoint dan error sesuai kontrak di `api-prd.md` serta OpenAPI.

## 5. Serializer dan kontrak response

- [x] Serialize resource product dengan `type`, `id`, `attributes`, dan `links.self`.
- [x] Petakan `photo_url` menjadi atribut API `image` dan `created_at` menjadi `createdAt`.
- [x] Petakan `product_variants.quantity` menjadi `stock`; gunakan foto produk jika foto variasi tidak tersedia.
- [x] Hitung atribut total `stock` dari jumlah quantity semua variasi.
- [x] Pastikan semua response sukses dan error memakai `Content-Type: application/vnd.api+json`.
- [x] Pada create, kembalikan `201 Created` dan header `Location` ke resource baru.

**Selesai bila:** bentuk response konsisten untuk list, detail, create, dan error serta tidak mengekspos row database mentah.

## 6. Dokumentasi Swagger / OpenAPI

- [x] Validasi `docs/openapi.yaml` terhadap OpenAPI 3.1.
- [x] Pastikan dokumentasi mencakup request/response JSON:API, parameter UUID, header `Location`, dan seluruh status error.
- [x] Pasang Swagger UI di `/api-docs` dan sajikan spesifikasi di `/api-docs/openapi.yaml`.
- [ ] Batasi akses dokumentasi pada deployment internal bila kebijakan deployment mengharuskan.
- [x] Perbarui OpenAPI pada perubahan kontrak API yang sama dengan perubahan implementasi.

**Selesai bila:** Swagger UI terbuka dan contoh request dapat digunakan untuk menjelajahi endpoint.

## 7. Keamanan dan operasi

- [x] Batasi CORS ke origin frontend yang dikonfigurasi.
- [x] Batasi endpoint `POST` ke klien tepercaya; tambahkan autentikasi/otorisasi sebelum API dipublikasikan.
- [x] Tambahkan request ID dan logging metode, path, status, serta durasi tanpa mencatat body sensitif.
- [ ] Gunakan TLS dan secret manager untuk konfigurasi deployment.
- [x] Dokumentasikan prosedur migration, seed, backup, dan pemulihan database.

**Selesai bila:** konfigurasi sensitif tidak masuk repository dan endpoint tulis tidak terbuka tanpa kontrol akses yang disetujui.

## 8. Verifikasi sebelum rilis

- [x] Verifikasi GET list untuk data berisi produk dan daftar kosong.
- [x] Verifikasi GET detail untuk UUID valid, UUID malformed, dan produk tidak ditemukan.
- [x] Verifikasi POST sukses, validasi field, URL berbahaya, field tak dikenal, konflik variasi, dan rollback transaksi.
- [x] Verifikasi media type salah, body malformed, body terlalu besar, dan `Accept` tidak didukung.
- [x] Verifikasi Swagger UI serta kesesuaian response runtime dengan OpenAPI.
- [x] Verifikasi tidak ada stack trace atau credential pada response/log.

**Definition of done:** seluruh acceptance criteria PRD terpenuhi, migration dapat diterapkan berulang dengan aman, dan OpenAPI sama dengan implementasi.
