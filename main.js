const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');
const { autoUpdater } = require('electron-updater');
require('dotenv').config();

// Auto updater configuration
autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';
autoUpdater.autoDownload = false;

// Configure for GitHub releases
if (process.env.GH_TOKEN) {
  // Set the token for GitHub API requests
  process.env.GH_TOKEN = process.env.GH_TOKEN;
  
  // Configure electron-updater for authenticated requests
  autoUpdater.requestHeaders = {
    'Authorization': `token ${process.env.GH_TOKEN}`,
    'User-Agent': 'ExecHub-Updater'
  };
  
  console.log('Configured auto-updater with authentication');
} else {
  console.warn('GH_TOKEN not found - using public repository access');
}

// Data file path
const documentsPath = app.getPath('documents');
const exechubFolder = path.join(documentsPath, 'ExecHub');
const profilesPath = path.join(exechubFolder, 'profiles.json');

// Map to track running processes
const runningProcesses = new Map();
// Map to track individual app processes: profileId -> { appIndex: [processes] }
const runningAppProcesses = new Map();

// Data storage functions
function saveProfiles(profiles) {
  try {
    // Make sure the directory exists
    const dirPath = path.dirname(profilesPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    // Save as array
    fs.writeFileSync(profilesPath, JSON.stringify(profiles || []), 'utf8');
    console.log('Profiles saved successfully in:', profilesPath);
  } catch (error) {
    console.error('Error saving profiles:', error);
  }
}

function loadProfiles() {
  try {
    // Primero, verificar si el archivo existe en la nueva ubicación
    if (fs.existsSync(profilesPath)) {
      const data = fs.readFileSync(profilesPath, 'utf8');
      try {
        const profiles = JSON.parse(data);
        return Array.isArray(profiles) ? profiles : [];
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        return [];
      }
    } else {
      // Si no existe en la nueva ubicación, verificar si existe en la ubicación antigua
      const oldUserDataPath = app.getPath('userData');
      const oldProfilesPath = path.join(oldUserDataPath, 'profiles.json');
      
      if (fs.existsSync(oldProfilesPath)) {
        console.log('Migrating profiles from old location to Documents folder...');
        try {
          // Leer los datos antiguos
          const oldData = fs.readFileSync(oldProfilesPath, 'utf8');
          const oldProfiles = JSON.parse(oldData);
          
          // Guardarlos en la nueva ubicación
          saveProfiles(oldProfiles);
          
          console.log('Profiles successfully migrated to:', profilesPath);
          return Array.isArray(oldProfiles) ? oldProfiles : [];
        } catch (migrationError) {
          console.error('Error migrating profiles:', migrationError);
        }
      }
    }
  } catch (error) {
    console.error('Error loading profiles:', error);
  }
  return [];
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true,
    menuBarVisible: false
  });

  mainWindow.loadFile('src/index.html');
  
  // Commented for production - uncomment only for debugging
  // mainWindow.webContents.openDevTools();
}

