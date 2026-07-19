/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PreLoadedStaff, User, MealDemand, Notice, ChatMessage, TimeSetting, ActivityLog, FoodMenuItem } from './types';

export const INITIAL_PRELOADED_STAFF: PreLoadedStaff[] = [
  { id: '1', staffId: 'ST-101', name: 'Sohel Rana', roomNumber: '10', department: 'Electrical' },
  { id: '2', staffId: 'ST-102', name: 'Rafiqul Islam', roomNumber: '10', department: 'Plumbing' },
  { id: '3', staffId: 'ST-103', name: 'Hridoy Ahmed', roomNumber: '10', department: 'Electrical' },
  { id: '4', staffId: 'ST-104', name: 'Hasan Ali', roomNumber: '10', department: 'Security' },
  { id: '5', staffId: 'ST-105', name: 'Abir Hasan', roomNumber: '1', department: 'IT' },
  { id: '6', staffId: 'ST-106', name: 'Rakibul Islam', roomNumber: '1', department: 'IT' },
  { id: '7', staffId: 'ST-107', name: 'Arif Hossain', roomNumber: '2', department: 'Maintenance' },
  { id: '8', staffId: 'ST-108', name: 'Kamal Uddin', roomNumber: '2', department: 'Catering' },
  { id: '9', staffId: 'ST-109', name: 'Sujon Mia', roomNumber: '3', department: 'Plumbing' },
  { id: '10', staffId: 'ST-110', name: 'Milon Kanti', roomNumber: '3', department: 'Security' },
  { id: '11', staffId: 'ST-111', name: 'Biplob Das', roomNumber: '4', department: 'Admin' },
  { id: '12', staffId: 'ST-112', name: 'Imran Khan', roomNumber: '4', department: 'Electrical' },
  { id: '13', staffId: 'ST-113', name: 'Sabbir Rahman', roomNumber: '12', department: 'Maintenance' },
  { id: '14', staffId: 'ST-114', name: 'Tariqul Islam', roomNumber: '12', department: 'Security' },
  { id: '15', staffId: 'ST-115', name: 'Mominul Haque', roomNumber: '12', department: 'IT' }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'u101',
    name: 'Sohel Rana',
    staffId: 'ST-101',
    mobile: '01712345678',
    whatsapp: '01712345678',
    roomNumber: '10',
    department: 'Electrical',
    idCardFront: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&auto=format&fit=crop&q=60',
    idCardBack: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&auto=format&fit=crop&q=60',
    status: 'approved',
    createdAt: '2026-07-15T08:30:00Z'
  },
  {
    id: 'u102',
    name: 'Rafiqul Islam',
    staffId: 'ST-102',
    mobile: '01812345678',
    whatsapp: '01812345678',
    roomNumber: '10',
    department: 'Plumbing',
    idCardFront: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&auto=format&fit=crop&q=60',
    idCardBack: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&auto=format&fit=crop&q=60',
    status: 'approved',
    createdAt: '2026-07-15T09:15:00Z'
  },
  {
    id: 'u103',
    name: 'Hridoy Ahmed',
    staffId: 'ST-103',
    mobile: '01912345678',
    whatsapp: '01912345678',
    roomNumber: '10',
    department: 'Electrical',
    idCardFront: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&auto=format&fit=crop&q=60',
    idCardBack: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&auto=format&fit=crop&q=60',
    status: 'pending',
    createdAt: '2026-07-18T06:45:00Z'
  },
  {
    id: 'u105',
    name: 'Abir Hasan',
    staffId: 'ST-105',
    mobile: '01512345678',
    whatsapp: '01512345678',
    roomNumber: '1',
    department: 'IT',
    idCardFront: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&auto=format&fit=crop&q=60',
    idCardBack: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&auto=format&fit=crop&q=60',
    status: 'approved',
    createdAt: '2026-07-16T10:00:00Z'
  },
  {
    id: 'u108',
    name: 'Kamal Uddin',
    staffId: 'ST-108',
    mobile: '01612345678',
    whatsapp: '01612345678',
    roomNumber: '2',
    department: 'Catering',
    idCardFront: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&auto=format&fit=crop&q=60',
    idCardBack: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400&auto=format&fit=crop&q=60',
    status: 'approved',
    createdAt: '2026-07-16T11:20:00Z'
  }
];

export const INITIAL_DEMANDS: MealDemand[] = [
  {
    id: 'd1',
    roomNumber: '10',
    mealType: 'breakfast',
    date: '2026-07-18',
    selectedStaffIds: ['ST-101', 'ST-102'],
    submittedBy: 'ST-101',
    submittedByName: 'Sohel Rana',
    status: 'served',
    timestamp: '2026-07-18T06:30:00Z',
    servedAt: '2026-07-18T07:15:00Z'
  },
  {
    id: 'd2',
    roomNumber: '1',
    mealType: 'breakfast',
    date: '2026-07-18',
    selectedStaffIds: ['ST-105'],
    submittedBy: 'ST-105',
    submittedByName: 'Abir Hasan',
    status: 'served',
    timestamp: '2026-07-18T07:05:00Z',
    servedAt: '2026-07-18T07:45:00Z'
  },
  {
    id: 'd3',
    roomNumber: '10',
    mealType: 'lunch',
    date: '2026-07-18',
    selectedStaffIds: ['ST-101', 'ST-102'],
    submittedBy: 'ST-101',
    submittedByName: 'Sohel Rana',
    status: 'pending',
    timestamp: '2026-07-18T10:15:00Z'
  },
  {
    id: 'd4',
    roomNumber: '2',
    mealType: 'breakfast',
    date: '2026-07-18',
    selectedStaffIds: ['ST-108'],
    submittedBy: 'ST-108',
    submittedByName: 'Kamal Uddin',
    status: 'rejected',
    timestamp: '2026-07-18T08:15:00Z'
  }
];

