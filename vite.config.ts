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

        // 3. Endpoint Admin Billing Sessions
        if (req.method === 'GET' && url === '/api/admin/billing') {
          try {
            const sessions = lobbyStore.getBillingSessions();
            const lobbies = lobbyStore.getLobbies();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, sessions, lobbies }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: err.message }));
          }
          return;
        }

        // 4. Endpoint Admin Update Billing & Lobby Allocation
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

        // 5. Endpoint Admin Generate Billing Key
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

        // 6. Endpoint Seats Occupancy
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
