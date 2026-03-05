export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
  isLoading?: boolean;
  avatar?: string;
}

export interface VoiceSettings {
  voiceName?: string;  // Specific voice to use
  pitch?: number;      // Voice pitch (0.5 to 2)
  rate?: number;       // Speaking rate (0.1 to 10)
  lang?: string;       // Language code
}

export interface Character {
  id: string;
  name: string;
  avatar: string; // Emoji or simple character
  bio: string;
  personalityPrompt: string; // System prompt for Gemini
  isPredefined: boolean;
  voiceSettings?: VoiceSettings; // Optional voice settings for the character
  categories: string[]; // Array of category tags
  isFavorite: boolean; // Whether the character is favorited
}

export enum AppView {
  Landing = 'landing',
  Login = 'login',
  Signup = 'signup',
  CharacterSelection = 'characterSelection',
  CharacterCreation = 'characterCreation',
  CharacterImport = 'characterImport',
  Chat = 'chat'
}
