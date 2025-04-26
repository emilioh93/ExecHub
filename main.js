const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, exec } = require('child_process');

// Data file path
const userDataPath = app.getPath('userData');
const profilesPath = path.join(userDataPath, 'profiles.json');

// Map to track running processes
const runningProcesses = new Map();

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
    console.log('Profiles saved successfully');
  } catch (error) {
    console.error('Error saving profiles:', error);
  }
}

function loadProfiles() {
  try {
    if (fs.existsSync(profilesPath)) {
      const data = fs.readFileSync(profilesPath, 'utf8');
      try {
        const profiles = JSON.parse(data);
        return Array.isArray(profiles) ? profiles : [];
      } catch (parseError) {
        console.error('Error parsing JSON:', parseError);
        return [];
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
    }
  });

  mainWindow.loadFile('src/index.html');
  
  // Commented for production - uncomment only for debugging
  // mainWindow.webContents.openDevTools();
}

// Create window when app is ready
app.whenReady().then(() => {
  createWindow();

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

  // Launch each application in the profile
  for (const app of profile.applications || []) {
    try {
      const appPath = app.path;
      
      console.log(`Attempting to launch: ${appPath}`);
      
      if (!fs.existsSync(appPath)) {
        console.error(`Application does not exist: ${appPath}`);
        continue;
      }

      // On Windows, use the shell API to open the application
      if (process.platform === 'win32') {
        try {
          // Run the application using the Windows native shell
          const childProcess = exec(`start "" "${appPath}"`, {
            windowsHide: false
          });
          
          processes.push(childProcess);
          
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
  return true;
});

// Check if a profile is running
ipcMain.handle('is-profile-running', (event, profileId) => {
  const processes = runningProcesses.get(profileId) || [];
  return processes.length > 0;
}); 