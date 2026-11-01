import {
  MeetingSession,
  MeetingParticipant,
  BreakoutRoom,
  CreateMeetingInput,
  CreateBreakoutInput,
} from '../types/meeting';
import { multiplayerService } from './multiplayer.service';

type MeetingListener = (meeting: MeetingSession | null) => void;
type BreakoutBroadcastListener = (message: { from: string; text: string; time: string }) => void;

class MeetingService {
  private currentMeeting: MeetingSession | null = null;
  private listeners: Set<MeetingListener> = new Set();
  private broadcastListeners: Set<BreakoutBroadcastListener> = new Set();
  private countdownInterval: number | null = null;

  public subscribe(listener: MeetingListener): () => void {
    this.listeners.add(listener);
    listener(this.currentMeeting);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public onBreakoutBroadcast(listener: BreakoutBroadcastListener): () => void {
    this.broadcastListeners.add(listener);
    return () => {
      this.broadcastListeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.currentMeeting);
    }
  }

  public getMeeting(): MeetingSession | null {
    return this.currentMeeting;
  }

  public createMeeting(input: CreateMeetingInput, host: { id: string; name: string; avatar?: string }): MeetingSession {
    const meetingCode = input.code?.trim().toUpperCase() || `MEET-${Math.floor(1000 + Math.random() * 9000)}`;
    const meetingId = `meeting-${Date.now()}`;

    const hostParticipant: MeetingParticipant = {
      id: host.id,
      name: host.name,
      role: 'host',
      avatar: host.avatar || '/assets/characters/resident/standing/south.png',
      isMuted: false,
      isCamOn: true,
      isScreenSharing: false,
      isSpeaking: false,
      joinedAt: new Date().toISOString(),
      currentRoomId: meetingId,
    };

    const session: MeetingSession = {
      id: meetingId,
      workspaceId: input.workspaceId || 'ws-hq-main',
      title: input.title.trim(),
      description: input.description?.trim(),
      code: meetingCode,
      passcode: input.passcode?.trim(),
      hostId: host.id,
      hostName: host.name,
      isLocked: false,
      status: 'in_progress',
      maxParticipants: input.maxParticipants || 50,
      createdAt: new Date().toISOString(),
      participants: [hostParticipant],
      breakoutRooms: [],
      isBreakoutActive: false,
    };

    this.currentMeeting = session;
    this.notify();

    // Broadcast through socket
    multiplayerService.sendCustomEvent('c:meeting_create', session);
    return session;
  }

  public joinMeeting(
    meetingCode: string,
    user: { id: string; name: string; avatar?: string },
    passcode?: string
  ): { success: boolean; message?: string; meeting?: MeetingSession } {
    if (!this.currentMeeting || this.currentMeeting.code !== meetingCode.toUpperCase()) {
      // Create new session if not existing yet (or remote sync)
      return {
        success: true,
        meeting: this.createMeeting(
          { title: `Meeting Room ${meetingCode}` },
          user
        ),
      };
    }

    const meeting = this.currentMeeting;
    if (meeting.isLocked) {
      return { success: false, message: 'Ruang meeting telah dikunci oleh Host.' };
    }

    if (meeting.passcode && meeting.passcode !== passcode) {
      return { success: false, message: 'Kode sandi meeting salah.' };
    }

    if (meeting.participants.length >= meeting.maxParticipants) {
      return { success: false, message: 'Ruang meeting telah mencapai kapasitas maksimal.' };
    }

    const existingIndex = meeting.participants.findIndex((p) => p.id === user.id);
    const participant: MeetingParticipant = {
      id: user.id,
      name: user.name,
      role: user.id === meeting.hostId ? 'host' : 'participant',
      avatar: user.avatar || '/assets/characters/resident/standing/south.png',
      isMuted: false,
      isCamOn: true,
      isScreenSharing: false,
      isSpeaking: false,
      joinedAt: new Date().toISOString(),
      currentRoomId: meeting.id,
    };

    if (existingIndex >= 0) {
      meeting.participants[existingIndex] = participant;
    } else {
      meeting.participants.push(participant);
    }

    this.notify();
    multiplayerService.sendCustomEvent('c:meeting_join', { meetingId: meeting.id, participant });
    return { success: true, meeting };
  }

