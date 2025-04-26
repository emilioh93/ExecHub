// Application state
let currentProfiles = [];
let currentProfileId = null;
let editingProfile = null;

// DOM References
const profilesList = document.getElementById('profiles-list');
const newProfileBtn = document.getElementById('new-profile-btn');
const emptyState = document.getElementById('empty-state');
const profileEditor = document.getElementById('profile-editor');
const profileView = document.getElementById('profile-view');
const profileNameInput = document.getElementById('profile-name');
const applicationsList = document.getElementById('applications-list');
const addApplicationBtn = document.getElementById('add-application-btn');
const saveProfileBtn = document.getElementById('save-profile-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const viewProfileName = document.getElementById('view-profile-name');
const viewApplicationsList = document.getElementById('view-applications-list');
const editProfileBtn = document.getElementById('edit-profile-btn');
const deleteProfileBtn = document.getElementById('delete-profile-btn');
const launchProfileBtn = document.getElementById('launch-profile-btn');
const stopProfileBtn = document.getElementById('stop-profile-btn');

// Templates
const profileItemTemplate = document.getElementById('profile-item-template');
const applicationItemTemplate = document.getElementById('application-item-template');
const viewApplicationItemTemplate = document.getElementById('view-application-item-template');

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    await refreshProfilesList();
    
    // Periodically check profile status
    setInterval(updateProfilesStatus, 2000);
});

// Functions for showing messages
function showMessage(message, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = isError ? 'message error' : 'message success';
    messageDiv.textContent = message;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 500);
    }, 3000);
}

// Update profile status
async function updateProfilesStatus() {
    for (const profile of currentProfiles) {
        const isRunning = await window.electronAPI.isProfileRunning(profile.id);
        
        const profileItem = document.querySelector(`.profile-item[data-id="${profile.id}"]`);
        if (profileItem) {
            const statusEl = profileItem.querySelector('.profile-status');
            statusEl.classList.toggle('running', isRunning);
            statusEl.classList.toggle('stopped', !isRunning);
        }
        
        // Update buttons if we're viewing this profile
        if (currentProfileId === profile.id) {
            launchProfileBtn.style.display = isRunning ? 'none' : 'block';
            stopProfileBtn.style.display = isRunning ? 'block' : 'none';
        }
    }
}

// Load profiles from storage
async function refreshProfilesList() {
    currentProfiles = await window.electronAPI.getProfiles();
    renderProfilesList();
}

// Render profile list
function renderProfilesList() {
    profilesList.innerHTML = '';
    
    if (currentProfiles.length === 0) {
        const noProfilesEl = document.createElement('div');
        noProfilesEl.classList.add('no-profiles');
        noProfilesEl.textContent = 'No profiles. Create a new one.';
        profilesList.appendChild(noProfilesEl);
        return;
    }
    
    currentProfiles.forEach(profile => {
        const clone = document.importNode(profileItemTemplate.content, true);
        const profileItem = clone.querySelector('.profile-item');
        
        profileItem.dataset.id = profile.id;
        profileItem.querySelector('.profile-name').textContent = profile.name;
        
        const statusEl = profileItem.querySelector('.profile-status');
        statusEl.classList.add('stopped'); // Default to stopped
        
        profileItem.addEventListener('click', () => {
            selectProfile(profile.id);
        });
        
        profilesList.appendChild(clone);
    });
    
    // Update statuses
    updateProfilesStatus();
}

// Select a profile
async function selectProfile(profileId) {
    currentProfileId = profileId;
    
    // Update UI
    document.querySelectorAll('.profile-item').forEach(item => {
        item.classList.toggle('selected', item.dataset.id === profileId);
    });
    
    const profile = currentProfiles.find(p => p.id === profileId);
    if (!profile) return;
    
    // Show profile view
    emptyState.style.display = 'none';
    profileEditor.style.display = 'none';
    profileView.style.display = 'block';
    
    // Render data
    viewProfileName.textContent = profile.name;
    renderViewApplications(profile.applications || []);
    
    // Check status to show appropriate button
    const isRunning = await window.electronAPI.isProfileRunning(profileId);
    launchProfileBtn.style.display = isRunning ? 'none' : 'block';
    stopProfileBtn.style.display = isRunning ? 'block' : 'none';
}

// Render applications in detail view
function renderViewApplications(applications) {
    viewApplicationsList.innerHTML = '';
    
    if (applications.length === 0) {
        const noAppsEl = document.createElement('li');
        noAppsEl.textContent = 'No applications configured.';
        viewApplicationsList.appendChild(noAppsEl);
        return;
    }
    
    applications.forEach(app => {
        const clone = document.importNode(viewApplicationItemTemplate.content, true);
        const item = clone.querySelector('.view-application-item');
        
        item.querySelector('.app-name').textContent = app.name;
        item.querySelector('.app-path').textContent = app.path;
        
        viewApplicationsList.appendChild(clone);
    });
}

