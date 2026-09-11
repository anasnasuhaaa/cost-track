# Cost Track

Cost Track adalah personal finance assistant berbasis web yang memprioritaskan pencatatan cepat, perhitungan akurat, dan pengalaman mobile seperti aplikasi. Pengguna dapat mencatat transaksi manual atau lewat Gemini Smart Input, memantau dashboard, serta menanyakan ringkasan keuangan melalui intent yang aman.

## Fitur

- Email/password authentication dengan Better Auth dan registrasi yang dapat dimatikan.
- Akun keuangan Cash, bank, e-wallet, dan lainnya dengan saldo hasil kalkulasi.
- Kategori pemasukan/pengeluaran bawaan serta kategori custom.
- CRUD transaksi, pencarian, pagination, dan filter jenis/kategori/akun/tanggal.
- Dashboard periodik dengan saldo, pemasukan, pengeluaran, jumlah transaksi, dua chart, dan transaksi terbaru.
- Gemini Smart Input dengan structured output, validasi Zod, preview editable, dan manual fallback.
- Financial Assistant dengan intent whitelist; angka selalu dihitung backend dari database.
- UI mobile-first, bottom navigation, sidebar desktop, serta tema Light/Dark/System.

## Tech stack

- Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS 4
- shadcn/Base UI, Lucide, Sonner, Recharts, next-themes
- Neon PostgreSQL dan Drizzle ORM/Kit
- Better Auth, Zod, Gemini Interactions API
- Vitest

## Menjalankan secara lokal

Prasyarat: Node.js 20+ dan project PostgreSQL di Neon.

```bash
npm install
```

Salin `.env.example` menjadi `.env.local`, kemudian isi nilainya secara lokal. Jangan commit `.env.local`.

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
SIGNUP_ENABLED=true
GEMINI_API_KEY=
GEMINI_MODEL=
```

Buat `BETTER_AUTH_SECRET` yang acak dan kuat (minimal 32 karakter). `DATABASE_URL`, `BETTER_AUTH_SECRET`, serta `GEMINI_API_KEY` hanya digunakan di server.

Siapkan database lalu mulai aplikasi:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

Buka `http://localhost:3000`, daftar, lalu akun Cash akan dibuat otomatis. `db:seed` aman dijalankan ulang dan hanya memastikan kategori sistem tersedia.

## Setup Neon

1. Buat project PostgreSQL di [Neon](https://neon.tech/).
2. Salin connection string PostgreSQL dari dashboard Neon.
3. Simpan hanya di `DATABASE_URL` pada `.env.local` dan environment Vercel.
4. Jalankan `npm run db:migrate`, kemudian `npm run db:seed` untuk environment yang dituju.

Migration berada di folder `drizzle/`. Buat migration baru setelah perubahan schema dengan `npm run db:generate`. Jangan menjalankan operasi migration production tanpa review dan backup yang sesuai.

## Setup Better Auth

- Isi `BETTER_AUTH_SECRET` dengan secret acak yang berbeda untuk setiap environment.
- Pastikan `BETTER_AUTH_URL` dan `NEXT_PUBLIC_APP_URL` sesuai origin aplikasi.
- Gunakan `SIGNUP_ENABLED=false` untuk menutup pendaftaran user baru; login user yang sudah ada tetap tersedia.
- Tabel Better Auth berada dalam schema Drizzle yang sama agar migration tetap terpusat.

## Setup Gemini

Dapatkan API key sendiri dari [Google AI Studio](https://aistudio.google.com/) lalu simpan di `GEMINI_API_KEY` pada environment lokal/Vercel. Jangan mengirim atau menaruh key di source code.

Isi `GEMINI_MODEL` dengan model Gemini Developer API yang mendukung structured output. Model sengaja tidak di-hardcode agar dapat diganti tanpa perubahan source. Integrasi menggunakan Interactions API, mengirim hanya teks transaksi/pertanyaan beserta konteks nama minimum, dan menggunakan `store: false`.

Tanpa key/model atau saat provider error, transaksi manual tetap berfungsi. Test suite menggunakan mock dan tidak memanggil Gemini live.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run build
npm run db:generate
```

`db:generate` seharusnya melaporkan tidak ada perubahan schema bila migration sudah sinkron. Pengujian live auth/database/AI membutuhkan environment lokal yang sudah diisi.

## Struktur penting

- `app/(auth)` — halaman login/register.
- `app/(dashboard)` — shell dan halaman aplikasi terproteksi.
- `app/api` — auth, CRUD finansial, Smart Input, dan Assistant.
- `db` dan `drizzle` — schema, koneksi, seed, serta migration.
- `lib/finance` — validasi, query, kalkulasi, dan business logic.
- `lib/ai` — Gemini client, extraction, dan intent classification.
- `tests` — kalkulasi, validasi, authorization scoping, dan AI fallback.

## Deployment Vercel

1. Import repository di Vercel.
2. Tambahkan seluruh environment variable sesuai `.env.example`; gunakan URL production pada kedua URL aplikasi/auth.
3. Jalankan migration dan seed terhadap database production melalui proses release yang terkontrol.
4. Jalankan build dan deploy dari Vercel.

Repository ini tidak menjalankan deploy, mengubah DNS, atau mengatur domain. Domain Cloudflare dapat dihubungkan manual setelah deployment siap.

## Catatan keamanan

- Semua route finansial memverifikasi session dan membatasi query dengan `userId`; resource user lain tidak diekspos.
- Input API divalidasi server-side dengan Zod dan query diparameterisasi oleh Drizzle.
- Account yang memiliki transaksi tidak dihapus; account/kategori menggunakan archive.
- Nominal disimpan sebagai integer rupiah positif, bukan floating point atau expense negatif.
- Gemini tidak menerima credential atau histori penuh dan tidak pernah menghasilkan SQL untuk dieksekusi.
- Assistant hanya menjalankan query backend yang telah ditentukan dan memiliki rate limit defensif.
- Jangan log atau commit database URL, auth secret, API key, session token, password, atau histori finansial sensitif.
