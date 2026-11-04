import React, { useState, useEffect } from 'react';
import {
  X,
  Server,
  Building2,
  Users,
  Lock,
  Unlock,
  Key,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Globe2,
} from 'lucide-react';
import { LobbyBracket } from '../../types/lobby';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentLobbyId: string;
  onSelectLobby: (lobby: LobbyBracket, billingKey?: string) => void;
}

export const LobbyBracketSelectorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentLobbyId,
  onSelectLobby,
}) => {
  const [lobbies, setLobbies] = useState<LobbyBracket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLobby, setSelectedLobby] = useState<LobbyBracket | null>(null);
  const [billingKeyInput, setBillingKeyInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchLobbies = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/lobbies');
      const data = await res.json();
      if (data.success && Array.isArray(data.lobbies)) {
        setLobbies(data.lobbies);
        const cur = data.lobbies.find((l: LobbyBracket) => l.id === currentLobbyId) || data.lobbies[0];
        setSelectedLobby(cur);
      }
    } catch (err: any) {
      console.error('Failed to fetch lobbies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLobbies();
      setErrorMsg('');
      setBillingKeyInput('');
    }
  }, [isOpen]);

  const handleJoin = async (lobby: LobbyBracket) => {
    setErrorMsg('');
    try {
      const res = await fetch('/api/lobbies/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lobbyId: lobby.id,
          billingKey: billingKeyInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSelectLobby(lobby, billingKeyInput.trim());
        onClose();
      } else {
        setErrorMsg(data.message || 'Gagal masuk ke server bracket ini.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Koneksi ke server gagal.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#1e2029] border border-[#383d52] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#181a22] border-b border-[#2d3142] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal/10 border border-teal/30 text-teal">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Pilih Ruang Virtual Office (3 Dedicated Rooms)
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                1 Lobby Global untuk tamu publik, serta 2 Ruang Kantor Privat untuk perusahaan mitra terdaftar.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="px-6 py-2.5 bg-red-500/15 border-b border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Bracket List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-teal" />
              <span className="text-xs">Memuat daftar 5 server bracket online...</span>
            </div>
          ) : (
            lobbies.map((lobby) => {
              const isCurrent = lobby.id === currentLobbyId;

              return (
                <div
                  key={lobby.id}
                  onClick={() => setSelectedLobby(lobby)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedLobby?.id === lobby.id
                      ? 'bg-[#292d3e] border-teal shadow-md ring-1 ring-teal/30'
                      : 'bg-[#252836] border-[#35394d] hover:border-[#4d5372]'
                  } ${!lobby.isActive ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-[#181a24] text-amber-400 border border-amber-500/30">
                          {lobby.id}
                        </span>
                        <h3 className="text-sm font-bold text-white">{lobby.name}</h3>
                        {isCurrent && (
                          <span className="px-2 py-0.2 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/40">
                            Sedang Digunakan
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-300 font-medium">
                        <Building2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span>{lobby.companyName}</span>
                      </div>

                      <div className="flex items-center gap-4 text-[11px] text-gray-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-teal" />
                          <span>
                            Online: <strong className="text-white">{lobby.onlineCount}</strong> / {lobby.maxCapacity}
                          </span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Globe2 className="w-3 h-3 text-gray-400" />
                          <span>Region: {lobby.serverRegion}</span>
                        </span>
                        {lobby.isLocked ? (
                          <span className="flex items-center gap-1 text-amber-400">
                            <Lock className="w-3 h-3" /> Memerlukan Billing Key
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Unlock className="w-3 h-3" /> Akses Terbuka
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (lobby.isLocked) {
                          setSelectedLobby(lobby);
                        } else {
                          handleJoin(lobby);
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-teal/20 text-teal hover:bg-teal hover:text-slate-900 border border-teal/40 transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                    >
                      <span>Masuk</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Billing key input if this locked lobby is selected */}
                  {selectedLobby?.id === lobby.id && lobby.isLocked && (
                    <div className="mt-3 pt-3 border-t border-[#383d52] flex flex-col sm:flex-row items-center gap-2">
                      <div className="relative flex-1 w-full">
                        <Key className="w-3.5 h-3.5 text-amber-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={billingKeyInput}
                          onChange={(e) => setBillingKeyInput(e.target.value)}
                          placeholder="Masukkan Billing Key perusahaan (contoh: BILL-...)"
                          className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-[#181a24] border border-[#3c425c] rounded-lg text-amber-300 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleJoin(lobby)}
                        className="w-full sm:w-auto px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer flex-shrink-0"
                      >
                        <span>Verifikasi & Masuk</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#181a22] border-t border-[#2d3142] flex items-center justify-between text-xs text-gray-400">
          <span>Sistem isolasi multi-tenant: 5 server bracket independen.</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-[#252836] hover:bg-[#313548] text-gray-300 rounded text-xs transition-colors cursor-pointer"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
};
