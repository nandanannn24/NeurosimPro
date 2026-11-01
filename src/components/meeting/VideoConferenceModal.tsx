import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Maximize2,
  Minimize2,
  Pin,
  PinOff,
  ScreenShare,
  Users,
  Grid,
  ShieldAlert,
  Volume2,
  Copy,
  Check,
  Radio,
  Clock,
  Layers,
  Send,
  Lock,
  Unlock,
  UserX,
  VolumeX,
  PhoneOff,
  Smile,
  Megaphone,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  MeetingSession,
  MeetingParticipant,
  MeetingViewMode,
  BreakoutRoom,
} from '../../types/meeting';
import { meetingService } from '../../services/meeting.service';
import { webrtcService } from '../../services/webrtc.service';
import { multiplayerService } from '../../services/multiplayer.service';
import { PlayerPresence } from '../../types/multiplayer';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  meeting: MeetingSession | null;
  currentUser: {
    id: number | string;
    username: string;
    fullName: string;
    role?: string;
    avatar?: string;
  };
  remotePlayers: PlayerPresence[];
}

export const VideoConferenceModal: React.FC<Props> = ({
  isOpen,
  onClose,
  meeting,
  currentUser,
  remotePlayers,
}) => {
  const [viewMode, setViewMode] = useState<MeetingViewMode>('gallery');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isScreenSharePickerOpen, setIsScreenSharePickerOpen] = useState(false);
  const [screenShareMode, setScreenShareMode] = useState<'public' | 'target'>('public');
  const [targetColleagueName, setTargetColleagueName] = useState('');

  // Discord-style Screen Share Zoom & Pan Controls
  const [screenZoom, setScreenZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  const handleScreenWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScreenZoom((prev) => {
      const next = e.deltaY < 0 ? Math.min(3.0, prev + 0.25) : Math.max(1.0, prev - 0.25);
      if (next === 1.0) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleScreenMouseDown = (e: React.MouseEvent) => {
    if (screenZoom <= 1.0) return;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleScreenMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || screenZoom <= 1.0) return;
    setPanOffset({
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y,
    });
  };

  const handleScreenMouseUp = () => setIsPanning(false);

  const handleResetZoom = () => {
    setScreenZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleZoomIn = () => setScreenZoom((prev) => Math.min(3.0, prev + 0.25));
  const handleZoomOut = () =>
    setScreenZoom((prev) => {
      const next = Math.max(1.0, prev - 0.25);
      if (next === 1.0) setPanOffset({ x: 0, y: 0 });
      return next;
    });

  const handleToggleZoom = () => {
    if (screenZoom > 1.0) {
      handleResetZoom();
    } else {
      setScreenZoom(1.75);
    }
  };
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Drawers & Panels
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isBreakoutModalOpen, setIsBreakoutModalOpen] = useState(false);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [meetingChat, setMeetingChat] = useState<Array<{ id: string; sender: string; text: string; time: string; isSelf: boolean }>>([]);

  // Breakout Setup Form (Host)
  const [breakoutCount, setBreakoutCount] = useState(2);
  const [breakoutMinutes, setBreakoutMinutes] = useState(15);
  const [breakoutMethod, setBreakoutMethod] = useState<'auto' | 'manual' | 'random'>('auto');

  // Media streams
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);

  // Meeting Timer
  const [durationSec, setDurationSec] = useState(0);

  const isHost = meeting ? meeting.hostId === String(currentUser.id) || meeting.hostName === currentUser.fullName : false;
  const currentParticipant = meeting?.participants.find((p) => p.id === String(currentUser.id));
  const activeBreakout = meeting?.breakoutRooms.find((br) => br.id === currentParticipant?.currentRoomId);

  // Timer
  useEffect(() => {
    if (!isOpen) {
      setDurationSec(0);
      return;
    }
    const timer = setInterval(() => {
      setDurationSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  const formatDuration = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // WebRTC Setup
  useEffect(() => {
    if (!isOpen) {
      webrtcService.stopLocalStream();
      setLocalStream(null);
      return;
    }

    webrtcService.getOrCreateLocalStream(isCamOn, isMicOn).then((stream) => {
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }
      for (const p of remotePlayers) {
        webrtcService.connectToPeer(p.socketId, true);
      }
    }).catch(() => {});

    const unsubStream = webrtcService.onStream(({ socketId, stream }) => {
      setRemoteStreams((prev) => new Map(prev).set(socketId, stream));
    });

    const unsubRemoved = webrtcService.onStreamRemoved((socketId) => {
      setRemoteStreams((prev) => {
        const next = new Map(prev);
        next.delete(socketId);
        return next;
      });
    });

    const unsubSpeaking = webrtcService.onSpeakingChange((speaking) => {
      setIsLocalSpeaking(speaking);
    });

    return () => {
      unsubStream();
      unsubRemoved();
      unsubSpeaking();
    };
  }, [isOpen]);

  // Connect to new peers
  useEffect(() => {
    if (!isOpen) return;
    for (const player of remotePlayers) {
      if (!remoteStreams.has(player.socketId)) {
        webrtcService.connectToPeer(player.socketId, false);
      }
    }
  }, [isOpen, remotePlayers, remoteStreams]);

  const toggleMic = () => {
    const next = !isMicOn;
    setIsMicOn(next);
    webrtcService.setAudioEnabled(next);
    meetingService.updateMediaState(String(currentUser.id), { isMicOn: next });
    multiplayerService.sendMediaState({ isMicOn: next });
  };

  const toggleCam = () => {
    const next = !isCamOn;
    setIsCamOn(next);
    webrtcService.setVideoEnabled(next);
    meetingService.updateMediaState(String(currentUser.id), { isCamOn: next });
    multiplayerService.sendMediaState({ isCamOn: next });
  };

  const handleScreenShareClick = () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      setIsScreenSharePickerOpen(true);
    }
  };

  const stopScreenShare = () => {
    setIsScreenSharing(false);
    webrtcService.getOrCreateLocalStream(isCamOn, isMicOn).then((stream) => {
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    });
    meetingService.updateMediaState(String(currentUser.id), { isScreenSharing: false });
    multiplayerService.sendMediaState({ isScreenSharing: false });
  };

  const startScreenShare = async () => {
    setIsScreenSharePickerOpen(false);
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) return;
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setIsScreenSharing(true);
      setLocalStream(screenStream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
        localVideoRef.current.play().catch(() => {});
      }
      meetingService.updateMediaState(String(currentUser.id), { isScreenSharing: true });
      multiplayerService.sendMediaState({ isScreenSharing: true });

      screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (e) {
      console.warn('Screen share cancelled:', e);
    }
  };

  const copyMeetingLink = () => {
    const url = `${window.location.origin}?meet=${meeting?.code || 'HQ-MEET'}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const msg = {
      id: `chat-${Date.now()}`,
      sender: currentUser.fullName.split(' ')[0],
      text: chatInput.trim(),
      time: timeStr,
      isSelf: true,
    };
    setMeetingChat((prev) => [...prev, msg]);
    multiplayerService.sendChat(chatInput.trim());
    setChatInput('');
  };

  const handleCreateBreakouts = () => {
    meetingService.createBreakoutRooms(
      {
        meetingId: meeting?.id || '',
        count: breakoutCount,
        durationMinutes: breakoutMinutes,
        assignmentMethod: breakoutMethod,
      },
      String(currentUser.id)
    );
    meetingService.openBreakoutRooms(String(currentUser.id));
    setIsBreakoutModalOpen(false);
  };

  const handleBroadcastMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    meetingService.broadcastToAllBreakouts(String(currentUser.id), broadcastText.trim());
    setBroadcastText('');
    setIsBroadcastOpen(false);
  };

  if (!isOpen) return null;

  // Filter participants depending on Room Isolation (Breakout Room vs Main Meeting)
  const isUserInBreakout = Boolean(activeBreakout);
  const visibleRemotePlayers = remotePlayers.filter((p) => {
    if (!isUserInBreakout) {
      // Main room: show participants who are also in the main room
      return true;
    }
    // Inside Breakout Room: only show participants assigned to this specific breakout room!
    return activeBreakout?.participants.some((bp) => bp.name.includes(p.username) || bp.name.includes(p.fullName));
  });

  // Remote screen sharer detection
  const remoteScreenSharer = visibleRemotePlayers.find((p) => Boolean(p.mediaState?.isScreenSharing));
  const hasActiveScreenShare = isScreenSharing || Boolean(remoteScreenSharer);
  const remoteScreenStream = remoteScreenSharer ? remoteStreams.get(remoteScreenSharer.socketId) : null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col bg-[#0b1120] text-slate-100 select-none animate-in fade-in duration-200 ${
        isFullScreen ? 'p-0' : 'p-2 sm:p-4'
      }`}
    >
      <div className="flex-1 w-full h-full flex flex-col bg-[#0f172a] rounded-2xl border border-teal/40 shadow-2xl overflow-hidden relative">
        {/* =================================================================== */}
        {/* 1. TOP BAR: Title, Timer, Breakout Status, View Switcher & Host Pill */}
        {/* =================================================================== */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-700/60 bg-[#162032] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal/20 border border-teal/40 flex items-center justify-center text-teal">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm sm:text-base text-white truncate max-w-[220px] sm:max-w-md">
                  {meeting?.title || 'NeuroSim Pro Conference Suite'}
                </h1>
                {isHost && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300">
                    Host
                  </span>
                )}
                {isUserInBreakout && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal/20 border border-teal text-teal flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    <span>{activeBreakout?.name}</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-mono text-teal">{meeting?.code || 'HQ-MEET-01'}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <span className="font-mono text-emerald-300 font-semibold">{formatDuration(durationSec)}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Center: Breakout Room Countdown (if active) */}
          {meeting?.isBreakoutActive && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-500/15 border border-amber-500/40 rounded-full text-xs text-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Sesi Breakout Room Aktif:</span>
              <span className="font-mono font-bold text-amber-300">
                {activeBreakout ? formatDuration(activeBreakout.remainingSeconds) : 'Sedang Berjalan'}
              </span>
              {isUserInBreakout && (
                <button
                  type="button"
                  onClick={() => meetingService.returnToMainMeeting(String(currentUser.id))}
                  className="ml-2 px-2 py-0.5 bg-amber-500/30 hover:bg-amber-500/50 rounded text-[10px] font-bold transition-colors cursor-pointer"
                >
                  Kembali ke Utama
                </button>
              )}
            </div>
          )}

          {/* Right Actions: Copy link, View switcher, Fullscreen, Close */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyMeetingLink}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer border border-slate-700"
              title="Salin tautan undangan meeting"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedLink ? 'Tersalin!' : 'Undang'}</span>
            </button>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('gallery')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'gallery' ? 'bg-teal text-soft font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Tampilan Kisi (Gallery View)"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('speaker')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'speaker' ? 'bg-teal text-soft font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Tampilan Pembicara (Speaker View)"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title={isFullScreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Tutup Jendela Meeting"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. MAIN STAGE: Video Grid / Speaker Stage & Screen Share Viewport   */}
        {/* =================================================================== */}
        <div className="flex-1 w-full min-h-0 relative overflow-hidden p-3 flex gap-3">
          {/* Main Participant Video Stage */}
          <div className="flex-1 w-full h-full relative overflow-y-auto rounded-xl">
            {hasActiveScreenShare ? (
              <div className="w-full h-full flex flex-col gap-3">
                {/* Discord Stage / Screen Share Viewport with Interactive Zoom & Pan */}
                <div
                  className="flex-1 w-full bg-[#111214] rounded-xl overflow-hidden border border-[#2b2d31] relative flex items-center justify-center select-none"
                  onWheel={handleScreenWheel}
                  onMouseDown={handleScreenMouseDown}
                  onMouseMove={handleScreenMouseMove}
                  onMouseUp={handleScreenMouseUp}
                  onMouseLeave={handleScreenMouseUp}
                  onDoubleClick={handleToggleZoom}
                >
                  {/* Top Stream Status Bar */}
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-2 pointer-events-none">
                    <span className="px-2 py-0.5 bg-[#f23f43] text-white text-[10px] font-black rounded tracking-wider flex items-center gap-1 shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      LIVE
                    </span>
                    <div className="px-2.5 py-1 bg-[#1e1f22]/90 backdrop-blur-md border border-[#2b2d31] rounded-md text-xs font-bold text-white shadow-sm">
                      {isScreenSharing
                        ? `${currentUser.fullName}'s Screen`
                        : `${remoteScreenSharer?.fullName || 'Rekan'}'s Screen`}
                    </div>
                    <span className="px-2 py-0.5 bg-[#2b2d31]/80 text-[#b5bac1] text-[10px] font-mono rounded">
                      1080p 60FPS
                    </span>
                  </div>

                  {/* Screen Video Container with Zoom and Pan */}
                  <div
                    className="w-full h-full flex items-center justify-center overflow-hidden"
                    style={{
                      cursor: screenZoom > 1.0 ? (isPanning ? 'grabbing' : 'grab') : 'default',
                    }}
                  >
                    {isScreenSharing && localStream ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="max-w-full max-h-full object-contain pointer-events-none transition-transform duration-75"
                        style={{
                          transform: `scale(${screenZoom}) translate(${panOffset.x / screenZoom}px, ${panOffset.y / screenZoom}px)`,
                        }}
                      />
                    ) : remoteScreenStream ? (
                      <video
                        autoPlay
                        playsInline
                        ref={(el) => {
                          if (el && remoteScreenStream && el.srcObject !== remoteScreenStream) {
                            el.srcObject = remoteScreenStream;
                            el.play().catch(() => {});
                          }
                        }}
                        className="max-w-full max-h-full object-contain pointer-events-none transition-transform duration-75"
                        style={{
                          transform: `scale(${screenZoom}) translate(${panOffset.x / screenZoom}px, ${panOffset.y / screenZoom}px)`,
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-6 text-[#949ba4]">
                        <ScreenShare className="w-12 h-12 mb-2 text-[#5865F2] animate-bounce" />
                        <p className="text-sm font-semibold text-white">Layar Sedang Dibagikan</p>
                        <p className="text-xs text-[#949ba4] mt-1">
                          Scroll mouse atau gunakan tombol untuk zoom & pan seperti Discord.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Discord-style Floating Zoom HUD */}
                  <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 bg-[#1e1f22]/95 border border-[#2b2d31] p-1 rounded-lg shadow-xl backdrop-blur-md">
                    <button
                      type="button"
                      onClick={handleZoomOut}
                      disabled={screenZoom <= 1.0}
                      className="p-1.5 text-[#dbdee1] hover:text-white hover:bg-[#35373c] disabled:opacity-40 disabled:hover:bg-transparent rounded cursor-pointer transition-colors"
                      title="Zoom Out (Scroll Down)"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 text-xs font-mono font-bold text-white min-w-[48px] text-center select-none">
                      {Math.round(screenZoom * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={handleZoomIn}
                      disabled={screenZoom >= 3.0}
                      className="p-1.5 text-[#dbdee1] hover:text-white hover:bg-[#35373c] disabled:opacity-40 disabled:hover:bg-transparent rounded cursor-pointer transition-colors"
                      title="Zoom In (Scroll Up)"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-[1px] h-4 bg-[#35373c] mx-0.5" />
                    <button
                      type="button"
                      onClick={handleResetZoom}
                      className="px-2 py-1 text-[10px] font-bold text-[#dbdee1] hover:text-white hover:bg-[#35373c] rounded cursor-pointer transition-colors"
                      title="Reset / Fit Layar"
                    >
                      Fit
                    </button>
                  </div>

                  {/* Floating Drag Hint */}
                  {screenZoom > 1.0 && (
                    <div className="absolute bottom-3 left-3 z-20 px-2.5 py-1 bg-black/70 backdrop-blur-md text-[11px] text-[#dbdee1] rounded border border-white/10 pointer-events-none">
                      Drag mouse untuk geser layar • Double click untuk reset
                    </div>
                  )}
                </div>

                {/* Discord Bottom Filmstrip */}
                <div className="h-24 flex items-center gap-2 overflow-x-auto p-1.5 bg-[#1e1f22] rounded-xl border border-[#2b2d31] flex-shrink-0">
                  <div
                    className={`h-full aspect-video bg-[#2b2d31] rounded-lg overflow-hidden border flex items-center justify-center flex-shrink-0 relative transition-all ${
                      isLocalSpeaking
                        ? 'border-[#23a55a] ring-2 ring-[#23a55a] shadow-[0_0_12px_rgba(35,165,90,0.6)]'
                        : 'border-[#313338]'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#1e1f22] overflow-hidden">
                      <img src={currentUser.avatar} alt="" className="w-full h-full object-contain pixelated" />
                    </div>
                    <span className="absolute bottom-1 left-1.5 text-[10px] bg-black/70 px-1 rounded text-white truncate max-w-[80%] font-semibold">
                      {currentUser.fullName.split(' ')[0]} (Anda)
                    </span>
                    <div className="absolute bottom-1 right-1">
                      {isMicOn ? (
                        <span className="w-2 h-2 rounded-full bg-[#23a55a] block" />
                      ) : (
                        <MicOff className="w-2.5 h-2.5 text-[#f23f43]" />
                      )}
                    </div>
                  </div>

                  {visibleRemotePlayers.map((p) => {
                    const isSpeaking = Boolean(p.mediaState?.isSpeaking);
                    const isMic = Boolean(p.mediaState?.isMicOn);
                    return (
                      <div
                        key={p.socketId}
                        className={`h-full aspect-video bg-[#2b2d31] rounded-lg overflow-hidden border flex items-center justify-center flex-shrink-0 relative transition-all ${
                          isSpeaking
                            ? 'border-[#23a55a] ring-2 ring-[#23a55a] shadow-[0_0_12px_rgba(35,165,90,0.6)]'
                            : 'border-[#313338]'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-[#1e1f22] overflow-hidden">
                          <img src={p.avatar} alt="" className="w-full h-full object-contain pixelated" />
                        </div>
                        <span className="absolute bottom-1 left-1.5 text-[10px] bg-black/70 px-1 rounded text-white truncate max-w-[80%] font-semibold">
                          {p.fullName.split(' ')[0]}
                        </span>
                        <div className="absolute bottom-1 right-1">
                          {isMic ? (
                            <span className="w-2 h-2 rounded-full bg-[#23a55a] block" />
                          ) : (
                            <MicOff className="w-2.5 h-2.5 text-[#f23f43]" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : viewMode === 'gallery' ? (
              <div
                className={`w-full h-full grid gap-3 p-1 ${
                  1 + visibleRemotePlayers.length <= 1
                    ? 'grid-cols-1'
                    : 1 + visibleRemotePlayers.length === 2
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : 1 + visibleRemotePlayers.length <= 4
                    ? 'grid-cols-2'
                    : 'grid-cols-2 sm:grid-cols-3'
                } auto-rows-fr items-center justify-center`}
              >
                {/* 1. Local Video Tile */}
                <div
                  className={`relative w-full h-full min-h-[160px] bg-slate-900 rounded-xl overflow-hidden border transition-all duration-200 flex items-center justify-center group ${
                    isLocalSpeaking
                      ? 'border-emerald-400 ring-2 ring-emerald-400/80 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                      : 'border-slate-800 hover:border-teal/60'
                  }`}
                >
                  {isCamOn && localStream ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-4">
                      <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-teal/40 flex items-center justify-center overflow-hidden">
                        <img src={currentUser.avatar || '/assets/characters/resident/standing/south.png'} alt={currentUser.fullName} className="w-full h-full object-contain pixelated" />
                      </div>
                      <span className="text-xs font-semibold text-slate-300 mt-2">
                        {currentUser.fullName} (Anda)
                      </span>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                    <div className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] text-white flex items-center gap-1.5 font-bold">
                      <span className={`w-2 h-2 rounded-full ${isLocalSpeaking ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                      <span>{currentUser.fullName} (Anda)</span>
                    </div>
                    <div className={`p-1.5 rounded-full backdrop-blur-md ${isMicOn ? 'bg-emerald-500/80' : 'bg-red-500/80'} text-white`}>
                      {isMicOn ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                    </div>
                  </div>
                </div>

                {/* 2. Remote Participants Tiles */}
                {visibleRemotePlayers.map((player) => {
                  const stream = remoteStreams.get(player.socketId);
                  const isCam = Boolean(player.mediaState?.isCamOn);
                  const isMic = Boolean(player.mediaState?.isMicOn);
                  const isSpeaking = Boolean(player.mediaState?.isSpeaking);

                  return (
                    <div
                      key={player.socketId}
                      className={`relative w-full h-full min-h-[160px] bg-slate-900 rounded-xl overflow-hidden border transition-all duration-200 flex items-center justify-center group ${
                        isSpeaking
                          ? 'border-emerald-400 ring-2 ring-emerald-400/80 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                          : 'border-slate-800 hover:border-teal/60'
                      }`}
                    >
                      {isCam && stream ? (
                        <video
                          autoPlay
                          playsInline
                          ref={(el) => {
                            if (el && stream && el.srcObject !== stream) {
                              el.srcObject = stream;
                              el.play().catch(() => {});
                            }
                          }}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4">
                          <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden">
                            <img src={player.avatar || '/assets/characters/resident/standing/south.png'} alt={player.fullName} className="w-full h-full object-contain pixelated" />
                          </div>
                          <span className="text-xs font-semibold text-slate-300 mt-2">{player.fullName}</span>
                        </div>
                      )}

                      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                        <div className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] text-white flex items-center gap-1.5 font-bold">
                          <span className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                          <span>{player.fullName}</span>
                        </div>
                        <div className={`p-1.5 rounded-full backdrop-blur-md ${isMic ? 'bg-emerald-500/80' : 'bg-red-500/80'} text-white`}>
                          {isMic ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Speaker View */
              <div className="w-full h-full flex flex-col gap-3">
                <div className="flex-1 w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800 relative flex items-center justify-center">
                  {isCamOn && localStream ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-contain transform -scale-x-100"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-teal flex items-center justify-center overflow-hidden">
                        <img src={currentUser.avatar} alt={currentUser.fullName} className="w-full h-full object-contain pixelated" />
                      </div>
                      <span className="text-sm font-bold text-white mt-3">{currentUser.fullName}</span>
                    </div>
                  )}
                </div>

                {/* Filmstrip at Bottom */}
                <div className="h-28 flex items-center gap-2 overflow-x-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800">
                  {visibleRemotePlayers.map((p) => (
                    <div key={p.socketId} className="h-full aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center flex-shrink-0 relative">
                      <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden">
                        <img src={p.avatar} alt={p.fullName} className="w-full h-full object-contain pixelated" />
                      </div>
                      <span className="absolute bottom-1 left-1 text-[10px] bg-black/70 px-1.5 rounded text-white truncate max-w-[80%]">
                        {p.fullName.split(' ')[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ================================================================= */}
          {/* Side Drawer: In-Meeting Realtime Chat                             */}
          {/* ================================================================= */}
          {isChatOpen && (
            <div className="w-72 sm:w-80 h-full bg-[#131b2e] rounded-xl border border-slate-700/80 flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-200">
              <div className="flex items-center justify-between p-3 border-b border-slate-700/60 bg-[#162032]">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Obrolan Meeting</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsChatOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {meetingChat.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs py-8">
                    <p>Belum ada pesan obrolan.</p>
                    <p className="text-[11px] mt-1">Gunakan chat untuk koordinasi selama video conference.</p>
                  </div>
                ) : (
                  meetingChat.map((m) => (
                    <div key={m.id} className={`flex flex-col ${m.isSelf ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-0.5">
                        <span className="font-semibold text-slate-300">{m.sender}</span>
                        <span>{m.time}</span>
                      </div>
                      <div className={`p-2 rounded-lg text-xs max-w-[85%] break-words ${
                        m.isSelf ? 'bg-teal text-soft rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleSendChat} className="p-2 border-t border-slate-700/60 flex items-center gap-1.5">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ketik pesan..."
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal"
                />
                <button
                  type="submit"
                  className="p-2 bg-teal hover:bg-teal-dark rounded-lg text-soft transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* ================================================================= */}
          {/* Side Drawer: Participant List & Host Actions                      */}
          {/* ================================================================= */}
          {isParticipantsOpen && (
            <div className="w-72 sm:w-80 h-full bg-[#131b2e] rounded-xl border border-slate-700/80 flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-200">
              <div className="flex items-center justify-between p-3 border-b border-slate-700/60 bg-[#162032]">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-teal" />
                  <span>Peserta ({1 + visibleRemotePlayers.length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsParticipantsOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {/* Local user */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/80 border border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-700 overflow-hidden">
                      <img src={currentUser.avatar} alt="" className="w-full h-full object-contain pixelated" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">{currentUser.fullName} (Anda)</span>
                      <span className="text-[10px] text-teal font-semibold">{isHost ? 'Host Utama' : 'Peserta'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400">
                    {isMicOn ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5 text-red-400" />}
                    {isCamOn ? <Video className="w-3.5 h-3.5 text-emerald-400" /> : <VideoOff className="w-3.5 h-3.5 text-red-400" />}
                  </div>
                </div>

                {/* Remote Participants */}
                {visibleRemotePlayers.map((player) => (
                  <div key={player.socketId} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-800 overflow-hidden">
                        <img src={player.avatar} alt="" className="w-full h-full object-contain pixelated" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-200 block truncate max-w-[120px]">{player.fullName}</span>
                        <span className="text-[10px] text-slate-400">{player.role || 'Member'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isHost && (
                        <button
                          type="button"
                          onClick={() => meetingService.muteParticipant(String(currentUser.id), player.socketId)}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-amber-400"
                          title="Bisukan peserta ini"
                        >
                          <VolumeX className="w-3 h-3" />
                        </button>
                      )}
                      {player.mediaState?.isMicOn ? (
                        <Mic className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <MicOff className="w-3.5 h-3.5 text-red-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Host Quick Actions */}
              {isHost && (
                <div className="p-3 border-t border-slate-700/60 bg-slate-900/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-300">Kontrol Host</span>
                    <button
                      type="button"
                      onClick={() => meetingService.lockMeeting(String(currentUser.id), !meeting?.isLocked)}
                      className={`text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 ${
                        meeting?.isLocked ? 'bg-red-500/20 text-red-300' : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {meeting?.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      <span>{meeting?.isLocked ? 'Meeting Terkunci' : 'Kunci Meeting'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* =================================================================== */}
        {/* 3. BOTTOM CONTROL DOCK: Mic, Cam, Screen Share, Breakout, Leave    */}
        {/* =================================================================== */}
        <div className="px-6 py-3 border-t border-slate-700/60 bg-[#162032] flex items-center justify-between flex-shrink-0">
          {/* Left: Meeting Room Info */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-200">{meeting?.title || 'Virtual Conference'}</span>
          </div>

          {/* Center: Main Media Actions */}
          <div className="flex items-center gap-2 sm:gap-3 mx-auto">
            <button
              type="button"
              onClick={toggleMic}
              className={`p-3 rounded-full transition-all cursor-pointer ${
                isMicOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
              }`}
              title={isMicOn ? 'Matikan Mikrofon' : 'Nyalakan Mikrofon'}
            >
              {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={toggleCam}
              className={`p-3 rounded-full transition-all cursor-pointer ${
                isCamOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
              }`}
              title={isCamOn ? 'Matikan Kamera' : 'Nyalakan Kamera'}
            >
              {isCamOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleScreenShareClick}
              className={`p-3 rounded-full transition-all cursor-pointer ${
                isScreenSharing ? 'bg-teal text-soft ring-2 ring-teal-light' : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
              title={isScreenSharing ? 'Hentikan Berbagi Layar' : 'Bagikan Layar'}
            >
              <ScreenShare className="w-4 h-4" />
            </button>

            {/* Breakout Room Button (Host or Participant) */}
            {isHost && (
              <button
                type="button"
                onClick={() => setIsBreakoutModalOpen(true)}
                className={`p-3 rounded-full transition-all cursor-pointer ${
                  meeting?.isBreakoutActive ? 'bg-amber-500 text-slate-900 font-bold ring-2 ring-amber-300' : 'bg-slate-800 hover:bg-slate-700 text-amber-300'
                }`}
                title="Kelola Breakout Room"
              >
                <Layers className="w-4 h-4" />
              </button>
            )}

            {isHost && meeting?.isBreakoutActive && (
              <button
                type="button"
                onClick={() => setIsBroadcastOpen(true)}
                className="p-3 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition-all cursor-pointer"
                title="Kirim Pengumuman Broadcast ke Semua Breakout"
              >
                <Megaphone className="w-4 h-4 text-amber-400" />
              </button>
            )}

            {/* In-Meeting Chat Toggle */}
            <button
              type="button"
              onClick={() => {
                setIsChatOpen(!isChatOpen);
                if (!isChatOpen) setIsParticipantsOpen(false);
              }}
              className={`p-3 rounded-full transition-all cursor-pointer ${
                isChatOpen ? 'bg-teal text-soft' : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
              title="Obrolan Meeting"
            >
              <Smile className="w-4 h-4" />
            </button>

            {/* Participants Toggle */}
            <button
              type="button"
              onClick={() => {
                setIsParticipantsOpen(!isParticipantsOpen);
                if (!isParticipantsOpen) setIsChatOpen(false);
              }}
              className={`p-3 rounded-full transition-all cursor-pointer ${
                isParticipantsOpen ? 'bg-teal text-soft' : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
              title="Daftar Peserta"
            >
              <Users className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Leave / End Meeting Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (isHost) {
                  meetingService.endMeeting(String(currentUser.id));
                } else {
                  meetingService.leaveMeeting(String(currentUser.id));
                }
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <PhoneOff className="w-4 h-4" />
              <span className="hidden sm:inline">{isHost ? 'Akhiri untuk Semua' : 'Tinggalkan Meeting'}</span>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* 4. MODAL: Breakout Room Creation & Control (Host only)             */}
        {/* =================================================================== */}
        {isBreakoutModalOpen && isHost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <div className="w-full max-w-md bg-[#0f172a] border border-amber-500/40 rounded-2xl shadow-2xl p-6 text-slate-100 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <Layers className="w-4 h-4" />
                  <span>Pengaturan Breakout Room</span>
                </div>
                <button type="button" onClick={() => setIsBreakoutModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!meeting?.isBreakoutActive ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Jumlah Ruangan:</label>
                    <select
                      value={breakoutCount}
                      onChange={(e) => setBreakoutCount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    >
                      <option value={2}>2 Ruangan</option>
                      <option value={3}>3 Ruangan</option>
                      <option value={4}>4 Ruangan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Metode Pembagian Peserta:</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setBreakoutMethod('auto')}
                        className={`p-2 rounded-lg border text-center font-bold ${
                          breakoutMethod === 'auto' ? 'border-teal bg-teal/20 text-teal' : 'border-slate-700 bg-slate-900 text-slate-400'
                        }`}
                      >
                        Otomatis
                      </button>
                      <button
                        type="button"
                        onClick={() => setBreakoutMethod('random')}
                        className={`p-2 rounded-lg border text-center font-bold ${
                          breakoutMethod === 'random' ? 'border-teal bg-teal/20 text-teal' : 'border-slate-700 bg-slate-900 text-slate-400'
                        }`}
                      >
                        Acak
                      </button>
                      <button
                        type="button"
                        onClick={() => setBreakoutMethod('manual')}
                        className={`p-2 rounded-lg border text-center font-bold ${
                          breakoutMethod === 'manual' ? 'border-teal bg-teal/20 text-teal' : 'border-slate-700 bg-slate-900 text-slate-400'
                        }`}
                      >
                        Pilih Manual
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Durasi Breakout (Menit):</label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={breakoutMinutes}
                      onChange={(e) => setBreakoutMinutes(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsBreakoutModalOpen(false)}
                      className="px-3 py-1.5 text-slate-400 hover:text-white"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateBreakouts}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition-colors shadow-md"
                    >
                      Buka Breakout Sekarang
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <p className="text-slate-300">
                    Sesi breakout room saat ini sedang berjalan dengan total <strong>{meeting.breakoutRooms.length} ruangan</strong>.
                  </p>
                  <div className="space-y-2">
                    {meeting.breakoutRooms.map((br) => (
                      <div key={br.id} className="p-3 bg-slate-900 rounded-lg border border-slate-700 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white block">{br.name}</span>
                          <span className="text-[11px] text-slate-400">{br.participants.length} Peserta bergabung</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => meetingService.moveToBreakoutRoom(String(currentUser.id), br.id)}
                          className="px-2.5 py-1 bg-teal hover:bg-teal-dark rounded text-soft font-bold text-[11px]"
                        >
                          Masuk Ruang Ini
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-700 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        meetingService.closeBreakoutRooms();
                        setIsBreakoutModalOpen(false);
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
                    >
                      Tutup Semua Breakout Room
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsBreakoutModalOpen(false)}
                      className="px-3 py-1.5 text-slate-400 hover:text-white"
                    >
                      Selesai
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Broadcast Modal (Host only) */}
        {isBroadcastOpen && isHost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <form onSubmit={handleBroadcastMessage} className="w-full max-w-md bg-[#0f172a] border border-amber-500/40 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-sm text-amber-300 flex items-center gap-2">
                <Megaphone className="w-4 h-4" />
                <span>Kirim Pesan Siaran (Broadcast)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Pesan ini akan langsung muncul sebagai pemberitahuan di layar seluruh peserta di semua breakout room.
              </p>
              <textarea
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                placeholder="misal: Waktu diskusi tersisa 5 menit lagi..."
                rows={3}
                className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
              />
              <div className="flex items-center justify-end gap-2 pt-1">
                <button type="button" onClick={() => setIsBroadcastOpen(false)} className="px-3 py-1.5 text-xs text-slate-400">
                  Batal
                </button>
                <button type="submit" className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs">
                  Kirim Siaran
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Modal Target / Publik Screen Sharing Selector */}
        {isScreenSharePickerOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-[#0f172a] border border-teal-500/40 rounded-2xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h3 className="font-bold text-sm text-teal-300 flex items-center gap-2">
                  <ScreenShare className="w-4 h-4 text-teal-400" />
                  <span>Pilih Target Berbagi Layar</span>
                </h3>
                <button
                  onClick={() => setIsScreenSharePickerOpen(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-400">
                Pilih apakah layar Anda dapat dilihat oleh seluruh rekan di ruang rapat dan lobby publik, atau khusus ditujukan ke kelompok / ID rekan tertentu.
              </p>

              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-700 bg-slate-900/60 cursor-pointer hover:border-teal-500/50">
                  <input
                    type="radio"
                    name="screenshare-target"
                    checked={screenShareMode === 'public'}
                    onChange={() => setScreenShareMode('public')}
                    className="mt-0.5 text-teal-500 focus:ring-teal-400"
                  />
                  <div>
                    <div className="text-xs font-semibold text-white">Publik (Seluruh Ruang Rapat & Lobby)</div>
                    <div className="text-[11px] text-slate-400">
                      Seluruh rekan yang hadir di ruang rapat dapat melihat siaran layar Anda secara langsung.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-700 bg-slate-900/60 cursor-pointer hover:border-teal-500/50">
                  <input
                    type="radio"
                    name="screenshare-target"
                    checked={screenShareMode === 'target'}
                    onChange={() => setScreenShareMode('target')}
                    className="mt-0.5 text-teal-500 focus:ring-teal-400"
                  />
                  <div className="w-full">
                    <div className="text-xs font-semibold text-white">Target Teman / ID Bracket Kelompok</div>
                    <div className="text-[11px] text-slate-400 mb-2">
                      Siaran layar hanya dapat diakses oleh rekan yang Anda undang atau masukkan username/ID-nya.
                    </div>
                    {screenShareMode === 'target' && (
                      <input
                        type="text"
                        value={targetColleagueName}
                        onChange={(e) => setTargetColleagueName(e.target.value)}
                        placeholder="Ketik username rekan (misal: NandaNannn)..."
                        className="w-full p-2 bg-slate-950 border border-teal-500/40 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                      />
                    )}
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsScreenSharePickerOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={startScreenShare}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-lg"
                >
                  <ScreenShare className="w-3.5 h-3.5" />
                  <span>Mulai Berbagi Layar</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

