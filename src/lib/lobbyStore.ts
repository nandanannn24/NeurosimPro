import { getDbPool } from './db';
import {
  LobbyBracket,
  BillingSession,
  SeatOccupancyRecord,
  CompanyRecord,
  EnterpriseUserRecord,
  HumasContact,
  AppUserRole,
} from '../types/lobby';

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
    humasContact: {
      name: 'Rina Wijaya, S.I.Kom',
      email: 'rina.wijaya@inovasidigital.co.id',
      phone: '+62 812-8889-1001',
      title: 'Head of Public Relations & Enterprise PIC',
      notes: 'Penghubung resmi PT Inovasi Digital Nusantara dengan Admin NeuroSim Pro.',
    },
    leaderName: 'Operations Lead (Manager)',
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
    humasContact: {
      name: 'Dimas Pratama, M.T',
      email: 'dimas.pratama@nusantaratech.id',
      phone: '+62 813-7722-4411',
      title: 'Corporate Affairs & Division PIC',
      notes: 'Kontak PIC teknis dan koordinasi perizinan ruang rapat.',
    },
    leaderName: 'Lead AI Engineer',
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
    humasContact: {
      name: 'Sheila Amanda',
      email: 'sheila@kreatifmedia.com',
      phone: '+62 811-9988-3322',
      title: 'Media Relations & PIC Tim Kreatif',
      notes: 'Penanggung jawab jadwal studio dan koordinasi presentasi.',
    },
    leaderName: 'Design Director',
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
    humasContact: {
      name: 'Fajar Nugroho',
      email: 'fajar@solusiawan.co.id',
      phone: '+62 856-1122-3344',
      title: 'Partnership & Global Communications',
      notes: 'PIC penghubung tim remote zona waktu Asia Pasifik.',
    },
    leaderName: 'Cloud Team Lead',
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
    humasContact: {
      name: 'Amanda Valerie, B.Com',
      email: 'amanda@venturakapital.asia',
      phone: '+62 812-9900-5566',
      title: 'Executive Liaison & Investor Relations',
      notes: 'Kontak PIC tamu VIP dan sesi pitching investasi.',
    },
    leaderName: 'Managing Partner',
    createdAt: '2026-03-15T08:00:00Z',
    updatedAt: new Date().toISOString(),
  },
];

