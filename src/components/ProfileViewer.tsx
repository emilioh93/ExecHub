import { useState, useEffect, useCallback } from 'react';
import { Profile } from '../types/electron';
import Toast from './Toast';

interface ProfileViewerProps {
  profile: Profile;
  onEdit: () => void;
  onDelete: () => void;
}

const ProfileViewer = ({
  profile,
  onEdit,
  onDelete,
}: ProfileViewerProps) => {
  const [isProfileRunning, setIsProfileRunning] = useState(false);
  const [runningApps, setRunningApps] = useState<Set<number>>(new Set());
  const [launching, setLaunching] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [appOperations, setAppOperations] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'warning' } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [noApps, setNoApps] = useState(true);

  // Toast functions (declared first to be used by other functions)
  const showToast = useCallback((message: string, type: 'error' | 'success' | 'warning') => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // Check profile and app status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Check profile status
        const profileRunning = await window.electronAPI.isProfileRunning(profile.id);
        setIsProfileRunning(profileRunning);
        setNoApps(profile.applications.length === 0);

        // Check individual app status
        const runningSet = new Set<number>();
        for (let i = 0; i < profile.applications.length; i++) {
          const appRunning = await window.electronAPI.isAppRunning(profile.id, i);
          if (appRunning) {
            runningSet.add(i);
          }
        }
        setRunningApps(runningSet);
      } catch (error) {
        console.error('Error checking status:', error);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, [profile.id, profile.applications.length]); // Solo dependencias primitivas

  const handleLaunchProfile = useCallback(async () => {
    setLaunching(true);
    try {
      await window.electronAPI.launchProfile(profile.id);
      // Status will be updated by the interval
    } catch (error) {
      console.error('Error launching profile:', error);
      showToast('Error launching profile: ' + (error as Error).message, 'error');
    } finally {
      setLaunching(false);
    }
  }, [profile.id, showToast]);

  const handleStopProfile = useCallback(async () => {
    setStopping(true);
    try {
      await window.electronAPI.stopProfile(profile.id);
      // Status will be updated by the interval
    } catch (error) {
      console.error('Error stopping profile:', error);
      showToast('Error stopping profile: ' + (error as Error).message, 'error');
    } finally {
      setStopping(false);
    }
  }, [profile.id, showToast]);

  const handleLaunchApp = useCallback(async (appIndex: number) => {
    setAppOperations(prev => new Set([...prev, appIndex]));
    try {
      await window.electronAPI.launchApp(profile.id, appIndex);
    } catch (error) {
      console.error('Error launching app:', error);
      showToast('Error launching application: ' + (error as Error).message, 'error');
    } finally {
      setAppOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(appIndex);
        return newSet;
      });
    }
  }, [profile.id, showToast]);

  const handleStopApp = useCallback(async (appIndex: number) => {
    setAppOperations(prev => new Set([...prev, appIndex]));
    try {
      await window.electronAPI.stopApp(profile.id, appIndex);
    } catch (error) {
      console.error('Error stopping app:', error);
      showToast('Error stopping application: ' + (error as Error).message, 'error');
    } finally {
      setAppOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(appIndex);
        return newSet;
      });
    }
  }, [profile.id, showToast]);

  const handleDeleteProfile = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const confirmDelete = useCallback(() => {
    onDelete();
    setShowDeleteConfirm(false);
    showToast('Profile deleted successfully', 'success');
  }, [onDelete, showToast]);

  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  return (
    <div className="flex-1 p-6">
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold">{profile.name}</h2>
            <span
              className={`status-indicator ${isProfileRunning ? 'status-running' : 'status-stopped'
                }`}
            />
          </div>
          <div className="space-x-2">
            <button
              onClick={onEdit}
              className="btn btn-secondary"
            >
              Edit
            </button>
            <button
              onClick={handleDeleteProfile}
              className="btn btn-danger"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Applications</h3>
          {profile.applications.length === 0 ? (
            <p className="text-gray-500">No applications configured.</p>
          ) : (
            <div className="space-y-3">
              {profile.applications.map((app, index) => {
                const isAppRunning = runningApps.has(index);
                const isOperating = appOperations.has(index);

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-gray-300 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{app.name}</span>
                        <span
                          className={`status-indicator ${isAppRunning ? 'status-running' : 'status-stopped'
                            }`}
                        />
                      </div>
                      <div className="text-sm text-gray-500 break-all mt-1">
                        {app.path}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleLaunchApp(index)}
                        disabled={isAppRunning || isOperating}
                        className="btn btn-success text-sm"
                        title="Launch application"
                      >
                        {isOperating ? '⏳' : '▶️'}
                      </button>
                      <button
                        onClick={() => handleStopApp(index)}
                        disabled={!isAppRunning || isOperating}
                        className="btn btn-danger text-sm"
                        title="Stop application"
                      >
                        {isOperating ? '⏳' : '⏹️'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {!noApps && (
          <div className="flex space-x-4">
            {!isProfileRunning ? (
              <button
                onClick={handleLaunchProfile}
                disabled={launching || noApps}
                className="btn btn-primary"
              >
                {launching ? 'Launching...' : 'Launch Profile'}
              </button>
            ) : (
              <button
                onClick={handleStopProfile}
                disabled={stopping}
                className="btn btn-danger"
              >
                {stopping ? 'Stopping...' : 'Stop Profile'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Delete Profile</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{profile.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button onClick={cancelDelete} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={confirmDelete} className="btn btn-danger">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
};

export default ProfileViewer; 