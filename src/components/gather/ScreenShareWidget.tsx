import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  ScreenShare,
  Maximize2,
  Minimize2,
  Tv,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { EventBus, GAME_EVENTS } from '../../game/EventBus';
import { webrtcService } from '../../services/webrtc.service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  isViewerMode?: boolean; // true jika sedang melihat presentasi orang lain
  presenterName?: string;
  presenterSocketId?: string;
}

export const ScreenShareWidget: React.FC<Props> = ({
  isOpen,
  onClose,
  userName = 'Pengguna (Anda)',
  isViewerMode = false,
  presenterName = 'Rekan Kerja',
  presenterSocketId,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Sambungkan remote WebRTC stream jika tersedia
  useEffect(() => {
    if (isViewerMode && isOpen && remoteVideoRef.current && presenterSocketId) {
      const remoteStream = webrtcService.getRemoteStream(presenterSocketId);
      if (remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(console.warn);
      }
    }
  }, [isViewerMode, isOpen, presenterSocketId]);

  useEffect(() => {
    // 1. Jika ditutup (isOpen = false), bersihkan stream yang ada
    if (!isOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      webrtcService.stopScreenShareStream().catch(console.warn);
      setIsStreaming(false);
      setIsExpanded(false);
      EventBus.emit(GAME_EVENTS.SCREEN_SHARE_CHANGED, { isSharing: false });
      EventBus.emit(GAME_EVENTS.RESUME_INPUT);
      return;
    }

    // 2. Jika sedang melihat presentasi orang lain, gunakan mode viewer gambar / remote stream
    if (isViewerMode) {
      setIsStreaming(true);
      return;
    }

    // 3. PENTING: Jika stream sudah aktif, JANGAN minta izin lagi ke browser!
    if (streamRef.current && streamRef.current.active) {
      if (videoRef.current && videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
      setIsStreaming(true);
      return;
    }

    // Broadcast ke Phaser 2D bahwa pemain sedang berbagi layar
    EventBus.emit(GAME_EVENTS.SCREEN_SHARE_CHANGED, {
      isSharing: true,
      sharerName: userName,
    });

    let isMounted = true;

    if (navigator.mediaDevices?.getDisplayMedia) {
      // Kunci pergerakan dan reset tombol WASD sebelum dialog izin browser terbuka
      EventBus.emit(GAME_EVENTS.PAUSE_INPUT);

      // Inisialisasi CaptureController untuk Conditional Focus (Chrome/Edge 107+)
      let controller: any = null;
      if (typeof (window as any).CaptureController !== 'undefined') {
        try {
          controller = new (window as any).CaptureController();
        } catch (e) {
          console.debug('CaptureController not supported:', e);
        }
      }

      const displayOptions: any = {
        video: {
          cursor: 'always',
        },
        audio: false,
        selfBrowserSurface: 'include',
        surfaceSwitching: 'exclude',
      };
      if (controller) {
        displayOptions.controller = controller;
      }

      navigator.mediaDevices
        .getDisplayMedia(displayOptions)
        .then((s) => {
          if (!isMounted) {
            s.getTracks().forEach((track) => track.stop());
            return;
          }

          // CONDITIONAL FOCUS:
          // Mencegah peramban otomatis mengalihkan fokus ke tab atau jendela yang dibagikan
          if (controller && typeof controller.setFocusBehavior === 'function') {
            try {
              const [videoTrack] = s.getVideoTracks();
              const surface = videoTrack?.getSettings()?.displaySurface;
              if (surface !== 'monitor') {
                controller.setFocusBehavior('no-focus-change');
              }
            } catch (focusErr) {
              console.debug('Conditional focus suppression ignored:', focusErr);
            }
          }

          // Pastikan jendela aplikasi Virtual Office tetap fokus
          try {
            window.focus();
          } catch {}

          // Buka kembali kendali pemain di 2D setelah dialog selesai
          EventBus.emit(GAME_EVENTS.RESUME_INPUT);

          streamRef.current = s;
          webrtcService.startScreenShareStream(s).catch(console.warn);

          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().catch(console.error);
              if (isMounted) setIsStreaming(true);
            };
          }

          // Otomatis stop saat user menutup sharing dari browser floating banner
          const videoTrack = s.getVideoTracks()[0];
          if (videoTrack) {
            videoTrack.onended = () => {
              if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
                streamRef.current = null;
              }
              webrtcService.stopScreenShareStream().catch(console.warn);
              onCloseRef.current();
            };
          }
        })
        .catch((err) => {
          console.warn('[ScreenShareWidget] Berbagi layar dibatalkan atau ditolak:', err);
          EventBus.emit(GAME_EVENTS.RESUME_INPUT);
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
          }
          webrtcService.stopScreenShareStream().catch(console.warn);
          onCloseRef.current();
        });
    } else {
      onCloseRef.current();
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, isViewerMode, userName]);

  // Bersihkan track saat komponen unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      webrtcService.stopScreenShareStream().catch(console.warn);
    };
  }, []);

  if (!isOpen) return null;

  // KONDISI 1: JIKA MELIHAT PRESENTASI ORANG LAIN
  if (isViewerMode) {
    const remoteStream = presenterSocketId ? webrtcService.getRemoteStream(presenterSocketId) : null;

    return (
      <div
        className={`fixed z-50 bg-[#0b0e14] border-2 border-brass rounded-xl shadow-2xl overflow-hidden flex flex-col select-none ${
          isExpanded
            ? 'inset-3 sm:inset-6'
            : 'bottom-20 right-4 w-[92vw] sm:w-[500px] md:w-[620px] aspect-video max-h-[75vh]'
        }`}
        style={{ filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.6))' }}
      >
        {/* Header */}
        <div className="px-3.5 py-2 bg-[#1b2230] text-soft flex items-center justify-between text-xs font-semibold border-b border-brass/40 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <Tv className="w-3.5 h-3.5 text-brass flex-shrink-0" />
            <span className="font-bold truncate text-white">
              Tayangan Presentasi: {presenterName}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsExpanded((e) => !e)}
              title={isExpanded ? 'Perkecil Layar' : 'Layar Penuh'}
              className="p-1 text-soft/80 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Tutup Tayangan"
              className="p-1 text-soft/80 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Remote Video Stream jika ada, jika tidak render layout visual presisi */}
        {remoteStream ? (
          <div className="relative w-full flex-1 bg-black flex items-center justify-center overflow-hidden">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div
            className={`relative w-full p-4 sm:p-5 flex flex-col justify-between bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0a0f1d] text-soft overflow-hidden ${
              isExpanded ? 'flex-1 min-h-0' : 'aspect-video'
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brass" />
                <h4 className="font-bold text-xs sm:text-sm text-white">
                  Sesi Kolaborasi: Virtual Office Remote Teams
                </h4>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                ● Live Presentation
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 my-auto py-2">
              <div className="p-2.5 rounded bg-white/5 border border-white/10">
                <span className="text-xs font-bold text-brass block">1. Denah Kantor 2D</span>
                <p className="text-[10px] text-soft/80 mt-1 leading-relaxed">
                  Navigasi avatar real-time, proximity spatial audio, dan collision interaktif.
                </p>
              </div>
              <div className="p-2.5 rounded bg-white/5 border border-white/10">
                <span className="text-xs font-bold text-teal block">2. Kolaborasi WFH/WFA</span>
                <p className="text-[10px] text-soft/80 mt-1 leading-relaxed">
                  Komunikasi langsung antar karyawan, meja workstation bersama, dan ruang rapat.
                </p>
              </div>
              <div className="p-2.5 rounded bg-white/5 border border-white/10">
                <span className="text-xs font-bold text-emerald-400 block">3. Multi-Device Realtime</span>
                <p className="text-[10px] text-soft/80 mt-1 leading-relaxed">
                  Sinkronisasi WebRTC, agenda pekerjaan terpadu, dan monitoring terpusat.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-soft/60 pt-2 border-t border-white/10">
              <span>Dipresentasikan oleh {presenterName}</span>
              <div className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>Tayangan Presentasi Aktif</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // KONDISI 2: KETIKA KITA SENDIRI YANG LIVE (Versi solid clean PIP seperti commit 7b6b31d tanpa efek ketarik)
  return (
    <div
      className={`fixed z-40 bg-black rounded-xl border-2 border-brass shadow-2xl overflow-hidden flex flex-col select-none ${
        isExpanded
          ? 'inset-4 sm:inset-8 z-50'
          : 'bottom-20 right-4 w-72 sm:w-96 aspect-video'
      }`}
      style={{ filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.5))' }}
    >
      {/* Widget Header Asli */}
      <div className="px-3 py-1.5 bg-[#242a38] text-soft flex items-center justify-between text-xs font-semibold border-b border-[#355c5a]/40 flex-shrink-0">
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <ScreenShare className="w-3.5 h-3.5 text-brass flex-shrink-0" />
          <span className="truncate">Berbagi Layar: {userName}</span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsExpanded((e) => !e)}
            title={isExpanded ? 'Kecilkan Tampilan PIP' : 'Perbesar Tampilan'}
            className="p-1 text-soft/80 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Hentikan Berbagi Layar"
            className="p-1 text-soft/80 hover:text-brick hover:bg-white/10 rounded transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Real Live Screen Video Stream */}
      <div className="relative flex-1 w-full h-full bg-[#0b0e14] flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-contain ${isStreaming ? 'block' : 'hidden'}`}
        />

        {!isStreaming && (
          <div className="flex flex-col items-center justify-center text-soft/70 space-y-2 p-4 text-center">
            <ScreenShare className="w-7 h-7 text-brass animate-bounce" />
            <p className="text-xs font-mono">Menghubungkan siaran layar...</p>
          </div>
        )}
      </div>

      {/* Control bar bawah */}
      <div className="px-3 py-1.5 bg-[#1b202a] border-t border-white/10 flex items-center justify-between text-xs text-soft/80 flex-shrink-0">
        <span className="text-[10px] text-soft/60">Siaran Layar Aktif</span>
        <button
          type="button"
          onClick={onClose}
          className="px-2.5 py-0.5 bg-brick text-soft rounded text-[11px] font-semibold hover:bg-brick/90 transition-colors cursor-pointer"
        >
          Hentikan Berbagi
        </button>
      </div>
    </div>
  );
};
