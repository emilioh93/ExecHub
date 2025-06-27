import React, { useState, useEffect } from 'react';
import { Profile } from '../types/electron';

interface ProfileListProps {
  profiles: Profile[];
  selectedProfileId: string | null;
  onSelectProfile: (profileId: string) => void;
}

const ProfileList: React.FC<ProfileListProps> = ({
  profiles,
  selectedProfileId,
  onSelectProfile,
}) => {
  const [runningProfiles, setRunningProfiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkRunningStatus = async () => {
      const runningSet = new Set<string>();
      
      for (const profile of profiles) {
        const isRunning = await window.electronAPI.isProfileRunning(profile.id);
        if (isRunning) {
          runningSet.add(profile.id);
        }
      }
      
      setRunningProfiles(runningSet);
    };

    if (profiles.length > 0) {
      checkRunningStatus();
      const interval = setInterval(checkRunningStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [profiles]);

  if (profiles.length === 0) {
    return (
      <div className="text-gray-500 text-sm text-center py-8">
        No profiles. Create a new one.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {profiles.map((profile) => {
        const isSelected = profile.id === selectedProfileId;
        const isRunning = runningProfiles.has(profile.id);
        
        return (
          <div
            key={profile.id}
            onClick={() => onSelectProfile(profile.id)}
            className={`
              flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors
              ${isSelected 
                ? 'bg-primary-50 border-l-4 border-primary-500' 
                : 'hover:bg-gray-50'
              }
            `}
          >
            <span className="font-medium text-gray-800 truncate">
              {profile.name}
            </span>
            <span
              className={`status-indicator ${
                isRunning ? 'status-running' : 'status-stopped'
              }`}
            />
          </div>
        );
      })}
    </div>
  );
};

export default ProfileList; 