/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, MealDemand, Notice, ChatMessage, TimeSetting, PreLoadedStaff, MealType, RegistrationInput, FoodMenuItem, RoomConfig, AutoDemandConfig } from '../types';
import { translations, Language } from '../translations';
import { ChatPanel } from './ChatPanel';
import { saveDocToFirestore } from '../lib/firebase';
import { 
  Lock, CheckCircle, AlertCircle, Calendar, 
  Clock, Megaphone, CheckSquare, Square, 
  Send, UserCheck, Key, LogIn, Upload, Users, ShieldAlert,
  Camera, Sparkles, Utensils, Flame, Coffee, HelpCircle, ChevronDown, ChevronUp, X, Search
} from 'lucide-react';

interface StaffPortalProps {
  currentUser: User | null;
  users: User[];
  demands: MealDemand[];
  notices: Notice[];
  chats: ChatMessage[];
  timeSettings: TimeSetting[];
  preloadedStaff: PreLoadedStaff[];
  bypassTimeControls: boolean;
  lang: Language;
  foodMenu: FoodMenuItem[];
  rooms?: RoomConfig[];
  onRegister: (newUser: RegistrationInput) => void;
  onLogin: (user: User) => void;
  onLogout: () => void;
  onSubmitDemand: (mealType: MealType, selectedStaffIds: string[]) => void;
  onSendChatMessage: (text: string, receiverId: string) => void;
  onSwitchToAdmin: () => void;
  onUpdateAutoDemand: (userId: string, autoDemand: AutoDemandConfig) => void;
}

