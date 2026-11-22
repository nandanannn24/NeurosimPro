import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Users,
  Video,
  Play,
  ArrowLeft,
  Bell,
  RefreshCw,
  Building2,
  Phone,
  Mail,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Coffee,
  MessageSquare,
  Lock,
  Radio,
} from 'lucide-react';
import { UserProfile } from '../modals/AuthModal';
import { LobbyBracket, CompanyRecord, EnterpriseUserRecord } from '../../types/lobby';

interface Props {
  currentUser: UserProfile | null;
  onNavigateHome: () => void;
  onOpenAuth: () => void;
  onEnterRoom: (bracketId: string) => void;
  onStartVideoConference: () => void;
}

export const LeaderDashboardView: React.FC<Props> = ({
  currentUser,
  onNavigateHome,
  onOpenAuth,
  onEnterRoom,
  onStartVideoConference,
}) => {
  const [bracketId, setBracketId] = useState<string>('LOBBY-01');
  const [lobbyData, setLobbyData] = useState<LobbyBracket | null>(null);
  const [companyData, setCompanyData] = useState<CompanyRecord | null>(null);
  const [teamMembers, setTeamMembers] = useState<EnterpriseUserRecord[]>([]);
  const [occupiedSeats, setOccupiedSeats] = useState<any[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementSent, setAnnouncementSent] = useState(false);

  const isLeader =
    currentUser?.role?.toLowerCase().includes('leader') ||
    currentUser?.role?.toLowerCase().includes('manager') ||
    currentUser?.role?.toLowerCase().includes('bos') ||
    currentUser?.role?.toLowerCase().includes('admin') ||
    (currentUser as any)?.roleSlug === 'manager' ||
    (currentUser as any)?.roleSlug === 'super_admin';

  const loadLeaderData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/leader/overview?bracketId=${bracketId}`);
      const data = await res.json();
      if (data.success) {
        setLobbyData(data.lobby || null);
        setCompanyData(data.company || null);
        setTeamMembers(data.teamMembers || []);
        setOccupiedSeats(data.seats || []);
        setOnlineCount(data.onlineCount || 1);
      }
    } catch (e) {
      console.warn('Failed to load leader data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderData();
    const interval = setInterval(loadLeaderData, 10000);
    return () => clearInterval(interval);
  }, [bracketId]);

  const handleSendAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;
    setAnnouncementSent(true);
    setAnnouncementText('');
    setTimeout(() => setAnnouncementSent(false), 3000);
  };

  // Guard for Unauthorized Users
  if (!isLeader) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-sand p-6 select-none">
        <div className="max-w-md w-full bg-cream border-2 border-brick/40 rounded-2xl p-6 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-brick/10 border-2 border-brick/30 text-brick flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-ink font-serif">Akses Ditolak: Khusus Pemimpin / Bos Ruangan</h2>
          <p className="text-xs text-ink-muted leading-relaxed">
            Halaman ini berada di direktori khusus <span className="font-mono font-bold text-brick">/leader</span> dan diperuntukkan bagi Bos Divisi atau Pemimpin Ruang Kantor Perusahaan.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full py-2.5 px-4 rounded-xl bg-teal hover:bg-teal-dark text-soft font-bold text-xs transition-colors shadow-xs cursor-pointer"
            >
              Login sebagai Pemimpin (leader / leader123)
            </button>
            <button
              type="button"
              onClick={onNavigateHome}
              className="w-full py-2 px-4 rounded-xl border border-[#d1c7b5] hover:bg-sand/80 text-ink text-xs font-semibold transition-colors cursor-pointer"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto bg-sand/30 text-ink select-none flex flex-col">
      {/* Top Header Bar */}
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
              <Briefcase className="w-5 h-5 text-teal" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-ink font-serif">
                  {lobbyData?.name || 'Dashboard Bos / Pemimpin Ruangan'}
                </span>
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-teal text-soft uppercase tracking-wider">
                  LEADER PANEL
                </span>
              </div>
              <span className="text-[10px] text-teal font-mono block leading-tight">
                {companyData?.name || 'PT Inovasi Digital Nusantara'} • https://localhost:3000/leader
              </span>
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onEnterRoom(bracketId)}
            className="px-3.5 py-1.5 rounded-lg bg-teal hover:bg-teal-dark text-soft text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Masuk Ruangan Tim (2D)</span>
          </button>

          <button
            type="button"
            onClick={onStartVideoConference}
            className="px-3 py-1.5 rounded-lg border border-teal bg-teal/10 hover:bg-teal/20 text-xs font-bold text-teal transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Video className="w-3.5 h-3.5 text-teal" />
            <span>Panggil Rapat Divisi</span>
          </button>

          <button
            type="button"
            onClick={loadLeaderData}
            disabled={isLoading}
            className="p-1.5 rounded-lg border border-[#d1c7b5] hover:bg-sand/80 text-ink cursor-pointer"
            title="Refresh Status"
          >
            <RefreshCw className={`w-4 h-4 text-teal ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Real-Time Overview Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-cream border-2 border-[#b5aa94] rounded-2xl p-4 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">Karyawan Online</span>
            <div className="flex items-center justify-between">
              <span className="font-bold text-2xl text-teal font-mono">{onlineCount}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                Aktif
              </span>
            </div>
            <p className="text-[11px] text-ink-muted">Terhubung di server {bracketId}</p>
          </div>

          <div className="bg-cream border-2 border-[#b5aa94] rounded-2xl p-4 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">Okupansi Meja Kerja</span>
            <div className="flex items-center justify-between">
              <span className="font-bold text-2xl text-ochre font-mono">
                {occupiedSeats.length} <span className="text-sm font-sans text-ink-muted">/ 20</span>
              </span>
              <span className="text-xs font-bold text-ink font-mono">
                {Math.round((occupiedSeats.length / 20) * 100)}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-sand overflow-hidden">
              <div
                className="h-full bg-ochre rounded-full"
                style={{ width: `${Math.min(100, (occupiedSeats.length / 20) * 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-cream border-2 border-[#b5aa94] rounded-2xl p-4 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">Status Billing Akses</span>
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-emerald-800 uppercase font-mono">TERVERIFIKASI</span>
              <Lock className="w-3.5 h-3.5 text-teal" />
            </div>
            <p className="text-[11px] text-ink-muted font-mono truncate">Key: {lobbyData?.billingKey}</p>
          </div>

          <div className="bg-cream border-2 border-[#b5aa94] rounded-2xl p-4 shadow-xs space-y-1">
            <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">PIC Penghubung Humas</span>
            <span className="font-bold text-xs text-ink block truncate">{companyData?.humasContact.name}</span>
            <p className="text-[10.5px] text-teal font-mono truncate">{companyData?.humasContact.phone}</p>
          </div>
        </div>

        {/* 2 Column Layout: Left Team Members, Right Room Management & Quick Announcement */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Team Members Live Status (Width: 7/12) */}
          <div className="lg:col-span-7 bg-cream border-2 border-[#b5aa94] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#d1c7b5] pb-3">
              <div>
                <h3 className="font-bold text-base text-ink font-serif flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal" />
                  <span>Aktivitas Karyawan di Ruang Kerja</span>
                </h3>
                <p className="text-xs text-ink-muted">
                  Pantau posisi karyawan: Sedang Bekerja di workstation, di Ruang Rapat, di Pantry, atau AFK.
                </p>
              </div>

              <span className="text-[11px] font-mono font-bold text-teal bg-teal/10 px-2 py-0.5 rounded">
                {teamMembers.length} Terdaftar
              </span>
            </div>

            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
              {teamMembers.map((member) => {
                const isOnline = member.username === currentUser?.username || member.id === 4;
                return (
                  <div
                    key={member.id}
                    className="p-3 rounded-xl bg-sand/40 border border-[#d1c7b5] flex items-center justify-between gap-3 hover:bg-sand/70 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-cream border border-teal/40 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        <img src={member.avatar} alt={member.fullName} className="w-full h-full object-contain pixelated" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-xs text-ink block truncate">{member.fullName}</span>
                        <span className="text-[10.5px] text-ink-muted block truncate">
                          {member.title} • {member.department}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isOnline
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-sand text-ink-muted border border-[#d1c7b5]'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`} />
                        <span>{isOnline ? 'Sedang Bekerja' : 'Offline'}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Room Controls, PIC Contact, Broadcast Announcement (Width: 5/12) */}
          <div className="lg:col-span-5 space-y-5">
            {/* 1. Broadcast Pengumuman Cepat */}
            <div className="bg-cream border-2 border-[#b5aa94] rounded-2xl p-5 shadow-xs space-y-3">
              <h4 className="font-bold text-sm text-ink font-serif flex items-center gap-2">
                <Radio className="w-4 h-4 text-ochre" />
                <span>Pengumuman Cepat untuk Ruangan</span>
              </h4>
              <p className="text-xs text-ink-muted">
                Kirim pesan darurat atau informasi prioritas langsung ke layar seluruh karyawan yang berada di ruangan ini.
              </p>

              <form onSubmit={handleSendAnnouncement} className="space-y-2.5">
                <textarea
                  rows={3}
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="Ketik pengumuman tim, misal: Standup harian dimulai 10 menit lagi di Ruang Rapat..."
                  className="w-full p-2.5 rounded-xl bg-parchment border border-[#d1c7b5] text-xs text-ink focus:outline-teal resize-none"
                />

                <div className="flex items-center justify-between">
                  {announcementSent ? (
                    <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Pengumuman disiarkan!</span>
                    </span>
                  ) : <span />}

                  <button
                    type="submit"
                    className="py-1.5 px-3.5 rounded-lg bg-teal hover:bg-teal-dark text-soft text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    Kirim Pengumuman
                  </button>
                </div>
              </form>
            </div>

            {/* 2. Humas & Hubungan Perusahaan PIC */}
            <div className="bg-cream border-2 border-[#b5aa94] rounded-2xl p-5 shadow-xs space-y-3">
              <h4 className="font-bold text-sm text-ink font-serif flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal" />
                <span>Kontak PIC Humas Perusahaan</span>
              </h4>
              <p className="text-xs text-ink-muted">
                Hubungi Humas jika Anda memerlukan penambahan kapasitas kursi, perpanjangan lisensi, atau perizinan tamu VIP.
              </p>

              {companyData?.humasContact && (
                <div className="p-3 rounded-xl bg-sand/40 border border-[#d1c7b5] space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted">Nama PIC:</span>
                    <span className="font-bold text-ink">{companyData.humasContact.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted">Email:</span>
                    <span className="font-mono text-teal font-semibold">{companyData.humasContact.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted">Telepon:</span>
                    <span className="font-mono text-ink font-semibold">{companyData.humasContact.phone}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

