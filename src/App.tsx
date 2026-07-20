/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, MealDemand, Notice, ChatMessage, TimeSetting, PreLoadedStaff, ActivityLog, MealType, RegistrationInput, FoodMenuItem, RoomConfig } from './types';
import { 
  INITIAL_PRELOADED_STAFF, INITIAL_USERS, INITIAL_DEMANDS, 
  INITIAL_NOTICES, INITIAL_CHATS, INITIAL_TIME_SETTINGS, INITIAL_LOGS,
  INITIAL_FOOD_MENU
} from './mockData';
import { translations, Language } from './translations';
import { StaffPortal } from './components/StaffPortal';
import { AdminPanel } from './components/AdminPanel';
import { Shield, Users, RefreshCw, Key, AlertCircle, Sparkles } from 'lucide-react';
import { checkAndSeedDatabase, listenToCollection, syncArrayToFirestore, deleteDocFromFirestore, fetchCollection, saveDocToFirestore } from './lib/firebase';

const INITIAL_ROOMS: RoomConfig[] = Array.from({ length: 50 }, (_, i) => ({
  id: `room-${i + 1}`,
  roomNumber: String(i + 1),
  hidden: false
}));

export default function App() {
  // Localization Language State
  const [lang, setLang] = useState<Language>('bn');
  const t = translations[lang];

  // System Core Database States (Persistent via localStorage)
  const [preloadedStaff, setPreloadedStaff] = useState<PreLoadedStaff[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [demands, setDemands] = useState<MealDemand[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [timeSettings, setTimeSettings] = useState<TimeSetting[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [foodMenu, setFoodMenu] = useState<FoodMenuItem[]>([]);
  const [rooms, setRooms] = useState<RoomConfig[]>([]);

  // Admin Login Credentials
  const [adminUser, setAdminUser] = useState('admin');
  const [adminPass, setAdminPass] = useState('password123');

  // Bypass Time-Constraints (true by default so users can test food booking at any hour!)
  const [bypassTimeControls, setBypassTimeControls] = useState(true);

  // Active View Mode: 'staff' | 'admin'
  const [viewMode, setViewModeState] = useState<'staff' | 'admin'>(() => {
    const saved = localStorage.getItem('view_mode');
    return (saved === 'admin' || saved === 'staff') ? saved : 'staff';
  });

  const setViewMode = (mode: 'staff' | 'admin') => {
    setViewModeState(mode);
    localStorage.setItem('view_mode', mode);
  };

  // Session login state
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [adminIsLoggedIn, setAdminIsLoggedIn] = useState(false);

  // Admin login input form states
  const [adminLoginInput, setAdminLoginInput] = useState('');
  const [adminPassInput, setAdminPassInput] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');

  // 1. INITIALIZE DATABASE FROM STORAGE AND FIREBASE SYNC
  useEffect(() => {
    function getOrSet<T>(key: string, initial: T): T {
      const stored = localStorage.getItem(key);
      if (stored && stored !== 'undefined') {
        try {
          const parsed = JSON.parse(stored);
          if (parsed !== null && parsed !== undefined) {
            return parsed as T;
          }
        } catch (e) {
          console.error(`Error parsing localStorage key "${key}":`, e);
        }
      }
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }

    // Load from local storage immediately for fast UI response
    const localPreload = getOrSet('preload_db', INITIAL_PRELOADED_STAFF);
    const localUsers = getOrSet('users_db', INITIAL_USERS);
    const localDemands = getOrSet('demands_db', INITIAL_DEMANDS);
    const localNotices = getOrSet('notices_db', INITIAL_NOTICES);
    const localChats = getOrSet('chats_db', INITIAL_CHATS);
    const localTimes = getOrSet('times_db', INITIAL_TIME_SETTINGS);
    const localLogs = getOrSet('logs_db', INITIAL_LOGS);
    const localMenu = getOrSet('food_menu_db', INITIAL_FOOD_MENU);
    const localRooms = getOrSet('rooms_db', INITIAL_ROOMS);

    setPreloadedStaff(localPreload);
    setUsers(localUsers);
    setDemands(localDemands);
    setNotices(localNotices);
    setChats(localChats);
    setTimeSettings(localTimes);
    setActivityLogs(localLogs);
    setFoodMenu(localMenu);
    setRooms(localRooms);

    const savedAdminU = localStorage.getItem('admin_user') || 'admin';
    const savedAdminP = localStorage.getItem('admin_pass') || 'password123';
    setAdminUser(savedAdminU);
    setAdminPass(savedAdminP);

    const savedBypass = localStorage.getItem('bypass_time');
    if (savedBypass !== null) {
      setBypassTimeControls(savedBypass === 'true');
    }

    // Restore active user session for instant loading
    const savedUser = localStorage.getItem('logged_in_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed) {
          setLoggedInUser(parsed);
        }
      } catch (e) {
        console.error('Error restoring logged_in_user session:', e);
      }
    }

    // Restore admin session
    const savedAdminLogged = localStorage.getItem('admin_is_logged_in') === 'true';
    if (savedAdminLogged) {
      setAdminIsLoggedIn(true);
    }

    // Now, run Firebase seed check and listeners
    let isSubscribed = true;
    let unsubscribes: (() => void)[] = [];

    async function initFirebaseSync() {
      if (!isSubscribed) return;

      // 1. Establish real-time sync with offline support IMMEDIATELY!
      const unsubPreload = listenToCollection('preload_db', (data) => {
        if (isSubscribed) {
          setPreloadedStaff(data);
          localStorage.setItem('preload_db', JSON.stringify(data));
        }
      });
      const unsubUsers = listenToCollection('users_db', (data) => {
        if (isSubscribed) {
          setUsers(data);
          localStorage.setItem('users_db', JSON.stringify(data));
        }
      });
      const unsubDemands = listenToCollection('demands_db', (data) => {
        if (isSubscribed) {
          setDemands(data);
          localStorage.setItem('demands_db', JSON.stringify(data));
        }
      });
      const unsubNotices = listenToCollection('notices_db', (data) => {
        if (isSubscribed) {
          setNotices(data);
          localStorage.setItem('notices_db', JSON.stringify(data));
        }
      });
      const unsubChats = listenToCollection('chats_db', (data) => {
        if (isSubscribed) {
          setChats(data);
          localStorage.setItem('chats_db', JSON.stringify(data));
        }
      });
      const unsubTimes = listenToCollection('times_db', (data) => {
        if (isSubscribed) {
          setTimeSettings(data);
          localStorage.setItem('times_db', JSON.stringify(data));
        }
      });
      const unsubLogs = listenToCollection('logs_db', (data) => {
        if (isSubscribed) {
          setActivityLogs(data);
          localStorage.setItem('logs_db', JSON.stringify(data));
        }
      });
      const unsubMenu = listenToCollection('food_menu_db', (data) => {
        if (isSubscribed) {
          setFoodMenu(data);
          localStorage.setItem('food_menu_db', JSON.stringify(data));
        }
      });
      const unsubRooms = listenToCollection('rooms_db', (data) => {
        if (isSubscribed) {
          setRooms(data);
          localStorage.setItem('rooms_db', JSON.stringify(data));
        }
      });

      unsubscribes = [
        unsubPreload, unsubUsers, unsubDemands, unsubNotices,
        unsubChats, unsubTimes, unsubLogs, unsubMenu, unsubRooms
      ];

      // 2. Seed Firebase in the background without blocking the live listeners!
      checkAndSeedDatabase({
        preload_db: localPreload,
        users_db: localUsers,
        demands_db: localDemands,
        notices_db: localNotices,
        chats_db: localChats,
        times_db: localTimes,
        logs_db: localLogs,
        food_menu_db: localMenu,
        rooms_db: localRooms
      }).catch((seedError) => {
        console.error("Firebase background seeding check failed:", seedError);
      });
    }

    initFirebaseSync();

    return () => {
      isSubscribed = false;
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);

  // Helpers to push updates to storage (local storage and Firestore concurrently)
  const saveToStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
    syncArrayToFirestore(key, data);
  };

  // Helper to append action log
  const pushActivityLog = (action: string, details: string, user: string) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      action,
      details,
      timestamp: new Date().toISOString(),
      user
    };
    setActivityLogs((prev) => {
      const updated = [...prev, newLog];
      setTimeout(() => {
        localStorage.setItem('logs_db', JSON.stringify(updated));
        saveDocToFirestore('logs_db', newLog);
      }, 0);
      return updated;
    });
  };

  // Manual Sync Database State and Handler (failsafe for websocket lag/dropouts)
  const [isSyncing, setIsSyncing] = useState(false);
  
  const handleSyncDatabase = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      console.log('Manually fetching latest data from Firestore database...');
      
      const [
        fetchedPreload,
        fetchedUsers,
        fetchedDemands,
        fetchedNotices,
        fetchedChats,
        fetchedTimes,
        fetchedLogs,
        fetchedMenu,
        fetchedRooms
      ] = await Promise.all([
        fetchCollection('preload_db'),
        fetchCollection('users_db'),
        fetchCollection('demands_db'),
        fetchCollection('notices_db'),
        fetchCollection('chats_db'),
        fetchCollection('times_db'),
        fetchCollection('logs_db'),
        fetchCollection('food_menu_db'),
        fetchCollection('rooms_db')
      ]);

      setPreloadedStaff(fetchedPreload);
      localStorage.setItem('preload_db', JSON.stringify(fetchedPreload));

      setUsers(fetchedUsers);
      localStorage.setItem('users_db', JSON.stringify(fetchedUsers));

      setDemands(fetchedDemands);
      localStorage.setItem('demands_db', JSON.stringify(fetchedDemands));

      setNotices(fetchedNotices);
      localStorage.setItem('notices_db', JSON.stringify(fetchedNotices));

      setChats(fetchedChats);
      localStorage.setItem('chats_db', JSON.stringify(fetchedChats));

      setTimeSettings(fetchedTimes);
      localStorage.setItem('times_db', JSON.stringify(fetchedTimes));

      setActivityLogs(fetchedLogs);
      localStorage.setItem('logs_db', JSON.stringify(fetchedLogs));

      setFoodMenu(fetchedMenu);
      localStorage.setItem('food_menu_db', JSON.stringify(fetchedMenu));

      if (fetchedRooms && fetchedRooms.length > 0) {
        setRooms(fetchedRooms);
        localStorage.setItem('rooms_db', JSON.stringify(fetchedRooms));
      }

      pushActivityLog(
        'Database Synced',
        'User executed manual database force-sync to refresh all states.',
        loggedInUser?.name || 'User'
      );
      
      console.log('Manual database sync completed successfully!');
    } catch (error) {
      console.error('Failed to manually sync Firestore database:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Reset demo databases
  const handleResetData = () => {
    localStorage.clear();
    
    // Set local states
    setPreloadedStaff(INITIAL_PRELOADED_STAFF);
    setUsers(INITIAL_USERS);
    setDemands(INITIAL_DEMANDS);
    setNotices(INITIAL_NOTICES);
    setChats(INITIAL_CHATS);
    setTimeSettings(INITIAL_TIME_SETTINGS);
    setActivityLogs(INITIAL_LOGS);
    setFoodMenu(INITIAL_FOOD_MENU);
    setRooms(INITIAL_ROOMS);
    
    // Sync to Firestore and LocalStorage
    saveToStorage('preload_db', INITIAL_PRELOADED_STAFF);
    saveToStorage('users_db', INITIAL_USERS);
    saveToStorage('demands_db', INITIAL_DEMANDS);
    saveToStorage('notices_db', INITIAL_NOTICES);
    saveToStorage('chats_db', INITIAL_CHATS);
    saveToStorage('times_db', INITIAL_TIME_SETTINGS);
    saveToStorage('logs_db', INITIAL_LOGS);
    saveToStorage('food_menu_db', INITIAL_FOOD_MENU);
    saveToStorage('rooms_db', INITIAL_ROOMS);

    setAdminUser('admin');
    setAdminPass('password123');
    setBypassTimeControls(true);
    setLoggedInUser(null);
    setAdminIsLoggedIn(false);
    pushActivityLog('Database Reset', 'System restarted with default sample data.', 'System');
  };

  const handleAddRoom = (roomNum: string) => {
    const normalized = roomNum.trim();
    if (!normalized) return;
    setRooms((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      if (arr.some((r) => r && String(r.roomNumber || '') === normalized)) return arr;
      const updated = [
        ...arr,
        {
          id: `room-${Date.now()}`,
          roomNumber: normalized,
          hidden: false,
        },
      ].sort((a, b) => {
        const strA = String(a.roomNumber || '');
        const strB = String(b.roomNumber || '');
        const numA = parseInt(strA, 10);
        const numB = parseInt(strB, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return strA.localeCompare(strB);
      });
      setTimeout(() => saveToStorage('rooms_db', updated), 0);
      return updated;
    });
    pushActivityLog('Room Added', `Admin added room ${normalized}.`, 'Admin');
  };

  const handleDeleteRoom = (roomId: string) => {
    setRooms((prev) => {
      const updated = prev.filter((r) => r.id !== roomId);
      setTimeout(() => {
        localStorage.setItem('rooms_db', JSON.stringify(updated));
      }, 0);
      return updated;
    });
    deleteDocFromFirestore('rooms_db', roomId);
    pushActivityLog('Room Deleted', `Admin deleted a room layout.`, 'Admin');
  };

  const handleToggleHideRoom = (roomId: string) => {
    setRooms((prev) => {
      const updated = prev.map((r) => r.id === roomId ? { ...r, hidden: !r.hidden } : r);
      setTimeout(() => saveToStorage('rooms_db', updated), 0);
      return updated;
    });
    pushActivityLog('Room Visibility Toggled', `Admin toggled visibility of a room.`, 'Admin');
  };

  // =====================================
  // STAFF ACTIONS Handlers
  // =====================================

  const handleRegisterUser = (newUser: RegistrationInput) => {
    const createdUser: User = {
      ...newUser,
      id: `user-${Date.now()}`,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setUsers((prev) => {
      const updated = [...prev, createdUser];
      setTimeout(() => {
        localStorage.setItem('users_db', JSON.stringify(updated));
        saveDocToFirestore('users_db', createdUser);
      }, 0);
      return updated;
    });

    pushActivityLog(
      'Registration Submitted',
      `${newUser.name} registered Staff ID ${newUser.staffId} for Room ${newUser.roomNumber}`,
      newUser.name
    );
  };

  const handleLoginUser = (user: User) => {
    setLoggedInUser(user);
    localStorage.setItem('logged_in_user', JSON.stringify(user));
    pushActivityLog('Staff Login', `${user.name} logged into Staff Portal.`, user.name);
  };

  const handleLogoutUser = () => {
    if (loggedInUser) {
      pushActivityLog('Staff Logout', `${loggedInUser.name} logged out.`, loggedInUser.name);
    }
    setLoggedInUser(null);
    localStorage.removeItem('logged_in_user');
  };

  const handleSubmitDemand = (mealType: MealType, selectedStaffIds: string[]) => {
    if (!loggedInUser) return;

    const todayStr = new Date().toISOString().split('T')[0];

    const newDemand: MealDemand = {
      id: `dem-${Date.now()}`,
      roomNumber: loggedInUser.roomNumber,
      mealType,
      date: todayStr,
      selectedStaffIds,
      submittedBy: loggedInUser.staffId,
      submittedByName: loggedInUser.name,
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    setDemands((prev) => {
      const updated = [newDemand, ...prev];
      setTimeout(() => {
        localStorage.setItem('demands_db', JSON.stringify(updated));
        saveDocToFirestore('demands_db', newDemand);
      }, 0);
      return updated;
    });

    pushActivityLog(
      'Demand Submitted',
      `${loggedInUser.name} requested ${mealType.toUpperCase()} for Room ${loggedInUser.roomNumber} (${selectedStaffIds.length} members)`,
      loggedInUser.name
    );
  };

  const handleSendChatMessage = (text: string, receiverId: string) => {
    const senderId = loggedInUser ? loggedInUser.id : 'admin';
    const senderName = loggedInUser ? loggedInUser.name : 'System Admin';

    const newMessage: ChatMessage = {
      id: `chat-${Date.now()}`,
      senderId,
      senderName,
      receiverId,
      text,
      timestamp: new Date().toISOString(),
      isAdmin: !loggedInUser
    };

    setChats((prev) => {
      const updated = [...prev, newMessage];
      setTimeout(() => {
        localStorage.setItem('chats_db', JSON.stringify(updated));
        saveDocToFirestore('chats_db', newMessage);
      }, 0);
      return updated;
    });
  };

  // =====================================
  // ADMIN ACTIONS Handlers
  // =====================================

  const handleApproveUser = (userId: string) => {
    let approvedUser: User | null = null;
    setUsers((prev) => {
      const updated = prev.map((u) => {
        if (u.id === userId) {
          approvedUser = { ...u, status: 'approved' as const };
          return approvedUser;
        }
        return u;
      });
      setTimeout(() => {
        localStorage.setItem('users_db', JSON.stringify(updated));
        if (approvedUser) {
          saveDocToFirestore('users_db', approvedUser);
        }
      }, 0);
      return updated;
    });

    const userObj = users.find((u) => u.id === userId);
    if (userObj) {
      setPreloadedStaff((prev) => {
        const exists = prev.some((s) => s.staffId.toLowerCase() === userObj.staffId.toLowerCase());
        if (!exists) {
          const newStaff: PreLoadedStaff = {
            id: `preload-${Date.now()}`,
            staffId: userObj.staffId,
            name: userObj.name,
            roomNumber: userObj.roomNumber,
            department: userObj.department || 'General'
          };
          const updated = [...prev, newStaff];
          setTimeout(() => {
            localStorage.setItem('preload_db', JSON.stringify(updated));
            saveDocToFirestore('preload_db', newStaff);
          }, 0);
          return updated;
        }
        return prev;
      });
    }

    pushActivityLog(
      'Account Verified',
      `Admin approved registration for ${userObj?.name || userId}`,
      'Admin'
    );
  };

  const handleRejectUser = (userId: string) => {
    const userObj = users.find((u) => u.id === userId);
    setUsers((prev) => {
      const updated = prev.filter((u) => u.id !== userId);
      setTimeout(() => {
        localStorage.setItem('users_db', JSON.stringify(updated));
      }, 0);
      return updated;
    });
    // Explicitly delete from Firestore
    deleteDocFromFirestore('users_db', userId);

    pushActivityLog(
      'Account Rejected',
      `Admin rejected registration for ${userObj?.name || userId}`,
      'Admin'
    );
  };

  const handleDeleteUser = (userId: string) => {
    const userObj = users.find((u) => u.id === userId);
    setUsers((prev) => {
      const updated = prev.filter((u) => u.id !== userId);
      setTimeout(() => {
        localStorage.setItem('users_db', JSON.stringify(updated));
      }, 0);
      return updated;
    });
    // Explicitly delete from Firestore
    deleteDocFromFirestore('users_db', userId);

    pushActivityLog(
      'Account Deleted',
      `Admin deleted registration card/account for ${userObj?.name || userId}`,
      'Admin'
    );
  };

  const handleBlockUser = (userId: string) => {
    let blockedUser: User | null = null;
    setUsers((prev) => {
      const updated = prev.map((u) => {
        if (u.id === userId) {
          blockedUser = { ...u, status: 'blocked' as const };
          return blockedUser;
        }
        return u;
      });
      setTimeout(() => {
        localStorage.setItem('users_db', JSON.stringify(updated));
        if (blockedUser) {
          saveDocToFirestore('users_db', blockedUser);
        }
      }, 0);
      return updated;
    });

    const userObj = users.find((u) => u.id === userId);
    pushActivityLog('User Blocked', `Admin blocked user: ${userObj?.name || userId}`, 'Admin');
  };

  const handleUnblockUser = (userId: string) => {
    let unblockedUser: User | null = null;
    setUsers((prev) => {
      const updated = prev.map((u) => {
        if (u.id === userId) {
          unblockedUser = { ...u, status: 'approved' as const };
          return unblockedUser;
        }
        return u;
      });
      setTimeout(() => {
        localStorage.setItem('users_db', JSON.stringify(updated));
        if (unblockedUser) {
          saveDocToFirestore('users_db', unblockedUser);
        }
      }, 0);
      return updated;
    });

    const userObj = users.find((u) => u.id === userId);
    pushActivityLog('User Unblocked', `Admin unblocked user: ${userObj?.name || userId}`, 'Admin');
  };

  const handleUpdateUserRoom = (userId: string, newRoomNumber: string) => {
    let staffIdToUpdate = '';
    let updatedUserObj: User | null = null;
    setUsers((prev) => {
      const updated = prev.map((u) => {
        if (u.id === userId) {
          staffIdToUpdate = u.staffId;
          updatedUserObj = { ...u, roomNumber: newRoomNumber };
          return updatedUserObj;
        }
        return u;
      });
      setTimeout(() => {
        localStorage.setItem('users_db', JSON.stringify(updated));
        if (updatedUserObj) {
          saveDocToFirestore('users_db', updatedUserObj);
        }
      }, 0);
      return updated;
    });

    if (staffIdToUpdate) {
      setPreloadedStaff((prev) => {
        let updatedStaffObj: PreLoadedStaff | null = null;
        const updated = prev.map((s) => {
          if (s.staffId.toLowerCase() === staffIdToUpdate.toLowerCase()) {
            updatedStaffObj = { ...s, roomNumber: newRoomNumber };
            return updatedStaffObj;
          }
          return s;
        });
        setTimeout(() => {
          localStorage.setItem('preload_db', JSON.stringify(updated));
          if (updatedStaffObj) {
            saveDocToFirestore('preload_db', updatedStaffObj);
          }
        }, 0);
        return updated;
      });
    }

    if (loggedInUser && loggedInUser.id === userId) {
      setLoggedInUser((prev) => (prev ? { ...prev, roomNumber: newRoomNumber } : null));
    }

    const userObj = users.find((u) => u.id === userId);
    pushActivityLog(
      'User Room Changed',
      `Admin changed room for ${userObj?.name || userId} from Room ${userObj?.roomNumber || ''} to Room ${newRoomNumber}`,
      'Admin'
    );
  };

  const handleApproveDemand = (demandId: string) => {
    let approvedDemand: MealDemand | null = null;
    setDemands((prev) => {
      const updated = prev.map((d) => {
        if (d.id === demandId) {
          approvedDemand = { ...d, status: 'approved' as const };
          return approvedDemand;
        }
        return d;
      });
      setTimeout(() => {
        localStorage.setItem('demands_db', JSON.stringify(updated));
        if (approvedDemand) {
          saveDocToFirestore('demands_db', approvedDemand);
        }
      }, 0);
      return updated;
    });

    const dObj = demands.find((d) => d.id === demandId);
    pushActivityLog(
      'Demand Approved',
      `Admin approved ${dObj?.mealType.toUpperCase()} demand for Room ${dObj?.roomNumber}`,
      'Admin'
    );
  };

  const handleRejectDemand = (demandId: string) => {
    let rejectedDemand: MealDemand | null = null;
    setDemands((prev) => {
      const updated = prev.map((d) => {
        if (d.id === demandId) {
          rejectedDemand = { ...d, status: 'rejected' as const };
          return rejectedDemand;
        }
        return d;
      });
      setTimeout(() => {
        localStorage.setItem('demands_db', JSON.stringify(updated));
        if (rejectedDemand) {
          saveDocToFirestore('demands_db', rejectedDemand);
        }
      }, 0);
      return updated;
    });

    const dObj = demands.find((d) => d.id === demandId);
    pushActivityLog(
      'Demand Rejected',
      `Admin rejected ${dObj?.mealType.toUpperCase()} demand for Room ${dObj?.roomNumber}`,
      'Admin'
    );
  };

  const handleMarkDemandServed = (demandId: string) => {
    let servedDemand: MealDemand | null = null;
    setDemands((prev) => {
      const updated = prev.map((d) => {
        if (d.id === demandId) {
          servedDemand = { ...d, status: 'served' as const, servedAt: new Date().toISOString() };
          return servedDemand;
        }
        return d;
      });
      setTimeout(() => {
        localStorage.setItem('demands_db', JSON.stringify(updated));
        if (servedDemand) {
          saveDocToFirestore('demands_db', servedDemand);
        }
      }, 0);
      return updated;
    });

    const dObj = demands.find((d) => d.id === demandId);
    pushActivityLog(
      'Food Distributed',
      `Admin marked ${dObj?.mealType.toUpperCase()} served for Room ${dObj?.roomNumber}`,
      'Admin'
    );
  };

  const handleAddTimeSetting = (mealType: MealType, startTime: string, endTime: string) => {
    let updatedSetting: TimeSetting | null = null;
    setTimeSettings((prev) => {
      const updated = prev.map((s) => {
        if (s.mealType === mealType) {
          updatedSetting = { ...s, startTime, endTime };
          return updatedSetting;
        }
        return s;
      });
      setTimeout(() => {
        localStorage.setItem('times_db', JSON.stringify(updated));
        if (updatedSetting) {
          saveDocToFirestore('times_db', updatedSetting);
        }
      }, 0);
      return updated;
    });
    pushActivityLog('Schedule Timer Updated', `${mealType.toUpperCase()} hours modified.`, 'Admin');
  };

  const handleAddNotice = (title: string, content: string) => {
    const newNotice: Notice = {
      id: `notice-${Date.now()}`,
      title,
      content,
      date: new Date().toISOString().split('T')[0]
    };

    setNotices((prev) => {
      const updated = [newNotice, ...prev];
      setTimeout(() => {
        localStorage.setItem('notices_db', JSON.stringify(updated));
        saveDocToFirestore('notices_db', newNotice);
      }, 0);
      return updated;
    });

    pushActivityLog('Notice Board Updated', `Admin posted: ${title}`, 'Admin');
  };

  const handleDeleteNotice = (noticeId: string) => {
    setNotices((prev) => {
      const updated = prev.filter((n) => n.id !== noticeId);
      setTimeout(() => {
        localStorage.setItem('notices_db', JSON.stringify(updated));
      }, 0);
      return updated;
    });
    deleteDocFromFirestore('notices_db', noticeId);
    pushActivityLog('Notice Removed', 'Admin deleted notice.', 'Admin');
  };

  const handleAddPreloadStaff = (staffId: string, name: string, roomNumber: string, department: string) => {
    const newPreload: PreLoadedStaff = {
      id: `preload-${Date.now()}`,
      staffId: staffId.trim().toUpperCase(),
      name,
      roomNumber,
      department: department || 'General'
    };

    setPreloadedStaff((prev) => {
      const updated = [...prev, newPreload];
      setTimeout(() => {
        localStorage.setItem('preload_db', JSON.stringify(updated));
        saveDocToFirestore('preload_db', newPreload);
      }, 0);
      return updated;
    });

    pushActivityLog('Staff Added to Preloads', `Valid Staff ID created: ${name} (${staffId})`, 'Admin');
  };

  const handleDeletePreloadStaff = (id: string) => {
    setPreloadedStaff((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      setTimeout(() => {
        localStorage.setItem('preload_db', JSON.stringify(updated));
      }, 0);
      return updated;
    });
    deleteDocFromFirestore('preload_db', id);
    pushActivityLog('Preload Staff Deleted', 'Admin removed code validation record.', 'Admin');
  };

  const handleDeleteDemandsByDateAndMeal = (date: string, mealType: MealType) => {
    const targetDemands = demands.filter((d) => d.date === date && d.mealType === mealType);
    setDemands((prev) => {
      const updated = prev.filter((d) => !(d.date === date && d.mealType === mealType));
      setTimeout(() => {
        localStorage.setItem('demands_db', JSON.stringify(updated));
      }, 0);
      return updated;
    });
    // Explicitly delete matching demands from Firestore
    targetDemands.forEach((d) => {
      deleteDocFromFirestore('demands_db', d.id);
    });

    pushActivityLog(
      'Meal Record Cleared',
      `Admin cleared all ${mealType.toUpperCase()} demands for ${date}`,
      'Admin'
    );
  };

  const handleDeleteDemand = (demandId: string) => {
    setDemands((prev) => {
      const updated = prev.filter((d) => d.id !== demandId);
      setTimeout(() => {
        localStorage.setItem('demands_db', JSON.stringify(updated));
      }, 0);
      return updated;
    });
    // Explicitly delete from Firestore
    deleteDocFromFirestore('demands_db', demandId);

    pushActivityLog('Demand Deleted', `Admin deleted meal demand record.`, 'Admin');
  };

  const handleDeleteAllRejectedDemands = () => {
    const rejectedDemands = demands.filter((d) => d.status === 'rejected');
    setDemands((prev) => {
      const updated = prev.filter((d) => d.status !== 'rejected');
      setTimeout(() => {
        localStorage.setItem('demands_db', JSON.stringify(updated));
      }, 0);
      return updated;
    });
    // Explicitly delete all rejected demands from Firestore
    rejectedDemands.forEach((d) => {
      deleteDocFromFirestore('demands_db', d.id);
    });

    pushActivityLog('Rejected Demands Cleared', `Admin deleted all rejected meal demands.`, 'Admin');
  };

  const handleAddFoodMenuItem = (img: string, titleBn: string, titleEn: string, descBn: string, descEn: string) => {
    const newItem: FoodMenuItem = {
      id: `food-${Date.now()}`,
      img,
      titleBn,
      titleEn,
      descBn,
      descEn,
      hidden: false
    };
    setFoodMenu((prev) => {
      const updated = [...prev, newItem];
      setTimeout(() => {
        localStorage.setItem('food_menu_db', JSON.stringify(updated));
        saveDocToFirestore('food_menu_db', newItem);
      }, 0);
      return updated;
    });
    pushActivityLog('Food Item Added', `Admin added new menu item: ${titleBn}`, 'Admin');
  };

  const handleUpdateFoodMenuItem = (updatedItem: FoodMenuItem) => {
    setFoodMenu((prev) => {
      const updated = prev.map((item) => item.id === updatedItem.id ? updatedItem : item);
      setTimeout(() => {
        localStorage.setItem('food_menu_db', JSON.stringify(updated));
        saveDocToFirestore('food_menu_db', updatedItem);
      }, 0);
      return updated;
    });
    pushActivityLog('Food Item Updated', `Admin updated menu item: ${updatedItem.titleBn}`, 'Admin');
  };

  const handleDeleteFoodMenuItem = (id: string) => {
    const targetItem = foodMenu.find((item) => item.id === id);
    const title = targetItem ? targetItem.titleBn : id;
    setFoodMenu((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      setTimeout(() => {
        localStorage.setItem('food_menu_db', JSON.stringify(updated));
      }, 0);
      return updated;
    });
    deleteDocFromFirestore('food_menu_db', id);
    pushActivityLog('Food Item Deleted', `Admin deleted menu item: ${title}`, 'Admin');
  };

  const handleToggleHideFoodMenuItem = (id: string) => {
    let updatedItem: FoodMenuItem | null = null;
    setFoodMenu((prev) => {
      const updated = prev.map((item) => {
        if (item.id === id) {
          updatedItem = { ...item, hidden: !item.hidden };
          return updatedItem;
        }
        return item;
      });
      setTimeout(() => {
        localStorage.setItem('food_menu_db', JSON.stringify(updated));
        if (updatedItem) {
          saveDocToFirestore('food_menu_db', updatedItem);
        }
      }, 0);
      return updated;
    });
    const targetItem = foodMenu.find((item) => item.id === id);
    if (targetItem) {
      pushActivityLog(
        'Food Item Vis',
        `Admin changed visibility for: ${targetItem.titleBn}`,
        'Admin'
      );
    }
  };

  const handleToggleBypassTime = () => {
    setBypassTimeControls((prev) => {
      const newVal = !prev;
      localStorage.setItem('bypass_time', String(newVal));
      pushActivityLog('Timer Mode Updated', `Bypass scheduled timer is now ${newVal ? 'ON' : 'OFF'}`, 'Admin');
      return newVal;
    });
  };

  const handleUpdateAdminCredentials = (user: string, pass: string) => {
    setAdminUser(user);
    setAdminPass(pass);
    localStorage.setItem('admin_user', user);
    localStorage.setItem('admin_pass', pass);
    pushActivityLog('Credentials Changed', 'Admin updated administrative login details.', 'Admin');
  };

  // =====================================
  // ADMIN AUTHENTICATION Handler
  // =====================================
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminLoginInput.trim() === adminUser && adminPassInput === adminPass) {
      setAdminIsLoggedIn(true);
      localStorage.setItem('admin_is_logged_in', 'true');
      setAdminLoginError('');
      setAdminLoginInput('');
      setAdminPassInput('');
      pushActivityLog('Admin Login', 'Successfully authenticated into Admin Hub.', 'Admin');
    } else {
      setAdminLoginError(lang === 'bn' ? 'ভুল ইউজারনেম অথবা পাসওয়ার্ড!' : 'Incorrect Admin Username or Password!');
    }
  };

  const handleAdminLogout = () => {
    setAdminIsLoggedIn(false);
    localStorage.removeItem('admin_is_logged_in');
    pushActivityLog('Admin Logout', 'Logged out from Admin Hub.', 'Admin');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12 transition-all">
      {/* 1. HEADER SECTION */}
      <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* App Title & Tagline */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-extrabold text-lg shadow-md animate-pulse">
              B
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                {t.appName}
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h1>
              <p className="text-[10px] text-slate-400 font-medium">Digital Quarter Boarding & Food Operations Management</p>
            </div>
          </div>

          {/* Master View Switcher & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Manual Database Sync Button */}
            <button
              onClick={handleSyncDatabase}
              disabled={isSyncing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isSyncing 
                  ? 'bg-orange-50 border-orange-200 text-orange-600' 
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm'
              }`}
              title={lang === 'bn' ? 'ডাটাবেজ রিফ্রেশ করুন' : 'Refresh database from server'}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-orange-500' : 'text-slate-500'}`} />
              <span>{isSyncing ? (lang === 'bn' ? 'লোড হচ্ছে...' : 'Syncing...') : (lang === 'bn' ? 'ডাটা সিঙ্ক' : 'Sync Data')}</span>
            </button>

            {/* Language Switch */}
            <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-bold border border-slate-200/50">
              <button
                onClick={() => setLang('bn')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  lang === 'bn' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                বাংলা
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  lang === 'en' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                EN
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* 2. BODY CONTENT SECTION */}
      <main className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 mt-0 sm:mt-6">
        
        {/* VIEW 1: STAFF PORTAL VIEW */}
        {viewMode === 'staff' && (
          <StaffPortal
            currentUser={loggedInUser}
            users={users}
            demands={demands}
            notices={notices}
            chats={chats}
            timeSettings={timeSettings}
            preloadedStaff={preloadedStaff}
            bypassTimeControls={bypassTimeControls}
            lang={lang}
            foodMenu={foodMenu}
            rooms={rooms}
            onRegister={handleRegisterUser}
            onLogin={handleLoginUser}
            onLogout={handleLogoutUser}
            onSubmitDemand={handleSubmitDemand}
            onSendChatMessage={handleSendChatMessage}
            onSwitchToAdmin={() => setViewMode('admin')}
          />
        )}

        {/* VIEW 2: ADMIN PANEL VIEW */}
        {viewMode === 'admin' && (
          <>
            {adminIsLoggedIn ? (
              // Logged In Admin Panel Control
              <AdminPanel
                users={users}
                demands={demands}
                notices={notices}
                chats={chats}
                timeSettings={timeSettings}
                preloadedStaff={preloadedStaff}
                activityLogs={activityLogs}
                bypassTimeControls={bypassTimeControls}
                lang={lang}
                foodMenu={foodMenu}
                rooms={rooms}
                onAddRoom={handleAddRoom}
                onDeleteRoom={handleDeleteRoom}
                onToggleHideRoom={handleToggleHideRoom}
                onAddFoodMenuItem={handleAddFoodMenuItem}
                onUpdateFoodMenuItem={handleUpdateFoodMenuItem}
                onDeleteFoodMenuItem={handleDeleteFoodMenuItem}
                onToggleHideFoodMenuItem={handleToggleHideFoodMenuItem}
                onApproveUser={handleApproveUser}
                onRejectUser={handleRejectUser}
                onDeleteUser={handleDeleteUser}
                onBlockUser={handleBlockUser}
                onUnblockUser={handleUnblockUser}
                onUpdateUserRoom={handleUpdateUserRoom}
                onApproveDemand={handleApproveDemand}
                onRejectDemand={handleRejectDemand}
                onMarkDemandServed={handleMarkDemandServed}
                onAddTimeSetting={handleAddTimeSetting}
                onAddNotice={handleAddNotice}
                onDeleteNotice={handleDeleteNotice}
                onAddPreloadStaff={handleAddPreloadStaff}
                onDeletePreloadStaff={handleDeletePreloadStaff}
                onDeleteDemandsByDateAndMeal={handleDeleteDemandsByDateAndMeal}
                onDeleteDemand={handleDeleteDemand}
                onDeleteAllRejectedDemands={handleDeleteAllRejectedDemands}
                onSendChatMessage={handleSendChatMessage}
                onToggleBypassTime={handleToggleBypassTime}
                onUpdateAdminCredentials={handleUpdateAdminCredentials}
                adminUser={adminUser}
                onResetData={handleResetData}
                onExitAdmin={() => setViewMode('staff')}
              />
            ) : (
              // Admin Login Screen
              <div className="w-full max-w-lg sm:max-w-xl mx-auto my-0 sm:my-12 bg-white rounded-none sm:rounded-3xl border-0 sm:border border-slate-100 shadow-none sm:shadow-xl overflow-hidden min-h-[calc(100vh-80px)] sm:min-h-0" id="admin-login-view">
                <div className="bg-indigo-600 p-6 text-white text-center">
                  <div className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold">Admin Portal Login</h3>
                  <p className="text-xs text-indigo-200 mt-1">Authenticate to access meal operations, database, and settings.</p>
                </div>

                <form onSubmit={handleAdminLogin} className="p-6 space-y-4">
                  {adminLoginError && (
                    <div className="bg-rose-50 text-rose-600 text-xs p-3 rounded-xl border border-rose-100 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{adminLoginError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Username</label>
                    <input
                      type="text"
                      required
                      value={adminLoginInput}
                      onChange={(e) => setAdminLoginInput(e.target.value)}
                      placeholder="e.g. admin"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
                    <input
                      type="password"
                      required
                      value={adminPassInput}
                      onChange={(e) => setAdminPassInput(e.target.value)}
                      placeholder="e.g. password123"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Default Passcode for Demo testing is <strong className="text-slate-600">password123</strong></span>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <Key className="w-4 h-4" /> Authenticate Admin
                  </button>

                  {/* Return to Member Portal option */}
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => setViewMode('staff')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1 mx-auto hover:underline cursor-pointer"
                    >
                      ← {lang === 'bn' ? 'স্টাফ পোর্টাল-এ ফিরুন' : 'Back to Member Portal'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}

      </main>
    </div>
  );
}
