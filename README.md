HEAD
# MasjidKita: Ekosistem Masjid Hiperlokal

Aplikasi **MasjidKita** dirancang khusus untuk menghubungkan Pengurus DKM (Dewan Kemakmuran Masjid) dan Warga Kompleks Perumahan/Desa dalam satu ekosistem tertutup. Aplikasi ini berfokus pada transparansi finansial masjid dan pemberdayaan ekonomi warga dengan landasan Syariah.

---

## 🏛️ Arsitektur Sistem & Struktur Direktori

Aplikasi ini menggunakan desain **fungsional ganda**:
1. **Frontend Mobile-First Interaktif**: Berjalan langsung di browser (`index.html`), mensimulasikan seluruh database relasional dan API backend menggunakan `localStorage` agar dapat diuji tanpa instalasi runtime eksternal.
2. **Backend Siap Produksi (Express/Node.js & SQLite)**: Rute API riil dan query SQL untuk integrasi database sebenarnya berada di direktori `backend/`.

### Struktur File Proyek:
- [`index.html`](file:///c:/MasjidKita/index.html) - Halaman utama aplikasi dengan simulator frame mobile.
- [`css/styles.css`](file:///c:/MasjidKita/css/styles.css) - Desain CSS modern, responsif, dan premium bertema Emerald Green & Professional Slate.
- [`js/app.js`](file:///c:/MasjidKita/js/app.js) - Logika kendali frontend, simulasi database lokal, dan mesin chat BantuBot.
- [`backend/schema.sql`](file:///c:/MasjidKita/backend/schema.sql) - Definisi skema database relasional (SQLite/PostgreSQL) lengkap dengan foreign key constraints.
- [`backend/server.js`](file:///c:/MasjidKita/backend/server.js) - Server REST API berbasis Node.js Express.

---

## 🗄️ Skema Database Relasional

Aplikasi menjamin integritas relasional yang ketat pada tabel-tabel utama berikut:
* **`users`**: Menyimpan profil warga dan DKM (RT, RW, Blok Rumah, status verifikasi tertutup).
* **`accounting_ledgers`**: Buku besar kas masjid (Kas Operasional, Dana Zakat, Dana Infaq, Dana Darurat Sosial).
* **`transactions`**: Jurnal keuangan mutasi Debit/Kredit yang otomatis mencatat setiap aliran dana.
* **`qardhul_hasan_loans`** & **`qardhul_hasan_payments`**: Sistem pinjaman kebajikan tanpa bunga dan pelacakan pembayaran angsuran.
* **`e_sembako_coupons`**: Kupon digital bahan pangan gratis warga yang terintegrasi pengeluaran dana darurat.
* **`pasar_muamalah_items`**: Barang/jasa yang dijual warga (P2P Marketplace).
* **`ai_discreet_tickets`**: Tiket bantuan sosial rahasia hasil screening anonim BantuBot.

---

## 🔗 Rute REST API Backend (`server.js`)

Berikut adalah daftar endpoint API yang siap dihubungkan:

| Endpoint | Metode | Deskripsi | Otorisasi |
|---|---|---|---|
| `/api/auth/register` | `POST` | Registrasi warga baru (status default: belum terverifikasi) | Publik |
| `/api/auth/login` | `POST` | Login warga/DKM, menghasilkan JWT token | Publik |
| `/api/auth/verify` | `POST` | DKM menyetujui atau menolak pendaftaran warga | Admin DKM |
| `/api/auth/pending-residents` | `GET` | Mendapatkan daftar warga belum terverifikasi | Admin DKM |
| `/api/accounting/dashboard` | `GET` | Mendapatkan saldo total kas & 4 sub-rekening real-time | Warga & Admin |
| `/api/accounting/transactions` | `GET` | Melihat jurnal buku besar riwayat mutasi dana | Warga & Admin |
| `/api/payments/charge` | `POST` | Melakukan pembayaran QRIS/Transfer (menjurnal otomatis) | Terotentikasi |
| `/api/qardhul-hasan/apply` | `POST` | Warga mengajukan pinjaman tanpa bunga | Warga |
| `/api/qardhul-hasan/loans` | `GET` | Mengambil daftar pinjaman warga | Terotentikasi |
| `/api/qardhul-hasan/approve` | `POST` | DKM menyetujui pinjaman (dana cair dari Kas Darurat) | Admin DKM |
| `/api/qardhul-hasan/pay` | `POST` | Warga membayar cicilan pinjaman (dana masuk Kas Darurat) | Warga |
| `/api/sembako/claim` | `POST` | Warga mengklaim voucher pangan bulanan Rp 150.000 | Warga |
| `/api/sembako/coupons` | `GET` | Menampilkan kupon aktif milik warga | Terotentikasi |
| `/api/sembako/redeem` | `POST` | Menukarkan kupon sembako di warung warga mitra | Admin DKM |
| `/api/market/items` | `GET` | Menampilkan produk-produk Pasar Muamalah yang aktif | Terotentikasi |
| `/api/market/create` | `POST` | Warga memasang produk jualan baru | Warga |
| `/api/bantubot/chat` | `POST` | Mengirim pesan chat ke AI BantuBot (Skrining sosial & Fiqh) | Terotentikasi |
| `/api/bantubot/discreet-tickets` | `GET` | Menampilkan tiket bantuan rahasia hasil skrining AI | Admin DKM |
| `/api/bantubot/approve-ticket` | `POST` | DKM mencairkan dana sosial untuk tiket rahasia AI | Admin DKM |

---

## 🌟 Tiga Pilar Utama Aplikasi

### 1. Akuntansi Transparansi (Financial Transparency)
Setiap kali donasi Zakat/Infaq dibayarkan secara online (misalnya simulasi QRIS scan), sistem secara otomatis memicu pembukuan entri ganda (*double-entry journaling*). 
* **Zakat** masuk ke **Zakat Fund**.
* **Infaq/Sedekah** masuk ke **Infaq Sedekah Fund**.
* Nilai kas total di dashboard warga akan terupdate secara instan.

### 2. Kepatuhan Syariah & Kesejahteraan (Sharia & Welfare)
* **Qardhul Hasan**: Pinjaman kebajikan tanpa bunga (0% riba) untuk modal usaha warga. Pengembaliannya dapat diangsur secara fleksibel dan langsung memulihkan saldo **Emergency Social Fund**.
* **E-Sembako**: Skema pangan sosial digital. Kupon unik digenerate di browser, dan dapat dicairkan di Warung Warga terdaftar (pembayaran kupon dikirim dari kas DKM langsung ke pemilik warung, membantu perputaran uang di lingkungan kompleks).
* **Pasar Muamalah**: Pasar peer-to-peer terintegrasi bagi warga untuk memasarkan jasa atau kuliner rumahan (dilengkapi tombol hubungi via WhatsApp otomatis).
* **Kalkulator Zakat**: Modul kalkulator zakat mal & zakat profesi berdasarkan standar nisab kontemporer.

### 3. AI Asisten BantuBot
* **Konsultasi Syariah**: Menjawab hukum Fiqh Muamalah dasar seputar penghitungan zakat, infaq, dan pinjaman syariah.
* **Skrining Sosial Anonim**: Fitur paling krusial. Warga yang sungkan mengajukan bantuan tunai langsung ke DKM dapat mengobrol privat dengan BantuBot. AI akan memandu proses pengaduan secara terarah, menyamarkan identitas warga menjadi alias (misalnya: `Warga_RT02_Blok_C4`), membuat tiket darurat sosial, dan meneruskannya ke dasbor admin DKM demi menjaga martabat warga.
* **Perintah Cepat Admin**: Membantu DKM menyusun draf pengumuman pengumpulan kas atau merangkum neraca keuangan secara instan lewat obrolan teks.

---

## 🚀 Petunjuk Menjalankan Aplikasi

### Untuk Prototipe Frontend (Instan & Interaktif):
1. Cukup buka berkas [`index.html`](file:///c:/MasjidKita/index.html) di browser modern Anda (Google Chrome, MS Edge, Firefox).
2. Anda akan melihat bingkai simulator handphone yang elegan.
3. Gunakan salah satu akun uji coba berikut untuk menguji sistem verifikasi tertutup:
   * **DKM Admin**: Telp `081234567890`, Sandi `admin`
   * **Warga Terverifikasi**: Telp `089876543210`, Sandi `warga`
   * **Warga Belum Verifikasi**: Telp `085544332211`, Sandi `warga`
4. Untuk menguji alur verifikasi warga:
   * Daftarkan warga baru di tab pendaftaran.
   * Masuk sebagai Admin DKM.
   * Buka menu **DKM Panel**, lalu klik **Setujui** di bagian verifikasi warga.
   * Warga baru sekarang dapat masuk ke aplikasi dengan sukses.

### Untuk Menjalankan Server Backend Asli:
1. Pastikan Anda memiliki Node.js terinstal di komputer.
2. Buka terminal di folder `backend/` dan jalankan:
   ```bash
   npm install express body-parser cors jsonwebtoken sqlite3 bcryptjs
   ```
3. Buat database sqlite3 dan jalankan skema `schema.sql` terlebih dahulu.
4. Jalankan server:
   ```bash
   node server.js
   ```
5. Server API akan berjalan pada rute `http://localhost:5000`. Anda tinggal mengarahkan AJAX request di `js/app.js` ke port tersebut untuk beralih ke database riil.
=======
# MasjidKita
Aplikasi masjid yang bermanfaat untuk warga
>>>>>>> 709210dfcfc328eac73426e6c78138cf0542e53c
