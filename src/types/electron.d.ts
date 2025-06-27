export interface Application {
  name: string;
  path: string;
}

export interface Profile {
  id: string;
  name: string;
  applications: Application[];
}

export interface UpdateStatus {
  status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  version?: string;
  releaseNotes?: string;
  percent?: number;
  error?: string;
}

export interface ElectronAPI {
  // Profile management
  getProfiles(): Promise<Profile[]>;
  saveProfile(profile: Profile): Promise<Profile>;
  deleteProfile(profileId: string): Promise<boolean>;
  
  // Profile execution
  launchProfile(profileId: string): Promise<boolean>;
  stopProfile(profileId: string): Promise<boolean>;
  isProfileRunning(profileId: string): Promise<boolean>;
  
  // Individual app management
  launchApp(profileId: string, appIndex: number): Promise<boolean>;
  stopApp(profileId: string, appIndex: number): Promise<boolean>;
  isAppRunning(profileId: string, appIndex: number): Promise<boolean>;
  
  // File operations
  selectFile(): Promise<string | null>;
  
  // Updates
  checkForUpdates(): Promise<any>;
  downloadUpdate(): Promise<boolean>;
  installUpdate(): Promise<boolean>;
  getAppVersion(): Promise<string>;
  
  // Event listeners
  onUpdateStatus(callback: (status: UpdateStatus) => void): void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
} 