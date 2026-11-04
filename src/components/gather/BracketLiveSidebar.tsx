import React, { useState } from 'react';
import {
  Users,
  Mic,
  MicOff,
  Video,
  VideoOff,
  ChevronRight,
  ChevronLeft,
  Building2,
  Radio,
  Coffee,
  Briefcase,
  Monitor,
  Crown,
  Moon,
  Footprints,
} from 'lucide-react';
import { PlayerPresence } from '../../types/multiplayer';

export interface BracketSidebarProps {
  currentLobbyId: string;
  currentLobbyName: string;
  localUser: {
    username: string;
    fullName: string;
    avatar?: string;
    isSitting?: boolean;
    zone?: string;
    status?: string;
    isMicOn?: boolean;
    isCamOn?: boolean;
  };
  remotePlayers: PlayerPresence[];
  onOpenLobbySelector: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const BracketLiveSidebar: React.FC<BracketSidebarProps> = ({
  currentLobbyId,
  currentLobbyName,
  localUser,
  remotePlayers,
  onOpenLobbySelector,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

  // Helper to determine exact activity badge
  const getActivityBadge = (player: {
    isSitting?: boolean;
    zone?: string;
    status?: string;
    isMoving?: boolean;
  }) => {
    const zone = (player.zone || '').toLowerCase();
    const status = (player.status || '').toLowerCase();

    if (status === 'afk' || zone.includes('afk')) {
      return {
        label: 'AFK',
        color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        icon: Moon,
      };
    }

    if (player.isSitting || status === 'work' || status === 'busy') {
      if (zone.includes('rapat') || zone.includes('meeting')) {
        return {
          label: 'Meeting',
          color: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          icon: Users,
        };
      }
      if (zone.includes('pantry') || zone.includes('kafe')) {
        return {
          label: 'Pantry',
          color: 'bg-amber-600/20 text-amber-300 border-amber-600/40',
          icon: Coffee,
        };
      }
      if (zone.includes('eksekutif') || zone.includes('bos') || zone.includes('executive')) {
        return {
          label: 'Executive',
          color: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          icon: Crown,
        };
      }
      return {
        label: 'Work',
        color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        icon: Briefcase,
      };
    }

    // Walking / mobile in corridor
    if (zone.includes('rapat') || zone.includes('meeting')) {
      return {
        label: 'Meeting',
        color: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        icon: Users,
      };
    }
    if (zone.includes('pantry') || zone.includes('kafe')) {
      return {
        label: 'Pantry',
        color: 'bg-amber-600/20 text-amber-300 border-amber-600/40',
        icon: Coffee,
      };
    }
    if (zone.includes('eksekutif') || zone.includes('executive')) {
      return {
        label: 'Executive',
        color: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        icon: Crown,
      };
    }

    return {
      label: '-',
      color: 'text-slate-400 bg-transparent border-transparent',
      icon: Footprints,
    };
  };

  const totalOnline = 1 + remotePlayers.length;

  return (
    <div className="fixed top-14 right-3 z-30 flex items-start select-none font-sans transition-all duration-300">
      {/* Toggle Tab Button */}
      <button
        onClick={handleToggle}
        className="mt-2 p-1.5 bg-[#141824]/90 hover:bg-[#1f2538] text-slate-300 border border-[#2a324b] rounded-l-lg shadow-lg backdrop-blur-md transition-colors"
        title={isCollapsed ? 'Tampilkan Rekan Bracket' : 'Ciutkan Rekan Bracket'}
      >
        {isCollapsed ? <ChevronLeft className="w-4 h-4 text-emerald-400" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {/* Main Sidebar Panel */}
      {!isCollapsed && (
        <div className="w-64 bg-[#141824]/95 border border-[#2a324b] rounded-r-xl rounded-bl-xl shadow-2xl backdrop-blur-md overflow-hidden flex flex-col max-h-[75vh]">
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-[#1a2032] border-b border-[#2a324b] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <div>
                <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <span>{currentLobbyId}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono border border-emerald-800/50">
                    {totalOnline}/20
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                  {currentLobbyName}
                </div>
              </div>
            </div>

            <button
              onClick={onOpenLobbySelector}
              className="text-[10px] text-teal-300 hover:text-white px-2 py-1 rounded bg-[#252d47] hover:bg-teal-700/50 transition-colors border border-teal-500/30"
              title="Ganti Bracket"
            >
              Ganti
            </button>
          </div>

          {/* Participant List */}
          <div className="overflow-y-auto p-2 space-y-1.5 flex-1 divide-y divide-slate-800/40">
            {/* Local Player Item */}
            {(() => {
              const badge = getActivityBadge({
                isSitting: localUser.isSitting,
                zone: localUser.zone,
                status: localUser.status,
              });
              const IconComp = badge.icon;
              return (
                <div className="pt-1.5 first:pt-0 flex items-center justify-between p-1.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
                  <div className="flex items-center space-x-2 min-w-0">
                    <img
                      src={localUser.avatar || '/assets/characters/resident/standing/south.png'}
                      alt={localUser.username}
                      className="w-7 h-7 rounded-full bg-slate-800 border border-emerald-400/40 object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate flex items-center space-x-1">
                        <span>{localUser.username}</span>
                        <span className="text-[9px] text-emerald-400 font-normal">(Anda)</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {localUser.zone || 'Workstation'}
                      </div>
                    </div>
                  </div>

                  {/* Status & Media Indicators */}
                  <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                    {badge.label !== '-' ? (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-medium border flex items-center space-x-0.5 ${badge.color}`}
                      >
                        <IconComp className="w-2.5 h-2.5 mr-0.5" />
                        <span>{badge.label}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-mono">-</span>
                    )}

                    <div className="flex items-center space-x-0.5 text-slate-400">
                      {localUser.isMicOn ? (
                        <Mic className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <MicOff className="w-3 h-3 text-rose-400/70" />
                      )}
                      {localUser.isCamOn ? (
                        <Video className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <VideoOff className="w-3 h-3 text-slate-500" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Remote Players */}
            {remotePlayers.map((player) => {
              const badge = getActivityBadge({
                isSitting: player.isSitting,
                zone: player.zone,
                status: player.status,
                isMoving: player.isMoving,
              });
              const IconComp = badge.icon;
              const displayName = player.username || player.fullName || 'Rekan';

              return (
                <div
                  key={player.socketId}
                  className="pt-1.5 flex items-center justify-between p-1.5 rounded-lg hover:bg-[#1a2032] transition-colors"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <img
                      src={player.avatar || `/assets/characters/${player.archetype || 'resident'}/standing/south.png`}
                      alt={displayName}
                      className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-200 truncate">
                        {displayName}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {player.zone || 'Koridor'}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge & Media State */}
                  <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                    {badge.label !== '-' ? (
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-medium border flex items-center space-x-0.5 ${badge.color}`}
                      >
                        <IconComp className="w-2.5 h-2.5 mr-0.5" />
                        <span>{badge.label}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-mono">-</span>
                    )}

                    <div className="flex items-center space-x-0.5 text-slate-400">
                      {player.mediaState?.isMicOn ? (
                        <Mic className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <MicOff className="w-3 h-3 text-rose-400/70" />
                      )}
                      {player.mediaState?.isCamOn ? (
                        <Video className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <VideoOff className="w-3 h-3 text-slate-500" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Info */}
          <div className="px-3 py-1.5 bg-[#10141f] border-t border-[#2a324b] text-[10px] text-slate-500 flex items-center justify-between">
            <span>Server: Realtime Mesh</span>
            <span className="text-emerald-400 flex items-center space-x-1">
              <Radio className="w-2.5 h-2.5 animate-pulse" />
              <span>Sinkron</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

