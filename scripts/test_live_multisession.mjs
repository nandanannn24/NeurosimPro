import http from 'http';
import { io as ClientIO } from 'socket.io-client';
import { setupRealtimeSocketIO } from './src/lib/socketHandler.ts';
import { lobbyStore } from './src/lib/lobbyStore.ts';
import { signJwt, verifyJwt } from './src/lib/jwt.ts';

const PORT = 3099;
const server = http.createServer((req, res) => {
  const url = req.url?.split('?')[0];

  // Enable CORS for testing
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // 1. Tasks API
  if (req.method === 'GET' && url === '/api/tasks') {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, tasks: lobbyStore.getTasks() }));
    return;
  }

  // 2. Admin Overview API with JWT Guard
  if (url?.startsWith('/api/admin/')) {
    const authHeader = req.headers['authorization'];
    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    const check = verifyJwt(token);
    const isSuper = check.valid && (check.payload?.roleSlug === 'super_admin' || check.payload?.role === 'Super Administrator');

    if (!isSuper) {
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, message: 'Akses ditolak: Hanya Super Admin yang berhak.' }));
      return;
    }

    if (url === '/api/admin/overview') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, overview: lobbyStore.getSystemOverview() }));
      return;
    }
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ success: false, message: 'Not Found' }));
});

const ioServer = setupRealtimeSocketIO(server);

server.listen(PORT, async () => {
  console.log(`[TEST SERVER] Live test server listening on port ${PORT}`);
  runLiveTests().catch((err) => {
    console.error('[TEST ERROR] Suite failed with exception:', err);
    process.exit(1);
  });
});

