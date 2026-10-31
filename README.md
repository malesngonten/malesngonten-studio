# Males Ngonten Studio 🎬🐱
> **AI Video Studio Frontend untuk Remotion**  
> *Open-Source, Local-First, Bring Your Own Key (BYOK) Architecture.*

Males Ngonten Studio adalah antarmuka web modern (mobile-first 360px hingga layar desktop) untuk membuat dan mengedit konten video pendek (TikTok, Instagram Reels, YouTube Shorts) menggunakan engine kode **Remotion** dan kecerdasan buatan.

---

## 🚀 Cara Menjalankan (Quick Start)

### 1. Instalasi Dependensi
```bash
npm install
```

### 2. Jalankan Server Dev Lokal
```bash
npm run dev
```
Server Express + Vite akan berjalan di:
```
http://127.0.0.1:3000
```
> **Catatan Port & Socket**: Server lokal dirancang untuk mengikat (*bind*) ke `127.0.0.1` demi keamanan data lokal, memastikan API key Anda tidak terekspos ke jaringan publik atau Wi-Fi luar.

---

## 📁 Struktur Direktori

```
.
├── server/                    # Backend Node.js & Express (Mock Endpoints)
│   ├── mockDb.ts             # In-memory store (AI Keys, Agen, Template, Ekstensi)
│   └── routes.ts             # Router API (/api/status, /api/settings, /api/chat, dll)
├── server.ts                  # Server entry point (Express + Vite middlewareMode)
├── src/
│   ├── api/
│   │   └── client.ts         # Satu-satunya modul client data access (/api/*)
│   ├── contracts/
│   │   ├── manifest.ts       # TypeScript interface Template & Extension manifest
│   │   └── types.ts          # Domain types (AISettings, DoctorCheck, Composition)
│   ├── remotion/
│   │   └── KineticComposition.tsx  # Komposisi animasi tipografi kinetik Remotion
│   ├── components/
│   │   └── common/
│   │       ├── ApprovalDialog.tsx  # Modal konfirmasi keamanan wajib (Zero-Implicit-Exec)
│   │       ├── DemoBanner.tsx      # Banner mode demo ketika key belum diisi
│   │       ├── ExportModal.tsx     # Dialog simulasi export video MP4
│   │       └── Navbar.tsx          # Navigasi mobile (bottom bar) & desktop sidebar
│   ├── screens/
│   │   ├── StudioScreen.tsx       # Player Remotion + Chat AI assistant
│   │   ├── SettingsScreen.tsx     # Pengaturan provider AI (BYOK) & deteksi agen
│   │   ├── TemplatesScreen.tsx    # Galeri template + import flow (zip/folder/GitHub)
│   │   ├── ExtensionsScreen.tsx   # Pengelola ekstensi & simulasi persetujuan
│   │   └── DoctorScreen.tsx       # System Doctor diagnosa Node, FFmpeg, Port
│   ├── App.tsx                    # Aplikasi utama React
│   ├── index.css                  # Tailwind CSS v4 styling
│   └── main.tsx                   # Entry point React
├── public/
│   └── assets/aistudio/           # Brand asset & logo resmi Males Ngonten
├── package.json
└── README.md
```

---

## ⚠️ Daftar Fitur yang Disimulasikan (MOCKED)

Aplikasi ini saat ini berfungsi sebagai **UI skeleton frontend** yang terisolasi bersih dari business logic komponen. Seluruh komunikasi data melalui `src/api/client.ts` yang memanggil rute `/api/*`.

Berikut adalah daftar modul yang saat ini menggunakan **MOCK data** dan nantinya akan digantikan oleh server daemon lokal sungguhan:

1. **Rendering Video MP4 (`/api/export`)**:
   - *Status Mock*: Dialog ekspor menampilkan estimasi rendering dan perintah CLI tanpa memanggil FFmpeg secara langsung.
   - *Implementasi Nyata Nanti*: Memanggil `npx remotion render src/remotion/KineticComposition.tsx Out out/video.mp4` dengan library `child_process.spawn` dan progress streaming stdout FFmpeg.
2. **Proxy AI & Penyimpanan Kunci (`/api/settings/ai`, `/api/chat`)**:
   - *Status Mock*: Kunci API disimpan di memori server Node (`mockDb.ts`). Pesan chat merespon secara heuristik cerdas untuk mengubah teks hook, warna neon, dan memicu request izin paket.
   - *Implementasi Nyata Nanti*: Memanggil HTTP fetch ke endpoint Base URL penyedia OpenAI-compatible pilihan user (`POST ${baseUrl}/chat/completions`) secara aman dengan streaming SSE.
3. **Deteksi Agen Lokal (`/api/agents`)**:
   - *Status Mock*: Mengembalikan status terpasang/belum login untuk OpenCode, Gemini CLI, dan Hermes.
   - *Implementasi Nyata Nanti*: Menjalankan pemeriksaan `which opencode`, `which gemini`, dan pengecekan socket IPC unix `/tmp/opencode.sock`.
4. **Impor Template Eksternal (`/api/templates/import`)**:
   - *Status Mock*: Membaca nama file zip atau URL GitHub yang diinputkan lalu menghasilkan manifes terstruktur untuk ditinjau.
   - *Implementasi Nyata Nanti*: Mengekstrak berkas `.zip` ke folder `src/templates/` dan menginstal dependensi yang dideklarasikan melalui `npm install`.
5. **System Doctor (`/api/doctor`)**:
   - *Status Mock*: Memeriksa status Node, FFmpeg, Chromium, dan port 3000 secara simulasi.
   - *Implementasi Nyata Nanti*: Memeriksa versi real via `ffmpeg -version` dan `node -v` dari environment host.

---

## 🛡️ Prinsip Keamanan: Zero-Implicit-Exec
Setiap aksi berbahaya seperti:
- Menjalankan perintah shell `npm install <package>`
- Mengimpor kode template dari folder atau GitHub
- Memasang ekstensi baru yang diminta oleh agen AI

**Wajib** memunculkan komponen `ApprovalDialog` terlebih dahulu agar pengguna memiliki kendali penuh atas sistem lokal mereka.
