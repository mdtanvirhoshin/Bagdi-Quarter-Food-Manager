/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, MealDemand, Notice, ChatMessage, TimeSetting, PreLoadedStaff, ActivityLog, MealType, FoodMenuItem, RoomConfig } from '../types';
import { translations, Language } from '../translations';
import { ChatPanel } from './ChatPanel';
import { 
  Users, CheckSquare, Shield, ShieldAlert, Clock, 
  Megaphone, Download, Plus, Trash2, CheckCircle, 
  AlertCircle, XCircle, FileText, Search, UserMinus, 
  UserCheck, RefreshCw, Eye, Printer, ShieldCheck, Play,
  Menu, X, Copy, Clipboard, ClipboardList, Check, EyeOff
} from 'lucide-react';

interface AdminPanelProps {
  users: User[];
  demands: MealDemand[];
  notices: Notice[];
  chats: ChatMessage[];
  timeSettings: TimeSetting[];
  preloadedStaff: PreLoadedStaff[];
  activityLogs: ActivityLog[];
  bypassTimeControls: boolean;
  lang: Language;
  foodMenu: FoodMenuItem[];
  rooms?: RoomConfig[];
  onAddRoom?: (roomNumber: string) => void;
  onDeleteRoom?: (id: string) => void;
  onToggleHideRoom?: (id: string) => void;
  onAddFoodMenuItem: (img: string, titleBn: string, titleEn: string, descBn: string, descEn: string) => void;
  onUpdateFoodMenuItem: (item: FoodMenuItem) => void;
  onDeleteFoodMenuItem: (id: string) => void;
  onToggleHideFoodMenuItem: (id: string) => void;
  onApproveUser: (userId: string) => void;
  onRejectUser: (userId: string) => void;
  onDeleteUser?: (userId: string) => void;
  onBlockUser: (userId: string) => void;
  onUnblockUser: (userId: string) => void;
  onUpdateUserRoom?: (userId: string, newRoomNumber: string) => void;
  onApproveDemand: (demandId: string) => void;
  onRejectDemand: (demandId: string) => void;
  onMarkDemandServed: (demandId: string) => void;
  onAddTimeSetting: (mealType: MealType, startTime: string, endTime: string) => void;
  onAddNotice: (title: string, content: string) => void;
  onDeleteNotice: (noticeId: string) => void;
  onAddPreloadStaff: (staffId: string, name: string, roomNumber: string, department: string) => void;
  onDeletePreloadStaff: (id: string) => void;
  onDeleteDemandsByDateAndMeal?: (date: string, mealType: MealType) => void;
  onDeleteDemand?: (demandId: string) => void;
  onDeleteAllRejectedDemands?: () => void;
  onSendChatMessage: (text: string, receiverId: string) => void;
  onToggleBypassTime: () => void;
  onUpdateAdminCredentials: (user: string, pass: string) => void;
  adminUser: string;
  onResetData: () => void;
  onExitAdmin: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  users,
  demands,
  notices,
  chats,
  timeSettings,
  preloadedStaff,
  activityLogs,
  bypassTimeControls,
  lang,
  foodMenu,
  rooms = [],
  onAddRoom,
  onDeleteRoom,
  onToggleHideRoom,
  onAddFoodMenuItem,
  onUpdateFoodMenuItem,
  onDeleteFoodMenuItem,
  onToggleHideFoodMenuItem,
  onApproveUser,
  onRejectUser,
  onDeleteUser,
  onBlockUser,
  onUnblockUser,
  onUpdateUserRoom,
  onApproveDemand,
  onRejectDemand,
  onMarkDemandServed,
  onAddTimeSetting,
  onAddNotice,
  onDeleteNotice,
  onAddPreloadStaff,
  onDeletePreloadStaff,
  onDeleteDemandsByDateAndMeal,
  onDeleteDemand,
  onDeleteAllRejectedDemands,
  onSendChatMessage,
  onToggleBypassTime,
  onUpdateAdminCredentials,
  adminUser,
  onResetData,
  onExitAdmin,
}) => {
  const t = translations[lang];

  // Clipboard Sheet System Interface & States
  interface ClipboardItem {
    id: string;
    name: string;
    room: string;
    staffId: string;
    timestamp: number;
  }

  const [clipboardItems, setClipboardItems] = useState<ClipboardItem[]>(() => {
    try {
      const saved = localStorage.getItem('admin_clipboard_sheet');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info'>('success');
  const [isClipboardOpen, setIsClipboardOpen] = useState(false);

  // Manual inputs inside the Clipboard Sheet Drawer
  const [manualName, setManualName] = useState('');
  const [manualRoom, setManualRoom] = useState('');
  const [manualId, setManualId] = useState('');

  const updateClipboardItems = (items: ClipboardItem[]) => {
    setClipboardItems(items);
    localStorage.setItem('admin_clipboard_sheet', JSON.stringify(items));
  };

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleCopyIdOnly = (staffId: string, name: string) => {
    navigator.clipboard.writeText(staffId);
    showToast(lang === 'bn' ? `আইডি "${staffId}" কপি হয়েছে!` : `ID "${staffId}" copied!`, 'success');

    // Automatically add to draft clipboard sheet for ease of accumulation
    const exists = clipboardItems.some((item) => item.staffId.toLowerCase() === staffId.toLowerCase());
    if (!exists) {
      const newItem: ClipboardItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        name: name,
        room: 'N/A',
        staffId: staffId,
        timestamp: Date.now()
      };
      updateClipboardItems([newItem, ...clipboardItems]);
    }
  };

  const handleCopyWithAll = (staffId: string, name: string, room: string) => {
    const formattedText = `${lang === 'bn' ? 'নাম' : 'Name'}: ${name} | ${lang === 'bn' ? 'রুম' : 'Room'}: ${room} | ID: ${staffId}`;
    navigator.clipboard.writeText(formattedText);
    showToast(lang === 'bn' ? 'নাম, রুম ও আইডি একসঙ্গে কপি হয়েছে!' : 'Name, Room & ID copied together!', 'success');

    const exists = clipboardItems.some((item) => item.staffId.toLowerCase() === staffId.toLowerCase());
    if (!exists) {
      const newItem: ClipboardItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        name: name,
        room: room || 'N/A',
        staffId: staffId,
        timestamp: Date.now()
      };
      updateClipboardItems([newItem, ...clipboardItems]);
    }
  };

  const handleCopyAllCombined = () => {
    if (clipboardItems.length === 0) return;
    const formattedText = clipboardItems
      .map((item, idx) => `${idx + 1}. ${lang === 'bn' ? 'নাম' : 'Name'}: ${item.name} | ${lang === 'bn' ? 'রুম' : 'Room'}: ${item.room} | ID: ${item.staffId}`)
      .join('\n');
    navigator.clipboard.writeText(formattedText);
    showToast(lang === 'bn' ? 'ক্লিপবোর্ডের সব ডাটা একসঙ্গে কপি হয়েছে!' : 'All clipboard records copied together!', 'success');
  };

  const handleClearSheet = () => {
    updateClipboardItems([]);
    showToast(lang === 'bn' ? 'ক্লিপবোর্ড ড্রাফট শিট খালি করা হয়েছে!' : 'Clipboard draft sheet cleared!', 'info');
  };

  const handleAddManualItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    const newItem: ClipboardItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      name: manualName.trim() || (lang === 'bn' ? 'কাস্টম নাম' : 'Custom Name'),
      room: manualRoom.trim() || 'N/A',
      staffId: manualId.trim().toUpperCase(),
      timestamp: Date.now()
    };
    updateClipboardItems([newItem, ...clipboardItems]);
    setManualName('');
    setManualRoom('');
    setManualId('');
    showToast(lang === 'bn' ? 'নতুন এন্ট্রি ক্লিপবোর্ডে যুক্ত করা হয়েছে!' : 'New entry saved to clipboard sheet!', 'success');
  };

  const handleCopyDateMealReportCombined = (onlyApprovedAndServed: boolean) => {
    const list = getSelectedReportStaffList();
    const filteredList = onlyApprovedAndServed 
      ? list.filter(item => item.status === 'approved' || item.status === 'served')
      : list;

    if (filteredList.length === 0) {
      showToast(
        lang === 'bn' 
          ? 'কপি করার মতো কোনো বুকিং রেকর্ড পাওয়া যায়নি!' 
          : 'No booking records found to copy!', 
        'info'
      );
      return;
    }

    const mealLabel = lang === 'bn' 
      ? (selectedReportMealType === 'breakfast' ? 'সকাল' : selectedReportMealType === 'lunch' ? 'দুপুর' : 'রাত')
      : (selectedReportMealType === 'breakfast' ? 'Breakfast' : selectedReportMealType === 'lunch' ? 'Lunch' : 'Dinner');

    let formattedText = '';
    
    if (lang === 'bn') {
      formattedText = `📋 মিল বুকিং রিপোর্ট\n`;
      formattedText += `তারিখ: ${selectedReportDate}\n`;
      formattedText += `মিল: ${mealLabel}\n`;
      formattedText += `মোট সদস্য: ${filteredList.length} জন\n`;
      formattedText += `--------------------------------------\n`;
      filteredList.forEach((item, idx) => {
        const statusText = item.status === 'approved' ? 'অনুমোদিত' : item.status === 'served' ? 'পরিবেশিত' : item.status === 'pending' ? 'অপেক্ষমাণ' : 'বাতিল';
        formattedText += `${idx + 1}. নাম: ${item.name} | আইডি: ${item.staffId} | রুম: ${item.roomNumber} | অবস্থা: ${statusText}\n`;
      });
      formattedText += `--------------------------------------\n`;
      formattedText += `রিপোর্ট জেনারেট সময়: ${new Date().toLocaleTimeString()}\n`;
    } else {
      formattedText = `📋 Meal Booking Report\n`;
      formattedText += `Date: ${selectedReportDate}\n`;
      formattedText += `Meal: ${mealLabel}\n`;
      formattedText += `Total Members: ${filteredList.length}\n`;
      formattedText += `--------------------------------------\n`;
      filteredList.forEach((item, idx) => {
        formattedText += `${idx + 1}. Name: ${item.name} | ID: ${item.staffId} | Room: ${item.roomNumber} | Status: ${item.status.toUpperCase()}\n`;
      });
      formattedText += `--------------------------------------\n`;
      formattedText += `Report Generated: ${new Date().toLocaleTimeString()}\n`;
    }

    navigator.clipboard.writeText(formattedText);
    showToast(
      lang === 'bn' 
        ? `${filteredList.length} জন সদস্যের তথ্য কপি হয়েছে!` 
        : `Copied data for ${filteredList.length} members!`, 
      'success'
    );
  };

  const handleCopyDateMealReportTabular = (onlyApprovedAndServed: boolean) => {
    const list = getSelectedReportStaffList();
    const filteredList = onlyApprovedAndServed 
      ? list.filter(item => item.status === 'approved' || item.status === 'served')
      : list;

    if (filteredList.length === 0) {
      showToast(
        lang === 'bn' 
          ? 'কপি করার মতো কোনো বুকিং রেকর্ড পাওয়া যায়নি!' 
          : 'No booking records found to copy!', 
        'info'
      );
      return;
    }

    let formattedText = '';
    if (lang === 'bn') {
      formattedText = `ক্রমিক\tনাম\tস্টাফ আইডি\tরুম নম্বর\tঅবস্থা\n`;
    } else {
      formattedText = `S.No\tName\tStaff ID\tRoom Number\tStatus\n`;
    }

    filteredList.forEach((item, idx) => {
      const statusText = lang === 'bn'
        ? (item.status === 'approved' ? 'অনুমোদিত' : item.status === 'served' ? 'পরিবেশিত' : item.status === 'pending' ? 'অপেক্ষমাণ' : 'বাতিল')
        : item.status.toUpperCase();
      formattedText += `${idx + 1}\t${item.name}\t${item.staffId}\t${item.roomNumber}\t${statusText}\n`;
    });

    navigator.clipboard.writeText(formattedText);
    showToast(
      lang === 'bn' 
        ? `এক্সেল পেস্ট উপযোগী ${filteredList.length} টি তথ্য কপি হয়েছে!` 
        : `Copied ${filteredList.length} rows for Excel/Google Sheets!`, 
      'success'
    );
  };

  const handleBatchDeleteReport = () => {
    if (!onDeleteDemandsByDateAndMeal) return;

    const mealLabel = lang === 'bn' 
      ? (selectedReportMealType === 'breakfast' ? 'সকালের খাবার' : selectedReportMealType === 'lunch' ? 'দুপুরের খাবার' : 'রাতের খাবার')
      : (selectedReportMealType === 'breakfast' ? 'Breakfast' : selectedReportMealType === 'lunch' ? 'Lunch' : 'Dinner');

    onDeleteDemandsByDateAndMeal(selectedReportDate, selectedReportMealType);
    showToast(
      lang === 'bn' 
        ? `"${selectedReportDate}" তারিখের "${mealLabel}" এর সমস্ত বুকিং ডিলিট করা হয়েছে!` 
        : `Deleted all "${mealLabel}" records for ${selectedReportDate}!`, 
      'info'
    );
  };

  // Active Admin Tabs: 'dashboard' | 'distribution' | 'foodMenu' | 'staff' | 'time' | 'notice' | 'chats' | 'reports' | 'settings' | 'rooms'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'distribution' | 'foodMenu' | 'staff' | 'time' | 'notice' | 'chats' | 'reports' | 'settings' | 'rooms'>('dashboard');

  // Room deletion confirmation state
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);
  const [deletingRoomNumber, setDeletingRoomNumber] = useState<string>('');

  // Room configuration local states
  const [newRoomInput, setNewRoomInput] = useState('');

  // Food Menu Management States
  const [newFoodImg, setNewFoodImg] = useState('');
  const [newFoodTitleBn, setNewFoodTitleBn] = useState('');
  const [newFoodTitleEn, setNewFoodTitleEn] = useState('');
  const [newFoodDescBn, setNewFoodDescBn] = useState('');
  const [newFoodDescEn, setNewFoodDescEn] = useState('');
  const [newFoodCategory, setNewFoodCategory] = useState<MealType>('breakfast');

  // Editing Food Menu states
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [editFoodImg, setEditFoodImg] = useState('');
  const [editFoodTitleBn, setEditFoodTitleBn] = useState('');
  const [editFoodTitleEn, setEditFoodTitleEn] = useState('');
  const [editFoodDescBn, setEditFoodDescBn] = useState('');
  const [editFoodDescEn, setEditFoodDescEn] = useState('');
  const [editFoodCategory, setEditFoodCategory] = useState<MealType>('breakfast');

  // Drawer menu open state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Distribution State: Room Selector
  const [selectedRoomNum, setSelectedRoomNum] = useState<string | null>(null);
  const [roomFilterStatus, setRoomFilterStatus] = useState<'all' | 'pending' | 'served'>('all');
  const [distSearchQuery, setDistSearchQuery] = useState('');
  const [quickDeleteDate, setQuickDeleteDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [quickDeleteMealType, setQuickDeleteMealType] = useState<MealType>('breakfast');

  const handleQuickDelete = () => {
    if (!onDeleteDemandsByDateAndMeal) return;

    const mealLabel = lang === 'bn' 
      ? (quickDeleteMealType === 'breakfast' ? 'সকালের খাবার' : quickDeleteMealType === 'lunch' ? 'দুপুরের খাবার' : 'রাতের খাবার')
      : (quickDeleteMealType === 'breakfast' ? 'Breakfast' : quickDeleteMealType === 'lunch' ? 'Lunch' : 'Dinner');

    onDeleteDemandsByDateAndMeal(quickDeleteDate, quickDeleteMealType);
    showToast(
      lang === 'bn' 
        ? `"${quickDeleteDate}" তারিখের "${mealLabel}" এর সমস্ত বুকিং ডিলিট করা হয়েছে!` 
        : `Deleted all "${mealLabel}" records for ${quickDeleteDate}!`, 
      'info'
    );
  };

  // Staff Management States
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [viewingIdPhoto, setViewingIdPhoto] = useState<string | null>(null);
  const [selectedMemberDetail, setSelectedMemberDetail] = useState<User | null>(null);

  // Preloaded Staff Form States
  const [preloadStaffId, setPreloadStaffId] = useState('');
  const [preloadName, setPreloadName] = useState('');
  const [preloadRoom, setPreloadRoom] = useState('');
  const [preloadDept, setPreloadDept] = useState('');
  const [preloadError, setPreloadError] = useState('');

  // Notice Form States
  const [noticeTitleInput, setNoticeTitleInput] = useState('');
  const [noticeContentInput, setNoticeContentInput] = useState('');

  // Chat Support States
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);

  // Settings State (Admin password change)
  const [newAdminUser, setNewAdminUser] = useState(adminUser);
  const [newAdminPass, setNewAdminPass] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');

  // Live Demand calculations for today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayDemands = demands.filter((d) => d.date === todayStr);

  // Date & Meal Wise Custom Reporter States
  const [selectedReportDate, setSelectedReportDate] = useState<string>(todayStr);
  const [selectedReportMealType, setSelectedReportMealType] = useState<MealType>('breakfast');

  // Live Spreadsheet States
  const [liveSheetSearch, setLiveSheetSearch] = useState('');
  const [liveSheetDate, setLiveSheetDate] = useState<string>(todayStr);
  const [liveSheetMealType, setLiveSheetMealType] = useState<string>('all');
  const [liveSheetStatusFilter, setLiveSheetStatusFilter] = useState<string>('all');

  // 1. Preloaded Staff and User search maps for O(1) lookups
  const preloadedStaffMap = React.useMemo(() => {
    const map = new Map<string, typeof preloadedStaff[0]>();
    preloadedStaff.forEach((p) => {
      if (p && p.staffId) {
        map.set(p.staffId.toLowerCase(), p);
      }
    });
    return map;
  }, [preloadedStaff]);

  const usersMap = React.useMemo(() => {
    const map = new Map<string, typeof users[0]>();
    users.forEach((u) => {
      if (u && u.staffId) {
        map.set(u.staffId.toLowerCase(), u);
      }
    });
    return map;
  }, [users]);

  // 2. Pre-calculate today's demands map indexed by staffId for O(1) lookups
  const staffTodayDemandsMap = React.useMemo(() => {
    const map = new Map<string, typeof demands[0][]>();
    todayDemands.forEach((d) => {
      if (d && d.selectedStaffIds && Array.isArray(d.selectedStaffIds)) {
        d.selectedStaffIds.forEach((sid) => {
          if (sid) {
            const key = sid.toLowerCase();
            const existing = map.get(key) || [];
            existing.push(d);
            map.set(key, existing);
          }
        });
      }
    });
    return map;
  }, [todayDemands]);

  // 3. Pre-calculate user chats map for O(1) lookups
  const userChatsMap = React.useMemo(() => {
    const map = new Map<string, typeof chats>();
    chats.forEach((c) => {
      if (c) {
        if (c.senderId) {
          const sKey = c.senderId.toLowerCase();
          const existingS = map.get(sKey) || [];
          existingS.push(c);
          map.set(sKey, existingS);
        }
        if (c.receiverId) {
          const rKey = c.receiverId.toLowerCase();
          const existingR = map.get(rKey) || [];
          existingR.push(c);
          map.set(rKey, existingR);
        }
      }
    });
    return map;
  }, [chats]);

  const getStaffName = React.useCallback((staffId: string): string => {
    const key = staffId.toLowerCase();
    const s = preloadedStaffMap.get(key);
    if (s) return s.name;
    const u = usersMap.get(key);
    if (u) return u.name;
    return lang === 'bn' ? 'অজানা স্টাফ' : 'Unknown Staff';
  }, [preloadedStaffMap, usersMap, lang]);

  const getSelectedReportStaffList = () => {
    const selectedDemands = demands.filter(
      (d) => d.date === selectedReportDate && d.mealType === selectedReportMealType && (d.status === 'approved' || d.status === 'served')
    );
    
    const list: { id: string; staffId: string; name: string; roomNumber: string; status: 'pending' | 'approved' | 'served' | 'rejected' }[] = [];
    
    selectedDemands.forEach((d) => {
      d.selectedStaffIds.forEach((sid, idx) => {
        list.push({
          id: `${d.id}-${sid}-${idx}`,
          staffId: sid,
          name: getStaffName(sid),
          roomNumber: d.roomNumber,
          status: d.status
        });
      });
    });
    
    return list;
  };

  const getMealStats = (mealType: MealType) => {
    const mealsOfTab = todayDemands.filter((d) => d.mealType === mealType);
    let totalPlates = 0;
    let pendingPlates = 0;
    let approvedPlates = 0;
    let servedPlates = 0;
    let rejectedPlates = 0;

    mealsOfTab.forEach((d) => {
      const count = d.selectedStaffIds.length;
      totalPlates += count;
      if (d.status === 'pending') pendingPlates += count;
      if (d.status === 'approved') approvedPlates += count;
      if (d.status === 'served') servedPlates += count;
      if (d.status === 'rejected') rejectedPlates += count;
    });

    return { totalPlates, pendingPlates, approvedPlates, servedPlates, rejectedPlates };
  };

  const bStats = getMealStats('breakfast');
  const lStats = getMealStats('lunch');
  const dStats = getMealStats('dinner');

  // Find users with unread messages
  const getUniqueChatUsers = () => {
    // Get all user accounts
    return users.filter((u) => u.status === 'approved');
  };

  const activeChatUser = users.find((u) => u.id === selectedChatUserId);

  // CSV Exporter for today's demands
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Room,Meal Type,Representative,Status,Members count,Members list,Time Submitted,Time Served\n';

    demands.forEach((d) => {
      const namesList = d.selectedStaffIds
        .map((sid) => preloadedStaff.find((p) => p.staffId === sid)?.name || sid)
        .join('; ');
      csvContent += `Room ${d.roomNumber},${d.mealType},${d.submittedByName},${d.status},${d.selectedStaffIds.length},"${namesList}",${d.timestamp},${d.servedAt || ''}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `quarter_meals_report_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAddPreloadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!preloadStaffId || !preloadName || !preloadRoom) {
      setPreloadError('Please fill in required fields');
      return;
    }
    // Check if duplicate
    if (preloadedStaff.some((s) => s.staffId.toLowerCase() === preloadStaffId.toLowerCase())) {
      setPreloadError('This Staff ID already exists in Database!');
      return;
    }

    onAddPreloadStaff(preloadStaffId.toUpperCase(), preloadName, preloadRoom, preloadDept || 'General');
    setPreloadStaffId('');
    setPreloadName('');
    setPreloadRoom('');
    setPreloadDept('');
    setPreloadError('');
  };

  const handleAddNoticeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitleInput || !noticeContentInput) return;
    onAddNotice(noticeTitleInput, noticeContentInput);
    setNoticeTitleInput('');
    setNoticeContentInput('');
  };

  const handleUpdateAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUser || !newAdminPass) return;
    onUpdateAdminCredentials(newAdminUser, newAdminPass);
    setSettingsSuccess('Admin Credentials Updated Successfully!');
    setNewAdminPass('');
    setTimeout(() => setSettingsSuccess(''), 3000);
  };

  // Get Room Status Class for visual grid
  const getRoomVisualState = (roomNumStr: string) => {
    const roomDems = todayDemands.filter((d) => d.roomNumber === roomNumStr);
    if (roomDems.length === 0) return 'bg-white text-slate-700 border-slate-200 hover:border-slate-400';

    const hasPending = roomDems.some((d) => d.status === 'pending');
    const hasApproved = roomDems.some((d) => d.status === 'approved');
    const allServed = roomDems.every((d) => d.status === 'served');

    if (hasPending) return 'bg-amber-50 border-amber-300 text-amber-900 shadow-sm animate-pulse';
    if (hasApproved) return 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-sm';
    if (allServed) return 'bg-emerald-600 border-emerald-600 text-white shadow-sm';

    return 'bg-slate-100 border-slate-200 text-slate-500';
  };

  // Get Room Demands List
  const getRoomDemandsList = (roomNumStr: string) => {
    return todayDemands.filter((d) => d.roomNumber === roomNumStr);
  };

  return (
    <div className="grid grid-cols-12 gap-6 animate-in fade-in duration-300" id="admin-panel-container">
      {/* Premium Header with Hamburger / Dots Menu */}
      <div className="col-span-12 bg-white border border-slate-100 rounded-3xl p-4 shadow-sm flex items-center justify-between gap-4" id="admin-top-navbar">
        <div className="flex items-center gap-3">
          {/* 3-Lines Hamburger menu button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl transition cursor-pointer flex items-center justify-center border border-indigo-100/50 relative group"
            title={lang === 'bn' ? 'মেনু খুলুন' : 'Open Menu'}
            id="hamburger-menu-btn"
          >
            <Menu className="w-5 h-5 animate-pulse" />
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full bg-slate-900 text-white text-[9px] font-bold px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-20">
              {lang === 'bn' ? 'মেনু' : 'Menu'}
            </span>
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-slate-800 font-extrabold text-sm sm:text-base">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>{lang === 'bn' ? 'বাগদী কোয়ার্টার এডমিন হাব' : 'Bagdi Quarter Admin Hub'}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">
              {lang === 'bn' ? 'সিস্টেম সক্রিয়' : 'System Active'} | User: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">{adminUser}</span>
            </p>
          </div>
        </div>

        {/* Current Active Section Badge */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-100 px-4 py-2 rounded-2xl">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
            {lang === 'bn' ? (
              activeTab === 'dashboard' ? '📊 ড্যাশবোর্ড' :
              activeTab === 'distribution' ? '🍛 খাবার বিতরণ' :
              activeTab === 'foodMenu' ? '✨ খাবার মেনু' :
              activeTab === 'staff' ? '👥 স্টাফ বোর্ড' :
              activeTab === 'time' ? '⏱️ সময় নিয়ন্ত্রণ' :
              activeTab === 'notice' ? '📢 নোটিশ বোর্ড' :
              activeTab === 'chats' ? '💬 চ্যাট সাপোর্ট' :
              activeTab === 'reports' ? '📝 রিপোর্ট ও এক্সপোর্ট' :
              activeTab === 'rooms' ? '🏢 রুম পরিচালনা' : '⚙️ সেটিংস'
            ) : activeTab.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Horizontal Scrollable Quick-Tab Navigation Bar */}
      <div className="col-span-12 bg-white border border-slate-100 p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto scrollbar-none shadow-sm" id="admin-horizontal-tabs">
        {([
          { id: 'dashboard', label: lang === 'bn' ? '📊 ড্যাশবোর্ড' : '📊 Dashboard' },
          { id: 'distribution', label: lang === 'bn' ? '🍛 খাবার বিতরণ' : '🍛 Service' },
          { id: 'foodMenu', label: lang === 'bn' ? '✨ খাবার মেনু পরিচালনা' : '✨ Food Menu' },
          { id: 'staff', label: lang === 'bn' ? '👥 স্টাফ বোর্ড' : '👥 Staff' },
          { id: 'rooms', label: lang === 'bn' ? '🏢 রুম পরিচালনা' : '🏢 Rooms' },
          { id: 'time', label: lang === 'bn' ? '⏱️ সময়' : '⏱️ Timer' },
          { id: 'notice', label: lang === 'bn' ? '📢 নোটিশ' : '📢 Notice' },
          { id: 'chats', label: lang === 'bn' ? '💬 চ্যাট' : '💬 Chat' },
          { id: 'reports', label: lang === 'bn' ? '📝 রিপোর্ট' : '📝 Reports' },
          { id: 'settings', label: lang === 'bn' ? '⚙️ সেটিংস' : '⚙️ Settings' },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 text-[11px] font-black rounded-xl transition flex items-center gap-1 cursor-pointer whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Slide-out Overlay Drawer Menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 transition-opacity duration-300 flex justify-start animate-in fade-in" 
          onClick={() => setIsMenuOpen(false)}
          id="drawer-backdrop"
        >
          <div 
            className="w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col p-6 space-y-6 animate-in slide-in-from-left duration-300"
            onClick={(e) => e.stopPropagation()}
            id="drawer-sidebar-container"
          >
            {/* Header of Drawer */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="font-black text-slate-800 text-sm tracking-tight">Admin Menu</span>
              </div>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-xl transition border cursor-pointer flex items-center justify-center"
                id="close-drawer-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab links */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {([
                { id: 'dashboard', label: lang === 'bn' ? '📊 ড্যাশবোর্ড' : '📊 Dashboard' },
                { id: 'distribution', label: lang === 'bn' ? '🍛 খাবার বিতরণ' : '🍛 Food Service' },
                { id: 'foodMenu', label: lang === 'bn' ? '✨ খাবার মেনু পরিচালনা' : '✨ Spotlight Food Menu' },
                { id: 'staff', label: lang === 'bn' ? '👥 স্টাফ ম্যানেজমেন্ট' : '👥 Staff Board' },
                { id: 'rooms', label: lang === 'bn' ? '🏢 রুম পরিচালনা' : '🏢 Rooms Setup' },
                { id: 'time', label: lang === 'bn' ? '⏱️ সময় নিয়ন্ত্রণ' : '⏱️ Schedule Timer' },
                { id: 'notice', label: lang === 'bn' ? '📢 নোটিশ বোর্ড' : '📢 Announcements' },
                { id: 'chats', label: lang === 'bn' ? '💬 চ্যাট সাপোর্ট' : '💬 Help Chat' },
                { id: 'reports', label: lang === 'bn' ? '📝 রিপোর্ট ও এক্সপোর্ট' : '📝 Reports' },
                { id: 'settings', label: lang === 'bn' ? '⚙️ সেটিংস' : '⚙️ Credentials' },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMenuOpen(false); // Close menu automatically when clicked!
                  }}
                  className={`w-full text-left px-4 py-3.5 text-xs font-bold rounded-2xl transition flex items-center justify-between cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-white shadow-lg'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                  }`}
                >
                  <span>{tab.label}</span>
                  {activeTab === tab.id && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                </button>
              ))}
            </div>

            {/* Rapid Bypass Overrule in menu */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <button
                onClick={() => {
                  onToggleBypassTime();
                  setIsMenuOpen(false); // Close menu automatically
                }}
                className={`w-full text-center py-2.5 px-3 rounded-2xl text-[10px] font-bold tracking-wider uppercase border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  bypassTimeControls
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                {bypassTimeControls
                  ? (lang === 'bn' ? 'সময় নিয়ন্ত্রণ বাইপাস চালু' : 'TIME CONTROL BYPASS ON')
                  : (lang === 'bn' ? 'সময় নিয়ন্ত্রণ বাইপাস বন্ধ' : 'TIME CONTROL BYPASS OFF')}
              </button>

              <button
                onClick={() => {
                  onExitAdmin();
                  setIsMenuOpen(false);
                }}
                className="w-full text-center py-2.5 px-3 rounded-2xl text-[10px] font-bold tracking-wider uppercase border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                ⬅️ {lang === 'bn' ? 'সদস্য পোর্টালে ফিরুন' : 'Back to Member Portal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Admin Content Window - Expanded full-width for premium look */}
      <div className="col-span-12 space-y-6">
        
        {/* TAB 1: DASHBOARD STATS */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6" id="admin-dashboard-view">
            {/* Core Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { type: 'breakfast', stats: bStats, title: t.breakfast, color: 'emerald' },
                { type: 'lunch', stats: lStats, title: t.lunch, color: 'indigo' },
                { type: 'dinner', stats: dStats, title: t.dinner, color: 'sky' },
              ].map(({ type, stats, title, color }) => (
                <div key={type} className="bg-white border border-slate-100 rounded-2xl p-3.5 shadow-sm space-y-2.5">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                    <h4 className="font-extrabold text-slate-800 text-xs">{title}</h4>
                    <span className="text-[9px] bg-slate-50 font-mono text-slate-500 px-1.5 py-0.5 rounded-md">
                      Today
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{lang === 'bn' ? 'মোট ডিমান্ড' : 'Total'}</div>
                      <div className="text-base font-black text-slate-800 mt-0.5">{stats.totalPlates} <span className="text-[9px] font-normal text-slate-400">{lang === 'bn' ? 'জন' : 'qty'}</span></div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{lang === 'bn' ? 'পরিবেশিত' : 'Served'}</div>
                      <div className="text-base font-black text-emerald-600 mt-0.5">{stats.servedPlates} <span className="text-[9px] font-normal text-slate-400">{lang === 'bn' ? 'জন' : 'qty'}</span></div>
                    </div>
                  </div>

                  {/* Tailwind Progress bars */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-100/50">
                    <div className="flex justify-between text-[8px] text-slate-400 font-medium">
                      <span>Pending: {stats.pendingPlates}</span>
                      <span>Approved: {stats.approvedPlates}</span>
                    </div>
                    <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        className="bg-amber-400 h-full"
                        style={{ width: `${stats.totalPlates ? (stats.pendingPlates / stats.totalPlates) * 100 : 0}%` }}
                      ></div>
                      <div
                        className="bg-indigo-500 h-full"
                        style={{ width: `${stats.totalPlates ? (stats.approvedPlates / stats.totalPlates) * 100 : 0}%` }}
                      ></div>
                      <div
                        className="bg-emerald-500 h-full"
                        style={{ width: `${stats.totalPlates ? (stats.servedPlates / stats.totalPlates) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Activity Log Tracker */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                {t.activityLog}
              </h3>
              <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto">
                {activityLogs.slice().reverse().map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-700">[{log.action}]</span>{' '}
                      <span className="text-slate-500">{log.details}</span>
                    </div>
                    <div className="text-[9px] font-mono text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FOOD DISTRIBUTION (ROOM GRID 1-50) */}
        {activeTab === 'distribution' && (() => {
          // Dynamic calculation of search matches
          const query = distSearchQuery.trim().toLowerCase();
          const matchedStaffIds = new Set<string>();

          // Filter preloaded and registered members matching query
          const searchMatches = (query !== '') ? preloadedStaff.filter((p) => {
            const match = p.staffId.toLowerCase().includes(query) || p.name.toLowerCase().includes(query) || p.roomNumber.includes(query);
            if (match) matchedStaffIds.add(p.staffId);
            return match;
          }) : [];

          // Also catch registered users who might not be in preloaded (just in case)
          const additionalUserMatches = (query !== '') ? users.filter((u) => {
            const match = u.staffId.toLowerCase().includes(query) || u.name.toLowerCase().includes(query) || u.roomNumber.includes(query);
            if (match && !matchedStaffIds.has(u.staffId)) {
              matchedStaffIds.add(u.staffId);
              return true;
            }
            return false;
          }) : [];

          // Merge matches
          const mergedMatches = [
            ...searchMatches.map(p => {
              const regU = users.find(u => u.staffId.toLowerCase() === p.staffId.toLowerCase());
              return {
                staffId: p.staffId,
                name: p.name,
                roomNumber: p.roomNumber,
                department: p.department,
                userPhoto: regU?.userPhoto || null,
                registeredUser: regU || null,
              };
            }),
            ...additionalUserMatches.map(u => ({
              staffId: u.staffId,
              name: u.name,
              roomNumber: u.roomNumber,
              department: u.department,
              userPhoto: u.userPhoto || null,
              registeredUser: u,
            }))
          ];

          return (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6" id="admin-distribution-view">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h3 className="text-base font-bold text-slate-800">{t.foodDistribution}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{lang === 'bn' ? 'স্টাফ আইডি বা রুম নং অনুসন্ধান করুন এবং খাবার বিতরণ নিশ্চিত করুন।' : 'Search Staff ID or Room No & verify food deliveries.'}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  {/* S ID / Room Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={distSearchQuery}
                      onChange={(e) => setDistSearchQuery(e.target.value)}
                      placeholder={lang === 'bn' ? 'S আইডি বা রুম দিয়ে খুঁজুন...' : 'Search Staff ID or Room...'}
                      className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-medium"
                    />
                    {distSearchQuery && (
                      <button
                        onClick={() => setDistSearchQuery('')}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Status Filter */}
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    {([
                      { id: 'all', label: lang === 'bn' ? 'সব রুম' : 'All Rooms' },
                      { id: 'pending', label: lang === 'bn' ? '⏳ পেন্ডিং ডিমান্ড' : '⏳ Demands' },
                      { id: 'served', label: lang === 'bn' ? '✅ পরিবেশিত' : '✅ Served' },
                    ] as const).map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setRoomFilterStatus(f.id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                          roomFilterStatus === f.id
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Demand Eraser Bar */}
              <div className="bg-rose-50/40 border border-rose-100 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl sm:text-2xl">🗑️</span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-rose-950 uppercase tracking-tight">
                      {lang === 'bn' ? 'কুইক মিল রেকর্ড ডিলিট (Quick Demand Delete)' : 'Quick Meal Demand Clear Tool'}
                    </h4>
                    <p className="text-[10px] sm:text-xs text-rose-600 font-medium">
                      {lang === 'bn' ? 'নির্দিষ্ট তারিখ ও মিলের সব ডিমান্ড মুছুন (যাতে সার্চ করলে আগের তথ্য না দেখায়)' : 'Delete all demands for a specific date and meal (clears previous demands in search).'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <input
                    type="date"
                    value={quickDeleteDate}
                    onChange={(e) => setQuickDeleteDate(e.target.value)}
                    className="bg-white border border-rose-200/60 rounded-xl px-3 py-2 text-xs focus:outline-none text-slate-700 font-mono"
                  />
                  <select
                    value={quickDeleteMealType}
                    onChange={(e) => setQuickDeleteMealType(e.target.value as MealType)}
                    className="bg-white border border-rose-200/60 rounded-xl px-3 py-2 text-xs focus:outline-none text-slate-700 font-bold uppercase"
                  >
                    <option value="breakfast">{lang === 'bn' ? 'সকালের নাস্তা (Breakfast)' : 'Breakfast'}</option>
                    <option value="lunch">{lang === 'bn' ? 'দুপুরের খাবার (Lunch)' : 'Lunch'}</option>
                    <option value="dinner">{lang === 'bn' ? 'রাতের খাবার (Dinner)' : 'Dinner'}</option>
                  </select>
                  <button
                    onClick={handleQuickDelete}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs px-4 py-2 rounded-xl transition shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? 'ডিলিট করুন' : 'Delete All'}</span>
                  </button>
                </div>
              </div>

              {/* Instant Search Results Panel */}
              {distSearchQuery.trim() !== '' && (
                <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 space-y-4 animate-in slide-in-from-top duration-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-indigo-950 flex items-center gap-1.5 uppercase tracking-wide">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                      {lang === 'bn' ? `অনুসন্ধান ফলাফল: (${mergedMatches.length} জন ম্যাচ)` : `Search Results: (${mergedMatches.length} matched)`}
                    </h4>
                    <button
                      onClick={() => setDistSearchQuery('')}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      {lang === 'bn' ? 'ফলাফল মুছুন' : 'Clear Results'}
                    </button>
                  </div>

                  {mergedMatches.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-2">
                      {lang === 'bn' ? 'এই আইডি বা নাম দিয়ে কোনো সদস্য পাওয়া যায়নি।' : 'No matching staff or member found.'}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {mergedMatches.map((member) => {
                        // Find if this specific member has any demand placed for today
                        const userDemandsToday = staffTodayDemandsMap.get(member.staffId.toLowerCase()) || [];

                        return (
                          <div
                            key={member.staffId}
                            className="bg-white border border-slate-100 rounded-2xl p-3.5 shadow-sm flex flex-col justify-between hover:shadow transition"
                          >
                            <div className="flex items-start gap-3">
                              {/* Photo */}
                              {member.userPhoto ? (
                                <img
                                  src={member.userPhoto}
                                  alt={member.name}
                                  className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-sm cursor-zoom-in"
                                  onClick={() => setViewingIdPhoto(member.userPhoto)}
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs border">
                                  {member.name.charAt(0)}
                                </div>
                              )}

                              <div className="min-w-0 flex-1">
                                <div className="font-extrabold text-slate-800 text-xs sm:text-sm truncate">
                                  {member.name}
                                </div>
                                <div className="text-[10px] font-mono text-slate-500 flex flex-wrap gap-x-2 mt-0.5">
                                  <span>ID: <strong className="text-slate-800">{member.staffId}</strong></span>
                                  <span>Sect: {member.department}</span>
                                </div>

                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  {/* Click Room Badge (Focus Room Details) */}
                                  <button
                                    onClick={() => {
                                      setSelectedRoomNum(member.roomNumber);
                                      // Clear search to focus room dashboard smoothly
                                      setDistSearchQuery('');
                                    }}
                                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-indigo-100/50 transition flex items-center gap-1 cursor-pointer"
                                    title={lang === 'bn' ? 'এই রুমের সব সদস্যের তথ্য দেখতে ক্লিক করুন' : 'Click to see all members of this room'}
                                  >
                                    🚪 {lang === 'bn' ? `রুম ${member.roomNumber} সদস্য তথ্য` : `Room ${member.roomNumber} Members`}
                                  </button>

                                  {/* Registered status */}
                                  <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold ${
                                    member.registeredUser 
                                      ? (member.registeredUser.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100')
                                      : 'bg-slate-50 text-slate-500 border border-slate-100'
                                  }`}>
                                    {member.registeredUser 
                                      ? (member.registeredUser.status === 'approved' ? (lang === 'bn' ? 'অনুমোদিত' : 'Approved') : (lang === 'bn' ? 'পেন্ডিং' : 'Pending'))
                                      : (lang === 'bn' ? 'নিবন্ধিত নয়' : 'Not Registered')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Today's Food Demands for this Search Match */}
                            <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                              <h5 className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                                {lang === 'bn' ? '🍱 আজকের মিল ডিমান্ড ও খাবার পরিবেশন:' : '🍱 Today\'s Meal Demand & Service:'}
                              </h5>

                              {userDemandsToday.length === 0 ? (
                                <p className="text-[10px] text-slate-400 italic">
                                  {lang === 'bn' ? 'আজ কোনো মিল ডিমান্ড বুক করা হয়নি।' : 'No meal demands booked for today.'}
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {userDemandsToday.map((dem) => (
                                    <div key={dem.id} className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between gap-2 text-xs">
                                      <div>
                                        <span className="font-extrabold uppercase text-indigo-600 text-[10px] mr-1.5">
                                          {t[dem.mealType]}
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-400">
                                          Status: <strong className="uppercase text-slate-700">{dem.status}</strong>
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-1.5">
                                        {dem.status === 'pending' && (
                                          <>
                                            <button
                                              onClick={() => onApproveDemand(dem.id)}
                                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg transition shadow-sm"
                                            >
                                              {t.approve}
                                            </button>
                                            <button
                                              onClick={() => onRejectDemand(dem.id)}
                                              className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 font-extrabold text-[10px] px-2.5 py-1 rounded-lg transition"
                                            >
                                              {t.reject}
                                            </button>
                                          </>
                                        )}

                                        {dem.status === 'approved' && (
                                          <button
                                            onClick={() => onMarkDemandServed(dem.id)}
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-lg transition shadow-sm flex items-center gap-1"
                                          >
                                            <CheckCircle className="w-3.5 h-3.5" />
                                            {t.markServed}
                                          </button>
                                        )}

                                        {dem.status === 'served' && (
                                          <span className="text-emerald-600 font-extrabold text-[10px] flex items-center gap-0.5">
                                            ✅ {lang === 'bn' ? 'পরিবেশিত' : 'Served'}
                                          </span>
                                        )}

                                        {dem.status === 'rejected' && (
                                          <span className="text-rose-600 font-extrabold text-[10px] flex items-center gap-0.5">
                                            ❌ {lang === 'bn' ? 'প্রত্যাখ্যাত' : 'Rejected'}
                                          </span>
                                        )}

                                        {onDeleteDemand && (
                                          <button
                                            onClick={() => {
                                              onDeleteDemand(dem.id);
                                              showToast(
                                                lang === 'bn' ? 'মিল ডিমান্ডটি সম্পূর্ণ মুছে ফেলা হয়েছে!' : 'Meal demand deleted successfully!',
                                                'info'
                                              );
                                            }}
                                            className="p-1 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 rounded-lg border border-rose-200 transition"
                                            title={lang === 'bn' ? 'ডিমান্ড সম্পূর্ণ মুছুন' : 'Delete Demand'}
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Room Map Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  {lang === 'bn' ? `🏢 রুম ড্যাশবোর্ড গ্রিড (${rooms.filter((r) => !r.hidden).length} টি সক্রিয়)` : `🏢 Room Dashboard Grid (${rooms.filter((r) => !r.hidden).length} Active)`}
                </h4>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-2.5">
                  {rooms.filter((r) => !r.hidden).map((roomObj) => {
                    const roomNum = roomObj.roomNumber;
                    const roomDems = getRoomDemandsList(roomNum);
                    const hasMatch =
                      roomFilterStatus === 'all' ||
                      (roomFilterStatus === 'pending' && roomDems.some((d) => d.status === 'pending' || d.status === 'approved')) ||
                      (roomFilterStatus === 'served' && roomDems.length > 0 && roomDems.every((d) => d.status === 'served'));

                    if (!hasMatch) return null;

                    const classes = getRoomVisualState(roomNum);
                    const isActiveRoom = selectedRoomNum === roomNum;

                    return (
                      <button
                        key={roomObj.id}
                        onClick={() => setSelectedRoomNum(roomNum)}
                        className={`h-12 border rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer hover:shadow-md ${classes} ${
                          isActiveRoom ? 'ring-2 ring-slate-900 ring-offset-2 scale-[1.05]' : ''
                        }`}
                      >
                        <span>Room</span>
                        <span className="font-mono text-xs">{roomNum}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Room Distribution Detail Panel */}
              {selectedRoomNum && (() => {
                // Fetch all residents assigned to this room from preloaded staff database
                const roomResidents = preloadedStaff.filter((p) => p.roomNumber === selectedRoomNum);
                const roomDems = getRoomDemandsList(selectedRoomNum);

                return (
                  <div className="border border-slate-100 bg-slate-50/70 rounded-3xl p-5 sm:p-6 space-y-6 animate-in slide-in-from-bottom duration-200" id="distribution-detail-panel">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                          🚪 {lang === 'bn' ? `রুম ${selectedRoomNum} সদস্য বিবরণ ও চাহিদা` : `Room ${selectedRoomNum} Roster & Demands`}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {lang === 'bn' ? `রুমের সব নিবন্ধিত সদস্য এবং আজকের অ্যাক্টিভ মিল ডিমান্ড।` : `All registered members assigned to Room ${selectedRoomNum} & active demands.`}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedRoomNum(null)}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl transition border text-xs font-bold cursor-pointer"
                      >
                        {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
                      </button>
                    </div>

                    {/* Part A: Room Residents Info */}
                    <div className="space-y-3">
                      <h5 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        👥 {lang === 'bn' ? 'রুমের সব সদস্য তথ্য (Resident Profiles):' : 'Room Resident Profiles:'}
                      </h5>

                      {roomResidents.length === 0 ? (
                        <div className="text-slate-400 text-xs italic py-2">
                          {lang === 'bn' ? 'এই রুমে কোনো সদস্য এসাইন করা নেই।' : 'No members assigned to this room yet in Preload Database.'}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {roomResidents.map((res) => {
                            // Find matching registered user
                            const regUser = users.find((u) => u.staffId.toLowerCase() === res.staffId.toLowerCase());
                            const isApproved = regUser && regUser.status === 'approved';
                            const nameMatches = regUser && res.name.trim().toLowerCase() === regUser.name.trim().toLowerCase();

                            return (
                              <div
                                key={res.staffId}
                                onClick={() => {
                                  if (regUser) {
                                    setSelectedMemberDetail(regUser);
                                  }
                                }}
                                className={`bg-white border rounded-2xl p-3 flex gap-3 items-center shadow-sm relative overflow-hidden transition hover:shadow-md ${
                                  regUser ? 'cursor-pointer' : ''
                                } ${
                                  isApproved 
                                    ? 'border-emerald-100 hover:border-emerald-200 bg-emerald-50/5' 
                                    : regUser 
                                    ? 'border-amber-100 hover:border-amber-200 bg-amber-50/5'
                                    : 'border-rose-100 hover:border-rose-200 bg-rose-50/10'
                                }`}
                                title={regUser ? (lang === 'bn' ? 'সদস্যের সম্পূর্ণ তথ্য ও আইডি দেখতে ক্লিক করুন' : 'Click to inspect complete profile & ID cards') : ''}
                              >
                                {/* Photo zoom click */}
                                <div className="relative group flex-shrink-0">
                                  {regUser?.userPhoto ? (
                                    <img
                                      src={regUser.userPhoto}
                                      alt={res.name}
                                      className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm group-hover:scale-105 transition"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-black text-sm border">
                                      {res.name.charAt(0)}
                                    </div>
                                  )}
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-black text-slate-800 truncate">
                                    {res.name}
                                  </div>
                                  <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5 flex-wrap">
                                    <span>ID: {res.staffId}</span>
                                    <button
                                      onClick={() => handleCopyIdOnly(res.staffId, res.name)}
                                      className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-black cursor-pointer transition flex items-center gap-0.5 border border-slate-200"
                                      title={lang === 'bn' ? 'আইডি কপি করুন' : 'Copy ID'}
                                    >
                                      <Copy className="w-2.5 h-2.5 text-slate-500" />
                                    </button>
                                    <button
                                      onClick={() => handleCopyWithAll(res.staffId, res.name, selectedRoomNum || res.roomNumber)}
                                      className="text-[9px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-black cursor-pointer transition flex items-center gap-0.5 border border-indigo-200"
                                      title={lang === 'bn' ? 'নাম সহ কপি করুন' : 'Copy with Name'}
                                    >
                                      <Clipboard className="w-2.5 h-2.5 text-indigo-500" /> {lang === 'bn' ? 'নাম সহ' : 'Name'}
                                    </button>
                                  </div>
                                  <div className="text-[9px] text-slate-400 truncate">{res.department}</div>

                                  {/* Badges & Contacts */}
                                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                                    {regUser ? (
                                      <>
                                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide ${
                                          isApproved ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                                        }`}>
                                          {isApproved ? (lang === 'bn' ? 'অনুমোদিত' : 'Approved') : (lang === 'bn' ? 'পেন্ডিং' : 'Pending')}
                                        </span>
                                        {!nameMatches && (
                                          <span className="text-[8px] bg-rose-50 text-rose-700 border border-rose-100 px-1.5 py-0.5 rounded font-bold uppercase">
                                            {lang === 'bn' ? 'নামের অমিল' : 'Name Mismatch'}
                                          </span>
                                        )}
                                        {/* Mobile and WhatsApp links */}
                                        {regUser.whatsapp && (
                                          <a
                                            href={`https://wa.me/${regUser.whatsapp}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[9px] text-emerald-600 hover:underline font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100"
                                            title="Direct WhatsApp"
                                          >
                                            WhatsApp
                                          </a>
                                        )}
                                      </>
                                    ) : (
                                      <span className="text-[8px] bg-rose-50 text-rose-700 border border-rose-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                                        {lang === 'bn' ? 'নিবন্ধিত নয়' : 'Not Registered'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Part B: Today's meal demands */}
                    <div className="space-y-3 pt-2 border-t border-slate-200">
                      <h5 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        🍱 {lang === 'bn' ? 'আজকের মিল ডিমান্ড (Meal Demands Placed Today):' : 'Meal Demands Placed Today:'}
                      </h5>

                      {roomDems.length === 0 ? (
                        <div className="bg-white border rounded-2xl p-5 text-slate-500 text-xs italic text-center">
                          {lang === 'bn' ? 'আজ এই রুম থেকে কোনো খাবারের আবেদন করা হয়নি।' : 'No food demands placed from this room today.'}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {roomDems.map((dem) => (
                            <div key={dem.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                                <div>
                                  <span className="font-extrabold uppercase text-xs text-indigo-600">
                                    {t[dem.mealType]}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono ml-2">
                                    Time: {new Date(dem.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-slate-500">
                                    Status: <strong className="text-slate-800 uppercase">{dem.status}</strong>
                                  </span>
                                </div>
                              </div>

                              {/* Members list in demand */}
                              <div className="space-y-2">
                                <div className="text-xs font-bold text-slate-600">
                                  {lang === 'bn' ? 'ভোগকারী সদস্যদের তালিকা ও ফেস মিল যাচাইকরণ:' : 'List of eating members & Face Verifications:'}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                  {dem.selectedStaffIds.map((sid) => {
                                    const sObj = preloadedStaff.find((p) => p.staffId === sid);
                                    const regUser = users.find((u) => u.staffId.toLowerCase() === sid.toLowerCase());
                                    const nameMatches = sObj && regUser && sObj.name.trim().toLowerCase() === regUser.name.trim().toLowerCase();
                                    const isApproved = regUser && regUser.status === 'approved';

                                    return (
                                      <div
                                        key={sid}
                                        onClick={() => {
                                          if (regUser) {
                                            setSelectedMemberDetail(regUser);
                                          }
                                        }}
                                        className={`bg-slate-50/50 border rounded-xl p-2.5 flex gap-2.5 items-center relative overflow-hidden transition hover:bg-slate-100/60 ${
                                          regUser ? 'cursor-pointer border-indigo-100' : 'border-slate-100'
                                        } ${
                                          isApproved ? 'border-emerald-100 bg-emerald-50/5' : ''
                                        }`}
                                        title={regUser ? (lang === 'bn' ? 'সদস্যের সম্পূর্ণ তথ্য ও আইডি দেখতে ক্লিক করুন' : 'Click to inspect complete profile & ID cards') : ''}
                                      >
                                        {regUser?.userPhoto ? (
                                          <img
                                            src={regUser.userPhoto}
                                            alt={sObj?.name || sid}
                                            className="w-10 h-10 rounded-full object-cover border border-slate-200"
                                            referrerPolicy="no-referrer"
                                          />
                                        ) : (
                                          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs border">
                                            {(sObj?.name || sid).charAt(0)}
                                          </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                          <div className="text-[11px] font-extrabold text-slate-800 truncate flex items-center gap-1">
                                            <span>{sObj?.name || regUser?.name || 'Unknown'}</span>
                                            {regUser && (
                                              <span className={`w-1.5 h-1.5 rounded-full ${isApproved ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                                            )}
                                          </div>
                                          <div className="text-[9px] font-mono text-slate-500 flex items-center justify-between">
                                            <span>ID: {sid}</span>
                                            {regUser && (
                                              <span className="text-[7px] text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded font-sans uppercase font-bold">
                                                {lang === 'bn' ? 'প্রোফাইল' : 'Profile'}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Action buttons */}
                              <div className="flex flex-wrap items-center gap-2 pt-2">
                                {dem.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => onApproveDemand(dem.id)}
                                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow"
                                    >
                                      {t.approve}
                                    </button>
                                    <button
                                      onClick={() => onRejectDemand(dem.id)}
                                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs px-4 py-2 rounded-xl transition"
                                    >
                                      {t.reject}
                                    </button>
                                  </>
                                )}

                                {dem.status === 'approved' && (
                                  <button
                                    onClick={() => onMarkDemandServed(dem.id)}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1.5"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    {t.markServed}
                                  </button>
                                )}

                                {dem.status === 'served' && (
                                  <div className="text-emerald-600 text-xs font-semibold flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4" /> {t.servedStatus} {dem.servedAt && `at ${new Date(dem.servedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                                  </div>
                                )}

                                {dem.status === 'rejected' && (
                                  <div className="text-rose-600 text-xs font-semibold flex items-center gap-1">
                                    <XCircle className="w-4 h-4" /> {t.rejected}
                                  </div>
                                )}

                                {onDeleteDemand && (
                                  <button
                                    onClick={() => {
                                      onDeleteDemand(dem.id);
                                      showToast(
                                        lang === 'bn' ? 'মিল ডিমান্ডটি সম্পূর্ণ মুছে ফেলা হয়েছে!' : 'Meal demand deleted successfully!',
                                        'info'
                                      );
                                    }}
                                    className="ml-auto bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                                    title={lang === 'bn' ? 'ডিমান্ড সম্পূর্ণ মুছে ফেলুন' : 'Delete Demand'}
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    <span>{lang === 'bn' ? 'মুছুন' : 'Delete'}</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        })()}

        {/* TAB 3: STAFF MANAGEMENT & DATABASE */}
        {activeTab === 'staff' && (
          <div className="space-y-6" id="admin-staff-view">
            {/* New Accounts Approval Pending Requests */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-800">
                {lang === 'bn' ? '🔑 নতুন রেজিস্ট্রেশন আবেদন' : '🔑 Account Approval Requests'}
              </h3>

              {users.filter((u) => u.status === 'pending').length === 0 ? (
                <div className="text-slate-400 text-xs italic py-2">
                  {lang === 'bn' ? 'কোনো নতুন আবেদন পেন্ডিং নেই।' : 'No pending user registration requests.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {users
                    .filter((u) => u.status === 'pending')
                    .map((user) => (
                      <div key={user.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm flex flex-col justify-between">
                        <div className="flex items-start gap-3">
                          {user.userPhoto ? (
                            <img
                              src={user.userPhoto}
                              alt={user.name}
                              className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm cursor-zoom-in flex-shrink-0"
                              onClick={() => setViewingIdPhoto(user.userPhoto)}
                              title={lang === 'bn' ? 'বড় করে দেখতে ক্লিক করুন' : 'Click to zoom face photo'}
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                              {user.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="font-extrabold text-slate-800 text-sm">{user.name}</div>
                            <div className="text-xs text-slate-500">
                              ID: <span className="font-mono text-slate-700 font-semibold">{user.staffId}</span> | Room: {user.roomNumber} | Sect: {user.department}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-600 bg-white border border-slate-200/50 p-2 rounded-xl">
                          <div>Mob: {user.mobile}</div>
                          <div>WA: {user.whatsapp}</div>
                        </div>

                        {/* ID Verification images */}
                        <div className="flex gap-2">
                          {user.userPhoto && (
                            <button
                              onClick={() => setViewingIdPhoto(user.userPhoto)}
                              className="flex-1 bg-white border rounded-xl p-2 text-[10px] font-bold text-indigo-600 hover:bg-slate-100 transition flex items-center justify-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> {lang === 'bn' ? 'নিজের ছবি' : 'Self Photo'}
                            </button>
                          )}
                          <button
                            onClick={() => setViewingIdPhoto(user.idCardFront)}
                            className="flex-1 bg-white border rounded-xl p-2 text-[10px] font-bold text-indigo-600 hover:bg-slate-100 transition flex items-center justify-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> Front Card
                          </button>
                          <button
                            onClick={() => setViewingIdPhoto(user.idCardBack)}
                            className="flex-1 bg-white border rounded-xl p-2 text-[10px] font-bold text-indigo-600 hover:bg-slate-100 transition flex items-center justify-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" /> Back Card
                          </button>
                        </div>

                        {/* Verification CTA */}
                        <div className="flex gap-2 pt-1 border-t border-slate-200/50">
                          <button
                            onClick={() => onApproveUser(user.id)}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2 rounded-xl transition"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => onRejectUser(user.id)}
                            className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs py-2 rounded-xl border border-rose-100 transition"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Active Accounts Board & Block controls */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-base font-bold text-slate-800">
                  {lang === 'bn' ? '👥 নিবন্ধিত কোয়ার্টার বাসিন্দা' : '👥 Registered Residents'}
                </h3>
                <div className="flex items-center gap-2">
                  {staffSearchQuery && (
                    <button
                      onClick={() => setStaffSearchQuery('')}
                      className="text-xs font-bold text-rose-500 hover:underline bg-rose-50 px-2 py-1 rounded"
                    >
                      Clear Filter
                    </button>
                  )}
                  <div className="relative w-full sm:w-60">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={staffSearchQuery}
                      onChange={(e) => setStaffSearchQuery(e.target.value)}
                      placeholder={lang === 'bn' ? 'স্টাফ আইডি বা রুম খুঁজুন...' : 'Search ID or Room...'}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* STUNNING BENTO CARD GRID (Replaced plain table) */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 pt-2">
                {users
                  .filter(
                    (u) =>
                      u.status !== 'pending' &&
                      (u.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                        u.staffId.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                        u.roomNumber.includes(staffSearchQuery) ||
                        u.department.toLowerCase().includes(staffSearchQuery.toLowerCase()))
                  )
                  .map((u) => {
                    // Find if they requested any meal demand today
                    const userDemandsToday = staffTodayDemandsMap.get(u.staffId.toLowerCase()) || [];

                    return (
                      <div 
                        key={u.id} 
                        className="bg-white border border-orange-100 hover:border-orange-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
                      >
                        {/* Member Header (With photo, name, department) */}
                        <div className="flex items-start gap-3.5">
                          {u.userPhoto ? (
                            <img
                              src={u.userPhoto}
                              alt={u.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-orange-100 cursor-zoom-in shadow-md flex-shrink-0"
                              onClick={() => setViewingIdPhoto(u.userPhoto)}
                              title={lang === 'bn' ? 'বড় করে দেখতে ক্লিক করুন' : 'Click to zoom face photo'}
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 font-black text-sm flex items-center justify-center flex-shrink-0 border-2 border-orange-200">
                              {u.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm leading-tight truncate">{u.name}</h4>
                            <div className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">{u.department}</div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              <span className="font-mono bg-orange-50 text-orange-700 px-2 py-0.5 rounded text-[10px] font-black">
                                ID: {u.staffId}
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
                                u.status === 'approved'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border border-rose-100'
                              }`}>
                                {u.status}
                              </span>
                            </div>

                            {/* Copy Tools for ID & Complete Record */}
                            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => handleCopyIdOnly(u.staffId, u.name)}
                                className="text-[9px] bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-2 py-1 rounded-xl font-black transition flex items-center gap-1 cursor-pointer shadow-sm"
                                title={lang === 'bn' ? 'স্টাফ আইডি কপি করুন' : 'Copy Staff ID'}
                              >
                                <Copy className="w-2.5 h-2.5 text-slate-500" /> ID
                              </button>
                              <button
                                onClick={() => handleCopyWithAll(u.staffId, u.name, u.roomNumber)}
                                className="text-[9px] bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 px-2 py-1 rounded-xl font-black transition flex items-center gap-1 cursor-pointer shadow-sm"
                                title={lang === 'bn' ? 'নাম সহ কপি করুন' : 'Copy with Name'}
                              >
                                <Clipboard className="w-2.5 h-2.5 text-orange-500" /> {lang === 'bn' ? 'নাম সহ কপি' : 'With Name'}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Middle info with interactive Room Selector dropdown */}
                        <div className="space-y-2 border-t border-b border-orange-50/50 py-3 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-bold">{lang === 'bn' ? 'রুম নম্বর:' : 'Room:'}</span>
                            <div className="flex items-center gap-1.5">
                              <select
                                value={u.roomNumber}
                                onChange={(e) => {
                                  if (onUpdateUserRoom) {
                                    onUpdateUserRoom(u.id, e.target.value);
                                    showToast(
                                      lang === 'bn'
                                        ? `${u.name}-এর রুম পরিবর্তন করে Room ${e.target.value} করা হয়েছে!`
                                        : `Changed ${u.name}'s room to Room ${e.target.value}!`,
                                      'success'
                                    );
                                  }
                                }}
                                className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-black px-2 py-1 rounded-xl transition cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-400"
                              >
                                {rooms.map((room) => (
                                  <option key={room.id} value={room.roomNumber}>
                                    Room {room.roomNumber} {room.hidden ? `(${lang === 'bn' ? 'লুকানো' : 'Hidden'})` : ''}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => setStaffSearchQuery(u.roomNumber)}
                                className="bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 border border-slate-200 p-1.5 rounded-xl transition cursor-pointer"
                                title={lang === 'bn' ? 'এই রুমের সবাইকে দেখতে ক্লিক করুন' : 'Click to filter by this room'}
                              >
                                <Search className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between font-mono text-[11px] text-slate-600">
                            <span>Phone:</span>
                            <a href={`tel:${u.mobile}`} className="hover:underline hover:text-orange-600 font-bold">{u.mobile}</a>
                          </div>
                          <div className="flex items-center justify-between font-mono text-[11px] text-slate-600">
                            <span>WhatsApp:</span>
                            <a href={`https://wa.me/${u.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-emerald-600 font-bold">{u.whatsapp}</a>
                          </div>
                        </div>

                        {/* TODAY'S SPECIFIC MEAL DEMAND DETAILS */}
                        <div className="space-y-2 bg-orange-50/15 border border-orange-100/40 rounded-xl p-3 text-xs">
                          <div className="font-black text-[10px] text-orange-900 uppercase tracking-widest flex items-center gap-1">
                            <span>🍱 Today's Demands:</span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-1.5 text-center">
                            {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((mType) => {
                              const mDem = userDemandsToday.find((d) => d.mealType === mType);
                              let dLabel = 'No';
                              let dStyle = 'bg-slate-50 text-slate-400 border-slate-100';

                              if (mDem) {
                                if (mDem.status === 'pending') {
                                  dLabel = '⏳ Pend';
                                  dStyle = 'bg-amber-50 text-amber-700 border-amber-100 font-bold';
                                } else if (mDem.status === 'approved') {
                                  dLabel = '👍 Appr';
                                  dStyle = 'bg-indigo-50 text-indigo-700 border-indigo-100 font-bold';
                                } else if (mDem.status === 'rejected') {
                                  dLabel = '❌ Rej';
                                  dStyle = 'bg-rose-50 text-rose-700 border-rose-100 font-bold';
                                } else if (mDem.status === 'served') {
                                  dLabel = '✅ Ate';
                                  dStyle = 'bg-emerald-50 text-emerald-800 border-emerald-100 font-bold';
                                }
                              }

                              return (
                                <div key={mType} className={`p-1.5 border rounded-lg flex flex-col items-center justify-center text-[10px] ${dStyle}`}>
                                  <span className="font-semibold capitalize text-[9px] opacity-75">{t[mType]}</span>
                                  <span className="mt-0.5 truncate max-w-full" title={mDem?.servedAt ? `Served: ${new Date(mDem.servedAt).toLocaleTimeString()}` : ''}>
                                    {dLabel}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Action buttons (Block/Unblock) */}
                        <div className="pt-2 border-t border-orange-50/30 flex justify-end gap-2">
                          {onDeleteUser && (
                            <button
                              onClick={() => {
                                if (window.confirm(lang === 'bn' 
                                  ? `আপনি কি নিশ্চিতভাবে ${u.name}-এর অ্যাকাউন্টটি সম্পূর্ণ ডিলিট করতে চান?` 
                                  : `Are you sure you want to permanently delete the account of ${u.name}?`)) {
                                  onDeleteUser(u.id);
                                  showToast(
                                    lang === 'bn' ? 'অ্যাকাউন্টটি ডিলিট করা হয়েছে!' : 'Account deleted successfully!',
                                    'info'
                                  );
                                }
                              }}
                              className="bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1 shadow-sm"
                              title={lang === 'bn' ? 'অ্যাকাউন্ট ডিলিট করুন' : 'Delete Account'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{lang === 'bn' ? 'মুছুন' : 'Delete'}</span>
                            </button>
                          )}
                          {u.status === 'approved' ? (
                            <button
                              onClick={() => onBlockUser(u.id)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer"
                            >
                              Block User
                            </button>
                          ) : (
                            <button
                              onClick={() => onUnblockUser(u.id)}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer"
                            >
                              Unblock
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
              {users.filter(
                (u) =>
                  u.status !== 'pending' &&
                  (u.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                    u.staffId.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                    u.roomNumber.includes(staffSearchQuery) ||
                    u.department.toLowerCase().includes(staffSearchQuery.toLowerCase()))
              ).length === 0 && (
                <div className="text-slate-400 text-xs italic py-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  {lang === 'bn' ? 'কোনো বাসিন্দা খুঁজে পাওয়া যায়নি।' : 'No matching residents found.'}
                </div>
              )}
            </div>

            {/* PRELOADED STAFF ID DATA MANAGER */}
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-800">{t.staffIdPreload}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{lang === 'bn' ? 'ভ্যালিড স্টাফ আইডি ডাটাবেজ পরিচালনা করুন যাতে ইউজাররা রেজিস্ট্রেশন করতে পারে।' : 'Pre-validate valid Staff IDs allowed to complete registration.'}</p>
              </div>

              {preloadError && (
                <div className="bg-rose-50 text-rose-600 text-xs p-3 rounded-xl border border-rose-100">
                  {preloadError}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleAddPreloadSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  required
                  value={preloadStaffId}
                  onChange={(e) => setPreloadStaffId(e.target.value)}
                  placeholder="Staff ID (e.g. ST-120)"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-slate-400"
                />
                <input
                  type="text"
                  required
                  value={preloadName}
                  onChange={(e) => setPreloadName(e.target.value)}
                  placeholder="Full Name"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-slate-400"
                />
                <select
                  required
                  value={preloadRoom}
                  onChange={(e) => setPreloadRoom(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-slate-400"
                >
                  <option value="">{lang === 'bn' ? 'রুম নম্বর নির্বাচন করুন' : 'Select Room'}</option>
                  {rooms.filter((r) => !r.hidden).map((r) => (
                    <option key={r.id} value={r.roomNumber}>
                      Room {r.roomNumber}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl py-2.5 transition flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Add Record
                </button>
              </form>

              {/* Database Table view */}
              <div className="max-h-[220px] overflow-y-auto">
                <table className="w-full text-xs text-left text-slate-500">
                  <thead className="bg-slate-50 text-slate-700 font-bold sticky top-0">
                    <tr>
                      <th className="p-2.5">Staff ID</th>
                      <th className="p-2.5">Full Name</th>
                      <th className="p-2.5">Room</th>
                      <th className="p-2.5 text-center">{lang === 'bn' ? 'কপি টুলস' : 'Copy Tools'}</th>
                      <th className="p-2.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {preloadedStaff.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-mono font-bold text-slate-900">{s.staffId}</td>
                        <td className="p-2.5">{s.name}</td>
                        <td className="p-2.5">Room {s.roomNumber}</td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleCopyIdOnly(s.staffId, s.name)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                              title={lang === 'bn' ? 'আইডি কপি' : 'Copy ID'}
                            >
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                            <button
                              onClick={() => handleCopyWithAll(s.staffId, s.name, s.roomNumber)}
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition cursor-pointer"
                              title={lang === 'bn' ? 'নাম সহ কপি' : 'Copy Name, Room & ID'}
                            >
                              <Clipboard className="w-3.5 h-3.5 text-indigo-600" />
                            </button>
                          </div>
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => onDeletePreloadStaff(s.id)}
                            className="text-rose-500 hover:text-rose-700 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TIME CONTROL SETTINGS */}
        {activeTab === 'time' && (
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6" id="admin-time-view">
            <div>
              <h3 className="text-base font-bold text-slate-800">{t.timeControl}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{lang === 'bn' ? 'প্রতিটি মিলের জন্য ডিমান্ড সাবমিট করার সময়সীমা পরিবর্তন করুন।' : 'Modify open and close hours for meal demands.'}</p>
            </div>

            <div className="space-y-4 max-w-xl">
              {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((mType) => {
                const setting = timeSettings.find((s) => s.mealType === mType) || { startTime: '06:00', endTime: '08:00' };
                return (
                  <div key={mType} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 items-center gap-4">
                    <span className="font-extrabold uppercase text-xs text-indigo-700">{t[mType]}</span>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Start:</span>
                      <input
                        type="time"
                        defaultValue={setting.startTime}
                        onChange={(e) => onAddTimeSetting(mType, e.target.value, setting.endTime)}
                        className="bg-white border rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">End:</span>
                      <input
                        type="time"
                        defaultValue={setting.endTime}
                        onChange={(e) => onAddTimeSetting(mType, setting.startTime, e.target.value)}
                        className="bg-white border rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: NOTICE BOARD CREATION */}
        {activeTab === 'notice' && (
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6" id="admin-notice-view">
            <div>
              <h3 className="text-base font-bold text-slate-800">{t.noticeBoard}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{lang === 'bn' ? 'কোয়ার্টার স্টাফদের উদ্দেশ্যে নতুন নোটিশ বোর্ড প্রকাশ করুন।' : 'Write new announcements for staff dashboards.'}</p>
            </div>

            <form onSubmit={handleAddNoticeSubmit} className="space-y-4 max-w-2xl bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.noticeTitle}</label>
                <input
                  type="text"
                  required
                  value={noticeTitleInput}
                  onChange={(e) => setNoticeTitleInput(e.target.value)}
                  placeholder="শিরোনাম..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.noticeContent}</label>
                <textarea
                  required
                  rows={4}
                  value={noticeContentInput}
                  onChange={(e) => setNoticeContentInput(e.target.value)}
                  placeholder="বিস্তারিত বিবরণ..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow"
              >
                <Megaphone className="w-4 h-4 text-indigo-400" />
                {t.addNotice}
              </button>
            </form>

            <div className="space-y-3 max-w-2xl">
              <h4 className="text-xs font-extrabold uppercase text-slate-500">Active Notices ({notices.length})</h4>
              {notices.map((n) => (
                <div key={n.id} className="border border-slate-100 rounded-2xl p-4 flex justify-between items-start gap-4">
                  <div>
                    <h5 className="font-bold text-sm text-slate-800">{n.title}</h5>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.content}</p>
                    <div className="text-[9px] text-slate-400 mt-2 font-mono">Date: {n.date}</div>
                  </div>
                  <button
                    onClick={() => onDeleteNotice(n.id)}
                    className="text-rose-500 hover:text-rose-700 transition flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: CHAT SUPPORT DESK */}
        {activeTab === 'chats' && (
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6" id="admin-chat-view">
            <div>
              <h3 className="text-base font-bold text-slate-800">{lang === 'bn' ? '💬 লাইভ হেল্প ডেস্ক সাপোর্ট' : '💬 Admin Live Help Desk'}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{lang === 'bn' ? 'লাইভ চ্যাটের মাধ্যমে কোয়ার্টার বাসিন্দাদের প্রশ্নের উত্তর দিন।' : 'Resolve issues, handle room complaints, and chat with staff.'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Inbox Users list */}
              <div className="md:col-span-4 border border-slate-100 rounded-2xl p-3 bg-slate-50 h-[450px] overflow-y-auto space-y-2">
                <div className="text-xs font-bold text-slate-600 mb-2 px-2">Active Chats</div>
                {getUniqueChatUsers().map((user) => {
                  const userMessages = userChatsMap.get(user.id.toLowerCase()) || [];
                  const lastMessage = userMessages[userMessages.length - 1];
                  const isSelected = selectedChatUserId === user.id;

                  return (
                    <button
                      key={user.id}
                      onClick={() => setSelectedChatUserId(user.id)}
                      className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-slate-900 border-slate-900 text-white shadow'
                          : 'bg-white border-slate-200/60 text-slate-700 hover:bg-slate-100/55'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold leading-none">{user.name}</div>
                        <div className={`text-[9px] font-mono mt-1 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                          Room {user.roomNumber} | {user.staffId}
                        </div>
                        {lastMessage && (
                          <div className={`text-[10px] mt-1 line-clamp-1 truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                            {lastMessage.text}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Chat View */}
              <div className="md:col-span-8">
                {activeChatUser ? (
                  <ChatPanel
                    messages={chats}
                    currentUserId="admin"
                    activeChatUserId={activeChatUser.id}
                    activeChatUserName={activeChatUser.name}
                    onSendMessage={onSendChatMessage}
                    lang={lang}
                  />
                ) : (
                  <div className="h-[450px] border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-slate-50">
                    <p className="text-xs text-slate-400">Select a user conversation from the left inbox pane to start chat support.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: REPORTS & EXPORTS */}
        {activeTab === 'reports' && (
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6" id="admin-reports-view">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">{t.reports}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{lang === 'bn' ? 'আজকের খাবার চাহিদার রিপোর্ট এবং ডাউনলোড অপশন।' : 'Export statistics and print meal lists.'}</p>
              </div>

              {/* Export Trigger */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow transition flex items-center gap-1.5 active:scale-95"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  {t.exportExcel}
                </button>
                <button
                  onClick={handlePrint}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 active:scale-95"
                >
                  <Printer className="w-4 h-4 text-indigo-600" />
                  {t.exportPdf}
                </button>
              </div>
            </div>

            {/* NEW BATCH FINDER, COPY & DELETE SYSTEM */}
            <div className="bg-slate-900 border border-slate-850 text-white rounded-3xl p-6 shadow-xl space-y-6" id="custom-meal-batch-panel">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-black tracking-widest text-indigo-400 uppercase bg-indigo-950/50 border border-indigo-900/50 px-2.5 py-1 rounded-xl">
                    {lang === 'bn' ? 'স্মার্ট মিল ব্যাচ কন্ট্রোল' : 'Smart Meal Batch Control'}
                  </span>
                  <h3 className="text-base font-black text-white flex items-center gap-2 mt-1">
                    <ClipboardList className="w-5 h-5 text-indigo-400" />
                    {lang === 'bn' ? 'তারিখ ও মিল অনুযায়ী বুকিং তালিকা, এক ক্লিকে কপি ও ডিলিট' : 'Date & Meal Booking Finder, Bulk Copy & Delete'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {lang === 'bn' ? 'যেকোনো তারিখ ও মিল নির্বাচন করে অনুমোদিত ও পরিবেশিত তালিকা সরাসরি কপি করুন অথবা মুছে ফেলুন।' : 'Select any date & meal type to copy the finalized list or clear records.'}
                  </p>
                </div>

                {/* Clock indicator for the user */}
                <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300 font-mono text-[11px] font-bold">
                  <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
                  <span>
                    {lang === 'bn' ? `রিপোর্ট সময়: ` : `Report Time: `}
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Filtering controls */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                {/* Date Selection */}
                <div className="md:col-span-4 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    {lang === 'bn' ? '📅 তারিখ সিলেক্ট করুন' : '📅 Select Target Date'}
                  </label>
                  <input
                    type="date"
                    value={selectedReportDate}
                    onChange={(e) => {
                      if (e.target.value) setSelectedReportDate(e.target.value);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-bold transition"
                  />
                </div>

                {/* Meal Selection Tabs */}
                <div className="md:col-span-8 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    {lang === 'bn' ? '🥣 মিল নির্বাচন করুন' : '🥣 Choose Meal Type'}
                  </label>
                  <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((meal) => {
                      const isActive = selectedReportMealType === meal;
                      const mealLabels: Record<string, { bn: string; en: string; icon: string }> = {
                        breakfast: { bn: '🍳 সকাল', en: '🍳 Breakfast', icon: '🍳' },
                        lunch: { bn: '🍛 দুপুর', en: '🍛 Lunch', icon: '🍛' },
                        dinner: { bn: '🍗 রাত', en: '🍗 Dinner', icon: '🍗' }
                      };
                      return (
                        <button
                          key={meal}
                          type="button"
                          onClick={() => setSelectedReportMealType(meal)}
                          className={`py-2 rounded-lg text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10 scale-[1.02]'
                              : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                          }`}
                        >
                          {lang === 'bn' ? mealLabels[meal].bn : mealLabels[meal].en}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Dynamic Stats for Selected Batch */}
              {(() => {
                const list = getSelectedReportStaffList();
                const totalCount = list.length;
                const approvedCount = list.filter(item => item.status === 'approved').length;
                const servedCount = list.filter(item => item.status === 'served').length;
                const pendingCount = list.filter(item => item.status === 'pending').length;

                return (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-center">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{lang === 'bn' ? 'মোট ডিমান্ড প্লেট' : 'Total Demands'}</div>
                        <div className="text-xl font-black text-white mt-1 font-mono">{totalCount}</div>
                      </div>
                      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-center border-l-2 border-l-emerald-500">
                        <div className="text-[10px] text-emerald-400 font-bold uppercase">{lang === 'bn' ? 'অনুমোদিত (Approved)' : 'Approved'}</div>
                        <div className="text-xl font-black text-emerald-400 mt-1 font-mono">{approvedCount}</div>
                      </div>
                      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-center border-l-2 border-l-sky-500">
                        <div className="text-[10px] text-sky-400 font-bold uppercase">{lang === 'bn' ? 'বিতরণকৃত (Served)' : 'Served'}</div>
                        <div className="text-xl font-black text-sky-400 mt-1 font-mono">{servedCount}</div>
                      </div>
                      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 text-center border-l-2 border-l-amber-500">
                        <div className="text-[10px] text-amber-400 font-bold uppercase">{lang === 'bn' ? 'অপেক্ষমাণ (Pending)' : 'Pending'}</div>
                        <div className="text-xl font-black text-amber-400 mt-1 font-mono">{pendingCount}</div>
                      </div>
                    </div>

                    {/* Action Triggers for the batch */}
                    {totalCount > 0 ? (
                      <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
                        <div className="text-xs font-bold text-slate-300 flex items-center gap-1">
                          <span>⚙️</span> {lang === 'bn' ? 'ব্যাচ অ্যাকশন অপশনসমূহ:' : 'Batch Action Options:'}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {/* Format Copy Button */}
                          <button
                            type="button"
                            onClick={() => handleCopyDateMealReportCombined(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow active:scale-95 cursor-pointer"
                          >
                            <Copy className="w-4 h-4 text-indigo-200" />
                            {lang === 'bn' ? '১-ক্লিকে তালিকা কপি করুন' : '1-Click Copy List'}
                          </button>

                          {/* Sheets Copy Button */}
                          <button
                            type="button"
                            onClick={() => handleCopyDateMealReportTabular(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow active:scale-95 cursor-pointer"
                          >
                            <Clipboard className="w-4 h-4 text-emerald-200" />
                            {lang === 'bn' ? 'এক্সেল / গুগল শিট কপি' : 'Copy for Sheets/Excel'}
                          </button>

                          {/* Delete Batch Button */}
                          <button
                            type="button"
                            onClick={handleBatchDeleteReport}
                            className="bg-rose-950/80 hover:bg-rose-900 text-rose-300 font-extrabold text-xs px-4 py-3 rounded-xl transition border border-rose-900/60 flex items-center justify-center gap-1.5 shadow active:scale-95 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 text-rose-400" />
                            {lang === 'bn' ? 'সমস্ত ডাটা ডিলিট করুন' : 'Delete All Batch Data'}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 italic text-center pt-1">
                          {lang === 'bn' 
                            ? '💡 কপি অপশনটি শুধুমাত্র "অনুমোদিত" ও "পরিবেশিত" সদস্যদের নাম ও আইডি সিলেক্ট করে ক্লিপবোর্ডে কপি করবে।' 
                            : '💡 Copy action filters and copies only Approved & Served member details.'}
                        </p>
                      </div>
                    ) : null}

                    {/* Members List Table */}
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                      <div className="p-3 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
                        <span className="text-xs font-black text-slate-300">
                          {lang === 'bn' ? `সদস্যদের তালিকা (${totalCount} জন)` : `Staff Members List (${totalCount})`}
                        </span>
                        {totalCount > 0 && (
                          <span className="text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-lg font-mono">
                            Date: {selectedReportDate}
                          </span>
                        )}
                      </div>

                      {list.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 space-y-1">
                          <p className="text-xs font-bold">{lang === 'bn' ? 'কোনো বুকিং রেকর্ড পাওয়া যায়নি' : 'No records found'}</p>
                          <p className="text-[10px] text-slate-600">
                            {lang === 'bn' 
                              ? 'উক্ত তারিখে এই মিলটির জন্য কোনো বাসিন্দা ডিমান্ড সাবমিট করেনি।' 
                              : 'No resident submitted meal demands for this date and time.'}
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                          <table className="w-full text-xs text-left text-slate-300">
                            <thead className="bg-slate-900/50 text-slate-400 font-bold border-b border-slate-800">
                              <tr>
                                <th className="p-2.5 text-center w-12">{lang === 'bn' ? 'ক্রমিক' : 'S.No'}</th>
                                <th className="p-2.5">{lang === 'bn' ? 'নাম' : 'Name'}</th>
                                <th className="p-2.5">{lang === 'bn' ? 'স্টাফ আইডি' : 'Staff ID'}</th>
                                <th className="p-2.5">{lang === 'bn' ? 'রুম নং' : 'Room'}</th>
                                <th className="p-2.5 text-center">{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/40">
                              {list.map((item, idx) => (
                                <tr key={item.id} className="hover:bg-slate-900/30 transition">
                                  <td className="p-2.5 text-center font-mono font-bold text-slate-500">{idx + 1}</td>
                                  <td className="p-2.5 font-bold text-white">{item.name}</td>
                                  <td className="p-2.5 font-mono text-indigo-400 font-bold">{item.staffId}</td>
                                  <td className="p-2.5 text-slate-400">Room {item.roomNumber}</td>
                                  <td className="p-2.5 text-center">
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg inline-block uppercase ${
                                      item.status === 'served'
                                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                        : item.status === 'approved'
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : item.status === 'pending'
                                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    }`}>
                                      {lang === 'bn' 
                                        ? (item.status === 'served' ? 'পরিবেশিত' : item.status === 'approved' ? 'অনুমোদিত' : item.status === 'pending' ? 'অপেক্ষমাণ' : 'বাতিল')
                                        : item.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* LIVE SPREADSHEET FOR ALL MEAL DEMANDS */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in" id="live-meal-demands-sheet">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-black tracking-widest text-indigo-600 uppercase bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-xl">
                    {lang === 'bn' ? 'লাইভ ডিমান্ড স্প্রেডশিট' : 'Live Demand Spreadsheet'}
                  </span>
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-2 mt-1">
                    <span>📋</span>
                    {lang === 'bn' ? 'সকল রুমের লাইভ ডিমান্ড শিট (একসেপ্ট ও রিজেক্ট প্যানেল)' : 'Live Demands Sheet & Direct Action Panel'}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {lang === 'bn' 
                      ? 'যেকোনো রুম থেকে ডিমান্ড সাবমিট করার সাথে সাথে এখানে রিয়েল-টাইমে আপডেট হবে এবং সরাসরি একসেপ্ট/রিজেক্ট করা যাবে।' 
                      : 'Real-time sync of all submitted meal demands. Instantly approve, reject or serve from this sheet.'}
                  </p>
                </div>

                {/* Direct totals indicator & Delete All Rejected Button */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 bg-emerald-50/50 border border-emerald-100 px-3.5 py-2 rounded-2xl">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-700">
                      {lang === 'bn' ? `মোট রেকর্ড: ${demands.length} টি` : `Total Demands: ${demands.length}`}
                    </span>
                  </div>

                  {demands.some(d => d.status === 'rejected') && onDeleteAllRejectedDemands && (
                    <button
                      onClick={() => {
                        const rejectedCount = demands.filter(d => d.status === 'rejected').length;
                        if (window.confirm(lang === 'bn' 
                          ? `আপনি কি নিশ্চিতভাবে সকল ${rejectedCount} টি বাতিলকৃত (Rejected) ডিমান্ড স্থায়ীভাবে ডিলিট করতে চান?` 
                          : `Are you sure you want to permanently delete all ${rejectedCount} rejected meal demands?`)) {
                          onDeleteAllRejectedDemands();
                          showToast(
                            lang === 'bn' 
                              ? 'সকল বাতিলকৃত ডিমান্ড ডিলিট করা হয়েছে!' 
                              : 'All rejected demands deleted successfully!',
                            'success'
                          );
                        }
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-2xl transition shadow-sm hover:shadow active:scale-95 flex items-center gap-1.5 cursor-pointer"
                      title={lang === 'bn' ? 'সকল বাতিলকৃত ডিমান্ড মুছুন' : 'Delete All Rejected Demands'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{lang === 'bn' ? 'সকল বাতিলকৃত ডিমান্ড মুছুন' : 'Delete All Rejected'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Filtering Controls Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {/* 1. Text Search */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-slate-600">
                    🔍 {lang === 'bn' ? 'খুঁজুন (নাম / আইডি / রুম)' : 'Search (Name / ID / Room)'}
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={liveSheetSearch}
                      onChange={(e) => setLiveSheetSearch(e.target.value)}
                      placeholder={lang === 'bn' ? 'রুম, নাম বা আইডি লিখুন...' : 'Search Room, Name, ID...'}
                      className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/35 font-bold text-slate-700 placeholder-slate-400 transition"
                    />
                  </div>
                </div>

                {/* 2. Date Filter with Quick Action */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-[11px] font-black text-slate-600">
                      📅 {lang === 'bn' ? 'তারিখ ফিল্টার' : 'Date Filter'}
                    </label>
                    {liveSheetDate && (
                      <button
                        onClick={() => setLiveSheetDate('')}
                        className="text-[9px] font-bold text-indigo-600 hover:underline cursor-pointer"
                      >
                        {lang === 'bn' ? 'সব তারিখ দেখুন' : 'Show All Dates'}
                      </button>
                    )}
                  </div>
                  <input
                    type="date"
                    value={liveSheetDate}
                    onChange={(e) => setLiveSheetDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/35 font-bold text-slate-700 transition"
                  />
                </div>

                {/* 3. Meal Type Filter */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-slate-600">
                    🥣 {lang === 'bn' ? 'খাবারের সময়' : 'Meal Time'}
                  </label>
                  <select
                    value={liveSheetMealType}
                    onChange={(e) => setLiveSheetMealType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/35 font-bold text-slate-700 transition"
                  >
                    <option value="all">{lang === 'bn' ? 'সব খাবার (All Meals)' : 'All Meals'}</option>
                    <option value="breakfast">{lang === 'bn' ? '🍳 সকাল (Breakfast)' : '🍳 Breakfast'}</option>
                    <option value="lunch">{lang === 'bn' ? '🍛 দুপুর (Lunch)' : '🍛 Lunch'}</option>
                    <option value="dinner">{lang === 'bn' ? '🍗 রাত (Dinner)' : '🍗 Dinner'}</option>
                  </select>
                </div>

                {/* 4. Status Filter */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-slate-600">
                    ⚡ {lang === 'bn' ? 'অবস্থা (Status)' : 'Status Filter'}
                  </label>
                  <select
                    value={liveSheetStatusFilter}
                    onChange={(e) => setLiveSheetStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/35 font-bold text-slate-700 transition"
                  >
                    <option value="all">{lang === 'bn' ? 'সব স্ট্যাটাস' : 'All Statuses'}</option>
                    <option value="pending">{lang === 'bn' ? '🕒 অপেক্ষমাণ (Pending)' : '🕒 Pending'}</option>
                    <option value="approved">{lang === 'bn' ? '✅ অনুমোদিত (Approved)' : '✅ Approved'}</option>
                    <option value="served">{lang === 'bn' ? '🍛 পরিবেশিত (Served)' : '🍛 Served'}</option>
                    <option value="rejected">{lang === 'bn' ? '❌ বাতিল (Rejected)' : '❌ Rejected'}</option>
                  </select>
                </div>
              </div>

              {/* SHEET TABLE */}
              {(() => {
                const getFilteredLiveSheetDemands = () => {
                  return demands.filter((d) => {
                    const query = liveSheetSearch.toLowerCase().trim();
                    const matchesSearch = !query || 
                      d.submittedByName.toLowerCase().includes(query) ||
                      d.submittedBy.toLowerCase().includes(query) ||
                      d.roomNumber.toLowerCase().includes(query) ||
                      d.selectedStaffIds.some(sid => sid.toLowerCase().includes(query));

                    const matchesDate = !liveSheetDate || d.date === liveSheetDate;
                    const matchesMeal = liveSheetMealType === 'all' || d.mealType === liveSheetMealType;
                    const matchesStatus = liveSheetStatusFilter === 'all' || d.status === liveSheetStatusFilter;

                    return matchesSearch && matchesDate && matchesMeal && matchesStatus;
                  }).sort((a, b) => {
                    if (a.date !== b.date) {
                      return b.date.localeCompare(a.date);
                    }
                    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                  });
                };

                const filtered = getFilteredLiveSheetDemands();

                return (
                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl overflow-hidden shadow-inner">
                    <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap justify-between items-center gap-2">
                      <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                        <span>📊</span> 
                        {lang === 'bn' 
                          ? `ফিল্টারকৃত এন্ট্রি: ${filtered.length} টি` 
                          : `Filtered Entries: ${filtered.length}`}
                      </span>
                      {liveSheetDate && (
                        <span className="text-[10px] text-slate-500 bg-slate-100 border px-2 py-0.5 rounded-lg font-bold">
                          Date: {liveSheetDate}
                        </span>
                      )}
                    </div>

                    {filtered.length === 0 ? (
                      <div className="p-12 text-center space-y-2">
                        <div className="text-3xl">📭</div>
                        <p className="text-xs font-black text-slate-600">
                          {lang === 'bn' ? 'কোনো ডিমান্ড রেকর্ড পাওয়া যায়নি!' : 'No demand records found!'}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {lang === 'bn' 
                            ? 'অনুগ্রহ করে ফিল্টার পরিবর্তন করে পুনরায় চেষ্টা করুন।' 
                            : 'Please change your filter options or select all dates.'}
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                        <table className="w-full text-xs text-left text-slate-600 border-collapse">
                          <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-200 sticky top-0 z-10">
                            <tr>
                              <th className="p-3 text-center w-12 border-r border-slate-200">{lang === 'bn' ? 'ক্রমিক' : 'S.No'}</th>
                              <th className="p-3 border-r border-slate-200">{lang === 'bn' ? 'তারিখ ও সময়' : 'Date & Time'}</th>
                              <th className="p-3 border-r border-slate-200">{lang === 'bn' ? 'রুম নং' : 'Room'}</th>
                              <th className="p-3 border-r border-slate-200">{lang === 'bn' ? 'ডিমান্ডদাতা (স্টাফ আইডি)' : 'Submitted By (Staff ID)'}</th>
                              <th className="p-3 border-r border-slate-200">{lang === 'bn' ? 'খাবার সময়' : 'Meal Time'}</th>
                              <th className="p-3 border-r border-slate-200">{lang === 'bn' ? 'প্লেট ডিমান্ড ও আইডি সমূহ' : 'Plates Demanded & IDs'}</th>
                              <th className="p-3 text-center border-r border-slate-200">{lang === 'bn' ? 'অবস্থা' : 'Status'}</th>
                              <th className="p-3 text-center">{lang === 'bn' ? 'অ্যাকশন শিট (অনুমোদন/বাতিল)' : 'Direct Action Sheet'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            {filtered.map((item, idx) => {
                              const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                              return (
                                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                                  <td className="p-3 text-center font-mono font-bold text-slate-400 border-r border-slate-100">{idx + 1}</td>
                                  <td className="p-3 border-r border-slate-100 whitespace-nowrap">
                                    <div className="font-bold text-slate-800">{item.date}</div>
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">🕒 {timeStr}</div>
                                  </td>
                                  <td className="p-3 border-r border-slate-100">
                                    <span className="bg-slate-100 border border-slate-200/70 text-slate-800 font-black px-2.5 py-1 rounded-xl text-xs inline-block shadow-sm">
                                      🚪 {item.roomNumber}
                                    </span>
                                  </td>
                                  <td className="p-3 border-r border-slate-100">
                                    <div className="font-bold text-slate-800">{item.submittedByName}</div>
                                    <div className="text-[10px] text-indigo-600 font-mono font-bold mt-0.5">ID: {item.submittedBy}</div>
                                  </td>
                                  <td className="p-3 border-r border-slate-100">
                                    <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg inline-block ${
                                      item.mealType === 'breakfast' 
                                        ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                                        : item.mealType === 'lunch'
                                        ? 'bg-sky-50 text-sky-700 border border-sky-100'
                                        : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                    }`}>
                                      {item.mealType === 'breakfast' ? (lang === 'bn' ? '🍳 সকাল' : '🍳 Breakfast') :
                                       item.mealType === 'lunch' ? (lang === 'bn' ? '🍛 দুপুর' : '🍛 Lunch') :
                                       (lang === 'bn' ? '🍗 রাত' : '🍗 Dinner')}
                                    </span>
                                  </td>
                                  <td className="p-3 border-r border-slate-100 max-w-xs">
                                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                      <span>🍽️ {item.selectedStaffIds.length} {lang === 'bn' ? 'প্লেট' : 'Plates'}</span>
                                    </div>
                                    <div className="text-[9px] text-slate-500 font-mono mt-1 break-all bg-slate-50 p-1.5 rounded-lg border border-slate-100 line-clamp-2" title={item.selectedStaffIds.join(', ')}>
                                      IDs: {item.selectedStaffIds.join(', ')}
                                    </div>
                                  </td>
                                  <td className="p-3 border-r border-slate-100 text-center">
                                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg inline-block uppercase tracking-wide border ${
                                      item.status === 'served'
                                        ? 'bg-sky-50 text-sky-700 border border-sky-100'
                                        : item.status === 'approved'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                        : item.status === 'pending'
                                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                        : 'bg-rose-50 text-rose-700 border border-rose-100'
                                    }`}>
                                      {lang === 'bn' ? (
                                        item.status === 'served' ? 'পরিবেশিত' : 
                                        item.status === 'approved' ? 'অনুমোদিত' : 
                                        item.status === 'pending' ? 'অপেক্ষমাণ' : 'বাতিল'
                                      ) : item.status}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                      {/* Approved Trigger */}
                                      {item.status !== 'approved' && item.status !== 'served' && (
                                        <button
                                          onClick={() => {
                                            onApproveDemand(item.id);
                                            showToast(
                                              lang === 'bn' 
                                                ? `রুম ${item.roomNumber}-এর খাবার ডিমান্ড অনুমোদিত হয়েছে!`
                                                : `Approved meal demand for Room ${item.roomNumber}!`,
                                              'success'
                                            );
                                          }}
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] px-2.5 py-1.5 rounded-lg transition shadow-sm hover:shadow active:scale-95 flex items-center gap-0.5 cursor-pointer"
                                        >
                                          <Check className="w-3 h-3" />
                                          <span>{lang === 'bn' ? 'একসেপ্ট' : 'Accept'}</span>
                                        </button>
                                      )}

                                      {/* Served Trigger (for fast checkoff) */}
                                      {item.status === 'approved' && (
                                        <button
                                          onClick={() => {
                                            onMarkDemandServed(item.id);
                                            showToast(
                                              lang === 'bn' 
                                                ? `রুম ${item.roomNumber}-কে খাবার পরিবেশন করা হয়েছে!`
                                                : `Marked served for Room ${item.roomNumber}!`,
                                              'success'
                                            );
                                          }}
                                          className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-[10px] px-2.5 py-1.5 rounded-lg transition shadow-sm hover:shadow active:scale-95 flex items-center gap-0.5 cursor-pointer"
                                        >
                                          <span>🍛</span>
                                          <span>{lang === 'bn' ? 'পরিবেশন' : 'Serve'}</span>
                                        </button>
                                      )}

                                      {/* Reject Trigger */}
                                      {item.status !== 'rejected' && item.status !== 'served' && (
                                        <button
                                          onClick={() => {
                                            onRejectDemand(item.id);
                                            showToast(
                                              lang === 'bn' 
                                                ? `রুম ${item.roomNumber}-এর খাবার ডিমান্ড বাতিল করা হয়েছে!`
                                                : `Rejected meal demand for Room ${item.roomNumber}!`,
                                              'info'
                                            );
                                          }}
                                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-extrabold text-[10px] px-2.5 py-1.5 rounded-lg transition active:scale-95 flex items-center gap-0.5 cursor-pointer"
                                        >
                                          <X className="w-3 h-3" />
                                          <span>{lang === 'bn' ? 'রিজেক্ট' : 'Reject'}</span>
                                        </button>
                                      )}

                                      {/* Reset to Pending Option */}
                                      {item.status === 'served' && (
                                        <span className="text-[10px] font-bold text-slate-400 italic">
                                          {lang === 'bn' ? 'সম্পন্ন' : 'Finalized'}
                                        </span>
                                      )}
                                      {item.status === 'rejected' && (
                                        <div className="flex flex-col sm:flex-row items-center gap-1.5">
                                          <span className="text-[10px] font-bold text-slate-400 italic">
                                            {lang === 'bn' ? 'সম্পন্ন' : 'Finalized'}
                                          </span>
                                          {onDeleteDemand && (
                                            <button
                                              onClick={() => {
                                                if (window.confirm(lang === 'bn' ? 'আপনি কি নিশ্চিতভাবে এই বাতিলকৃত ডিমান্ডটি ডিলিট করতে চান?' : 'Are you sure you want to delete this rejected demand?')) {
                                                  onDeleteDemand(item.id);
                                                  showToast(
                                                    lang === 'bn' ? 'ডিমান্ড ডিলিট করা হয়েছে!' : 'Demand deleted successfully!',
                                                    'info'
                                                  );
                                                }
                                              }}
                                              className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-extrabold text-[9px] px-2 py-0.5 rounded-lg transition active:scale-95 flex items-center gap-0.5 cursor-pointer shadow-sm"
                                              title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                                            >
                                              <Trash2 className="w-2.5 h-2.5 text-rose-500" />
                                              <span>{lang === 'bn' ? 'মুছুন' : 'Delete'}</span>
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Print Friendly Reports Sheet layout */}
            <div className="bg-slate-50 border rounded-2xl p-6 shadow-inner print:p-0 print:bg-white print:border-none" id="printable-reports-sheet">
              <div className="text-center pb-6 border-b border-dashed border-slate-200 space-y-1">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">{t.appName}</h2>
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider">{t.dailyReport}</h3>
                <p className="text-xs text-slate-400 font-mono">Date: {todayStr} | Status: GENERATED</p>
              </div>

              {/* Meal Summary table */}
              <div className="grid grid-cols-3 gap-4 py-6 border-b border-dashed border-slate-200">
                <div className="bg-white border rounded-xl p-3 text-center shadow-sm">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">{t.breakfast}</div>
                  <div className="text-lg font-black text-slate-800 mt-1">{bStats.totalPlates} <span className="text-[10px] text-slate-400">জন</span></div>
                  <div className="text-[9px] text-slate-400 mt-1">Served: {bStats.servedPlates}</div>
                </div>
                <div className="bg-white border rounded-xl p-3 text-center shadow-sm">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">{t.lunch}</div>
                  <div className="text-lg font-black text-slate-800 mt-1">{lStats.totalPlates} <span className="text-[10px] text-slate-400">জন</span></div>
                  <div className="text-[9px] text-slate-400 mt-1">Served: {lStats.servedPlates}</div>
                </div>
                <div className="bg-white border rounded-xl p-3 text-center shadow-sm">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">{t.dinner}</div>
                  <div className="text-lg font-black text-slate-800 mt-1">{dStats.totalPlates} <span className="text-[10px] text-slate-400">জন</span></div>
                  <div className="text-[9px] text-slate-400 mt-1">Served: {dStats.servedPlates}</div>
                </div>
              </div>

              {/* Room Wise Demands breakdown */}
              <div className="pt-6 space-y-4">
                <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">রুমভিত্তিক ডিমান্ড ও বিতরণ তালিকা</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left text-slate-600">
                    <thead className="bg-slate-100 text-slate-800 font-bold border-b">
                      <tr>
                        <th className="p-2.5">Room</th>
                        <th className="p-2.5">Meal Type</th>
                        <th className="p-2.5">Representative</th>
                        <th className="p-2.5 text-center">Meals Count</th>
                        <th className="p-2.5">Eating Staff IDs</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {todayDemands.map((d) => (
                        <tr key={d.id} className="hover:bg-slate-100/30">
                          <td className="p-2.5 font-bold">Room {d.roomNumber}</td>
                          <td className="p-2.5 uppercase font-bold text-slate-800">{t[d.mealType]}</td>
                          <td className="p-2.5">{d.submittedByName} ({d.submittedBy})</td>
                          <td className="p-2.5 text-center font-bold text-slate-800">{d.selectedStaffIds.length}</td>
                          <td className="p-2.5 font-mono text-[10px] text-slate-500 max-w-[200px] truncate" title={d.selectedStaffIds.join(', ')}>
                            {d.selectedStaffIds.join(', ')}
                          </td>
                          <td className="p-2.5">
                            <span className="uppercase text-[9px] font-extrabold">{d.status}</span>
                          </td>
                        </tr>
                      ))}
                      {todayDemands.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-400 italic">No meals demanded yet today.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: ADMIN SETTINGS & PASSWORD CHANGE */}
        {activeTab === 'settings' && (
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6" id="admin-settings-view">
            <div>
              <h3 className="text-base font-bold text-slate-800">{t.adminSettings}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{lang === 'bn' ? 'অ্যাডমিন প্যানেলের ইউজারনেম এবং পাসওয়ার্ড পরিবর্তন করুন।' : 'Update administrative login credentials.'}</p>
            </div>

            {settingsSuccess && (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-4 rounded-xl text-xs font-semibold">
                {settingsSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <form onSubmit={handleUpdateAdminSubmit} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">Credentials</h4>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">New Admin Username</label>
                  <input
                    type="text"
                    required
                    value={newAdminUser}
                    onChange={(e) => setNewAdminUser(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{t.newPass}</label>
                  <input
                    type="password"
                    required
                    value={newAdminPass}
                    onChange={(e) => setNewAdminPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition shadow cursor-pointer"
                >
                  {t.updatePass}
                </button>
              </form>

              {/* Reset Demo Card inside Admin Settings */}
              <div className="bg-rose-50/40 border border-rose-100 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-rose-800 uppercase tracking-wide flex items-center gap-1.5">
                    ⚠️ {lang === 'bn' ? 'সিস্টেম ডেমো রিসেট' : 'Danger Zone: Demo Reset'}
                  </h4>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {lang === 'bn' 
                      ? 'এই বোতামটি চাপলে সমস্ত রুমের খাবার বুকিং, নিবন্ধিত সদস্য এবং নোটিশ ডাটা মুছে যাবে এবং সিস্টেমটি প্রাথমিক অবস্থায় ফেরত যাবে।' 
                      : 'Clicking this button will completely delete all active meal bookings, registered residents, chat histories, and restore default sample data.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onResetData}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-rose-600/10 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-rose-200" /> {lang === 'bn' ? 'সম্পূর্ণ ডেমো রিসেট করুন' : 'Reset All Demo Data'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8.5: ROOMS MANAGEMENT */}
        {activeTab === 'rooms' && (
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6" id="admin-rooms-view">
            <div>
              <h3 className="text-base font-bold text-slate-800">{lang === 'bn' ? '🏢 রুম পরিচালনা ও গ্রিড সেটিংস' : '🏢 Room Layout Management'}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'bn' 
                  ? 'নতুন রুম নং যুক্ত করুন, কোনো রুম সাময়িক লুকিয়ে রাখুন বা চিরতরে মুছে ফেলুন।' 
                  : 'Add new rooms, hide rooms temporarily, or delete them from the active grid distribution.'}
              </p>
            </div>

            {/* Add Room Form */}
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-3">
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                {lang === 'bn' ? 'নতুন রুম নং যোগ করুন' : 'Add New Room Number'}
              </h4>
              <div className="flex gap-2 max-w-md">
                <input
                  type="text"
                  placeholder={lang === 'bn' ? 'যেমন: ৫১' : 'e.g. 51'}
                  value={newRoomInput}
                  onChange={(e) => setNewRoomInput(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500 flex-1 font-bold"
                />
                <button
                  type="button"
                  onClick={() => {
                    const val = newRoomInput.trim();
                    if (val) {
                      onAddRoom?.(val);
                      setNewRoomInput('');
                      showToast(
                        lang === 'bn' ? `রুম ${val} সফলভাবে যুক্ত হয়েছে!` : `Room ${val} added successfully!`,
                        'success'
                      );
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'যুক্ত করুন' : 'Add Room'}</span>
                </button>
              </div>
            </div>

            {/* Rooms List Grid */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                {lang === 'bn' ? `রুম তালিকা (${rooms.length} টি মোট)` : `Room List (${rooms.length} Total)`}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {rooms.map((r) => (
                  <div key={r.id} className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-300 transition-all space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${r.hidden ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`}></span>
                        <span className="font-extrabold text-slate-800 text-sm">Room {r.roomNumber}</span>
                      </div>
                      {r.hidden && (
                        <span className="text-[9px] bg-amber-50 border border-amber-200 text-amber-700 font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-1">
                          <EyeOff className="w-3 h-3" />
                          {lang === 'bn' ? 'লুকানো' : 'Hidden'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => {
                          onToggleHideRoom?.(r.id);
                          showToast(
                            lang === 'bn' 
                              ? `রুম ${r.roomNumber} এখন ${r.hidden ? 'দেখানো হচ্ছে' : 'লুকানো হয়েছে'}` 
                              : `Room ${r.roomNumber} is now ${r.hidden ? 'visible' : 'hidden'}`,
                            'info'
                          );
                        }}
                        className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          r.hidden 
                            ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {r.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{r.hidden ? (lang === 'bn' ? 'আনহাইড' : 'Unhide') : (lang === 'bn' ? 'হাইড' : 'Hide')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDeletingRoomId(r.id);
                          setDeletingRoomNumber(r.roomNumber);
                        }}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 transition cursor-pointer flex items-center justify-center"
                        title={lang === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Modal Confirmation Dialog (YES/NO) */}
            {deletingRoomId && (
              <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 text-center">
                  <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                    <Trash2 className="w-6 h-6 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-base">
                      {lang === 'bn' ? 'রুম মুছে ফেলার নিশ্চিতকরণ' : 'Delete Room Confirmation'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      {lang === 'bn' 
                        ? `আপনি কি সত্যিই রুম নং "${deletingRoomNumber}" মুছে ফেলতে চান? এটি মুছে ফেললে ওই রুমের বাসিন্দারা সাময়িক খাবার বুকিংয়ে সমস্যা পেতে পারে।`
                        : `Are you sure you want to permanently delete Room "${deletingRoomNumber}"? This action cannot be undone.`}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        onDeleteRoom?.(deletingRoomId);
                        showToast(
                          lang === 'bn' ? `রুম ${deletingRoomNumber} ডিলিট করা হয়েছে!` : `Room ${deletingRoomNumber} deleted!`,
                          'info'
                        );
                        setDeletingRoomId(null);
                        setDeletingRoomNumber('');
                      }}
                      className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-600/15 cursor-pointer transition active:scale-98"
                    >
                      {lang === 'bn' ? 'হ্যাঁ, ডিলিট করুন' : 'Yes, Delete'}
                    </button>
                    <button
                      onClick={() => {
                        setDeletingRoomId(null);
                        setDeletingRoomNumber('');
                      }}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl border border-slate-200 cursor-pointer transition active:scale-98"
                    >
                      {lang === 'bn' ? 'না, ফিরিয়ে যান' : 'No, Cancel'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 9: FOOD MENU MANAGEMENT */}
        {activeTab === 'foodMenu' && (
          <div className="space-y-6" id="admin-food-menu-view">
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                    <Menu className="w-5 h-5 text-indigo-600" />
                    {lang === 'bn' ? 'সুস্বাদু খাবার মেনু পরিচালনা' : 'Culinary Food Menu Management'}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    {lang === 'bn' ? 'আজকের স্পটলাইট সেকশনের খাবারের ছবি, শিরোনাম ও বিবরণ পরিবর্তন বা ডিলিট করুন।' : 'Add, edit, delete, or hide food menu items shown in Today\'s Spotlight.'}
                  </p>
                </div>
              </div>

              {/* Add New / Edit Form */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 space-y-4">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  {editingFoodId 
                    ? (lang === 'bn' ? '✏️ মেনু আইটেম সংশোধন করুন' : '✏️ Edit Menu Item')
                    : (lang === 'bn' ? '➕ নতুন মেনু আইটেম যোগ করুন' : '➕ Add New Menu Item')}
                </h4>
                
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (editingFoodId) {
                      onUpdateFoodMenuItem({
                        id: editingFoodId,
                        img: editFoodImg || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
                        titleBn: editFoodTitleBn,
                        titleEn: editFoodTitleEn,
                        descBn: editFoodDescBn,
                        descEn: editFoodDescEn,
                        category: editFoodCategory
                      });
                      setEditingFoodId(null);
                      // Clear fields
                      setEditFoodImg('');
                      setEditFoodTitleBn('');
                      setEditFoodTitleEn('');
                      setEditFoodDescBn('');
                      setEditFoodDescEn('');
                    } else {
                      onAddFoodMenuItem(
                        newFoodImg || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
                        newFoodTitleBn,
                        newFoodTitleEn,
                        newFoodDescBn,
                        newFoodDescEn
                      );
                      // Clear fields
                      setNewFoodImg('');
                      setNewFoodTitleBn('');
                      setNewFoodTitleEn('');
                      setNewFoodDescBn('');
                      setNewFoodDescEn('');
                    }
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                          {lang === 'bn' ? 'ছবির লিংক (Image URL)' : 'Image URL'}
                        </label>
                        <span className="text-[9px] font-bold text-indigo-600">
                          {lang === 'bn' ? 'অথবা সরাসরি ছবি ফাইল আপলোড করুন 👇' : 'OR Upload Image File 👇'}
                        </span>
                      </div>
                      <input 
                        type="url"
                        value={editingFoodId ? editFoodImg : newFoodImg}
                        onChange={(e) => editingFoodId ? setEditFoodImg(e.target.value) : setNewFoodImg(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500 transition mb-2"
                      />
                      <div className="relative border border-dashed border-slate-300 rounded-xl p-3 bg-slate-50 flex items-center justify-between gap-2 hover:bg-slate-100/60 transition cursor-pointer group">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">📤</span>
                          <span className="text-[10px] font-extrabold text-slate-600 group-hover:text-slate-900 transition">
                            {lang === 'bn' ? 'মোবাইল/কম্পিউটার থেকে ছবি সিলেক্ট করুন' : 'Select Photo from device'}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const base64String = reader.result as string;
                                if (editingFoodId) {
                                  setEditFoodImg(base64String);
                                } else {
                                  setNewFoodImg(base64String);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        {(editingFoodId ? editFoodImg : newFoodImg) && (
                          <span className="text-[8px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-md flex items-center gap-0.5">
                            ✅ {lang === 'bn' ? 'আপলোডকৃত' : 'Selected'}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          {lang === 'bn' ? 'বাংলা শিরোনাম' : 'Bengali Title'}
                        </label>
                        <input 
                          type="text"
                          required
                          value={editingFoodId ? editFoodTitleBn : newFoodTitleBn}
                          onChange={(e) => editingFoodId ? setEditFoodTitleBn(e.target.value) : setNewFoodTitleBn(e.target.value)}
                          placeholder={lang === 'bn' ? 'উদা: সকালের নাস্তা' : 'e.g. সকালের নাস্তা'}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                          {lang === 'bn' ? 'ইংরেজি শিরোনাম' : 'English Title'}
                        </label>
                        <input 
                          type="text"
                          required
                          value={editingFoodId ? editFoodTitleEn : newFoodTitleEn}
                          onChange={(e) => editingFoodId ? setEditFoodTitleEn(e.target.value) : setNewFoodTitleEn(e.target.value)}
                          placeholder="e.g. Delicious Breakfast"
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500 transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        {lang === 'bn' ? 'মিল ক্যাটাগরি (Meal Category)' : 'Meal Category'}
                      </label>
                      <select
                        value={editingFoodId ? editFoodCategory : newFoodCategory}
                        onChange={(e) => editingFoodId ? setEditFoodCategory(e.target.value as MealType) : setNewFoodCategory(e.target.value as MealType)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-indigo-500 transition"
                      >
                        <option value="breakfast">{lang === 'bn' ? 'সকাল (Breakfast)' : 'Breakfast'}</option>
                        <option value="lunch">{lang === 'bn' ? 'দুপুর (Lunch)' : 'Lunch'}</option>
                        <option value="dinner">{lang === 'bn' ? 'রাত (Dinner)' : 'Dinner'}</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3 flex flex-col justify-between">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        {lang === 'bn' ? 'বাংলা বিবরণ' : 'Bengali Description'}
                      </label>
                      <textarea 
                        required
                        rows={2}
                        value={editingFoodId ? editFoodDescBn : newFoodDescBn}
                        onChange={(e) => editingFoodId ? setEditFoodDescBn(e.target.value) : setNewFoodDescBn(e.target.value)}
                        placeholder={lang === 'bn' ? 'গরম গরম লুচি, ডাল ভাজি ও ডিম...' : 'Bengali Description'}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 transition resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                        {lang === 'bn' ? 'ইংরেজি বিবরণ' : 'English Description'}
                      </label>
                      <textarea 
                        required
                        rows={2}
                        value={editingFoodId ? editFoodDescEn : newFoodDescEn}
                        onChange={(e) => editingFoodId ? setEditFoodDescEn(e.target.value) : setNewFoodDescEn(e.target.value)}
                        placeholder="Warm parathas, savory vegetable..."
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-indigo-500 transition resize-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 rounded-xl transition shadow-md shadow-indigo-600/10 cursor-pointer"
                      >
                        {editingFoodId 
                          ? (lang === 'bn' ? 'হালনাগাদ করুন' : 'Update Menu Item') 
                          : (lang === 'bn' ? 'যুক্ত করুন' : 'Add Menu Item')}
                      </button>
                      {editingFoodId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingFoodId(null);
                            setEditFoodImg('');
                            setEditFoodTitleBn('');
                            setEditFoodTitleEn('');
                            setEditFoodDescBn('');
                            setEditFoodDescEn('');
                          }}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs py-3 px-4 rounded-xl transition cursor-pointer"
                        >
                          {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>

              {/* Items Table / List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  {lang === 'bn' ? '📋 বর্তমান খাবারের মেনু তালিকা' : '📋 Current Food Menu List'}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {foodMenu.map((item) => (
                    <div 
                      key={item.id} 
                      className={`bg-white border rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between transition ${
                        item.hidden ? 'opacity-60 border-slate-200 bg-slate-50/50' : 'border-slate-100 hover:shadow-md'
                      }`}
                    >
                      <div>
                        {/* Food Image */}
                        <div className="h-32 w-full relative bg-slate-100 cursor-zoom-in group">
                          <img 
                            src={item.img} 
                            alt={item.titleEn}
                            onClick={() => setViewingIdPhoto(item.img)}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                            title={lang === 'bn' ? 'ছবি বড় করে দেখতে ক্লিক করুন' : 'Click to enlarge image'}
                          />
                          {/* Zoom glass overlay */}
                          <button
                            type="button"
                            onClick={() => setViewingIdPhoto(item.img)}
                            className="absolute right-2 bottom-2 bg-slate-900/60 hover:bg-slate-900/85 text-white p-1.5 rounded-lg backdrop-blur-xs transition cursor-pointer z-10"
                            title={lang === 'bn' ? 'ছবি বড় করে দেখতে ক্লিক করুন' : 'Click to enlarge image'}
                          >
                            <Search className="w-3.5 h-3.5 text-white/90" />
                          </button>
                          {item.hidden && (
                            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
                              <span className="bg-rose-600 text-white font-black text-[9px] tracking-widest px-2.5 py-1 rounded-full uppercase">
                                {lang === 'bn' ? 'লুকানো' : 'HIDDEN'}
                              </span>
                            </div>
                          )}
                          <span className="absolute top-2 right-2 bg-indigo-600/90 backdrop-blur text-white font-mono text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider z-10">
                            {item.category || item.id}
                          </span>
                        </div>

                        {/* Food Info */}
                        <div className="p-4 space-y-2">
                          <div>
                            <h5 className="font-extrabold text-slate-800 text-xs sm:text-sm">
                              {lang === 'bn' ? item.titleBn : item.titleEn}
                            </h5>
                            <p className="text-[11px] text-slate-400 font-medium">
                              {lang === 'bn' ? item.descBn : item.descEn}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Item Actions */}
                      <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          onClick={() => onToggleHideFoodMenuItem(item.id)}
                          className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg border transition cursor-pointer flex items-center justify-center gap-1 ${
                            item.hidden 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          {item.hidden ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              {lang === 'bn' ? 'দেখান' : 'Show'}
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              {lang === 'bn' ? 'লুকান' : 'Hide'}
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setEditingFoodId(item.id);
                            setEditFoodImg(item.img);
                            setEditFoodTitleBn(item.titleBn);
                            setEditFoodTitleEn(item.titleEn);
                            setEditFoodDescBn(item.descBn);
                            setEditFoodDescEn(item.descEn);
                            setEditFoodCategory(item.category || (['breakfast', 'lunch', 'dinner'].includes(item.id) ? item.id as MealType : 'breakfast'));
                          }}
                          className="flex-1 bg-white hover:bg-indigo-50 text-indigo-600 border border-slate-200 hover:border-indigo-200 text-[10px] font-bold py-1.5 rounded-lg transition cursor-pointer"
                        >
                          {lang === 'bn' ? 'সম্পাদনা' : 'Edit'}
                        </button>

                        <button
                          onClick={() => {
                            onDeleteFoodMenuItem(item.id);
                            showToast(
                              lang === 'bn' ? 'খাবারের আইটেমটি ডিলিট করা হয়েছে' : 'Food item deleted successfully',
                              'success'
                            );
                          }}
                          className="text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 p-1.5 rounded-lg transition cursor-pointer"
                          title={lang === 'bn' ? 'ডিলিট করুন' : 'Delete Item'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL OVERLAY: FULLSCREEN ID PHOTO INSPECT */}
      {viewingIdPhoto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in" id="id-photo-modal">
          <div className="bg-white rounded-3xl p-4 max-w-lg w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="text-xs font-bold text-slate-800">ID Verification Photo</h4>
              <button
                onClick={() => setViewingIdPhoto(null)}
                className="text-rose-500 font-extrabold text-xs bg-rose-50 px-2.5 py-1 rounded-lg"
              >
                Close
              </button>
            </div>
            <img
              src={viewingIdPhoto}
              alt="Uploaded Verification Document"
              className="w-full max-h-[380px] object-contain rounded-2xl border"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* MODAL OVERLAY: FULL MEMBER REGISTRATION PROFILE VERIFICATION */}
      {selectedMemberDetail && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="member-profile-modal">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🪪</span>
                <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                  {lang === 'bn' ? 'নিবন্ধিত সদস্যের তথ্য যাচাইকরণ' : 'Resident Profile Verification'}
                </h4>
              </div>
              <button
                onClick={() => setSelectedMemberDetail(null)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column: Photos */}
              <div className="space-y-4">
                <div>
                  <h5 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2">
                    {lang === 'bn' ? '১. নিজের ছবি (Face Photo)' : '1. Face Verification Photo'}
                  </h5>
                  {selectedMemberDetail.userPhoto ? (
                    <img
                      src={selectedMemberDetail.userPhoto}
                      alt="Face Profile"
                      className="w-full h-44 object-cover rounded-2xl border-2 border-indigo-100 shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-44 bg-slate-100 rounded-2xl border border-dashed text-slate-400 flex items-center justify-center font-bold text-xs">
                      No photo uploaded
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <h5 className="text-[9px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                      {lang === 'bn' ? 'আইডি কার্ড (সামনে)' : 'ID Front'}
                    </h5>
                    {selectedMemberDetail.idCardFront ? (
                      <img
                        src={selectedMemberDetail.idCardFront}
                        alt="ID Front"
                        className="w-full h-24 object-cover rounded-xl border cursor-zoom-in hover:opacity-90 transition"
                        onClick={() => setViewingIdPhoto(selectedMemberDetail.idCardFront)}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-24 bg-slate-100 rounded-xl border text-center flex items-center justify-center text-[10px] text-slate-400">
                        N/A
                      </div>
                    )}
                  </div>
                  <div>
                    <h5 className="text-[9px] font-bold uppercase text-slate-400 tracking-wider mb-1">
                      {lang === 'bn' ? 'আইডি কার্ড (পিছনে)' : 'ID Back'}
                    </h5>
                    {selectedMemberDetail.idCardBack ? (
                      <img
                        src={selectedMemberDetail.idCardBack}
                        alt="ID Back"
                        className="w-full h-24 object-cover rounded-xl border cursor-zoom-in hover:opacity-90 transition"
                        onClick={() => setViewingIdPhoto(selectedMemberDetail.idCardBack)}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-24 bg-slate-100 rounded-xl border text-center flex items-center justify-center text-[10px] text-slate-400">
                        N/A
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Personal & Office Details */}
              <div className="flex flex-col justify-between space-y-4">
                <div className="space-y-3 bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
                  <div className="border-b pb-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Name (নাম)</span>
                    <span className="text-sm font-black text-slate-800">{selectedMemberDetail.name}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Staff ID (স্টাফ আইডি)</span>
                      <span className="text-xs font-mono font-bold text-slate-700 bg-white border px-2 py-1 rounded-lg inline-block mt-0.5">
                        {selectedMemberDetail.staffId}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Room (রুম নম্বর)</span>
                      <span className="text-xs font-bold text-slate-700 bg-white border px-2.5 py-1 rounded-lg inline-block mt-0.5">
                        🚪 {selectedMemberDetail.roomNumber}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Sect (শাখা/বিভাগ)</span>
                      <span className="text-xs font-bold text-slate-700 mt-0.5 block">{selectedMemberDetail.department}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Status (অবস্থা)</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase mt-1 inline-block ${
                        selectedMemberDetail.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse'
                      }`}>
                        {selectedMemberDetail.status === 'approved' ? (lang === 'bn' ? 'অনুমোদিত' : 'Approved') : (lang === 'bn' ? 'পেন্ডিং' : 'Pending Approval')}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-bold">Mob:</span>
                      <span className="text-slate-700 font-semibold">{selectedMemberDetail.mobile}</span>
                    </div>
                    {selectedMemberDetail.whatsapp && (
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-500 font-bold">WhatsApp:</span>
                        <a
                          href={`https://wa.me/${selectedMemberDetail.whatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:underline font-bold"
                        >
                          {selectedMemberDetail.whatsapp} 🔗
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* CTAs */}
                <div className="space-y-2 pt-2">
                  {selectedMemberDetail.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onApproveUser(selectedMemberDetail.id);
                          setSelectedMemberDetail(prev => prev ? { ...prev, status: 'approved' } : null);
                          showToast(
                            lang === 'bn'
                              ? `সদস্য ${selectedMemberDetail.name} অনুমোদিত হয়েছে!`
                              : `Resident ${selectedMemberDetail.name} registration approved!`,
                            'success'
                          );
                        }}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs py-3 rounded-xl transition shadow-lg flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>{lang === 'bn' ? 'অনুমোদন করুন' : 'Approve'}</span>
                      </button>
                      <button
                        onClick={() => {
                          onRejectUser(selectedMemberDetail.id);
                          setSelectedMemberDetail(null);
                          showToast(
                            lang === 'bn' ? 'আবেদন প্রত্যাখ্যান করা হয়েছে।' : 'Registration rejected.',
                            'info'
                          );
                        }}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-3 rounded-xl transition flex items-center justify-center cursor-pointer"
                        title="Reject Request"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-2xl border border-emerald-100 text-[11px] font-bold flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <span>
                        {lang === 'bn'
                          ? 'এই সদস্য ইতিমধ্যে অনুমোদিত এবং সম্পূর্ণ তথ্য সিস্টেমে সংরক্ষিত আছে।'
                          : 'This member is already verified and all documents are synced.'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING ACTION CLIPBOARD LAUNCHER */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
        <button
          onClick={() => setIsClipboardOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center relative border border-indigo-500/50 cursor-pointer group"
          id="floating-clipboard-launcher"
        >
          <ClipboardList className="w-6 h-6 text-white" />
          {clipboardItems.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
              {clipboardItems.length}
            </span>
          )}
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition duration-300 whitespace-nowrap pointer-events-none">
            {lang === 'bn' ? 'ক্লিপবোর্ড ড্রাফট শিট' : 'Clipboard Draft Sheet'}
          </span>
        </button>
      </div>

      {/* SLIDE-OUT OVERLAY DRAWER: CLIPBOARD SHEET */}
      {isClipboardOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-300"
          onClick={() => setIsClipboardOpen(false)}
          id="clipboard-drawer-overlay"
        >
          <div 
            className="w-96 max-w-[90vw] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-100"
            onClick={(e) => e.stopPropagation()}
            id="clipboard-drawer-body"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">{lang === 'bn' ? 'ক্লিপবোর্ড ড্রাফট শিট' : 'Clipboard Draft Sheet'}</h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {lang === 'bn' ? `${clipboardItems.length} টি তথ্য জমা আছে` : `${clipboardItems.length} items accumulated`}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsClipboardOpen(false)}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Manual Add Form */}
            <div className="p-4 bg-slate-50 border-b border-slate-100">
              <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                {lang === 'bn' ? '✍️ কাস্টম তথ্য যোগ করুন' : '✍️ Add Custom Entry'}
              </h4>
              <form onSubmit={handleAddManualItem} className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder={lang === 'bn' ? 'নাম (ঐচ্ছিক)' : 'Name (Optional)'}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-indigo-400"
                  />
                  <input
                    type="text"
                    value={manualRoom}
                    onChange={(e) => setManualRoom(e.target.value)}
                    placeholder={lang === 'bn' ? 'রুম নং (ঐচ্ছিক)' : 'Room No (Optional)'}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    placeholder={lang === 'bn' ? 'স্টাফ আইডি লিখুন বা পেস্ট করুন *' : 'Paste Staff ID here *'}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-mono focus:outline-none focus:border-indigo-400"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] px-3 rounded-lg transition flex items-center justify-center cursor-pointer active:scale-95"
                  >
                    {lang === 'bn' ? 'যোগ করুন' : 'Add'}
                  </button>
                </div>
              </form>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {clipboardItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
                  <Clipboard className="w-12 h-12 text-slate-200 mb-2 animate-pulse" />
                  <p className="text-xs font-bold">{lang === 'bn' ? 'কোনো ডাটা জমা নেই' : 'No entries collected yet'}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {lang === 'bn' ? 'স্টাফদের পাশে "ID" বা "নাম সহ কপি" বোতামে ক্লিক করলে এখানে স্বয়ংক্রিয়ভাবে জমা হবে।' : 'Click the copy buttons on resident cards/profiles to auto-collect them here.'}
                  </p>
                </div>
              ) : (
                clipboardItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-start justify-between gap-2.5 hover:shadow-sm transition"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">{item.name}</div>
                      <div className="text-[9px] text-slate-400 font-medium mt-0.5">
                        {lang === 'bn' ? `রুম: ${item.room}` : `Room: ${item.room}`}
                      </div>
                      <div className="mt-1 font-mono text-[10px] bg-indigo-50/50 text-indigo-700 px-1.5 py-0.5 rounded font-black inline-block">
                        ID: {item.staffId}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const updated = clipboardItems.filter((i) => i.id !== item.id);
                        updateClipboardItems(updated);
                      }}
                      className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1 rounded-lg transition cursor-pointer"
                      title={lang === 'bn' ? 'রেকর্ডটি বাদ দিন' : 'Remove entry'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer Actions */}
            {clipboardItems.length > 0 && (
              <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-2">
                <button
                  onClick={handleCopyAllCombined}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-indigo-600/10 cursor-pointer active:scale-95"
                >
                  <Copy className="w-4 h-4 text-indigo-200" />
                  {lang === 'bn' ? 'সব একসঙ্গে কপি করুন (Copy All)' : 'Copy All Combined'}
                </button>
                <button
                  onClick={handleClearSheet}
                  className="w-full bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 py-2.5 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {lang === 'bn' ? 'শিট খালি করুন' : 'Clear Sheet'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CUSTOM BEAUTIFUL TOAST POPUP NOTIFICATION */}
      {toastMessage && (
        <div 
          className="fixed bottom-24 right-6 z-50 bg-slate-900/95 backdrop-blur-md border border-slate-800 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-sm"
          id="custom-toast-popup"
        >
          <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 text-xs">
            ✨
          </div>
          <span className="text-[11px] font-bold leading-tight">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