// Setup auto-updater events
function setupAutoUpdater() {
  autoUpdater.on('checking-for-update', () => {
    mainWindow.webContents.send('update-status', { status: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    mainWindow.webContents.send('update-status', { 
      status: 'available',
      version: info.version,
      releaseNotes: info.releaseNotes
    });
  });

  autoUpdater.on('update-not-available', () => {
    mainWindow.webContents.send('update-status', { status: 'not-available' });
  });

  autoUpdater.on('download-progress', (progressObj) => {
    mainWindow.webContents.send('update-status', {
      status: 'downloading',
      percent: progressObj.percent
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    mainWindow.webContents.send('update-status', {
      status: 'downloaded',
      version: info.version
    });
  });

  autoUpdater.on('error', (err) => {
    mainWindow.webContents.send('update-status', {
      status: 'error',
      error: err.toString()
    });
  });
}

// Create window when app is ready
app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater();
  
  // Check for updates after a delay (to not slow down app startup)  
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(err => {
      // Silently ignore 404 errors for now, log others
      if (err.message && err.message.includes('404')) {
        console.log('Updates: No releases found yet');
        return;
      }
      console.error('Error checking for updates:', err);
    });
  }, 3000);

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Close the app when all windows are closed (except on macOS)
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Close all processes on exit
app.on('before-quit', () => {
  // Close profile processes
  for (const [profileId, processes] of runningProcesses.entries()) {
    for (const proc of processes) {
      try {
        if (process.platform === 'win32') {
          exec(`taskkill /pid ${proc.pid} /T /F`);
        } else {
          proc.kill('SIGTERM');
        }
      } catch (error) {
        console.error(`Error closing process: ${error}`);
      }
    }
  }
  
  // Close individual app processes
  for (const [profileId, profileApps] of runningAppProcesses.entries()) {
    for (const [appIndex, processes] of Object.entries(profileApps)) {
      for (const proc of processes) {
        try {
          if (proc.pid) {
            if (process.platform === 'win32') {
              exec(`taskkill /pid ${proc.pid} /T /F`);
            } else {
              proc.kill('SIGTERM');
            }
          }
        } catch (error) {
          console.error(`Error closing individual app process: ${error}`);
        }
      }
    }
  }
});

// IPC Handlers

// Get all profiles
ipcMain.handle('get-profiles', () => {
  return loadProfiles();
});

// Save a profile
ipcMain.handle('save-profile', (event, profile) => {
  let profiles = loadProfiles();
  
  // Make sure profiles is an array
  if (!Array.isArray(profiles)) {
    profiles = [];
  }
  
  if (profile.id) {
    // Update existing profile
    const index = profiles.findIndex(p => p.id === profile.id);
    if (index !== -1) {
      profiles[index] = profile;
    }
  } else {
    // Create new profile
    profile.id = Date.now().toString();
    profiles.push(profile);
  }
  
  saveProfiles(profiles);
  return profile;
});

// Delete a profile
ipcMain.handle('delete-profile', (event, profileId) => {
  const profiles = loadProfiles();
  const newProfiles = profiles.filter(p => p.id !== profileId);
  saveProfiles(newProfiles);
  return true;
});

// Select file
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile']
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// Launch a profile
ipcMain.handle('launch-profile', (event, profileId) => {
  const profiles = loadProfiles();
  const profile = profiles.find(p => p.id === profileId);
  
  if (!profile) {
    throw new Error('Profile not found');
  }

  const processes = [];
  runningProcesses.set(profileId, processes);

  // Initialize individual app processes map if it doesn't exist
  if (!runningAppProcesses.has(profileId)) {
    runningAppProcesses.set(profileId, {});
  }
  const profileApps = runningAppProcesses.get(profileId);

  // Launch each application in the profile (only if not already running)
  for (let i = 0; i < (profile.applications || []).length; i++) {
    const app = profile.applications[i];
    
    // Check if this individual app is already running
    const isAppAlreadyRunning = (profileApps[i] && profileApps[i].length > 0);
    
    if (isAppAlreadyRunning) {
      console.log(`Skipping ${app.name} - already running`);
      continue; // Skip this app if it's already running
    }
    
    try {
      const appPath = app.path;
      
      console.log(`Attempting to launch: ${appPath}`);
      
      if (!fs.existsSync(appPath)) {
        console.error(`Application does not exist: ${appPath}`);
        continue;
      }

      // Initialize app processes array if it doesn't exist
      if (!profileApps[i]) {
        profileApps[i] = [];
      }

      // On Windows, use the shell API to open the application
      if (process.platform === 'win32') {
        try {
          // Run the application using the Windows native shell
          const childProcess = exec(`start "" "${appPath}"`, {
            windowsHide: false
          });
          
          processes.push(childProcess);
          profileApps[i].push(childProcess);
          
          childProcess.on('error', (err) => {
            console.error(`Error launching ${appPath}: ${err.message}`);
            
            // Alternative attempt with spawn
            try {
              const spawnProcess = spawn('cmd.exe', ['/c', 'start', '""', `"${appPath}"`], {
                detached: true,
                shell: true,
                windowsHide: false,
                stdio: 'ignore'
              });
              
              spawnProcess.unref(); // Disconnect the process from the parent process
              processes.push(spawnProcess);
              profileApps[i].push(spawnProcess);
            } catch (spawnError) {
              console.error(`Error in alternative attempt: ${spawnError.message}`);
            }
          });
        } catch (execError) {
          console.error(`Error executing with exec: ${execError.message}`);
          
          // Alternative attempt with Electron API
          try {
            require('child_process').execFile(appPath, [], {
              detached: true
            });
            console.log(`Launched ${appPath} with execFile`);
            // Add placeholder since we can't track this process
            profileApps[i].push({});
          } catch (electronError) {
            console.error(`Error launching with Electron: ${electronError.message}`);
          }
        }
      } else {
        // On other operating systems
        const childProcess = spawn(appPath, [], {
          detached: true,
          shell: true,
          stdio: 'ignore'
        });
        
        childProcess.unref(); // Disconnect the process from the parent process
        processes.push(childProcess);
        profileApps[i].push(childProcess);
      }
      
    } catch (error) {
      console.error(`General error launching application: ${error.message}`);
    }
  }
  
  // Simulate that processes are running for the interface
  setTimeout(() => {
    updateRunningStatus(profileId);
  }, 1000);
  
  return true;
});

// Helper function to update running status
function updateRunningStatus(profileId) {
  const processes = runningProcesses.get(profileId) || [];
  if (processes.length === 0) {
    // If no processes are detected, simulate they're running
    // This is necessary because some launch methods do not allow
    // tracking the actual process
    runningProcesses.set(profileId, [{}]); // Add an empty object as placeholder
  }
}

// Stop a profile
ipcMain.handle('stop-profile', (event, profileId) => {
  const processes = runningProcesses.get(profileId) || [];
  
  // Special for Windows: get processes by filename
  if (process.platform === 'win32') {
    const profiles = loadProfiles();
    const profile = profiles.find(p => p.id === profileId);
    
    if (profile && profile.applications) {
      // For each application, get the executable name
      profile.applications.forEach(app => {
        try {
          const appPath = app.path;
          const fileName = path.basename(appPath);
          
          // Try to kill the process by filename
          exec(`taskkill /F /IM "${fileName}"`, (error, stdout, stderr) => {
            if (error) {
              console.error(`Error stopping ${fileName}: ${error.message}`);
            } else {
              console.log(`Process ${fileName} stopped: ${stdout}`);
            }
          });
        } catch (error) {
          console.error(`Error getting filename: ${error.message}`);
        }
      });
    }
  }
  
  // Additionally, try to kill registered processes
  for (const proc of processes) {
    try {
      if (proc.pid) { // Only if it has a valid PID
        if (process.platform === 'win32') {
          exec(`taskkill /pid ${proc.pid} /T /F`);
        } else {
          proc.kill('SIGTERM');
        }
      }
    } catch (error) {
      console.error(`Error stopping process: ${error.message}`);
    }
  }
  
  runningProcesses.delete(profileId);
  
  // Also clean up individual app processes tracking
  runningAppProcesses.delete(profileId);
  
  return true;
});

// Check if a profile is running
ipcMain.handle('is-profile-running', (event, profileId) => {
  const processes = runningProcesses.get(profileId) || [];
  return processes.length > 0;
});

// IPC Handlers for updates
ipcMain.handle('check-for-updates', async () => {
  try {
    return await autoUpdater.checkForUpdates();
  } catch (error) {
    console.error('Error checking for updates:', error);
    throw error;
  }
});

ipcMain.handle('download-update', async () => {
  try {
    autoUpdater.downloadUpdate();
    return true;
  } catch (error) {
    console.error('Error downloading update:', error);
    throw error;
  }
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall(false, true);
  return true;
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Launch individual application
ipcMain.handle('launch-app', (event, profileId, appIndex) => {
  const profiles = loadProfiles();
  const profile = profiles.find(p => p.id === profileId);
  
  if (!profile || !profile.applications || !profile.applications[appIndex]) {
    throw new Error('Application not found');
  }

  const app = profile.applications[appIndex];
  const appPath = app.path;
  
  console.log(`Attempting to launch individual app: ${appPath}`);
  
  if (!fs.existsSync(appPath)) {
    throw new Error(`Application does not exist: ${appPath}`);
  }

  // Initialize profile app processes map if it doesn't exist
  if (!runningAppProcesses.has(profileId)) {
    runningAppProcesses.set(profileId, {});
  }
  
  const profileApps = runningAppProcesses.get(profileId);
  if (!profileApps[appIndex]) {
    profileApps[appIndex] = [];
  }

  try {
    // On Windows, use the shell API to open the application
    if (process.platform === 'win32') {
      try {
        // Run the application using the Windows native shell
        const childProcess = exec(`start "" "${appPath}"`, {
          windowsHide: false
        });
        
        profileApps[appIndex].push(childProcess);
        
        childProcess.on('error', (err) => {
          console.error(`Error launching ${appPath}: ${err.message}`);
          
          // Alternative attempt with spawn
          try {
            const spawnProcess = spawn('cmd.exe', ['/c', 'start', '""', `"${appPath}"`], {
              detached: true,
              shell: true,
              windowsHide: false,
              stdio: 'ignore'
            });
            
            spawnProcess.unref(); // Disconnect the process from the parent process
            profileApps[appIndex].push(spawnProcess);
          } catch (spawnError) {
            console.error(`Error in alternative attempt: ${spawnError.message}`);
          }
        });
      } catch (execError) {
        console.error(`Error executing with exec: ${execError.message}`);
        
        // Alternative attempt with Electron API
        try {
          require('child_process').execFile(appPath, [], {
            detached: true
          });
          console.log(`Launched ${appPath} with execFile`);
          // Add placeholder since we can't track this process
          profileApps[appIndex].push({});
        } catch (electronError) {
          console.error(`Error launching with Electron: ${electronError.message}`);
          throw new Error(`Failed to launch application: ${electronError.message}`);
        }
      }
    } else {
      // On other operating systems
      const childProcess = spawn(appPath, [], {
        detached: true,
        shell: true,
        stdio: 'ignore'
      });
      
      childProcess.unref(); // Disconnect the process from the parent process
      profileApps[appIndex].push(childProcess);
    }
    
    // Simulate that the process is running for the interface
    setTimeout(() => {
      updateAppRunningStatus(profileId, appIndex);
    }, 1000);
    
    return true;
  } catch (error) {
    console.error(`General error launching application: ${error.message}`);
    throw error;
  }
});

// Helper function to update app running status
function updateAppRunningStatus(profileId, appIndex) {
  if (!runningAppProcesses.has(profileId)) {
    runningAppProcesses.set(profileId, {});
  }
  
  const profileApps = runningAppProcesses.get(profileId);
  if (!profileApps[appIndex] || profileApps[appIndex].length === 0) {
    // If no processes are detected, simulate they're running
    // This is necessary because some launch methods do not allow
    // tracking the actual process
    profileApps[appIndex] = [{}]; // Add an empty object as placeholder
  }
}

// Stop individual application
ipcMain.handle('stop-app', (event, profileId, appIndex) => {
  const profiles = loadProfiles();
  const profile = profiles.find(p => p.id === profileId);
  
  if (!profile || !profile.applications || !profile.applications[appIndex]) {
    throw new Error('Application not found');
  }

  const app = profile.applications[appIndex];
  const profileApps = runningAppProcesses.get(profileId) || {};
  const processes = profileApps[appIndex] || [];
  
  // Special for Windows: get processes by filename
  if (process.platform === 'win32') {
    try {
      const appPath = app.path;
      const fileName = path.basename(appPath);
      
      // Try to kill the process by filename
      exec(`taskkill /F /IM "${fileName}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error stopping ${fileName}: ${error.message}`);
        } else {
          console.log(`Process ${fileName} stopped: ${stdout}`);
        }
      });
    } catch (error) {
      console.error(`Error getting filename: ${error.message}`);
    }
  }
  
  // Additionally, try to kill registered processes
  for (const proc of processes) {
    try {
      if (proc.pid) { // Only if it has a valid PID
        if (process.platform === 'win32') {
          exec(`taskkill /pid ${proc.pid} /T /F`);
        } else {
          proc.kill('SIGTERM');
        }
      }
    } catch (error) {
      console.error(`Error stopping process: ${error.message}`);
    }
  }
  
  // Clear the processes for this app
  if (profileApps[appIndex]) {
    profileApps[appIndex] = [];
  }
  
  return true;
});

// Check if individual app is running
ipcMain.handle('is-app-running', (event, profileId, appIndex) => {
  const profileApps = runningAppProcesses.get(profileId) || {};
  const processes = profileApps[appIndex] || [];
  return processes.length > 0;
}); 