import React from 'react';
import { User, ClipboardList, LayoutDashboard, Server, ShieldCheck } from 'lucide-react';
import { A11yControls, TextScale } from '../ui/A11yControls';
import { UserProfile } from '../modals/AuthModal';
import { OfficeRoom } from '../../types/room';

interface Props {
  mode: '2d' | 'list';
  onModeChange: (m: '2d' | 'list') => void;
  reduceMotion?: boolean;
  onToggleReduceMotion?: () => void;
  textScale: TextScale;
  onChangeTextScale: (s: TextScale) => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  onOpenTodoList: () => void;
  completedCount: number;
  totalCount: number;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  currentRoom?: OfficeRoom;
  onOpenRoomModal?: () => void;
  onNavigateDashboard?: () => void;
  onOpenCustomizer?: () => void;
  currentLobbyId?: string;
  currentLobbyName?: string;
  onOpenLobbySelector?: () => void;
  onOpenAdminBilling?: () => void;
}

const getUserDisplayName = (user: UserProfile | null): string => {
  if (!user) return 'ID Karyawan';
  if (user.fullName && typeof user.fullName === 'string' && user.fullName.trim().length > 0) {
    const first = user.fullName.trim().split(' ')[0];
    if (first) return first;
  }
  return user.username || 'ID Karyawan';
};

export const Header: React.FC<Props> = ({
  mode,
  onModeChange,
  reduceMotion = false,
  onToggleReduceMotion,
  textScale,
  onChangeTextScale,
  highContrast,
  onToggleHighContrast,
  onOpenTodoList,
  completedCount,
  totalCount,
  currentUser,
  onOpenAuth,
  currentRoom,
  onOpenRoomModal,
  onNavigateDashboard,
  currentLobbyId,
  currentLobbyName,
  onOpenLobbySelector,
  onOpenAdminBilling,
}) => {
  const roomName = currentRoom?.name || 'Kantor Pusat NeuroSim Pro';
  const roomCode = currentRoom?.code || 'NEURO-HQ-88';
  const displayName = getUserDisplayName(currentUser);

  return (
    <header className="app-header relative flex-shrink-0 flex items-center justify-between px-3 sm:px-4 py-1.5 bg-cream border-b border-[#d1c7b5] text-ink z-20 select-none">
      {/* 1. Left Product Brand, Dashboard Shortcut, & Active Online Room Pill */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded overflow-hidden bg-cream border border-[#355c5a]/30 flex-shrink-0 shadow-2xs">
            <img
              src="/logo.webp"
              alt="Logo NeuroSim Pro"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-ink leading-tight font-serif">
              NeuroSim <span className="text-teal font-sans text-xs">PRO</span>
            </h1>
            <p className="text-[10px] text-ink-muted leading-tight font-medium hidden md:block">
              Virtual Office & Collaboration
            </p>
          </div>
        </div>

        {/* Return to Dashboard */}
        {onNavigateDashboard && (
          <button
            type="button"
            onClick={onNavigateDashboard}
            title="Kembali ke Dashboard Utama"
            className="px-2.5 py-1 text-xs font-semibold rounded-md border border-[#d1c7b5] bg-cream hover:bg-sand text-ink transition-colors flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-teal" />
            <span className="hidden md:inline">Dashboard</span>
          </button>
        )}

        {/* Online Room Pill (Room indicator & invite button) */}
        {onOpenRoomModal && (
          <button
            type="button"
            onClick={onOpenRoomModal}
            title={`Ruangan Aktif: ${roomName} (${roomCode}). Klik untuk kelola ruang atau undang rekan.`}
            className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 text-xs font-semibold rounded-md bg-sand/80 hover:bg-sand border border-[#d1c7b5] text-ink transition-all shadow-2xs cursor-pointer group whitespace-nowrap"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <span className="truncate max-w-[130px] sm:max-w-[200px] font-medium text-ink">
              {roomName}
            </span>
            <span className="text-[10px] font-mono px-1 py-0.2 bg-cream rounded border border-[#d1c7b5] text-teal font-bold hidden sm:inline">
              {roomCode}
            </span>
          </button>
        )}
      </div>

      {/* 2. Middle: Lobby Bracket Selector, Admin Billing & Agenda Trigger */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Lobby Bracket Selector (Max 5 Online Brackets) */}
        {onOpenLobbySelector && (
          <button
            type="button"
            onClick={onOpenLobbySelector}
            title="Pilih / Ganti Server Bracket (Batas 5 Server Online)"
            className="px-2.5 py-1 text-xs font-semibold rounded border border-[#d1c7b5] bg-cream hover:bg-sand text-ink transition-colors flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer"
          >
            <Server className="w-3.5 h-3.5 text-teal" />
            <span className="font-mono text-[11px] font-bold text-teal">{currentLobbyId || 'LOBBY-01'}</span>
            <span className="text-[11px] text-ink-muted hidden md:inline truncate max-w-[120px]">
              {currentLobbyName || 'Server Aktif'}
            </span>
          </button>
        )}

        {/* Admin Billing Modal Trigger */}
        {onOpenAdminBilling && (
          <button
            type="button"
            onClick={onOpenAdminBilling}
            title="Kelola 5 Server Bracket, Akses Perusahaan & Billing Key"
            className="px-2.5 py-1 text-xs font-semibold rounded border border-amber-300 bg-amber-50/90 hover:bg-amber-100 text-amber-900 transition-colors flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden sm:inline font-bold">Admin Billing</span>
          </button>
        )}

        {/* To-Do Agenda Button */}
        <button
          type="button"
          onClick={onOpenTodoList}
          aria-label={`Buka agenda kerja, ${completedCount} dari ${totalCount} selesai`}
          className="px-2.5 py-1 text-xs font-semibold rounded border border-[#d1c7b5] bg-cream hover:bg-sand text-ink transition-colors flex items-center gap-1.5 shadow-2xs whitespace-nowrap cursor-pointer"
        >
          <ClipboardList className="w-3.5 h-3.5 text-teal" />
          <span className="hidden sm:inline">Agenda</span>
          <span className="px-1.5 py-0.2 bg-teal/15 text-teal rounded-full text-[10px] font-bold">
            {completedCount}/{totalCount}
          </span>
        </button>
      </div>

      {/* 3. Right: Accessibility & User Profile Authentication */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <A11yControls
          reduceMotion={reduceMotion}
          onToggleReduceMotion={onToggleReduceMotion}
          textScale={textScale}
          onChangeTextScale={onChangeTextScale}
          highContrast={highContrast}
          onToggleHighContrast={onToggleHighContrast}
        />

        {/* User Account Login / Profile Button */}
        <button
          type="button"
          onClick={onOpenAuth}
          aria-label={currentUser ? `Profil ${currentUser.fullName}` : 'Masuk akun'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
            currentUser
              ? 'border-teal/40 bg-teal/10 text-teal hover:bg-teal/20 font-bold'
              : 'border-[#d1c7b5] bg-cream hover:bg-sand text-ink'
          }`}
        >
          {currentUser?.avatar ? (
            <img
              src={currentUser.avatar}
              alt=""
              className="w-4 h-4 rounded-full object-cover border border-teal/50"
            />
          ) : (
            <User className="w-3.5 h-3.5 text-teal" />
          )}
          <span className="hidden sm:inline truncate max-w-[120px]">{displayName}</span>
        </button>
      </div>
    </header>
  );
};
