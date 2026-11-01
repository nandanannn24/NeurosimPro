import { getDbPool } from './db';
import { LobbyBracket, BillingSession, SeatOccupancyRecord } from '../types/lobby';

// 5 Active Online Lobby Brackets (Exact Limit 5 Server Brackets as requested)
let memoryLobbies: LobbyBracket[] = [
  {
    id: 'LOBBY-01',
    name: 'Bracket 01 - Kantor Pusat Utama',
    companyName: 'PT Inovasi Digital Nusantara',
    billingKey: 'BILL-IDN-2026-HQ',
    isActive: true,
    isLocked: false,
    maxCapacity: 20,
    onlineCount: 1,
    serverRegion: 'ID-JKT-A1',
    features: {
      videoConference: true,
      screenShare: true,
      breakoutRooms: true,
      chatRealtime: true,
    },
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'LOBBY-02',
    name: 'Bracket 02 - Divisi Engineering & AI',
    companyName: 'PT Nusantara Teknologi Mandiri',
    billingKey: 'BILL-NTM-8891-ENG',
    isActive: true,
    isLocked: false,
    maxCapacity: 20,
    onlineCount: 0,
    serverRegion: 'ID-JKT-A2',
    features: {
      videoConference: true,
      screenShare: true,
      breakoutRooms: true,
      chatRealtime: true,
    },
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'LOBBY-03',
    name: 'Bracket 03 - Divisi Product & Design',
    companyName: 'PT Kreatif Media Digital',
    billingKey: 'BILL-KMD-4521-PRD',
    isActive: true,
    isLocked: false,
    maxCapacity: 20,
    onlineCount: 0,
    serverRegion: 'ID-JKT-B1',
    features: {
      videoConference: true,
      screenShare: true,
      breakoutRooms: true,
      chatRealtime: true,
    },
    createdAt: '2026-02-10T08:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'LOBBY-04',
    name: 'Bracket 04 - Tim Remote Global',
    companyName: 'PT Solusi Awan Kolaborasi',
    billingKey: 'BILL-SAK-7712-REM',
    isActive: true,
    isLocked: false,
    maxCapacity: 20,
    onlineCount: 0,
    serverRegion: 'SG-SIN-01',
    features: {
      videoConference: true,
      screenShare: true,
      breakoutRooms: true,
      chatRealtime: true,
    },
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'LOBBY-05',
    name: 'Bracket 05 - Ruang Eksekutif & Klien',
    companyName: 'PT Ventura Kapital Asia',
    billingKey: 'BILL-VKA-9900-EXEC',
    isActive: true,
    isLocked: false,
    maxCapacity: 20,
    onlineCount: 0,
    serverRegion: 'ID-JKT-B2',
    features: {
      videoConference: true,
      screenShare: true,
      breakoutRooms: true,
      chatRealtime: true,
    },
    createdAt: '2026-03-15T08:00:00Z',
    updatedAt: new Date().toISOString(),
  },
];

