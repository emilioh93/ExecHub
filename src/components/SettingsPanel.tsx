import React, { useState, useEffect } from 'react';
import { UpdateStatus } from '../types/electron';

interface SettingsPanelProps {
  updateStatus: UpdateStatus;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  updateStatus,
  onClose,
}) => {
  const [appVersion, setAppVersion] = useState('Loading...');
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const loadVersion = async () => {
      try {
        const version = await window.electronAPI.getAppVersion();
        setAppVersion(version);
      } catch (error) {
        setAppVersion('Unknown');
      }
    };
    loadVersion();
  }, []);

  const handleCheckUpdates = async () => {
    setChecking(true);
    try {
      await window.electronAPI.checkForUpdates();
    } catch (error) {
      console.error('Error checking updates:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleDownloadUpdate = async () => {
    setDownloading(true);
    try {
      await window.electronAPI.downloadUpdate();
    } catch (error) {
      console.error('Error downloading update:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleInstallUpdate = async () => {
    try {
      await window.electronAPI.installUpdate();
    } catch (error) {
      console.error('Error installing update:', error);
    }
  };

  return (
    <div className="flex-1 p-6">
      <div className="card max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Settings</h2>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Application</h3>
            <p className="text-gray-600">Version: {appVersion}</p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Updates</h3>
            <div className="mb-4">
              <div className="text-gray-600 mb-2">
                Status: {updateStatus.status}
              </div>
              
              {updateStatus.status === 'available' && (
                <div className="text-sm text-gray-500 mb-2">
                  Version {updateStatus.version} is available
                </div>
              )}
              
              {updateStatus.status === 'downloading' && updateStatus.percent && (
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${updateStatus.percent}%` }}
                  />
                </div>
              )}
              
              {updateStatus.status === 'error' && (
                <div className="text-error text-sm mb-2">
                  Error: {updateStatus.error}
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              {updateStatus.status === 'not-available' || updateStatus.status === 'error' ? (
                <button 
                  onClick={handleCheckUpdates}
                  disabled={checking}
                  className="btn btn-primary"
                >
                  {checking ? 'Checking...' : 'Check for Updates'}
                </button>
              ) : null}
              
              {updateStatus.status === 'available' ? (
                <button 
                  onClick={handleDownloadUpdate}
                  disabled={downloading}
                  className="btn btn-primary"
                >
                  {downloading ? 'Downloading...' : 'Download Update'}
                </button>
              ) : null}
              
              {updateStatus.status === 'downloaded' ? (
                <button 
                  onClick={handleInstallUpdate}
                  className="btn btn-success"
                >
                  Install & Restart
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel; 