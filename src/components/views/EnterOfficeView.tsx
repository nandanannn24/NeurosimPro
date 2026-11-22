import React, { useState } from 'react';
import {
  Building2,
  Key,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock,
  Phone,
  Mail,
  UserCheck,
  Bot,
  Crown,
  Megaphone,
  Briefcase,
  Layers,
} from 'lucide-react';
import { UserProfile } from '../modals/AuthModal';
import { CompanyAccessCode, CompanyRecord, LobbyBracket } from '../../types/lobby';

interface Props {
  currentUser: UserProfile | null;
  onNavigateHome: () => void;
  onOpenAuth: () => void;
  onOpenAiGuide: () => void;
  onExplorePublicLobby: () => void;
  onEnterCompanyOffice: (data: {
    accessCode: CompanyAccessCode;
    company: CompanyRecord;
    lobby: LobbyBracket;
  }) => void;
}

export const EnterOfficeView: React.FC<Props> = ({
  currentUser,
  onNavigateHome,
  onOpenAuth,
  onOpenAiGuide,
  onExplorePublicLobby,
  onEnterCompanyOffice,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validatedData, setValidatedData] = useState<{
    accessCode: CompanyAccessCode;
    company: CompanyRecord;
    lobby: LobbyBracket;
  } | null>(null);

  // Quick Demo Code Shortcuts for easier testing and onboarding
  const SAMPLE_CODES = [
    { label: 'Kode Boss (PT IDN)', code: 'IDN-BOSS-8821', role: 'Boss' },
    { label: 'Kode Humas (PT IDN)', code: 'IDN-HUMAS-4412', role: 'Humas' },
    { label: 'Kode Staff (PT IDN)', code: 'IDN-STAFF-1092', role: 'Staff' },
    { label: 'Kode Staff AI (PT NTM)', code: 'NTM-STAFF-6612', role: 'Staff' },
  ];

  const handleValidate = async (codeToTest?: string) => {
    const code = (codeToTest || inputCode).trim().toUpperCase();
    setErrorMessage(null);
    setValidatedData(null);

    if (!code) {
      setErrorMessage('Silakan masukkan Kode Akses Perusahaan yang Anda miliki.');
      return;
    }

    setIsValidating(true);
    try {
      const res = await fetch('/api/access-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      if (res.ok && data.valid && data.accessCode) {
        setValidatedData({
          accessCode: data.accessCode,
          company: data.company,
          lobby: data.lobby,
        });
      } else {
        setErrorMessage(data.message || 'Kode akses tidak valid atau tidak ditemukan.');
      }
    } catch {
      setErrorMessage('Terjadi kesalahan jaringan saat memvalidasi kode ke server.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleProceedToOffice = () => {
    if (!validatedData) return;
    onEnterCompanyOffice(validatedData);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'boss':
        return {
          icon: Crown,
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          title: 'Boss / Pimpinan Eksekutif',
          desc: 'Memiliki wewenang kepemimpinan dan akses dashboard pemantauan pimpinan di /leader.',
        };
      case 'humas':
        return {
          icon: Megaphone,
          bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          title: 'Humas / Corporate Affairs PIC',
          desc: 'Penghubung resmi perusahaan dengan platform dan penanggung jawab perizinan room.',
        };
      default:
        return {
          icon: Briefcase,
          bg: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
          title: 'Staff Internal Perusahaan',
          desc: 'Akses penuh ke 20 workstation dedicated, ruang rapat, pantry, dan kolaborasi tim.',
        };
    }
  };

  return (
    <div className="w-full min-h-full bg-[#0a0d14] text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-y-auto">
      {/* Decorative Cyber Background Glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-r from-teal-500/10 via-cyan-500/10 to-amber-500/10 blur-3xl pointer-events-none rounded-full" />

      {/* Top Navigation Bar */}
      <div className="relative z-10 max-w-5xl mx-auto w-full flex items-center justify-between py-2 border-b border-slate-800/80 mb-6">
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenAiGuide}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-teal-500/30 text-teal-300 hover:bg-slate-800 transition-all shadow-sm"
          >
            <Bot className="w-3.5 h-3.5 text-teal-400" />
            <span>Tanya NEURO AI</span>
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-medium">@{currentUser.username}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/40 hover:bg-teal-500/30 transition-all"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Login Akun</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Form Center Box */}
      <div className="relative z-10 max-w-xl mx-auto w-full my-auto py-4">
        <div className="bg-[#0f172a]/95 border-2 border-teal-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Header Card */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-600 text-slate-950 mb-3 shadow-lg shadow-teal-500/30 border border-teal-200">
              <Key className="w-7 h-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Enter Private Company Office
            </h1>
            <p className="text-sm text-slate-400 mt-1.5 max-w-md mx-auto">
              Masukkan <strong>Role-Based Access Code</strong> yang diterbitkan Admin atau PIC Humas perusahaan Anda untuk memasuki ruang kerja virtual resmi.
            </p>
          </div>

          {/* Form Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleValidate();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Kode Akses Perusahaan (Role Code)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value.toUpperCase());
                    setErrorMessage(null);
                  }}
                  placeholder="Contoh: IDN-BOSS-8821 atau IDN-STAFF-1092"
                  className="w-full bg-slate-950 border-2 border-slate-700 focus:border-teal-400 rounded-xl px-4 py-3 text-base font-mono font-bold tracking-wider text-teal-300 placeholder:text-slate-600 focus:outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={isValidating || !inputCode.trim()}
                  className="absolute right-2 top-2 bottom-2 px-4 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-40 transition-all shadow-md"
                >
                  {isValidating ? 'Memeriksa...' : 'Validasi'}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {/* Validation Success Card */}
            {validatedData && (
              <div className="p-5 rounded-2xl bg-teal-950/40 border border-teal-500/50 space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2 text-teal-300 text-xs font-bold font-mono">
                  <CheckCircle2 className="w-4 h-4 text-teal-400" />
                  <span>KODE TERVERIFIKASI & AKTIF</span>
                </div>

                <div className="space-y-2 border-t border-teal-500/20 pt-3">
                  <div className="flex justify-between items-start text-xs">
                    <span className="text-slate-400">Perusahaan:</span>
                    <span className="font-bold text-white text-right">{validatedData.company.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Ruangan Kantor:</span>
                    <span className="font-mono text-teal-300">{validatedData.lobby.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Hak Akses / Role:</span>
                    <span className={`px-2 py-0.5 rounded font-bold font-mono text-[11px] border ${getRoleBadge(validatedData.accessCode.role).bg}`}>
                      {validatedData.accessCode.roleName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Batas Kapasitas:</span>
                    <span className="text-slate-200">20 Workstation Dedicated</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <p>{getRoleBadge(validatedData.accessCode.role).desc}</p>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToOffice}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-teal-500/30 transition-all hover:scale-[1.01]"
                >
                  <span>Masuk ke Kantor Virtual Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </form>

          {/* Quick Demo Code helper chips */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <p className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              Pilihan Cepat Kode Akses Demo Mitra:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SAMPLE_CODES.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputCode(s.code);
                    handleValidate(s.code);
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-left bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/40 transition-all"
                >
                  <div className="text-[10px] text-slate-400 truncate">{s.label}</div>
                  <div className="text-xs font-mono font-bold text-teal-300">{s.code}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Guest Public Lobby Alternative */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Belum memiliki kode akses perusahaan?
            </p>
            <button
              type="button"
              onClick={onExplorePublicLobby}
              className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 hover:text-teal-300 underline underline-offset-4 transition-colors"
            >
              <span>Jelajahi Public Lobby gratis sebagai Tamu (Guest)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 max-w-xl mx-auto w-full text-center py-2 text-xs text-slate-500">
        Keamanan Multi-Tenant NEUROSIM PRO • Terhubung langsung dengan Server Bracket & Billing Session
      </div>
    </div>
  );
};

