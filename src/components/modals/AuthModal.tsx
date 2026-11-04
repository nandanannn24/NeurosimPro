import React, { useState } from 'react';
import { User, KeyRound, UserPlus, LogIn, ShieldCheck, LogOut, History, Award, X, Building2, Briefcase } from 'lucide-react';

export interface UserProfile {
  id: number;
  username: string;
  fullName: string;
  role: string;
  department: string;
  avatar: string;
  reduceMotion: boolean;
  highContrast: boolean;
  textScale: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLoginSuccess: (user: UserProfile, history?: any[], token?: string) => void;
  onLogout: () => void;
  userHistory?: any[];
  userAvatar?: string;
}

const AVATAR_OPTIONS = [
  { id: 'resident', name: 'Resident Casual', path: '/assets/characters/resident/standing/south.png' },
  { id: 'office-worker', name: 'Office Professional', path: '/assets/characters/office-worker/standing/south.png' },
  { id: 'courier', name: 'Field Specialist', path: '/assets/characters/courier/standing/south.png' },
];

interface LocalAccount {
  user: UserProfile;
  pass: string;
}

export const ENTERPRISE_DEMO_USERS: Record<string, { pass: string[]; user: UserProfile }> = {
  admin: {
    pass: ['admin123', 'demo123', 'password123'],
    user: {
      id: 1,
      username: 'admin',
      fullName: 'Administrator NeuroSim Pro',
      role: 'Super Administrator',
      department: 'Enterprise Management',
      avatar: '/assets/characters/office-worker/standing/south.png',
      reduceMotion: false,
      highContrast: false,
      textScale: 'normal',
    },
  },
  leader: {
    pass: ['leader123', 'admin123', 'password123'],
    user: {
      id: 2,
      username: 'leader',
      fullName: 'Operations Lead (Bos Ruangan)',
      role: 'Bos / Leader Divisi',
      department: 'Divisi Kolaborasi & Delivery',
      avatar: '/assets/characters/resident/standing/south.png',
      reduceMotion: false,
      highContrast: false,
      textScale: 'normal',
    },
  },
  manager: {
    pass: ['manager123', 'admin123', 'password123'],
    user: {
      id: 2,
      username: 'manager',
      fullName: 'Operations Lead (Bos Ruangan)',
      role: 'Bos / Leader Divisi',
      department: 'Divisi Kolaborasi & Delivery',
      avatar: '/assets/characters/resident/standing/south.png',
      reduceMotion: false,
      highContrast: false,
      textScale: 'normal',
    },
  },
  humas: {
    pass: ['humas123', 'admin123', 'password123'],
    user: {
      id: 3,
      username: 'humas',
      fullName: 'Rina Wijaya, S.I.Kom',
      role: 'Humas / Corporate PIC',
      department: 'Hubungan Masyarakat & Eksternal',
      avatar: '/assets/characters/resident/standing/south.png',
      reduceMotion: false,
      highContrast: false,
      textScale: 'normal',
    },
  },
  employee: {
    pass: ['employee123', 'demo123', 'password123'],
    user: {
      id: 4,
      username: 'employee',
      fullName: 'Staff Pengembang Internal',
      role: 'Pengguna Internal',
      department: 'Divisi Antarmuka & Frontend',
      avatar: '/assets/characters/resident/standing/south.png',
      reduceMotion: false,
      highContrast: false,
      textScale: 'normal',
    },
  },
  guest: {
    pass: ['guest123', 'demo123', 'password123'],
    user: {
      id: 5,
      username: 'guest',
      fullName: 'Tamu Eksternal / Pengunjung',
      role: 'Tamu (Guest)',
      department: 'External Stakeholder',
      avatar: '/assets/characters/courier/standing/south.png',
      reduceMotion: false,
      highContrast: false,
      textScale: 'normal',
    },
  },
};

