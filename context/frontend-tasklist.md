# Task List Frontend — Halaman Detail Produk

Gunakan bersama [Mini-PRD halaman](../project-AI/images/PRD.md), [PRD API](api-prd.md), [Architecture](architecture.md), dan [OpenAPI](../docs/openapi.yaml).

## 1. Integrasi API

- [ ] Tetapkan konfigurasi base URL API per environment; jangan hard-code alamat server produksi di source.
- [ ] Gunakan hanya HTTP API backend (`/api/...`); frontend tidak terhubung langsung ke PostgreSQL, tidak membaca `DATABASE_URL`, dan tidak menjalankan migration/seed.
- [ ] Untuk development lokal, tunggu backend dan database Compose siap sebelum memverifikasi loading data; koordinasikan base URL/origin API dengan backend.
- [ ] Muat produk melalui `GET /api/products/:id` menggunakan ID konfigurasi/rute yang jelas.
- [ ] Sesuaikan parser response JSON:API: baca field dari `data.attributes`, bukan dari root object.
- [ ] Petakan `attributes.image`, `attributes.variants.colorOrSize`, `attributes.stock`, `price`, dan `description` ke tampilan.
- [ ] Tangani loading, produk tidak ditemukan, server gagal, response malformed, dan stok habis.
- [ ] Tampilkan pesan error yang ramah dari JSON:API `errors`; jangan tampilkan detail teknis internal.
- [ ] Sediakan fallback yang disepakati jika API belum tersedia di lingkungan lokal.

**Selesai bila:** halaman menampilkan detail yang diterima dari API dan tetap memberikan state yang jelas untuk loading atau error.

## 2. Informasi produk dan galeri

- [ ] Tampilkan nama, harga dalam format Rupiah, deskripsi, foto utama, dan pilihan variasi dari response.
- [ ] Bangun pilihan warna/ukuran berdasarkan `variants.colorOrSize`; jangan mengasumsikan daftar variasi tertanam permanen di HTML.
- [ ] Saat variasi berubah, perbarui label variasi dan foto menggunakan foto variasi atau fallback foto produk.
- [ ] Tampilkan status stok variasi yang dipilih.
- [ ] Berikan alt text gambar yang menjelaskan produk dan variasi aktif.
- [ ] Tangani URL/path gambar yang gagal dimuat dengan placeholder/fallback yang konsisten.

**Selesai bila:** informasi dan foto selalu sesuai dengan produk serta variasi yang sedang dipilih.

## 3. Quantity dan harga

- [ ] Inisialisasi quantity ke 1 untuk stok tersedia; nonaktifkan pemesanan jika stok 0.
- [ ] Batasi quantity minimum 1 dan maksimum stok variasi terpilih.
- [ ] Nonaktifkan tombol minus/plus pada batas quantity.
- [ ] Hitung total harga berdasarkan harga produk dan quantity; gunakan aturan harga engraving dari mini-PRD jika opsi engraving aktif.
- [ ] Saat variasi berubah, validasi ulang quantity terhadap stok variasi baru.
- [ ] Format harga untuk pengguna sebagai Rupiah tanpa mengubah nilai integer API.

**Selesai bila:** quantity tidak pernah melebihi stok pilihan aktif dan total diperbarui tepat saat pilihan berubah.

## 4. Engraving dan konfirmasi pesanan

- [ ] Pertahankan toggle engraving dan input maksimum 12 karakter sesuai mini-PRD.
- [ ] Validasi teks engraving sebagai karakter alfanumerik dan tampilkan uppercase sesuai aturan halaman.
- [ ] Perbarui preview engraving saat input berubah dan saat foto/variasi berubah.
- [ ] Hitung biaya engraving sesuai ketentuan produk yang disepakati.
- [ ] Tampilkan ringkasan konfirmasi yang memuat produk, variasi, engraving, quantity, dan total.
- [ ] Hindari mengirim data pesanan ke endpoint create product; endpoint itu hanya untuk katalog.

**Selesai bila:** preview dan ringkasan konsisten dengan state pilihan yang terlihat di halaman.

## 5. Aksesibilitas dan responsivitas

- [ ] Gunakan label yang terhubung ke setiap input dan nama aksesibel untuk kontrol ikon.
- [ ] Pastikan pilihan variasi mengumumkan state terpilih (`aria-pressed` atau kontrol setara).
- [ ] Umumkan perubahan quantity, stok, error, dan konfirmasi melalui status region yang sesuai.
- [ ] Pastikan navigasi keyboard dan focus-visible bekerja untuk semua kontrol.
- [ ] Periksa layout pada viewport 320px, 375px, tablet, dan desktop; cegah horizontal overflow.
- [ ] Hormati `prefers-reduced-motion`.

**Selesai bila:** alur inti bisa digunakan dengan keyboard dan layout tetap terbaca pada ukuran layar yang ditetapkan mini-PRD.

## 6. Ketahanan dan keamanan frontend

- [ ] Render nama/deskripsi/error sebagai teks, bukan HTML mentah.
- [ ] Jangan simpan kredensial API atau rahasia di bundle frontend.
- [ ] Hindari submit ganda ketika request/loading berlangsung.
- [ ] Nonaktifkan atau beri feedback pada kontrol jika request gagal atau stok habis.
- [ ] Pastikan base URL dan kebijakan CORS frontend/backend cocok per environment.

**Selesai bila:** data API yang tidak tepercaya tidak dieksekusi sebagai markup dan pengguna mendapat feedback untuk setiap state request.

## 7. Verifikasi sebelum rilis

- [ ] Verifikasi render data valid, list variasi kosong/tidak tersedia, dan foto gagal dimuat.
- [ ] Verifikasi error loading, produk tidak ditemukan, dan stok habis.
- [ ] Verifikasi quantity pada minimum/maksimum dan saat mengganti variasi dengan stok berbeda.
- [ ] Verifikasi harga Rupiah, total quantity, biaya engraving, preview, dan ringkasan.
- [ ] Verifikasi viewport mobile/desktop, keyboard, screen reader status, dan tidak ada horizontal scrollbar.
- [ ] Verifikasi tidak ada error JavaScript pada alur utama.

**Definition of done:** kriteria penerimaan mini-PRD halaman terpenuhi dan halaman bekerja dengan response JSON:API yang didokumentasikan backend.
