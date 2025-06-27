import { useState } from 'react';
import { Profile } from './types/electron';
import { useProfiles } from './hooks/useProfiles';
import { useUpdateStatus } from './hooks/useUpdateStatus';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';

function App() {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const { profiles, loading, saveProfile, deleteProfile } = useProfiles();
  const updateStatus = useUpdateStatus();

  const selectedProfile = profiles.find(p => p.id === selectedProfileId) || null;

  const handleSelectProfile = (profileId: string) => {
    setSelectedProfileId(profileId);
    setShowEditor(false);
    setShowSettings(false);
  };

  const handleNewProfile = () => {
    setEditingProfile(null);
    setShowEditor(true);
    setShowSettings(false);
    setSelectedProfileId(null);
  };

  const handleShowEditor = (profile?: Profile) => {
    setEditingProfile(profile || null);
    setShowEditor(true);
    setShowSettings(false);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditingProfile(null);
  };

  const handleSaveProfile = async (profile: Profile) => {
    const savedProfile = await saveProfile(profile);
    setSelectedProfileId(savedProfile.id);
    setShowEditor(false);
    setEditingProfile(null);
  };

  const handleDeleteProfile = async (profileId: string) => {
    await deleteProfile(profileId);
    if (selectedProfileId === profileId) {
      setSelectedProfileId(null);
    }
  };

  const handleShowSettings = () => {
    setShowSettings(true);
    setShowEditor(false);
  };

  const handleCloseSettings = () => {
    setShowSettings(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-sidebar">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-sidebar">
      <Header />
      
      <div className="flex flex-1">
        <Sidebar
          profiles={profiles}
          selectedProfileId={selectedProfileId}
          onSelectProfile={handleSelectProfile}
          onNewProfile={handleNewProfile}
          onShowSettings={handleShowSettings}
        />
        
        <MainContent
          profiles={profiles}
          selectedProfile={selectedProfile}
          showSettings={showSettings}
          showEditor={showEditor}
          editingProfile={editingProfile}
          updateStatus={updateStatus}
          onCloseSettings={handleCloseSettings}
          onShowEditor={handleShowEditor}
          onCloseEditor={handleCloseEditor}
          onSaveProfile={handleSaveProfile}
          onDeleteProfile={handleDeleteProfile}
        />
      </div>
    </div>
  );
}

export default App; 