export const StaffPortal: React.FC<StaffPortalProps> = ({
  currentUser,
  users,
  demands,
  notices,
  chats,
  timeSettings,
  preloadedStaff,
  bypassTimeControls,
  lang,
  foodMenu,
  rooms = [],
  onRegister,
  onLogin,
  onLogout,
  onSubmitDemand,
  onSendChatMessage,
  onSwitchToAdmin,
  onUpdateAutoDemand,
}) => {
  const t = translations[lang];

  // Auth & View States: 'login' | 'register' | 'otp' | 'dashboard'
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'otp'>('login');
  
  // Registration Form States
  const [regName, setRegName] = useState('');
  const [regStaffId, setRegStaffId] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regRoom, setRegRoom] = useState('');
  const [regDepartment, setRegDepartment] = useState('');
  const [regFrontPic, setRegFrontPic] = useState<string>('');
  const [regBackPic, setRegBackPic] = useState<string>('');
  const [regUserPhoto, setRegUserPhoto] = useState<string>('');
  const [regError, setRegError] = useState('');
  const [isPreloadFound, setIsPreloadFound] = useState<boolean | null>(null);

  // Login Form States
  const [loginStaffId, setLoginStaffId] = useState('');
  const [loginError, setLoginError] = useState('');

  // Demand Form Selection States
  const [activeMealTab, setActiveMealTab] = useState<MealType>('breakfast');
  const [selectedRoomMembers, setSelectedRoomMembers] = useState<string[]>([]); // List of staffIds
  const [manualSelectedMembers, setManualSelectedMembers] = useState<string[]>([]); // List of roommate staffIds for manual demand

  // For expanding/collapsing live tracker details
  const [expandedMealType, setExpandedMealType] = useState<MealType | null>(null);

  // For zooming in on profile/ID photos
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);

  // Custom Toast System inside StaffPortal
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info' | 'error'>('success');

  // State for acknowledging the congratulations screen
  const [acknowledgedApproval, setAcknowledgedApproval] = useState<boolean>(() => {
    if (!currentUser) return false;
    return localStorage.getItem(`approved_ack_${currentUser.staffId.toLowerCase()}`) === 'true';
  });

  // Sync acknowledgement state when user changes
  React.useEffect(() => {
    if (currentUser) {
      const ack = localStorage.getItem(`approved_ack_${currentUser.staffId.toLowerCase()}`) === 'true';
      setAcknowledgedApproval(ack);
      setSelectedAutoUser((prev) => prev || currentUser.id);
    } else {
      setAcknowledgedApproval(false);
    }
  }, [currentUser]);

  // For selecting which roommate's auto demand is currently being edited
  const [selectedAutoUser, setSelectedAutoUser] = useState<string>('');

  const getWeeklySchedule = (targetUser: User) => {
    if (targetUser?.autoDemand?.schedule) {
      return targetUser.autoDemand.schedule;
    }
    const hasLegacy = targetUser?.autoDemand;
    const initDay = hasLegacy ? {
      breakfast: (targetUser.autoDemand as any).breakfast ?? true,
      lunch: (targetUser.autoDemand as any).lunch ?? true,
      dinner: (targetUser.autoDemand as any).dinner ?? true,
    } : { breakfast: true, lunch: true, dinner: true };

    return {
      saturday: { ...initDay },
      sunday: { ...initDay },
      monday: { ...initDay },
      tuesday: { ...initDay },
      wednesday: { ...initDay },
      thursday: { ...initDay },
      friday: { ...initDay },
    };
  };

  const handleAcknowledgeApproval = () => {
    if (currentUser) {
      localStorage.setItem(`approved_ack_${currentUser.staffId.toLowerCase()}`, 'true');
      setAcknowledgedApproval(true);
    }
  };

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Handle live pre-loaded validation during registration
  const handleStaffIdChange = (idVal: string) => {
    setRegStaffId(idVal);
    if (!idVal.trim()) {
      setIsPreloadFound(null);
      return;
    }

    // Check if duplicate user exists
    const isDuplicate = users.some(u => u.staffId.toLowerCase() === idVal.trim().toLowerCase());
    if (isDuplicate) {
      setRegError(t.duplicateUserError);
      setIsPreloadFound(false);
      return;
    } else {
      setRegError('');
    }

    const matched = preloadedStaff.find(
      (s) => s.staffId.toLowerCase() === idVal.trim().toLowerCase()
    );

    if (matched) {
      setRegName(matched.name);
      setRegRoom(matched.roomNumber);
      setRegDepartment(matched.department);
      setIsPreloadFound(true);
    } else {
      setIsPreloadFound(false);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regStaffId || !regMobile || !regRoom || !regUserPhoto) {
      setRegError(lang === 'bn' ? 'সবগুলো স্টার (*) চিহ্নিত ঘর এবং নিজের ছবি অবশ্যই পূরণ করুন!' : 'Please fill out all required fields and upload your self photo!');
      return;
    }

    // Default mock images if ID cards are empty
    const frontImage = regFrontPic || 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&auto=format&fit=crop&q=60';
    const backImage = regBackPic || 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&auto=format&fit=crop&q=60';

    onRegister({
      name: regName,
      staffId: regStaffId.trim().toUpperCase(),
      mobile: regMobile,
      whatsapp: regWhatsapp || regMobile,
      roomNumber: regRoom,
      department: regDepartment || 'General',
      idCardFront: frontImage,
      idCardBack: backImage,
      userPhoto: regUserPhoto,
    });

    // Reset fields
    setRegName('');
    setRegStaffId('');
    setRegMobile('');
    setRegWhatsapp('');
    setRegRoom('');
    setRegDepartment('');
    setRegFrontPic('');
    setRegBackPic('');
    setRegUserPhoto('');
    setIsPreloadFound(null);
    
    // Redirect to login
    setAuthMode('login');
    showToast(
      lang === 'bn'
        ? 'আপনার রেজিস্ট্রেশন সফল হয়েছে! অ্যাডমিন অ্যাপ্রুভালের জন্য অপেক্ষা করুন।'
        : 'Registration submitted successfully! Waiting for Admin verification.',
      'success'
    );
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginStaffId.trim()) {
      setLoginError(lang === 'bn' ? 'দয়া করে স্টাফ আইডি দিন!' : 'Please enter Staff ID!');
      return;
    }

    const matchedUser = users.find(
      (u) => u.staffId.toLowerCase() === loginStaffId.trim().toLowerCase()
    );

    if (!matchedUser) {
      setLoginError(
        lang === 'bn'
          ? 'এই স্টাফ আইডিটি নিবন্ধিত নয়! প্রথমে রেজিস্ট্রেশন করুন বা এডমিন অনুমোদন চেক করুন।'
          : 'This Staff ID is not registered! Please register first.'
      );
      return;
    }

    onLogin(matchedUser);
  };

  // Check if current time is active for a meal
  const isTimeActive = (mealType: MealType) => {
    if (bypassTimeControls) return true;
    const setting = timeSettings.find((s) => s.mealType === mealType);
    if (!setting) return false;

    const now = new Date();
    const currentStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    return currentStr >= setting.startTime && currentStr <= setting.endTime;
  };

  // Check if room is locked for a meal (demands already placed)
  const todayStr = new Date().toISOString().split('T')[0];
  const getActiveRoomDemands = (mealType: MealType) => {
    if (!currentUser) return [];
    return demands.filter(
      (d) =>
        d.roomNumber === currentUser.roomNumber &&
        d.mealType === mealType &&
        d.date === todayStr &&
        d.status !== 'rejected'
    );
  };

  const isRoomLocked = (mealType: MealType) => {
    return getActiveRoomDemands(mealType).length > 0;
  };

  // Get other room members living in the same room
  const getRoomMembers = () => {
    if (!currentUser) return [];
    const currentRoom = currentUser.roomNumber;
    
    // 1. Get all approved registered users in this room
    const registeredInThisRoom = users.filter(u => u.status === 'approved' && u.roomNumber === currentRoom);
    
    // 2. Get all preloaded staff in this room, BUT exclude any that are registered in *another* room now
    const preloadedInThisRoom = preloadedStaff.filter(s => {
      const regUser = users.find(u => u.staffId.toLowerCase() === s.staffId.toLowerCase());
      if (regUser) {
        return regUser.status === 'approved' && regUser.roomNumber === currentRoom;
      }
      return s.roomNumber === currentRoom;
    });

    // Merge them to prevent duplicates by staffId
    const mergedMap = new Map<string, { staffId: string; name: string; department: string }>();

    // Add preloaded first
    preloadedInThisRoom.forEach(p => {
      mergedMap.set(p.staffId.toLowerCase(), {
        staffId: p.staffId,
        name: p.name,
        department: p.department || 'General'
      });
    });

    // Overwrite/add registered approved users (which holds latest admin-edited names or departments)
    registeredInThisRoom.forEach(r => {
      mergedMap.set(r.staffId.toLowerCase(), {
        staffId: r.staffId,
        name: r.name,
        department: r.department
      });
    });

    return Array.from(mergedMap.values());
  };

  const toggleRoomMemberSelection = (staffId: string) => {
    if (selectedRoomMembers.includes(staffId)) {
      setSelectedRoomMembers(selectedRoomMembers.filter((id) => id !== staffId));
    } else {
      setSelectedRoomMembers([...selectedRoomMembers, staffId]);
    }
  };

  const handleDemandSubmit = () => {
    if (selectedRoomMembers.length === 0) {
      showToast(lang === 'bn' ? 'কমপক্ষে ১ জন সদস্য নির্বাচন করুন!' : 'Select at least 1 member!', 'error');
      return;
    }

    // Verify selected members
    const unapprovedMembers: string[] = [];
    const unregisteredMembers: string[] = [];

    for (const staffId of selectedRoomMembers) {
      const uObj = users.find(u => u.staffId.toLowerCase() === staffId.toLowerCase());
      if (!uObj) {
        const staffName = preloadedStaff.find(s => s.staffId.toLowerCase() === staffId.toLowerCase())?.name || staffId;
        unregisteredMembers.push(staffName);
      } else if (uObj.status !== 'approved') {
        unapprovedMembers.push(uObj.name);
      }
    }

    if (unregisteredMembers.length > 0) {
      showToast(
        lang === 'bn'
          ? `রেজিস্ট্রেশন করা নেই: ${unregisteredMembers.join(', ')}`
          : `Not registered: ${unregisteredMembers.join(', ')}`,
        'error'
      );
      return;
    }

    if (unapprovedMembers.length > 0) {
      showToast(
        lang === 'bn'
          ? `অনুমোদন করা হয়নি: ${unapprovedMembers.join(', ')}`
          : `Not approved yet: ${unapprovedMembers.join(', ')}`,
        'error'
      );
      return;
    }

    onSubmitDemand(activeMealTab, selectedRoomMembers);
    setSelectedRoomMembers([]);
    showToast(
      lang === 'bn' ? 'মিল ডিমান্ড সফলভাবে সাবমিট করা হয়েছে!' : 'Meal demand submitted successfully!',
      'success'
    );
  };

  const handleManualDemandSubmit = () => {
    if (manualSelectedMembers.length === 0) {
      showToast(
        lang === 'bn' ? 'কমপক্ষে ১ জন সদস্য নির্বাচন করুন!' : 'Select at least 1 member!',
        'error'
      );
      return;
    }

    // Verify selected members
    const unapprovedMembers: string[] = [];
    const unregisteredMembers: string[] = [];

    for (const staffId of manualSelectedMembers) {
      const uObj = users.find(u => u.staffId.toLowerCase() === staffId.toLowerCase());
      if (!uObj) {
        const staffName = preloadedStaff.find(s => s.staffId.toLowerCase() === staffId.toLowerCase())?.name || staffId;
        unregisteredMembers.push(staffName);
      } else if (uObj.status !== 'approved') {
        unapprovedMembers.push(uObj.name);
      }
    }

    if (unregisteredMembers.length > 0) {
      showToast(
        lang === 'bn'
          ? `রেজিস্ট্রেশন করা নেই: ${unregisteredMembers.join(', ')}`
          : `Not registered: ${unregisteredMembers.join(', ')}`,
        'error'
      );
      return;
    }

    if (unapprovedMembers.length > 0) {
      showToast(
        lang === 'bn'
          ? `অনুমোদন করা হয়নি: ${unapprovedMembers.join(', ')}`
          : `Not approved yet: ${unapprovedMembers.join(', ')}`,
        'error'
      );
      return;
    }

    onSubmitDemand(activeMealTab, manualSelectedMembers);
    setManualSelectedMembers([]);
    showToast(
      lang === 'bn' ? 'ম্যানুয়াল মিল ডিমান্ড সফলভাবে সাবমিট করা হয়েছে!' : 'Manual meal demand submitted successfully!',
      'success'
    );
  };

  // Handle file uploads converting to Base64 with high-quality compression to stay under Firestore document limits
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const rawResult = reader.result as string;
        // Compress image using Canvas
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Downscale to a maximum dimension of 500px (ideal for avatars and verification ID cards)
          const MAX_DIM = 500;
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Save as jpeg with 0.7 quality for superb space saving and instant syncing
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            setter(compressedBase64);
          } else {
            setter(rawResult);
          }
        };
        img.src = rawResult;
      };
      reader.readAsDataURL(file);
    }
  };

  // Simulated image converters
  const triggerFrontPicUpload = () => {
    setRegFrontPic('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=60');
  };

  const triggerBackPicUpload = () => {
    setRegBackPic('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&auto=format&fit=crop&q=60');
  };

  const triggerUserPhotoUpload = () => {
    setRegUserPhoto('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=60');
  };

  // Helper for meal icons
  const getMealIcon = (mType: MealType) => {
    switch (mType) {
      case 'breakfast': return <Coffee className="w-5 h-5 text-amber-500" />;
      case 'lunch': return <Utensils className="w-5 h-5 text-orange-500" />;
      case 'dinner': return <Flame className="w-5 h-5 text-yellow-500" />;
    }
  };

  // RENDER APPROVED CONGRATULATIONS VIEW
  if (currentUser && currentUser.status === 'approved' && !acknowledgedApproval) {
    return (
      <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl mx-auto my-0 sm:my-12 bg-white sm:bg-white/95 backdrop-blur-none sm:backdrop-blur border-0 sm:border border-emerald-100 rounded-none sm:rounded-3xl shadow-none sm:shadow-2xl p-6 sm:p-10 text-center transition-all duration-300 min-h-[calc(100vh-80px)] sm:min-h-0 flex flex-col justify-center animate-in zoom-in-95 duration-300 animate-duration-500" id="approved-congratulations-card">
        {/* Large Green Circle with Glowing Effect & Check emoji */}
        <div className="relative w-28 h-28 mx-auto mb-8 flex items-center justify-center">
          {/* Animated pulsing outer ring */}
          <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-30"></div>
          {/* Green circle */}
          <div className="relative w-24 h-24 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
            <span className="text-4xl filter drop-shadow">✅</span>
          </div>
        </div>

        {/* Congratulations Header */}
        <h3 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-emerald-600 mb-3 tracking-tight">
          {lang === 'bn' ? '🎉 অভিনন্দন! 🎉' : '🎉 Congratulations! 🎉'}
        </h3>
        
        <h4 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 animate-pulse">
          {lang === 'bn' ? 'আপনার অ্যাকাউন্টটি অনুমোদিত হয়েছে!' : 'Your account has been approved!'}
        </h4>

        <p className="text-sm sm:text-base text-slate-600 mb-8 max-w-md mx-auto leading-relaxed">
          {lang === 'bn' 
            ? 'অভিনন্দন! এডমিন আপনার অ্যাকাউন্টটি যাচাই করে অনুমোদন দিয়েছেন। এখন আপনি ড্যাশবোর্ডে প্রবেশ করে খাবার ডিমান্ড করতে পারবেন।' 
            : 'Congratulations! The Admin has verified and approved your account. You can now access the dashboard to manage and submit your food demands.'}
        </p>

        {/* User Details Box */}
        <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-5 sm:p-6 text-left mb-8 space-y-3 max-w-md mx-auto shadow-sm">
          <div className="text-sm sm:text-base text-slate-600 flex justify-between items-center pb-2 border-b border-emerald-100/50">
            <span className="font-bold text-slate-800">{lang === 'bn' ? 'নাম:' : 'Name:'}</span> 
            <span className="font-medium text-slate-700">{currentUser.name}</span>
          </div>
          <div className="text-sm sm:text-base text-slate-600 flex justify-between items-center pb-2 border-b border-emerald-100/50">
            <span className="font-bold text-slate-800">{lang === 'bn' ? 'স্টাফ আইডি:' : 'Staff ID:'}</span> 
            <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{currentUser.staffId}</span>
          </div>
          <div className="text-sm sm:text-base text-slate-600 flex justify-between items-center pb-2 border-b border-emerald-100/50">
            <span className="font-bold text-slate-800">{lang === 'bn' ? 'রুম নাম্বার:' : 'Room Number:'}</span> 
            <span className="font-bold text-slate-700">Room {currentUser.roomNumber}</span>
          </div>
          <div className="text-sm sm:text-base text-slate-600 flex justify-between items-center">
            <span className="font-bold text-slate-800">{lang === 'bn' ? 'ডিপার্টমেন্ট:' : 'Department:'}</span> 
            <span className="font-medium text-slate-700">{currentUser.department}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-3 max-w-md mx-auto">
          <button
            onClick={handleAcknowledgeApproval}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold py-4 rounded-2xl transition duration-200 shadow-lg shadow-emerald-200/50 hover:shadow-emerald-300/50 cursor-pointer text-sm sm:text-base flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5 animate-bounce" />
            <span>{lang === 'bn' ? 'ড্যাশবোর্ডে প্রবেশ করুন' : 'Enter Dashboard'}</span>
          </button>
          
          <button
            onClick={onLogout}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-2xl transition cursor-pointer text-xs sm:text-sm"
          >
            {t.logout}
          </button>
        </div>
      </div>
    );
  }

  // RENDER PENDING APPROVAL VIEW
  if (currentUser && currentUser.status === 'pending') {
    return (
      <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl mx-auto my-0 sm:my-12 bg-white sm:bg-white/95 backdrop-blur-none sm:backdrop-blur border-0 sm:border border-orange-100 rounded-none sm:rounded-3xl shadow-none sm:shadow-2xl p-6 sm:p-10 text-center transition-all duration-300 min-h-[calc(100vh-80px)] sm:min-h-0 flex flex-col justify-center" id="pending-approval-card">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-100 shadow-inner">
          <Clock className="w-10 h-10 text-amber-500 animate-pulse" />
        </div>
        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 mb-2">
          {lang === 'bn' ? 'যাচাইকরণ পেন্ডিং রয়েছে' : 'Verification Pending'}
        </h3>
        <p className="text-sm sm:text-base text-slate-500 mb-6 leading-relaxed">
          {t.pendingApproval}
        </p>
        <div className="bg-orange-50/20 border border-orange-100/50 rounded-2xl p-5 sm:p-6 text-left mb-6 space-y-3">
          <div className="text-sm sm:text-base text-slate-600"><strong className="text-slate-800">Name:</strong> {currentUser.name}</div>
          <div className="text-sm sm:text-base text-slate-600"><strong className="text-slate-800">Staff ID:</strong> {currentUser.staffId}</div>
          <div className="text-sm sm:text-base text-slate-600"><strong className="text-slate-800">Room:</strong> {currentUser.roomNumber}</div>
          <div className="text-sm sm:text-base text-slate-600"><strong className="text-slate-800">Department:</strong> {currentUser.department}</div>
        </div>
        <button
          onClick={onLogout}
          className="w-full bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold py-4 rounded-2xl transition shadow-lg cursor-pointer text-sm sm:text-base"
        >
          {t.logout}
        </button>
      </div>
    );
  }

  // RENDER BLOCKED VIEW
  if (currentUser && currentUser.status === 'blocked') {
    return (
      <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl mx-auto my-0 sm:my-12 bg-white sm:bg-white/95 backdrop-blur-none sm:backdrop-blur border-0 sm:border border-rose-100 rounded-none sm:rounded-3xl shadow-none sm:shadow-2xl p-6 sm:p-10 text-center transition-all duration-300 min-h-[calc(100vh-80px)] sm:min-h-0 flex flex-col justify-center" id="blocked-account-card">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-100">
          <ShieldAlert className="w-10 h-10 text-rose-500" />
        </div>
        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 mb-2">
          {lang === 'bn' ? 'অ্যাকাউন্ট ব্লক করা হয়েছে' : 'Account Blocked'}
        </h3>
        <p className="text-sm sm:text-base text-rose-600 mb-6 leading-relaxed bg-rose-50 p-5 sm:p-6 rounded-2xl border border-rose-100">
          {t.accountBlocked}
        </p>
        <button
          onClick={onLogout}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition shadow text-sm sm:text-base"
        >
          {t.logout}
        </button>
      </div>
    );
  }

  // RENDER AUTHENTICATION FORMS (LOGIN / REGISTER WITH FOOD EMBELLISHMENTS)
  if (!currentUser) {
    return (
      <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl mx-auto my-0 sm:my-6 bg-white sm:bg-white/95 backdrop-blur-none sm:backdrop-blur border-0 sm:border border-orange-100 rounded-none sm:rounded-3xl shadow-none sm:shadow-2xl overflow-hidden transition-all duration-300 min-h-[calc(100vh-80px)] sm:min-h-0" id="staff-auth-container">
        {/* Decorative App Header for Food Vibe */}
        <div className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 text-white p-8 sm:p-10 text-center space-y-3 shadow-md">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur mx-auto flex items-center justify-center shadow-inner transition-transform duration-300 hover:scale-105">
            <Utensils className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight mt-3">Bagdi Quarter Food Manager</h2>
          <p className="text-xs sm:text-sm text-amber-100 font-semibold uppercase tracking-widest mt-1">{lang === 'bn' ? 'কোয়ার্টার খাবার ব্যবস্থাপনা' : 'Quarter Food Management System'}</p>
        </div>

        <div className="flex bg-orange-50/50 p-1.5 m-6 sm:m-8 border border-orange-100 rounded-2xl">
          <button
            onClick={() => { setAuthMode('login'); setRegError(''); setLoginError(''); }}
            className={`flex-1 text-center py-2.5 sm:py-3 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
              authMode === 'login'
                ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'bn' ? 'লগইন করুন' : 'Log In'}
          </button>
          <button
            onClick={() => { setAuthMode('register'); setRegError(''); setLoginError(''); }}
            className={`flex-1 text-center py-2.5 sm:py-3 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
              authMode === 'register'
                ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lang === 'bn' ? 'রেজিস্ট্রেশন' : 'Register'}
          </button>
        </div>

        {/* 1. LOGIN MODE */}
        {(authMode === 'login') && (
          <form onSubmit={handleLoginSubmit} className="p-6 sm:p-8 pt-0 sm:pt-0 space-y-5" id="staff-login-form">
            <div className="text-center mb-4">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-800">{t.loginTitle}</h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
                {lang === 'bn' ? 'নিবন্ধিত স্টাফ আইডি দিয়ে সরাসরি প্রবেশ করুন।' : 'Simply log in using your registered Staff ID.'}
              </p>
            </div>

            {loginError && (
              <div className="bg-rose-50 text-rose-600 text-xs p-3.5 rounded-2xl border border-rose-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">{t.staffId} <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                value={loginStaffId}
                onChange={(e) => setLoginStaffId(e.target.value)}
                placeholder="e.g. ST-101"
                className="w-full bg-slate-50 border border-orange-100/60 rounded-xl px-4 py-3 sm:px-5 sm:py-3.5 text-sm sm:text-base focus:outline-none focus:border-orange-500 focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-600 via-amber-500 to-orange-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold py-3.5 sm:py-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg hover:shadow-orange-500/20 active:scale-95 cursor-pointer text-sm sm:text-base"
            >
              <LogIn className="w-4 h-4" />
              {lang === 'bn' ? 'লগইন করুন' : 'Log In'}
            </button>
          </form>
        )}

        {/* 3. REGISTER MODE */}
        {authMode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="p-6 sm:p-8 pt-0 sm:pt-0 space-y-5 max-h-[520px] sm:max-h-[680px] md:max-h-none overflow-y-auto" id="staff-register-form">
            <div className="text-center mb-4">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-800">{t.registrationTitle}</h3>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1">{t.registrationDesc}</p>
            </div>

            {regError && (
              <div className="bg-rose-50 text-rose-600 text-xs p-3.5 rounded-2xl border border-rose-100 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{regError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.staffId} <span className="text-rose-500">*</span></label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={regStaffId}
                  onChange={(e) => handleStaffIdChange(e.target.value)}
                  placeholder="e.g. ST-101"
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm focus:outline-none transition ${
                    isPreloadFound === true
                      ? 'border-emerald-300 focus:border-emerald-500'
                      : isPreloadFound === false
                      ? 'border-amber-300 focus:border-amber-500'
                      : 'border-orange-100/60 focus:border-orange-500'
                  }`}
                />
                {isPreloadFound === true && (
                  <span className="absolute right-3 top-2.5 text-emerald-600 text-xs font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    <CheckCircle className="w-3.5 h-3.5" /> Approved ID
                  </span>
                )}
                {isPreloadFound === false && (
                  <span className="absolute right-3 top-2.5 text-amber-600 text-[10px] font-bold flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg">
                    <UserCheck className="w-3.5 h-3.5" /> New ID
                  </span>
                )}
              </div>
              {isPreloadFound === true && (
                <p className="text-[10px] text-emerald-600 mt-1">{t.verificationSuccess}</p>
              )}
              {isPreloadFound === false && !regError && (
                <p className="text-[10px] text-amber-600 mt-1">
                  {lang === 'bn'
                    ? 'নতুন স্টাফ আইডি (রেজিস্ট্রেশনের পর এডমিন অনুমতি দিলে চালু হবে)।'
                    : 'New Staff ID (Will activate after Admin verifies and approves).'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">{t.fullName} <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Full Name"
                className="w-full bg-slate-50 border border-orange-100/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t.roomNo} <span className="text-rose-500">*</span></label>
                <select
                  required
                  value={regRoom}
                  onChange={(e) => setRegRoom(e.target.value)}
                  className="w-full bg-slate-50 border border-orange-100/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition"
                >
                  <option value="">{lang === 'bn' ? '-- রুম সিলেক্ট করুন --' : '-- Select Room --'}</option>
                  {rooms.filter((r) => !r.hidden).map((r) => (
                    <option key={r.id} value={r.roomNumber}>
                      Room {r.roomNumber}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t.department}</label>
                <input
                  type="text"
                  value={regDepartment}
                  onChange={(e) => setRegDepartment(e.target.value)}
                  placeholder="e.g. Electrical"
                  className="w-full bg-slate-50 border border-orange-100/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t.mobileNo} <span className="text-rose-500">*</span></label>
                <input
                  type="tel"
                  required
                  value={regMobile}
                  onChange={(e) => setRegMobile(e.target.value)}
                  placeholder="017xxxxxxxx"
                  className="w-full bg-slate-50 border border-orange-100/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">{t.whatsappNo}</label>
                <input
                  type="tel"
                  value={regWhatsapp}
                  onChange={(e) => setRegWhatsapp(e.target.value)}
                  placeholder="WhatsApp No"
                  className="w-full bg-slate-50 border border-orange-100/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Photo upload blocks (Self Face Photo is critical for food delivery verification) */}
            <div className="space-y-4 border-t border-orange-50 pt-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">{t.userPhoto} <span className="text-rose-500">*</span></label>
                  <button type="button" onClick={triggerUserPhotoUpload} className="text-[10px] font-bold text-orange-600 hover:underline">
                    {lang === 'bn' ? 'অটো-সিমুলেট ছবি' : 'Auto-Simulate Face'}
                  </button>
                </div>
                <label className="cursor-pointer block">
                  <div className="w-full bg-slate-50 border border-dashed border-orange-200 hover:border-orange-400 rounded-xl p-4 text-center text-xs text-slate-500 hover:bg-orange-50/20 transition flex flex-col items-center justify-center gap-1">
                    {regUserPhoto ? (
                      <div className="flex items-center gap-2 text-emerald-600 font-bold">
                        <CheckCircle className="w-4 h-4" /> {t.uploadSuccess}
                      </div>
                    ) : (
                      <>
                        <Camera className="w-5 h-5 text-orange-400" />
                        <span className="font-semibold text-slate-600">{lang === 'bn' ? 'নিজের ফেস ছবি সিলেক্ট করুন' : 'Upload Your Face Photo'}</span>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => handleFileChange(e, setRegUserPhoto)}
                    className="hidden"
                  />
                </label>
                {regUserPhoto && (
                  <img
                    src={regUserPhoto}
                    alt="Resident Self"
                    className="mt-3 h-28 w-28 object-cover rounded-full border-4 border-orange-400 mx-auto shadow-md cursor-zoom-in"
                    onClick={() => setViewingPhotoUrl(regUserPhoto)}
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">{t.idCardFront}</label>
                    <button type="button" onClick={triggerFrontPicUpload} className="text-[9px] text-orange-600 hover:underline">Simulate</button>
                  </div>
                  <label className="cursor-pointer block">
                    <div className="bg-slate-50 border border-dashed border-orange-200 rounded-xl p-3 text-center text-[11px] text-slate-500 hover:bg-orange-50/20 transition flex flex-col items-center justify-center">
                      {regFrontPic ? <span className="text-emerald-600 font-bold">Uploaded</span> : <span>Select File</span>}
                    </div>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setRegFrontPic)} className="hidden" />
                  </label>
                  {regFrontPic && (
                    <img
                      src={regFrontPic}
                      alt="Front"
                      className="mt-2 h-14 w-full object-cover rounded-lg border cursor-zoom-in"
                      onClick={() => setViewingPhotoUrl(regFrontPic)}
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-700">{t.idCardBack}</label>
                    <button type="button" onClick={triggerBackPicUpload} className="text-[9px] text-orange-600 hover:underline">Simulate</button>
                  </div>
                  <label className="cursor-pointer block">
                    <div className="bg-slate-50 border border-dashed border-orange-200 rounded-xl p-3 text-center text-[11px] text-slate-500 hover:bg-orange-50/20 transition flex flex-col items-center justify-center">
                      {regBackPic ? <span className="text-emerald-600 font-bold">Uploaded</span> : <span>Select File</span>}
                    </div>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setRegBackPic)} className="hidden" />
                  </label>
                  {regBackPic && (
                    <img
                      src={regBackPic}
                      alt="Back"
                      className="mt-2 h-14 w-full object-cover rounded-lg border cursor-zoom-in"
                      onClick={() => setViewingPhotoUrl(regBackPic)}
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold py-3.5 rounded-xl transition shadow-lg cursor-pointer"
            >
              {t.submitRequest}
            </button>
          </form>
        )}
        
        {/* Subtle Admin Portal Switch Link */}
        <div className="p-4 bg-orange-50/40 border-t border-orange-100/50 text-center flex flex-col items-center justify-center gap-1">
          <p className="text-[10px] text-slate-400 font-semibold">
            {lang === 'bn' ? 'আপনি কি একজন কোয়ার্টার এডমিন?' : 'Are you a Quarter Admin?'}
          </p>
          <button
            type="button"
            onClick={onSwitchToAdmin}
            className="text-xs font-black text-orange-600 hover:text-orange-700 transition flex items-center justify-center gap-1 hover:underline cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
            {lang === 'bn' ? 'অ্যাডমিন প্যানেল এ প্রবেশ করুন' : 'Access Admin Panel'}
          </button>
        </div>
      </div>
    );
  }

  // RENDER STAFF PORTAL DASHBOARD (AFTER SUCCESSFUL LOGIN)
  return (
    <div className="space-y-4 px-4 sm:px-0" id="staff-dashboard">
      {/* Premium Food-Themed Welcome Banner */}
      <div className="bg-gradient-to-br from-orange-600 via-amber-500 to-orange-500 rounded-2xl p-4 sm:p-5 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden border border-white/10">
        {/* Glow backdrop circles */}
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute -left-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        
        <div className="flex items-center gap-3 relative z-10">
          {currentUser.userPhoto ? (
            <img 
              src={currentUser.userPhoto} 
              alt={currentUser.name} 
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-white/20 shadow-md cursor-zoom-in flex-shrink-0" 
              onClick={() => setViewingPhotoUrl(currentUser.userPhoto)}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center font-bold text-lg flex-shrink-0">
              {currentUser.name.charAt(0)}
            </div>
          )}
          <div>
            <span className="bg-white/20 backdrop-blur text-[8px] sm:text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full inline-flex items-center gap-1 mb-1.5 border border-white/10 shadow-sm animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
              {lang === 'bn' ? 'সক্রিয় অ্যাকাউন্ট' : 'Active Resident'}
            </span>
            <h2 className="text-base sm:text-lg font-black tracking-tight">
              {currentUser.name}
            </h2>
            <p className="text-amber-50 text-[10px] mt-0.5 font-semibold">
              ID: <span className="font-mono bg-white/10 px-1 py-0.5 rounded text-[10px]">{currentUser.staffId}</span> | Room: <span className="font-mono bg-white/10 px-1 py-0.5 rounded text-[10px]">{currentUser.roomNumber}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <button
            onClick={onLogout}
            className="bg-white text-orange-600 hover:bg-orange-50 text-[10px] sm:text-xs font-black px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            {t.logout}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Interactive Meal Booking */}
        <div className="lg:col-span-8 space-y-4">

          {/* CULINARY SPOTLIGHT (CHOMO MOKO & APPETIZING FOOD IMAGES PANEL) */}
          <div className="bg-white border border-orange-100 rounded-2xl p-4 shadow-md space-y-3" id="culinary-spotlight-panel">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                <div>
                  <h3 className="text-xs font-black text-slate-800 tracking-tight">
                    {lang === 'bn' ? 'আজকের সুস্বাদু খাবার মেনু' : 'Today\'s Culinary Food Menu'}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-medium">
                    {lang === 'bn' ? 'নির্ধারিত সময়ে গরম ও ফ্রেশ খাবার' : 'Hot & fresh delicious meals'}
                  </p>
                </div>
              </div>
              <span className="text-[9px] bg-amber-50 text-amber-800 font-black px-2 py-0.5 rounded-lg border border-amber-200/60">
                🔥 Fresh
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {foodMenu.filter(food => !food.hidden).map((food) => {
                const isSelectedCategory = activeMealTab === food.id || food.category === activeMealTab;
                return (
                  <div
                    key={food.id}
                    onClick={() => {
                      const targetCategory = food.category || (['breakfast', 'lunch', 'dinner'].includes(food.id) ? food.id as MealType : 'breakfast');
                      setActiveMealTab(targetCategory);
                      setSelectedRoomMembers([]);
                    }}
                    className={`group relative overflow-hidden rounded-xl border transition-all duration-300 cursor-pointer ${
                      isSelectedCategory
                        ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-md scale-[1.01]'
                        : 'border-orange-100 hover:border-orange-300 hover:shadow-sm'
                    }`}
                  >
                    {/* Glowing Accent Border/Light */}
                    {isSelectedCategory && (
                      <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 to-orange-500/5 pointer-events-none z-10"></div>
                    )}
                    
                    {/* Food Image Container with Hover zoom */}
                    <div className="h-16 sm:h-20 w-full overflow-hidden relative cursor-zoom-in">
                      <img
                        src={food.img}
                        alt={food.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setViewingPhotoUrl(food.img);
                        }}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                        title={lang === 'bn' ? 'ছবি বড় করে দেখতে ক্লিক করুন' : 'Click to enlarge image'}
                      />
                      {/* Text overlay on image bottom */}
                      <div className="absolute bottom-1.5 left-2 right-2 text-white z-10 leading-tight">
                        <div className="font-black text-[10px] sm:text-[11px] truncate">
                          {lang === 'bn' ? food.titleBn : food.titleEn}
                        </div>
                        <div className="text-[8px] opacity-90 truncate font-semibold mt-0.5">
                          {lang === 'bn' ? food.descBn : food.descEn}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AUTO DEMAND CONFIGURATION PANEL */}
          {currentUser && (() => {
            // Get all room members in this room (both preloaded and registered)
            const roomMembers = getRoomMembers();
            
            // Get all approved registered users in this room
            const approvedRoommates = users.filter(u => u.status === 'approved' && u.roomNumber === currentUser.roomNumber);
            
            // Determine active target user for configuration
            const targetUserId = selectedAutoUser || currentUser.id;
            const targetUser = approvedRoommates.find(u => u.id === targetUserId) || currentUser;
            const schedule = getWeeklySchedule(targetUser);
            
            const daysOfWeekList = [
              { key: 'saturday', labelEn: 'Saturday', labelBn: 'শনিবার' },
              { key: 'sunday', labelEn: 'Sunday', labelBn: 'রবিবার' },
              { key: 'monday', labelEn: 'Monday', labelBn: 'সোমবার' },
              { key: 'tuesday', labelEn: 'Tuesday', labelBn: 'মঙ্গলবার' },
              { key: 'wednesday', labelEn: 'Wednesday', labelBn: 'বুধবার' },
              { key: 'thursday', labelEn: 'Thursday', labelBn: 'বৃহস্পতিবার' },
              { key: 'friday', labelEn: 'Friday', labelBn: 'শুক্রবার' },
            ] as const;

            const toggleMeal = (dayKey: typeof daysOfWeekList[number]['key'], meal: 'breakfast' | 'lunch' | 'dinner') => {
              const updatedSchedule = {
                ...schedule,
                [dayKey]: {
                  ...schedule[dayKey],
                  [meal]: !schedule[dayKey][meal]
                }
              };
              const updatedConfig: AutoDemandConfig = {
                enabled: targetUser.autoDemand?.enabled ?? true,
                schedule: updatedSchedule,
              };
              onUpdateAutoDemand(targetUser.id, updatedConfig);
              
              const mealLabel = meal === 'breakfast' 
                ? (lang === 'bn' ? 'সকাল' : 'Breakfast')
                : meal === 'lunch'
                ? (lang === 'bn' ? 'দুপুর' : 'Lunch')
                : (lang === 'bn' ? 'রাত' : 'Dinner');
              
              const dayLabel = daysOfWeekList.find(d => d.key === dayKey)?.[lang === 'bn' ? 'labelBn' : 'labelEn'];
              
              showToast(
                lang === 'bn'
                  ? `${targetUser.name} - এর জন্য ${dayLabel} - এ ${mealLabel} এর অটো ডিমান্ড ${!schedule[dayKey][meal] ? 'সচল' : 'বন্ধ'} করা হয়েছে।`
                  : `${targetUser.name}'s ${dayLabel} - ${mealLabel} auto-demand ${!schedule[dayKey][meal] ? 'activated' : 'deactivated'}.`,
                'info'
              );
            };

            const handleSetAll = (status: boolean) => {
              const updatedSchedule: any = {};
              daysOfWeekList.forEach((day) => {
                updatedSchedule[day.key] = {
                  breakfast: status,
                  lunch: status,
                  dinner: status
                };
              });
              const updatedConfig: AutoDemandConfig = {
                enabled: targetUser.autoDemand?.enabled ?? true,
                schedule: updatedSchedule,
              };
              onUpdateAutoDemand(targetUser.id, updatedConfig);
              showToast(
                lang === 'bn'
                  ? `${targetUser.name} - এর জন্য পুরো সপ্তাহের সব বেলার মিল ${status ? 'চালু' : 'বন্ধ'} করা হয়েছে।`
                  : `Successfully toggled all weekly meals ${status ? 'ON' : 'OFF'} for ${targetUser.name}.`,
                'success'
              );
            };

            const toggleAutoDemandEnabled = () => {
              const currentEnabled = targetUser.autoDemand?.enabled ?? false;
              const updatedConfig: AutoDemandConfig = {
                enabled: !currentEnabled,
                schedule: schedule
              };
              onUpdateAutoDemand(targetUser.id, updatedConfig);
              showToast(
                lang === 'bn'
                  ? `${targetUser.name} - এর অটো ডিমান্ড সার্ভিস ${!currentEnabled ? 'চালু' : 'বন্ধ'} করা হয়েছে।`
                  : `Auto Demand Service for ${targetUser.name} has been ${!currentEnabled ? 'enabled' : 'disabled'}.`,
                !currentEnabled ? 'success' : 'info'
              );
            };

            const handleActivateRoommate = async (member: { staffId: string; name: string; department: string }) => {
              const activatedUser: User = {
                id: `user-${Date.now()}`,
                name: member.name,
                staffId: member.staffId,
                mobile: '01700000000',
                whatsapp: '01700000000',
                roomNumber: currentUser.roomNumber,
                department: member.department || 'General',
                idCardFront: 'https://via.placeholder.com/400x250?text=ID+Card+Front',
                idCardBack: 'https://via.placeholder.com/400x250?text=ID+Card+Back',
                status: 'approved', // instantly approved
                createdAt: new Date().toISOString(),
                autoDemand: {
                  enabled: true,
                  schedule: {
                    saturday: { breakfast: true, lunch: true, dinner: true },
                    sunday: { breakfast: true, lunch: true, dinner: true },
                    monday: { breakfast: true, lunch: true, dinner: true },
                    tuesday: { breakfast: true, lunch: true, dinner: true },
                    wednesday: { breakfast: true, lunch: true, dinner: true },
                    thursday: { breakfast: true, lunch: true, dinner: true },
                    friday: { breakfast: true, lunch: true, dinner: true },
                  }
                }
              };

              try {
                await saveDocToFirestore('users_db', activatedUser);
                setSelectedAutoUser(activatedUser.id);
                showToast(
                  lang === 'bn'
                    ? `${member.name} - এর অ্যাকাউন্ট সফলভাবে সক্রিয় করা হয়েছে! আপনি এখন তার শিডিউল সেট করতে পারবেন।`
                    : `Successfully activated account for ${member.name}! You can now customize their schedule.`,
                  'success'
                );
              } catch (err) {
                console.error("Failed to activate roommate:", err);
                showToast("Failed to activate roommate account.", "error");
              }
            };

            const weekdayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const currentDayKey = weekdayKeys[new Date().getDay()];

            return (
              <div className="bg-white border border-indigo-100 rounded-3xl p-5 sm:p-6 shadow-xl space-y-6" id="staff-auto-demand-panel">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-50 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <Sparkles className="w-5 h-5 animate-pulse" id="sparkles-icon" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                        {lang === 'bn' ? 'সাপ্তাহিক অটো ডিমান্ড শিডিউলার' : 'Weekly Auto Demand Scheduler'}
                        <span className="text-[9px] bg-indigo-50 text-indigo-700 font-extrabold px-2 py-0.5 rounded-lg border border-indigo-200">
                          {lang === 'bn' ? '৭ দিন সচল' : '7 Days Active'}
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-400 font-medium leading-tight text-left">
                        {lang === 'bn' ? 'রুমের যে কেউ সবার জন্য অটো ডিমান্ড এবং সাতদিনের শিডিউল পছন্দমত ঠিক করতে পারবেন।' : 'Manage 7-day automatic schedule and daily meals for anyone in your room.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ROOMMATE ID SELECTOR GRID / CARDS */}
                <div className="space-y-3">
                  <div className="text-[11px] font-extrabold text-slate-600 tracking-wider uppercase flex items-center justify-between">
                    <span>{lang === 'bn' ? 'রুমের সদস্য নির্বাচন করুন (Select Roommate):' : 'Select Room Member to Configure:'}</span>
                    <span className="text-[10px] font-mono text-indigo-600">{lang === 'bn' ? `রুম নং: ${currentUser.roomNumber}` : `Room: ${currentUser.roomNumber}`}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {roomMembers.map((member) => {
                      const registeredUser = users.find(u => u.staffId.toLowerCase() === member.staffId.toLowerCase());
                      const isRegistered = !!registeredUser;
                      const isApproved = registeredUser?.status === 'approved';
                      const isPending = registeredUser?.status === 'pending';
                      
                      const isActiveTarget = isRegistered 
                        ? targetUserId === registeredUser.id 
                        : false;

                      return (
                        <div
                          key={member.staffId}
                          onClick={() => {
                            if (isApproved && registeredUser) {
                              setSelectedAutoUser(registeredUser.id);
                            }
                          }}
                          className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all relative overflow-hidden ${
                            isApproved
                              ? isActiveTarget
                                ? 'bg-indigo-600 border-transparent text-white shadow-lg scale-[1.02]'
                                : 'bg-indigo-50/20 hover:bg-indigo-50/50 border-indigo-100 text-slate-700 cursor-pointer'
                              : 'bg-slate-50 border-slate-200 text-slate-500 opacity-80'
                          }`}
                        >
                          {/* Roommate Face Photo / Initial Avatar */}
                          {registeredUser?.userPhoto ? (
                            <img
                              src={registeredUser.userPhoto}
                              alt={member.name}
                              className={`w-9 h-9 rounded-full object-cover border-2 transition-all flex-shrink-0 ${
                                isActiveTarget ? 'border-white/40' : 'border-indigo-100'
                              }`}
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                                isActiveTarget ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm'
                              }`}
                            >
                              {member.name.charAt(0)}
                            </div>
                          )}

                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-[11px] font-black truncate leading-none ${isActiveTarget ? 'text-white' : 'text-slate-800'}`}>
                                {member.name}
                              </span>
                            </div>

                            <div className={`text-[9px] font-mono leading-none ${isActiveTarget ? 'text-indigo-100' : 'text-slate-400'}`}>
                              ID: {member.staffId}
                            </div>

                            <div className="flex items-center gap-1.5 pt-0.5">
                              {/* Status badges */}
                              {isApproved ? (
                                <span className={`text-[8px] font-bold px-1 rounded-md leading-none ${isActiveTarget ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                                  {lang === 'bn' ? 'সক্রিয়' : 'Active'}
                                </span>
                              ) : isPending ? (
                                <span className="text-[8px] font-bold px-1 rounded-md leading-none bg-amber-50 text-amber-700 border border-amber-200">
                                  {lang === 'bn' ? 'অপেক্ষমাণ' : 'Pending'}
                                </span>
                              ) : (
                                <span className="text-[8px] font-bold px-1 rounded-md leading-none bg-slate-100 text-slate-500 border border-slate-200">
                                  {lang === 'bn' ? 'নিবন্ধিত নয়' : 'Unregistered'}
                                </span>
                              )}
                            </div>

                            {/* Action Button for Unregistered Preloaded staff */}
                            {!isRegistered && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleActivateRoommate(member);
                                }}
                                className="mt-1 w-full bg-indigo-500 hover:bg-indigo-600 text-white text-[9px] font-black py-1 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <UserCheck className="w-2.5 h-2.5" />
                                {lang === 'bn' ? 'সক্রিয় করুন' : 'Activate'}
                              </button>
                            )}

                            {isPending && (
                              <div className="text-[9px] text-amber-600 font-extrabold italic">
                                {lang === 'bn' ? 'অনুমোদনের অপেক্ষা...' : 'Awaiting approval...'}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>


                {/* TARGET USER DETAILS & SCHEDULER SECTION */}
                <div className="border-t border-slate-100 pt-5 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                    <div className="text-left space-y-1">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                        {lang === 'bn' ? 'শিডিউল পরিবর্তন করা হচ্ছে:' : 'Modifying schedule for:'}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-800">{targetUser.name}</span>
                        <span className="text-[10px] font-mono bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md">
                          ID: {targetUser.staffId}
                        </span>
                      </div>
                    </div>

                    {/* Auto Demand Switch for Target User */}
                    <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-100 shadow-sm">
                      <span className="text-xs font-black text-slate-700">
                        {lang === 'bn' ? 'অটো ডিমান্ড সেবা:' : 'Auto Demand Status:'}
                      </span>
                      <button
                        onClick={toggleAutoDemandEnabled}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          targetUser.autoDemand?.enabled ? 'bg-indigo-600' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            targetUser.autoDemand?.enabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className={`text-[11px] font-black ${targetUser.autoDemand?.enabled ? 'text-indigo-600' : 'text-slate-400'}`}>
                        {targetUser.autoDemand?.enabled 
                          ? (lang === 'bn' ? 'চালু' : 'Enabled') 
                          : (lang === 'bn' ? 'বন্ধ' : 'Disabled')}
                      </span>
                    </div>
                  </div>

                  {targetUser.autoDemand?.enabled ? (
                    <div className="space-y-5 animate-in fade-in duration-300">
                      {/* Bulk actions */}
                      <div className="flex items-center gap-2.5">
                        <span className="text-[11px] font-extrabold text-slate-500">
                          {lang === 'bn' ? 'দ্রুত পরিবর্তন:' : 'Quick Actions:'}
                        </span>
                        <button
                          onClick={() => handleSetAll(true)}
                          className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 text-[10px] font-black px-3 py-1.5 rounded-xl transition duration-200 cursor-pointer"
                        >
                          {lang === 'bn' ? 'সব মিল চালু করুন' : 'Set All ON'}
                        </button>
                        <button
                          onClick={() => handleSetAll(false)}
                          className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-black px-3 py-1.5 rounded-xl transition duration-200 cursor-pointer"
                        >
                          {lang === 'bn' ? 'সব মিল বন্ধ করুন' : 'Set All OFF'}
                        </button>
                      </div>

                      {/* 7-DAY BENTO TIMETABLE GRID */}
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        {daysOfWeekList.map((day) => {
                          const daySchedule = schedule[day.key] || { breakfast: false, lunch: false, dinner: false };
                          
                          return (
                            <div 
                              key={day.key} 
                              className={`bg-slate-50/50 border border-slate-100 rounded-3xl p-4 space-y-4 hover:shadow-md transition-all duration-300 relative overflow-hidden ${
                                day.key === currentDayKey ? 'ring-2 ring-indigo-500 bg-indigo-50/10 border-indigo-100' : ''
                              }`}
                            >
                              {/* Highlight Today */}
                              {day.key === currentDayKey && (
                                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[8px] font-extrabold px-2.5 py-1 rounded-bl-2xl uppercase tracking-wider animate-pulse">
                                  {lang === 'bn' ? 'আজ' : 'Today'}
                                </div>
                              )}

                              {/* Day Label with elegant badge */}
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                  <span className="text-xs text-indigo-500">📅</span>
                                  <span>{lang === 'bn' ? day.labelBn : day.labelEn}</span>
                                </span>
                              </div>

                              <div className="flex flex-col gap-2">
                                {/* Breakfast */}
                                <button
                                  onClick={() => toggleMeal(day.key, 'breakfast')}
                                  className={`w-full py-2 px-3 rounded-xl border text-left flex items-center justify-between text-[10px] font-black transition-all duration-200 cursor-pointer ${
                                    daySchedule.breakfast 
                                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                                  }`}
                                >
                                  <span className="flex items-center gap-2">
                                    <span>🍳</span>
                                    <span>{lang === 'bn' ? 'সকাল' : 'Breakfast'}</span>
                                  </span>
                                  {daySchedule.breakfast && <span className="text-[9px] font-black">✓</span>}
                                </button>

                                {/* Lunch */}
                                <button
                                  onClick={() => toggleMeal(day.key, 'lunch')}
                                  className={`w-full py-2 px-3 rounded-xl border text-left flex items-center justify-between text-[10px] font-black transition-all duration-200 cursor-pointer ${
                                    daySchedule.lunch 
                                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                                  }`}
                                >
                                  <span className="flex items-center gap-2">
                                    <span>🍛</span>
                                    <span>{lang === 'bn' ? 'দুপুর' : 'Lunch'}</span>
                                  </span>
                                  {daySchedule.lunch && <span className="text-[9px] font-black">✓</span>}
                                </button>

                                {/* Dinner */}
                                <button
                                  onClick={() => toggleMeal(day.key, 'dinner')}
                                  className={`w-full py-2 px-3 rounded-xl border text-left flex items-center justify-between text-[10px] font-black transition-all duration-200 cursor-pointer ${
                                    daySchedule.dinner 
                                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                                  }`}
                                >
                                  <span className="flex items-center gap-2">
                                    <span>🍲</span>
                                    <span>{lang === 'bn' ? 'রাত' : 'Dinner'}</span>
                                  </span>
                                  {daySchedule.dinner && <span className="text-[9px] font-black">✓</span>}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="bg-indigo-50/50 rounded-2xl p-4 text-[11px] text-indigo-950 border border-indigo-100 flex gap-2.5 items-start leading-relaxed shadow-sm">
                        <span className="text-sm">💡</span>
                        <div className="space-y-1 text-left">
                          <strong className="block text-indigo-900 font-extrabold">
                            {lang === 'bn' ? 'সর্বোত্তম সমাধান বিবরণ (How it works):' : 'System Information:'}
                          </strong>
                          <p>
                            {lang === 'bn'
                              ? 'এই সিস্টেমে রুমের মেম্বারদের চাহিদা সম্পূর্ণ আলাদা থাকবে। রুমে ১ থেকে ৪ জন মেম্বার থাকলে প্রত্যেকেই নিজের বা রুমমেটের জন্য ৭ দিনের বারের খাবার (শনিবার থেকে শুক্রবার) কাস্টম উপায়ে নির্দিষ্ট করতে পারবেন। সিস্টেমটি সময়সীমার (Deadline) পূর্বে স্বয়ংক্রিয়ভাবে চাহিদাপত্র ডাটাবেজে যুক্ত করবে।'
                              : 'Each room member operates on an independent custom schedule. Roommates can manage individual 7-day timetables (Saturday to Friday) safely without overlapping or interfering.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-indigo-50/30 rounded-2xl p-6 border border-dashed border-indigo-200 text-center space-y-2">
                      <div className="text-xl">🤖</div>
                      <div className="font-extrabold text-xs text-indigo-950">
                        {lang === 'bn' ? `${targetUser.name} - এর জন্য অটো ডিমান্ড সার্ভিস বর্তমানে বন্ধ` : `Auto Demand Service for ${targetUser.name} is currently inactive`}
                      </div>
                      <p className="text-[10px] text-slate-500 max-w-md mx-auto leading-relaxed">
                        {lang === 'bn' 
                          ? 'এটি সচল করলে সিস্টেম নির্ধারিত খাবার বেলার সময়ের ডেডলাইন শেষ হওয়ার পূর্বেই স্বয়ংক্রিয়ভাবে তার ডিমান্ড ডাটাবেজে সাবমিট করে দেবে।'
                          : 'Enabling it allows the server engine to automatically submit their custom demands right before each meal’s deadline.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
          
          {/* DEMAND SUBMISSION BLOCK */}
          <div className="bg-white border border-orange-100 rounded-2xl p-4 sm:p-5 shadow-md space-y-4" id="staff-demand-system">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-orange-50 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                  <Calendar className="w-5 h-5" id="demand-calendar-icon" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    {t.mealDemandForm}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 inline-block">
                    Today: {todayStr}
                  </span>
                </div>
              </div>
              
              {/* Vibrant Food-themed Tabs */}
              <div className="flex bg-orange-50/50 p-1 border border-orange-100/50 rounded-xl self-start sm:self-auto">
                {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((mType) => (
                  <button
                    key={mType}
                    onClick={() => {
                      setActiveMealTab(mType);
                      setSelectedRoomMembers([]);
                      setManualSelectedMembers([]);
                    }}
                    className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeMealTab === mType
                        ? 'bg-gradient-to-r from-orange-600 to-amber-500 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {mType === 'breakfast' && '🍳'}
                    {mType === 'lunch' && '🍛'}
                    {mType === 'dinner' && '🍲'}
                    {t[mType]}
                  </button>
                ))}
              </div>
            </div>

            {/* Meal Time Constraint Info Box */}
            <div className="bg-gradient-to-r from-orange-50/40 to-amber-50/40 rounded-2xl p-4 flex gap-3 border border-orange-100/50">
              <Clock className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5 animate-pulse" id="clock-meta-icon" />
              <div className="text-xs space-y-1 text-slate-600 leading-relaxed">
                <div>
                  <strong className="text-orange-900">{t[activeMealTab]} সময়সীমা:</strong>{' '}
                  <span className="font-mono bg-white border border-orange-100 px-2 py-0.5 rounded text-xs text-orange-600 font-bold">
                    {timeSettings.find((s) => s.mealType === activeMealTab)?.startTime} -{' '}
                    {timeSettings.find((s) => s.mealType === activeMealTab)?.endTime}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium leading-normal">{t.roomLockNotice}</div>
              </div>
            </div>

            {/* MANUAL DEMAND SECTION FOR OTHER MEMBERS */}
            {!isRoomLocked(activeMealTab) && isTimeActive(activeMealTab) && (
              <div className="border border-indigo-100 bg-indigo-50/15 rounded-2xl p-4 space-y-3.5 shadow-sm" id="manual-demand-block">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Utensils className="w-4.5 h-4.5 text-indigo-600 animate-bounce" />
                    <span className="text-xs font-black text-indigo-950">
                      {lang === 'bn' ? 'মেনুয়ালি ডিমান্ড করার অপশন' : 'Manual Demand Option'}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {lang === 'bn' ? `${t[activeMealTab]} এর জন্য` : `For ${activeMealTab}`}
                  </span>
                </div>

                {/* Other room members with checkbox */}
                {(() => {
                  const otherMembers = getRoomMembers().filter(
                    (m) => m.staffId.toLowerCase() !== currentUser?.staffId.toLowerCase()
                  );

                  if (otherMembers.length === 0) {
                    return (
                      <div className="text-[11px] text-indigo-500 italic py-2 text-center">
                        {lang === 'bn' ? 'রুমে অন্যান্য কোনো সদস্য নেই।' : 'No other room members found.'}
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      <div className="text-[11px] font-bold text-slate-500">
                        {lang === 'bn' ? 'রুমের অন্যান্য সদস্য তালিকা (টিক খালি ঘর):' : 'Other room members list (Empty tick box):'}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {otherMembers.map((member) => {
                          const isSelected = manualSelectedMembers.includes(member.staffId);
                          const registeredUser = users.find(u => u.staffId.toLowerCase() === member.staffId.toLowerCase());
                          const isApprovedUser = registeredUser?.status === 'approved';

                          return (
                            <button
                              key={member.staffId}
                              type="button"
                              onClick={() => {
                                if (manualSelectedMembers.includes(member.staffId)) {
                                  setManualSelectedMembers(manualSelectedMembers.filter(id => id !== member.staffId));
                                } else {
                                  setManualSelectedMembers([...manualSelectedMembers, member.staffId]);
                                }
                              }}
                              className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 border-transparent text-white shadow'
                                  : 'bg-white hover:bg-indigo-50/30 border-indigo-100 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                {registeredUser?.userPhoto ? (
                                  <img
                                    src={registeredUser.userPhoto}
                                    alt={member.name}
                                    className={`w-8 h-8 rounded-full object-cover border transition-all ${
                                      isSelected ? 'border-white' : 'border-indigo-100'
                                    }`}
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                      isSelected ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'
                                    }`}
                                  >
                                    {member.name.charAt(0)}
                                  </div>
                                )}
                                <div>
                                  <div className="text-xs font-black leading-tight flex items-center gap-1">
                                    {member.name}
                                    {registeredUser && (
                                      <span 
                                        className={`w-1.5 h-1.5 rounded-full ${
                                          isApprovedUser ? 'bg-emerald-400' : 'bg-amber-400'
                                        }`} 
                                      />
                                    )}
                                  </div>
                                  <div className={`text-[9px] font-mono mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                                    ID: {member.staffId}
                                  </div>
                                </div>
                              </div>

                              {/* Ticket check-box */}
                              <div>
                                {isSelected ? (
                                  <div className="w-4 h-4 rounded-full bg-white text-indigo-600 flex items-center justify-center shadow">
                                    <CheckSquare className="w-3.5 h-3.5" />
                                  </div>
                                ) : (
                                  <Square className="w-4 h-4 text-indigo-300" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Submit Demand button */}
                      <button
                        type="button"
                        onClick={handleManualDemandSubmit}
                        className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition shadow flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer text-xs"
                      >
                        <Utensils className="w-4 h-4 text-white" />
                        <span>{lang === 'bn' ? 'ডিমান্ড করুন' : 'Submit Demand'}</span>
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Locked vs Open Demand Logic */}
            {isRoomLocked(activeMealTab) ? (
              (() => {
                const activeRoomDemands = getActiveRoomDemands(activeMealTab);
                const isPending = activeRoomDemands.some(d => d.status === 'pending');
                const isApproved = !isPending && activeRoomDemands.some(d => d.status === 'approved');
                const isServed = !isPending && activeRoomDemands.every(d => d.status === 'served');
                
                const uniqueDemandedStaffIds: string[] = Array.from(
                  new Set(activeRoomDemands.flatMap(d => d.selectedStaffIds))
                );

                const representativeDemand = activeRoomDemands[0];
                
                return (
                  <div className="border border-orange-100 bg-orange-50/10 rounded-2xl p-6 text-center space-y-4 shadow-sm relative overflow-hidden">
                    {/* Glowing side color strips */}
                    <div className={`absolute top-0 bottom-0 left-0 w-2 ${
                      isServed ? 'bg-emerald-500' : isApproved ? 'bg-indigo-500' : 'bg-amber-500'
                    }`}></div>

                    <div className="flex flex-col items-center justify-center gap-2">
                      {isServed ? (
                        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 animate-bounce">
                          <CheckCircle className="w-7 h-7" />
                        </div>
                      ) : isApproved ? (
                        <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
                          <CheckCircle className="w-7 h-7" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 animate-pulse">
                          <Clock className="w-7 h-7" />
                        </div>
                      )}
                      
                      <h4 className="font-extrabold text-sm text-slate-800">
                        {isServed 
                          ? (lang === 'bn' ? '🍛 খাবার বিতরণ সম্পূর্ণ!' : '🍛 Meals Served & Logged!')
                          : isApproved 
                          ? (lang === 'bn' ? '👍 ডিমান্ড এডমিন দ্বারা অনুমোদিত!' : '👍 Demand Approved by Admin!')
                          : (lang === 'bn' ? '⏳ খাবার ডিমান্ড অনুমোদন পেন্ডিং' : '⏳ Food Demand Pending Admin Approval')}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {lang === 'bn' ? `আপনার রুম ${currentUser.roomNumber} এর ডিমান্ড লক করা হয়েছে।` : `Demand locked for Room ${currentUser.roomNumber}.`}
                      </p>
                    </div>

                    <div className="border-t border-orange-50 pt-4">
                      <div className="text-xs font-bold text-slate-700 mb-3 text-left px-1 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-orange-500" />
                        {lang === 'bn' ? 'রুমে খাবার গ্রহণকারী সদস্যদের তালিকা ও স্ট্যাটাস:' : 'Room Members Meal Status:'}
                      </div>

                      {/* STUNNING VISUAL CARD GRID representing member statuses */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {uniqueDemandedStaffIds.map((sid) => {
                          const matchedUser = users.find((u) => u.staffId.toLowerCase() === sid.toLowerCase());
                          const staffDem = activeRoomDemands.find(d => d.selectedStaffIds.includes(sid));
                          const isStaffServed = staffDem?.status === 'served';
                          const isStaffApproved = staffDem?.status === 'approved';
                          
                          return (
                            <div 
                              key={sid} 
                              className={`bg-white border rounded-2xl p-3 flex items-center gap-3.5 shadow-sm transition-all relative overflow-hidden ${
                                isStaffServed 
                                  ? 'border-emerald-200 bg-emerald-50/5' 
                                  : isStaffApproved 
                                  ? 'border-indigo-100 bg-indigo-50/5' 
                                  : 'border-orange-100'
                              }`}
                            >
                              {/* Member Face Photo */}
                              {matchedUser?.userPhoto ? (
                                <img 
                                  src={matchedUser.userPhoto} 
                                  alt={matchedUser.name} 
                                  className="w-11 h-11 rounded-full object-cover border-2 border-orange-100 flex-shrink-0 cursor-zoom-in"
                                  onClick={() => setViewingPhotoUrl(matchedUser.userPhoto)}
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-full bg-orange-100 text-orange-600 font-extrabold text-sm flex items-center justify-center flex-shrink-0 border-2 border-orange-200">
                                  {matchedUser?.name ? matchedUser.name.charAt(0) : sid.charAt(0)}
                                </div>
                              )}

                              <div className="text-left space-y-0.5">
                                <div className="text-xs font-black text-slate-800 leading-tight">
                                  {matchedUser?.name || sid}
                                </div>
                                <div className="text-[10px] font-mono text-slate-400">
                                  ID: {sid}
                                </div>
                                
                                {/* Status badge indicating exact status */}
                                <div className="pt-1">
                                  {isStaffServed ? (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 animate-pulse">
                                      ✅ {lang === 'bn' ? 'খাওয়া শেষ' : 'Dined'}
                                      {staffDem?.servedAt && ` (${new Date(staffDem.servedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})`}
                                    </span>
                                  ) : isStaffApproved ? (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                                      ✅ {lang === 'bn' ? 'অনুমোদিত' : 'Approved'}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                                      ⏳ {lang === 'bn' ? 'অপেক্ষমাণ' : 'Pending'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono flex items-center justify-center gap-1.5 pt-2 border-t border-orange-50">
                      <span>Submitted by: <strong>{representativeDemand?.submittedByName}</strong></span>
                      <span>•</span>
                      <span>Time: <strong>{representativeDemand?.timestamp ? new Date(representativeDemand.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</strong></span>
                    </div>
                  </div>
                );
              })()
            ) : !isTimeActive(activeMealTab) ? (
              <div className="bg-rose-50/50 border border-rose-100 text-rose-800 rounded-3xl p-6 text-center flex flex-col items-center justify-center gap-3 shadow-inner">
                <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-500">
                  <Lock className="w-7 h-7" />
                </div>
                <h4 className="font-extrabold text-sm text-rose-900">{t.outsideTimeLimit}</h4>
                <p className="text-xs text-rose-600 max-w-sm leading-relaxed">
                  {lang === 'bn'
                    ? 'দুঃখিত, এই মিলের জন্য ডিমান্ড দেওয়ার সময়সীমা শেষ বা এখনো শুরু হয়নি। দয়া করে নির্ধারিত সময়ে চেষ্টা করুন।'
                    : 'Sorry, the demand timeframe for this meal is closed or has not started yet. Please check again during open hours.'}
                </p>
              </div>
            ) : (
              // Demand Submission Checklist is ACTIVE & OPEN
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-orange-500" />
                  {t.selectMembers}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {getRoomMembers().map((member) => {
                    const isSelected = selectedRoomMembers.includes(member.staffId);
                    const registeredUser = users.find(u => u.staffId.toLowerCase() === member.staffId.toLowerCase());
                    const isApprovedUser = registeredUser?.status === 'approved';

                    return (
                      <button
                        key={member.staffId}
                        onClick={() => toggleRoomMemberSelection(member.staffId)}
                        className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer relative overflow-hidden ${
                          isSelected
                            ? 'bg-gradient-to-tr from-orange-600 to-amber-500 border-transparent text-white shadow-lg hover:brightness-105'
                            : 'bg-slate-50 hover:bg-orange-50/20 border-orange-100/50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {registeredUser?.userPhoto ? (
                            <img
                              src={registeredUser.userPhoto}
                              alt={member.name}
                              className={`w-10 h-10 rounded-full object-cover border-2 transition-all ${
                                isSelected ? 'border-white' : 'border-orange-100'
                              }`}
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                                isSelected ? 'bg-white/20 text-white border border-white/20' : 'bg-white text-slate-600 border border-slate-200 shadow-sm'
                              }`}
                            >
                              {member.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className="text-xs font-black leading-tight flex items-center gap-1.5">
                              {member.name}
                              {registeredUser && (
                                <span 
                                  className={`w-2 h-2 rounded-full ${
                                    isApprovedUser ? 'bg-emerald-400' : 'bg-amber-400'
                                  }`} 
                                  title={isApprovedUser ? 'Approved Account' : 'Verification Pending'} 
                                />
                              )}
                            </div>
                            <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-orange-100 font-bold' : 'text-slate-400'}`}>
                              ID: {member.staffId}
                            </div>
                          </div>
                        </div>

                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-white text-orange-600 flex items-center justify-center shadow">
                            <CheckSquare className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <Square className="w-5 h-5 text-slate-300" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleDemandSubmit}
                  className="w-full bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold py-4 rounded-2xl transition shadow-xl hover:shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
                >
                  <Utensils className="w-5 h-5 text-amber-200 animate-spin-once" />
                  {t.submitDemand}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Notice Board & Live Meal Status */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* NOTICE BOARD */}
          <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-xl space-y-4" id="staff-notice-board">
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-orange-500" id="notice-icon" />
              {t.todayNotice}
            </h3>
            <div className="space-y-3">
              {notices.length === 0 ? (
                <div className="text-slate-400 text-xs italic bg-slate-50 rounded-2xl p-4 border border-orange-50 text-center">
                  {lang === 'bn' ? 'আজকের কোনো নোটিশ নেই।' : 'No announcements for today.'}
                </div>
              ) : (
                notices.map((n) => (
                  <div key={n.id} className="bg-orange-50/15 border-l-4 border-orange-500 rounded-r-2xl p-4 space-y-1 shadow-sm border border-orange-100/40">
                    <h4 className="text-xs font-extrabold text-slate-800 leading-tight">{n.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{n.content}</p>
                    <div className="text-[9px] text-slate-400 pt-1 font-mono">{n.date}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* LIVE TRACKER FOR MEALS with Expanded Detail views */}
          <div className="bg-white border border-orange-100 rounded-3xl p-6 shadow-xl space-y-4 animate-in fade-in duration-300" id="staff-meal-status">
            <div>
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" id="live-tracker-check" />
                {t.mealStatus}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">
                {lang === 'bn' ? 'মিলের পাশে ক্লিক করে দেখুন কে খাবার খেয়েছে আর কে খায়নি।' : 'Click on any meal to see who ate and who has not.'}
              </p>
            </div>

            <div className="space-y-3">
              {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((mType) => {
                const roomDems = demands.filter(
                  (d) =>
                    d.roomNumber === currentUser.roomNumber &&
                    d.mealType === mType &&
                    d.date === todayStr &&
                    d.status !== 'rejected'
                );
                
                const hasDems = roomDems.length > 0;
                let statusBg = 'bg-slate-50 border-orange-100/30 text-slate-400';
                let label = lang === 'bn' ? 'ডিমান্ড দেওয়া হয়নি' : 'No Demand';
                let colorClass = 'text-slate-400';

                if (hasDems) {
                  const isAnyPending = roomDems.some(d => d.status === 'pending');
                  const isAnyApproved = roomDems.some(d => d.status === 'approved');
                  const isAllServed = roomDems.every(d => d.status === 'served');

                  if (isAnyPending) {
                    statusBg = 'bg-amber-500/10 border-amber-200 text-amber-800';
                    label = lang === 'bn' ? '⏳ অপেক্ষমান' : '⏳ Pending';
                    colorClass = 'text-amber-600';
                  } else if (isAnyApproved) {
                    statusBg = 'bg-indigo-50 border-indigo-200 text-indigo-800';
                    label = lang === 'bn' ? '👍 অনুমোদিত' : '👍 Approved';
                    colorClass = 'text-indigo-600';
                  } else if (isAllServed) {
                    statusBg = 'bg-emerald-50 border-emerald-200 text-emerald-800';
                    const servedDem = roomDems.find(d => d.status === 'served');
                    const formatTime = servedDem?.servedAt ? new Date(servedDem.servedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
                    label = lang === 'bn' ? `✅ বিতরণকৃত (${formatTime})` : `✅ Served (${formatTime})`;
                    colorClass = 'text-emerald-600';
                  }
                }

                const isExpanded = expandedMealType === mType;

                return (
                  <div key={mType} className={`border rounded-2xl overflow-hidden transition-all duration-300 ${statusBg}`}>
                    <button 
                      onClick={() => setExpandedMealType(isExpanded ? null : mType)}
                      className="w-full text-left p-4 flex items-center justify-between cursor-pointer focus:outline-none"
                    >
                      <div className="flex items-center gap-2.5">
                        {getMealIcon(mType)}
                        <div>
                          <div className={`text-xs font-extrabold uppercase tracking-wider ${colorClass}`}>{t[mType]}</div>
                          <div className="text-[10px] opacity-75 mt-0.5">
                            {hasDems ? `${lang === 'bn' ? 'ডিমান্ড সদস্য:' : 'Selected:'} ${roomDems.reduce((sum, d) => sum + d.selectedStaffIds.length, 0)} জন` : ''}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-white/75 backdrop-blur shadow-sm border border-orange-50">
                          {label}
                        </div>
                        {hasDems && (isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                      </div>
                    </button>

                    {/* Detailed member view dropdown */}
                    {hasDems && isExpanded && (
                      <div className="bg-white/80 p-3.5 border-t border-orange-50 space-y-2.5 animate-in slide-in-from-top-2 duration-200">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">
                          {lang === 'bn' ? 'রুম মেম্বার স্ট্যাটাস:' : 'Room Member Details:'}
                        </div>
                        
                        <div className="space-y-2">
                          {roomDems.flatMap(d => d.selectedStaffIds).map((sid) => {
                            const foundUser = users.find(u => u.staffId.toLowerCase() === sid.toLowerCase());
                            const staffDem = roomDems.find(d => d.selectedStaffIds.includes(sid));
                            const ate = staffDem?.status === 'served';
                            const approved = staffDem?.status === 'approved';
                            
                            return (
                              <div key={sid} className="flex items-center justify-between bg-white border border-orange-100/30 p-2 rounded-xl shadow-sm">
                                <div className="flex items-center gap-2.5">
                                  {foundUser?.userPhoto ? (
                                    <img 
                                      src={foundUser.userPhoto} 
                                      alt={sid} 
                                      className="w-7 h-7 rounded-full object-cover border border-orange-100"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 font-extrabold text-[10px] flex items-center justify-center">
                                      {foundUser?.name ? foundUser.name.charAt(0) : sid.charAt(0)}
                                    </div>
                                  )}
                                  <div>
                                    <div className="text-xs font-bold text-slate-800 leading-none">{foundUser?.name || sid}</div>
                                    <div className="text-[9px] font-mono text-slate-400 mt-1">ID: {sid}</div>
                                  </div>
                                </div>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border ${
                                  ate 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                    : approved 
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                }`}>
                                  {ate ? (lang === 'bn' ? '✅ খাওয়া শেষ' : '✅ Ate') : approved ? (lang === 'bn' ? 'অনুমোদিত' : 'Approved') : (lang === 'bn' ? '⏳ অপেক্ষমাণ' : '⏳ Waiting')}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* FLOATING CIRCULAR SUPPORT CHAT FOR RESIDENTS (Requested Popup System!) */}
      <ChatPanel
        messages={chats}
        currentUserId={currentUser.id}
        activeChatUserId="admin"
        activeChatUserName="Quarter Admin Helpdesk"
        onSendMessage={onSendChatMessage}
        lang={lang}
        variant="floating"
      />

      {/* FULL PHOTO VIEWER DIALOG (Light Box Zoom) */}
      {viewingPhotoUrl && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative max-w-full max-h-full">
            <button 
              onClick={() => setViewingPhotoUrl(null)} 
              className="absolute -top-12 right-0 bg-white hover:bg-orange-50 text-slate-800 p-2 rounded-full cursor-pointer shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={viewingPhotoUrl} 
              alt="Zoomed" 
              className="max-w-[90vw] max-h-[80vh] rounded-2xl object-contain border-4 border-white/90 shadow-2xl animate-in zoom-in-95 duration-200"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}

      {/* SYSTEM TOAST NOTIFICATIONS */}
      {toastMessage && (
        <div 
          className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur-md border border-slate-800 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-sm"
          id="staff-portal-toast"
        >
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs ${
            toastType === 'error' ? 'bg-rose-500/20 text-rose-400' : toastType === 'info' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            {toastType === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          </div>
          <span className="text-[11px] font-bold leading-tight">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
