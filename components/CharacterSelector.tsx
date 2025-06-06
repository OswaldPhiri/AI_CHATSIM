
import React from 'react';
import { Character } from '../types';
import IconButton from './IconButton';

interface CharacterSelectorProps {
  characters: Character[];
  onSelectCharacter: (character: Character) => void;
  onCreateCharacter: () => void;
  onDeleteCharacter: (characterId: string) => void;
}

const CharacterSelector: React.FC<CharacterSelectorProps> = ({ characters, onSelectCharacter, onCreateCharacter, onDeleteCharacter }) => {
  return (
    <div className="p-6 flex flex-col h-full bg-gray-800 text-gray-100">
      <header className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-sky-400">Choose Your Chat Partner</h1>
        <p className="text-gray-400 mt-1">Select a character to start chatting or create your own!</p>
      </header>
      
      <div className="flex-grow overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
        {characters.map(char => (
          <div 
            key={char.id} 
            className="bg-gray-700 p-4 rounded-lg shadow-md hover:bg-sky-700 transition-colors cursor-pointer flex items-center justify-between group"
            onClick={() => onSelectCharacter(char)}
          >
            <div className="flex items-center">
              <span className="text-3xl mr-4">{char.avatar}</span>
              <div>
                <h3 className="text-lg font-semibold">{char.name}</h3>
                <p className="text-sm text-gray-400 group-hover:text-gray-200 truncate max-w-xs">{char.bio}</p>
              </div>
            </div>
            {!char.isPredefined && (
              <IconButton
                icon={<i className="fas fa-trash text-red-500 hover:text-red-400"></i>}
                onClick={(e) => { e.stopPropagation(); onDeleteCharacter(char.id); }}
                className="opacity-50 group-hover:opacity-100 transition-opacity"
                ariaLabel="Delete character"
              />
            )}
          </div>
        ))}
      </div>
      
      <button
        onClick={onCreateCharacter}
        className="mt-6 w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
      >
        <i className="fas fa-plus mr-2"></i>Create New Character
      </button>
    </div>
  );
};

export default CharacterSelector;