// Render applications in editor
function renderEditApplications(applications) {
    applicationsList.innerHTML = '';
    
    applications.forEach((app, index) => {
        const clone = document.importNode(applicationItemTemplate.content, true);
        const item = clone.querySelector('.application-item');
        
        item.dataset.index = index;
        item.querySelector('.app-name').textContent = app.name || 'Unnamed';
        
        // Button to select file
        item.querySelector('.browse-app-btn').addEventListener('click', async () => {
            const filePath = await window.electronAPI.selectFile();
            if (filePath) {
                editingProfile.applications[index].path = filePath;
                editingProfile.applications[index].name = getFileNameFromPath(filePath);
                renderEditApplications(editingProfile.applications);
            }
        });
        
        // Button to remove application
        item.querySelector('.remove-app-btn').addEventListener('click', () => {
            editingProfile.applications.splice(index, 1);
            renderEditApplications(editingProfile.applications);
        });
        
        applicationsList.appendChild(clone);
    });
}

// Extract filename from path
function getFileNameFromPath(filePath) {
    const parts = filePath.split(/[\/\\]/);
    return parts[parts.length - 1];
}

// Start profile editing
function editProfile(profile) {
    editingProfile = profile ? JSON.parse(JSON.stringify(profile)) : {
        name: '',
        applications: []
    };
    
    profileNameInput.value = editingProfile.name;
    renderEditApplications(editingProfile.applications || []);
    
    emptyState.style.display = 'none';
    profileView.style.display = 'none';
    profileEditor.style.display = 'block';
}

// Event Listeners
newProfileBtn.addEventListener('click', () => {
    // Always create a new profile (never edit an existing one)
    currentProfileId = null;
    editProfile(null);
});

addApplicationBtn.addEventListener('click', () => {
    if (!editingProfile.applications) {
        editingProfile.applications = [];
    }
    
    editingProfile.applications.push({
        name: 'New Application',
        path: ''
    });
    
    renderEditApplications(editingProfile.applications);
});

saveProfileBtn.addEventListener('click', async () => {
    if (!profileNameInput.value.trim()) {
        showMessage('Please enter a profile name.', true);
        return;
    }
    
    // Validate that all applications have a path
    const invalidApps = editingProfile.applications.filter(app => !app.path);
    if (invalidApps.length > 0) {
        showMessage('All applications must have a valid path.', true);
        return;
    }
    
    editingProfile.name = profileNameInput.value.trim();
    
    try {
        saveProfileBtn.textContent = 'Saving...';
        saveProfileBtn.disabled = true;
        
        await window.electronAPI.saveProfile(editingProfile);
        showMessage('Profile saved successfully');
        await refreshProfilesList();
        
        if (editingProfile.id) {
            selectProfile(editingProfile.id);
        } else {
            const newProfile = currentProfiles[currentProfiles.length - 1];
            if (newProfile) {
                selectProfile(newProfile.id);
            }
        }
    } catch (error) {
        showMessage(`Error saving profile: ${error.message}`, true);
    } finally {
        saveProfileBtn.textContent = 'Save';
        saveProfileBtn.disabled = false;
    }
});

cancelEditBtn.addEventListener('click', () => {
    if (currentProfileId) {
        selectProfile(currentProfileId);
    } else {
        emptyState.style.display = 'flex';
        profileEditor.style.display = 'none';
        profileView.style.display = 'none';
    }
});

editProfileBtn.addEventListener('click', () => {
    const profile = currentProfiles.find(p => p.id === currentProfileId);
    if (profile) {
        editProfile(profile);
    }
});

deleteProfileBtn.addEventListener('click', async () => {
    if (!currentProfileId) return;
    
    const confirmed = confirm('Are you sure you want to delete this profile?');
    if (!confirmed) return;
    
    await window.electronAPI.deleteProfile(currentProfileId);
    await refreshProfilesList();
    
    emptyState.style.display = 'flex';
    profileView.style.display = 'none';
    profileEditor.style.display = 'none';
    currentProfileId = null;
});

launchProfileBtn.addEventListener('click', async () => {
    if (!currentProfileId) return;
    
    try {
        launchProfileBtn.textContent = 'Launching...';
        launchProfileBtn.disabled = true;
        
        await window.electronAPI.launchProfile(currentProfileId);
        showMessage('Profile launched successfully');
        updateProfilesStatus();
    } catch (error) {
        showMessage(`Error launching profile: ${error.message}`, true);
    } finally {
        launchProfileBtn.textContent = 'Launch Profile';
        launchProfileBtn.disabled = false;
    }
});

stopProfileBtn.addEventListener('click', async () => {
    if (!currentProfileId) return;
    
    try {
        stopProfileBtn.textContent = 'Stopping...';
        stopProfileBtn.disabled = true;
        
        await window.electronAPI.stopProfile(currentProfileId);
        showMessage('Profile stopped successfully');
        updateProfilesStatus();
    } catch (error) {
        showMessage(`Error stopping profile: ${error.message}`, true);
    } finally {
        stopProfileBtn.textContent = 'Stop Profile';
        stopProfileBtn.disabled = false;
    }
}); 