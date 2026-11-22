import React, { useState, useEffect } from 'react';
import { Compass, ChevronDown, ChevronUp, MapPin, Eye } from 'lucide-react';
import { EventBus } from '../../game/EventBus';
import { PlayerPresence } from '../../types/multiplayer';

interface Props {
  currentZoneName?: string;
  remotePlayers: PlayerPresence[];
}

export const MinimapWidget: React.FC<Props> = ({
  currentZoneName = 'Workstation Utama',
  remotePlayers = [],
}) => {
  const [isMinimized, setIsMinimized] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return true;
    }
    return false;
  });
  const [localPos, setLocalPos] = useState({ x: 1375, y: 1260 });

  // Map world dimensions (Phaser map coordinate bounds)
  const WORLD_WIDTH = 2752;
  const WORLD_HEIGHT = 1536;

  // Minimap pixel dimensions
  const MINIMAP_WIDTH = 210;
  const MINIMAP_HEIGHT = Math.round(MINIMAP_WIDTH / (WORLD_WIDTH / WORLD_HEIGHT)); // ~117px

  useEffect(() => {
    const handleLocalPlayerPos = (data: { x: number; y: number }) => {
      if (data && typeof data.x === 'number' && typeof data.y === 'number') {
        setLocalPos({ x: data.x, y: data.y });
      }
    };

    EventBus.on('LOCAL_PLAYER_POSITION', handleLocalPlayerPos);
    return () => {
      EventBus.off('LOCAL_PLAYER_POSITION', handleLocalPlayerPos);
    };
  }, []);

  // Coordinate conversion helper: World coords -> Minimap pixel coords
  const toMiniX = (worldX: number) => Math.max(2, Math.min(MINIMAP_WIDTH - 2, (worldX / WORLD_WIDTH) * MINIMAP_WIDTH));
  const toMiniY = (worldY: number) => Math.max(2, Math.min(MINIMAP_HEIGHT - 2, (worldY / WORLD_HEIGHT) * MINIMAP_HEIGHT));

  return (
    <div className="absolute top-16 left-3 md:top-auto md:bottom-3 md:left-3 z-30 select-none pointer-events-auto transition-all duration-300">
      {isMinimized ? (
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="px-2.5 py-1.5 rounded-lg bg-[#0f172a]/95 text-soft border-2 border-teal shadow-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer hover:bg-teal transition-colors"
        >
          <Compass className="w-3.5 h-3.5 text-ochre" />
          <span>Radar Minimap</span>
          <ChevronUp className="w-3 h-3 text-soft" />
        </button>
      ) : (
        <div className="bg-[#0f172a]/95 backdrop-blur-md border-2 border-teal rounded-2xl p-2 shadow-2xl flex flex-col gap-1.5 w-[226px]">
          {/* Header */}
          <div className="flex items-center justify-between px-1 text-[10px] font-bold text-soft border-b border-teal/40 pb-1">
            <div className="flex items-center gap-1 text-ochre">
              <Compass className="w-3.5 h-3.5" />
              <span className="uppercase tracking-wider">Radar Kantor</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-teal-light font-mono truncate max-w-[85px]">
                {currentZoneName}
              </span>
              <button
                type="button"
                onClick={() => setIsMinimized(true)}
                className="text-slate-400 hover:text-soft cursor-pointer p-0.5"
                title="Sembunyikan Minimap"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Minimap Viewport Canvas / Area */}
          <div
            className="relative rounded-xl overflow-hidden bg-[#1e293b] border border-teal/50 shadow-inner"
            style={{ width: `${MINIMAP_WIDTH}px`, height: `${MINIMAP_HEIGHT}px` }}
          >
            {/* 1. Office Ground Texture Asset (Real Realistic Game Map) */}
            <img
              src="/assets/maps/rooms-ground.webp"
              alt="Denah Kantor Virtual"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none filter brightness-95 contrast-110"
            />

            {/* Subtle radar scanline & shading overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1d]/20 via-transparent to-[#0a0f1d]/40 pointer-events-none" />

            {/* Subtle Minimalist Zone Markers */}
            <span
              className="absolute text-[7px] font-mono font-bold text-amber-200/90 bg-black/50 px-1 py-0.2 rounded border border-amber-400/30 pointer-events-none"
              style={{ left: `${toMiniX(1920)}px`, top: `${toMiniY(120)}px` }}
            >
              Eksekutif
            </span>
            <span
              className="absolute text-[7px] font-mono font-bold text-amber-100/90 bg-black/50 px-1 py-0.2 rounded border border-amber-300/30 pointer-events-none"
              style={{ left: `${toMiniX(260)}px`, top: `${toMiniY(380)}px` }}
            >
              Rapat
            </span>
            <span
              className="absolute text-[7px] font-mono font-bold text-teal-200/90 bg-black/50 px-1 py-0.2 rounded border border-teal-400/30 pointer-events-none"
              style={{ left: `${toMiniX(260)}px`, top: `${toMiniY(1030)}px` }}
            >
              AFK / Pantry
            </span>
            <span
              className="absolute text-[7px] font-mono font-bold text-cyan-200/90 bg-black/50 px-1 py-0.2 rounded border border-cyan-400/30 pointer-events-none"
              style={{ left: `${toMiniX(1460)}px`, top: `${toMiniY(500)}px` }}
            >
              Workstation
            </span>

            {/* 2. Remote Players Dots */}
            {remotePlayers.map((player) => (
              <div
                key={player.socketId}
                className="absolute w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white -translate-x-1/2 -translate-y-1/2 shadow-sm z-10 transition-all duration-150"
                style={{
                  left: `${toMiniX(player.x)}px`,
                  top: `${toMiniY(player.y)}px`,
                }}
                title={`${player.fullName || player.username} (${player.zone || 'Kantor'})`}
              />
            ))}

            {/* 3. Local Player Pulsing Dot */}
            <div
              className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-20 transition-all duration-75"
              style={{
                left: `${toMiniX(localPos.x)}px`,
                top: `${toMiniY(localPos.y)}px`,
              }}
            >
              <span className="w-3.5 h-3.5 rounded-full bg-amber-400/60 animate-ping absolute" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white shadow-md relative" />
            </div>
          </div>

          {/* Minimap Legend */}
          <div className="flex items-center justify-between text-[9px] font-mono text-slate-300 px-1 pt-0.5">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Anda</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{remotePlayers.length} Rekan Online</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

