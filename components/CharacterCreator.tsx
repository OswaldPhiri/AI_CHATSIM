import React, { useState } from 'react';
import { Character } from '../types';
import { AVAILABLE_CATEGORIES } from '../constants';

interface CharacterCreatorProps {
  onSave: (characterData: Omit<Character, 'id' | 'isPredefined'>) => void;
  onCancel: () => void;
  initialData?: Omit<Character, 'id' | 'isPredefined'>; // For editing mode
}

const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onSave, onCancel, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [avatar, setAvatar] = useState(initialData?.avatar || '😀');
  const [bio, setBio] = useState(initialData?.bio || '');
  const [personalityPrompt, setPersonalityPrompt] = useState(initialData?.personalityPrompt || '');
  const [categories, setCategories] = useState<string[]>(initialData?.categories || []);
  const [isFavorite, setIsFavorite] = useState(initialData?.isFavorite || false);
  const [voiceSettings, setVoiceSettings] = useState(initialData?.voiceSettings || {
    pitch: 1.0,
    rate: 1.0,
    lang: 'en-US'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !bio.trim() || !personalityPrompt.trim()) {
      alert('Please fill in all required fields: Name, Bio, and Personality Prompt.');
      return;
    }
    onSave({ 
      name, 
      avatar, 
      bio, 
      personalityPrompt, 
      categories,
      isFavorite,
      voiceSettings
    });
  };

  const popularEmojis = ['😀', '🤖', '🧠', '🧙', '🦸', '🧑‍🚀', '🕵️', '👑', '💡', '🐉'];

  const toggleCategory = (category: string) => {
    setCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="p-3 sm:p-6 bg-gray-800 text-gray-100 h-full flex flex-col">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-sky-400 text-center">
        {initialData ? 'Edit Character' : 'Create New Character'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 flex-grow overflow-y-auto pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300">Name *</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-1.5 sm:py-2 px-2 sm:px-3 text-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
            placeholder="E.g., Captain Rex"
            required
          />
        </div>

        <div>
          <label htmlFor="avatar" className="block text-sm font-medium text-gray-300">Avatar (Emoji)</label>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-1">
            <select 
              id="avatar" 
              value={avatar} 
              onChange={(e) => setAvatar(e.target.value)}
              className="block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-1.5 sm:py-2 px-2 sm:px-3 text-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
            >
              {popularEmojis.map(emoji => <option key={emoji} value={emoji}>{emoji}</option>)}
            </select>
            <input
              type="text"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value.slice(0,2))}
              className="block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-1.5 sm:py-2 px-2 sm:px-3 text-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
              placeholder="Or type an emoji"
            />
          </div>
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-300">Bio *</label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={2}
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-1.5 sm:py-2 px-2 sm:px-3 text-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
            placeholder="A short description of the character."
            required
          />
        </div>

        <div>
          <label htmlFor="personalityPrompt" className="block text-sm font-medium text-gray-300">Personality Prompt *</label>
          <textarea
            id="personalityPrompt"
            value={personalityPrompt}
            onChange={(e) => setPersonalityPrompt(e.target.value)}
            rows={4}
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-1.5 sm:py-2 px-2 sm:px-3 text-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
            placeholder="E.g., You are a brave space captain. Speak confidently and use space-related slang."
            required
          />
          <p className="mt-1 text-xs text-gray-400">This prompt guides the AI's personality. Be descriptive!</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Categories</label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_CATEGORIES.map(category => (
              <button
                key={category}
                type="button"
                onClick={() => toggleCategory(category)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  categories.includes(category)
                    ? 'bg-sky-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isFavorite"
            checked={isFavorite}
            onChange={(e) => setIsFavorite(e.target.checked)}
            className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-600 rounded bg-gray-700"
          />
          <label htmlFor="isFavorite" className="text-sm font-medium text-gray-300">
            Add to Favorites
          </label>
        </div>

        <div className="flex space-x-2 sm:space-x-3 pt-3 sm:pt-4">
          <button
            type="submit"
            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 text-sm sm:text-base"
          >
            {initialData ? 'Save Changes' : 'Create Character'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm sm:text-base"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CharacterCreator;
