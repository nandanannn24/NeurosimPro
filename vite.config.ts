import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import dotenv from 'dotenv';

import { setupRealtimeSocketIO } from './src/lib/socketHandler';
import { lobbyStore } from './src/lib/lobbyStore';

// Muat variabel lingkungan dari .env
dotenv.config();

// SSL diaktifkan secara default untuk menjamin akses kamera & audio aman (HTTPS)
// Dapat dinonaktifkan dengan menyetel VITE_SSL=false jika ingin menggunakan HTTP biasa
const isSslEnabled = process.env.VITE_SSL !== 'false' && process.env.ENABLE_SSL !== 'false';

/**
 * Plugin API Internal & Real-Time Multiplayer untuk Vite Dev Server
 * Memungkinkan pemanggilan /api/* dan koneksi WebSocket (Socket.IO) berjalan langsung
 * di server Vite (port 3000) tanpa perlu menjalankan server Express terpisah.
 */
function neurosimApiPlugin(): Plugin {
  return {
    name: 'neurosim-api-plugin',
    configureServer(server) {
      if (server.httpServer) {
        setupRealtimeSocketIO(server.httpServer);
      }

      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];

        // Optimasi Performa: Cache-Control agresif untuk aset statis game agar website sangat ringan
        if (url?.startsWith('/assets/') || url?.endsWith('.webp') || url?.endsWith('.png')) {
          res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
        }

        // 1. Endpoint Lobby Brackets (5 Online Servers)
        if (req.method === 'GET' && url === '/api/lobbies') {
          try {
            const lobbies = lobbyStore.getLobbies();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, lobbies }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: err.message }));
          }
          return;
        }

        // 2. Endpoint Join Lobby (Validasi ID Lobby & Billing Key)
        if (req.method === 'POST' && url === '/api/lobbies/join') {
          try {
            const body = await parseJsonBody(req);
            const lobby = lobbyStore.getLobbyById(body.lobbyId);
            if (!lobby) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, message: 'ID Lobby tidak ditemukan.' }));
              return;
            }
            if (!lobby.isActive) {
              res.statusCode = 403;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, message: 'Server bracket ini sedang dinonaktifkan oleh administrator.' }));
              return;
            }
            if (lobby.isLocked && body.billingKey?.trim().toUpperCase() !== lobby.billingKey.toUpperCase()) {
              res.statusCode = 403;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, message: 'Billing key tidak valid untuk mengakses server bracket perusahaan ini.' }));
              return;
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, lobby }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: err.message }));
          }
          return;
        }

        // 3. Endpoint Admin Overview (Realtime System Stats)
        if (req.method === 'GET' && url === '/api/admin/overview') {
          try {
            const overview = lobbyStore.getSystemOverview();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, overview }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: err.message }));
          }
          return;
        }

        // 4. Endpoint Admin Users Management
        if (req.method === 'GET' && url === '/api/admin/users') {
          try {
            const users = lobbyStore.getUsers();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, users }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: err.message }));
          }
          return;
        }

        if (req.method === 'POST' && url === '/api/admin/users/update') {
          try {
            const body = await parseJsonBody(req);
            const result = lobbyStore.updateUser(Number(body.id), body);
            res.statusCode = result.success ? 200 : 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: err.message }));
          }
          return;
        }

        if (req.method === 'POST' && url === '/api/admin/users/create') {
          try {
            const body = await parseJsonBody(req);
            const result = lobbyStore.createUser(body);
            res.statusCode = result.success ? 200 : 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: err.message }));
          }
          return;
        }

        // 5. Endpoint Admin Companies & Humas (PIC) Management
        if (req.method === 'GET' && url === '/api/admin/companies') {
          try {
            const companies = lobbyStore.getCompanies();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, companies }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: err.message }));
          }
          return;
        }

        if (req.method === 'POST' && url === '/api/admin/companies/update') {
          try {
            const body = await parseJsonBody(req);
            const result = lobbyStore.updateCompany(body.id, body);
            res.statusCode = result.success ? 200 : 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: err.message }));
          }
          return;
        }

        // 6. Endpoint Admin Billing Sessions & Brackets
        if (req.method === 'GET' && url === '/api/admin/billing') {
          try {
            const sessions = lobbyStore.getBillingSessions();
            const lobbies = lobbyStore.getLobbies();
            const companies = lobbyStore.getCompanies();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, sessions, lobbies, companies }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: err.message }));
          }
          return;
        }

        if (req.method === 'POST' && url === '/api/admin/billing/create') {
          try {
            const body = await parseJsonBody(req);
            const result = lobbyStore.createBillingSession(body);
            res.statusCode = result.success ? 200 : 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: err.message }));
          }
          return;
        }

        if (req.method === 'POST' && url === '/api/admin/billing/session/update') {
          try {
            const body = await parseJsonBody(req);
            const result = lobbyStore.updateBillingSession(body.sessionId, body);
            res.statusCode = result.success ? 200 : 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: err.message }));
          }
          return;
        }

        if (req.method === 'POST' && url === '/api/admin/billing/update') {
          try {
            const body = await parseJsonBody(req);
            const result = lobbyStore.updateLobbyBilling(body);
            res.statusCode = result.success ? 200 : 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: err.message }));
          }
          return;
        }

        if (req.method === 'POST' && url === '/api/admin/billing/generate-key') {
          try {
            const body = await parseJsonBody(req);
            const key = lobbyStore.generateBillingKey(body.prefix || 'CORP');
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, billingKey: key }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: err.message }));
          }
          return;
        }

        // 7. Endpoint Admin Audit Logs
        if (req.method === 'GET' && url === '/api/admin/logs') {
          try {
            const logs = lobbyStore.getAuditLogs();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, logs }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: err.message }));
          }
          return;
        }

        // 8. Endpoint Leader Dashboard Overview
        if (req.method === 'GET' && url?.startsWith('/api/leader/overview')) {
          try {
            const q = req.url?.split('?')[1] || '';
            const params = new URLSearchParams(q);
            const bracketId = params.get('bracketId') || 'LOBBY-01';
            const lobby = lobbyStore.getLobbyById(bracketId);
            const company = lobbyStore.getCompanies().find((c) => c.assignedBracketId === bracketId);
            const seats = lobbyStore.getOccupiedSeats(bracketId);
            const allUsers = lobbyStore.getUsers().filter((u) => u.bracketId === bracketId || u.bracketId === 'ALL');

            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                success: true,
                bracketId,
                lobby,
                company,
                seats,
                teamMembers: allUsers,
                onlineCount: lobby?.onlineCount || 0,
              })
            );
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: err.message }));
          }
          return;
        }

        // 9. Endpoint Key Validation for Room Entry
        if (req.method === 'POST' && url === '/api/lobbies/validate-key') {
          try {
            const body = await parseJsonBody(req);
            const result = lobbyStore.validateKeyForLobby(body.billingKey, body.lobbyId);
            res.statusCode = result.valid ? 200 : 403;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ valid: false, message: err.message }));
          }
          return;
        }

        // 10. Endpoint Seats Occupancy
        if (req.method === 'GET' && url?.startsWith('/api/seats')) {
          try {
            const q = req.url?.split('?')[1] || '';
            const params = new URLSearchParams(q);
            const bracketId = params.get('bracketId') || 'LOBBY-01';
            const seats = lobbyStore.getOccupiedSeats(bracketId);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, bracketId, seats }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: err.message }));
          }
          return;
        }

        // 11. Endpoint Role-Based Access Codes Management
        if (req.method === 'GET' && url === '/api/access-codes') {
          try {
            const codes = lobbyStore.getAccessCodes();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, codes }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: err.message }));
          }
          return;
        }

        if (req.method === 'POST' && url === '/api/access-codes/generate') {
          try {
            const body = await parseJsonBody(req);
            const result = lobbyStore.generateAccessCode(body);
            res.statusCode = result.success ? 200 : 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: err.message }));
          }
          return;
        }

        if (req.method === 'POST' && url === '/api/access-codes/toggle') {
          try {
            const body = await parseJsonBody(req);
            const success = lobbyStore.toggleAccessCode(body.codeId, body.isActive);
            res.statusCode = success ? 200 : 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: err.message }));
          }
          return;
        }

        if (req.method === 'POST' && url === '/api/access-codes/validate') {
          try {
            const body = await parseJsonBody(req);
            const result = lobbyStore.validateAccessCode(body.code);
            res.statusCode = result.valid ? 200 : 403;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ valid: false, message: err.message }));
          }
          return;
        }

        // 12. Endpoint NEURO AI Assistant (Gemini API with Fallback Hierarchy)
        if (req.method === 'POST' && url === '/api/ai/chat') {
          try {
            const body = await parseJsonBody(req);
            const userMessages = Array.isArray(body.messages) ? body.messages : [];
            const lastUserMsg = userMessages.length > 0 ? userMessages[userMessages.length - 1].content : (body.prompt || '');

            const systemInstruction = `Kamu adalah NEURO AI Assistant, pemandu resmi virtual office NEUROSIM PRO.
Tugas utamamu adalah membantu pengguna memahami gameplay, kontrol karakter, sistem kantor virtual, navigasi ruangan, dan fitur platform secara ramah, ringkas, jelas, dan profesional dalam bahasa Indonesia.

PANDUAN & FITUR NEUROSIM PRO YANG TERSEDIA:
1. Navigasi & Kontrol Karakter:
   - Desktop: Gunakan tombol keyboard WASD atau tombol Panah. Gerak 8 arah termasuk serong (diagonal) didukung penuh.
   - Mobile: Tersedia Virtual Analog Joystick di sudut kiri bawah layar untuk bergerak bebas 360 derajat.
2. Interaksi & Fasilitas:
   - Tombol SPASI atau E (Desktop) atau Tombol [AKSI] (Mobile):
     * Duduk di kursi workstation, sofa, atau armchair.
     * Saat duduk, tekan SPASI / tombol [BERDIRI] untuk berdiri kembali.
     * Seduh espresso segar di Pantry (mesin kopi).
     * Minum air mineral di dispenser.
     * Buka Papan Agenda To-Do List kantor.
3. Kustomisasi Karakter (Character Customizer):
   - Klik ikon pakaian di Dock bawah atau tombol 'Kustomisasi Karakter' di dashboard.
   - Kamu bisa memilih arketipe (Resident, Office Worker, Courier, Barista, Cook, Maintenance), warna rambut, pakaian, dan aksesori.
4. Perbedaan Public Lobby vs Private Company Office:
   - Public Lobby: Ruang eksplorasi publik terbuka. Siapa saja bisa masuk sebagai tamu (Guest) tanpa login untuk mencoba gerak, pakaian, dan fasilitas.
   - Private Company Office: Ruang kantor virtual berlisensi khusus perusahaan. Hanya dapat dimasuki setelah login dan memvalidasi Kode Akses Role Unik (Boss, Humas, Staff).
5. Kode Akses Role Perusahaan:
   - Kode Boss: Akses kantor virtual untuk pimpinan dengan wewenang monitoring tim di /leader.
   - Kode Humas: Akses PIC penghubung resmi perusahaan dengan platform.
   - Kode Staff: Akses meja kerja dedicated dan kolaborasi internal karyawan.
   - Diterbitkan langsung oleh Administrator platform (/x90x9admin).
6. Kolaborasi Realtime & Konferensi:
   - Kamera dan mikrofon (Google Meet style) dengan kontrol mute/unmute kapan saja.
   - Layar presentasi (Screen Sharing).
   - Reaksi emoji cepat di atas kepala karakter.
   - Obrolan chat bubble 2D antar rekan di kantor.
7. Sistem AFK & Istirahat:
   - Jika pengguna tidak bergerak selama 15 menit, avatar akan otomatis berjalan mandiri ke AFK Lounge dan status berubah menjadi Istirahat.

Instruksi Gaya Respon:
- Gunakan bahasa Indonesia santun, bersahabat, dan jelas.
- Berikan langkah-langkah praktis jika pengguna bertanya cara melakukan sesuatu.
- Jika ada hal yang belum didukung, jelaskan dengan jujur tanpa mengarang fitur yang tidak ada.`;

            let replyText = '';
            let usedModel = '';

            const apiKey = process.env.GEMINI_API_KEY;
            if (apiKey) {
              const { GoogleGenAI } = await import('@google/genai');
              const ai = new GoogleGenAI({ apiKey });

              const fallbackModels = [
                'gemini-2.5-flash',
                'gemini-2.0-flash',
                'gemini-1.5-flash',
                'gemini-flash-latest',
                'gemini-flash-lite-latest',
                'gemini-3.8-flash',
              ];

              for (const modelCandidate of fallbackModels) {
                try {
                  const aiResponse = await ai.models.generateContent({
                    model: modelCandidate,
                    contents: [
                      { role: 'user', parts: [{ text: `${systemInstruction}\n\nPertanyaan Pengguna: ${lastUserMsg}` }] }
                    ],
                  });

                  if (aiResponse && aiResponse.text) {
                    replyText = aiResponse.text.trim();
                    usedModel = modelCandidate;
                    break;
                  }
                } catch (candidateErr: any) {
                  // Fallback to next model
                }
              }
            }

            if (!replyText) {
              usedModel = 'local-neuro-rule-engine';
              const lower = (lastUserMsg || '').toLowerCase();
              if (lower.includes('jalan') || lower.includes('gerak') || lower.includes('kontrol') || lower.includes('analog')) {
                replyText = 'Untuk mengendalikan karakter di NEUROSIM PRO:\n- Di Desktop: Gunakan tombol keyboard WASD atau tombol Panah.\n- Di Mobile: Gunakan Virtual Analog Joystick di sudut kiri bawah layar.\nKamu juga bisa berjalan serong (diagonal) secara mulus!';
              } else if (lower.includes('duduk') || lower.includes('berdiri') || lower.includes('interaksi') || lower.includes('spasi')) {
                replyText = 'Untuk berinteraksi dengan kursi, meja kerja, mesin espresso, atau dispenser:\n- Di Desktop: Dekati objek dan tekan SPASI atau tombol [E].\n- Di Mobile: Sentuh tombol [AKSI] di kanan bawah.\n- Untuk berdiri dari kursi: Tekan SPASI atau sentuh tombol [BERDIRI]!';
              } else if (lower.includes('ganti karakter') || lower.includes('baju') || lower.includes('rambut') || lower.includes('penampilan')) {
                replyText = 'Kamu bisa mengubah karakter dan penampilan kapan saja:\n1. Klik ikon pakaian di Dock bawah atau tombol "Kustomisasi Karakter".\n2. Pilih arketipe (Office Worker, Resident, Courier, dll.).\n3. Sesuaikan gaya rambut, pakaian, dan warna.\n4. Klik Simpan untuk memperbarui tampilan karaktermu di kantor!';
              } else if (lower.includes('kode') || lower.includes('akses') || lower.includes('perusahaan') || lower.includes('masuk kantor')) {
                replyText = 'Untuk memasuki Private Company Office:\n1. Lakukan Login terlebih dahulu dengan akunmu.\n2. Buka menu "Enter Office" dan masukkan Kode Akses Role Unik yang diberikan Admin atau PIC Humas perusahaanmu (misal: Kode Boss, Kode Humas, atau Kode Staff).\n3. Sistem akan memvalidasi kode dan mengarahkanmu langsung ke ruang kerja kantormu!';
              } else if (lower.includes('kamera') || lower.includes('mic') || lower.includes('suara') || lower.includes('layar')) {
                replyText = 'Di NEUROSIM PRO, kamu bisa berkomunikasi langsung dengan rekan kerja:\n- Gunakan ikon Kamera dan Mikrofon di Dock bawah atau bar atas untuk mengaktifkan video conference.\n- Klik ikon Berbagi Layar (Screen Share) untuk mempresentasikan pekerjaanmu kepada rekan satu ruangan!';
              } else {
                replyText = `Halo! Saya NEURO AI Assistant. Saya siap memandu kamu di NEUROSIM PRO.
Kamu bisa bertanya seputar:
- Cara bergerak dan menggunakan analog mobile
- Cara duduk di workstation dan interaksi pantry
- Cara mengganti karakter & pakaian
- Perbedaan Public Lobby dan Private Company Office
- Cara menggunakan Kode Akses Perusahaan (Role Boss, Humas, Staff)
- Fitur kamera, mic, dan screen sharing

Ada yang ingin kamu ketahui lebih lanjut?`;
              }
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              reply: replyText,
              model: usedModel,
              timestamp: new Date().toISOString(),
            }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: err.message }));
          }
          return;
        }

        // 3. Endpoint Auth Register (MySQL)
        if (req.method === 'POST' && url === '/api/auth/register') {
          try {
            const body = await parseJsonBody(req);
            const { processRegister } = await import('./api/auth/register');
            const result = await processRegister(body);
            res.statusCode = result.success ? 200 : 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (err) {
            console.error('[Vite API] Error pada /api/auth/register:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: 'Server error saat register' }));
          }
          return;
        }

        // 4b. Endpoint Auth Verify JWT & Session
        if (req.method === 'POST' && url === '/api/auth/verify') {
          try {
            const authHeader = req.headers['authorization'];
            let token = '';
            if (authHeader && authHeader.startsWith('Bearer ')) {
              token = authHeader.substring(7);
            } else {
              const body = await parseJsonBody(req);
              token = body?.token || '';
            }

            const { verifyJwt } = await import('./src/lib/jwt');
            const verifyResult = verifyJwt(token);
            if (!verifyResult.valid || !verifyResult.payload) {
              res.statusCode = 401;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, message: verifyResult.error || 'Token tidak valid' }));
              return;
            }

            let freshUser = null;
            try {
              const { getDbPool } = await import('./src/lib/db');
              const pool = getDbPool();
              if (pool) {
                const [rows] = await pool.query(
                  `SELECT u.id, u.username, u.email, u.full_name, u.title, u.department, u.avatar,
                          u.reduce_motion, u.high_contrast, u.text_scale, u.org_id,
                          r.name as role_name, r.slug as role_slug
                   FROM users u
                   LEFT JOIN roles r ON u.role_id = r.id
                   WHERE u.id = ? LIMIT 1`,
                  [verifyResult.payload.id]
                );
                if (rows && rows.length > 0) {
                  const u = rows[0];
                  freshUser = {
                    id: u.id,
                    username: u.username,
                    email: u.email || `${u.username}@neurosimpro.com`,
                    fullName: u.full_name,
                    role: u.role_name || 'Employee / Member',
                    roleSlug: u.role_slug || 'employee',
                    department: u.department || 'Product & Engineering',
                    title: u.title || 'Staff Pengembang',
                    avatar: u.avatar || '/assets/characters/resident/standing/south.png',
                    orgId: u.org_id || 1,
                    reduceMotion: Boolean(u.reduce_motion),
                    highContrast: Boolean(u.high_contrast),
                    textScale: u.text_scale || 'normal',
                  };
                }
              }
            } catch (e) {
              // fallback
            }

            if (!freshUser) {
              const p = verifyResult.payload;
              freshUser = {
                id: p.id,
                username: p.username,
                email: p.email || `${p.username}@neurosimpro.com`,
                fullName: p.fullName || p.username,
                role: p.role || 'Employee / Member',
                roleSlug: p.roleSlug || 'employee',
                department: p.department || 'Divisi Antarmuka & Frontend',
                title: p.title || 'Staff Pengembang',
                avatar: '/assets/characters/resident/standing/south.png',
                orgId: p.orgId || 1,
                reduceMotion: false,
                highContrast: false,
                textScale: 'normal',
              };
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, user: freshUser, payload: verifyResult.payload }));
          } catch (err) {
            console.error('[Vite API] Error pada /api/auth/verify:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: 'Server error saat verifikasi token' }));
          }
          return;
        }

        // 4. Endpoint Auth Login (MySQL)
        if (req.method === 'POST' && url === '/api/auth/login') {
          try {
            const body = await parseJsonBody(req);
            const { processLogin } = await import('./api/auth/login');
            const result = await processLogin(body);
            res.statusCode = result.success ? 200 : 401;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result));
          } catch (err) {
            console.error('[Vite API] Error pada /api/auth/login:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: 'Server error saat login' }));
          }
          return;
        }

        next();
      });
    },
  };
}

function parseJsonBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: any) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const plugins = [react(), neurosimApiPlugin()];
if (isSslEnabled) {
  plugins.unshift(basicSsl());
}

export default defineConfig({
  plugins,
  server: {
    port: 3000,
    host: '0.0.0.0', // Buka akses jaringan eksternal & remote domain (duckdns)
    cors: true,
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
    cors: true,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    chunkSizeWarningLimit: 1200,
    cssCodeSplit: true,
    minify: 'esbuild',
    // Optimasi Pemisahan Kode (Code Splitting) untuk meringankan beban transfer peramban
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/phaser')) {
            return 'vendor-phaser';
          }
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/socket.io-client')) {
            return 'vendor-socket';
          }
          if (id.includes('node_modules/@google/genai') || id.includes('node_modules/zod')) {
            return 'vendor-ai';
          }
        },
      },
    },
  },
});