let memoryBillingSessions: BillingSession[] = [
  {
    id: 'BILL-SES-01',
    companyName: 'PT Inovasi Digital Nusantara',
    billingKey: 'BILL-IDN-2026-HQ',
    plan: 'enterprise_pro',
    maxSeatsPerBracket: 20,
    totalAllocatedLobbies: 1,
    status: 'active',
    validUntil: '2026-12-31T23:59:59Z',
    contactEmail: 'finance@inovasidigital.co.id',
    assignedLobbies: ['LOBBY-01'],
    notes: 'Enterprise Tier - Unmetered HD Screen Share & Video Mesh',
  },
  {
    id: 'BILL-SES-02',
    companyName: 'PT Nusantara Teknologi Mandiri',
    billingKey: 'BILL-NTM-8891-ENG',
    plan: 'enterprise_pro',
    maxSeatsPerBracket: 20,
    totalAllocatedLobbies: 1,
    status: 'active',
    validUntil: '2026-12-31T23:59:59Z',
    contactEmail: 'billing@nusantaratech.id',
    assignedLobbies: ['LOBBY-02'],
    notes: 'Engineering Branch - 20 Dedicated Workstations',
  },
  {
    id: 'BILL-SES-03',
    companyName: 'PT Kreatif Media Digital',
    billingKey: 'BILL-KMD-4521-PRD',
    plan: 'enterprise_pro',
    maxSeatsPerBracket: 20,
    totalAllocatedLobbies: 1,
    status: 'active',
    validUntil: '2026-11-30T23:59:59Z',
    contactEmail: 'ops@kreatifmedia.com',
    assignedLobbies: ['LOBBY-03'],
  },
  {
    id: 'BILL-SES-04',
    companyName: 'PT Solusi Awan Kolaborasi',
    billingKey: 'BILL-SAK-7712-REM',
    plan: 'enterprise_pro',
    maxSeatsPerBracket: 20,
    totalAllocatedLobbies: 1,
    status: 'active',
    validUntil: '2027-01-31T23:59:59Z',
    contactEmail: 'admin@solusiawan.co.id',
    assignedLobbies: ['LOBBY-04'],
  },
  {
    id: 'BILL-SES-05',
    companyName: 'PT Ventura Kapital Asia',
    billingKey: 'BILL-VKA-9900-EXEC',
    plan: 'enterprise_pro',
    maxSeatsPerBracket: 20,
    totalAllocatedLobbies: 1,
    status: 'active',
    validUntil: '2026-12-31T23:59:59Z',
    contactEmail: 'partner@venturakepital.asia',
    assignedLobbies: ['LOBBY-05'],
  },
];

// Seat Occupancy Registry: bracketId -> Map<seatId, SeatOccupancyRecord>
const bracketSeatOccupancy = new Map<string, Map<string, SeatOccupancyRecord>>();

/**
 * Initialize / ensure MySQL table exists if MySQL is connected
 */
