import { useState, useEffect } from 'react';
import { Profile } from '../types/electron';

export const useProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshProfiles = async () => {
    try {
      setLoading(true);
      const data = await window.electronAPI.getProfiles();
      setProfiles(data);
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (profile: Profile): Promise<Profile> => {
    try {
      const savedProfile = await window.electronAPI.saveProfile(profile);
      await refreshProfiles();
      return savedProfile;
    } catch (error) {
      console.error('Error saving profile:', error);
      throw error;
    }
  };

  const deleteProfile = async (profileId: string): Promise<void> => {
    try {
      await window.electronAPI.deleteProfile(profileId);
      await refreshProfiles();
    } catch (error) {
      console.error('Error deleting profile:', error);
      throw error;
    }
  };

  useEffect(() => {
    refreshProfiles();
  }, []);

  return {
    profiles,
    loading,
    refreshProfiles,
    saveProfile,
    deleteProfile,
  };
}; 