  public leaveMeeting(userId: string): void {
    if (!this.currentMeeting) return;
    this.currentMeeting.participants = this.currentMeeting.participants.filter((p) => p.id !== userId);

    if (this.currentMeeting.participants.length === 0) {
      this.closeBreakoutRooms();
      this.currentMeeting = null;
    }
    this.notify();
    multiplayerService.sendCustomEvent('c:meeting_leave', { userId });
  }

  public updateMediaState(userId: string, mediaState: { isCamOn?: boolean; isMicOn?: boolean; isScreenSharing?: boolean }): void {
    if (!this.currentMeeting) return;
    const p = this.currentMeeting.participants.find((part) => part.id === userId);
    if (p) {
      if (mediaState.isCamOn !== undefined) p.isCamOn = mediaState.isCamOn;
      if (mediaState.isMicOn !== undefined) p.isMuted = !mediaState.isMicOn;
      if (mediaState.isScreenSharing !== undefined) p.isScreenSharing = mediaState.isScreenSharing;
      this.notify();
    }
  }

  // Host Controls
  public muteParticipant(hostUserId: string, targetUserId: string): boolean {
    if (!this.currentMeeting || this.currentMeeting.hostId !== hostUserId) return false;
    const target = this.currentMeeting.participants.find((p) => p.id === targetUserId);
    if (target) {
      target.isMuted = true;
      this.notify();
      multiplayerService.sendCustomEvent('c:host_mute_participant', { targetUserId });
      return true;
    }
    return false;
  }

  public kickParticipant(hostUserId: string, targetUserId: string): boolean {
    if (!this.currentMeeting || this.currentMeeting.hostId !== hostUserId) return false;
    this.currentMeeting.participants = this.currentMeeting.participants.filter((p) => p.id !== targetUserId);
    this.notify();
    multiplayerService.sendCustomEvent('c:host_kick_participant', { targetUserId });
    return true;
  }

  public lockMeeting(hostUserId: string, isLocked: boolean): boolean {
    if (!this.currentMeeting || this.currentMeeting.hostId !== hostUserId) return false;
    this.currentMeeting.isLocked = isLocked;
    this.notify();
    multiplayerService.sendCustomEvent('c:host_lock_meeting', { isLocked });
    return true;
  }

  public endMeeting(hostUserId: string): void {
    if (!this.currentMeeting || this.currentMeeting.hostId !== hostUserId) return;
    this.closeBreakoutRooms();
    this.currentMeeting.status = 'ended';
    this.notify();
    multiplayerService.sendCustomEvent('c:host_end_meeting', { meetingId: this.currentMeeting.id });
    this.currentMeeting = null;
    this.notify();
  }

  // =========================================================================
  // BREAKOUT ROOM SYSTEM
  // =========================================================================

  public createBreakoutRooms(input: CreateBreakoutInput, hostUserId: string): BreakoutRoom[] {
    if (!this.currentMeeting || this.currentMeeting.hostId !== hostUserId) return [];

    const meeting = this.currentMeeting;
    const durationSeconds = input.durationMinutes * 60;
    const eligibleParticipants = meeting.participants.filter((p) => p.id !== hostUserId);

    const breakoutRooms: BreakoutRoom[] = [];
    for (let i = 0; i < input.count; i++) {
      breakoutRooms.push({
        id: `breakout-${meeting.id}-${i + 1}`,
        meetingId: meeting.id,
        name: `Breakout Room ${i + 1}`,
        roomIndex: i + 1,
        status: 'inactive',
        durationSeconds,
        remainingSeconds: durationSeconds,
        participants: [],
      });
    }

    if (input.assignmentMethod === 'auto' || input.assignmentMethod === 'random') {
      const shuffled = [...eligibleParticipants];
      if (input.assignmentMethod === 'random') {
        shuffled.sort(() => Math.random() - 0.5);
      }
      shuffled.forEach((p, idx) => {
        const roomIdx = idx % input.count;
        breakoutRooms[roomIdx].participants.push({
          ...p,
          assignedBreakoutId: breakoutRooms[roomIdx].id,
        });
      });
    } else if (input.assignmentMethod === 'manual' && input.manualAssignments) {
      for (let i = 0; i < input.count; i++) {
        const pIds = input.manualAssignments[String(i)] || [];
        pIds.forEach((pid) => {
          const found = eligibleParticipants.find((p) => p.id === pid);
          if (found) {
            breakoutRooms[i].participants.push({
              ...found,
              assignedBreakoutId: breakoutRooms[i].id,
            });
          }
        });
      }
    }

    meeting.breakoutRooms = breakoutRooms;
    this.notify();
    return breakoutRooms;
  }

