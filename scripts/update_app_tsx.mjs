import fs from 'fs';
import path from 'path';

const appPath = path.resolve('src/App.tsx');
let code = fs.readFileSync(appPath, 'utf8');

// 1. Replace GoogleMeetWidget import with meeting modals
code = code.replace(
  "import { GoogleMeetWidget } from './components/gather/GoogleMeetWidget';",
  `import { MeetingLobbyModal } from './components/meeting/MeetingLobbyModal';
import { VideoConferenceModal } from './components/meeting/VideoConferenceModal';
import { meetingService } from './services/meeting.service';
import { MeetingSession } from './types/meeting';`
);

// 2. Remove NPC_PARTICIPANTS block
const npcRegex = /const NPC_PARTICIPANTS: Participant\[\] = \[[\s\S]*?\];\r?\n/;
code = code.replace(npcRegex, '');

// 3. Fallback name in getUserDisplayName
code = code.replace(
  "fallback = 'Rifat'",
  "fallback = 'Pengguna'"
);

// 4. Clean local storage sanitizers in currentUser & characterConfig
code = code.replace(
  "parsed.fullName = 'Rifat Abhista';",
  "parsed.fullName = 'Pengguna NeuroSim';"
);
code = code.replace(
  "parsed.username = 'rifat';",
  "parsed.username = 'pengguna';"
);
code = code.replace(
  "parsed.name = 'Rifat Abhista';",
  "parsed.name = 'Karyawan NeuroSim';"
);

// 5. Clean dynamicParticipants return
code = code.replace(
  "return [localPart, ...remotes, ...NPC_PARTICIPANTS];",
  "return [localPart, ...remotes];"
);

// 6. Add meeting states & handlers inside App component
const stateAnchor = "  // Online Multiplayer Room State (Dibersihkan agar count selalu sinkron dan dinamis)";
const meetingStateBlock = `  // Video Conference & Breakout Room State
  const [isMeetingLobbyOpen, setIsMeetingLobbyOpen] = useState(false);
  const [isVideoConferenceOpen, setIsVideoConferenceOpen] = useState(false);
  const [activeMeetingSession, setActiveMeetingSession] = useState<MeetingSession | null>(null);

  const handleOpenVideoConference = useCallback(() => {
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
  }, [activeMeetingSession, currentUser]);

  // Online Multiplayer Room State (Dibersihkan agar count selalu sinkron dan dinamis)`;

code = code.replace(stateAnchor, meetingStateBlock);

// 7. Pause keyboard capture when meeting modals are open
code = code.replace(
  "isRoomModalOpen ||\n      currentView !== 'simulation';",
  `isRoomModalOpen ||
      isMeetingLobbyOpen ||
      isVideoConferenceOpen ||
      currentView !== 'simulation';`
);
code = code.replace(
  "isRoomModalOpen,\n    currentView,",
  `isRoomModalOpen,
    isMeetingLobbyOpen,
    isVideoConferenceOpen,
    currentView,`
);

// 8. In DashboardView, pass onStartVideoConference
code = code.replace(
  "onBackToLanding={() => setCurrentView('landing')}\n        />",
  `onBackToLanding={() => setCurrentView('landing')}
          onStartVideoConference={handleOpenVideoConference}
        />`
);

// 9. Replace GoogleMeetWidget block with VideoConferenceModal & MeetingLobbyModal
const meetWidgetRegex = /\{\/\* Google Meet Video Conference Widget[\s\S]*?remotePlayers=\{onlineRemotePlayers\}\r?\n\s*\/>/;
const newMeetingModals = `{/* WebRTC Video Conference Modal */}
              <VideoConferenceModal
                isOpen={isVideoConferenceOpen}
                onClose={handleLeaveVideoConference}
                meeting={activeMeetingSession}
                currentUser={{
                  id: currentUser?.id || 'me',
                  username: currentUser?.username || 'user',
                  fullName: currentUser?.fullName || getUserDisplayName(currentUser),
                  role: currentUser?.role,
                  avatar: currentUser?.avatar,
                }}
                remotePlayers={onlineRemotePlayers}
              />

              {/* Meeting Device Lobby Modal */}
              <MeetingLobbyModal
                isOpen={isMeetingLobbyOpen}
                onClose={() => setIsMeetingLobbyOpen(false)}
                meeting={activeMeetingSession}
                userName={currentUser?.fullName || getUserDisplayName(currentUser)}
                userRole={currentUser?.role}
                userAvatar={currentUser?.avatar}
                onJoin={handleJoinMeetingFromLobby}
              />`;

code = code.replace(meetWidgetRegex, newMeetingModals);

// 10. Pass onOpenMeeting to GatherDock
code = code.replace(
  "onOpenCustomizer={() => setIsCustomizerOpen(true)}\n              />",
  `onOpenCustomizer={() => setIsCustomizerOpen(true)}
                onOpenMeeting={handleOpenVideoConference}
              />`
);

fs.writeFileSync(appPath, code, 'utf8');
console.log('Updated App.tsx successfully');