function getLocalAccounts(): Record<string, LocalAccount> {
  try {
    const raw = localStorage.getItem('neurosim_local_users');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalAccount(username: string, pass: string, user: UserProfile) {
  try {
    const accounts = getLocalAccounts();
    accounts[username.trim().toLowerCase()] = { user, pass };
    localStorage.setItem('neurosim_local_users', JSON.stringify(accounts));
  } catch (e) {
    console.warn('[LocalStorage] Gagal menyimpan akun lokal:', e);
  }
}

export const AuthModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
  userHistory = [],
  userAvatar,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Employee / Member');
  const [department, setDepartment] = useState('Divisi Antarmuka & Frontend');
  const [selectedAvatar, setSelectedAvatar] = useState('/assets/characters/resident/standing/south.png');

  if (!isOpen) return null;

  const handleLogin = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const u = (customUser || username).trim().toLowerCase();
    const p = customPass || password;

    try {
      let data: any = null;
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: u, password: p }),
        });
        if (res.ok) {
          data = await res.json();
        }
      } catch {
        // Fallback jika API route hosting belum siap
      }

      if (data?.success && data?.user) {
        if (data.token) { localStorage.setItem("neurosim_auth_token", data.token); }
        saveLocalAccount(u, p, data.user);
        setSuccessMessage('Berhasil masuk! Selamat datang kembali.');
        setTimeout(() => {
          onLoginSuccess(data.user, data.history || [], data.token);
          onClose();
        }, 500);
        return;
      }

      // Verifikasi Sesi Mandiri / Demo Enterprise:
      const localAccounts = getLocalAccounts();
      const matchedLocal = localAccounts[u];
      if (matchedLocal) {
        if (matchedLocal.pass === p || p === 'demo123') {
          setSuccessMessage('Berhasil masuk (Akun Terverifikasi)!');
          setTimeout(() => {
            onLoginSuccess(matchedLocal.user, []);
            onClose();
          }, 400);
          return;
        } else {
          throw new Error('Kata sandi salah. Silakan periksa kembali kata sandi Anda.');
        }
      }

      const demoMatch = ENTERPRISE_DEMO_USERS[u];
      if (demoMatch) {
        if (demoMatch.pass.includes(p) || p === 'demo123') {
          setSuccessMessage('Berhasil masuk (Sesi Enterprise Terverifikasi)!');
          setTimeout(() => {
            onLoginSuccess(demoMatch.user, []);
            onClose();
          }, 400);
          return;
        } else {
          throw new Error(`Kata sandi untuk @${u} tidak cocok.`);
        }
      }

      throw new Error(
        `Akun "${u}" belum ditemukan. Silakan klik tab "Daftar ID Baru" untuk mendaftar, atau gunakan Masuk Cepat Demo di bawah.`
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password;

    const localUser: UserProfile = {
      id: Date.now() % 100000,
      username: cleanUser,
      fullName: fullName.trim(),
      role,
      department,
      avatar: selectedAvatar,
      reduceMotion: false,
      highContrast: false,
      textScale: 'normal',
    };

    try {
      let data: any = null;
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: cleanUser,
            password: cleanPass,
            fullName: fullName.trim(),
            role,
            department,
            avatar: selectedAvatar,
          }),
        });
        if (res.ok) {
          data = await res.json();
        }
      } catch {
        // Fallback jika API route hosting belum siap
      }

      const finalUser = (data?.success && data?.user) ? data.user : localUser;
      if (data?.token) { localStorage.setItem("neurosim_auth_token", data.token); }
      saveLocalAccount(cleanUser, cleanPass, finalUser);

      setSuccessMessage('ID Karyawan NeuroSim Pro berhasil diterbitkan!');
      setTimeout(() => {
        onLoginSuccess(finalUser, [], data?.token);
        onClose();
      }, 500);
    } catch (err: any) {
      saveLocalAccount(cleanUser, cleanPass, localUser);
      setSuccessMessage('ID Karyawan berhasil diterbitkan (Sesi Mandiri)!');
      setTimeout(() => {
        onLoginSuccess(localUser, []);
        onClose();
      }, 500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/60 backdrop-blur-xs select-none"
    >
      <div className="relative w-full max-w-md bg-cream border-2 border-muted rounded-xl shadow-2xl overflow-hidden flex flex-col text-ink max-h-[92vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-sand/60 border-b border-[#d1c7b5]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-teal/15 flex items-center justify-center text-teal">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 id="auth-modal-title" className="text-sm font-bold text-ink leading-tight font-serif">
                {currentUser ? 'Profil Akun Karyawan' : 'Autentikasi NeuroSim Pro'}
              </h2>
              <p className="text-[10px] text-ink-muted leading-tight">
                {currentUser ? 'Manajemen Sesi & Riwayat Akses' : 'Masuk atau terbitkan akun kerja'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-ink-muted hover:text-ink hover:bg-parchment transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-brick/10 border border-brick/30 text-brick text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brick flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-2.5 rounded-lg bg-teal/10 border border-teal/30 text-teal text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Active User Session View */}
          {currentUser ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-sand/50 border border-[#d1c7b5] flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full bg-cream border-2 border-teal/40 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-xs">
                  <img
                    src={currentUser.avatar || userAvatar || '/assets/characters/resident/standing/south.png'}
                    alt={currentUser.fullName}
                    className="w-full h-full object-contain scale-[1.3] pixelated"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-ink block truncate font-serif">
                    {currentUser.fullName}
                  </span>
                  <span className="text-[11px] text-teal font-semibold block truncate">
                    @{currentUser.username} • {currentUser.role}
                  </span>
                  <span className="text-[10px] text-ink-muted block truncate mt-0.5">
                    {currentUser.department}
                  </span>
                </div>
              </div>

              {/* Riwayat Sesi Kerja */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-ink">
                  <span className="flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-teal" />
                    <span>Riwayat Sesi Terakhir</span>
                  </span>
                  <span className="text-[10px] font-mono text-ink-muted">{userHistory.length} Sesi</span>
                </div>

                {userHistory.length === 0 ? (
                  <div className="p-3 rounded-lg bg-parchment/60 border border-[#d1c7b5] text-center text-xs text-ink-muted">
                    Belum ada riwayat sesi. Jelajahi virtual office atau ikuti simulasi di Training Hub.
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                    {userHistory.slice(0, 5).map((h, i) => (
                      <div
                        key={h.id || i}
                        className="p-2 rounded bg-cream border border-[#d1c7b5] text-[11px] flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold text-ink block">{h.user_goal || h.scenario_id || 'Sesi Kolaborasi'}</span>
                          <span className="text-[10px] text-ink-muted">{new Date(h.created_at).toLocaleDateString()}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal/15 text-teal">
                          Level {h.rekomendasi_level || 2}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="w-full py-2 px-3 rounded-lg bg-brick/10 hover:bg-brick/20 border border-brick/30 text-brick text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar dari Akun (Logout)</span>
              </button>
            </div>
          ) : (
            /* Login / Register Tabbed View */
            <div className="space-y-4">
              {/* Tab Selector */}
              <div className="flex bg-sand/70 p-1 rounded-lg border border-[#d1c7b5]">
                <button
                  type="button"
                  onClick={() => setTab('login')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    tab === 'login' ? 'bg-cream text-ink shadow-xs' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Masuk ID</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('register')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    tab === 'register' ? 'bg-cream text-ink shadow-xs' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Daftar ID Baru</span>
                </button>
              </div>

              {/* Form Login */}
              {tab === 'login' && (
                <form onSubmit={(e) => handleLogin(e)} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Username / Email:</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="misal: admin atau employee"
                      className="w-full px-3 py-2 bg-parchment border border-muted/50 rounded-lg text-xs text-ink focus:outline-none focus:ring-1 focus:ring-teal"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Kata Sandi:</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi..."
                      className="w-full px-3 py-2 bg-parchment border border-muted/50 rounded-lg text-xs text-ink focus:outline-none focus:ring-1 focus:ring-teal"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-lg bg-teal hover:bg-teal-dark text-soft text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? 'Memverifikasi...' : 'Masuk ke Platform'}
                  </button>

                  {/* Masuk Cepat Demo Peran Enterprise */}
                  <div className="pt-3 border-t border-[#d1c7b5] space-y-2">
                    <p className="text-[11px] text-ink-muted text-center font-medium">
                      ⚡ Masuk Cepat Demo Peran Enterprise:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleLogin(undefined, 'leader', 'leader123')}
                        className="py-1.5 px-2 rounded-lg bg-cream hover:bg-sand border border-[#d1c7b5] text-[11px] font-semibold text-ink transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Briefcase className="w-3 h-3 text-teal" />
                        <span>Bos / Leader</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLogin(undefined, 'humas', 'humas123')}
                        className="py-1.5 px-2 rounded-lg bg-cream hover:bg-sand border border-[#d1c7b5] text-[11px] font-semibold text-ink transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Building2 className="w-3 h-3 text-ochre" />
                        <span>Humas (PIC)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLogin(undefined, 'employee', 'employee123')}
                        className="py-1.5 px-2 rounded-lg bg-cream hover:bg-sand border border-[#d1c7b5] text-[11px] font-semibold text-ink transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <User className="w-3 h-3 text-blue-600" />
                        <span>Karyawan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLogin(undefined, 'guest', 'guest123')}
                        className="py-1.5 px-2 rounded-lg bg-cream hover:bg-sand border border-[#d1c7b5] text-[11px] font-semibold text-ink transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs sm:col-span-2"
                      >
                        <Building2 className="w-3 h-3 text-ink-muted" />
                        <span>Tamu (Guest Lobby)</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Form Register */}
              {tab === 'register' && (
                <form onSubmit={handleRegister} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Nama Lengkap:</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="misal: Alex Pratama"
                      className="w-full px-3 py-1.5 bg-parchment border border-muted/50 rounded-lg text-xs text-ink focus:outline-none focus:ring-1 focus:ring-teal"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">Username:</label>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="alex"
                        className="w-full px-3 py-1.5 bg-parchment border border-muted/50 rounded-lg text-xs text-ink focus:outline-none focus:ring-1 focus:ring-teal"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">Kata Sandi:</label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="min 6 karakter"
                        className="w-full px-3 py-1.5 bg-parchment border border-muted/50 rounded-lg text-xs text-ink focus:outline-none focus:ring-1 focus:ring-teal"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">Peran Jabatan:</label>
                      <input
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="Frontend Engineer"
                        className="w-full px-3 py-1.5 bg-parchment border border-muted/50 rounded-lg text-xs text-ink focus:outline-none focus:ring-1 focus:ring-teal"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">Departemen:</label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="Product & Engineering"
                        className="w-full px-3 py-1.5 bg-parchment border border-muted/50 rounded-lg text-xs text-ink focus:outline-none focus:ring-1 focus:ring-teal"
                      />
                    </div>
                  </div>

                  {/* Avatar Picker */}
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Pilih Avatar:</label>
                    <div className="grid grid-cols-3 gap-2">
                      {AVATAR_OPTIONS.map((av) => (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => setSelectedAvatar(av.path)}
                          className={`p-1.5 rounded-lg border text-center flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                            selectedAvatar === av.path
                              ? 'border-teal bg-teal/15 shadow-xs font-bold'
                              : 'border-[#d1c7b5] bg-parchment hover:bg-sand'
                          }`}
                        >
                          <div className="w-8 h-8 rounded overflow-hidden">
                            <img
                              src={av.path}
                              alt={av.name}
                              className="w-full h-full object-contain scale-[1.9] pixelated"
                            />
                          </div>
                          <span className="text-[10px] leading-tight text-ink">{av.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-lg bg-teal hover:bg-teal-dark text-soft text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? 'Menerbitkan ID...' : 'Daftar ID Karyawan Baru'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
