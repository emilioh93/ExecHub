import React from 'react';
import { Profile, UpdateStatus } from '../types/electron';
import ProfileEditor from './ProfileEditor';
import ProfileViewer from './ProfileViewer';
import SettingsPanel from './SettingsPanel';

interface MainContentProps {
  profiles: Profile[];
  selectedProfile: Profile | null;
  showSettings: boolean;
  showEditor: boolean;
  editingProfile: Profile | null;
  updateStatus: UpdateStatus;
  onCloseSettings: () => void;
  onShowEditor: (profile?: Profile) => void;
  onCloseEditor: () => void;
  onSaveProfile: (profile: Profile) => Promise<void>;
  onDeleteProfile: (profileId: string) => Promise<void>;
}

const MainContent: React.FC<MainContentProps> = ({
  profiles,
  selectedProfile,
  showSettings,
  showEditor,
  editingProfile,
  updateStatus,
  onCloseSettings,
  onShowEditor,
  onCloseEditor,
  onSaveProfile,
  onDeleteProfile,
}) => {
  if (showSettings) {
    return (
      <SettingsPanel
        updateStatus={updateStatus}
        onClose={onCloseSettings}
      />
    );
  }

  if (showEditor) {
    return (
      <ProfileEditor
        profile={editingProfile}
        onSave={onSaveProfile}
        onCancel={onCloseEditor}
      />
    );
  }

  if (!selectedProfile) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <h3 className="text-xl font-medium mb-2">Select a profile or create a new one</h3>
          <p>Profiles allow you to launch and close multiple applications with a single click.</p>
        </div>
      </div>
    );
  }

  return (
    <ProfileViewer
      profile={selectedProfile}
      onEdit={() => onShowEditor(selectedProfile)}
      onDelete={() => onDeleteProfile(selectedProfile.id)}
    />
  );
};

export default MainContent; 