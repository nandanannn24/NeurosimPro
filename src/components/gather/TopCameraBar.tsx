import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ChevronUp,
  ChevronDown,
  Volume2,
  Users,
} from 'lucide-react';
import { PlayerPresence } from '../../types/multiplayer';

interface Props {
  isCamOn: boolean;
  isMicOn: boolean;
  onToggleCam: () => void;
  onToggleMic: () => void;
  userName: string;
  userAvatar?: string;
  remotePlayers: PlayerPresence[];
}

export const TopCameraBar: React.FC<Props> = ({
  isCamOn,
  isMicOn,
  onToggleCam,
  onToggleMic,
  userName,
  userAvatar,
  remotePlayers,
}) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  // Filter remote players who have their camera on
  const activeRemoteCams = remotePlayers.filter((p) => p.mediaState?.isCamOn);
  const totalActiveCams = (isCamOn ? 1 : 0) + activeRemoteCams.length;

  // Manage Local Camera Stream
  useEffect(() => {
    let stream: MediaStream | null = null;
    let isMounted = true;

    if (isCamOn) {
      if (navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({
            video: {
              width: { ideal: 480 },
              height: { ideal: 360 },
              facingMode: 'user',
              frameRate: { ideal: 24 },
            },
            audio: false,
          })
          .then((s) => {
            if (!isMounted) {
              s.getTracks().forEach((t) => t.stop());
              return;
            }
            stream = s;
            setLocalStream(s);
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = s;
              localVideoRef.current.play().catch(() => {});
            }
          })
          .catch((err) => {
            console.warn('[TopCameraBar] Akses kamera gagal:', err);
          });
      }
    } else {
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
        setLocalStream(null);
      }
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    }

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isCamOn]);

  // If no one has camera turned on, don't occupy top bar
  if (totalActiveCams === 0) {
    return null;
  }

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-300">
      {/* Minimized Pill */}
      {isMinimized ? (
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="pointer-events-auto px-3 py-1.5 rounded-full bg-[#0f172a]/95 text-soft border-2 border-teal shadow-xl text-xs font-bold flex items-center gap-2 cursor-pointer hover:bg-teal transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <Video className="w-3.5 h-3.5 text-soft" />
          <span>{totalActiveCams} Kamera Aktif (Klik untuk Buka)</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      ) : (
        /* Expanded Zoom-style Camera Strip */
        <div className="pointer-events-auto flex flex-col items-center gap-1">
          <div className="bg-[#0f172a]/90 backdrop-blur-md border-2 border-teal/70 rounded-2xl p-2 shadow-2xl flex items-center gap-2.5 max-w-[92vw] overflow-x-auto">
            {/* 1. Local Player Video Tile (if cam is on) */}
            {isCamOn && (
              <div className="relative w-36 h-24 sm:w-44 sm:h-28 rounded-xl overflow-hidden bg-black/90 border border-teal/60 flex-shrink-0 shadow-sm group">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />

                {/* Local User Badge */}
                <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between text-[10px] bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-md text-soft font-bold">
                  <span className="truncate max-w-[90px]">{userName} (Anda)</span>
                  <div className="flex items-center gap-1">
                    {isMicOn ? (
                      <Mic className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <MicOff className="w-3 h-3 text-red-400" />
                    )}
                  </div>
                </div>

                <div className="absolute top-1.5 left-1.5">
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal text-soft font-black uppercase">
                    Anda
                  </span>
                </div>
              </div>
            )}

            {/* 2. Remote Players With Active Camera */}
            {activeRemoteCams.map((remote) => (
              <div
                key={remote.socketId}
                className="relative w-36 h-24 sm:w-44 sm:h-28 rounded-xl overflow-hidden bg-black/90 border border-teal/40 flex-shrink-0 shadow-sm group flex items-center justify-center"
              >
                {/* Fallback stylized avatar video simulator or WebRTC stream */}
                <div className="w-full h-full bg-[#1e293b] flex flex-col items-center justify-center p-2 text-center">
                  <div className="w-10 h-10 rounded-full bg-teal/20 border border-teal/50 overflow-hidden mb-1 flex items-center justify-center">
                    <img
                      src={remote.avatar || '/assets/characters/resident/standing/south.png'}
                      alt={remote.fullName}
                      className="w-full h-full object-contain pixelated scale-125"
                    />
                  </div>
                  <span className="text-[10px] font-bold text-soft truncate max-w-[120px]">
                    {remote.fullName || remote.username}
                  </span>
                </div>

                {/* Remote Participant Nametag & Mic Status */}
                <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between text-[10px] bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-md text-soft font-bold">
                  <span className="truncate max-w-[100px]">{remote.fullName.split(' ')[0] || remote.username}</span>
                  <div>
                    {remote.mediaState?.isMicOn ? (
                      <Mic className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <MicOff className="w-3 h-3 text-red-400" />
                    )}
                  </div>
                </div>

                <div className="absolute top-1.5 right-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse block" />
                </div>
              </div>
            ))}

            {/* Minimize Button */}
            <button
              type="button"
              onClick={() => setIsMinimized(true)}
              className="p-1 rounded-lg bg-sand/20 hover:bg-sand/40 text-soft text-xs transition-colors cursor-pointer self-start ml-1"
              title="Perkecil Tampilan Video (Nonaktifkan Tampilan)"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

