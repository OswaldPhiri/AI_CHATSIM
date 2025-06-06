
import React, { useState } from 'react';
import { Character } from '../types';

interface CharacterCreatorProps {
  onSave: (characterData: Omit<Character, 'id' | 'isPredefined'>) => void;
  onCancel: () => void;
}

const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('😀');
  const [bio, setBio] = useState('');
  const [personalityPrompt, setPersonalityPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !bio.trim() || !personalityPrompt.trim()) {
      alert('Please fill in all fields: Name, Bio, and Personality Prompt.');
      return;
    }
    onSave({ name, avatar, bio, personalityPrompt });
  };

  const popularEmojis = ['😀', '🤖', '🧠', '🧙', '🦸', '🧑‍🚀', '🕵️', '👑', '💡', '🐉'];

  return (
    <div className="p-6 bg-gray-800 text-gray-100 h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-6 text-sky-400 text-center">Create New Character</h2>
      <form onSubmit={handleSubmit} className="space-y-4 flex-grow overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300">Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            placeholder="E.g., Captain Rex"
            required
          />
        </div>
        <div>
          <label htmlFor="avatar" className="block text-sm font-medium text-gray-300">Avatar (Emoji)</label>
          <select 
            id="avatar" 
            value={avatar} 
            onChange={(e) => setAvatar(e.target.value)}
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          >
            {popularEmojis.map(emoji => <option key={emoji} value={emoji}>{emoji}</option>)}
          </select>
           <input
            type="text"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value.slice(0,2))} // Limit to a couple chars for emoji
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            placeholder="Or type an emoji here"
          />
        </div>
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-300">Bio</label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            placeholder="A short description of the character."
            required
          />
        </div>
        <div>
          <label htmlFor="personalityPrompt" className="block text-sm font-medium text-gray-300">Personality Prompt (System Prompt for AI)</label>
          <textarea
            id="personalityPrompt"
            value={personalityPrompt}
            onChange={(e) => setPersonalityPrompt(e.target.value)}
            rows={5}
            className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            placeholder="E.g., You are a brave space captain. Speak confidently and use space-related slang."
            required
          />
          <p className="mt-1 text-xs text-gray-400">This prompt guides the AI's personality. Be descriptive!</p>
        </div>
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            Save Character
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CharacterCreator;
