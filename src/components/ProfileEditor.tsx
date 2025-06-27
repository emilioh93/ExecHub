import React, { useState, useEffect } from 'react';
import { Profile, Application } from '../types/electron';

interface ProfileEditorProps {
  profile: Profile | null;
  onSave: (profile: Profile) => Promise<void>;
  onCancel: () => void;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({
  profile,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState('');
  const [applications, setApplications] = useState<Application[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setApplications([...profile.applications]);
    } else {
      setName('');
      setApplications([]);
    }
  }, [profile]);

  const handleAddApplication = () => {
    setApplications([
      ...applications,
      { name: 'New Application', path: '' }
    ]);
  };

  const handleSelectFile = async (index: number) => {
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
  };

  const handleRemoveApplication = (index: number) => {
    setApplications(applications.filter((_, i) => i !== index));
  };

  const handleUpdateAppName = (index: number, newName: string) => {
    const newApps = [...applications];
    newApps[index].name = newName;
    setApplications(newApps);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a profile name.');
      return;
    }

    const invalidApps = applications.filter(app => !app.path);
    if (invalidApps.length > 0) {
      alert('All applications must have a valid path.');
      return;
    }

    setSaving(true);
    try {
      const profileToSave: Profile = {
        id: profile?.id || Date.now().toString(),
        name: name.trim(),
        applications
      };

      await onSave(profileToSave);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 p-6">
      <div className="card max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {profile ? 'Edit Profile' : 'New Profile'}
          </h2>
          <div className="space-x-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
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
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: iRacing"
              className="form-input"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Applications
              </label>
              <button
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
                        onClick={() => handleSelectFile(index)}
                        className="btn btn-secondary text-sm"
                        title="Browse for file"
                      >
                        📂
                      </button>
                      <button
                        onClick={() => handleRemoveApplication(index)}
                        className="btn btn-danger text-sm"
                        title="Remove application"
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
      </div>
    </div>
  );
};

export default ProfileEditor; 