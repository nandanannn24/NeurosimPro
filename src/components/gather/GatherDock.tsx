import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, ScreenShare, Users, MessageSquare, Smile, ChevronUp, Shirt, Bot } from 'lucide-react';

export type UserStatus = 'available' | 'busy' | 'pantry' | 'afk';

interface Props {
  isMicOn: boolean;
  onToggleMic: () => void;
  isCamOn: boolean;
  onToggleCam: () => void;
  isScreenSharing: boolean;
  onToggleScreenShare: () => void;
  onOpenParticipants: () => void;
  onOpenOfficeChat: () => void;
  onSendReaction: (emoji: string) => void;
  participantsCount: number;
  unreadChatCount: number;
  status: UserStatus;
  onChangeStatus: (s: UserStatus) => void;
  userName?: string;
  userAvatar?: string;
  onOpenProfile?: () => void;
  onOpenCustomizer: () => void;
  onOpenMeeting?: () => void;
  onOpenAiGuide?: () => void;
  isGuest?: boolean;
  isLobbyGlobal?: boolean;
  onRequireAuth?: (feature: string) => void;
}

const REACTIONS = ['✋', '👍', '👏', '❤️', '💡', '☕', '🔥'];

export const GatherDock: React.FC<Props> = ({
  isMicOn,
  onToggleMic,
  isCamOn,
  onToggleCam,
  isScreenSharing,
  onToggleScreenShare,
  onOpenParticipants,
  onOpenOfficeChat,
  onSendReaction,
  participantsCount,
  unreadChatCount,
  status,
  onChangeStatus,
  userName,
  userAvatar,
  onOpenProfile,
  onOpenCustomizer,
  onOpenMeeting,
  onOpenAiGuide,
  isGuest = false,
  isLobbyGlobal = false,
  onRequireAuth,
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);
  const [lobbyNotice, setLobbyNotice] = useState<string | null>(null);

  const handleMediaAction = (actionName: string, executeAction: () => void) => {
    if (isGuest) {
      onRequireAuth?.(`Fitur ${actionName} memerlukan akun karyawan atau kode akses kantor perusahaan.`);
      return;
    }
    if (isLobbyGlobal) {
      setLobbyNotice(`Fitur ${actionName} dinonaktifkan di Lobby Global. Masuk ke Kantor Perusahaan untuk audio & video.`);
      setTimeout(() => setLobbyNotice(null), 3500);
      return;
    }
    executeAction();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dockRef.current && !dockRef.current.contains(e.target as Node)) {
        setShowReactions(false);
        setShowStatusMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'available':
        return 'bg-sage';
      case 'busy':
        return 'bg-brick';
      case 'pantry':
        return 'bg-ochre';
      case 'afk':
        return 'bg-amber-400';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'available':
        return 'Tersedia';
      case 'busy':
        return 'Sedang Bekerja';
      case 'pantry':
        return 'Di Pantry';
      case 'afk':
        return 'AFK / Istirahat';
    }
  };

  return (
    <div ref={dockRef} className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 max-w-[95vw]">
      {/* Toast Notice for Disabled Features in Global Lobby */}
      {lobbyNotice && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#0f172a]/95 text-amber-300 border border-amber-500/50 text-[11px] font-medium px-3.5 py-1.5 rounded-xl shadow-xl whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 z-50 flex items-center gap-1.5 backdrop-blur-md">
          <span>⚠️</span>
          <span>{lobbyNotice}</span>
        </div>
      )}
      {/* Reactions Popup */}
      {showReactions && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-cream border-2 border-teal rounded-lg shadow-lg p-1.5 flex items-center gap-1.5 animate-in fade-in zoom-in-95">
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onSendReaction(emoji)}
              className="w-8 h-8 rounded hover:bg-sand flex items-center justify-center text-base transition-transform hover:scale-110"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Main Virtual Office Action Dock */}
      <div className="app-office-dock bg-cream/95 backdrop-blur-xs border-2 border-teal rounded-lg shadow-xl px-2.5 py-1.5 flex items-center gap-1 sm:gap-2 text-ink">
        {/* User Identity & Status */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowStatusMenu((m) => !m)}
            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-sand/80 transition-colors text-left"
          >
            <div className="relative w-7 h-7 rounded border border-teal overflow-hidden bg-parchment flex-shrink-0">
              <img
                src={userAvatar || '/assets/characters/resident/standing/south.png'}
                alt={userName || 'Avatar Pengguna'}
                className="w-full h-full object-contain scale-[1.35] origin-center pixelated"
              />
              <span
                className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${getStatusColor()}`}
              />
            </div>
            <div className="hidden md:block">
              <span className="font-bold text-xs leading-none block text-ink truncate max-w-[90px]">
                {userName || 'Pengguna'}
              </span>
              <span className="text-[10px] text-ink-muted leading-tight block">
                {getStatusLabel()}
              </span>
            </div>
            <ChevronUp className="w-3 h-3 text-ink-muted" />
          </button>

          {/* Status Dropdown */}
          {showStatusMenu && (
            <div className="absolute bottom-11 left-0 w-40 bg-cream border border-teal rounded-md shadow-lg p-1 text-xs space-y-0.5 z-40">
              {onOpenProfile && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenProfile();
                    setShowStatusMenu(false);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded hover:bg-teal/20 text-teal font-bold flex items-center gap-1.5 border-b border-[#d1c7b5]/50 mb-1"
                >
                  <span>🪪</span>
                  <span>ID Karyawan</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onChangeStatus('available');
                  setShowStatusMenu(false);
                }}
                className="w-full text-left px-2 py-1 rounded hover:bg-sand flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-sage" />
                <span>Tersedia</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeStatus('busy');
                  setShowStatusMenu(false);
                }}
                className="w-full text-left px-2 py-1 rounded hover:bg-sand flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-brick" />
                <span>Sedang Bekerja</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeStatus('pantry');
                  setShowStatusMenu(false);
                }}
                className="w-full text-left px-2 py-1 rounded hover:bg-sand flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-ochre" />
                <span>Di Pantry</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangeStatus('afk');
                  setShowStatusMenu(false);
                }}
                className="w-full text-left px-2 py-1 rounded hover:bg-sand flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>AFK / Istirahat</span>
              </button>
              <div className="h-[1px] bg-[#d1c7b5] my-1" />
              <button
                type="button"
                onClick={() => {
                  onOpenCustomizer();
                  setShowStatusMenu(false);
                }}
                className="w-full text-left px-2 py-1.5 rounded hover:bg-sand flex items-center gap-2 text-teal font-semibold"
              >
                <Shirt className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Ubah Pakaian</span>
              </button>
            </div>
          )}
        </div>

        <div className="w-[1px] h-6 bg-muted/20 mx-0.5" />

        {/* Video Conference Launcher */}
        {onOpenMeeting && (
          <button
            type="button"
            onClick={() => handleMediaAction('Konferensi & Rapat', () => onOpenMeeting?.())}
            aria-label="Buka Video Conference & Breakout Room"
            title="Video Conference & Breakout Room"
            className="px-2 sm:px-2.5 py-1.5 rounded border border-teal bg-teal/15 hover:bg-teal text-teal hover:text-soft transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <Video className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="hidden sm:inline">Konferensi</span>
          </button>
        )}

        {/* Media Toggles */}
        <button
          type="button"
          onClick={() => handleMediaAction('Mikrofon', onToggleMic)}
          aria-label={isMicOn ? 'Matikan Mikrofon' : 'Nyalakan Mikrofon'}
          title={isMicOn ? 'Mikrofon Aktif' : 'Mikrofon Mati'}
          className={`p-2 rounded border transition-colors ${
            isMicOn
              ? 'bg-teal text-soft border-teal'
              : 'bg-soft border-muted/30 text-brick hover:bg-sand'
          }`}
        >
          {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={() => handleMediaAction('Kamera', onToggleCam)}
          aria-label={isCamOn ? 'Matikan Kamera' : 'Nyalakan Kamera'}
          title={isCamOn ? 'Kamera Aktif' : 'Kamera Mati'}
          className={`p-2 rounded border transition-colors ${
            isCamOn
              ? 'bg-teal text-soft border-teal'
              : 'bg-soft border-muted/30 text-brick hover:bg-sand'
          }`}
        >
          {isCamOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
        </button>

        <button
          type="button"
          onClick={() => handleMediaAction('Berbagi Layar', onToggleScreenShare)}
          aria-label={isScreenSharing ? 'Hentikan Berbagi Layar' : 'Berbagi Layar'}
          title={isScreenSharing ? 'Sedang Berbagi Layar' : 'Berbagi Layar'}
          className={`p-2 rounded border transition-colors hidden sm:flex ${
            isScreenSharing
              ? 'bg-brass text-ink font-bold border-brass'
              : 'bg-soft border-muted/30 text-ink hover:bg-sand'
          }`}
        >
          <ScreenShare className="w-4 h-4" />
        </button>

        {/* Reaction Emoji Button */}
        <button
          type="button"
          onClick={() => setShowReactions((r) => !r)}
          aria-label="Kirim Reaksi Cepat"
          title="Kirim Reaksi"
          className="p-2 rounded border bg-soft border-muted/30 text-ink hover:bg-sand transition-colors"
        >
          <Smile className="w-4 h-4" />
        </button>

        {/* Outfit / Character Customizer Button */}
        <button
          type="button"
          onClick={onOpenCustomizer}
          aria-label="Kustomisasi Karakter & Pakaian"
          title="Kustomisasi Karakter & Pakaian"
          className="p-2 rounded border bg-soft border-muted/30 text-ink hover:bg-sand hover:text-teal transition-colors"
        >
          <Shirt className="w-4 h-4" />
        </button>

        {/* NEURO AI Assistant Button */}
        {onOpenAiGuide && (
          <button
            type="button"
            onClick={() => {
              if (isGuest) {
                onRequireAuth?.('NEURO AI Assistant hanya dapat digunakan oleh member terdaftar atau staf kantor perusahaan.');
                return;
              }
              onOpenAiGuide?.();
            }}
            aria-label="Tanya NEURO AI Assistant"
            title="NEURO AI Assistant (Panduan Interaktif)"
            className="p-2 rounded border bg-soft border-teal/40 text-teal hover:bg-teal/15 hover:border-teal transition-all flex items-center justify-center cursor-pointer shadow-2xs group"
          >
            <Bot className="w-4 h-4 text-teal group-hover:scale-110 transition-transform" />
          </button>
        )}

        <div className="w-[1px] h-6 bg-muted/20 mx-0.5" />

        {/* Participants Panel Button */}
        <button
          type="button"
          onClick={onOpenParticipants}
          aria-label="Lihat Rekan di Kantor"
          title="Rekan Kantor"
          className="px-2.5 py-1.5 rounded border border-muted/30 bg-soft text-ink hover:bg-sand transition-colors flex items-center gap-1.5 text-xs font-medium"
        >
          <Users className="w-4 h-4 text-teal" />
          <span className="hidden sm:inline">Rekan:</span>
          <span className="font-bold">{participantsCount}</span>
        </button>

        {/* Office Chat Button */}
        <button
          type="button"
          onClick={onOpenOfficeChat}
          aria-label="Buka Obrolan Kantor"
          title="Obrolan Kantor"
          className="relative px-2.5 py-1.5 rounded border border-muted/30 bg-soft text-ink hover:bg-sand transition-colors flex items-center gap-1.5 text-xs font-medium"
        >
          <MessageSquare className="w-4 h-4 text-teal" />
          <span className="hidden sm:inline">Obrolan</span>
          {unreadChatCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-brick animate-pulse" />
          )}
        </button>
      </div>
    </div>
  );
};

