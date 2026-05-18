# MEKASUR - Manajemen Surat Mekatronika

MEKASUR adalah sistem informasi berbasis web statis yang dirancang khusus untuk Himpunan Mahasiswa Mekatronika (HIMAMEKA UTM) guna mengelola administrasi persuratan secara lebih mudah, cepat, dan terpusat. 

Sistem ini berfokus pada kemudahan penggunaan dan dapat diakses dari berbagai perangkat (desktop & mobile) berkat desain antarmukanya yang mengadaptasi gaya *Neo Brutalism*.

## Fitur Utama

- **Pengambilan Nomor Surat Otomatis:** Menghasilkan nomor surat (format baku HIMAMEKA) secara instan berdasarkan tanggal, lingkup surat, jenis surat, dan tujuan kepanitiaan.
- **Manajemen Rekap Surat (Admin):** Daftar lengkap seluruh surat yang pernah dibuat, lengkap dengan fitur pencarian, filter, edit, dan hapus. Data tersimpan di penyimpanan lokal (*Local Storage*).
- **Manajemen Template:** Menyediakan template format baku surat organisasi. Terdapat fitur untuk Admin menambah template (mengunggah file lokal) dan menghapusnya, sementara penonton (*Viewer*) hanya dapat mengunduh.
- **Sistem Role (Admin & Viewer):** Akses dibatasi berdasarkan peran pengguna (memerlukan kata sandi untuk Admin).
- **Sistem Penyimpanan Cepat:** Sepenuhnya berjalan di sisi klien (Client-side) menggunakan Web Local Storage, sehingga lebih cepat dan responsif tanpa bergantung pada *database* atau koneksi backend yang lambat.

## Struktur Folder
```text
/HimaSur
│
├── index.html           # Halaman utama aplikasi
├── css/
│   └── style.css        # File CSS dengan desain Neo Brutalism
├── js/
│   └── app.js           # Logika aplikasi dan penyimpanan lokal
├── templates/           # Berisi file-file template default (.rtf)
└── assets/              # Logo, ikon, gambar kontak
```

## Prasyarat & Instalasi Lokal

Karena ini adalah web statis, Anda tidak perlu menginstal environment khusus (seperti Node.js atau Python). 

1. *Clone* atau unduh repository ini:
   ```bash
   git clone https://github.com/username/mekasur.git
   ```
2. Buka folder proyek tersebut.
3. Cukup klik ganda (double-click) pada file `index.html` untuk membukanya di browser, atau gunakan ekstensi *Live Server* pada VS Code.

## Petunjuk Deployment (PythonAnywhere)

Aplikasi ini dapat di-deploy secara gratis di platform seperti PythonAnywhere. Berikut langkah-langkahnya:

1. Buat akun atau masuk ke [PythonAnywhere](https://www.pythonanywhere.com/).
2. Buka tab **Web** lalu klik **Add a new web app**.
3. Lewati tahap upgrade, pilih **Manual configuration** (jangan pilih framework seperti Flask atau Django).
4. Pilih versi Python (versi apa pun tidak masalah karena kita hanya menampung file statis).
5. Masuk ke tab **Files** dan buka *directory* web app Anda (misalnya: `/home/username/mysite`).
6. Unggah semua file dari repository ini (`index.html`, folder `css`, `js`, `templates`, `assets`) ke dalam folder tersebut.
7. Kembali ke tab **Web**, gulir ke bawah menuju bagian **Static files**.
8. Tambahkan konfigurasi static files berikut:
   - **URL:** `/`
   - **Directory:** `/home/username/mysite` (sesuaikan dengan direktori tempat Anda mengunggah `index.html`).
9. Klik tombol **Reload** di bagian atas halaman Web.
10. Web Anda kini dapat diakses secara publik melalui `http://username.pythonanywhere.com`.

## Kredit & Kontak

**Dikembangkan oleh:** Naufal Zakka (untuk HIMAMEKA UTM).
**Dukungan Bantuan (Admin):** Tersedia pada menu footer (WhatsApp Contact).
