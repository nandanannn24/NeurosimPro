import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/layout/Header';
import { CharacterCustomizerModal } from './components/modals/CharacterCustomizerModal';
import { CharacterCustomization } from './types/character';
import { DEFAULT_CHARACTER } from './config/characterOptions';
import { TodoListModal } from './components/modals/TodoListModal';
import { AdminBillingModal } from './components/modals/AdminBillingModal';
import { LobbyBracketSelectorModal } from './components/modals/LobbyBracketSelectorModal';
import { LobbyBracket } from './types/lobby';
import { AuthModal, UserProfile } from './components/modals/AuthModal';
import { OnlineRoomModal } from './components/modals/OnlineRoomModal';
import { PhaserGame } from './game/PhaserGame';
import { EventBus, GAME_EVENTS } from './game/EventBus';
import { TextScale } from './components/ui/A11yControls';
import { OfficeTask, TaskCategory } from './types/task';
import { INITIAL_OFFICE_TASKS } from './config/officeTasks';
import { OfficeRoom, CreateRoomInput } from './types/room';
import { DEFAULT_ROOMS, DEFAULT_CURRENT_ROOM } from './config/defaultRooms';

// View Screens for Complete User Flow
import { LandingView } from './components/views/LandingView';
import { DashboardView, OfficeRoom as DashboardRoom, OFFICE_ROOMS } from './components/views/DashboardView';
import { RoomLobbyView } from './components/views/RoomLobbyView';
import { AdminDashboardView } from './components/views/AdminDashboardView';
import { LeaderDashboardView } from './components/views/LeaderDashboardView';
import { GuestLobbyView } from './components/views/GuestLobbyView';
import { EnterOfficeView } from './components/views/EnterOfficeView';
import { NeuroAssistantModal } from './components/modals/NeuroAssistantModal';
import { AdminComplexLoginModal } from './components/auth/AdminComplexLoginModal';
import { CompanyAccessCode, CompanyRecord } from './types/lobby';
import { Bot, ArrowRight, Bell, X, Tv } from 'lucide-react';
import { TopCameraBar } from './components/gather/TopCameraBar';
import { MinimapWidget } from './components/gather/MinimapWidget';
import { MobileVirtualControls } from './components/gather/MobileVirtualControls';

// Virtual office workspace components
import { GatherDock, UserStatus } from './components/gather/GatherDock';
import { BracketLiveSidebar } from './components/gather/BracketLiveSidebar';
import { ParticipantsDrawer, Participant } from './components/gather/ParticipantsDrawer';
import { OfficeChatDrawer, OfficeChatMessage } from './components/gather/OfficeChatDrawer';
import { WebcamWidget } from './components/gather/WebcamWidget';
import { MeetingLobbyModal } from './components/meeting/MeetingLobbyModal';
import { VideoConferenceModal } from './components/meeting/VideoConferenceModal';
import { meetingService } from './services/meeting.service';
import { MeetingSession } from './types/meeting';
import { ScreenShareWidget } from './components/gather/ScreenShareWidget';
import { multiplayerService } from './services/multiplayer.service';
import { PlayerPresence, PlayerChatPacket } from './types/multiplayer';

export type AppView = 'landing' | 'dashboard' | 'room-lobby' | 'simulation' | 'admin' | 'leader' | 'guest-lobby' | 'enter-office';


// Obrolan kantor dimulai dalam kondisi kosong bersih (dinamis)
const getInitialChatMessages = (): OfficeChatMessage[] => [];

const getUserDisplayName = (user: UserProfile | null, fallback = 'Tamu NeuroSim'): string => {
  if (!user) return fallback;
  if (user.fullName && typeof user.fullName === 'string' && user.fullName.trim().length > 0) {
    const first = user.fullName.trim().split(' ')[0];
    if (first) return first;
  }
  return user.username || fallback;
};

