export interface MeetingParticipant {
  id: string;
  socketId?: string;
  userId?: number;
  name: string;
  role: 'host' | 'cohost' | 'participant';
  avatar?: string;
  isMuted: boolean;
  isCamOn: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
  joinedAt: string;
  assignedBreakoutId?: string;
  currentRoomId: string; // meeting id or breakout id
}

export interface BreakoutRoom {
  id: string;
  meetingId: string;
  name: string;
  roomIndex: number;
  status: 'inactive' | 'active' | 'closed';
  durationSeconds: number; // e.g. 900 (15 min)
  remainingSeconds: number;
  openedAt?: string;
  participants: MeetingParticipant[];
}

export interface MeetingSession {
  id: string;
  workspaceId: string;
  title: string;
  description?: string;
  code: string;
  passcode?: string;
  hostId: string;
  hostName: string;
  isLocked: boolean;
  status: 'scheduled' | 'in_progress' | 'ended';
  maxParticipants: number;
  createdAt: string;
  scheduledStart?: string;
  participants: MeetingParticipant[];
  breakoutRooms: BreakoutRoom[];
  isBreakoutActive: boolean;
}

export interface CreateMeetingInput {
  title: string;
  description?: string;
  code?: string;
  passcode?: string;
  maxParticipants?: number;
  workspaceId?: string;
}

export interface CreateBreakoutInput {
  meetingId: string;
  count: number;
  durationMinutes: number;
  assignmentMethod: 'auto' | 'manual' | 'random';
  manualAssignments?: Record<string, string[]>; // breakoutIndex -> participantIds
}

export type MeetingViewMode = 'gallery' | 'speaker' | 'compact';