let memoryCompanies: CompanyRecord[] = [
  {
    id: 'COMP-01',
    name: 'PT Inovasi Digital Nusantara',
    slug: 'idn-hq',
    assignedBracketId: 'LOBBY-01',
    billingKey: 'BILL-IDN-2026-HQ',
    plan: 'enterprise_pro',
    status: 'active',
    validUntil: '2026-12-31T23:59:59Z',
    humasContact: {
      name: 'Rina Wijaya, S.I.Kom',
      email: 'rina.wijaya@inovasidigital.co.id',
      phone: '+62 812-8889-1001',
      title: 'Head of Public Relations & Enterprise PIC',
      notes: 'Penghubung resmi PT Inovasi Digital Nusantara dengan Admin NeuroSim Pro.',
    },
    leaderName: 'Operations Lead (Manager)',
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'COMP-02',
    name: 'PT Nusantara Teknologi Mandiri',
    slug: 'ntm-tech',
    assignedBracketId: 'LOBBY-02',
    billingKey: 'BILL-NTM-8891-ENG',
    plan: 'enterprise_pro',
    status: 'active',
    validUntil: '2026-12-31T23:59:59Z',
    humasContact: {
      name: 'Dimas Pratama, M.T',
      email: 'dimas.pratama@nusantaratech.id',
      phone: '+62 813-7722-4411',
      title: 'Corporate Affairs & Division PIC',
      notes: 'Kontak PIC teknis dan koordinasi perizinan ruang rapat.',
    },
    leaderName: 'Lead AI Engineer',
    createdAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'COMP-03',
    name: 'PT Kreatif Media Digital',
    slug: 'kmd-creative',
    assignedBracketId: 'LOBBY-03',
    billingKey: 'BILL-KMD-4521-PRD',
    plan: 'enterprise_pro',
    status: 'active',
    validUntil: '2026-11-30T23:59:59Z',
    humasContact: {
      name: 'Sheila Amanda',
      email: 'sheila@kreatifmedia.com',
      phone: '+62 811-9988-3322',
      title: 'Media Relations & PIC Tim Kreatif',
      notes: 'Penanggung jawab jadwal studio dan koordinasi presentasi.',
    },
    leaderName: 'Design Director',
    createdAt: '2026-02-10T08:00:00Z',
  },
  {
    id: 'COMP-04',
    name: 'PT Solusi Awan Kolaborasi',
    slug: 'sak-cloud',
    assignedBracketId: 'LOBBY-04',
    billingKey: 'BILL-SAK-7712-REM',
    plan: 'enterprise_pro',
    status: 'active',
    validUntil: '2027-01-31T23:59:59Z',
    humasContact: {
      name: 'Fajar Nugroho',
      email: 'fajar@solusiawan.co.id',
      phone: '+62 856-1122-3344',
      title: 'Partnership & Global Communications',
      notes: 'PIC penghubung tim remote zona waktu Asia Pasifik.',
    },
    leaderName: 'Cloud Team Lead',
    createdAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'COMP-05',
    name: 'PT Ventura Kapital Asia',
    slug: 'vka-invest',
    assignedBracketId: 'LOBBY-05',
    billingKey: 'BILL-VKA-9900-EXEC',
    plan: 'enterprise_pro',
    status: 'active',
    validUntil: '2026-12-31T23:59:59Z',
    humasContact: {
      name: 'Amanda Valerie, B.Com',
      email: 'amanda@venturakapital.asia',
      phone: '+62 812-9900-5566',
      title: 'Executive Liaison & Investor Relations',
      notes: 'Kontak PIC tamu VIP dan sesi pitching investasi.',
    },
    leaderName: 'Managing Partner',
    createdAt: '2026-03-15T08:00:00Z',
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
    humasContact: memoryCompanies[0].humasContact,
    notes: 'Enterprise Tier - Unmetered HD Screen Share & Video Mesh',
    createdAt: '2026-01-15T08:00:00Z',
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
    humasContact: memoryCompanies[1].humasContact,
    notes: 'Engineering Branch - 20 Dedicated Workstations',
    createdAt: '2026-02-01T08:00:00Z',
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
    humasContact: memoryCompanies[2].humasContact,
    createdAt: '2026-02-10T08:00:00Z',
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
    humasContact: memoryCompanies[3].humasContact,
    createdAt: '2026-03-01T08:00:00Z',
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
    humasContact: memoryCompanies[4].humasContact,
    createdAt: '2026-03-15T08:00:00Z',
  },
];

let memoryUsers: EnterpriseUserRecord[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@neurosimpro.com',
    fullName: 'Administrator NeuroSim Pro',
    role: 'Super Administrator',
    roleSlug: 'super_admin',
    title: 'Platform Administrator',
    department: 'Enterprise System Operation',
    avatar: '/assets/characters/office-worker/standing/south.png',
    companyName: 'NeuroSim Pro Core Team',
    bracketId: 'ALL',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    username: 'leader',
    email: 'leader@neurosimpro.com',
    fullName: 'Operations Lead (Bos Ruangan)',
    role: 'Bos / Leader Divisi',
    roleSlug: 'manager',
    title: 'Engineering Manager & Room Leader',
    department: 'Divisi Kolaborasi & Delivery',
    avatar: '/assets/characters/resident/standing/south.png',
    companyName: 'PT Inovasi Digital Nusantara',
    bracketId: 'LOBBY-01',
    isActive: true,
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 3,
    username: 'humas',
    email: 'humas@inovasidigital.co.id',
    fullName: 'Rina Wijaya, S.I.Kom',
    role: 'Humas / Corporate PIC',
    roleSlug: 'org_admin',
    title: 'Head of Public Relations & Liaison',
    department: 'Hubungan Masyarakat & Eksternal',
    avatar: '/assets/characters/resident/standing/south.png',
    companyName: 'PT Inovasi Digital Nusantara',
    bracketId: 'LOBBY-01',
    isActive: true,
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 4,
    username: 'employee',
    email: 'employee@neurosimpro.com',
    fullName: 'Staff Pengembang Internal',
    role: 'Pengguna Internal',
    roleSlug: 'employee',
    title: 'Frontend Engineer',
    department: 'Divisi Antarmuka & Frontend',
    avatar: '/assets/characters/resident/standing/south.png',
    companyName: 'PT Inovasi Digital Nusantara',
    bracketId: 'LOBBY-01',
    isActive: true,
    createdAt: '2026-01-20T08:00:00Z',
  },
  {
    id: 5,
    username: 'guest',
    email: 'guest@neurosimpro.com',
    fullName: 'Tamu Eksternal / Pengunjung',
    role: 'Tamu (Guest)',
    roleSlug: 'guest',
    title: 'Guest Collaborator',
    department: 'External Stakeholder',
    avatar: '/assets/characters/courier/standing/south.png',
    companyName: 'Mitra Pengunjung Eksternal',
    bracketId: 'GUEST-LOBBY',
    isActive: true,
    createdAt: '2026-02-01T08:00:00Z',
  },
];

