import React from 'react';
import { Profile } from '../types/electron';
import ProfileList from './ProfileList';

interface SidebarProps {
  profiles: Profile[];
  selectedProfileId: string | null;
  onSelectProfile: (profileId: string) => void;
  onNewProfile: () => void;
  onShowSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  profiles,
  selectedProfileId,
  onSelectProfile,
  onNewProfile,
  onShowSettings,
}) => {
  return (
    <div className="w-64 bg-white border-r border-gray-300 p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Profiles</h2>
        <button
          onClick={onNewProfile}
          className="btn btn-primary text-sm"
        >
          New Profile
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <ProfileList
          profiles={profiles}
          selectedProfileId={selectedProfileId}
          onSelectProfile={onSelectProfile}
        />
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={onShowSettings}
          className="w-full btn btn-secondary text-sm"
        >
          Settings
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 