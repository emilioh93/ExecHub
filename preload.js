const { contextBridge, ipcRenderer } = require('electron');

// Exponer las APIs seguras para que la interfaz pueda usarlas
contextBridge.exposeInMainWorld('electronAPI', {
  // Gestión de perfiles
  getProfiles: () => ipcRenderer.invoke('get-profiles'),
  saveProfile: (profile) => ipcRenderer.invoke('save-profile', profile),
  deleteProfile: (profileId) => ipcRenderer.invoke('delete-profile', profileId),
  
  // Selección de archivos
  selectFile: () => ipcRenderer.invoke('select-file'),
  
  // Control de aplicaciones
  launchProfile: (profileId) => ipcRenderer.invoke('launch-profile', profileId),
  stopProfile: (profileId) => ipcRenderer.invoke('stop-profile', profileId),
  isProfileRunning: (profileId) => ipcRenderer.invoke('is-profile-running', profileId)
});

// También incluimos la funcionalidad para mostrar las versiones
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }
  
  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }
}) 