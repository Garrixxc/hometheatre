export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: any; // Firestore Timestamp
  type: 'message' | 'system';
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  status: 'online' | 'offline';
  lastSeen: any;
  subscriptions?: string[]; // ['netflix', 'disney', 'youtube', etc]
}

export interface QueueItem {
  id: string;
  title: string;
  videoUrl: string;
  thumbnail?: string;
}

export interface Room {
  id: string;
  title: string;
  description?: string;
  hostId: string;
  hostName: string;
  thumbnail?: string;
  type: 'movie' | 'gaming' | 'youtube' | 'netflix' | 'disney' | 'prime' | 'hulu' | 'hbo' | 'twitch' | 'crunchyroll';
  platform?: string;
  participantsCount: number;
  createdAt: any;
  currentMedia?: string;
  playbackState: 'playing' | 'paused';
  currentTime: number;
  videoUrl?: string;
  mutedUsers?: string[];
  kickedUsers?: string[];
  queue?: QueueItem[];
}

export interface Friend {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline';
  lastSeen?: any;
}

export interface Activity {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  action: string;
  target: string;
  comment?: string;
  thumbnail?: string;
  timestamp: any;
}

export interface Invitation {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  roomId: string;
  roomTitle?: string;
  status: 'pending' | 'accepted' | 'declined';
  timestamp: any;
}

export type View = 'home' | 'social' | 'watch' | 'sources' | 'profile' | 'notifications';