let activityLogs: Array<{
  id: string;
  timestamp: string;
  category: 'auth' | 'billing' | 'bracket' | 'seat' | 'admin';
  action: string;
  actor: string;
  details: string;
}> = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    category: 'admin',
    action: 'SYSTEM_BOOT',
    actor: 'System Kernel',
    details: '5 Server Bracket Lobbies online dan terverifikasi.',
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    category: 'billing',
    action: 'KEY_VERIFIED',
    actor: 'PT Inovasi Digital Nusantara',
    details: 'Akses Room LOBBY-01 dengan billing key valid disetujui.',
  },
];

// Seat Occupancy Registry: bracketId -> Map<seatId, SeatOccupancyRecord>
const bracketSeatOccupancy = new Map<string, Map<string, SeatOccupancyRecord>>();

export const lobbyStore = {
  // ---------------------------------------------------------------------------
  // Lobby Brackets
  // ---------------------------------------------------------------------------
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

  updateLobbyBilling(data: {
    lobbyId: string;
    companyName?: string;
    billingKey?: string;
    isActive?: boolean;
    isLocked?: boolean;
    maxCapacity?: number;
    leaderName?: string;
    humasContact?: HumasContact;
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
    if (data.leaderName) lobby.leaderName = data.leaderName.trim();
    if (data.humasContact) lobby.humasContact = data.humasContact;
    lobby.updatedAt = new Date().toISOString();

    // Update corresponding billing session
    let bSession = memoryBillingSessions.find((s) => s.assignedLobbies.includes(lobby.id));
    if (bSession) {
      bSession.companyName = lobby.companyName;
      bSession.billingKey = lobby.billingKey;
      if (lobby.humasContact) bSession.humasContact = lobby.humasContact;
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
        contactEmail: lobby.humasContact?.email || 'admin@neurosimpro.com',
        assignedLobbies: [lobby.id],
        humasContact: lobby.humasContact,
        createdAt: new Date().toISOString(),
      });
    }

    // Update corresponding company
    const comp = memoryCompanies.find((c) => c.assignedBracketId === lobby.id);
    if (comp) {
      comp.name = lobby.companyName;
      comp.billingKey = lobby.billingKey;
      if (lobby.humasContact) comp.humasContact = lobby.humasContact;
      if (lobby.leaderName) comp.leaderName = lobby.leaderName;
    }

    this.addAuditLog('bracket', 'LOBBY_UPDATED', 'Admin', `Konfigurasi ${lobby.id} diperbarui.`);
    return { success: true, lobby, message: `Lobby ${lobby.id} berhasil diperbarui.` };
  },

  generateBillingKey(prefix: string = 'CORP'): string {
    const cleanPrefix = prefix.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 6) || 'CORP';
    const randPart1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randPart2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BILL-${cleanPrefix}-${randPart1}-${randPart2}`;
  },

  validateKeyForLobby(billingKey: string, lobbyId: string): { valid: boolean; message: string; lobby?: LobbyBracket } {
    const lobby = this.getLobbyById(lobbyId);
    if (!lobby) {
      return { valid: false, message: 'Server bracket tidak ditemukan.' };
    }
    if (!lobby.isActive) {
      return { valid: false, message: 'Server bracket sedang dinonaktifkan oleh Administrator.' };
    }
    if (!lobby.isLocked) {
      return { valid: true, message: 'Server bracket terbuka umum.', lobby };
    }
    const cleanInput = (billingKey || '').trim().toUpperCase();
    const cleanStored = lobby.billingKey.trim().toUpperCase();

    if (cleanInput === cleanStored) {
      this.addAuditLog('billing', 'KEY_SUCCESS', lobby.companyName, `Validasi billing key sukses untuk ${lobby.id}`);
      return { valid: true, message: 'Billing key valid.', lobby };
    }

    this.addAuditLog('billing', 'KEY_INVALID', 'Guest', `Percobaan masuk ${lobby.id} dengan key salah: ${billingKey}`);
    return { valid: false, message: 'Billing key tidak sesuai atau sudah kadaluarsa.' };
  },

  // ---------------------------------------------------------------------------
  // Billing Sessions
  // ---------------------------------------------------------------------------
  getBillingSessions(): BillingSession[] {
    return memoryBillingSessions;
  },

  createBillingSession(data: {
    companyName: string;
    billingKey?: string;
    plan?: 'enterprise_pro' | 'business_growth';
    maxSeatsPerBracket?: number;
    validUntil?: string;
    contactEmail: string;
    assignedLobbies: string[];
    humasContact?: HumasContact;
    notes?: string;
  }): { success: boolean; session?: BillingSession; message?: string } {
    const cleanPrefix = data.companyName.split(' ')[0] || 'CORP';
    const key = data.billingKey || this.generateBillingKey(cleanPrefix);
    const newSession: BillingSession = {
      id: `BILL-SES-${Date.now().toString(36).toUpperCase()}`,
      companyName: data.companyName.trim(),
      billingKey: key,
      plan: data.plan || 'enterprise_pro',
      maxSeatsPerBracket: data.maxSeatsPerBracket || 20,
      totalAllocatedLobbies: data.assignedLobbies.length || 1,
      status: 'active',
      validUntil: data.validUntil || '2026-12-31T23:59:59Z',
      contactEmail: data.contactEmail,
      assignedLobbies: data.assignedLobbies,
      humasContact: data.humasContact,
      notes: data.notes || 'Enterprise Tier Virtual Office',
      createdAt: new Date().toISOString(),
    };
    memoryBillingSessions.unshift(newSession);

    // Sync assigned lobbies with the new billing key
    for (const lobId of data.assignedLobbies) {
      const lob = this.getLobbyById(lobId);
      if (lob) {
        lob.billingKey = key;
        lob.companyName = data.companyName;
        lob.isLocked = true;
        if (data.humasContact) lob.humasContact = data.humasContact;
      }
    }

    this.addAuditLog('billing', 'SESSION_CREATED', 'Admin', `Sesi billing baru untuk ${data.companyName}`);
    return { success: true, session: newSession, message: 'Sesi billing baru berhasil dibuat.' };
  },

  updateBillingSession(
    sessionId: string,
    data: Partial<BillingSession>
  ): { success: boolean; session?: BillingSession; message?: string } {
    const s = memoryBillingSessions.find((x) => x.id === sessionId);
    if (!s) return { success: false, message: 'Sesi billing tidak ditemukan.' };

    if (data.companyName) s.companyName = data.companyName;
    if (data.billingKey) s.billingKey = data.billingKey;
    if (data.plan) s.plan = data.plan;
    if (data.status) s.status = data.status;
    if (data.validUntil) s.validUntil = data.validUntil;
    if (data.contactEmail) s.contactEmail = data.contactEmail;
    if (data.maxSeatsPerBracket) s.maxSeatsPerBracket = data.maxSeatsPerBracket;
    if (data.humasContact) s.humasContact = data.humasContact;
    if (data.notes) s.notes = data.notes;

    this.addAuditLog('billing', 'SESSION_UPDATED', 'Admin', `Sesi billing ${sessionId} diperbarui.`);
    return { success: true, session: s };
  },

  // ---------------------------------------------------------------------------
  // Companies & Humas (PIC)
  // ---------------------------------------------------------------------------
  getCompanies(): CompanyRecord[] {
    return memoryCompanies;
  },

  getCompanyById(id: string): CompanyRecord | undefined {
    return memoryCompanies.find((c) => c.id === id || c.assignedBracketId === id);
  },

  updateCompany(id: string, data: Partial<CompanyRecord>): { success: boolean; company?: CompanyRecord } {
    const comp = memoryCompanies.find((c) => c.id === id);
    if (!comp) return { success: false };
    if (data.name) comp.name = data.name;
    if (data.humasContact) comp.humasContact = data.humasContact;
    if (data.leaderName) comp.leaderName = data.leaderName;
    if (data.billingKey) comp.billingKey = data.billingKey;
    if (data.status) comp.status = data.status;
    if (data.validUntil) comp.validUntil = data.validUntil;

    // Sync to bracket
    const lob = this.getLobbyById(comp.assignedBracketId);
    if (lob) {
      if (data.name) lob.companyName = data.name;
      if (data.humasContact) lob.humasContact = data.humasContact;
      if (data.leaderName) lob.leaderName = data.leaderName;
      if (data.billingKey) lob.billingKey = data.billingKey;
    }

    this.addAuditLog('admin', 'COMPANY_UPDATED', 'Admin', `Perusahaan ${comp.name} diperbarui.`);
    return { success: true, company: comp };
  },

  // ---------------------------------------------------------------------------
  // Enterprise Users Management
  // ---------------------------------------------------------------------------
  getUsers(): EnterpriseUserRecord[] {
    return memoryUsers;
  },

  getUserById(id: number): EnterpriseUserRecord | undefined {
    return memoryUsers.find((u) => u.id === id);
  },

  updateUser(id: number, data: Partial<EnterpriseUserRecord>): { success: boolean; user?: EnterpriseUserRecord } {
    const u = memoryUsers.find((x) => x.id === id);
    if (!u) return { success: false };
    if (data.fullName) u.fullName = data.fullName;
    if (data.email) u.email = data.email;
    if (data.role) u.role = data.role;
    if (data.roleSlug) u.roleSlug = data.roleSlug;
    if (data.department) u.department = data.department;
    if (data.title) u.title = data.title;
    if (data.companyName) u.companyName = data.companyName;
    if (data.bracketId) u.bracketId = data.bracketId;
    if (data.isActive !== undefined) u.isActive = Boolean(data.isActive);

    this.addAuditLog('auth', 'USER_UPDATED', 'Admin', `Akun @${u.username} (${u.role}) diperbarui.`);
    return { success: true, user: u };
  },

  createUser(data: {
    username: string;
    email: string;
    fullName: string;
    role: string;
    roleSlug: AppUserRole;
    title?: string;
    department?: string;
    companyName?: string;
    bracketId?: string;
  }): { success: boolean; user?: EnterpriseUserRecord; message?: string } {
    const cleanUser = data.username.trim().toLowerCase();
    if (memoryUsers.some((x) => x.username.toLowerCase() === cleanUser)) {
      return { success: false, message: `Username @${cleanUser} sudah terdaftar.` };
    }
    const newId = memoryUsers.length ? Math.max(...memoryUsers.map((x) => x.id)) + 1 : 1;
    const user: EnterpriseUserRecord = {
      id: newId,
      username: cleanUser,
      email: data.email.trim().toLowerCase(),
      fullName: data.fullName.trim(),
      role: data.role,
      roleSlug: data.roleSlug,
      title: data.title || 'Staff Kolaborasi',
      department: data.department || 'Enterprise Workspace',
      avatar: '/assets/characters/resident/standing/south.png',
      companyName: data.companyName || 'PT Inovasi Digital Nusantara',
      bracketId: data.bracketId || 'LOBBY-01',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    memoryUsers.push(user);
    this.addAuditLog('auth', 'USER_CREATED', 'Admin', `Akun baru diterbitkan: @${user.username} [${user.role}]`);
    return { success: true, user };
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

  // ---------------------------------------------------------------------------
  // System Audit & Realtime Activity Logs
  // ---------------------------------------------------------------------------
  getAuditLogs() {
    return activityLogs;
  },

  addAuditLog(category: 'auth' | 'billing' | 'bracket' | 'seat' | 'admin', action: string, actor: string, details: string) {
    const log = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      category,
      action,
      actor,
      details,
    };
    activityLogs.unshift(log);
    if (activityLogs.length > 100) activityLogs.pop();
  },

  getSystemOverview() {
    const totalCapacity = memoryLobbies.reduce((acc, l) => acc + (l.maxCapacity || 20), 0);
    const totalOnline = memoryLobbies.reduce((acc, l) => acc + (l.onlineCount || 0), 0);
    let totalOccupiedSeats = 0;
    for (const map of bracketSeatOccupancy.values()) {
      totalOccupiedSeats += map.size;
    }

    return {
      serverStatus: 'OPERATIONAL_ONLINE',
      activeBracketsCount: memoryLobbies.filter((l) => l.isActive).length,
      totalCapacity,
      totalOnline,
      totalOccupiedSeats,
      totalCompanies: memoryCompanies.length,
      totalUsers: memoryUsers.length,
      activeBillingSessions: memoryBillingSessions.filter((s) => s.status === 'active').length,
      systemUptimeHours: 142.5,
      databaseMode: 'HYBRID_ENTERPRISE (MySQL + In-Memory Store)',
    };
  },
};
