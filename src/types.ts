/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DaySchedule {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
}

export interface AutoDemandConfig {
  enabled: boolean;
  schedule?: {
    sunday: DaySchedule;
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
  };
}

export type UserStatus = 'pending' | 'approved' | 'rejected' | 'blocked';

export interface User {
  id: string;
  name: string;
  staffId: string;
  mobile: string;
  whatsapp: string;
  roomNumber: string;
  department: string;
  idCardFront: string; // Base64 or mock placeholder URL
  idCardBack: string;  // Base64 or mock placeholder URL
  userPhoto?: string;  // Resident's face photo (নিজের ছবি) - Base64 or mock placeholder URL
  status: UserStatus;
  createdAt: string;
  autoDemand?: AutoDemandConfig;
}

export interface RegistrationInput {
  name: string;
  staffId: string;
  mobile: string;
  whatsapp: string;
  roomNumber: string;
  department: string;
  idCardFront: string;
  idCardBack: string;
  userPhoto: string;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface MealDemand {
  id: string;
  roomNumber: string;
  mealType: MealType;
  date: string; // YYYY-MM-DD
  selectedStaffIds: string[]; // List of Staff IDs who want this meal
  submittedBy: string; // Staff ID of the representative who submitted
  submittedByName: string; // Name of the representative
  status: 'pending' | 'approved' | 'served' | 'rejected';
  timestamp: string; // Time of demand submission
  servedAt?: string; // Time when served
}

export interface PreLoadedStaff {
  id: string;
  staffId: string;
  name: string;
  roomNumber: string;
  department: string;
}

export interface TimeSetting {
  mealType: MealType;
  startTime: string; // "HH:MM" 24h
  endTime: string;   // "HH:MM" 24h
}

export interface ChatMessage {
  id: string;
  senderId: string; // User ID or 'admin'
  senderName: string;
  receiverId: string; // User ID or 'admin'
  text: string;
  timestamp: string;
  isAdmin: boolean;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  date: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  user: string;
}

export interface FoodMenuItem {
  id: string;
  img: string;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  hidden?: boolean;
  category?: MealType;
}

export interface RoomConfig {
  id: string;
  roomNumber: string;
  hidden: boolean;
}
