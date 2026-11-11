# CHANGELOG

## [Unreleased]

### 🔧 Perbaikan AGENTS.md
- Perbaiki instruksi auth/routing: `src/proxy.ts` menggunakan inline `isPublicPath` (`/`, `/menu`, `/login`, `/signup`, `/api/business`, `/menu/*`, `/api/auth/*`, `/api/public/*`), bukan `publicRoutes`; `/profile` **bukan** rute publik.
- Tambah petunjuk menjalankan satu file tes: `bun test <path>`.

### 🧾 Pengaturan Struk (`/settings`)
- Tambah **Preview Struk** di tab "Struk" (`src/features/settings/settings-page.tsx`) menggunakan komponen `ReceiptPreview` yang menampilkan contoh struk berdasarkan pengaturan bisnis saat ini (nama bisnis, alamat, pesan penutup, pajak, total, mata uang).

### 🚨 Penanganan Error Memuat Data Bisnis
- Tampilkan panel error dengan tombol "Coba lagi" di dashboard saat `GET /api/business` gagal (401/500), bukan hanya log ke console.
- `src/stores/business-store.ts`: tambah state `error`, `setError`, dan `retryBusiness`.
- `src/components/providers.tsx`: `BusinessDataProvider` menangkap `queryError`, simpan ke store, dan expose `refetch` sebagai `retryBusiness`.
- `src/components/layout/dashboard-layout.tsx`: render `BusinessErrorPanel` saat error, loader saat loading, children saat ready.

### 🔐 Aktivitas Login Khusus User (`/login-activity`)
- Tabel baru `audit."LoginActivities"` (`src/server/db/schema/audit.ts`) + migrasi `drizzle/0004_fearless_molten_man.sql`.
- API `POST /api/auth/login-activity`: mencatat login setelah sign-in berhasil (`src/components/login-form.tsx`).
- API `GET /api/auth/login-activity`: mengambil riwayat login milik user yang login (filter by `userId` sesi).
- Halaman `/login-activity` (`src/app/(dashboard)/login-activity/page.tsx`): menampilkan riwayat login sendiri (waktu, status, IP).
- Sidebar role `user` sekarang menautkan "Profil" dan "Aktivitas Login".
- `src/app/(dashboard)/layout.tsx`: whitelist `/login-activity` agar role `user` bisa mengaksesnya (selain `/profile`).

### 📦 Database
- Migrasi baru: `drizzle/0004_fearless_molten_man.sql` (membuat tabel `audit."LoginActivities"`).
- Migrasi baru: `drizzle/0005_simple_lockheed.sql` (membuat tabel `staff."StaffLoginSessions"`).
- **Blokir:** `bun db:migrate` gagal/hang saat diterapkan ke database (kemungkinan skema `audit` dan `staff` belum dibuat di DB, atau compute Neo
n ter-suspend). Perlu `CREATE SCHEMA IF NOT EXISTS audit` dan `staff` sebelum migrasi, atau pastikan compute aktif.

### 👥 Aktivitas Login Staf di `/staff`
- Tabel baru `staff."StaffLoginSessions"` (`src/server/db/schema/staff.ts`) untuk mencatat sesi masuk per staf.
- Saat login berhasil (`POST /api/auth/login-activity`):
  1. Mencatat ke `audit."LoginActivities"` (user umum).
  2. Jika user belum ada di `staff."Staff"`, otomatis dibuat entri staf baru (role `cashier`) agar muncul di tabel `/staff`.
  3. Mencatat ke `staff."StaffLoginSessions"` dan memperbarui `lastActive` di `staff."Staff"`.
- Kolom "Terakhir aktif" di halaman `/staff` mencerminkan waktu login terakhir.

### 🔑 Lupa Kata Sandi (`/forgot-password`, `/reset-password`)
- Halaman lupa kata sandi (`src/app/(auth)/forgot-password/page.tsx`) + form (`src/components/forgot-password-form.tsx`) yang memanggil `authClient.requestPasswordReset({ email })`.
- Halaman atur ulang kata sandi (`src/app/(auth)/reset-password/page.tsx`) + form (`src/components/reset-password-form.tsx`) yang memanggil `authClient.resetPassword({ newPassword, token })` dengan token dari URL query.
- Link "Lupa kata sandi?" ditambahkan ke formulir login (`src/components/login-form.tsx`).
- Rute `/forgot-password` dan `/reset-password` ditambahkan ke `isPublicPath` di `src/proxy.ts` agar bisa diakses tanpa login.

### ✅ Verifikasi
- `bun run typecheck` lolos tanpa error.
- `bun lint` tidak ada peringatan baru yang terkait perubahan ini.
- `bun run build` berhasil (Next.js production build).

### 🔄 Auto-refresh Pesanan & Badge Notifikasi (`/order`)
- API `GET /api/storefront-orders/count`: menghitung pesanan dengan `proofSubmitted = true` (hanya role `manager`).
- `src/features/storefront/order-notify.ts`: store singleton yang polling count endpoint setiap 30 detik, dengan `subscribe`/`startOrderNotify`/`stopOrderNotify`.
- `src/features/storefront/pages/online-orders-page.tsx`: `OnlineOrdersPage` melakukan auto-refresh daftar pesanan setiap 30 detik (`setInterval` memanggil `load(true)` silent, cleanup interval pada unmount).
- `src/components/appsidebar.tsx`: menampilkan badge `destructive` (dengan `animate-pulse`) pada item nav "Order Online" (`/order`) saat ada pesanan menunggu verifikasi.
- Perbaiki build blocker pre-existing: tambah `"use client"` pada `src/app/(dashboard)/login-activity/page.tsx` dan `export const dynamic = "force-dynamic"` pada `src/app/(auth)/reset-password/page.tsx`.

### 📏 Dimensi Produk & Pengurangan Stok (`/menu`)
- Skema `products."Products"`: tambah kolom `LengthCm`, `WidthCm`, `HeightCm`, `DiameterCm`, `DimensionUnit` (default `cm`) untuk mencatat dimensi produk.
- Migrasi baru: `drizzle/0006_dimension_columns.sql` (menambahkan kolom dimensi ke tabel `products."Products"`).
- API `GET /api/public/storefront/catalog`: memetakan kolom dimensi ke response produk (`unit`, `lengthCm`, `widthCm`, `heightCm`, `diameterCm`, `dimensionUnit`).
- `StorefrontMenu`: tipe `Product` ditambahkan field dimensi; tampilkan dimensi pada kartu produk, detail produk, dan ringkasan checkout.
- `OrderPages` (halaman pelacak pesanan pelanggan): tampilkan dimensi pada setiap item pesanan dalam ringkasan.
- API `POST /api/public/storefront/checkout`: menyimpan data dimensi pada setiap item pesanan dan mengurangi stok inventory (atau `stockQuantity` produk) saat pesanan dibuat.
- `listStorefrontOrders`: otomatis membatalkan pesanan `pending` yang melebihi 60 menit tanpa bukti pembayaran dan mengembalikan stoknya, sehingga tampilan kasir tidak menampilkan pesanan yang batal.

