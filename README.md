# 🏢 NEUROSIM PRO — Virtual Office for Remote Teams (WFH, WFA, WFC)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2+-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Phaser](https://img.shields.io/badge/Phaser-3.80+-E91E63?logo=phaser&logoColor=white)](https://phaser.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8+-010101?logo=socketdotio&logoColor=white)](https://socket.io/)
[![WebRTC](https://img.shields.io/badge/WebRTC-PeerConnection-333333?logo=webrtc&logoColor=white)](https://webrtc.org/)

**NeuroSim PRO** adalah platform kantor virtual online (*virtual workspace*) interaktif 2D yang dirancang khusus bagi para pekerja jarak jauh (**Work From Home / WFH**, **Work From Anywhere / WFA**, dan **Work From Cafe / WFC**). Platform ini menghubungkan seluruh anggota perusahaan dalam satu lingkungan kantor virtual terpadu, memungkinkan kolaborasi alami, komunikasi tatap muka langsung, dan koordinasi kerja tanpa batas geografis.

---

## 🌟 Fitur Utama Platform

### 1. Lingkungan Kantor Virtual 2D Realtime (Multi-Tenant & Multi-Bracket)
- **Denah Kantor Beresolusi Tinggi (2752×1536 px):** Ditenagai oleh engine Phaser 3 dengan sistem partisi spasial, navigasi avatar 4 arah (WASD / Panah / Analog Mobile), dan sistem deteksi tabrakan (*collision physics*).
- **Zonasi Kerja Terstruktur:** 
  - *Workstation Utama (16 Meja Kerja Berkomputer)*
  - *Ruang Rapat Strategis & Konferensi VIP*
  - *Pantry & Coffee Breakroom*
  - *Ruang Eksekutif & Manajemen*
  - *Area Fokus & Santai (AFK Zone)*
- **Sistem Server Bracket Multi-Perusahaan:**
  - `LOBBY-PUBLIC`: Ruang eksplorasi tamu dan orientasi awal pengunjung publik.
  - `LOBBY-01` s/d `LOBBY-05`: Server bracket terisolasi khusus perusahaan berlisensi (PT Inovasi Digital Nusantara, PT Nusantara Teknologi Mandiri, PT Kreatif Media Digital, PT Solusi Awan Kolaborasi, PT Ventura Kapital Asia).

### 2. Komunikasi Realtime & Audio Visual (WebRTC & Socket.IO)
- **WebRTC Peer-to-Peer Video & Audio:** Komunikasi kamera dan mikrofon langsung antar rekan kerja dengan latensi ultra-rendah.
- **Live Screen Sharing Transmit & View:** Berbagi layar kerja untuk presentasi dokumen, kode, dan demo proyek langsung ke rekan satu ruangan dengan fallback layout beresolusi tinggi.
- **Proximity Audio & Dynamic Zones:** Mendukung interaksi audio visual otomatis saat avatar berada di zona rapat atau berdekatan dengan rekan kerja.
- **Multiplayer State Sync:** Sinkronisasi koordinat posisi avatar, status duduk di kursi meja kerja, arah hadap, ekspresi reaksi emoji, dan obrolan balon 2D secara instan ke seluruh klien yang terhubung.

### 3. Manajemen Agenda & To-Do List Terpadu
- **Papan Agenda Kerja Persisten:** Pengelolaan tugas tim (Daily Standup, Desain UI, Presentasi Klien, Operasional Server) yang tersinkronisasi lintas perangkat dan disimpan di database/in-memory store.
- **Sinkronisasi Tugas Realtime:** Setiap perubahan status tugas (tambah, centang selesai, atau hapus) langsung ter-update di layar seluruh anggota tim di ruangan yang sama.

### 4. Dashboard Monitoring & Kontrol Sesuai Hak Akses
- **Dashboard Anggota Tim:** Informasi kartu ID anggota, avatar virtual aktif, navigasi cepat antar zona kerja, dan pemilih server bracket.
- **Leader Dashboard (`/leader`):** Khusus pemimpin divisi/tim untuk memantau kehadiran anggota, status meja kerja, log aktivitas per jam, dan **fitur broadcast pengumuman tim (*Live Announcement*)** ke seluruh ruangan.
- **Admin Dashboard (`/admin` / `x90x9admin`):** Khusus manajemen perusahaan untuk mengelola kuota server bracket, generate kode akses enterprise, reset sesi billing karyawan, dan audit keamanan sistem.

### 5. NEURO AI Assistant (Google Gemini AI)
- Asisten virtual pintar terintegrasi di pojok kanan bawah yang siap memandu karyawan mengenai fasilitas kantor, navigasi zona, cara bergabung ke rapat video, dan tips produktivitas kerja jarak jauh.

---

## 🏗️ Arsitektur Teknologi

```
NeuroSim PRO
├── Frontend (Client-side)
│   ├── React 18 & TypeScript (UI, Modals, State Management)
│   ├── Tailwind CSS (Styling, A11y & Kontras WCAG AA)
│   ├── Phaser 3 (Engine Kantor Virtual 2D, Sprites, Tilemaps, Spatial Audio)
│   └── WebRTC Client (MediaStream, RTCPeerConnection)
├── Backend & Middleware
│   ├── Node.js + Vite Development & Production Server
│   ├── Socket.IO Server (Multiplayer State, Chat, Reactions, Announcements)
│   ├── Express-compatible REST API (Auth, Brackets, Tasks, Admin, Gemini AI)
│   └── JWT Authentication Guard (Session tokens & Role-based Access Control)
└── Data Layer
    ├── MySQL Database (`neurosim_db` relational tables)
    └── In-Memory Store & Fallback Registry (Zero-downtime reliability)
```

---

## 🚀 Panduan Menjalankan Aplikasi

### Prasyarat Sistem
- Node.js versi 18.x atau lebih baru
- npm versi 9.x atau lebih baru
- (Opsional) MySQL Server jika ingin menggunakan penyimpanan relasional permanen

### Langkah Instalasi

1. **Clone Repositori:**
   ```bash
   git clone https://github.com/nandanann24/NeurosimPro.git
   cd NeurosimPro
   ```

2. **Instalasi Dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment (`.env`):**
   Salin berkas contoh atau buat berkas `.env` di root direktori:
   ```env
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=neurosim_super_secret_jwt_key_2026_secure
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Konfigurasi Database MySQL (Opsional, otomatis fallback ke In-Memory)
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=neurosim_db
   ```

4. **Menjalankan Server Pengembangan:**
   ```bash
   npm run dev
   ```
   Buka peramban di `http://localhost:3000`.

5. **Build untuk Produksi:**
   ```bash
   npm run build
   npm run preview
   ```

---

## 🔑 Akun Demo & Akses Cepat

| Peran (Role) | Username | Password | Hak Akses & Fitur |
|---|---|---|---|
| **Tamu / Guest** | *(Tanpa Login)* | *(Tanpa Login)* | Eksplorasi Public Lobby, obrolan teks global |
| **Karyawan / Staff** | `staff` | `staff123` | Meja kerja, kamera, mik, to-do list, WebRTC |
| **Leader / Pemimpin** | `leader` | `leader123` | Dashboard Leader, broadcast pengumuman tim |
| **Super Admin** | `admin` | `admin123` | Dashboard Admin, manajemen server, kuota |

---

## 📄 Lisensi

Proyek ini dirilis di bawah lisensi terbuka [MIT License](LICENSE). Bebas digunakan, dimodifikasi, dan didistribusikan untuk keperluan pengembangan kantor virtual dan kolaborasi tim jarak jauh.
