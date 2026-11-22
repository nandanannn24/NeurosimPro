import React, { useState } from 'react';
import {
  Play,
  Shirt,
  ShieldCheck,
  Video,
  Users,
  Compass,
  ArrowRight,
  CheckCircle2,
  LogIn,
  Layers,
  Sparkles,
  Bot,
  Lock,
  Building,
  KeyRound,
  Gamepad2,
  Coffee,
  Check,
} from 'lucide-react';
import { UserProfile } from '../modals/AuthModal';
import { CharacterCustomization, CharacterDirection } from '../../types/character';
import { CharacterCanvasPreview } from '../character/CharacterCanvasPreview';

interface Props {
  currentUser: UserProfile | null;
  characterConfig: CharacterCustomization;
  onEnterDashboard: () => void;
  onEnterSimulation: () => void;
  onOpenCustomizer: () => void;
  onOpenAuth: () => void;
  onOpenAiGuide?: () => void;
  onOpenAdminLogin?: () => void;
}

export const LandingView: React.FC<Props> = ({
  currentUser,
  characterConfig,
  onEnterDashboard,
  onEnterSimulation,
  onOpenCustomizer,
  onOpenAuth,
  onOpenAiGuide,
  onOpenAdminLogin,
}) => {
  const [previewDirection, setPreviewDirection] = useState<CharacterDirection>('south');
  const [logoClicks, setLogoClicks] = useState(0);

  // Stealth 5-click on logo triggers hidden administrative gateway
  const handleLogoClick = () => {
    setLogoClicks((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        if (onOpenAdminLogin) onOpenAdminLogin();
        return 0;
      }
      return next;
    });
    setTimeout(() => {
      setLogoClicks(0);
    }, 2500);
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-sand/35 text-ink select-none flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="flex-shrink-0 flex items-center justify-between px-4 sm:px-8 py-3.5 bg-cream border-b border-[#d1c7b5] sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div
            onClick={handleLogoClick}
            title="NeuroSim Pro"
            className="w-9 h-9 rounded-lg overflow-hidden bg-cream border border-teal/30 flex items-center justify-center shadow-xs cursor-pointer select-none"
          >
            <img src="/logo.webp" alt="Logo NeuroSim Pro" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-ink block leading-tight font-serif">
                NeuroSim
              </span>
              <span className="text-xs font-black px-1.5 py-0.2 rounded bg-teal text-soft uppercase tracking-wider">
                PRO
              </span>
            </div>
            <span className="text-[11px] text-teal font-semibold block leading-tight">
              Virtual Office & Remote Collaboration Platform
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          {onOpenAiGuide && (
            <button
              type="button"
              onClick={onOpenAiGuide}
              className="px-3 py-1.5 rounded-lg border border-teal/40 bg-teal/10 hover:bg-teal/20 text-xs font-bold text-teal transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5 text-teal" />
              <span className="hidden sm:inline">Panduan AI</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenCustomizer}
            className="text-xs font-semibold text-ink hover:text-teal transition-colors px-3 py-1.5 rounded-lg border border-[#d1c7b5] bg-cream hover:bg-sand flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Shirt className="w-3.5 h-3.5 text-teal" />
            <span className="hidden md:inline">Kustomisasi Karakter</span>
          </button>

          {currentUser ? (
            <button
              type="button"
              onClick={onEnterDashboard}
              className="px-4 py-2 rounded-lg bg-teal hover:bg-teal-dark text-soft text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <span>Dashboard ({currentUser.fullName ? currentUser.fullName.split(' ')[0] : currentUser.username})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 rounded-lg border border-teal text-teal hover:bg-teal/10 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk Akun</span>
            </button>
          )}
        </div>
      </nav>

      {/* Hero Header Presentation */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-6 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal/10 border border-teal/20 text-teal text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Selamat Datang di Portal Virtual Office Terpadu</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-ink leading-tight font-serif tracking-tight">
          Pintu Masuk Ruang Kerja Digital{' '}
          <span className="text-teal underline decoration-ochre underline-offset-6">
            NEUROSIM PRO
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-ink-muted max-w-2xl mx-auto leading-relaxed">
          Silakan pilih mode masuk Anda di bawah. Jelajahi kantor virtual 2D secara instan sebagai Tamu,
          atau masuk ke Akun Organisasi untuk membuka Dashboard Workspace dan Kantor Perusahaan Anda.
        </p>
      </section>

      {/* 2 PRIMARY MODES SELECTION CARDS (TAMU VS MASUK AKUN) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* ======================================================== */}
          {/* MODE 1: MASUK SEBAGAI TAMU (PUBLIC LOBBY)                */}
          {/* ======================================================== */}
          <div className="lg:col-span-6 bg-cream border-2 border-teal/40 hover:border-teal rounded-2xl p-6 sm:p-7 shadow-md hover:shadow-xl transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-28 h-28 bg-teal/5 rounded-full pointer-events-none group-hover:scale-125 transition-transform" />

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal/15 text-teal text-[11px] font-bold tracking-wide uppercase">
                  <Gamepad2 className="w-3.5 h-3.5" />
                  Mode 1 · Eksplorasi Publik
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Tanpa Login
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-ink font-serif group-hover:text-teal transition-colors">
                  Masuk Sebagai Tamu
                </h2>
                <p className="text-xs text-ink-muted mt-1.5 leading-relaxed">
                  Jelajahi simulasi kantor virtual 2D secara instan tanpa perlu mendaftar atau memasukkan kata sandi.
                  Ideal untuk mencoba kontrol gameplay dan fitur interaktif.
                </p>
              </div>

              {/* Checklist Fitur Tamu */}
              <div className="space-y-2.5 pt-2 border-t border-[#d1c7b5]/60 text-xs text-ink">
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                  <span><strong>Eksplorasi Public Lobby:</strong> Jelajahi ruang terbuka kantor virtual bersama pengunjung lain.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                  <span><strong>Uji Kontrol Desktop & Mobile:</strong> Dukungan tombol WASD serta Virtual Analog Joystick mobile 360°.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                  <span><strong>Interaksi Workstation & Pantry:</strong> Coba sistem duduk 4 arah dan seduh kopi espresso di dapur.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-teal flex-shrink-0 mt-0.5" />
                  <span><strong>Panduan Cerdas NEURO AI:</strong> Asisten pintar Gemini AI siap menjawab cara bermain kapan saja.</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-[#d1c7b5]/80">
              <button
                type="button"
                onClick={onEnterSimulation}
                className="w-full py-3.5 px-5 rounded-xl bg-teal hover:bg-teal-dark text-soft font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Mulai Eksplorasi Public Lobby (Tamu)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <span className="block text-[11px] text-center text-ink-muted mt-2">
                Tidak memerlukan akun · Langsung masuk ke game 2D
              </span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* MODE 2: MASUK AKUN ORGANISASI (DASHBOARD & PRIVATE OFFICE) */}
          {/* ======================================================== */}
          <div className="lg:col-span-6 bg-cream border-2 border-[#b5aa94] hover:border-ochre rounded-2xl p-6 sm:p-7 shadow-md hover:shadow-xl transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-28 h-28 bg-ochre/10 rounded-full pointer-events-none group-hover:scale-125 transition-transform" />

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ochre/20 text-ochre text-[11px] font-bold tracking-wide uppercase">
                  <Building className="w-3.5 h-3.5" />
                  Mode 2 · Portal Organisasi
                </span>
                <span className="text-[11px] font-semibold text-teal bg-teal/10 px-2.5 py-0.5 rounded-full border border-teal/20">
                  Sesi Terverifikasi JWT
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-ink font-serif group-hover:text-ochre transition-colors">
                  Masuk Akun Perusahaan
                </h2>
                <p className="text-xs text-ink-muted mt-1.5 leading-relaxed">
                  Masuk dengan kredensial akun terdaftar untuk membuka <strong>Dashboard Workspace</strong> terpadu,
                  mengelola tugas kantor, dan memvalidasi akses ruang kantor berlisensi.
                </p>
              </div>

              {/* Checklist Fitur Akun */}
              <div className="space-y-2.5 pt-2 border-t border-[#d1c7b5]/60 text-xs text-ink">
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-ochre flex-shrink-0 mt-0.5" />
                  <span><strong>Dashboard Workspace Terpadu:</strong> Akses kartu ID anggota, status presensi, dan daftar ruangan kantor.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-ochre flex-shrink-0 mt-0.5" />
                  <span><strong>Validasi Kode Akses Role:</strong> Masuki Private Company Office dengan Kode Boss, Humas, atau Staff.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-ochre flex-shrink-0 mt-0.5" />
                  <span><strong>Agenda Kerja & To-Do List:</strong> Pantau dan perbarui progres tugas kantor harian tim secara sinkron.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-ochre flex-shrink-0 mt-0.5" />
                  <span><strong>WebRTC Video Conference:</strong> Konferensi video tim dengan breakout room & presentasi screen share.</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-[#d1c7b5]/80">
              {currentUser ? (
                <button
                  type="button"
                  onClick={onEnterDashboard}
                  className="w-full py-3.5 px-5 rounded-xl bg-teal hover:bg-teal-dark text-soft font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Lanjutkan ke Dashboard Workspace Anda</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="w-full py-3.5 px-5 rounded-xl bg-ochre hover:bg-[#b07d2c] text-ink font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk / Daftar Akun Organisasi</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <span className="block text-[11px] text-center text-ink-muted mt-2">
                {currentUser ? `Sedang aktif sebagai @${currentUser.username}` : 'Membuka modal autentikasi login / register'}
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* Character Preview & Quick Customization Strip */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-6 w-full">
        <div className="bg-cream border-2 border-[#b5aa94] rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-sand/60 rounded-xl border border-[#b5aa94] flex items-center justify-center p-1 overflow-hidden flex-shrink-0 shadow-inner">
              <CharacterCanvasPreview
                config={characterConfig}
                direction={previewDirection}
                onChangeDirection={setPreviewDirection}
                className="scale-90"
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal/15 text-teal uppercase">
                  Karakter Virtual Aktif
                </span>
                <span className="text-xs text-ink-muted">
                  {characterConfig.gender === 'male' ? 'Karyawan Pria' : 'Karyawan Wanita'}
                </span>
              </div>
              <h3 className="font-bold text-base text-ink">{characterConfig.name}</h3>
              <p className="text-xs text-ink-muted">
                Kustomisasi pakaian, warna kulit, dan rambut sebelum melangkah ke kantor virtual.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenCustomizer}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-sand hover:bg-[#d8ccb8] border border-[#b5aa94] text-xs font-bold text-ink transition-colors flex items-center justify-center gap-2 shadow-2xs cursor-pointer flex-shrink-0"
          >
            <Shirt className="w-4 h-4 text-teal" />
            <span>Kustomisasi Karakter</span>
          </button>
        </div>
      </section>

      {/* 4 Feature Pillars Grid */}
      <section className="bg-cream/80 border-y border-[#d1c7b5] py-12 px-4 sm:px-6 mt-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-teal tracking-wider uppercase">
              Infrastruktur & Fitur Terintegrasi
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-ink font-serif">
              Solusi Lengkap Ruang Kerja Virtual & Kolaborasi Tim
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted">
              Dirancang dengan standar performa tinggi, kestabilan jaringan realtime, dan kenyamanan visual
              untuk produktivitas kerja jarak jauh harian.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-xl bg-sand/40 border border-[#d1c7b5] flex flex-col space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-teal text-soft flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-ink">Kantor 2D Interaktif</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Workstation Utama, Ruang Rapat, Ruang Eksekutif, Pantry, dan AFK Lounge dengan navigasi mulus.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-sand/40 border border-[#d1c7b5] flex flex-col space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-teal text-soft flex items-center justify-center">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-ink">WebRTC Video Conference</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Konferensi video Zoom/Meet style di atas layar game, kontrol kamera & mikrofon, dan screen sharing.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-sand/40 border border-[#d1c7b5] flex flex-col space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-teal text-soft flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-ink">Kode Akses Perusahaan</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Private Company Office diproteksi kode role unik (Boss, Humas, Staff) yang terhubung ke billing & server.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-sand/40 border border-[#d1c7b5] flex flex-col space-y-3 shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-teal text-soft flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-ink">NEURO AI Assistant</h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Asisten cerdas Gemini AI siap memandu kontrol mobile, cara interaksi kursi, dan fasilitas kantor 24/7.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="mt-auto px-6 py-6 bg-cream border-t border-[#d1c7b5] text-xs text-ink-muted">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal" />
            <span className="font-bold text-ink font-serif">
              NEUROSIM PRO
            </span>
            <span className="text-[11px] text-ink-muted">
              — Virtual Office Simulation & Remote Collaboration Platform
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span>Hak Cipta Dilindungi © 2026</span>
            <span>·</span>
            <span>Berbasis Web & Standar Open Standards</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
