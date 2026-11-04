import React, { useState } from 'react';
import {
  Building2,
  Key,
  Lock,
  ArrowRight,
  ShieldCheck,
  Phone,
  Mail,
  Users,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  Coffee,
  Sparkles,
} from 'lucide-react';
import { UserProfile } from '../modals/AuthModal';

interface Props {
  currentUser: UserProfile | null;
  onNavigateHome: () => void;
  onOpenAuth: () => void;
  onEnterSimulationWithKey: (lobbyId: string, billingKey: string) => void;
}

export const GuestLobbyView: React.FC<Props> = ({
  currentUser,
  onNavigateHome,
  onOpenAuth,
  onEnterSimulationWithKey,
}) => {
  const [selectedLobbyId, setSelectedLobbyId] = useState('LOBBY-01');
  const [inputKey, setInputKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const LOBBY_OPTIONS = [
    { id: 'LOBBY-01', name: 'PT Inovasi Digital Nusantara (Kantor Pusat)', humas: 'Rina Wijaya (+62 812-8889-1001)' },
    { id: 'LOBBY-02', name: 'PT Nusantara Teknologi Mandiri (Divisi Engineering)', humas: 'Dimas Pratama (+62 813-7722-4411)' },
    { id: 'LOBBY-03', name: 'PT Kreatif Media Digital (Divisi Product & Design)', humas: 'Sheila Amanda (+62 811-9988-3322)' },
    { id: 'LOBBY-04', name: 'PT Solusi Awan Kolaborasi (Remote Global)', humas: 'Fajar Nugroho (+62 856-1122-3344)' },
    { id: 'LOBBY-05', name: 'PT Ventura Kapital Asia (Eksekutif & Klien)', humas: 'Amanda Valerie (+62 812-9900-5566)' },
  ];

  const handleValidateAndEnter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!inputKey.trim()) {
      setErrorMessage('Silakan masukkan Billing Access Key yang Anda miliki.');
      return;
    }

    setIsValidating(true);
    try {
      const res = await fetch('/api/lobbies/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lobbyId: selectedLobbyId,
          billingKey: inputKey.trim(),
        }),
      });
      const data = await res.json();
      if (data.valid) {
        setSuccessMessage('Billing key valid! Mengarahkan Anda ke ruang kantor perusahaan...');
        setTimeout(() => {
          onEnterSimulationWithKey(selectedLobbyId, inputKey.trim());
        }, 800);
      } else {
        setErrorMessage(data.message || 'Billing key tidak valid atau sesi sudah berakhir.');
      }
    } catch {
      setErrorMessage('Terjadi kesalahan saat memeriksa kunci akses.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-sand/30 text-ink select-none flex flex-col justify-between">
      {/* Top Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-3.5 bg-cream border-b border-[#d1c7b5] sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateHome}
            className="p-1.5 rounded-lg border border-[#d1c7b5] hover:bg-sand/70 text-ink transition-colors cursor-pointer"
            title="Kembali ke Dashboard Utama"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-cream border border-teal/40 flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5 text-teal" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-ink font-serif">Lobby Tamu & Pengunjung</span>
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-700 text-soft uppercase tracking-wider">
                  GUEST LOBBY
                </span>
              </div>
              <span className="text-[10px] text-ink-muted block leading-tight">
                Ruang tunggu resmi pengunjung eksternal NeuroSim Pro
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAuth}
          className="px-3.5 py-1.5 rounded-lg border border-teal text-teal hover:bg-teal/10 text-xs font-bold transition-colors cursor-pointer"
        >
          {currentUser ? `Masuk sebagai @${currentUser.username}` : 'Masuk Akun Karyawan'}
        </button>
      </header>

      {/* Main Guest Portal Card */}
      <main className="max-w-4xl w-full mx-auto p-4 sm:p-6 my-auto space-y-6">
        <div className="bg-cream border-2 border-[#b5aa94] rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold text-teal uppercase tracking-wider bg-teal/10 px-3 py-1 rounded-full border border-teal/20 inline-block">
              Selamat Datang di NeuroSim Pro
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-ink font-serif tracking-tight">
              Lobby Kunjungan & Registrasi Akses
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
              Sebagai tamu eksternal, Anda berada di lobby penerimaan tamu. Untuk memasuki ruang kerja kantor perusahaan tertentu, silakan masukkan <strong>Billing Access Key</strong> yang diberikan oleh pihak Humas (PIC) perusahaan.
            </p>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-brick/10 border border-brick/30 text-brick text-xs flex items-center gap-2 max-w-xl mx-auto">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2 max-w-xl mx-auto">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Key Entry Form */}
          <form onSubmit={handleValidateAndEnter} className="max-w-xl mx-auto space-y-4">
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                Pilih Kantor Perusahaan Tujuan:
              </label>
              <select
                value={selectedLobbyId}
                onChange={(e) => setSelectedLobbyId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-parchment border border-[#d1c7b5] text-xs text-ink focus:outline-teal font-medium"
              >
                {LOBBY_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.id} — {opt.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                Billing Access Key Ruangan:
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="Contoh: BILL-IDN-2026-HQ"
                  className="w-full p-3 rounded-xl bg-parchment border border-[#d1c7b5] text-sm font-mono text-ink uppercase tracking-wider focus:outline-teal pl-9"
                />
                <Key className="w-4 h-4 text-ink-muted absolute left-3 top-3.5" />
              </div>
              <p className="text-[11px] text-ink-muted mt-1">
                Kunci akses diberikan oleh PIC Humas atau host meeting Anda.
              </p>
            </div>

            <button
              type="submit"
              disabled={isValidating}
              className="w-full py-3 rounded-xl bg-teal hover:bg-teal-dark text-soft font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>{isValidating ? 'Memeriksa Kunci Akses...' : 'Validasi Kunci & Masuk Ruang Kantor'}</span>
            </button>
          </form>

          {/* Humas Contact Directory for Assistance */}
          <div className="pt-6 border-t border-[#d1c7b5] max-w-xl mx-auto space-y-3">
            <h4 className="text-xs font-bold text-ink flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-teal" />
              <span>Belum Memiliki Kunci Akses? Hubungi Kontak Humas (PIC):</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-sand/40 border border-[#d1c7b5] space-y-1">
                <span className="font-bold text-ink block">PT Inovasi Digital Nusantara</span>
                <span className="text-[11px] text-teal font-semibold block">Rina Wijaya (Humas PIC)</span>
                <span className="text-[10.5px] text-ink-muted font-mono block">+62 812-8889-1001</span>
              </div>

              <div className="p-3 rounded-xl bg-sand/40 border border-[#d1c7b5] space-y-1">
                <span className="font-bold text-ink block">PT Nusantara Teknologi Mandiri</span>
                <span className="text-[11px] text-teal font-semibold block">Dimas Pratama (PIC Teknis)</span>
                <span className="text-[10.5px] text-ink-muted font-mono block">+62 813-7722-4411</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-ink-muted border-t border-[#d1c7b5]/60 bg-cream/40">
        NeuroSim Pro Virtual Office • Sistem Akses & Keamanan Komersial Berbasis Billing Key
      </footer>
    </div>
  );
};

