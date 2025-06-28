import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Profile, Application, SearchableApplication } from '../types/electron';
import Toast from './Toast';
import ApplicationSearcher from './ApplicationSearcher';

interface ProfileEditorProps {
  profile: Profile | null;
  onSave: (profile: Profile) => Promise<void>;
  onCancel: () => void;
}

const ProfileEditor = ({
  profile,
  onSave,
  onCancel,
}: ProfileEditorProps) => {
  const [name, setName] = useState('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' | 'warning' } | null>(null);
  const [showAppSearcher, setShowAppSearcher] = useState(false);
  const [currentAppIndex, setCurrentAppIndex] = useState<number | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setApplications([...profile.applications]);
    } else {
      setName('');
      setApplications([]);
    }
  }, [profile]);

  const handleAddApplication = useCallback(() => {
    // Add empty application and immediately open searcher
    const newIndex = applications.length;
    setApplications([
      ...applications,
      { name: 'Nueva Aplicación', path: '' }
    ]);
    
    // Open searcher for the new application
    setTimeout(() => {
      setCurrentAppIndex(newIndex);
      setShowAppSearcher(true);
    }, 100);
  }, [applications]);

  const handleSelectFile = useCallback(async (index: number) => {
    try {
      const filePath = await window.electronAPI.selectFile();
      if (filePath) {
        const fileName = filePath.split(/[\/\\]/).pop() || 'Unknown';
        const newApps = [...applications];
        newApps[index] = {
          name: fileName,
          path: filePath
        };
        setApplications(newApps);
      }
    } catch (error) {
      console.error('Error selecting file:', error);
    }
  }, [applications]);

  const handleSearchApp = useCallback((index: number) => {
    setCurrentAppIndex(index);
    setShowAppSearcher(true);
  }, []);

  const handleAppSelected = useCallback((app: SearchableApplication) => {
    if (currentAppIndex !== null) {
      const newApps = [...applications];
      newApps[currentAppIndex] = {
        name: app.name,
        path: app.path
      };
      setApplications(newApps);
    }
    setShowAppSearcher(false);
    setCurrentAppIndex(null);
  }, [applications, currentAppIndex]);

  const handleCloseSearcher = useCallback(() => {
    setShowAppSearcher(false);
    setCurrentAppIndex(null);
  }, []);

  const handleRemoveApplication = useCallback((index: number) => {
    setApplications(applications.filter((_, i) => i !== index));
  }, [applications]);

  const handleUpdateAppName = useCallback((index: number, newName: string) => {
    const newApps = [...applications];
    newApps[index].name = newName;
    setApplications(newApps);
  }, [applications]);

  const showToast = useCallback((message: string, type: 'error' | 'success' | 'warning') => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      showToast('Please enter a profile name.', 'error');
      // Focus the name input after showing the error
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
      return;
    }

    const invalidApps = applications.filter(app => !app.path);
    if (invalidApps.length > 0) {
      showToast('All applications must have a valid path.', 'error');
      return;
    }

    setSaving(true);
    try {
      const profileToSave: Profile = {
        id: profile?.id || '', // Let the backend assign the ID for new profiles
        name: name.trim(),
        applications
      };

      console.log('Saving profile:', profileToSave);
      await onSave(profileToSave);
      console.log('Profile saved successfully');
      showToast('Profile saved successfully!', 'success');
    } catch (error) {
      console.error('Error saving profile:', error);
      showToast('Error saving profile: ' + (error as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }, [name, applications, profile, onSave, showToast]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleSave();
  }, [handleSave]);

  return (
    <div className="flex-1 p-6">
      <div className="card max-w-4xl">
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              {profile ? 'Edit Profile' : 'New Profile'}
            </h2>

            <div className="space-x-2">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Name
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSave();
                }
              }}
              placeholder="Ex: iRacing"
              className="form-input"
              required
              autoFocus
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Applications
              </label>
              <button
                type="button"
                onClick={handleAddApplication}
                className="btn btn-primary text-sm"
              >
                Add Application
              </button>
            </div>

            {applications.length === 0 ? (
              <div className="text-gray-500 text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                No applications added yet. Click "Add Application" to start.
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg"
                  >
                    <div className="flex-1">
                      <input
                        type="text"
                        value={app.name}
                        onChange={(e) => handleUpdateAppName(index, e.target.value)}
                        placeholder="Application name"
                        className="form-input mb-2"
                      />
                      <div className="text-sm text-gray-500 break-all">
                        {app.path || 'No file selected'}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleSearchApp(index)}
                        className="btn btn-primary text-sm"
                        title="Buscar aplicación"
                      >
                        🔍
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectFile(index)}
                        className="btn btn-secondary text-sm"
                        title="Buscar archivo"
                      >
                        📂
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveApplication(index)}
                        className="btn btn-danger text-sm"
                        title="Eliminar aplicación"
                      >
                        ❌
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </form>
      </div>

      {/* Application Searcher */}
      {showAppSearcher && (
        <ApplicationSearcher
          onSelect={handleAppSelected}
          onClose={handleCloseSearcher}
          placeholder="Busca aplicaciones instaladas..."
        />
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

export default ProfileEditor; 