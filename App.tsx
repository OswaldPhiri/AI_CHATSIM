import React, { useState, useEffect, useCallback } from 'react';
import { Character, AppView } from './types';
import { PREDEFINED_CHARACTERS, LOCAL_STORAGE_CHARACTERS_KEY } from './constants';
import CharacterSelector from './components/CharacterSelector';
import CharacterCreator from './components/CharacterCreator';
import ChatWindow from './components/ChatWindow';
import { v4 as uuidv4 } from 'uuid';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.CharacterSelection);
  const [characters, setCharacters] = useState<Character[]>(() => {
    const savedCharacters = localStorage.getItem(LOCAL_STORAGE_CHARACTERS_KEY);
    const customCharacters = savedCharacters ? JSON.parse(savedCharacters) : [];
    return [...PREDEFINED_CHARACTERS, ...customCharacters];
  });
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  useEffect(() => {
    const customCharacters = characters.filter(c => !c.isPredefined);
    localStorage.setItem(LOCAL_STORAGE_CHARACTERS_KEY, JSON.stringify(customCharacters));
  }, [characters]);

  const handleSelectCharacter = useCallback((character: Character) => {
    setSelectedCharacter(character);
    setCurrentView(AppView.Chat);
  }, []);

  const handleCreateCharacter = useCallback(() => {
    setCurrentView(AppView.CharacterCreation);
  }, []);

  const handleSaveCharacter = useCallback((characterData: Omit<Character, 'id' | 'isPredefined'>) => {
    const newCharacter: Character = {
      ...characterData,
      id: uuidv4(),
      isPredefined: false,
    };
    setCharacters(prev => [...prev, newCharacter]);
    setSelectedCharacter(newCharacter);
    setCurrentView(AppView.Chat);
  }, []);

  const handleBackToSelection = useCallback(() => {
    setSelectedCharacter(null);
    setCurrentView(AppView.CharacterSelection);
  }, []);
  
  const handleDeleteCharacter = useCallback((characterId: string) => {
    setCharacters(prev => prev.filter(c => c.id !== characterId));
    if (selectedCharacter?.id === characterId) {
      setSelectedCharacter(null);
      setCurrentView(AppView.CharacterSelection);
    }
  }, [selectedCharacter]);


  const renderView = () => {
    switch (currentView) {
      case AppView.CharacterCreation:
        return <CharacterCreator onSave={handleSaveCharacter} onCancel={handleBackToSelection} />;
      case AppView.Chat:
        if (selectedCharacter) {
          return <ChatWindow character={selectedCharacter} onBack={handleBackToSelection} />;
        }
        // Fallback if somehow in chat view without a character
        setCurrentView(AppView.CharacterSelection); 
        return null;
      case AppView.CharacterSelection:
      default:
        return <CharacterSelector characters={characters} onSelectCharacter={handleSelectCharacter} onCreateCharacter={handleCreateCharacter} onDeleteCharacter={handleDeleteCharacter} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-2 sm:p-4 bg-gradient-to-br from-slate-900 to-gray-800">
      <div className="w-full max-w-2xl bg-gray-800 shadow-2xl rounded-lg overflow-hidden h-[calc(100vh-1rem)] sm:h-[calc(100vh-4rem)] max-h-[800px] sm:max-h-[700px]">
        {renderView()}
      </div>
      <footer className="text-center mt-2 sm:mt-4 text-xs text-gray-500 px-2">
        <p>AI Character Chat Simulator. Powered by Gemini.</p>
        <p className="hidden sm:block">Ensure your Gemini API Key is configured in your environment (process.env.API_KEY).</p>
      </footer>
    </div>
  );
};

export default App;
