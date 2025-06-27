import { useState, useEffect } from 'react';
import { UpdateStatus } from '../types/electron';

export const useUpdateStatus = () => {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    status: 'not-available'
  });

  useEffect(() => {
    // Listen for update status changes
    window.electronAPI.onUpdateStatus?.((status: UpdateStatus) => {
      setUpdateStatus(status);
    });

    // Initial check for app version
    const loadAppVersion = async () => {
      try {
        const version = await window.electronAPI.getAppVersion();
        console.log('App version:', version);
      } catch (error) {
        console.error('Error getting app version:', error);
      }
    };

    loadAppVersion();
  }, []);

  return updateStatus;
}; 