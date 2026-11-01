import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Settings,
  X,
  Volume2,
  Users,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { webrtcService } from '../../services/webrtc.service';
import { MeetingSession } from '../../types/meeting';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  meeting: MeetingSession | null;
  userName: string;
  userRole?: string;
  userAvatar?: string;
  onJoin: (options: { isCamOn: boolean; isMicOn: boolean; selectedCamId?: string; selectedMicId?: string }) => void;
}

export const MeetingLobbyModal: React.FC<Props> = ({
  isOpen,
  onClose,
  meeting,
  userName,
  userRole = 'Member',
  userAvatar = '/assets/characters/resident/standing/south.png',
  onJoin,
}) => {
  const [isCamOn, setIsCamOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');
  const [micLevel, setMicLevel] = useState<number>(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      cleanupLobbyStream();
      return;
    }

    // Enumerate devices
    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const vDevs = devices.filter((d) => d.kind === 'videoinput');
        const aDevs = devices.filter((d) => d.kind === 'audioinput');
        setVideoDevices(vDevs);
        setAudioDevices(aDevs);
        if (vDevs.length > 0) setSelectedVideoDevice(vDevs[0].deviceId);
        if (aDevs.length > 0) setSelectedAudioDevice(aDevs[0].deviceId);
      }).catch(() => {});
    }

    startPreviewStream(isCamOn, isMicOn);

    return () => {
      cleanupLobbyStream();
    };
  }, [isOpen]);

  const startPreviewStream = async (cam: boolean, mic: boolean) => {
    cleanupLobbyStream();
    try {
      setPermissionError(null);
      const constraints: MediaStreamConstraints = {
        video: cam ? (selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : { width: 640, height: 480 }) : false,
        audio: mic ? (selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true) : false,
      };

      if (!cam && !mic) return;

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (videoPreviewRef.current && cam) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(() => {});
      }

      if (mic) {
        setupMicLevelMeter(stream);
      }
    } catch (err: any) {
      console.warn('[MeetingLobby] Media preview permission error:', err);
      setPermissionError('Kamera atau mikrofon tidak dapat diakses. Anda tetap dapat bergabung tanpa kamera/mic.');
    }
  };

  const setupMicLevelMeter = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const src = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      src.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateMeter = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateMeter);
      };
      updateMeter();
    } catch (e) {
      // audio metering fallback
    }
  };

  const cleanupLobbyStream = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setMicLevel(0);
  };

  const toggleCam = () => {
    const next = !isCamOn;
    setIsCamOn(next);
    startPreviewStream(next, isMicOn);
  };

  const toggleMic = () => {
    const next = !isMicOn;
    setIsMicOn(next);
    startPreviewStream(isCamOn, next);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0f172a] border border-teal/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60 bg-[#162032]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal/20 border border-teal/40 flex items-center justify-center text-teal">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">Lobby Persiapan Meeting</h2>
              <p className="text-xs text-slate-400">
                {meeting?.title || 'NeuroSim Pro Conference Suite'} • Kode: <span className="font-mono text-teal font-bold">{meeting?.code || 'NEURO-MEET'}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {permissionError && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>{permissionError}</span>
            </div>
          )}

          {/* Camera Preview Box */}
          <div className="relative aspect-video w-full max-h-[300px] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center group shadow-inner">
            {isCamOn ? (
              <video
                ref={videoPreviewRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden">
                  <img src={userAvatar} alt={userName} className="w-full h-full object-contain pixelated" />
                </div>
                <span className="text-xs font-semibold text-slate-300">{userName} (Kamera Mati)</span>
              </div>
            )}

            {/* Bottom In-Preview Controls */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 bg-slate-950/80 backdrop-blur-md rounded-full border border-slate-700/80 shadow-lg">
              <button
                type="button"
                onClick={toggleMic}
                className={`p-2.5 rounded-full transition-all cursor-pointer ${
                  isMicOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-500/90 text-white hover:bg-red-600'
                }`}
                title={isMicOn ? 'Matikan Mikrofon' : 'Nyalakan Mikrofon'}
              >
                {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={toggleCam}
                className={`p-2.5 rounded-full transition-all cursor-pointer ${
                  isCamOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-500/90 text-white hover:bg-red-600'
                }`}
                title={isCamOn ? 'Matikan Kamera' : 'Nyalakan Kamera'}
              >
                {isCamOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Microphone Audio Meter */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-teal" />
                <span>Indikator Input Mikrofon:</span>
              </span>
              <span className="font-mono text-[11px] text-teal">{isMicOn ? `${micLevel}%` : 'Nonaktif'}</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className={`h-full transition-all duration-100 ${
                  micLevel > 60 ? 'bg-emerald-400' : 'bg-teal'
                }`}
                style={{ width: `${isMicOn ? micLevel : 0}%` }}
              />
            </div>
          </div>

          {/* Device Selection (Optional Controls) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Pilih Kamera:</label>
              <select
                value={selectedVideoDevice}
                onChange={(e) => {
                  setSelectedVideoDevice(e.target.value);
                  startPreviewStream(isCamOn, isMicOn);
                }}
                disabled={!isCamOn || videoDevices.length === 0}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-teal disabled:opacity-50"
              >
                {videoDevices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Kamera ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Pilih Mikrofon:</label>
              <select
                value={selectedAudioDevice}
                onChange={(e) => {
                  setSelectedAudioDevice(e.target.value);
                  startPreviewStream(isCamOn, isMicOn);
                }}
                disabled={!isMicOn || audioDevices.length === 0}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-teal disabled:opacity-50"
              >
                {audioDevices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Mikrofon ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700/60 bg-[#162032]">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Bergabung sebagai <strong className="text-white">{userName}</strong> ({userRole})</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                cleanupLobbyStream();
                onJoin({
                  isCamOn,
                  isMicOn,
                  selectedCamId: selectedVideoDevice,
                  selectedMicId: selectedAudioDevice,
                });
              }}
              className="px-5 py-2.5 rounded-xl bg-teal hover:bg-teal-dark text-soft text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <span>Masuk Meeting Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

