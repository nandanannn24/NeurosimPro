export interface HumasContact {
  name: string;
  email: string;
  phone: string;
  title: string;
  notes?: string;
}

export interface CompanyRecord {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  assignedBracketId: string;
  billingKey: string;
  plan: 'enterprise_pro' | 'business_growth';
  status: 'active' | 'suspended' | 'trial';
  validUntil: string;
  humasContact: HumasContact;
  leaderName?: string;
  createdAt: string;
}

export interface LobbyBracket {
  id: string; // e.g. "LOBBY-01"
  name: string; // e.g. "Bracket 1 - Divisi Engineering"
  companyName: string; // e.g. "PT Inovasi Digital Nusantara"
  billingKey: string; // e.g. "BILL-CORP-9821"
  isActive: boolean;
  isLocked: boolean;
  maxCapacity: number; // 20 orang per bracket room
  onlineCount: number;
  serverRegion: string; // "ID-Jakarta-01"
  features: {
    videoConference: boolean;
    screenShare: boolean;
    breakoutRooms: boolean;
    chatRealtime: boolean;
  };
  humasContact?: HumasContact;
  leaderName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillingSession {
  id: string;
  companyName: string;
  billingKey: string;
  plan: 'enterprise_pro' | 'business_growth';
  maxSeatsPerBracket: number; // 20
  totalAllocatedLobbies: number; // up to 5
  status: 'active' | 'suspended' | 'trial';
  validUntil: string;
  contactEmail: string;
  assignedLobbies: string[]; // ["LOBBY-01", "LOBBY-02"]
  humasContact?: HumasContact;
  notes?: string;
  createdAt?: string;
}

export interface SeatOccupancyRecord {
  seatId: string;
  bracketId: string;
  occupiedBy: {
    socketId: string;
    userId?: string | number;
    username: string;
    fullName: string;
    avatar?: string;
    role?: string;
  } | null;
  occupiedAt?: number;
}

export type AppUserRole = 'super_admin' | 'org_admin' | 'manager' | 'employee' | 'guest';

export type CompanyRole = 'boss' | 'humas' | 'staff' | 'admin' | 'guest';

export interface CompanyAccessCode {
  id: string; // e.g. "CODE-01"
  code: string; // e.g. "IDN-BOSS-8821"
  companyId: string; // e.g. "COMP-01"
  companyName: string; // e.g. "PT Inovasi Digital Nusantara"
  bracketId: string; // e.g. "LOBBY-01"
  roomName: string; // e.g. "Bracket 01 - Kantor Pusat Utama"
  role: 'boss' | 'humas' | 'staff';
  roleName: string; // "Pimpinan / Boss", "Humas / Corporate Affairs", "Staff Internal"
  isActive: boolean;
  usedCount: number;
  maxUses?: number;
  expiresAt: string;
  createdAt: string;
  createdBy: string;
  notes?: string;
}

export interface EnterpriseUserRecord {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  roleSlug: AppUserRole;
  title: string;
  department: string;
  avatar: string;
  companyName: string;
  bracketId: string;
  isActive: boolean;
  createdAt: string;
}
