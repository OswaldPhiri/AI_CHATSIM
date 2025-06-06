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
    <div className="p-3 sm:p-6 flex flex-col h-full bg-gray-800 text-gray-100">
      <header className="mb-4 sm:mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-sky-400">Choose Your Chat Partner</h1>
        <p className="text-sm sm:text-base text-gray-400 mt-1">Select a character to start chatting or create your own!</p>
      </header>
      
      <div className="flex-grow overflow-y-auto space-y-2 sm:space-y-3 pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
        {characters.map(char => (
          <div 
            key={char.id} 
            className="bg-gray-700 hover:bg-sky-700 transition-colors cursor-pointer rounded-lg shadow-md group"
            onClick={() => onSelectCharacter(char)}
          >
            <div className="p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl sm:text-3xl flex-shrink-0 mt-1">{char.avatar}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base sm:text-lg font-semibold text-sky-300 group-hover:text-white truncate">
                      {char.name}
                    </h3>
                    {!char.isPredefined && (
                      <IconButton
                        icon={<i className="fas fa-trash text-red-500 hover:text-red-400"></i>}
                        onClick={(e) => { e.stopPropagation(); onDeleteCharacter(char.id); }}
                        className="opacity-50 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        ariaLabel="Delete character"
                      />
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-300 group-hover:text-gray-100 mt-1 line-clamp-2 sm:line-clamp-3">
                    {char.bio}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button
        onClick={onCreateCharacter}
        className="mt-4 sm:mt-6 w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-2 sm:py-3 px-4 rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75 text-sm sm:text-base"
      >
        <i className="fas fa-plus mr-2"></i>Create New Character
      </button>
    </div>
  );
};

export default CharacterSelector;