export const INITIAL_NOTICES: Notice[] = [
  {
    id: 'n1',
    title: 'খাবারের সময়সূচী পরিবর্তন সংক্রান্ত নোটিশ',
    content: 'সকল কোয়ার্টার বাসিন্দাদের অবগতির জন্য জানানো যাচ্ছে যে, আগামীকাল থেকে দুপুরের খাবারের ডিমান্ড দেওয়ার সময় সকাল ১০:০০ টা থেকে দুপুর ১২:০০ টা পর্যন্ত কার্যকর থাকবে। সময়ের পরে কোন ডিমান্ড নেওয়া হবে না।',
    date: '2026-07-18'
  },
  {
    id: 'n2',
    title: 'আজ রাতের বিশেষ খাবার',
    content: 'আজ রাতে ডিনারে স্পেশাল চিকেন বিরিয়ানি পরিবেশন করা হবে। সবাই সময়মত ডিমান্ড সাবমিট নিশ্চিত করুন।',
    date: '2026-07-18'
  }
];

export const INITIAL_CHATS: ChatMessage[] = [
  {
    id: 'c1',
    senderId: 'u101',
    senderName: 'Sohel Rana',
    receiverId: 'admin',
    text: 'আসসালামু আলাইকুম, আজ আমাদের রুমে একজন অতিথি থাকবেন। উনার খাবার কি অর্ডার করা যাবে?',
    timestamp: '2026-07-18T08:35:00Z',
    isAdmin: false
  },
  {
    id: 'c2',
    senderId: 'admin',
    senderName: 'Admin',
    receiverId: 'u101',
    text: 'ওয়ালাইকুম আসসালাম। হ্যাঁ, আপনি আপনার রুমের অন্য সদস্যদের সাথে অতিথিকে যুক্ত করে ডিমান্ড লিস্টে সাবমিট করতে পারেন। অথবা সরাসরি গেস্ট মিল হিসেবে অ্যাডমিনের সাথে যোগাযোগ করুন।',
    timestamp: '2026-07-18T08:40:00Z',
    isAdmin: true
  },
  {
    id: 'c3',
    senderId: 'u105',
    senderName: 'Abir Hasan',
    receiverId: 'admin',
    text: 'আমার আইডি কার্ড ভেরিফিকেশন কতক্ষণ সময় লাগবে?',
    timestamp: '2026-07-18T09:10:00Z',
    isAdmin: false
  },
  {
    id: 'c4',
    senderId: 'admin',
    senderName: 'Admin',
    receiverId: 'u105',
    text: 'আপনার একাউন্ট যাচাই করা হয়েছে এবং সাকসেসফুলি অ্যাপ্রুভ করা হয়েছে। এখন আপনি ডিমান্ড দিতে পারবেন।',
    timestamp: '2026-07-18T09:12:00Z',
    isAdmin: true
  }
];

export const INITIAL_TIME_SETTINGS: TimeSetting[] = [
  { mealType: 'breakfast', startTime: '06:00', endTime: '08:00' },
  { mealType: 'lunch', startTime: '10:00', endTime: '12:00' },
  { mealType: 'dinner', startTime: '16:00', endTime: '18:00' }
];

export const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'l1',
    action: 'System Startup',
    details: 'Bagdi Quarter Food Manager App initialized.',
    timestamp: '2026-07-18T00:01:00Z',
    user: 'System'
  },
  {
    id: 'l2',
    action: 'User Registered',
    details: 'Hridoy Ahmed (ST-103) submitted registration request for Room 10.',
    timestamp: '2026-07-18T06:45:00Z',
    user: 'Hridoy Ahmed'
  },
  {
    id: 'l3',
    action: 'Demand Received',
    details: 'Sohel Rana submitted Breakfast demand for Room 10 (2 plates).',
    timestamp: '2026-07-18T06:30:00Z',
    user: 'Sohel Rana'
  },
  {
    id: 'l4',
    action: 'Food Distributed',
    details: 'Breakfast served for Room 10.',
    timestamp: '2026-07-18T07:15:00Z',
    user: 'Admin'
  }
];

export const INITIAL_FOOD_MENU: FoodMenuItem[] = [
  {
    id: 'breakfast',
    img: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=600&q=80',
    titleBn: 'সুস্বাদু সকালের নাস্তা',
    titleEn: 'Elite Breakfast',
    descBn: 'গরম গরম লুচি, ডাল ভাজি ও ডিম ভাজি।',
    descEn: 'Warm parathas, savory vegetable fry & eggs.',
    hidden: false,
    category: 'breakfast'
  },
  {
    id: 'lunch',
    img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    titleBn: 'তৃপ্তিদায়ক দুপুরের খাবার',
    titleEn: 'Royal Lunch Feast',
    descBn: 'সুগন্ধি চাল, কষা মুরগি ও ঘন ডাল।',
    descEn: 'Steaming rice, aromatic chicken & rich lentils.',
    hidden: false,
    category: 'lunch'
  },
  {
    id: 'dinner',
    img: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    titleBn: 'রাজকীয় রাতের খাবার',
    titleEn: 'Gourmet Dinner',
    descBn: 'তুলতুলে রুটি, মশলাদার তরকারি ও সালাদ।',
    descEn: 'Handmade roti, flavorful curry & salads.',
    hidden: false,
    category: 'dinner'
  }
];
