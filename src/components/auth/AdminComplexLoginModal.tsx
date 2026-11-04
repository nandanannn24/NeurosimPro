import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Lock,
  Unlock,
  Terminal,
  Fingerprint,
  RefreshCw,
  Cpu,
  Server,
  AlertTriangle,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  Radio,
  FileCode,
} from 'lucide-react';
import { UserProfile } from '../modals/AuthModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  isDirectRoute?: boolean;
}

export const AdminComplexLoginModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  isDirectRoute = false,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [authStep, setAuthStep] = useState<string | null>(null);
  const [securityDeclaration, setSecurityDeclaration] = useState(false);
  const [cryptoHandshake, setCryptoHandshake] = useState(false);
  const [isHandshaking, setIsHandshaking] = useState(false);

  // Live Simulated Cryptographic Rolling TOTP Token
  const [rollingToken, setRollingToken] = useState('849-201');
  const [tokenCountdown, setTokenCountdown] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setTokenCountdown((prev) => {
        if (prev <= 1) {
          const part1 = Math.floor(100 + Math.random() * 900);
          const part2 = Math.floor(100 + Math.random() * 900);
          setRollingToken(`${part1}-${part2}`);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  const handleHandshake = () => {
    setIsHandshaking(true);
    setTimeout(() => {
      setIsHandshaking(false);
      setCryptoHandshake(true);
    }, 700);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUser = username.trim();
    if (!cleanUser || !password) {
      setErrorMessage('Identitas Administrator dan Kunci Enkripsi Master wajib diisi.');
      return;
    }

    if (!securityDeclaration) {
      setErrorMessage('Silakan setujui Deklarasi Akses Tingkat Kernel sebelum melanjutkan.');
      return;
    }

    setIsVerifying(true);
    setAuthStep('Menghubungkan ke Node Keamanan MySQL...');

    try {
      await new Promise((r) => setTimeout(r, 400));
      setAuthStep('Memverifikasi Hash Kunci Kernel & Izin Super Admin...');

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUser,
          password: password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        // Enforce Super Administrator clearance
        const isSuperAdmin =
          data.user.username.toLowerCase() === 'nandzzz' ||
          data.user.roleSlug === 'super_admin' ||
          data.user.role?.toLowerCase().includes('administrator');

        if (!isSuperAdmin) {
          setErrorMessage('AKSES DITOLAK: Akun terverifikasi tetapi tidak memiliki hak Super Administrator (Clearance Level 5).');
          setIsVerifying(false);
          setAuthStep(null);
          return;
        }

        setAuthStep('Menerbitkan Sesi Enkripsi Kernel Tingkat Tinggi...');
        await new Promise((r) => setTimeout(r, 450));

        // Save session locally
        try {
          localStorage.setItem('neurosim_current_user', JSON.stringify(data.user));
          localStorage.setItem('neurosim_admin_session_active', 'true');
        } catch (e) {
          console.warn('Storage sync warning:', e);
        }

        onSuccess(data.user);
      } else {
        setErrorMessage(data.message || 'Kredensial Administrator tidak sah. Percobaan akses telah dicatat ke audit log database.');
      }
    } catch {
      setErrorMessage('Koneksi ke endpoint otentikasi database MySQL terputus.');
    } finally {
      setIsVerifying(false);
      setAuthStep(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#030712]/90 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Decorative Matrix Background Scanline Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:32px_32px] opacity-20 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-teal-500/10 via-cyan-500/15 to-amber-500/10 blur-3xl pointer-events-none rounded-full" />

      {/* Main Complex Gateway Card */}
      <div className="relative z-10 w-full max-w-lg bg-[#070d19]/95 border-2 border-teal-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(20,184,166,0.15)] text-slate-100 space-y-6">
        {/* Top Security Status Bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-400">
              RESTRICTED KERNEL ACCESS • LEVEL 5
            </span>
          </div>

          {!isDirectRoute && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Tutup Gerbang"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Header Branding */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 via-cyan-500 to-amber-500 p-0.5 shadow-lg shadow-teal-500/20 mb-1">
            <div className="w-full h-full bg-[#070d19] rounded-[14px] flex items-center justify-center">
              <ShieldAlert className="w-7 h-7 text-teal-400" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white font-mono">
            NEUROSIM KERNEL GATEWAY
          </h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Gerbang autentikasi rahasia Administrator Sistem. Terhubung langsung dengan basis data <strong>MySQL neurosim_db</strong>.
          </p>
        </div>

        {/* Live Cryptographic Token Banner */}
        <div className="bg-[#0b1324] border border-teal-500/30 rounded-2xl p-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-teal-400 animate-pulse" />
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                Token Sinkronisasi Node
              </span>
              <span className="font-mono font-black text-teal-300 text-sm tracking-widest">
                {rollingToken}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400">
              Refresh: <strong className="text-amber-400">{tokenCountdown}s</strong>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              ACTIVE
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Auth Steps Banner */}
        {authStep && (
          <div className="p-3.5 rounded-xl bg-teal-950/50 border border-teal-500/40 text-teal-200 text-xs flex items-center gap-2.5 animate-in fade-in">
            <RefreshCw className="w-4 h-4 text-teal-400 animate-spin shrink-0" />
            <span className="font-mono">{authStep}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Identitas Administrator (Username / ID):
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoFocus
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="Masukkan username admin..."
                className="w-full bg-[#030712] border-2 border-slate-700 focus:border-teal-400 rounded-xl px-4 py-2.5 text-sm font-mono text-teal-300 placeholder:text-slate-600 focus:outline-none transition-all"
              />
              <Terminal className="w-4 h-4 text-slate-500 absolute right-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Kunci Enkripsi Master (Password):
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="Masukkan password admin..."
                className="w-full bg-[#030712] border-2 border-slate-700 focus:border-teal-400 rounded-xl px-4 py-2.5 text-sm font-mono text-teal-300 placeholder:text-slate-600 focus:outline-none transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors p-1"
                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Simulated Cryptographic Node Handshake */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Verifikasi Tanda Tangan Kriptografis:</span>
              <span
                className={`font-mono font-bold ${
                  cryptoHandshake ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {cryptoHandshake ? 'TERVERIFIKASI' : 'BELUM DIVERIFIKASI'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleHandshake}
              disabled={isHandshaking || cryptoHandshake}
              className={`w-full py-2 px-3 rounded-lg border flex items-center justify-center gap-2 font-mono text-xs font-semibold transition-all cursor-pointer ${
                cryptoHandshake
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950 border-teal-500/30 text-teal-300 hover:bg-slate-800'
              }`}
            >
              {isHandshaking ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400" />
                  <span>Memindai Hash Kriptografi Node...</span>
                </>
              ) : cryptoHandshake ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Kunci Node Tervalidasi</span>
                </>
              ) : (
                <>
                  <Fingerprint className="w-3.5 h-3.5 text-teal-400" />
                  <span>Lakukan Handshake Kriptografi Sensor</span>
                </>
              )}
            </button>
          </div>

          {/* Declaration Checkbox */}
          <label className="flex items-start gap-2.5 text-[11px] text-slate-400 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={securityDeclaration}
              onChange={(e) => setSecurityDeclaration(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 bg-slate-950 text-teal-500 focus:ring-teal-400 focus:ring-offset-0"
            />
            <span className="leading-snug select-none">
              Saya mengonfirmasi bahwa saya memiliki otorisasi penuh untuk mengakses Kernel Administrator Sistem NeuroSim Pro. Seluruh aksi dicatat ke <strong>activity_logs</strong> database MySQL.
            </span>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isVerifying || !username.trim() || !password || !securityDeclaration}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-400 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-teal-500/25 disabled:opacity-40 transition-all hover:scale-[1.01] cursor-pointer"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>MEMVALIDASI KERNEL...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>OTORISASI & MASUK KERNEL</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Security Watermark */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>PORT: 3306 • DB: MYSQL</span>
          <span>PROTOCOL: 90X9-ENC</span>
        </div>
      </div>
    </div>
  );
};

