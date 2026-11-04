import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Server,
  Users,
  Building2,
  Key,
  Clock,
  RefreshCw,
  Search,
  Plus,
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ArrowLeft,
  Activity,
  UserCheck,
  UserX,
  Sliders,
  Send,
  Phone,
  Mail,
  Briefcase,
  Play,
  Save,
} from 'lucide-react';
import { UserProfile } from '../modals/AuthModal';
import { LobbyBracket, BillingSession, CompanyRecord, EnterpriseUserRecord } from '../../types/lobby';

interface Props {
  currentUser: UserProfile | null;
  onNavigateHome: () => void;
  onOpenAuth: () => void;
  onEnterRoom?: (bracketId: string) => void;
}

export const AdminDashboardView: React.FC<Props> = ({
  currentUser,
  onNavigateHome,
  onOpenAuth,
  onEnterRoom,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'companies' | 'billing' | 'logs'>('overview');
  const [overview, setOverview] = useState<any>(null);
  const [lobbies, setLobbies] = useState<LobbyBracket[]>([]);
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [users, setUsers] = useState<EnterpriseUserRecord[]>([]);
  const [billingSessions, setBillingSessions] = useState<BillingSession[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New User Form State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    fullName: '',
    role: 'Pengguna Internal',
    roleSlug: 'employee' as const,
    title: 'Staff Pengembang',
    department: 'Divisi Antarmuka & Frontend',
    companyName: 'PT Inovasi Digital Nusantara',
    bracketId: 'LOBBY-01',
  });

  // New Billing Session Form State
  const [showAddBillingModal, setShowAddBillingModal] = useState(false);
  const [newSession, setNewSession] = useState({
    companyName: '',
    prefix: 'CORP',
    plan: 'enterprise_pro' as const,
    maxSeatsPerBracket: 20,
    validUntil: '2026-12-31T23:59:59Z',
    contactEmail: '',
    assignedLobbies: ['LOBBY-01'],
    humasName: '',
    humasEmail: '',
    humasPhone: '',
    notes: 'Enterprise Tier License',
  });

  // Edit Company Form State
  const [editingCompany, setEditingCompany] = useState<CompanyRecord | null>(null);

  const isAdmin = currentUser?.role?.toLowerCase().includes('admin') || (currentUser as any)?.roleSlug === 'super_admin';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ovRes, usersRes, compRes, billRes, logsRes] = await Promise.all([
        fetch('/api/admin/overview').then((r) => r.json()),
        fetch('/api/admin/users').then((r) => r.json()),
        fetch('/api/admin/companies').then((r) => r.json()),
        fetch('/api/admin/billing').then((r) => r.json()),
        fetch('/api/admin/logs').then((r) => r.json()),
      ]);

      if (ovRes.success) setOverview(ovRes.overview);
      if (usersRes.success) setUsers(usersRes.users || []);
      if (compRes.success) setCompanies(compRes.companies || []);
      if (billRes.success) {
        setBillingSessions(billRes.sessions || []);
        setLobbies(billRes.lobbies || []);
      }
      if (logsRes.success) setLogs(logsRes.logs || []);
    } catch (e: any) {
      console.warn('Failed to load admin data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleGenerateQuickKey = async (prefix: string) => {
    try {
      const res = await fetch('/api/admin/billing/generate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix }),
      });
      const data = await res.json();
      if (data.success) {
        handleCopy(data.billingKey);
        setStatusMessage({ type: 'success', text: `Billing Key baru digenerate & disalin: ${data.billingKey}` });
        loadData();
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Gagal membuat billing key baru.' });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Akun @${newUser.username} berhasil dibuat!` });
        setShowAddUserModal(false);
        setNewUser({
          username: '',
          email: '',
          fullName: '',
          role: 'Pengguna Internal',
          roleSlug: 'employee',
          title: 'Staff Pengembang',
          department: 'Divisi Antarmuka & Frontend',
          companyName: 'PT Inovasi Digital Nusantara',
          bracketId: 'LOBBY-01',
        });
        loadData();
      } else {
        setStatusMessage({ type: 'error', text: data.message || 'Gagal membuat user.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Koneksi gagal saat membuat user.' });
    }
  };

  const handleToggleUserActive = async (userId: number, currentActive: boolean) => {
    try {
      const res = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, isActive: !currentActive }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isActive: !currentActive } : u)));
        setStatusMessage({ type: 'success', text: 'Status akun berhasil diperbarui.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Gagal mengubah status akun.' });
    }
  };

  const handleCreateBillingSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/billing/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: newSession.companyName,
          plan: newSession.plan,
          maxSeatsPerBracket: newSession.maxSeatsPerBracket,
          validUntil: newSession.validUntil,
          contactEmail: newSession.contactEmail,
          assignedLobbies: newSession.assignedLobbies,
          humasContact: {
            name: newSession.humasName,
            email: newSession.contactEmail,
            phone: newSession.humasPhone,
            title: 'Humas / Corporate PIC',
          },
          notes: newSession.notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Billing session untuk ${newSession.companyName} berhasil dibuat!` });
        setShowAddBillingModal(false);
        loadData();
      } else {
        setStatusMessage({ type: 'error', text: data.message || 'Gagal membuat billing session.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Gagal menyimpan billing session.' });
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;
    try {
      const res = await fetch('/api/admin/companies/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCompany),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMessage({ type: 'success', text: `Data perusahaan ${editingCompany.name} diperbarui.` });
        setEditingCompany(null);
        loadData();
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Gagal memperbarui data perusahaan.' });
    }
  };

  const handleToggleLobbyLock = async (lobby: LobbyBracket) => {
    try {
      const res = await fetch('/api/admin/billing/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lobbyId: lobby.id,
          isLocked: !lobby.isLocked,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLobbies((prev) => prev.map((l) => (l.id === lobby.id ? { ...l, isLocked: !lobby.isLocked } : l)));
        setStatusMessage({ type: 'success', text: `Kunci ${lobby.id} diubah.` });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Gagal mengubah status server.' });
    }
  };

  // Route Guard View for Non-Admin
  if (!isAdmin) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-sand p-6 select-none">
        <div className="max-w-md w-full bg-cream border-2 border-brick/40 rounded-2xl p-6 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-brick/10 border-2 border-brick/30 text-brick flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-ink font-serif">Akses Ditolak: Khusus Administrator</h2>
          <p className="text-xs text-ink-muted leading-relaxed">
            Halaman ini berada di direktori aman <span className="font-mono font-bold text-brick">/x90x9admin</span> dan hanya dapat diakses oleh akun Super Administrator NeuroSim Pro.
          </p>
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full py-2.5 px-4 rounded-xl bg-teal hover:bg-teal-dark text-soft font-bold text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              <Key className="w-4 h-4" />
              <span>Login sebagai Admin (admin / admin123)</span>
            </button>
            <button
              type="button"
              onClick={onNavigateHome}
              className="w-full py-2 px-4 rounded-xl border border-[#d1c7b5] hover:bg-sand/80 text-ink text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Beranda</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto bg-sand/30 text-ink select-none flex flex-col">
      {/* Admin Top Navigation Header */}
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
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-cream border border-amber-600/40 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-ink font-serif">NeuroSim Pro</span>
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-700 text-soft uppercase tracking-wider">
                  ADMIN KERNEL
                </span>
              </div>
              <span className="text-[10px] text-amber-900 font-mono block leading-tight">
                https://localhost:3000/x90x9admin
              </span>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg border border-[#d1c7b5] bg-cream hover:bg-sand/80 text-xs font-semibold text-ink transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>

          <div className="flex items-center gap-2 pl-2 border-l border-[#d1c7b5]">
            <div className="w-7 h-7 rounded-full bg-amber-800 text-soft flex items-center justify-center text-xs font-bold shadow-xs">
              A
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-xs font-bold block text-ink leading-tight">
                {currentUser?.fullName || 'Super Administrator'}
              </span>
              <span className="text-[10px] text-amber-700 block leading-tight font-semibold">
                Sistem Terverifikasi
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Status Notification Alert */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center justify-between shadow-xs ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-brick/10 border-brick/30 text-brick'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-brick flex-shrink-0" />
              )}
              <span className="font-medium">{statusMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="text-xs font-bold px-2 py-0.5 rounded hover:bg-black/5"
            >
              Tutup
            </button>
          </div>
        )}

        {/* 1. Realtime Metric Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="bg-cream border-2 border-[#b5aa94] rounded-xl p-3.5 shadow-xs">
            <span className="text-[10px] font-bold text-ink-muted uppercase block tracking-wider">Status Server</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-xs sm:text-sm text-emerald-800 font-mono">ONLINE (ID-JKT)</span>
            </div>
          </div>

          <div className="bg-cream border-2 border-[#b5aa94] rounded-xl p-3.5 shadow-xs">
            <span className="text-[10px] font-bold text-ink-muted uppercase block tracking-wider">Online Sekarang</span>
            <span className="font-bold text-base sm:text-lg text-teal font-mono block mt-0.5">
              {overview?.totalOnline || 1} <span className="text-xs text-ink-muted font-sans">Karyawan</span>
            </span>
          </div>

          <div className="bg-cream border-2 border-[#b5aa94] rounded-xl p-3.5 shadow-xs">
            <span className="text-[10px] font-bold text-ink-muted uppercase block tracking-wider">Meja Terisi</span>
            <span className="font-bold text-base sm:text-lg text-ochre font-mono block mt-0.5">
              {overview?.totalOccupiedSeats || 0} / {overview?.totalCapacity || 100}
            </span>
          </div>

          <div className="bg-cream border-2 border-[#b5aa94] rounded-xl p-3.5 shadow-xs">
            <span className="text-[10px] font-bold text-ink-muted uppercase block tracking-wider">Perusahaan Terdaftar</span>
            <span className="font-bold text-base sm:text-lg text-ink font-mono block mt-0.5">
              {companies.length} <span className="text-xs text-ink-muted font-sans">Kantor</span>
            </span>
          </div>

          <div className="bg-cream border-2 border-[#b5aa94] rounded-xl p-3.5 shadow-xs">
            <span className="text-[10px] font-bold text-ink-muted uppercase block tracking-wider">Pengguna Internal</span>
            <span className="font-bold text-base sm:text-lg text-blue-700 font-mono block mt-0.5">
              {users.length} <span className="text-xs text-ink-muted font-sans">Akun</span>
            </span>
          </div>

          <div className="bg-cream border-2 border-[#b5aa94] rounded-xl p-3.5 shadow-xs">
            <span className="text-[10px] font-bold text-ink-muted uppercase block tracking-wider">Sesi Billing Aktif</span>
            <span className="font-bold text-base sm:text-lg text-emerald-700 font-mono block mt-0.5">
              {billingSessions.filter((s) => s.status === 'active').length} <span className="text-xs text-ink-muted font-sans">Sesi</span>
            </span>
          </div>
        </div>

        {/* 2. Admin Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#d1c7b5] pb-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-teal text-soft shadow-xs'
                : 'bg-cream/60 hover:bg-cream text-ink border border-[#d1c7b5]'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>5 Server Bracket Lobbies</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-teal text-soft shadow-xs'
                : 'bg-cream/60 hover:bg-cream text-ink border border-[#d1c7b5]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Akun Pengguna & Role</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('companies')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'companies'
                ? 'bg-teal text-soft shadow-xs'
                : 'bg-cream/60 hover:bg-cream text-ink border border-[#d1c7b5]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Perusahaan & Kontak Humas (PIC)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'billing'
                ? 'bg-teal text-soft shadow-xs'
                : 'bg-cream/60 hover:bg-cream text-ink border border-[#d1c7b5]'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Billing Session & Generate Key</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-teal text-soft shadow-xs'
                : 'bg-cream/60 hover:bg-cream text-ink border border-[#d1c7b5]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Audit Log Sistem</span>
          </button>
        </div>

        {/* TAB 1: 5 SERVER BRACKET LOBBIES */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-ink font-serif">5 Server Bracket Online & Okupansi Meja</h3>
                <p className="text-xs text-ink-muted">
                  Batas tepat 5 server online aktif. Masing-masing dialokasikan untuk kantor perusahaan atau divisi internal.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lobbies.map((lobby) => (
                <div
                  key={lobby.id}
                  className="bg-cream border-2 border-[#b5aa94] rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-teal/50 transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-black px-2 py-0.5 rounded bg-teal/15 text-teal">
                        {lobby.id}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleLobbyLock(lobby)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors ${
                            lobby.isLocked
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}
                        >
                          {lobby.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                          <span>{lobby.isLocked ? 'Billing Key Aktif' : 'Terbuka Umum'}</span>
                        </button>
                      </div>
                    </div>

                    <h4 className="font-bold text-sm text-ink">{lobby.name}</h4>
                    <p className="text-xs text-teal font-semibold flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{lobby.companyName}</span>
                    </p>

                    {lobby.humasContact && (
                      <div className="p-2 rounded-lg bg-sand/40 border border-[#d1c7b5] text-[11px] space-y-0.5">
                        <span className="text-[10px] text-ink-muted block font-semibold">Kontak Humas (PIC):</span>
                        <span className="font-bold text-ink block">{lobby.humasContact.name}</span>
                        <span className="text-ink-muted block">{lobby.humasContact.email} • {lobby.humasContact.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-[#d1c7b5]">
                    <div className="flex items-center justify-between text-xs text-ink font-mono">
                      <span>Okupansi Meja:</span>
                      <span className="font-bold">
                        {lobby.onlineCount || 0} / {lobby.maxCapacity || 20} Kursi
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-[#d1c7b5]/60 overflow-hidden">
                      <div
                        className="h-full bg-teal rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (((lobby.onlineCount || 0) / (lobby.maxCapacity || 20)) * 100))}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-ink-muted font-mono truncate max-w-[150px]">
                        Key: {lobby.billingKey}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(lobby.billingKey)}
                        className="text-[10px] font-bold text-teal hover:underline flex items-center gap-1"
                      >
                        {copiedKey === lobby.billingKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>Salin Key</span>
                      </button>
                    </div>

                    {onEnterRoom && (
                      <button
                        type="button"
                        onClick={() => onEnterRoom(lobby.id)}
                        className="w-full py-1.5 px-3 rounded-lg bg-teal hover:bg-teal-dark text-soft text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs mt-2"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Kunjungi Ruangan Ini</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: AKUN PENGGUNA & ROLE */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-ink font-serif">Manajemen Akun Pengguna & Hak Akses</h3>
                <p className="text-xs text-ink-muted">
                  Kelola peran pengguna: Super Admin, Bos / Leader Divisi, Humas (PIC), Pengguna Internal, dan Tamu.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddUserModal(true)}
                className="py-2 px-3.5 rounded-xl bg-teal hover:bg-teal-dark text-soft text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Pengguna Baru</span>
              </button>
            </div>

            {/* Users Table */}
            <div className="bg-cream border-2 border-[#b5aa94] rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-ink">
                  <thead className="bg-sand/60 border-b border-[#d1c7b5] text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                    <tr>
                      <th className="p-3.5">ID & Pengguna</th>
                      <th className="p-3.5">Peran / Role</th>
                      <th className="p-3.5">Perusahaan & Bracket</th>
                      <th className="p-3.5">Divisi & Jabatan</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d1c7b5]/60">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-sand/30 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-sand border border-teal/40 overflow-hidden flex-shrink-0 flex items-center justify-center">
                              <img src={u.avatar} alt={u.fullName} className="w-full h-full object-contain pixelated" />
                            </div>
                            <div>
                              <span className="font-bold text-ink block">{u.fullName}</span>
                              <span className="text-[10px] text-ink-muted font-mono">@{u.username} • {u.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10.5px] font-bold border ${
                              u.roleSlug === 'super_admin'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : u.roleSlug === 'manager'
                                ? 'bg-teal/15 text-teal border-teal/30'
                                : u.roleSlug === 'org_admin'
                                ? 'bg-ochre/15 text-ochre border-ochre/30'
                                : u.roleSlug === 'guest'
                                ? 'bg-slate-100 text-slate-700 border-slate-300'
                                : 'bg-blue-100 text-blue-900 border-blue-300'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className="font-semibold text-ink block">{u.companyName}</span>
                          <span className="text-[10px] font-mono text-teal">{u.bracketId}</span>
                        </td>
                        <td className="p-3.5">
                          <span className="text-ink block">{u.title}</span>
                          <span className="text-[10px] text-ink-muted block">{u.department}</span>
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-brick/10 text-brick'
                            }`}
                          >
                            {u.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleUserActive(u.id, u.isActive)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                              u.isActive
                                ? 'border border-brick/40 text-brick hover:bg-brick/10'
                                : 'border border-emerald-400 text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: PERUSAHAAN & KONTAK HUMAS */}
        {activeTab === 'companies' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-ink font-serif">Data Perusahaan & Penghubung Humas (PIC)</h3>
                <p className="text-xs text-ink-muted">
                  Humas berfungsi sebagai PIC penghubung resmi antara organisasi pengguna dengan pihak Admin NeuroSim Pro.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {companies.map((comp) => (
                <div key={comp.id} className="bg-cream border-2 border-[#b5aa94] rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-teal/15 text-teal">
                        {comp.assignedBracketId}
                      </span>
                      <h4 className="font-bold text-base text-ink mt-1">{comp.name}</h4>
                      <p className="text-xs text-ink-muted font-mono">ID: {comp.id} • Key: {comp.billingKey}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingCompany(comp)}
                      className="px-2.5 py-1 rounded-lg border border-teal text-teal hover:bg-teal/10 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Edit PIC Humas
                    </button>
                  </div>

                  {/* Humas Information Card */}
                  <div className="p-4 rounded-xl bg-sand/50 border border-[#d1c7b5] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-teal uppercase tracking-wide">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Kontak Humas (PIC Perusahaan)</span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-ink-muted">Nama PIC:</span>
                        <span className="font-bold text-ink">{comp.humasContact.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-ink-muted">Jabatan:</span>
                        <span className="text-ink">{comp.humasContact.title}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-ink-muted">Email PIC:</span>
                        <span className="font-mono text-teal font-semibold">{comp.humasContact.email}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-ink-muted">Nomor Kontak / WA:</span>
                        <span className="font-mono text-ink font-semibold">{comp.humasContact.phone}</span>
                      </div>
                      {comp.humasContact.notes && (
                        <div className="pt-1.5 border-t border-[#d1c7b5]/60 text-[11px] text-ink-muted italic">
                          "{comp.humasContact.notes}"
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-ink-muted pt-2 border-t border-[#d1c7b5]">
                    <span>Status Billing: <strong className="text-emerald-700 uppercase">{comp.status}</strong></span>
                    <span>Berlaku Hingga: <strong className="text-ink font-mono">{comp.validUntil.split('T')[0]}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: BILLING SESSION & GENERATE KEY */}
        {activeTab === 'billing' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-ink font-serif">Billing Session & Key Generator Akses Room</h3>
                <p className="text-xs text-ink-muted">
                  Generate billing key untuk perusahaan dan kelola sesi akses room virtual office secara komersial.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleGenerateQuickKey('IDN')}
                  className="py-2 px-3.5 rounded-xl border border-teal text-teal hover:bg-teal/10 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Generate Quick Key</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddBillingModal(true)}
                  className="py-2 px-3.5 rounded-xl bg-teal hover:bg-teal-dark text-soft text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Buat Sesi Billing Baru</span>
                </button>
              </div>
            </div>

            {/* Billing Sessions Table */}
            <div className="bg-cream border-2 border-[#b5aa94] rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-ink">
                  <thead className="bg-sand/60 border-b border-[#d1c7b5] text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                    <tr>
                      <th className="p-3.5">ID Sesi & Perusahaan</th>
                      <th className="p-3.5">Billing Access Key</th>
                      <th className="p-3.5">Paket & Kursi</th>
                      <th className="p-3.5">Lobby Bracket</th>
                      <th className="p-3.5">Berlaku Hingga</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d1c7b5]/60">
                    {billingSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-sand/30 transition-colors">
                        <td className="p-3.5">
                          <span className="font-bold text-ink block">{session.companyName}</span>
                          <span className="text-[10px] font-mono text-ink-muted">{session.id}</span>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-teal bg-teal/10 px-2 py-0.5 rounded border border-teal/20">
                              {session.billingKey}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(session.billingKey)}
                              className="p-1 rounded hover:bg-sand/80 text-ink-muted hover:text-ink cursor-pointer"
                              title="Salin Key"
                            >
                              {copiedKey === session.billingKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="font-semibold text-ink uppercase block">{session.plan.replace('_', ' ')}</span>
                          <span className="text-[10px] text-ink-muted">Kapasitas {session.maxSeatsPerBracket} Workstation</span>
                        </td>
                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1">
                            {session.assignedLobbies.map((lob) => (
                              <span key={lob} className="px-1.5 py-0.5 rounded bg-sand border border-[#d1c7b5] font-mono text-[10px] font-bold">
                                {lob}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-[11px]">
                          {session.validUntil.split('T')[0]}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              session.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {session.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleCopy(session.billingKey)}
                            className="px-2.5 py-1 rounded bg-teal hover:bg-teal-dark text-soft text-[11px] font-bold cursor-pointer"
                          >
                            Salin Kunci
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AUDIT LOGS SISTEM */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-ink font-serif">Audit Log Aktivitas Sistem Realtime</h3>
                <p className="text-xs text-ink-muted">
                  Log aktivitas keamanan, otentikasi login, validasi billing key, dan perubahan konfigurasi sistem.
                </p>
              </div>
            </div>

            <div className="bg-cream border-2 border-[#b5aa94] rounded-2xl p-4 shadow-xs space-y-2 max-h-[600px] overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-sand/40 border border-[#d1c7b5] flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] px-2 py-0.2 rounded bg-teal/15 text-teal font-bold uppercase">
                        {log.category}
                      </span>
                      <span className="font-bold text-ink">{log.action}</span>
                      <span className="text-ink-muted">oleh <strong>{log.actor}</strong></span>
                    </div>
                    <p className="text-ink-muted text-[11.5px]">{log.details}</p>
                  </div>
                  <span className="text-[10px] font-mono text-ink-muted flex-shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal: Tambah User Baru */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full bg-cream border-2 border-teal rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#d1c7b5] pb-2.5">
              <h3 className="font-bold text-sm text-ink font-serif flex items-center gap-2">
                <Plus className="w-4 h-4 text-teal" />
                <span>Terbitkan Akun Pengguna Baru</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="text-ink-muted hover:text-ink font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nama Lengkap:</label>
                <input
                  type="text"
                  required
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  placeholder="misal: Alex Pratama"
                  className="w-full px-3 py-1.5 rounded-lg bg-parchment border border-[#d1c7b5] text-ink focus:outline-teal"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Username:</label>
                  <input
                    type="text"
                    required
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="alex"
                    className="w-full px-3 py-1.5 rounded-lg bg-parchment border border-[#d1c7b5] text-ink focus:outline-teal"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Email:</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder="alex@perusahaan.com"
                    className="w-full px-3 py-1.5 rounded-lg bg-parchment border border-[#d1c7b5] text-ink focus:outline-teal"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Peran / Role:</label>
                  <select
                    value={newUser.roleSlug}
                    onChange={(e) => {
                      const slug = e.target.value as any;
                      const roleNameMap: Record<string, string> = {
                        super_admin: 'Super Administrator',
                        manager: 'Bos / Leader Divisi',
                        org_admin: 'Humas / Corporate PIC',
                        employee: 'Pengguna Internal',
                        guest: 'Tamu (Guest)',
                      };
                      setNewUser({
                        ...newUser,
                        roleSlug: slug,
                        role: roleNameMap[slug] || 'Pengguna Internal',
                      });
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-parchment border border-[#d1c7b5] text-ink focus:outline-teal"
                  >
                    <option value="super_admin">Super Administrator</option>
                    <option value="manager">Bos / Leader Divisi</option>
                    <option value="org_admin">Humas / Corporate PIC</option>
                    <option value="employee">Pengguna Internal</option>
                    <option value="guest">Tamu (Guest)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Alokasi Bracket:</label>
                  <select
                    value={newUser.bracketId}
                    onChange={(e) => setNewUser({ ...newUser, bracketId: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-parchment border border-[#d1c7b5] text-ink focus:outline-teal"
                  >
                    <option value="LOBBY-01">LOBBY-01 (PT IDN)</option>
                    <option value="LOBBY-02">LOBBY-02 (PT NTM)</option>
                    <option value="LOBBY-03">LOBBY-03 (PT KMD)</option>
                    <option value="LOBBY-04">LOBBY-04 (PT SAK)</option>
                    <option value="LOBBY-05">LOBBY-05 (PT VKA)</option>
                    <option value="GUEST-LOBBY">Lobby Tamu Eksternal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Jabatan & Departemen:</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newUser.title}
                    onChange={(e) => setNewUser({ ...newUser, title: e.target.value })}
                    placeholder="Frontend Engineer"
                    className="w-full px-3 py-1.5 rounded-lg bg-parchment border border-[#d1c7b5] text-ink focus:outline-teal"
                  />
                  <input
                    type="text"
                    value={newUser.department}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    placeholder="Divisi Antarmuka"
                    className="w-full px-3 py-1.5 rounded-lg bg-parchment border border-[#d1c7b5] text-ink focus:outline-teal"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#d1c7b5] text-ink hover:bg-sand cursor-pointer font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-teal hover:bg-teal-dark text-soft font-bold cursor-pointer shadow-xs"
                >
                  Simpan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tambah Billing Session Baru */}
      {showAddBillingModal && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="max-w-lg w-full bg-cream border-2 border-teal rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#d1c7b5] pb-2.5">
              <h3 className="font-bold text-sm text-ink font-serif flex items-center gap-2">
                <Key className="w-4 h-4 text-teal" />
                <span>Buat Sesi Billing & Generate Access Key</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddBillingModal(false)}
                className="text-ink-muted hover:text-ink font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBillingSession} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nama Perusahaan / Organisasi:</label>
                <input
                  type="text"
                  required
                  value={newSession.companyName}
                  onChange={(e) => setNewSession({ ...newSession, companyName: e.target.value })}
                  placeholder="misal: PT Sinergi Nusantara Perkasa"
                  className="w-full px-3 py-1.5 rounded-lg bg-parchment border border-[#d1c7b5] text-ink focus:outline-teal"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Email Kontak Finance / PIC:</label>
                  <input
                    type="email"
                    required
                    value={newSession.contactEmail}
                    onChange={(e) => setNewSession({ ...newSession, contactEmail: e.target.value })}
                    placeholder="billing@perusahaan.co.id"
                    className="w-full px-3 py-1.5 rounded-lg bg-parchment border border-[#d1c7b5] text-ink focus:outline-teal"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Berlaku Hingga:</label>
                  <input
                    type="date"
                    required
                    value={newSession.validUntil.split('T')[0]}
                    onChange={(e) => setNewSession({ ...newSession, validUntil: `${e.target.value}T23:59:59Z` })}
                    className="w-full px-3 py-1.5 rounded-lg bg-parchment border border-[#d1c7b5] text-ink focus:outline-teal"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-sand/40 border border-[#d1c7b5] space-y-2">
                <span className="font-bold text-teal text-[11px] block uppercase">Informasi Penghubung Humas (PIC)</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={newSession.humasName}
                    onChange={(e) => setNewSession({ ...newSession, humasName: e.target.value })}
                    placeholder="Nama PIC Humas"
                    className="w-full px-3 py-1.5 rounded-lg bg-parchment border border-[#d1c7b5] text-ink"
                  />
                  <input
                    type="tel"
                    required
                    value={newSession.humasPhone}
                    onChange={(e) => setNewSession({ ...newSession, humasPhone: e.target.value })}
                    placeholder="+62 812-xxxx-xxxx"
                    className="w-full px-3 py-1.5 rounded-lg bg-parchment border border-[#d1c7b5] text-ink"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBillingModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#d1c7b5] text-ink hover:bg-sand cursor-pointer font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-teal hover:bg-teal-dark text-soft font-bold cursor-pointer shadow-xs"
                >
                  Terbitkan Sesi & Generate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Perusahaan & Humas */}
      {editingCompany && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full bg-cream border-2 border-teal rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#d1c7b5] pb-2.5">
              <h3 className="font-bold text-sm text-ink font-serif flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal" />
                <span>Edit Data Perusahaan & Humas PIC</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingCompany(null)}
                className="text-ink-muted hover:text-ink font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nama Perusahaan:</label>
                <input
                  type="text"
                  required
                  value={editingCompany.name}
                  onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-parchment border border-[#d1c7b5] text-ink"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Nama PIC Humas:</label>
                <input
                  type="text"
                  required
                  value={editingCompany.humasContact.name}
                  onChange={(e) =>
                    setEditingCompany({
                      ...editingCompany,
                      humasContact: { ...editingCompany.humasContact, name: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-parchment border border-[#d1c7b5] text-ink"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1">Email PIC:</label>
                  <input
                    type="email"
                    required
                    value={editingCompany.humasContact.email}
                    onChange={(e) =>
                      setEditingCompany({
                        ...editingCompany,
                        humasContact: { ...editingCompany.humasContact, email: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-parchment border border-[#d1c7b5] text-ink"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">No. Telp / WA:</label>
                  <input
                    type="tel"
                    required
                    value={editingCompany.humasContact.phone}
                    onChange={(e) =>
                      setEditingCompany({
                        ...editingCompany,
                        humasContact: { ...editingCompany.humasContact, phone: e.target.value },
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-parchment border border-[#d1c7b5] text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Catatan PIC:</label>
                <input
                  type="text"
                  value={editingCompany.humasContact.notes || ''}
                  onChange={(e) =>
                    setEditingCompany({
                      ...editingCompany,
                      humasContact: { ...editingCompany.humasContact, notes: e.target.value },
                    })
                  }
                  className="w-full px-3 py-1.5 rounded-lg bg-parchment border border-[#d1c7b5] text-ink"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCompany(null)}
                  className="px-3 py-1.5 rounded-lg border border-[#d1c7b5] text-ink hover:bg-sand cursor-pointer font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-teal hover:bg-teal-dark text-soft font-bold cursor-pointer shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

