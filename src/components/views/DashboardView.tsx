import React, { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  DoorOpen,
  Users,
  Shirt,
  Play,
  ArrowRight,
  LogOut,
  Sparkles,
  CheckCircle2,
  Clock,
  Compass,
  Award,
  Layers,
  Briefcase,
  Video,
  Plus,
  Server,
  Lock,
  Unlock,
} from 'lucide-react';
import { UserProfile } from '../modals/AuthModal';
import { CharacterCustomization, CharacterDirection } from '../../types/character';
import { OfficeTask } from '../../types/task';
import { CharacterCanvasPreview } from '../character/CharacterCanvasPreview';

export interface OfficeRoom {
  id: string;
  name: string;
  zone: string;
  description: string;
  spawnCoords: { x: number; y: number };
  capacity: number;
  activeCount: number;
  features: string[];
}

export const mapZoneToRoomId = (zoneId?: string): string => {
  if (!zoneId) return 'room-main';
  if (zoneId === 'afk-room' || zoneId === 'room-afk') return 'room-afk';
  if (zoneId === 'room-pantry') return 'room-pantry';
  if (zoneId === 'room-meeting') return 'room-meeting';
  if (zoneId === 'room-executive') return 'room-executive';
  return 'room-main';
};

export const getOfficeRooms = (userName: string = 'Pengguna', activeZoneId: string = 'room-workspace'): OfficeRoom[] => {
  const currentRoomId = mapZoneToRoomId(activeZoneId);

  return [
    {
      id: 'room-main',
      name: 'Kantor Utama & Open Workspace',
      zone: 'Workstation Utama',
      description: 'Pusat workstation tim dengan 16 meja kerja komputer, koridor navigasi sentral, dan area kolaborasi terbuka.',
      spawnCoords: { x: 1687, y: 880 },
      capacity: 25,
      activeCount: currentRoomId === 'room-main' ? 1 : 0,
      features: ['16 Meja Kerja Komputer', 'Sistem Duduk 4 Arah', 'Area Kolaborasi Terbuka'],
    },
    {
      id: 'room-meeting',
      name: 'Ruang Rapat Strategis & Konferensi',
      zone: 'Ruang Rapat & Konferensi',
      description: 'Ruang konferensi formal berlantai kayu untuk presentasi proposal, video conference, dan breakout session tim.',
      spawnCoords: { x: 600, y: 480 },
      capacity: 12,
      activeCount: currentRoomId === 'room-meeting' ? 1 : 0,
      features: ['Meja Rapat Panjang', 'Screen Sharing Proyektor', 'Breakout Room Host'],
    },
    {
      id: 'room-pantry',
      name: 'Pantry & Coffee Breakroom',
      zone: 'Pantry & Dapur',
      description: 'Area santai dengan mesin espresso, meja bar kafe, dan area istirahat untuk obrolan santai antar rekan kerja.',
      spawnCoords: { x: 480, y: 950 },
      capacity: 15,
      activeCount: currentRoomId === 'room-pantry' ? 1 : 0,
      features: ['Mesin Espresso & Snack Bar', 'Meja Diskusi Kasual', 'Zone Istirahat Tim'],
    },
    {
      id: 'room-executive',
      name: 'Ruang Eksekutif & Manajemen',
      zone: 'Ruang Eksekutif & Manajemen',
      description: 'Ruangan kerja kepemimpinan dan manajemen organisasi untuk perencanaan strategis dan evaluasi kinerja berkala.',
      spawnCoords: { x: 2150, y: 360 },
      capacity: 8,
      activeCount: currentRoomId === 'room-executive' ? 1 : 0,
      features: ['Meja Pimpinan Eksekutif', 'Ruang Pembahasan Khusus', 'Akses Terbatas Manajemen'],
    },
    {
      id: 'room-afk',
      name: 'AFK Room & Area Fokus Santai',
      zone: 'AFK Room & Area Santai',
      description: 'Ruang relaksasi tenang dilengkapi sofa empuk, rak buku, dan dispenser untuk jeda istirahat tanpa gangguan.',
      spawnCoords: { x: 600, y: 1180 },
      capacity: 10,
      activeCount: currentRoomId === 'room-afk' ? 1 : 0,
      features: ['Sofa Relaksasi', 'Status AFK Otomatis', 'Zona Hening & Fokus'],
    },
  ];
};

export const OFFICE_ROOMS: OfficeRoom[] = getOfficeRooms('Pengguna');