async function initMySQLTablesIfNeeded(): Promise<void> {
  const pool = getDbPool();
  if (!pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lobby_brackets (
        id VARCHAR(32) PRIMARY KEY,
        name VARCHAR(128) NOT NULL,
        company_name VARCHAR(128) NOT NULL,
        billing_key VARCHAR(64) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        is_locked BOOLEAN DEFAULT FALSE,
        max_capacity INT DEFAULT 20,
        server_region VARCHAR(32) DEFAULT 'ID-JKT',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS billing_sessions (
        id VARCHAR(32) PRIMARY KEY,
        company_name VARCHAR(128) NOT NULL,
        billing_key VARCHAR(64) NOT NULL,
        plan VARCHAR(32) DEFAULT 'enterprise_pro',
        max_seats_per_bracket INT DEFAULT 20,
        status VARCHAR(32) DEFAULT 'active',
        valid_until VARCHAR(64),
        contact_email VARCHAR(128),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } catch (err: any) {
    // MySQL table check warning
  }
}

initMySQLTablesIfNeeded().catch(() => {});

export const lobbyStore = {
  getLobbies(): LobbyBracket[] {
    return memoryLobbies;
  },

  getLobbyById(id: string): LobbyBracket | undefined {
    return memoryLobbies.find((l) => l.id.toUpperCase() === id.toUpperCase());
  },

  updateOnlineCount(lobbyId: string, count: number): void {
    const lobby = this.getLobbyById(lobbyId);
    if (lobby) {
      lobby.onlineCount = Math.max(0, count);
      lobby.updatedAt = new Date().toISOString();
    }
  },

  getBillingSessions(): BillingSession[] {
    return memoryBillingSessions;
  },

  updateLobbyBilling(data: {
    lobbyId: string;
    companyName: string;
    billingKey: string;
    isActive?: boolean;
    isLocked?: boolean;
    maxCapacity?: number;
  }): { success: boolean; lobby?: LobbyBracket; message?: string } {
    const lobby = this.getLobbyById(data.lobbyId);
    if (!lobby) {
      return { success: false, message: `Lobby bracket ${data.lobbyId} tidak ditemukan.` };
    }

    if (data.companyName) lobby.companyName = data.companyName.trim();
    if (data.billingKey) lobby.billingKey = data.billingKey.trim();
    if (data.isActive !== undefined) lobby.isActive = Boolean(data.isActive);
    if (data.isLocked !== undefined) lobby.isLocked = Boolean(data.isLocked);
    if (data.maxCapacity !== undefined) lobby.maxCapacity = Math.min(Math.max(data.maxCapacity, 1), 20);
    lobby.updatedAt = new Date().toISOString();

    // Update corresponding billing session
    let bSession = memoryBillingSessions.find((s) => s.assignedLobbies.includes(lobby.id));
    if (bSession) {
      bSession.companyName = lobby.companyName;
      bSession.billingKey = lobby.billingKey;
    } else {
      memoryBillingSessions.push({
        id: `BILL-SES-${Date.now().toString(36).toUpperCase()}`,
        companyName: lobby.companyName,
        billingKey: lobby.billingKey,
        plan: 'enterprise_pro',
        maxSeatsPerBracket: lobby.maxCapacity,
        totalAllocatedLobbies: 1,
        status: 'active',
        validUntil: '2026-12-31T23:59:59Z',
        contactEmail: 'admin@neurosimpro.com',
        assignedLobbies: [lobby.id],
      });
    }

    return { success: true, lobby, message: `Lobby ${lobby.id} berhasil diperbarui.` };
  },

  generateBillingKey(prefix: string = 'BILL'): string {
    const cleanPrefix = prefix.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6) || 'CORP';
    const randPart1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randPart2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `NEURO-${cleanPrefix}-${randPart1}-${randPart2}`;
  },

  // ---------------------------------------------------------------------------
  // Seat Occupancy & Anti-Stacking Engine (1 Meja / 1 Kursi = 1 Orang)
  // ---------------------------------------------------------------------------
  getOccupiedSeats(bracketId: string): SeatOccupancyRecord[] {
    const bId = (bracketId || 'LOBBY-01').toUpperCase();
    const map = bracketSeatOccupancy.get(bId);
    if (!map) return [];
    return Array.from(map.values()).filter((r) => r.occupiedBy !== null);
  },

  claimSeat(
    bracketId: string,
    seatId: string,
    user: {
      socketId: string;
      userId?: string | number;
      username: string;
      fullName: string;
      avatar?: string;
      role?: string;
    }
  ): { success: boolean; message?: string; record?: SeatOccupancyRecord } {
    const bId = (bracketId || 'LOBBY-01').toUpperCase();
    if (!bracketSeatOccupancy.has(bId)) {
      bracketSeatOccupancy.set(bId, new Map());
    }
    const map = bracketSeatOccupancy.get(bId)!;

    const existing = map.get(seatId);
    if (existing && existing.occupiedBy && existing.occupiedBy.socketId !== user.socketId) {
      return {
        success: false,
        message: `Kursi/meja ini sedang ditempati oleh ${existing.occupiedBy.fullName} (@${existing.occupiedBy.username}). Tidak dapat ditumpuk!`,
      };
    }

    // Vacate any other seat this socket was currently holding
    for (const [sId, rec] of map.entries()) {
      if (rec.occupiedBy?.socketId === user.socketId) {
        map.delete(sId);
      }
    }

    const record: SeatOccupancyRecord = {
      seatId,
      bracketId: bId,
      occupiedBy: user,
      occupiedAt: Date.now(),
    };
    map.set(seatId, record);

    return { success: true, record };
  },

  vacateSeat(bracketId: string, seatId: string, socketId?: string): boolean {
    const bId = (bracketId || 'LOBBY-01').toUpperCase();
    const map = bracketSeatOccupancy.get(bId);
    if (!map) return false;

    if (socketId) {
      const rec = map.get(seatId);
      if (rec && rec.occupiedBy?.socketId !== socketId) {
        return false;
      }
    }
    map.delete(seatId);
    return true;
  },

  vacateAllSeatsForSocket(socketId: string): { bracketId: string; seatId: string }[] {
    const vacated: { bracketId: string; seatId: string }[] = [];
    for (const [bId, map] of bracketSeatOccupancy.entries()) {
      for (const [seatId, rec] of map.entries()) {
        if (rec.occupiedBy?.socketId === socketId) {
          map.delete(seatId);
          vacated.push({ bracketId: bId, seatId });
        }
      }
    }
    return vacated;
  },
};
