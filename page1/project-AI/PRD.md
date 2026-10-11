# PRODUCT REQUIREMENT DOCUMENT (PRD)
## Halaman Detail Produk Headphone (Custom Engraving Edition)

### 1. Product Overview
Halaman detail produk untuk headphone nirkabel premium yang memungkinkan pembeli memilih warna, mengatur jumlah, dan memvisualisasikan ukiran teks kustom (custom engraving) pada earcup headphone secara real-time.

Data Spesifikasi Produk:
- Nama Produk: MW75 Custom Wireless ANC Headphones
- Harga Satuan: $ 750.00
- Deskripsi: Headphone Active Noise-Cancelling premium berbahan kulit dan aluminium alloy dengan fitur personalisasi ukiran nama/teks pada earcup.
- Pilihan Warna: Matte Black, Gunmetal, Silver
- Batas Engraving: Opsional (Maksimal 12 Karakter Alfanumerik KAPITAL)
- Stok Maksimal: 5 unit per varian
- Asset Visual: Foto earcup headphone interaktif di folder images/

### 2. Problem + Target User
- Problem: Pembeli ragu menambahkan grafir kustom karena tidak ada live preview pada foto produk, serta risiko teks terlalu panjang merusak estetika.
- Target User: Audio enthusiast dan pembeli hadiah yang menginginkan sentuhan personalisasi eksklusif.

### 3. Goals + Non-Goals
- Goals: Menampilkan informasi produk, live preview engraving di earcup, toggle varian warna, kontrol qty (1-5), dan ringkasan konfirmasi pesanan.
- Non-Goals: Payment gateway/checkout asli, backend/database API, dan 3D/AR rendering.

### 4. User Flow & Initial State
1. Buka Halaman -> Tampil foto Matte Black, harga Rp8.999.000, Qty 1, Engraving Non-aktif.
2. Pilih Warna -> Gambar berganti ke varian warna terpilih (images/headphone-[warna].jpg).
3. Dicentang "Tambah Engraving" -> Input teks aktif -> Ketik teks -> Teks tampil di overlay earcup secara real-time.
4. Atur Qty (+/-) -> Hitung Total (Harga x Qty).
5. Klik "Konfirmasi Pesanan" -> Tampil ringkasan rincian pesanan.

### 5. Features & Requirements
- FR-01: Header Logo & Navigasi
- FR-02: Foto Preview Visual dengan CSS Text Overlay untuk Engraving
- FR-03: Informasi Nama, Harga (Rupiah), & Deskripsi
- FR-04: Color Swatches (Matte Black, Gunmetal, Silver)
- FR-05: Custom Engraving Toggle & Text Input (Max 12 Char Uppercase)
- FR-06: Quantity Control (Min 1, Max 5 dengan status tombol disabled)
- FR-07: Real-time Total Calculator
- FR-08: Order Confirmation Panel

### 6. User Stories
- US-01: Sebagai calon pembeli, saya ingin melihat foto dan deskripsi produk agar dapat memahami spesifikasi headphone.
- US-02: Sebagai calon pembeli, saya ingin memilih variasi warna agar produk sesuai dengan selera saya.
- US-03: Sebagai pembeli hadiah, saya ingin menambahkan teks ukiran kustom pada earcup agar produk terasa personal dan eksklusif.
- US-04: Sebagai calon pembeli, saya ingin melihat live preview teks ukiran secara langsung agar yakin sebelum membeli.
- US-05: Sebagai pembeli, saya ingin mengatur jumlah pesanan dan melihat kalkulasi total harga agar sesuai anggaran.

### 7. Acceptance Criteria (AC)
- AC-01: Initial load: Matte Black, Qty 1, Engraving disabled.
- AC-02: Click color: Gambar berubah sesuai warna.
- AC-03: Check Engraving: Input teks muncul dan fokus.
- AC-04: Ketik teks: Overlay pada earcup ter-update real-time.
- AC-05: Max 12 karakter: Input menolak karakter ke-13.
- AC-06: Qty == 1 -> Tombol (-) disabled. Qty == 5 -> Tombol (+) disabled.
- AC-07: Klik Konfirmasi -> Tampil ringkasan rincian pesanan.

### 8. Constraints & Success Criteria
- Tech Constraints: HTML5, CSS3, Vanilla JS murni (tanpa framework/library), data lokal.
- Success Criteria: 100% AC Lulus, tampilan responsif (mobile 375px & desktop), bebas console error.
