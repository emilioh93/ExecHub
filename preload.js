const { contextBridge, ipcRenderer } = require('electron');

// Expose secure APIs so the interface can use them
contextBridge.exposeInMainWorld('electronAPI', {
  // Profile management
  getProfiles: () => ipcRenderer.invoke('get-profiles'),
  saveProfile: (profile) => ipcRenderer.invoke('save-profile', profile),
  deleteProfile: (profileId) => ipcRenderer.invoke('delete-profile', profileId),
  
  // File selection
  selectFile: () => ipcRenderer.invoke('select-file'),
  searchApplications: (searchTerm) => ipcRenderer.invoke('search-applications', searchTerm),
  
  // Application control
  launchProfile: (profileId) => ipcRenderer.invoke('launch-profile', profileId),
  stopProfile: (profileId) => ipcRenderer.invoke('stop-profile', profileId),
  isProfileRunning: (profileId) => ipcRenderer.invoke('is-profile-running', profileId),
  
  // Individual application control
  launchApp: (profileId, appIndex) => ipcRenderer.invoke('launch-app', profileId, appIndex),
  stopApp: (profileId, appIndex) => ipcRenderer.invoke('stop-app', profileId, appIndex),
  isAppRunning: (profileId, appIndex) => ipcRenderer.invoke('is-app-running', profileId, appIndex),
  
  // Updates
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  onUpdateStatus: (callback) => ipcRenderer.on('update-status', (_event, status) => callback(status))
});

 