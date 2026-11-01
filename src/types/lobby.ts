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
  notes?: string;
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

