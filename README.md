# E-book BeautyPlus — Versi Perbaikan Admin

Website booking beauty salon berbasis HTML/CSS/JavaScript dengan penyimpanan data menggunakan `localStorage`.

## Perbaikan pada versi ini

### Admin — Booking
- Tombol **Edit** booking.
- Tombol **Konfirmasi** booking.
- Tombol **Batalkan** booking.
- Tombol **Selesai** setelah booking dikonfirmasi.
- Edit tanggal, jam, therapist, status, dan catatan.
- Validasi bentrok jadwal therapist.
- Data booking tetap tersimpan di `localStorage`.

### Admin — Kelola Jadwal Therapist
- Menentukan hari kerja Senin–Minggu.
- Menentukan jam mulai dan selesai kerja.
- Mengatur jam istirahat.
- Menambahkan izin/cuti/libur per therapist atau semua therapist.
- Menghapus data izin/libur.
- Melihat jadwal setiap therapist.
- Melihat kalender 14 hari.
- Melihat booking yang sudah mengisi jadwal.
- Jadwal yang diatur admin dipakai oleh halaman customer untuk menyaring slot.

### Customer
- Slot jam di luar jam kerja dibuat tidak aktif.
- Hari libur salon tidak dapat dipilih untuk booking.
- Therapist yang sedang izin tidak ditampilkan.
- Therapist yang sudah memiliki booking pada tanggal dan jam yang sama tidak ditampilkan.
- Customer dapat membatalkan booking melalui menu **Cek Status Booking** selama status belum Selesai/Dibatalkan.

### Laporan
- Tombol **Unduh Laporan CSV** untuk data booking.

## Login Admin
- Email: `admin@beautyplus.com`
- Password: `admin123`

## Cara Menjalankan
1. Ekstrak file ZIP.
2. Buka folder `E-book Beautyplus2` di VS Code.
3. Jalankan `index.html` untuk halaman customer.
4. Jalankan `admin.html` untuk halaman admin.
5. Untuk pengembangan lebih nyaman, gunakan ekstensi **Live Server** di VS Code.

## Catatan penting
Versi ini masih merupakan prototype frontend. Data disimpan di browser dengan `localStorage`, sehingga belum cocok untuk penggunaan multi-komputer/produksi.

Untuk production diperlukan backend/database, autentikasi yang aman, API booking, validasi server-side, dan mekanisme sinkronisasi data.
