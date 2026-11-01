import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Key,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  Unlock,
  CreditCard,
  Sliders,
  Save,
} from 'lucide-react';
import { LobbyBracket, BillingSession } from '../../types/lobby';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onLobbiesUpdated?: () => void;
}

export const AdminBillingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onLobbiesUpdated,
}) => {
  const [lobbies, setLobbies] = useState<LobbyBracket[]>([]);
  const [billingSessions, setBillingSessions] = useState<BillingSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savingLobbyId, setSavingLobbyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states per lobby
  const [editData, setEditData] = useState<
    Record<
      string,
      {
        companyName: string;
        billingKey: string;
        isActive: boolean;
        isLocked: boolean;
        maxCapacity: number;
      }
    >
  >({});

  const fetchBillingData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/billing');
      const data = await res.json();
      if (data.success) {
        setLobbies(data.lobbies || []);
        setBillingSessions(data.sessions || []);

        const initialEdit: typeof editData = {};
        for (const lob of data.lobbies || []) {
          initialEdit[lob.id] = {
            companyName: lob.companyName,
            billingKey: lob.billingKey,
            isActive: lob.isActive,
            isLocked: lob.isLocked,
            maxCapacity: lob.maxCapacity || 20,
          };
        }
        setEditData(initialEdit);
      }
    } catch (err: any) {
      console.error('Failed to fetch billing data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBillingData();
      setMessage(null);
    }
  }, [isOpen]);

  const handleGenerateKey = async (lobbyId: string) => {
    try {
      const company = editData[lobbyId]?.companyName || 'CORP';
      const cleanPrefix = company.split(' ')[0].replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'CORP';
      const res = await fetch('/api/admin/billing/generate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix: cleanPrefix }),
      });
      const data = await res.json();
      if (data.success && data.billingKey) {
        setEditData((prev) => ({
          ...prev,
          [lobbyId]: {
            ...prev[lobbyId],
            billingKey: data.billingKey,
          },
        }));
      }
    } catch (err: any) {
      console.error('Failed to generate key:', err);
    }
  };

  const handleSaveLobby = async (lobbyId: string) => {
    const item = editData[lobbyId];
    if (!item) return;
    setSavingLobbyId(lobbyId);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/billing/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lobbyId,
          companyName: item.companyName,
          billingKey: item.billingKey,
          isActive: item.isActive,
          isLocked: item.isLocked,
          maxCapacity: item.maxCapacity,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: `Server bracket ${lobbyId} berhasil disimpan!` });
        await fetchBillingData();
        if (onLobbiesUpdated) onLobbiesUpdated();
      } else {
        setMessage({ type: 'error', text: data.message || 'Gagal menyimpan konfigurasi.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Terjadi kesalahan jaringan.' });
    } finally {
      setSavingLobbyId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#1e2029] border border-[#383d52] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-[#181a22] border-b border-[#2d3142] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Panel Admin: Manajemen 5 Server Bracket & Billing Session
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-amber-500/20 text-amber-300 rounded border border-amber-500/40 font-semibold">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Atur alokasi perusahaan (PT), kunci billing, kuota 20 orang per bracket, dan status aksesbilitas 5 server online.
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

        {/* Notification Alert */}
        {message && (
          <div
            className={`px-6 py-2.5 flex items-center gap-2 text-xs font-medium ${
              message.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-300 border-b border-emerald-500/30'
                : 'bg-red-500/15 text-red-300 border-b border-red-500/30'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
              <span className="text-xs">Memuat 5 server bracket & data billing server...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {lobbies.map((lobby, idx) => {
                const edit = editData[lobby.id] || {
                  companyName: lobby.companyName,
                  billingKey: lobby.billingKey,
                  isActive: lobby.isActive,
                  isLocked: lobby.isLocked,
                  maxCapacity: lobby.maxCapacity || 20,
                };

                return (
                  <div
                    key={lobby.id}
                    className="p-4 rounded-xl bg-[#252836] border border-[#35394d] hover:border-[#4c5270] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Left: Info & Company */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-[#1e2029] text-amber-400 border border-amber-500/30">
                          {lobby.id}
                        </span>
                        <h3 className="text-sm font-semibold text-white">{lobby.name}</h3>
                        <span
                          className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${
                            edit.isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-red-500/20 text-red-300 border border-red-500/40'
                          }`}
                        >
                          {edit.isActive ? 'Online Aktif' : 'Nonaktif'}
                        </span>
                        {edit.isLocked && (
                          <span className="px-2 py-0.5 text-[10px] rounded-full font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Wajib Billing Key
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Company Name */}
                        <div>
                          <label className="text-[11px] font-medium text-gray-400 flex items-center gap-1.5 mb-1">
                            <Building2 className="w-3.5 h-3.5 text-amber-400" />
                            Perusahaan / Instansi (PT):
                          </label>
                          <input
                            type="text"
                            value={edit.companyName}
                            onChange={(e) =>
                              setEditData((prev) => ({
                                ...prev,
                                [lobby.id]: { ...prev[lobby.id], companyName: e.target.value },
                              }))
                            }
                            placeholder="Contoh: PT Inovasi Digital Nusantara"
                            className="w-full px-3 py-1.5 text-xs bg-[#181a24] border border-[#35394d] rounded-lg text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        {/* Billing Key */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[11px] font-medium text-gray-400 flex items-center gap-1.5">
                              <Key className="w-3.5 h-3.5 text-amber-400" />
                              Billing Key Session:
                            </label>
                            <button
                              type="button"
                              onClick={() => handleGenerateKey(lobby.id)}
                              className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-medium"
                            >
                              <RefreshCw className="w-2.5 h-2.5" /> Acak Baru
                            </button>
                          </div>
                          <input
                            type="text"
                            value={edit.billingKey}
                            onChange={(e) =>
                              setEditData((prev) => ({
                                ...prev,
                                [lobby.id]: { ...prev[lobby.id], billingKey: e.target.value },
                              }))
                            }
                            className="w-full px-3 py-1.5 text-xs font-mono bg-[#181a24] border border-[#35394d] rounded-lg text-amber-300 focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      {/* Controls Row */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-300 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={edit.isActive}
                            onChange={(e) =>
                              setEditData((prev) => ({
                                ...prev,
                                [lobby.id]: { ...prev[lobby.id], isActive: e.target.checked },
                              }))
                            }
                            className="rounded border-gray-600 text-amber-500 focus:ring-0"
                          />
                          <span>Aktifkan Server</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={edit.isLocked}
                            onChange={(e) =>
                              setEditData((prev) => ({
                                ...prev,
                                [lobby.id]: { ...prev[lobby.id], isLocked: e.target.checked },
                              }))
                            }
                            className="rounded border-gray-600 text-amber-500 focus:ring-0"
                          />
                          <span>Proteksi Kunci Billing</span>
                        </label>

                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Users className="w-3.5 h-3.5 text-teal" />
                          <span>Kapasitas: <strong className="text-white">20 Orang</strong> / Bracket Room</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Save Button */}
                    <div className="flex md:flex-col items-center justify-end gap-2 flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#35394d]">
                      <button
                        type="button"
                        onClick={() => handleSaveLobby(lobby.id)}
                        disabled={savingLobbyId === lobby.id}
                        className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                      >
                        {savingLobbyId === lobby.id ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Menyimpan...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Simpan Perubahan</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#181a22] border-t border-[#2d3142] flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>Maksimal 5 server bracket online simultan dengan billing session korporat terisolasi.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#252836] hover:bg-[#313548] text-gray-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
