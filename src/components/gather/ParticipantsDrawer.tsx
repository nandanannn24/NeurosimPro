import React, { useState, useMemo, useEffect } from 'react';
import { X, MapPin, Building2, Copy, Check, Radio, Settings, Users, Wifi } from 'lucide-react';
import { OfficeRoom } from '../../types/room';
import { EventBus, GAME_EVENTS } from '../../game/EventBus';
import { multiplayerService } from '../../services/multiplayer.service';

export interface Participant {
  id: string;
  name: string;
  role: string;
  zone: string;
  status: 'online' | 'busy' | 'pantry';
  isNPC?: boolean;
  portrait: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  currentRoom?: OfficeRoom;
  onOpenRoomModal: () => void;
}

export const ParticipantsDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  participants,
  currentRoom,
  onOpenRoomModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(() => multiplayerService.isSocketConnected());
  const [socketUrl, setSocketUrl] = useState(() => multiplayerService.getServerUrl());
  const [customSocketUrl, setCustomSocketUrl] = useState(() => {
    return typeof window !== 'undefined' ? (localStorage.getItem('neurosim_socket_url') || '') : '';
  });
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  useEffect(() => {
    const handleStatus = (data: { isConnected: boolean; serverUrl?: string }) => {
      setIsSocketConnected(data.isConnected);
      if (data.serverUrl) setSocketUrl(data.serverUrl);
    };
    EventBus.on(GAME_EVENTS.REALTIME_CONNECTION_STATUS, handleStatus);
    setIsSocketConnected(multiplayerService.isSocketConnected());
    return () => {
      EventBus.off(GAME_EVENTS.REALTIME_CONNECTION_STATUS, handleStatus);
    };
  }, []);

  const handleSaveSocketUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customSocketUrl.trim();
    if (clean) {
      localStorage.setItem('neurosim_socket_url', clean);
      multiplayerService.reconnect(clean);
    } else {
      localStorage.removeItem('neurosim_socket_url');
      multiplayerService.reconnect();
    }
    setIsConfigOpen(false);
  };

  const colleagues = useMemo(() => participants.filter((p) => !p.isNPC), [participants]);

  const roomName = currentRoom?.name || 'Kantor Pusat NeuroSim Pro';
  const roomCode = currentRoom?.code || 'NEURO-HQ-88';
  const capacity = currentRoom?.capacity ?? 25;
  const humanJoinedCount = colleagues.length;

  const getDynamicShareUrl = (): string => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const pathname = window.location.pathname.replace(/\/+$/, '');
      return `${origin}${pathname}/?room=${encodeURIComponent(roomCode)}`;
    }
    return `https://neurosim.app/?room=${encodeURIComponent(roomCode)}`;
  };

  const roomShareUrl = getDynamicShareUrl();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomShareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <aside
      aria-label="Panel Rekan di Kantor"
      className="absolute top-0 right-0 h-full w-80 max-w-[90vw] bg-cream border-l-2 border-teal shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-200"
    >
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-teal text-soft border-b border-teal-dark">
        <div>
          <h2 className="font-bold text-sm">Rekan di Kantor</h2>
          <p className="text-[11px] text-soft/80">{humanJoinedCount} anggota tim aktif di virtual office</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup Panel"
          className="p-1 hover:bg-teal-dark rounded text-soft text-lg leading-none cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Online Room Info Banner */}
      <div className="p-3 bg-sand border-b border-[#d1c7b5] flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-teal uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">Ruang Kantor Aktif</span>
            </div>
            <h3 className="text-xs font-bold text-ink truncate mt-0.5" title={roomName}>
              {roomName}
            </h3>
            <div className="text-[10px] text-ink-muted flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span>Kode:</span>
              <span className="font-mono font-bold text-wood-dark bg-cream px-1.5 py-0.2 rounded border border-muted/30">
                {roomCode}
              </span>
              <span>•</span>
              <span className="text-emerald-700 font-semibold">
                {humanJoinedCount}/{capacity} Rekan Aktif
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-1.5 pt-1">
          <button
            type="button"
            onClick={handleCopyLink}
            title="Salin tautan undangan ruang ini"
            className="flex-1 py-1 px-2 text-[11px] font-medium rounded bg-cream hover:bg-parchment border border-muted/30 text-ink transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-ink-muted" />
                <span>Salin Link</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenRoomModal}
            title="Buka panel kelola ruang & daftar ruang publik"
            className="py-1 px-2.5 text-[11px] font-semibold rounded bg-teal text-soft hover:bg-teal-dark transition-colors flex items-center gap-1 flex-shrink-0 cursor-pointer"
          >
            <Radio className="w-3 h-3" />
            <span>Kelola Ruang</span>
          </button>
        </div>

        {/* Realtime Server Connection Status */}
        <div className={`p-2 rounded text-[10.5px] border transition-colors ${
          isSocketConnected
            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900'
            : 'bg-amber-50 border-amber-300 text-amber-950'
        }`}>
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isSocketConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
              <span>{isSocketConnected ? 'Realtime Multiplayer: Aktif' : 'Realtime Multiplayer: Standalone'}</span>
            </span>
            <button
              type="button"
              onClick={() => setIsConfigOpen(!isConfigOpen)}
              className="text-[10px] underline font-semibold text-teal hover:text-teal-dark cursor-pointer flex items-center gap-1"
            >
              <Settings className="w-2.5 h-2.5" />
              <span>{isConfigOpen ? 'Tutup' : 'Atur Server'}</span>
            </button>
          </div>

          {/* Config URL drawer */}
          {isConfigOpen && (
            <form onSubmit={handleSaveSocketUrl} className="mt-2 pt-2 border-t border-[#d1c7b5]/60 space-y-1.5">
              <label className="block text-[10px] text-ink-muted">
                URL WebSocket Realtime Server:
              </label>
              <input
                type="text"
                value={customSocketUrl}
                onChange={(e) => setCustomSocketUrl(e.target.value)}
                placeholder={socketUrl || 'http://localhost:3001'}
                className="w-full px-2 py-1 text-xs border border-muted/40 rounded bg-cream text-ink focus:outline-teal font-mono"
              />
              <div className="flex justify-end gap-1 pt-1">
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(false)}
                  className="px-2 py-0.5 text-[10px] rounded bg-sand hover:bg-parchment text-ink"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-2 py-0.5 text-[10px] rounded bg-teal text-soft font-bold hover:bg-teal-dark"
                >
                  Simpan & Hubungkan
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-parchment/60">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10.5px] font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1">
            <Users className="w-3 h-3 text-teal" />
            <span>Anggota Tim Online</span>
          </span>
          <span className="text-[10px] bg-sand text-ink font-semibold px-1.5 py-0.5 rounded">
            {colleagues.length} Rekan
          </span>
        </div>

        {colleagues.length === 0 ? (
          <div className="p-4 text-center text-xs text-ink-muted bg-cream rounded-lg border border-sand">
            Belum ada rekan lain yang terhubung. Bagikan tautan ruangan untuk mengundang tim Anda!
          </div>
        ) : (
          <div className="space-y-2">
            {colleagues.map((person) => (
              <div
                key={person.id}
                className="p-2.5 rounded border border-sand bg-cream hover:border-teal/50 transition-colors flex items-center justify-between gap-2 shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative w-8 h-8 rounded border border-teal overflow-hidden bg-parchment flex-shrink-0">
                    <img
                      src={person.portrait}
                      alt={person.name}
                      className="w-full h-full object-contain scale-[1.35] origin-center pixelated"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white ${
                        person.status === 'online'
                          ? 'bg-sage'
                          : person.status === 'busy'
                          ? 'bg-brick'
                          : 'bg-ochre'
                      }`}
                    />
                  </div>

                  <div className="min-w-0">
                    <span className="font-bold text-xs text-ink truncate block">
                      {person.name}
                    </span>
                    <span className="text-[10px] text-ink-muted truncate block">
                      {person.role}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-teal mt-0.5">
                      <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                      <span className="truncate">{person.zone}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className={`text-[9.5px] px-1.5 py-0.5 rounded font-medium border ${
                    person.status === 'online'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : person.status === 'busy'
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {person.status === 'online' ? 'Tersedia' : person.status === 'busy' ? 'Fokus' : 'Pantry'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drawer Footer */}
      <div className="p-3 bg-cream border-t border-sand text-xs text-ink-muted text-center">
        Dekati kursi mana pun dan tekan Space atau E untuk duduk dan bekerja bersama tim.
      </div>
    </aside>
  );
};
