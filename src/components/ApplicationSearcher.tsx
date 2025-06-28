import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SearchableApplication } from '../types/electron';

interface ApplicationSearcherProps {
  onSelect: (application: SearchableApplication) => void;
  onClose: () => void;
  placeholder?: string;
}

const ApplicationSearcher = ({ onSelect, onClose, placeholder = "Search for applications..." }: ApplicationSearcherProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [applications, setApplications] = useState<SearchableApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Search for applications
  const searchApplications = useCallback(async (term: string) => {
    setLoading(true);
    try {
      const results = await window.electronAPI.searchApplications(term);
      setApplications(results);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Error searching applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        searchApplications(searchTerm.trim());
      } else {
        // Load popular/recent applications when no search term
        searchApplications('');
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchApplications]);

  // Initial load
  useEffect(() => {
    searchApplications('');
    // Focus the search input
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  }, [searchApplications]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, applications.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (applications[selectedIndex]) {
          onSelect(applications[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [applications, selectedIndex, onSelect, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [selectedIndex]);

  const getIcon = (appName: string) => {
    const name = appName.toLowerCase();
    
    // Common application icons
    const iconMap: { [key: string]: string } = {
      'chrome': '🌐',
      'firefox': '🦊',
      'edge': '🌐',
      'notepad': '📝',
      'calculator': '🧮',
      'photoshop': '🎨',
      'illustrator': '🎨',
      'word': '📄',
      'excel': '📊',
      'powerpoint': '📽️',
      'outlook': '📧',
      'steam': '🎮',
      'discord': '💬',
      'spotify': '🎵',
      'vlc': '🎬',
      'zoom': '📹',
      'teams': '👥',
      'skype': '📞',
      'git': '📚',
      'code': '💻',
      'studio': '🛠️'
    };

    for (const [key, icon] of Object.entries(iconMap)) {
      if (name.includes(key)) {
        return icon;
      }
    }

    return '⚙️'; // Default icon
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-96 flex flex-col">
        {/* Search Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              🔍
            </div>
            <button
              onClick={onClose}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              title="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Results */}
        <div 
          ref={listRef}
          className="flex-1 overflow-y-auto p-2"
        >
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Buscando aplicaciones...</div>
            </div>
          ) : applications.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">
                {searchTerm ? 'No se encontraron aplicaciones' : 'Cargando aplicaciones...'}
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {applications.map((app, index) => (
                <div
                  key={`${app.path}-${index}`}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? 'bg-blue-100 border border-blue-300'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => onSelect(app)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="text-2xl mr-3">
                    {getIcon(app.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {app.name}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {app.path}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600 rounded-b-lg">
          <div className="flex justify-between">
            <span>↑↓ to navigate • Enter to select • Esc to close</span>
            <span>{applications.length} applications found</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationSearcher; 