async function runLiveTests() {
  const results = [];
  const record = (name, passed, detail) => {
    results.push({ name, passed, detail });
    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name}: ${detail}`);
  };

  const clientUrl = `http://localhost:${PORT}`;

  // ---------------------------------------------------------------------------
  // STEP 1: Connect 3 Simultaneous Clients Across 2 Different Brackets
  // ---------------------------------------------------------------------------
  const client1 = ClientIO(clientUrl, { transports: ['websocket'] }); // Staff in LOBBY-01
  const client2 = ClientIO(clientUrl, { transports: ['websocket'] }); // Leader in LOBBY-01
  const client3 = ClientIO(clientUrl, { transports: ['websocket'] }); // Guest in LOBBY-PUBLIC

  await Promise.all([
    new Promise((res) => client1.on('connect', res)),
    new Promise((res) => client2.on('connect', res)),
    new Promise((res) => client3.on('connect', res)),
  ]);
  record('Socket Connection', true, `Client 1 (${client1.id}), Client 2 (${client2.id}), Client 3 (${client3.id}) connected.`);

  // ---------------------------------------------------------------------------
  // STEP 2: Join Room & Presence Handshake
  // ---------------------------------------------------------------------------
  let client1NotifiedOfClient2 = false;
  let client2InitialPlayerCount = 0;

  client1.on('s:player_joined', (p) => {
    if (p.socketId === client2.id) client1NotifiedOfClient2 = true;
  });

  // Client 1 joins LOBBY-01
  client1.emit('c:join_room', {
    roomId: 'LOBBY-01',
    user: { id: 3, username: 'staff1', fullName: 'Staff Rian', role: 'Staff Tim', roleSlug: 'employee' },
  });
  await new Promise((r) => setTimeout(r, 200));

  // Client 2 joins LOBBY-01
  const client2JoinedPromise = new Promise((resolve) => {
    client2.on('s:room_state', (data) => {
      client2InitialPlayerCount = (data && data.players) ? data.players.length : 0;
      resolve();
    });
  });

  client2.emit('c:join_room', {
    roomId: 'LOBBY-01',
    user: { id: 2, username: 'leader1', fullName: 'Leader Budi', role: 'Leader Tim', roleSlug: 'manager' },
  });
  await client2JoinedPromise;

  // Client 3 joins LOBBY-PUBLIC (Guest Lobby)
  client3.emit('c:join_room', {
    roomId: 'LOBBY-PUBLIC',
    user: { id: 99, username: 'guest99', fullName: 'Tamu Eksternal', role: 'Tamu', roleSlug: 'guest' },
  });
  await new Promise((r) => setTimeout(r, 300));

  record('Presence Handshake', client1NotifiedOfClient2 && client2InitialPlayerCount >= 1, `Client 1 saw Client 2 join, Client 2 received initial players.`);

  // ---------------------------------------------------------------------------
  // STEP 3: Multi-tenant Room Isolation Test
  // ---------------------------------------------------------------------------
  let client3ReceivedLobby1Movement = false;
  client3.on('s:player_moved', () => {
    client3ReceivedLobby1Movement = true;
  });

  let client2ReceivedMovement = false;
  let receivedCoords = null;
  client2.on('s:player_moved', (data) => {
    if (data.socketId === client1.id) {
      client2ReceivedMovement = true;
      receivedCoords = data;
    }
  });

  client1.emit('c:move', { x: 1450, y: 820, direction: 'east', isMoving: true });
  await new Promise((r) => setTimeout(r, 300));

  record(
    'Movement Sync & Room Isolation',
    client2ReceivedMovement && !client3ReceivedLobby1Movement && receivedCoords?.x === 1450,
    `Client 2 received x=1450, y=820. Client 3 in LOBBY-PUBLIC received 0 packets (strict isolation verified).`
  );

  // ---------------------------------------------------------------------------
  // STEP 4: Seating Position Synchronization & Anti-Stacking
  // ---------------------------------------------------------------------------
  let client2ReceivedSeated = false;
  client2.on('s:seat_occupied', (data) => {
    if (data.seatId === 'chair-ws-03') {
      client2ReceivedSeated = true;
    }
  });

  client1.emit('c:seat_claim', { seatId: 'chair-ws-03', user: { id: 3, fullName: 'Staff Rian' } });
  await new Promise((r) => setTimeout(r, 300));

  record('Seating Position Sync', client2ReceivedSeated, `Client 2 verified Client 1 claimed and occupied chair-ws-03 in real time.`);

  // ---------------------------------------------------------------------------
  // STEP 5: Realtime Leader Announcement Broadcast
  // ---------------------------------------------------------------------------
  let client1ReceivedAnnouncement = null;
  let client3ReceivedAnnouncement = false;

  client1.on('s:announcement_broadcast', (ann) => {
    client1ReceivedAnnouncement = ann;
  });
  client3.on('s:announcement_broadcast', () => {
    client3ReceivedAnnouncement = true;
  });

  client2.emit('c:announcement', {
    text: 'Sesi Review Sprint All-Hands pukul 14:00 WIB',
    sender: 'Leader Budi',
    role: 'Leader Tim',
  });
  await new Promise((r) => setTimeout(r, 300));

  record(
    'Leader Broadcast Announcement',
    Boolean(client1ReceivedAnnouncement && !client3ReceivedAnnouncement && client1ReceivedAnnouncement.text.includes('14:00')),
    `Client 1 received announcement: "${client1ReceivedAnnouncement?.text}". Guest lobby isolated.`
  );

  // ---------------------------------------------------------------------------
  // STEP 6: Realtime Shared Agenda & To-Do List Synchronization
  // ---------------------------------------------------------------------------
  let client2ReceivedTaskCreate = false;
  let client1ReceivedTaskToggle = false;

  client2.on('s:task_sync', (data) => {
    if (data.action === 'create' && data.task?.title?.includes('WebRTC P2P Mesh')) {
      client2ReceivedTaskCreate = true;
    }
  });

  client1.on('s:task_sync', (data) => {
    if (data.action === 'toggle' && data.taskId === 'task-live-test-1') {
      client1ReceivedTaskToggle = true;
    }
  });

  const testTask = {
    id: 'task-live-test-1',
    title: 'Finalisasi WebRTC P2P Mesh & Turn Server',
    category: 'Development',
    zone: 'Workstation Utama',
    assignedTo: 'Staff Rian',
    completed: false,
    createdAt: new Date().toISOString(),
  };

  client1.emit('c:task_sync', { action: 'create', task: testTask });
  await new Promise((r) => setTimeout(r, 300));

  // Client 2 toggles the task
  client2.emit('c:task_sync', { action: 'toggle', taskId: 'task-live-test-1' });
  await new Promise((r) => setTimeout(r, 300));

  record(
    'To-Do List Realtime Sync',
    client2ReceivedTaskCreate && client1ReceivedTaskToggle,
    `Client 1 created task -> Client 2 received. Client 2 toggled -> Client 1 received update.`
  );

  // ---------------------------------------------------------------------------
  // STEP 7: WebRTC P2P Signaling Handshake (Offer -> Answer -> Candidate)
  // ---------------------------------------------------------------------------
  let client2ReceivedOffer = null;
  let client1ReceivedAnswer = null;
  let client2ReceivedCandidate = null;

  client2.on('s:webrtc_signal', (data) => {
    if (data.signal?.type === 'offer') client2ReceivedOffer = data.signal;
    if (data.signal?.type === 'candidate') client2ReceivedCandidate = data.signal;
  });

  client1.on('s:webrtc_signal', (data) => {
    if (data.signal?.type === 'answer') client1ReceivedAnswer = data.signal;
  });

  // Client 1 sends offer to Client 2
  client1.emit('c:webrtc_signal', {
    targetSocketId: client2.id,
    signal: { type: 'offer', sdp: { type: 'offer', sdp: 'v=0\r\no=Client1_LiveTest...' } },
  });
  await new Promise((r) => setTimeout(r, 200));

  // Client 2 responds with answer to Client 1
  client2.emit('c:webrtc_signal', {
    targetSocketId: client1.id,
    signal: { type: 'answer', sdp: { type: 'answer', sdp: 'v=0\r\no=Client2_LiveTest...' } },
  });
  await new Promise((r) => setTimeout(r, 200));

  // Client 1 sends ICE candidate to Client 2
  client1.emit('c:webrtc_signal', {
    targetSocketId: client2.id,
    signal: { type: 'candidate', candidate: { candidate: 'candidate:1 1 UDP 2130706431 127.0.0.1 50000 typ host', sdpMid: '0', sdpMLineIndex: 0 } },
  });
  await new Promise((r) => setTimeout(r, 200));

  record(
    'WebRTC P2P Signaling Exchange',
    Boolean(client2ReceivedOffer && client1ReceivedAnswer && client2ReceivedCandidate),
    `Full 3-step WebRTC handshake (Offer -> Answer -> ICE Candidate) exchanged successfully across peers.`
  );

  // ---------------------------------------------------------------------------
  // STEP 8: Backend Security & Role Guard Verification
  // ---------------------------------------------------------------------------
  const staffToken = signJwt({ id: 3, username: 'staff1', role: 'Staff Tim', roleSlug: 'employee' });
  const adminToken = signJwt({ id: 1, username: 'admin', role: 'Super Administrator', roleSlug: 'super_admin' });

  // Test 1: No token
  const resNoToken = await fetch(`http://localhost:${PORT}/api/admin/overview`).then((r) => r.status);
  // Test 2: Staff token (Unauthorized)
  const resStaff = await fetch(`http://localhost:${PORT}/api/admin/overview`, {
    headers: { Authorization: `Bearer ${staffToken}` },
  }).then((r) => r.status);
  // Test 3: Admin token (Authorized)
  const resAdmin = await fetch(`http://localhost:${PORT}/api/admin/overview`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminData = await resAdmin.json();

  record(
    'Backend Security Guard',
    resNoToken === 403 && resStaff === 403 && resAdmin.status === 200 && adminData.success === true,
    `No token -> 403. Staff token -> 403. Super Admin token -> 200 (Success).`
  );

  // ---------------------------------------------------------------------------
  // STEP 9: Clean Disconnect
  // ---------------------------------------------------------------------------
  const client1SocketId = client1.id;
  let client2NotifiedOfClient1Leave = false;
  client2.on('s:player_left', (data) => {
    const id = typeof data === 'object' ? data.socketId : data;
    if (id === client1SocketId) client2NotifiedOfClient1Leave = true;
  });

  client1.disconnect();
  client3.disconnect();
  await new Promise((r) => setTimeout(r, 400));
  client2.disconnect();

  record('Session Cleanup', client2NotifiedOfClient1Leave, `Client 2 received s:player_left when Client 1 disconnected.`);

  console.log('\n======================================================');
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${results.filter((r) => r.passed).length} | FAILED: ${results.filter((r) => !r.passed).length}`);
  console.log('======================================================');

  server.close(() => {
    process.exit(results.every((r) => r.passed) ? 0 : 1);
  });
}
