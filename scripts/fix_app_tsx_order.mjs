import fs from 'fs';
import path from 'path';

const appPath = path.resolve('src/App.tsx');
let code = fs.readFileSync(appPath, 'utf8');

// 1. Remove the misplaced callback definitions from lines ~75-115
const misplacedBlock = `  const handleOpenVideoConference = useCallback(() => {
    let meeting = meetingService.getActiveMeeting();
    if (!meeting) {
      meeting = meetingService.createMeeting(
        {
          title: \`Konferensi \${currentRoom.name}\`,
          description: \`Sesi video conference dan kolaborasi tim di ruang \${currentRoom.name}\`,
          code: currentRoom.code,
          workspaceId: 'ws-main',
          maxParticipants: currentRoom.capacity || 25,
        },
        {
          id: currentUser?.id ? String(currentUser.id) : \`user-\${Date.now()}\`,
          name: currentUser?.fullName || getUserDisplayName(currentUser),
          role: currentUser?.role === 'Manager' || currentUser?.role === 'Super Administrator' ? 'host' : 'participant',
          avatar: currentUser?.avatar || \`/assets/characters/\${characterConfig.archetype || 'resident'}/standing/south.png\`,
        }
      );
    }
    setActiveMeetingSession(meeting);
    setIsMeetingLobbyOpen(true);
  }, [currentRoom, currentUser, characterConfig]);

  const handleJoinMeetingFromLobby = useCallback((options: { isCamOn: boolean; isMicOn: boolean }) => {
    setIsCamOn(options.isCamOn);
    setIsMicOn(options.isMicOn);
    multiplayerService.sendMediaState({ isCamOn: options.isCamOn, isMicOn: options.isMicOn });
    setIsMeetingLobbyOpen(false);
    setIsVideoConferenceOpen(true);
  }, []);

  const handleLeaveVideoConference = useCallback(() => {
    setIsVideoConferenceOpen(false);
    setIsCamOn(false);
    setIsMicOn(false);
    multiplayerService.sendMediaState({ isCamOn: false, isMicOn: false });
    if (activeMeetingSession && currentUser) {
      meetingService.leaveMeeting(activeMeetingSession.id, String(currentUser.id));
    }
  }, [activeMeetingSession, currentUser]);\r?\n\r?\n`;

code = code.replace(new RegExp(misplacedBlock.replace(/\r?\n/g, '\\r?\\n')), '');

// 2. Insert properly placed callbacks after dynamicParticipants is declared
const correctCallbacks = `  const handleOpenVideoConference = useCallback(() => {
    let meeting = meetingService.getMeeting();
    if (!meeting) {
      meeting = meetingService.createMeeting(
        {
          title: \`Konferensi \${currentRoom.name}\`,
          description: \`Sesi video conference dan kolaborasi tim di ruang \${currentRoom.name}\`,
          code: currentRoom.code,
          workspaceId: 'ws-main',
          maxParticipants: currentRoom.capacity || 25,
        },
        {
          id: currentUser?.id ? String(currentUser.id) : \`user-\${Date.now()}\`,
          name: currentUser?.fullName || getUserDisplayName(currentUser),
          avatar: currentUser?.avatar || \`/assets/characters/\${characterConfig.archetype || 'resident'}/standing/south.png\`,
        }
      );
    }
    setActiveMeetingSession(meeting);
    setIsMeetingLobbyOpen(true);
  }, [currentRoom, currentUser, characterConfig]);

  const handleJoinMeetingFromLobby = useCallback((options: { isCamOn: boolean; isMicOn: boolean }) => {
    setIsCamOn(options.isCamOn);
    setIsMicOn(options.isMicOn);
    multiplayerService.sendMediaState({ isCamOn: options.isCamOn, isMicOn: options.isMicOn });
    setIsMeetingLobbyOpen(false);
    setIsVideoConferenceOpen(true);
  }, []);

  const handleLeaveVideoConference = useCallback(() => {
    setIsVideoConferenceOpen(false);
    setIsCamOn(false);
    setIsMicOn(false);
    multiplayerService.sendMediaState({ isCamOn: false, isMicOn: false });
    if (activeMeetingSession && currentUser) {
      meetingService.leaveMeeting(activeMeetingSession.id, String(currentUser.id));
    }
  }, [activeMeetingSession, currentUser]);

  const liveParticipants = dynamicParticipants;`;

code = code.replace("  const liveParticipants = dynamicParticipants;", correctCallbacks);

// 3. Remove onStartScenario from ParticipantsDrawer in JSX
code = code.replace("                onStartScenario={handleStartScenario}\r\n", "");
code = code.replace("                onStartScenario={handleStartScenario}\n", "");

fs.writeFileSync(appPath, code, 'utf8');
console.log('Successfully reordered App.tsx');

