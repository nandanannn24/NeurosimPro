import fs from 'fs';
import path from 'path';

// 1. Update RoomLobbyView.tsx
const lobbyPath = path.resolve('src/components/views/RoomLobbyView.tsx');
let lobby = fs.readFileSync(lobbyPath, 'utf8');

const oldNpcSection = `<div className="flex items-center justify-between border-b border-[#d1c7b5] pb-2">
                <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-teal" />
                  <span>Daftar Rekan Kerja di Ruangan Ini</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-700 font-bold">
                  {room.npcs.length} Orang
                </span>
              </div>

              <div className="space-y-2">
                {room.npcs.map((npcName, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-sand/40 border border-[#d1c7b5] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-teal/20 border border-teal text-teal flex items-center justify-center font-bold text-xs">
                        {npcName.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-ink block">{npcName}</span>
                        <span className="text-[10px] text-ink-muted">Siap diajak berinteraksi [E]</span>
                      </div>
                    </div>

                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" title="Online" />
                  </div>
                ))}
              </div>`;

const newFeatureSection = `<div className="flex items-center justify-between border-b border-[#d1c7b5] pb-2">
                <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-teal" />
                  <span>Fitur & Fasilitas Ruangan</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-700 font-bold">
                  Kapasitas {room.capacity} Orang
                </span>
              </div>

              <div className="space-y-2">
                {room.features.map((feature, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-sand/40 border border-[#d1c7b5] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-teal/20 border border-teal text-teal flex items-center justify-center font-bold text-xs">
                        ✓
                      </div>
                      <div>
                        <span className="font-bold text-ink block">{feature}</span>
                        <span className="text-[10px] text-ink-muted">Fasilitas aktif & siap digunakan</span>
                      </div>
                    </div>

                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" title="Tersedia" />
                  </div>
                ))}
              </div>`;

lobby = lobby.replace(oldNpcSection.replace(/\r?\n/g, '\r\n'), newFeatureSection.replace(/\r?\n/g, '\r\n'));
fs.writeFileSync(lobbyPath, lobby, 'utf8');
console.log('Updated RoomLobbyView.tsx');