export const App: React.FC = () => {
  // Top-Level User Flow Navigation: landing -> dashboard -> room-lobby -> simulation | admin | leader | guest-lobby
  const [currentView, setCurrentView] = useState<AppView>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('/enter-office') || path.includes('/masuk-kantor')) return 'enter-office';
      if (path.includes('/public-lobby') || path.includes('/lobi-publik')) return 'simulation';
      if (path.includes('/x90x9admin')) return 'admin';
      if (path.includes('/leader')) return 'leader';
      if (path.includes('/guest-lobby') || path.includes('/tamu')) return 'guest-lobby';
      if (path.includes('/simulation')) return 'simulation';
      if (path.includes('/dashboard')) return 'dashboard';

      // Cek apakah ada sesi login aktif & token JWT yang tersimpan
      try {
        const token = localStorage.getItem('neurosim_auth_token');
        const user = localStorage.getItem('neurosim_current_user');
        if (token && user) {
          return 'dashboard';
        }
      } catch {
        // Abaikan jika localStorage tidak dapat diakses
      }
    }
    // Default mutlak halaman awal: START / LANDING PAGE (2 Mode)
    return 'landing';
  });

  const navigateTo = useCallback((view: AppView, path?: string) => {
    setCurrentView(view);
    if (typeof window !== 'undefined' && path) {
      window.history.pushState({}, '', path);
    }
  }, []);

  // Sync URL Path on initial load and browser back/forward buttons
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const syncFromLocation = () => {
        const path = window.location.pathname.toLowerCase();
        if (path.includes('/enter-office') || path.includes('/masuk-kantor')) {
          setCurrentView('enter-office');
        } else if (path.includes('/public-lobby') || path.includes('/lobi-publik')) {
          setCurrentView('simulation');
          setCurrentLobbyId('LOBBY-PUBLIC');
          setCurrentLobbyName('Public Lobby - Ruang Eksplorasi Tamu');
        } else if (path.includes('/x90x9admin')) {
          setCurrentView('admin');
        } else if (path.includes('/leader')) {
          setCurrentView('leader');
        } else if (path.includes('/guest-lobby') || path.includes('/tamu')) {
          setCurrentView('guest-lobby');
        } else if (path.includes('/simulation')) {
          setCurrentView('simulation');
        } else {
          const params = new URLSearchParams(window.location.search);
          const v = params.get('view');
          if (v === 'admin') setCurrentView('admin');
          else if (v === 'leader') setCurrentView('leader');
          else if (v === 'guest-lobby') setCurrentView('guest-lobby');
          else if (v === 'dashboard') setCurrentView('dashboard');
          else {
            try {
              const token = localStorage.getItem('neurosim_auth_token');
              const user = localStorage.getItem('neurosim_current_user');
              if (token && user) {
                setCurrentView('dashboard');
              } else {
                setCurrentView('landing');
              }
            } catch {
              setCurrentView('landing');
            }
          }
        }
      };

      syncFromLocation();
      window.addEventListener('popstate', syncFromLocation);
      return () => window.removeEventListener('popstate', syncFromLocation);
    }
  }, []);

  // Verifikasi JWT token & refresh profil pengguna saat aplikasi pertama kali dibuka
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const token = localStorage.getItem('neurosim_auth_token');
      if (!token) return;

      fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setCurrentUser(data.user);
            localStorage.setItem('neurosim_current_user', JSON.stringify(data.user));
          } else {
            console.warn('[JWT Verify] Token kedaluwarsa atau tidak sah:', data.message);
            localStorage.removeItem('neurosim_auth_token');
            localStorage.removeItem('neurosim_current_user');
            setCurrentUser(null);
            if (window.location.pathname === '/' || window.location.pathname === '/dashboard') {
              setCurrentView('landing');
            }
          }
        })
        .catch((err) => {
          console.warn('[JWT Verify Error]:', err);
        });
    } catch {
      // LocalStorage access exception
    }
  }, []);

  // Listen to status changes from Game Engine (e.g. Workstation sit -> Sedang Bekerja)
  useEffect(() => {
    const handleStatusChanged = (st: UserStatus) => {
      setUserStatus(st);
    };
    EventBus.on('neurosim_status_changed', handleStatusChanged);
    return () => {
      EventBus.off('neurosim_status_changed', handleStatusChanged);
    };
  }, []);

  // User Account & Session (MySQL Synced)
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('neurosim_current_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.fullName === 'string' && parsed.fullName.includes('Baginda')) {
          parsed.fullName = 'Pengguna NeuroSim';
          parsed.username = 'pengguna';
          localStorage.setItem('neurosim_current_user', JSON.stringify(parsed));
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Character Customizer State (Universal LPC Format)
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [characterConfig, setCharacterConfig] = useState<CharacterCustomization>(() => {
    try {
      const saved = localStorage.getItem('neurosim_character_config');
      const token = localStorage.getItem('neurosim_auth_token');
      const userStr = localStorage.getItem('neurosim_current_user');
      const isActualAdmin = token && userStr && (userStr.includes('nandzzz') || userStr.includes('super_admin'));

      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.name === 'string') {
          if (!isActualAdmin && (parsed.name.toLowerCase().includes('admin') || parsed.name.toLowerCase().includes('administrator') || parsed.name.includes('Baginda') || !parsed.name.trim())) {
            parsed.name = 'Tamu NeuroSim';
            localStorage.setItem('neurosim_character_config', JSON.stringify(parsed));
          }
        }
        return parsed;
      }
      return { ...DEFAULT_CHARACTER, name: 'Tamu NeuroSim' };
    } catch {
      return { ...DEFAULT_CHARACTER, name: 'Tamu NeuroSim' };
    }
  });

  const [selectedRoom, setSelectedRoom] = useState<DashboardRoom>(OFFICE_ROOMS[0]);
  const [mode, setMode] = useState<'2d' | 'list'>('2d');
  const [isTodoListOpen, setIsTodoListOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isAiGuideOpen, setIsAiGuideOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [companyAccess, setCompanyAccess] = useState<{ accessCode?: CompanyAccessCode; company?: CompanyRecord } | null>(() => {
    try {
      const saved = localStorage.getItem('neurosim_company_access');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleNavigatePublicLobby = useCallback(() => {
    setCurrentLobbyId('LOBBY-PUBLIC');
    setCurrentLobbyName('Public Lobby - Ruang Eksplorasi Tamu');
    if (!currentUser) {
      setCharacterConfig((prev) => {
        if (prev.name.toLowerCase().includes('admin')) {
          const reset = { ...prev, name: 'Tamu NeuroSim' };
          try { localStorage.setItem('neurosim_character_config', JSON.stringify(reset)); } catch {}
          return reset;
        }
        return prev;
      });
    }
    setCurrentView('simulation');
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/public-lobby');
    }
    setTimeout(() => {
      EventBus.emit(GAME_EVENTS.TELEPORT_TO_ROOM, { x: 1375, y: 1260 });
      EventBus.emit('LOCAL_PLAYER_NAME_UPDATE', currentUser ? getUserDisplayName(currentUser) : 'Tamu NeuroSim');
    }, 150);
  }, [currentUser]);

  const handleNavigateEnterOffice = useCallback(() => {
    setCurrentView('enter-office');
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/enter-office');
    }
  }, []);



  // Video Conference & Breakout Room State
  const [isMeetingLobbyOpen, setIsMeetingLobbyOpen] = useState(false);
  const [isVideoConferenceOpen, setIsVideoConferenceOpen] = useState(false);
  const [activeMeetingSession, setActiveMeetingSession] = useState<MeetingSession | null>(null);

  // 5 Online Server Brackets & Enterprise Billing Session State
  const [isAdminBillingOpen, setIsAdminBillingOpen] = useState(false);
  const [isLobbySelectorOpen, setIsLobbySelectorOpen] = useState(false);
  const [authRestrictionNotice, setAuthRestrictionNotice] = useState<string | null>(null);

  const handleRequireAuth = useCallback((notice: string) => {
    setAuthRestrictionNotice(notice);
    setIsAuthOpen(true);
  }, []);
  const [currentLobbyId, setCurrentLobbyId] = useState('LOBBY-01');
  const [currentLobbyName, setCurrentLobbyName] = useState('Kantor Pusat NeuroSim');


  // Online Multiplayer Room State (Dibersihkan agar count selalu sinkron dan dinamis)
  const [availableRooms, setAvailableRooms] = useState<OfficeRoom[]>(() => {
    try {
      const saved = localStorage.getItem('neurosim_available_rooms');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((r: any) => ({
            ...r,
            createdAt: r.createdAt && r.createdAt.includes('08:30') ? 'Sesi Aktif' : (r.createdAt || 'Sesi Aktif'),
            activeCount: r.id === 'room-hq-01' ? 1 : 0,
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to parse neurosim_available_rooms:', e);
    }
    return DEFAULT_ROOMS;
  });

  const [currentRoom, setCurrentRoom] = useState<OfficeRoom>(() => {
    try {
      const savedCode = localStorage.getItem('neurosim_current_room_code');
      const savedRooms = localStorage.getItem('neurosim_available_rooms');
      const pool: OfficeRoom[] = savedRooms ? JSON.parse(savedRooms) : DEFAULT_ROOMS;
      if (savedCode && Array.isArray(pool)) {
        const found = pool.find((r) => r.code === savedCode);
        if (found) return { ...found, activeCount: 1 };
      }
    } catch (e) {
      console.warn('Failed to parse current room:', e);
    }
    return DEFAULT_CURRENT_ROOM;
  });


  const [userHistory, setUserHistory] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('neurosim_user_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleEnterCompanyOffice = useCallback(
    (data: {
      accessCode: CompanyAccessCode;
      company: CompanyRecord;
      lobby: LobbyBracket;
    }) => {
      if (!currentUser) {
        setIsAuthOpen(true);
        return;
      }

      setCompanyAccess({
        accessCode: data.accessCode,
        company: data.company,
      });
      try {
        localStorage.setItem(
          'neurosim_company_access',
          JSON.stringify({
            accessCode: data.accessCode,
            company: data.company,
          })
        );
      } catch (e) {
        console.warn('Failed to persist company access:', e);
      }

      if (currentUser) {
        const updatedUser: UserProfile = {
          ...currentUser,
          role: data.accessCode.role as any,
        };
        setCurrentUser(updatedUser);
        try {
          localStorage.setItem('neurosim_current_user', JSON.stringify(updatedUser));
        } catch (e) {
          console.warn('Failed to persist updated user:', e);
        }
      }

      setCurrentLobbyId(data.lobby.id);
      setCurrentLobbyName(data.lobby.name);
      setCurrentView('simulation');
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', `/office/${data.lobby.id}`);
      }

      setTimeout(() => {
        EventBus.emit(GAME_EVENTS.RESUME_INPUT);
        EventBus.emit(GAME_EVENTS.TELEPORT_TO_ROOM, { x: 1375, y: 1260 });
      }, 150);
    },
    [currentUser]
  );

  const [tasks, setTasks] = useState<OfficeTask[]>(() => {
    const saved = localStorage.getItem('neurosim_tasks');
    if (!saved) return INITIAL_OFFICE_TASKS;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      return INITIAL_OFFICE_TASKS;
    } catch {
      return INITIAL_OFFICE_TASKS;
    }
  });

  // Accessibility States
  const [reduceMotion, setReduceMotion] = useState(false);
  const [textScale, setTextScale] = useState<TextScale>('normal');
  const [highContrast, setHighContrast] = useState(false);

  // Apply accessibility settings directly to document root for real REM scaling & effects
  useEffect(() => {
    const root = document.documentElement;
    if (textScale === 'medium') {
      root.style.fontSize = '115%';
    } else if (textScale === 'large') {
      root.style.fontSize = '130%';
    } else {
      root.style.fontSize = '100%';
    }
  }, [textScale]);

  useEffect(() => {
    const root = document.documentElement;
    if (reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [reduceMotion]);

  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [highContrast]);

  // Virtual office workspace states
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isOfficeChatOpen, setIsOfficeChatOpen] = useState(false);

  const [userStatus, setUserStatus] = useState<UserStatus>('available');
  const [currentZoneId, setCurrentZoneId] = useState<string>(() => {
    if (typeof localStorage !== 'undefined') {
      const savedZone = localStorage.getItem('neurosim_current_zone_id');
      if (savedZone) return savedZone;
    }
    return 'room-workspace';
  });
  const [currentZoneName, setCurrentZoneName] = useState<string>('Workstation Utama');

  useEffect(() => {
    const handleZoneChanged = (data: { zoneId: string; name: string }) => {
      setCurrentZoneId(data.zoneId);
      if (data.name) setCurrentZoneName(data.name);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('neurosim_current_zone_id', data.zoneId);
      }
    };

    EventBus.on(GAME_EVENTS.ZONE_CHANGED, handleZoneChanged);
    return () => {
      EventBus.off(GAME_EVENTS.ZONE_CHANGED, handleZoneChanged);
    };
  }, []);

  const [chatMessages, setChatMessages] = useState<OfficeChatMessage[]>(getInitialChatMessages);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [onlineRemotePlayers, setOnlineRemotePlayers] = useState<PlayerPresence[]>([]);

  // Realtime Announcement & Screen Share Viewer States
  const [activeAnnouncement, setActiveAnnouncement] = useState<{
    id: string;
    text: string;
    sender: string;
    role: string;
    timestamp: string;
  } | null>(null);

  const [viewingRemotePresenter, setViewingRemotePresenter] = useState<PlayerPresence | null>(null);

  const activeRemotePresenter = useMemo(() => {
    return onlineRemotePlayers.find((p) => p.mediaState?.isScreenSharing);
  }, [onlineRemotePlayers]);

  // Otomatis sinkronkan jika presenter yang sedang ditonton berhenti sharing
  useEffect(() => {
    if (viewingRemotePresenter) {
      const stillSharing = onlineRemotePlayers.some(
        (p) => p.socketId === viewingRemotePresenter.socketId && p.mediaState?.isScreenSharing
      );
      if (!stillSharing) {
        setViewingRemotePresenter(null);
      }
    }
  }, [onlineRemotePlayers, viewingRemotePresenter]);



  const dynamicParticipants: Participant[] = React.useMemo(() => {
    const localPart: Participant = {
      id: `user-local-${currentUser?.id || 'me'}`,
      name: `${getUserDisplayName(currentUser)} (Anda)`,
      role: currentUser?.role || 'Staff Tim',
      zone: currentZoneName || 'Workstation Utama',
      status: userStatus === 'available' ? 'online' : (userStatus as any),
      isNPC: false,
      portrait: currentUser?.avatar || `/assets/characters/${characterConfig.archetype || 'resident'}/standing/south.png`,
    };

    const remotes: Participant[] = onlineRemotePlayers.map((p) => ({
      id: `remote-${p.socketId}`,
      name: p.fullName || p.username || 'Tamu',
      role: p.role || 'Staff Tim',
      zone: p.zone || 'Workstation Utama',
      status: p.status === 'available' ? 'online' : (p.status as any),
      isNPC: false,
      portrait: p.avatar || `/assets/characters/${p.archetype || 'resident'}/standing/south.png`,
    }));

    return [localPart, ...remotes];
  }, [currentUser, userStatus, characterConfig.archetype, onlineRemotePlayers, currentZoneName]);

  const handleOpenVideoConference = useCallback(() => {
    let meeting = meetingService.getMeeting();
    if (!meeting) {
      meeting = meetingService.createMeeting(
        {
          title: `Konferensi ${currentRoom.name}`,
          description: `Sesi video conference dan kolaborasi tim di ruang ${currentRoom.name}`,
          code: currentRoom.code,
          workspaceId: 'ws-main',
          maxParticipants: currentRoom.capacity || 25,
        },
        {
          id: currentUser?.id ? String(currentUser.id) : `user-${Date.now()}`,
          name: currentUser?.fullName || getUserDisplayName(currentUser),
          avatar: currentUser?.avatar || `/assets/characters/${characterConfig.archetype || 'resident'}/standing/south.png`,
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
      meetingService.leaveMeeting(String(currentUser.id));
    }
  }, [activeMeetingSession, currentUser]);

  const liveParticipants = dynamicParticipants;
  const totalOfficeParticipants = dynamicParticipants.length;

  // Simpan preferensi kustomisasi karakter ke localStorage
  useEffect(() => {
    localStorage.setItem('neurosim_character_config', JSON.stringify(characterConfig));
  }, [characterConfig]);

  // Sinkronkan nama profil akun pengguna yang aktif ke konfigurasi karakter
  useEffect(() => {
    if (currentUser?.fullName) {
      setCharacterConfig((prev) => {
        if (prev.name === currentUser.fullName) return prev;
        return {
          ...prev,
          name: currentUser.fullName,
        };
      });
    }
    if (typeof window !== 'undefined' && currentUser) {
      window.dispatchEvent(
        new CustomEvent('neurosim_user_profile_updated', { detail: currentUser })
      );
      const activeName = currentUser.username || currentUser.fullName || getUserDisplayName(currentUser);
      EventBus.emit('LOCAL_PLAYER_NAME_UPDATE', activeName);
      EventBus.emit('neurosim_user_profile_updated', currentUser);
    }
  }, [currentUser]);

  const handleSceneReady = React.useCallback(() => {
    const isGuest = !currentUser || currentLobbyId === 'LOBBY-PUBLIC';
    let activeName = isGuest
      ? (characterConfig.name && !characterConfig.name.toLowerCase().includes('admin') ? characterConfig.name : 'Tamu NeuroSim')
      : (currentUser?.fullName || currentUser?.username || getUserDisplayName(currentUser));

    EventBus.emit('LOCAL_PLAYER_NAME_UPDATE', activeName);
    if (characterConfig) {
      const cleanConfig = {
        ...characterConfig,
        name: activeName,
      };
      EventBus.emit(GAME_EVENTS.UPDATE_PLAYER_CHARACTER, cleanConfig);
    }
  }, [currentUser, currentLobbyId, characterConfig]);

  // Auto On-Cam & Formal Meeting Event Listeners from Game Engine
  useEffect(() => {
    const handleAutoOnCam = (turnOn: boolean) => {
      if (turnOn) {
        setIsCamOn(true);
        multiplayerService.sendMediaState({ isCamOn: true });
      }
    };

    const handleToggleMeeting = (open: boolean) => {
      if (open) {
        handleOpenVideoConference();
      } else {
        setIsVideoConferenceOpen(false);
      }
    };

    EventBus.on('neurosim_auto_oncam', handleAutoOnCam);
    EventBus.on(GAME_EVENTS.TOGGLE_GOOGLE_MEET, handleToggleMeeting);

    return () => {
      EventBus.off('neurosim_auto_oncam', handleAutoOnCam);
      EventBus.off(GAME_EVENTS.TOGGLE_GOOGLE_MEET, handleToggleMeeting);
    };
  }, [handleOpenVideoConference]);

  // Check URL query param e.g. ?room=DEV-UIUX-26 on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        const upperCode = roomParam.trim().toUpperCase();
        const found = availableRooms.find((r) => r.code.toUpperCase() === upperCode);
        if (found) {
          setCurrentRoom(found);
          localStorage.setItem('neurosim_current_room_code', found.code);
        }
      }
    }
  }, [availableRooms]);

  // Persistence for Rooms
  useEffect(() => {
    localStorage.setItem('neurosim_available_rooms', JSON.stringify(availableRooms));
  }, [availableRooms]);

  useEffect(() => {
    localStorage.setItem('neurosim_current_room_code', currentRoom.code);
  }, [currentRoom]);

  // Load initial tasks from persistent API across devices
  useEffect(() => {
    fetch('/api/tasks')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.tasks) && data.tasks.length > 0) {
          setTasks(data.tasks);
        }
      })
      .catch((err) => console.warn('[Tasks API] Gagal memuat daftar tugas:', err));
  }, []);

  // Listen for realtime task sync from other team members
  useEffect(() => {
    const unsub = multiplayerService.onTaskSync((data) => {
      if (data.action === 'create' && data.task) {
        setTasks((prev) => {
          if (prev.some((t) => t.id === data.task.id)) return prev;
          return [data.task, ...prev];
        });
      } else if (data.action === 'toggle' && data.taskId) {
        setTasks((prev) =>
          prev.map((t) => (t.id === data.taskId ? { ...t, completed: !t.completed } : t))
        );
      } else if (data.action === 'delete' && data.taskId) {
        setTasks((prev) => prev.filter((t) => t.id !== data.taskId));
      }
    });
    return unsub;
  }, []);

  // Listen for realtime leader announcement
  useEffect(() => {
    const unsub = multiplayerService.onAnnouncement((data) => {
      setActiveAnnouncement(data);
      setTimeout(() => {
        setActiveAnnouncement((cur) => (cur?.id === data.id ? null : cur));
      }, 10000);
    });
    return unsub;
  }, []);

  // Task management handlers for interactive office board
  const handleToggleTask = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
    fetch('/api/tasks/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId }),
    }).catch(console.warn);
    multiplayerService.sendTaskSync('toggle', { taskId });
  }, []);

  const handleAddTask = useCallback((title: string, category: TaskCategory) => {
    const newTask: OfficeTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      category,
      zone: 'Kantor Pusat Virtual Office',
      assignedTo: currentUser?.fullName || 'Anggota Tim',
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    fetch('/api/tasks/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask),
    }).catch(console.warn);
    multiplayerService.sendTaskSync('create', { task: newTask });
  }, [currentUser]);

  const handleDeleteTask = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    fetch('/api/tasks/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId }),
    }).catch(console.warn);
    multiplayerService.sendTaskSync('delete', { taskId });
  }, []);

  useEffect(() => {
    if (mode === '2d') {
      const timer = setTimeout(() => {
        const game = (window as any).__PHASER_GAME__;
        if (game?.scale) { game.scale.refresh(); }
        window.dispatchEvent(new Event('resize'));
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('neurosim_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Listen to Phaser [E] interaction event on Agenda Board
  useEffect(() => {
    const handleOpenTodoList = () => {
      setIsTodoListOpen(true);
    };

    EventBus.on(GAME_EVENTS.OPEN_TODO_LIST, handleOpenTodoList);

    return () => {
      EventBus.off(GAME_EVENTS.OPEN_TODO_LIST, handleOpenTodoList);
    };
  }, []);

  // Pause keyboard capture ONLY when full-screen blocking modals are active
  useEffect(() => {
    const isBlockingModalOpen =
      isAuthOpen ||
      isTodoListOpen ||
      isCustomizerOpen ||
      isRoomModalOpen ||
      isLobbySelectorOpen ||
      isAdminBillingOpen ||
      currentView !== 'simulation';

    if (isBlockingModalOpen) {
      EventBus.emit(GAME_EVENTS.PAUSE_INPUT);
    } else {
      EventBus.emit(GAME_EVENTS.RESUME_INPUT);
    }
  }, [
    isAuthOpen,
    isTodoListOpen,
    isCustomizerOpen,
    isRoomModalOpen,
    isLobbySelectorOpen,
    isAdminBillingOpen,
    currentView,
  ]);

  const handleCloseTodoList = () => {
    setIsTodoListOpen(false);
    EventBus.emit(GAME_EVENTS.CLOSE_TODO_LIST);
  };

  // Gabung ke room multiplayer online saat berada di tampilan simulasi
  useEffect(() => {
    if (currentView === 'simulation') {
      const isGuest = !currentUser || currentLobbyId === 'LOBBY-PUBLIC';
      const activeUsername = isGuest
        ? (characterConfig.name && !characterConfig.name.toLowerCase().includes('admin') ? characterConfig.name : 'Tamu NeuroSim')
        : (currentUser?.username || 'Pengguna');
      const activeFullName = isGuest ? activeUsername : (currentUser?.fullName || activeUsername);

      multiplayerService.joinRoom({
        roomId: currentLobbyId,
        user: {
          id: currentUser?.id,
          username: activeUsername,
          fullName: activeFullName,
          role: isGuest ? 'Tamu (Guest)' : (currentUser?.role || 'Staff Tim'),
          avatar: currentUser?.avatar || `/assets/characters/${characterConfig.archetype || 'resident'}/standing/south.png`,
        },
        characterConfig: {
          ...characterConfig,
          name: activeUsername,
        },
        spawnCoords: { x: 1375, y: 1260 },
      });
    } else {
      multiplayerService.leaveRoom();
    }
  }, [currentView, currentLobbyId, currentUser, characterConfig]);

  // Dengarkan pesan obrolan masuk dan pembaruan pemain online dari server
  useEffect(() => {
    const handleRemoteChat = (packet: PlayerChatPacket) => {
      if (packet.socketId === multiplayerService.getSocketId()) return;
      setChatMessages((prev) => [
        ...prev,
        {
          id: packet.id,
          sender: packet.sender,
          time: packet.time,
          text: packet.text,
          isSelf: false,
        },
      ]);
    };

    const handleOnlinePlayers = (players: PlayerPresence[]) => {
      setOnlineRemotePlayers(players);
    };

    const handleRemoteMedia = (packet: { socketId: string; mediaState: any }) => {
      setOnlineRemotePlayers((prev) =>
        prev.map((p) => (p.socketId === packet.socketId ? { ...p, mediaState: packet.mediaState } : p))
      );
    };

    EventBus.on(GAME_EVENTS.REMOTE_CHAT_RECEIVED, handleRemoteChat);
    EventBus.on(GAME_EVENTS.ONLINE_PLAYERS_UPDATED, handleOnlinePlayers);
    EventBus.on(GAME_EVENTS.REMOTE_MEDIA_CHANGED, handleRemoteMedia);

    return () => {
      EventBus.off(GAME_EVENTS.REMOTE_CHAT_RECEIVED, handleRemoteChat);
      EventBus.off(GAME_EVENTS.ONLINE_PLAYERS_UPDATED, handleOnlinePlayers);
      EventBus.off(GAME_EVENTS.REMOTE_MEDIA_CHANGED, handleRemoteMedia);
    };
  }, []);

  const handleSendOfficeChat = (text: string) => {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    const newMsg: OfficeChatMessage = {
      id: `chat-${Date.now()}`,
      sender: getUserDisplayName(currentUser),
      time: timeStr,
      text,
      isSelf: true,
    };
    setChatMessages((prev) => [...prev, newMsg]);

    // Munculkan gelembung obrolan 2D di atas avatar Phaser lokal
    EventBus.emit(GAME_EVENTS.TRIGGER_CHAT_BUBBLE, { text });

    // Siarkan ke seluruh user di room secara realtime
    multiplayerService.sendChat(text);
  };

  const handleSendReaction = (emoji: string) => {
    EventBus.emit(GAME_EVENTS.TRIGGER_REACTION, { emoji });
    multiplayerService.sendReaction(emoji);
  };

  const handleCloseScreenShare = useCallback(() => {
    setIsScreenSharing(false);
    multiplayerService.sendMediaState({ isScreenSharing: false });
    EventBus.emit(GAME_EVENTS.SCREEN_SHARE_CHANGED, { isScreenSharing: false });
    EventBus.emit(GAME_EVENTS.RESUME_INPUT);
  }, []);

  const handleToggleScreenShare = useCallback(() => {
    setIsScreenSharing((s) => {
      const next = !s;
      multiplayerService.sendMediaState({ isScreenSharing: next });
      EventBus.emit(GAME_EVENTS.SCREEN_SHARE_CHANGED, {
        isScreenSharing: next,
        sharerName: currentUser?.fullName || getUserDisplayName(currentUser),
      });
      if (next) {
        EventBus.emit(GAME_EVENTS.PAUSE_INPUT);
      } else {
        EventBus.emit(GAME_EVENTS.RESUME_INPUT);
      }
      return next;
    });
  }, [currentUser]);

  // Online Multiplayer Room Management Handlers
  const handleJoinRoom = useCallback(
    (roomCode: string, passcode?: string) => {
      const targetRoom = availableRooms.find(
        (r) => r.code.toUpperCase() === roomCode.trim().toUpperCase()
      );

      if (!targetRoom) {
        return {
          success: false,
          message: `Ruangan dengan kode "${roomCode}" tidak ditemukan.`,
        };
      }

      if (targetRoom.isPrivate && targetRoom.passcode) {
        if (!passcode || passcode.trim() !== targetRoom.passcode) {
          return {
            success: false,
            message: 'Kode sandi (passcode) ruangan salah. Periksa kembali sandi Anda.',
          };
        }
      }

      if (targetRoom.activeCount >= targetRoom.capacity) {
        return {
          success: false,
          message: `Ruangan "${targetRoom.name}" telah penuh (${targetRoom.capacity}/${targetRoom.capacity}).`,
        };
      }

      // Berhasil bergabung: perbarui ruangan aktif dan broadcast ke EventBus
      setCurrentRoom(targetRoom);
      EventBus.emit(GAME_EVENTS.ROOM_CHANGED, { room: targetRoom });

      // Sinkronkan count peserta aktif tanpa akumulasi berlebihan
      const updatedRoom = { ...targetRoom, activeCount: 1 };
      setCurrentRoom(updatedRoom);
      setAvailableRooms((prev) =>
        prev.map((r) => ({
          ...r,
          activeCount: r.id === targetRoom.id ? 1 : 0,
        }))
      );

      return { success: true };
    },
    [availableRooms]
  );

  const handleCreateRoom = useCallback(
    (input: CreateRoomInput) => {
      const newRoomCode =
        input.code?.trim().toUpperCase() ||
        `ROOM-${Math.floor(1000 + Math.random() * 9000)}`;

      const newRoom: OfficeRoom = {
        id: `room-${Date.now()}`,
        code: newRoomCode,
        name: input.name.trim(),
        description: input.description?.trim() || 'Ruangan kantor virtual NeuroSim',
        hostName: getUserDisplayName(currentUser),
        isPrivate: input.isPrivate,
        passcode: input.isPrivate ? input.passcode : undefined,
        capacity: input.capacity || 25,
        activeCount: 1,
        proximityAudio: input.proximityAudio,
        audioRadius: input.audioRadius,
        tags: ['Kustom', 'Online'],
        createdAt: `Hari ini, ${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')} WIB`,
      };

      setAvailableRooms((prev) => [newRoom, ...prev]);
      setCurrentRoom(newRoom);
      EventBus.emit(GAME_EVENTS.ROOM_CHANGED, { room: newRoom });
    },
    [currentUser]
  );

  const handleLoginSuccess = (user: UserProfile, history?: any[], token?: string) => {
    setCurrentUser(user);
    const hist = history || [];
    setUserHistory(hist);
    try {
      localStorage.setItem('neurosim_current_user', JSON.stringify(user));
      localStorage.setItem('neurosim_user_history', JSON.stringify(hist));
      if (token) {
        localStorage.setItem('neurosim_auth_token', token);
      }
    } catch (e) {
      console.warn('Storage sync error:', e);
    }
    // Setelah autentikasi berhasil, selalu arahkan pengguna ke Dashboard Workspace!
    navigateTo('dashboard', '/dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserHistory([]);
    try {
      localStorage.removeItem('neurosim_current_user');
      localStorage.removeItem('neurosim_user_history');
      localStorage.removeItem('neurosim_auth_token');
      localStorage.removeItem('neurosim_company_access');
      setCharacterConfig((prev) => {
        const reset = { ...prev, name: 'Tamu NeuroSim' };
        localStorage.setItem('neurosim_character_config', JSON.stringify(reset));
        return reset;
      });
    } catch (e) {
      console.warn('Storage clear error:', e);
    }
    setIsAuthOpen(false);
    navigateTo('landing', '/');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Secret key combinations: Ctrl + Shift + A or Alt + Shift + K
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) ||
        (e.altKey && e.shiftKey && (e.key === 'K' || e.key === 'k'))
      ) {
        e.preventDefault();
        setIsAdminLoginOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const isSuperAdmin = useMemo(() => {
    return (
      currentUser?.username?.toLowerCase() === 'nandzzz' ||
      (currentUser as any)?.roleSlug === 'super_admin'
    );
  }, [currentUser]);

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div
      className={`h-screen w-screen overflow-hidden flex flex-col bg-sand text-ink select-none ${
        reduceMotion ? 'motion-reduce' : ''
      } ${highContrast ? 'contrast-125' : ''}`}
    >
      {/* ------------------------------------------------------------------- */}
      {/* 0. SPECIALIZED DASHBOARDS & ACCESS VIEWS (Admin, Leader, Guest)     */}
      {/* ------------------------------------------------------------------- */}
      {currentView === 'admin' && (
        isSuperAdmin ? (
          <AdminDashboardView
            currentUser={currentUser}
            onNavigateHome={() => navigateTo('dashboard', '/')}
            onOpenAuth={() => setIsAuthOpen(true)}
            onEnterRoom={(bracketId) => {
              setCurrentLobbyId(bracketId);
              navigateTo('simulation', '/simulation');
              EventBus.emit(GAME_EVENTS.RESUME_INPUT);
            }}
          />
        ) : (
          <AdminComplexLoginModal
            isOpen={true}
            isDirectRoute={true}
            onClose={() => navigateTo('dashboard', '/')}
            onSuccess={(adminUser) => {
              setCurrentUser(adminUser);
              EventBus.emit(GAME_EVENTS.RESUME_INPUT);
            }}
          />
        )
      )}

      {currentView === 'leader' && (
        <LeaderDashboardView
          currentUser={currentUser}
          onNavigateHome={() => navigateTo('dashboard', '/')}
          onOpenAuth={() => setIsAuthOpen(true)}
          onEnterRoom={(bracketId) => {
            setCurrentLobbyId(bracketId);
            navigateTo('simulation', '/simulation');
            EventBus.emit(GAME_EVENTS.RESUME_INPUT);
          }}
          onStartVideoConference={handleOpenVideoConference}
        />
      )}

      {currentView === 'guest-lobby' && (
        <GuestLobbyView
          currentUser={currentUser}
          onNavigateHome={() => navigateTo('dashboard', '/')}
          onOpenAuth={() => setIsAuthOpen(true)}
          onEnterSimulationWithKey={(lobbyId) => {
            setCurrentLobbyId(lobbyId);
            navigateTo('simulation', '/simulation');
            EventBus.emit(GAME_EVENTS.RESUME_INPUT);
          }}
        />
      )}

      {/* 3B. SCREEN VIEW: ENTER COMPANY OFFICE (ROLE-BASED UNIQUE CODE ACCESS) */}
      {currentView === 'enter-office' && (
        <EnterOfficeView
          currentUser={currentUser}
          onNavigateHome={() => navigateTo('dashboard', '/')}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenAiGuide={() => setIsAiGuideOpen(true)}
          onExplorePublicLobby={handleNavigatePublicLobby}
          onEnterCompanyOffice={handleEnterCompanyOffice}
        />
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 1. SCREEN VIEW: START / LANDING PAGE (2 MODES: TAMU VS MASUK AKUN)  */}
      {/* ------------------------------------------------------------------- */}
      {currentView === 'landing' && (
        <LandingView
          currentUser={currentUser}
          characterConfig={characterConfig}
          onEnterDashboard={() => navigateTo('dashboard', '/dashboard')}
          onEnterSimulation={handleNavigatePublicLobby}
          onOpenCustomizer={() => setIsCustomizerOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenAiGuide={() => setIsAiGuideOpen(true)}
          onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        />
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 2. SCREEN VIEW: UNIFIED DASHBOARD WORKSPACE PORTAL                   */}
      {/* ------------------------------------------------------------------- */}
      {currentView === 'dashboard' && (
        <DashboardView
          currentUser={currentUser}
          characterConfig={characterConfig}
          tasks={tasks}
          userHistory={userHistory}
          currentZoneId={currentZoneId}
          onBackToLanding={() => navigateTo('landing', '/')}
          onSelectRoom={(room) => {
            setSelectedRoom(room);
            setCurrentView('room-lobby');
          }}
          onEnterSimulationDirect={(room, lobbyId) => {
            if (room) {
              setSelectedRoom(room);
              localStorage.setItem('neurosim_spawn_coords', JSON.stringify(room.spawnCoords));
            }
            if (lobbyId) {
              setCurrentLobbyId(lobbyId);
              const lobbyMap: Record<string, string> = {
                'LOBBY-01': 'Kantor Pusat Utama',
                'LOBBY-02': 'Divisi Engineering & AI',
                'LOBBY-03': 'Divisi Product & Design',
                'LOBBY-04': 'Tim Remote Global',
                'LOBBY-05': 'Ruang Eksekutif & Klien',
              };
              if (lobbyMap[lobbyId]) setCurrentLobbyName(lobbyMap[lobbyId]);
              setCurrentView('simulation');
              EventBus.emit(GAME_EVENTS.RESUME_INPUT);
            } else {
              setIsLobbySelectorOpen(true);
            }
          }}
          onOpenCustomizer={() => setIsCustomizerOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onLogout={handleLogout}
          onOpenAdminBilling={() => setIsAdminBillingOpen(true)}
          onNavigateAdmin={() => navigateTo('admin', '/x90x9admin')}
          onNavigateLeader={() => navigateTo('leader', '/leader')}
          onNavigateGuestLobby={() => navigateTo('guest-lobby', '/guest-lobby')}
          onNavigatePublicLobby={handleNavigatePublicLobby}
          onNavigateEnterOffice={handleNavigateEnterOffice}
          onOpenAiGuide={() => setIsAiGuideOpen(true)}
          onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        />
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 3. SCREEN VIEW: ROOM LOBBY VIEW                                      */}
      {/* ------------------------------------------------------------------- */}
      {currentView === 'room-lobby' && (
        <RoomLobbyView
          room={selectedRoom}
          currentUser={currentUser}
          characterConfig={characterConfig}
          onEnterRoom={(room, micState, camState) => {
            if (micState !== undefined) setIsMicOn(micState);
            if (camState !== undefined) setIsCamOn(camState);
            localStorage.setItem('neurosim_spawn_coords', JSON.stringify(room.spawnCoords));
            setIsLobbySelectorOpen(true);
          }}
          onBackToDashboard={() => setCurrentView('dashboard')}
        />
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 4. SCREEN VIEW: SIMULATION / 2D OFFICE VIEW                         */}
      {/* (Kept in DOM so Phaser does not recreate canvas on tab changes)     */}
      {/* ------------------------------------------------------------------- */}
      <div
        className={`w-full h-full flex flex-col overflow-hidden ${
          currentView === 'simulation' ? 'flex' : 'hidden'
        }`}
      >
        {/* Top Header */}
        <Header
          mode={mode}
          onModeChange={setMode}
          reduceMotion={reduceMotion}
          onToggleReduceMotion={() => setReduceMotion((m) => !m)}
          textScale={textScale}
          onChangeTextScale={setTextScale}
          highContrast={highContrast}
          onToggleHighContrast={() => setHighContrast((c) => !c)}
          onOpenTodoList={() => setIsTodoListOpen(true)}
          completedCount={completedCount}
          totalCount={tasks.length}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthOpen(true)}
          currentRoom={currentRoom}
          onOpenRoomModal={() => setIsRoomModalOpen(true)}
          onNavigateDashboard={() => {
            setCurrentView('dashboard');
            EventBus.emit(GAME_EVENTS.PAUSE_INPUT);
          }}
          onOpenCustomizer={() => setIsCustomizerOpen(true)}
          currentLobbyId={currentLobbyId}
          currentLobbyName={currentLobbyName}
          onOpenLobbySelector={() => setIsLobbySelectorOpen(true)}
          onOpenAdminBilling={() => setIsAdminBillingOpen(true)}
          onNavigateAdmin={() => navigateTo('admin', '/x90x9admin')}
          onNavigateLeader={() => navigateTo('leader', '/leader')}
          onOpenAiGuide={() => setIsAiGuideOpen(true)}
          onNavigateEnterOffice={handleNavigateEnterOffice}
        />

        {/* Main Workspace Viewport */}
        <main className="flex-1 w-full min-h-0 relative overflow-hidden bg-[#0f1117]">
          {mode === '2d' ? (
            <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
              {/* Phaser Game Canvas (Instantiated only when in simulation view with non-zero dimensions) */}
              {currentView === 'simulation' && (
                <PhaserGame onSceneReady={handleSceneReady} />
              )}

              {/* Zoom-like Top Camera Conference Strip (Non-blocking) */}
              {currentView === 'simulation' && currentLobbyId !== 'LOBBY-PUBLIC' && (
                <TopCameraBar
                  isCamOn={isCamOn}
                  isMicOn={isMicOn}
                  onToggleCam={() => {
                    setIsCamOn((c) => {
                      const next = !c;
                      multiplayerService.sendMediaState({ isCamOn: next });
                      return next;
                    });
                  }}
                  onToggleMic={() => {
                    setIsMicOn((m) => {
                      const next = !m;
                      multiplayerService.sendMediaState({ isMicOn: next });
                      return next;
                    });
                  }}
                  userName={getUserDisplayName(currentUser)}
                  userAvatar={currentUser?.avatar}
                  remotePlayers={onlineRemotePlayers}
                />
              )}

              {/* Bottom-Left Minimap Radar Widget */}
              {currentView === 'simulation' && (
                <MinimapWidget
                  currentZoneName={currentZoneName}
                  remotePlayers={onlineRemotePlayers}
                />
              )}

              {/* Mobile Priority Virtual Controls (Analog Joystick + Action Button) */}
              {currentView === 'simulation' && (
                <MobileVirtualControls isSitting={userStatus === 'busy'} />
              )}

              {/* Right-Side Live Bracket Status Sidebar (Unified Participants Panel) */}
              {currentView === 'simulation' && (
                <BracketLiveSidebar
                  currentLobbyId={currentLobbyId}
                  currentLobbyName={currentLobbyName}
                  localUser={{
                    username: currentUser?.username || 'Pengguna',
                    fullName: currentUser?.fullName || getUserDisplayName(currentUser),
                    avatar: currentUser?.avatar || `/assets/characters/${characterConfig.archetype || 'resident'}/standing/south.png`,
                    zone: currentZoneName,
                    status: userStatus === 'available' ? 'online' : (userStatus as any),
                    isMicOn,
                    isCamOn,
                  }}
                  remotePlayers={onlineRemotePlayers}
                  onOpenLobbySelector={() => setIsLobbySelectorOpen(true)}
                  isCollapsed={!isParticipantsOpen}
                  onToggleCollapse={() => setIsParticipantsOpen((prev) => !prev)}
                />
              )}

              {/* WebRTC Video Conference Modal */}
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
              />

              {/* Realtime Leader Broadcast Announcement Banner */}
              {activeAnnouncement && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92vw] bg-amber-500 text-slate-950 px-4 py-3 rounded-2xl shadow-2xl border-2 border-amber-600 flex items-start gap-3 animate-in slide-in-from-top-4 duration-300">
                  <Bell className="w-5 h-5 flex-shrink-0 mt-0.5 text-slate-950 animate-bounce" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-950 mb-0.5">
                      <span>📢 PENGUMUMAN DARI {activeAnnouncement.sender.toUpperCase()} ({activeAnnouncement.role})</span>
                      <span className="text-[10px] font-mono opacity-80">{activeAnnouncement.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-900 font-medium leading-relaxed">
                      {activeAnnouncement.text}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveAnnouncement(null)}
                    className="p-1 hover:bg-black/10 rounded-lg text-slate-950 transition-colors cursor-pointer"
                    title="Tutup Pengumuman"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Floating Alert: Rekan Tim Sedang Berbagi Layar */}
              {activeRemotePresenter && !viewingRemotePresenter && !isScreenSharing && (
                <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40 bg-[#0f172a]/95 border border-amber-400/60 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-md animate-bounce">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                    <span className="text-xs font-semibold">
                      🖥️ <strong className="text-amber-300">{activeRemotePresenter.fullName}</strong> sedang berbagi layar presentasi.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewingRemotePresenter(activeRemotePresenter)}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-stone-900 font-bold text-xs rounded-full transition-colors cursor-pointer"
                  >
                    Tonton Presentasi
                  </button>
                </div>
              )}

              {/* Screen Share Live Presentation Widget (Host / Kita yang berbagi) */}
              <ScreenShareWidget
                isOpen={isScreenSharing}
                onClose={handleCloseScreenShare}
                userName={getUserDisplayName(currentUser)}
              />

              {/* Screen Share Viewer Widget (Menonton Presentasi Rekan) */}
              {viewingRemotePresenter && (
                <ScreenShareWidget
                  isOpen={true}
                  onClose={() => setViewingRemotePresenter(null)}
                  isViewerMode={true}
                  presenterName={viewingRemotePresenter.fullName}
                  presenterSocketId={viewingRemotePresenter.socketId}
                />
              )}

              {/* Bottom Virtual Office Action Dock */}
              <GatherDock
                isMicOn={isMicOn}
                onToggleMic={() => {
                  setIsMicOn((m) => {
                    const next = !m;
                    multiplayerService.sendMediaState({ isMicOn: next });
                    return next;
                  });
                }}
                isCamOn={isCamOn}
                onToggleCam={() => {
                  setIsCamOn((c) => {
                    const next = !c;
                    multiplayerService.sendMediaState({ isCamOn: next });
                    return next;
                  });
                }}
                isScreenSharing={isScreenSharing}
                onToggleScreenShare={handleToggleScreenShare}
                onOpenParticipants={() => {
                  setIsParticipantsOpen((p) => {
                    if (!p) setIsOfficeChatOpen(false);
                    return !p;
                  });
                }}
                onOpenOfficeChat={() => {
                  setIsOfficeChatOpen((c) => {
                    if (!c) {
                      setIsParticipantsOpen(false);
                      setUnreadChatCount(0);
                    }
                    return !c;
                  });
                }}
                onSendReaction={handleSendReaction}
                participantsCount={1 + onlineRemotePlayers.length}
                unreadChatCount={unreadChatCount}
                status={userStatus}
                onChangeStatus={(newStatus) => {
                  setUserStatus(newStatus);
                  multiplayerService.sendStatus(newStatus);
                }}
                userName={getUserDisplayName(currentUser)}
                userAvatar={currentUser?.avatar}
                onOpenProfile={() => setIsAuthOpen(true)}
                onOpenCustomizer={() => setIsCustomizerOpen(true)}
                onOpenMeeting={handleOpenVideoConference}
                onOpenAiGuide={() => setIsAiGuideOpen(true)}
                isGuest={!currentUser}
                isLobbyGlobal={currentLobbyId === 'LOBBY-PUBLIC'}
                onRequireAuth={handleRequireAuth}
              />

              {/* Slide-in Drawers */}
              <OfficeChatDrawer
                isOpen={isOfficeChatOpen}
                onClose={() => setIsOfficeChatOpen(false)}
                messages={chatMessages}
                onSendMessage={handleSendOfficeChat}
                onMarkAllRead={() => setUnreadChatCount(0)}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-[#0f1117] text-slate-400">
              <div className="text-center p-6 space-y-3">
                <p className="text-sm">Tampilan 2D Virtual Office adalah mode default NeuroSim Pro.</p>
                <button
                  onClick={() => setMode('2d')}
                  className="px-4 py-2 bg-teal text-soft rounded-lg font-bold text-xs"
                >
                  Kembali ke Kantor 2D
                </button>
              </div>
            </div>
          )}
        </main>
      </div>


      {/* ------------------------------------------------------------------- */}
      {/* 5. MODALS & OVERLAYS (Accessible from all views)                     */}
      {/* ------------------------------------------------------------------- */}

      {/* 5 Server Brackets Selector Modal (Max 5 Online Brackets) */}
      <LobbyBracketSelectorModal
        isOpen={isLobbySelectorOpen}
        onClose={() => setIsLobbySelectorOpen(false)}
        currentLobbyId={currentLobbyId}
        onSelectLobby={(lobby: LobbyBracket) => {
          setCurrentLobbyId(lobby.id);
          setCurrentLobbyName(lobby.name);
          setIsLobbySelectorOpen(false);
          setCurrentView('simulation');
          EventBus.emit(GAME_EVENTS.RESUME_INPUT);
          if (currentUser) {
            EventBus.emit('neurosim_user_profile_updated', currentUser);
          }
          if (characterConfig) {
            EventBus.emit(GAME_EVENTS.UPDATE_PLAYER_CHARACTER, characterConfig);
          }
        }}
      />

      {/* Enterprise Super Admin Billing & Access Panel */}
      <AdminBillingModal
        isOpen={isAdminBillingOpen}
        onClose={() => setIsAdminBillingOpen(false)}
        currentUser={currentUser}
      />

      {/* Central Corridor To-Do Board Modal */}
      <TodoListModal
        isOpen={isTodoListOpen}
        onClose={handleCloseTodoList}
        tasks={tasks}
        onToggleTask={handleToggleTask}
        onAddTask={handleAddTask}
        onDeleteTask={handleDeleteTask}
      />

      {/* Employee Auth & Profile Modal (MySQL Synced) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => {
          setIsAuthOpen(false);
          setAuthRestrictionNotice(null);
        }}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
        userHistory={userHistory}
        userAvatar={currentUser?.avatar}
        restrictionNotice={authRestrictionNotice}
      />

      {/* Character / Player Customizer Modal (Universal LPC Format) */}
      {/* NEURO AI Assistant Interactive Gameplay Guide Modal */}
      <NeuroAssistantModal
        isOpen={isAiGuideOpen}
        onClose={() => setIsAiGuideOpen(false)}
        onOpen={() => setIsAiGuideOpen(true)}
        currentRoomName={currentLobbyName}
        isGuest={!currentUser || currentLobbyId === 'LOBBY-PUBLIC'}
        onRequireAuth={handleRequireAuth}
      />

      <CharacterCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        currentConfig={characterConfig}
        userName={currentUser?.fullName || getUserDisplayName(currentUser)}
        userRole={currentUser?.role}
        onSaveConfig={(newConfig) => {
          setCharacterConfig(newConfig);
          localStorage.setItem('neurosim_character_config', JSON.stringify(newConfig));
          EventBus.emit(GAME_EVENTS.UPDATE_PLAYER_CHARACTER, newConfig);

          // Update multiplayer presence and character immediately
          if (currentView === 'simulation') {
            multiplayerService.updateCharacter(newConfig);
          }
        }}
      />


    </div>
  );
};

export default App;