interface Props {
  currentUser: UserProfile | null;
  characterConfig: CharacterCustomization;
  tasks: OfficeTask[];
  userHistory: any[];
  currentZoneId?: string;
  onSelectRoom: (room: OfficeRoom) => void;
  onEnterSimulationDirect: (room?: OfficeRoom, lobbyId?: string) => void;
  onOpenCustomizer: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onBackToLanding?: () => void;
  onStartVideoConference?: () => void;
  onOpenAdminBilling?: () => void;
}

export const DashboardView: React.FC<Props> = ({
  currentUser,
  characterConfig,
  tasks,
  userHistory,
  currentZoneId,
  onSelectRoom,
  onEnterSimulationDirect,
  onOpenCustomizer,
  onOpenAuth,
  onLogout,
  onBackToLanding,
  onStartVideoConference,
  onOpenAdminBilling,
}) => {
  const [previewDirection, setPreviewDirection] = useState<CharacterDirection>('south');
  const [lobbies, setLobbies] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/lobbies')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.lobbies)) {
          setLobbies(data.lobbies);
        }
      })
      .catch(() => {});
  }, []);

  const completedTasks = tasks.filter((t) => t.completed).length;
  const progressPercent = Math.round((completedTasks / tasks.length) * 100);
  const currentRoomId = mapZoneToRoomId(currentZoneId);
  const officeRooms = React.useMemo(() => getOfficeRooms(currentUser?.fullName || 'Pengguna', currentZoneId), [currentUser?.fullName, currentZoneId]);

  return (
    <div className="w-full h-full overflow-y-auto bg-sand/30 text-ink select-none flex flex-col">
      {/* Top Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-3.5 bg-cream border-b border-[#d1c7b5] sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 text-left">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-cream border border-teal/30 flex items-center justify-center shadow-xs">
              <img src="/logo.webp" alt="Logo NeuroSim Pro" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-ink block leading-tight font-serif">
                  NeuroSim
                </span>
                <span className="text-[10px] font-black px-1 py-0.2 rounded bg-teal text-soft uppercase tracking-wider">
                  PRO
                </span>
              </div>
              <span className="text-[10px] text-teal font-semibold block leading-tight">
                Virtual Office Portal
              </span>
            </div>
          </div>
        </div>

        {/* Center / Right Header Actions */}
        <div className="flex items-center gap-3">
          {onStartVideoConference && (
            <button
              type="button"
              onClick={onStartVideoConference}
              className="px-3 py-1.5 rounded-lg border border-teal bg-teal/10 hover:bg-teal/20 text-xs font-bold text-teal transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Video className="w-3.5 h-3.5 text-teal" />
              <span>Video Conference</span>
            </button>
          )}

          {onOpenAdminBilling && (
            <button
              type="button"
              onClick={onOpenAdminBilling}
              className="px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs font-bold text-amber-900 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">Admin Billing</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onEnterSimulationDirect(OFFICE_ROOMS[0])}
            className="px-4 py-2 rounded-lg bg-teal hover:bg-teal-dark text-soft text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Masuk Virtual Office</span>
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-[#d1c7b5]">
              <button
                type="button"
                onClick={onOpenAuth}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-sand/70 transition-colors cursor-pointer"
                title="Lihat Profil ID Pengguna"
              >
                <div className="w-7 h-7 rounded-full bg-teal text-soft flex items-center justify-center text-xs font-bold shadow-xs">
                  {currentUser.fullName ? currentUser.fullName.charAt(0) : 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <span className="text-xs font-bold block text-ink leading-tight">
                    {currentUser.fullName ? currentUser.fullName.split(' ')[0] : currentUser.username}
                  </span>
                  <span className="text-[10px] text-teal block leading-tight font-medium">
                    {currentUser.role || 'Member'}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 rounded-lg text-ink-muted hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                title="Keluar / Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-3 py-1.5 rounded-lg border border-teal text-teal hover:bg-teal/10 text-xs font-bold transition-colors cursor-pointer"
            >
              Masuk Akun
            </button>
          )}
        </div>
      </header>

      {/* Main Dashboard Workspace */}
      <main className="max-w-6xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Width: 4/12): User Identity & Live Character */}
        <div className="lg:col-span-4 space-y-5">
          {/* 1. User Identity ID Card */}
          <div className="bg-cream border-2 border-[#b5aa94] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#d1c7b5] pb-3">
              <div className="flex items-center gap-2 text-teal font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Kartu ID Anggota Tim</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                AKTIF ONLINE
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-xl bg-sand/60 border-2 border-teal/40 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-xs">
                <img
                  src={currentUser?.avatar || '/assets/characters/resident/standing/south.png'}
                  alt="Avatar"
                  className="w-12 h-12 object-contain pixelated scale-125"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold text-sm sm:text-base text-ink truncate font-serif">
                  {currentUser?.fullName || characterConfig.name || 'Pengguna NeuroSim'}
                </h2>
                <p className="text-xs text-teal font-semibold mt-0.5 truncate">
                  {currentUser?.role || 'Staff Tim Kolaborasi'}
                </p>
                <p className="text-[11px] text-ink-muted truncate">
                  {currentUser?.department || 'Kantor Pusat NeuroSim Pro'}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#d1c7b5] grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-sand/40 border border-[#d1c7b5]">
                <span className="text-[10px] text-ink-muted block">ID Anggota:</span>
                <span className="font-mono font-bold text-ink">
                  #USR-{currentUser?.id || '2026-01'}
                </span>
              </div>
              <div className="p-2 rounded bg-sand/40 border border-[#d1c7b5]">
                <span className="text-[10px] text-ink-muted block">Database Status:</span>
                <span className="font-bold text-emerald-700">{currentUser ? 'Tersinkronisasi MySQL' : 'Mode Tamu'}</span>
              </div>
            </div>
          </div>

          {/* 2. Active Character Live Canvas Preview */}
          <div className="bg-cream border-2 border-[#b5aa94] rounded-2xl p-5 shadow-sm flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                <Shirt className="w-4 h-4 text-teal" />
                <span>Avatar Virtual Aktif</span>
              </span>
            </div>

            <CharacterCanvasPreview
              config={characterConfig}
              direction={previewDirection}
              onChangeDirection={setPreviewDirection}
              zoom={2.6}
              className="my-1"
            />

            <div className="text-center w-full mt-2">
              <span className="font-bold text-xs text-ink block">
                {currentUser?.fullName || characterConfig.name}
              </span>
              <span className="text-[10px] text-teal font-medium block">
                {currentUser?.role || (characterConfig.gender === 'male' ? 'Karyawan Pria' : 'Karyawan Wanita')}
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenCustomizer}
              className="w-full mt-3 py-2 px-3 rounded-xl bg-teal hover:bg-teal-dark text-soft text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <Shirt className="w-3.5 h-3.5" />
              <span>Buka Kustomisasi Karakter</span>
            </button>
          </div>

          {/* 3. Daily Tasks / Agenda Progress */}
          <div className="bg-cream border-2 border-[#b5aa94] rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-ink flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-ochre" />
                <span>Agenda Kerja Hari Ini</span>
              </span>
              <span className="font-mono text-xs font-bold text-teal">
                {completedTasks}/{tasks.length} Selesai
              </span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-sand border border-[#c4b8a1] overflow-hidden">
              <div
                className="h-full bg-teal transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="space-y-1.5 pt-1">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-2 rounded-lg border text-xs flex items-center gap-2 ${
                    task.completed
                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-900'
                      : 'bg-sand/30 border-[#d1c7b5] text-ink'
                  }`}
                >
                  <CheckCircle2
                    className={`w-3.5 h-3.5 flex-shrink-0 ${
                      task.completed ? 'text-emerald-600' : 'text-ink-muted'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <span className={`block font-medium truncate ${task.completed ? 'line-through' : ''}`}>
                      {task.title}
                    </span>
                    <span className="text-[10px] text-ink-muted block">{task.zone}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Width: 8/12): Room Directory & Lobby + Simulation Assessment History */}
        <div className="lg:col-span-8 space-y-6">
          {/* Room Directory / Lobby Selection */}
          <div className="bg-cream border-2 border-[#b5aa94] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#d1c7b5] pb-3">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-ink font-serif flex items-center gap-2">
                  <DoorOpen className="w-5 h-5 text-teal" />
                  <span>Ruangan Kantor Virtual Terpadu</span>
                </h3>
                <p className="text-xs text-ink-muted">
                  Pilih ruangan kerja untuk memasuki lobby atau langsung menuju titik koordinat di kantor virtual 2D.
                </p>
              </div>

              <span className="text-[11px] font-mono font-bold text-teal bg-teal/10 px-2.5 py-1 rounded-lg border border-teal/20 self-start sm:self-auto">
                {officeRooms.length} RUANGAN SIAP PAKAI
              </span>
            </div>

            {/* Room Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {officeRooms.map((room) => {
                const isCurrent = room.id === currentRoomId;
                return (
                  <div
                    key={room.id}
                    className={
                      isCurrent
                        ? 'bg-sand/70 border-teal shadow-xs ring-1 ring-teal/30 p-4 transition-all flex flex-col justify-between space-y-3 group rounded-xl border'
                        : 'bg-sand/30 hover:bg-sand/60 border-[#d1c7b5] hover:border-teal p-4 transition-all flex flex-col justify-between space-y-3 group shadow-2xs rounded-xl border'
                    }
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-1 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-teal uppercase tracking-wide bg-cream px-2 py-0.5 rounded border border-[#d1c7b5]">
                            {room.zone}
                          </span>
                          {isCurrent && (
                            <span className="text-[9.5px] font-bold text-soft bg-emerald-700 px-2 py-0.5 rounded-full uppercase flex items-center gap-1 shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              Lokasi Anda
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-ink-muted font-mono">
                          <Users className="w-3 h-3 text-teal" />
                          <span>Kapasitas {room.capacity}</span>
                        </div>
                      </div>

                      <h4 className="font-bold text-sm text-ink group-hover:text-teal transition-colors">
                        {room.name}
                      </h4>

                      <p className="text-xs text-ink-muted leading-relaxed line-clamp-2">
                        {room.description}
                      </p>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {room.features.map((feat, fIdx) => (
                          <span
                            key={fIdx}
                            className="text-[9.5px] px-1.5 py-0.2 bg-cream rounded border border-[#d1c7b5] text-ink-muted"
                          >
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Room CTA */}
                    <div className="pt-2 border-t border-[#d1c7b5]/60 flex items-center">
                      <button
                        type="button"
                        onClick={() => onEnterSimulationDirect(room)}
                        className="w-full py-2 px-3 rounded-lg bg-teal hover:bg-teal-dark text-soft text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Masuk ke Area Ini (2D)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5 Online Server Brackets & Enterprise Billing Sessions */}
          <div className="bg-cream border-2 border-[#b5aa94] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#d1c7b5] pb-3 gap-2">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-teal" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-ink font-serif">
                    5 Server Bracket Online & Billing Perusahaan
                  </h3>
                  <p className="text-[11px] text-ink-muted">
                    Batas 5 server online aktif • 20 workstation per bracket room • MySQL Server Synced
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-teal/10 text-teal border border-teal/20 self-start sm:self-auto">
                {lobbies.length || 5} Server Siap
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {(lobbies.length > 0
                ? lobbies
                : [
                    { id: 'LOBBY-01', name: 'PT Maju Bersama', isLocked: false, onlineCount: 1, maxCapacity: 20 },
                    { id: 'LOBBY-02', name: 'PT Inovasi Digital', isLocked: false, onlineCount: 0, maxCapacity: 20 },
                    { id: 'LOBBY-03', name: 'PT Teknologi Nusantara', isLocked: true, onlineCount: 0, maxCapacity: 20 },
                    { id: 'LOBBY-04', name: 'PT Ekosistem Kreatif', isLocked: true, onlineCount: 0, maxCapacity: 20 },
                    { id: 'LOBBY-05', name: 'PT Sinergi Global', isLocked: false, onlineCount: 0, maxCapacity: 20 },
                  ]
              ).map((lobby: any) => (
                <div
                  key={lobby.id}
                  className="p-4 rounded-xl bg-sand/40 border border-[#d1c7b5] hover:border-teal/50 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-black px-1.5 py-0.5 rounded bg-teal/15 text-teal">
                          {lobby.id}
                        </span>
                        {lobby.isLocked ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Billing Key
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <Unlock className="w-2.5 h-2.5" /> Terbuka
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-ink mt-1.5">{lobby.name}</h4>
                      <p className="text-[11px] text-ink-muted">20 Workstation Meja Kerja Dedicated</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-ink-muted mb-1 font-mono">
                      <span>Okupansi Meja:</span>
                      <span className="font-bold text-ink">
                        {lobby.onlineCount || 0} / {lobby.maxCapacity || 20} Orang
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#d1c7b5]/50 overflow-hidden">
                      <div
                        className="h-full bg-teal rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (((lobby.onlineCount || 0) / (lobby.maxCapacity || 20)) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem('neurosim_current_lobby', lobby.id);
                      onEnterSimulationDirect(OFFICE_ROOMS[0], lobby.id);
                    }}
                    className="w-full py-1.5 rounded-lg bg-teal hover:bg-teal-dark text-soft font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>Masuk Server Bracket</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
