import { Server as SocketIOServer, Socket } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import {
  PlayerPresence,
  PlayerMovementPacket,
  PlayerChatPacket,
  JoinRoomPayload,
  PlayerMediaState,
  WebRTCSignalPacket,
} from '../types/multiplayer';
import { UserStatus } from '../components/gather/GatherDock';
import { lobbyStore } from './lobbyStore';

// In-Memory Room Registry: roomId -> Map<socketId, PlayerPresence>
const rooms = new Map<string, Map<string, PlayerPresence>>();

export function setupRealtimeSocketIO(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    let currentRoomId = '';
    let playerData: PlayerPresence | null = null;

    socket.on('c:join_room', (payload: JoinRoomPayload) => {
      if (currentRoomId) {
        socket.leave(currentRoomId);
        rooms.get(currentRoomId)?.delete(socket.id);
        socket.to(currentRoomId).emit('s:player_left', { socketId: socket.id });
      }

      currentRoomId = (payload && payload.roomId) ? payload.roomId : 'NEURO-HQ-88';
      socket.join(currentRoomId);

      if (!rooms.has(currentRoomId)) {
        rooms.set(currentRoomId, new Map());
      }
      const roomPlayers = rooms.get(currentRoomId)!;

      const user = (payload && payload.user) || { username: 'Pengunjung', fullName: 'Pengunjung Kantor' };
      const spawnCoords = (payload && payload.spawnCoords) || { x: 1687, y: 880 };

      playerData = {
        socketId: socket.id,
        userId: user.id,
        username: user.username || 'Pengunjung',
        fullName: user.fullName || 'Pengunjung Kantor',
        role: user.role || 'Staff Pengembang',
        avatar: user.avatar || '/assets/characters/resident/standing/south.png',
        archetype: (payload && payload.characterConfig && payload.characterConfig.archetype) || 'resident',
        characterConfig: payload && payload.characterConfig,
        roomId: currentRoomId,
        x: spawnCoords.x,
        y: spawnCoords.y,
        direction: 'south',
        status: 'available',
        zone: 'Workstation Utama',
        lastSeen: Date.now(),
        mediaState: payload?.mediaState || {
          isCamOn: false,
          isMicOn: false,
          isScreenSharing: false,
          isSpeaking: false,
        },
      };

      roomPlayers.set(socket.id, playerData);
      lobbyStore.updateOnlineCount(currentRoomId, roomPlayers.size);

      // 1. Kirim state semua pemain yang ada di ruangan ini ke pemain baru
      const existingPlayers = Array.from(roomPlayers.values());
      socket.emit('s:room_state', { roomId: currentRoomId, players: existingPlayers });

      // Kirim daftar kursi/meja yang sudah ditempati di lobby ini
      const occupiedSeats = lobbyStore.getOccupiedSeats(currentRoomId);
      socket.emit('s:seats_state', { bracketId: currentRoomId, seats: occupiedSeats });

      // 2. Beritahu pemain lain di ruangan yang sama bahwa ada pemain baru bergabung
      socket.to(currentRoomId).emit('s:player_joined', playerData);
      console.log(`[Socket.IO] ${playerData.fullName} (@${playerData.username}) bergabung ke room: ${currentRoomId} (${roomPlayers.size} pemain)`);
    });

    socket.on('c:move', (data: PlayerMovementPacket) => {
      if (!currentRoomId || !playerData || !data) return;
      playerData.x = data.x;
      playerData.y = data.y;
      playerData.direction = data.direction;
      playerData.anim = data.anim;
      playerData.isMoving = Boolean(data.isMoving);
      playerData.isSitting = Boolean(data.isSitting);
      if (data.zone) playerData.zone = data.zone;
      playerData.lastSeen = Date.now();

      socket.to(currentRoomId).emit('s:player_moved', {
        socketId: socket.id,
        x: data.x,
        y: data.y,
        direction: data.direction,
        anim: data.anim,
        isMoving: playerData.isMoving,
        isSitting: playerData.isSitting,
        zone: playerData.zone,
      });
    });

    socket.on('c:status', (data: { status: UserStatus }) => {
      if (!currentRoomId || !playerData || !data) return;
      playerData.status = data.status;
      socket.to(currentRoomId).emit('s:player_status', {
        socketId: socket.id,
        status: data.status,
      });
    });

    socket.on('c:chat', (data: { text: string }) => {
      if (!currentRoomId || !playerData || !data || !data.text || !data.text.trim()) return;
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const packet: PlayerChatPacket = {
        id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        socketId: socket.id,
        sender: playerData.fullName.split(' ')[0] || playerData.username,
        text: data.text.trim(),
        time: timeStr,
        userAvatar: playerData.avatar,
      };
      io.to(currentRoomId).emit('s:chat_message', packet);
    });

    socket.on('c:reaction', (data: { emoji: string }) => {
      if (!currentRoomId || !data || !data.emoji) return;
      io.to(currentRoomId).emit('s:reaction_triggered', {
        socketId: socket.id,
        emoji: data.emoji,
      });
    });

    // Realtime Character Customization Sync
    socket.on('c:character_update', (data: { characterConfig: any }) => {
      if (!currentRoomId || !playerData || !data || !data.characterConfig) return;
      playerData.characterConfig = data.characterConfig;
      playerData.archetype = data.characterConfig.archetype || 'resident';
      io.to(currentRoomId).emit('s:player_character_updated', {
        socketId: socket.id,
        archetype: playerData.archetype,
        characterConfig: data.characterConfig,
      });
      console.log(`[Socket.IO] ${playerData.fullName} mengupdate karakter (@${playerData.username})`);
    });

    // 5. Realtime Camera / Mic / Speaking Media Sync (Google Meet style)
    socket.on('c:media_state', (data: { mediaState: PlayerMediaState }) => {
      if (!currentRoomId || !playerData || !data || !data.mediaState) return;
      playerData.mediaState = data.mediaState;
      socket.to(currentRoomId).emit('s:media_state', {
        socketId: socket.id,
        mediaState: data.mediaState,
      });
    });

    // 6. WebRTC P2P Video/Audio Mesh Signaling
    socket.on('c:webrtc_signal', (data: WebRTCSignalPacket) => {
      if (!data || !data.targetSocketId || !data.signal) return;
      io.to(data.targetSocketId).emit('s:webrtc_signal', {
        senderSocketId: socket.id,
        signal: data.signal,
      });
    });

    // 7. Video Conference & Meeting Realtime Events
    socket.on('c:meeting_create', (session: any) => {
      io.emit('s:meeting_created', session);
    });

    socket.on('c:meeting_join', (data: any) => {
      if (data && data.meetingId) {
        socket.join(`meeting:${data.meetingId}`);
        socket.to(`meeting:${data.meetingId}`).emit('s:meeting_joined', data);
      }
    });

    socket.on('c:meeting_leave', (data: any) => {
      if (data) {
        io.emit('s:meeting_left', data);
      }
    });

    socket.on('c:host_mute_participant', (data: any) => {
      io.emit('s:host_muted', data);
    });

    socket.on('c:host_kick_participant', (data: any) => {
      io.emit('s:host_kicked', data);
    });

    socket.on('c:host_lock_meeting', (data: any) => {
      io.emit('s:host_locked', data);
    });

    socket.on('c:host_end_meeting', (data: any) => {
      io.emit('s:host_ended', data);
    });

    // 8. Breakout Room Realtime Events
    socket.on('c:breakout_opened', (data: any) => {
      io.emit('s:breakout_opened', data);
    });

    socket.on('c:breakout_closed', (data: any) => {
      io.emit('s:breakout_closed', data);
    });

    socket.on('c:breakout_move', (data: any) => {
      io.emit('s:breakout_move', data);
    });

    // 9. Realtime Team Announcement from Leader Dashboard
    socket.on('c:announcement', (data: { text: string; sender: string; role?: string }) => {
      if (!currentRoomId || !data || !data.text) return;
      io.to(currentRoomId).emit('s:announcement_broadcast', {
        id: `ann-${Date.now()}`,
        text: data.text.trim(),
        sender: data.sender || (playerData?.fullName || 'Leader Divisi'),
        role: data.role || (playerData?.role || 'Leader'),
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      });
      console.log(`[Socket.IO] Pengumuman broadcast di ${currentRoomId}: ${data.text}`);
    });

    // 10. Realtime Agenda & To-Do List Synchronization
    socket.on('c:task_sync', (data: { action: 'create' | 'toggle' | 'delete'; task?: any; taskId?: string }) => {
      if (!currentRoomId || !data) return;
      if (data.action === 'create' && data.task) {
        lobbyStore.addTask(data.task);
      } else if (data.action === 'toggle' && data.taskId) {
        lobbyStore.toggleTask(data.taskId);
      } else if (data.action === 'delete' && data.taskId) {
        lobbyStore.deleteTask(data.taskId);
      }
      io.to(currentRoomId).emit('s:task_sync', data);
    });


    socket.on('c:breakout_return_main', (data: any) => {
      io.emit('s:breakout_return_main', data);
    });

    socket.on('c:breakout_broadcast_msg', (data: any) => {
      io.emit('s:breakout_broadcast_msg', data);
    });

    // 9. Seat Claim & Occupancy (Anti-Stacking Engine: 1 Kursi/Meja = 1 Orang)
    socket.on('c:seat_claim', (data: { seatId: string; user: any }) => {
      if (!currentRoomId || !data || !data.seatId) return;
      const res = lobbyStore.claimSeat(currentRoomId, data.seatId, {
        socketId: socket.id,
        userId: data.user?.id,
        username: data.user?.username || playerData?.username || 'Pengguna',
        fullName: data.user?.fullName || playerData?.fullName || 'Pengguna Kantor',
        avatar: data.user?.avatar || playerData?.avatar,
        role: data.user?.role || playerData?.role,
      });

      if (!res.success) {
        socket.emit('s:seat_denied', {
          seatId: data.seatId,
          message: res.message || 'Kursi ini sudah ditempati oleh orang lain!',
        });
      } else {
        socket.emit('s:seat_claimed', { seatId: data.seatId, record: res.record });
        io.to(currentRoomId).emit('s:seat_occupied', {
          bracketId: currentRoomId,
          seatId: data.seatId,
          record: res.record,
        });
      }
    });

    socket.on('c:seat_vacate', (data: { seatId: string }) => {
      if (!currentRoomId || !data || !data.seatId) return;
      const ok = lobbyStore.vacateSeat(currentRoomId, data.seatId, socket.id);
      if (ok) {
        io.to(currentRoomId).emit('s:seat_vacated', {
          bracketId: currentRoomId,
          seatId: data.seatId,
        });
      }
    });

    socket.on('disconnect', () => {
      // Bebaskan seluruh kursi yang ditempati oleh socket ini
      const vacatedSeats = lobbyStore.vacateAllSeatsForSocket(socket.id);
      for (const item of vacatedSeats) {
        io.to(item.bracketId).emit('s:seat_vacated', {
          bracketId: item.bracketId,
          seatId: item.seatId,
        });
      }

      if (currentRoomId && rooms.has(currentRoomId)) {
        const roomPlayers = rooms.get(currentRoomId)!;
        roomPlayers.delete(socket.id);
        lobbyStore.updateOnlineCount(currentRoomId, roomPlayers.size);
        socket.to(currentRoomId).emit('s:player_left', { socketId: socket.id });
        console.log(`[Socket.IO] Socket ${socket.id} keluar dari room: ${currentRoomId} (${roomPlayers.size} tersisa)`);
        if (roomPlayers.size === 0) {
          rooms.delete(currentRoomId);
        }
      }
    });
  });

  return io;
}