  public openBreakoutRooms(hostUserId: string): boolean {
    if (!this.currentMeeting || this.currentMeeting.hostId !== hostUserId) return false;
    const meeting = this.currentMeeting;
    meeting.isBreakoutActive = true;

    for (const br of meeting.breakoutRooms) {
      br.status = 'active';
      br.openedAt = new Date().toISOString();
      for (const p of br.participants) {
        p.currentRoomId = br.id;
        // update main participant list record
        const mainP = meeting.participants.find((mp) => mp.id === p.id);
        if (mainP) {
          mainP.currentRoomId = br.id;
          mainP.assignedBreakoutId = br.id;
        }
      }
    }

    this.startBreakoutTimer();
    this.notify();
    multiplayerService.sendCustomEvent('c:breakout_opened', {
      meetingId: meeting.id,
      breakoutRooms: meeting.breakoutRooms,
    });
    return true;
  }

  public closeBreakoutRooms(): void {
    if (!this.currentMeeting) return;
    const meeting = this.currentMeeting;
    meeting.isBreakoutActive = false;

    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    for (const br of meeting.breakoutRooms) {
      br.status = 'closed';
      for (const p of br.participants) {
        p.currentRoomId = meeting.id;
      }
    }

    for (const p of meeting.participants) {
      p.currentRoomId = meeting.id;
      p.assignedBreakoutId = undefined;
    }

    this.notify();
    multiplayerService.sendCustomEvent('c:breakout_closed', { meetingId: meeting.id });
  }

  public moveToBreakoutRoom(userId: string, targetBreakoutId: string): boolean {
    if (!this.currentMeeting) return false;
    const meeting = this.currentMeeting;

    // remove from all breakouts
    for (const br of meeting.breakoutRooms) {
      br.participants = br.participants.filter((p) => p.id !== userId);
    }

    // add to target breakout
    const targetRoom = meeting.breakoutRooms.find((br) => br.id === targetBreakoutId);
    const participant = meeting.participants.find((p) => p.id === userId);

    if (targetRoom && participant) {
      participant.currentRoomId = targetBreakoutId;
      participant.assignedBreakoutId = targetBreakoutId;
      targetRoom.participants.push(participant);
      this.notify();
      multiplayerService.sendCustomEvent('c:breakout_move', { userId, targetBreakoutId });
      return true;
    }
    return false;
  }

  public returnToMainMeeting(userId: string): void {
    if (!this.currentMeeting) return;
    const participant = this.currentMeeting.participants.find((p) => p.id === userId);
    if (participant) {
      participant.currentRoomId = this.currentMeeting.id;
      for (const br of this.currentMeeting.breakoutRooms) {
        br.participants = br.participants.filter((p) => p.id !== userId);
      }
      this.notify();
      multiplayerService.sendCustomEvent('c:breakout_return_main', { userId });
    }
  }

  public broadcastToAllBreakouts(hostUserId: string, messageText: string): boolean {
    if (!this.currentMeeting || this.currentMeeting.hostId !== hostUserId) return false;
    const now = new Date();
    const packet = {
      from: 'Host (Broadcast)',
      text: messageText.trim(),
      time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    };

    for (const l of this.broadcastListeners) {
      l(packet);
    }
    multiplayerService.sendCustomEvent('c:breakout_broadcast_msg', packet);
    return true;
  }

  private startBreakoutTimer(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    this.countdownInterval = window.setInterval(() => {
      if (!this.currentMeeting || !this.currentMeeting.isBreakoutActive) {
        if (this.countdownInterval) clearInterval(this.countdownInterval);
        return;
      }

      let allExpired = true;
      for (const br of this.currentMeeting.breakoutRooms) {
        if (br.remainingSeconds > 0) {
          br.remainingSeconds -= 1;
          allExpired = false;
        }
      }

      this.notify();

      if (allExpired) {
        this.closeBreakoutRooms();
      }
    }, 1000);
  }
}

export const meetingService = new MeetingService();

