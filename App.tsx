import React, { useState, useEffect, useCallback } from 'react';
import { Character, AppView } from './types';
import { PREDEFINED_CHARACTERS, LOCAL_STORAGE_CHARACTERS_KEY } from './constants';
import CharacterSelector from './components/CharacterSelector';
import CharacterCreator from './components/CharacterCreator';
import ChatWindow from './components/ChatWindow';
import ThemeToggle from './components/ThemeToggle';
import { v4 as uuidv4 } from 'uuid';
import './styles/themes.css';

const THEME_STORAGE_KEY = 'aiCharacterChat_theme';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.CharacterSelection);
  const [characters, setCharacters] = useState<Character[]>(() => {
    const savedCharacters = localStorage.getItem(LOCAL_STORAGE_CHARACTERS_KEY);
    const customCharacters = savedCharacters ? JSON.parse(savedCharacters) : [];
    return [...PREDEFINED_CHARACTERS, ...customCharacters];
  });
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [characterToEdit, setCharacterToEdit] = useState<Character | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState<'name' | 'category'>('name');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return (savedTheme as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    const customCharacters = characters.filter(c => !c.isPredefined);
    localStorage.setItem(LOCAL_STORAGE_CHARACTERS_KEY, JSON.stringify(customCharacters));
  }, [characters]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const handleSelectCharacter = useCallback((character: Character) => {
    setSelectedCharacter(character);
    setCurrentView(AppView.Chat);
  }, []);

  const handleCreateCharacter = useCallback(() => {
    setCharacterToEdit(null);
    setCurrentView(AppView.CharacterCreation);
  }, []);

  const handleEditCharacter = useCallback((character: Character) => {
    setCharacterToEdit(character);
    setCurrentView(AppView.CharacterCreation);
  }, []);

  const handleSaveCharacter = useCallback((characterData: Omit<Character, 'id' | 'isPredefined'>) => {
    if (characterToEdit) {
      // Update existing character
      setCharacters(prev => prev.map(c => 
        c.id === characterToEdit.id 
          ? { ...c, ...characterData }
          : c
      ));
      if (selectedCharacter?.id === characterToEdit.id) {
        setSelectedCharacter({ ...characterToEdit, ...characterData });
      }
    } else {
      // Create new character
      const newCharacter: Character = {
        ...characterData,
        id: uuidv4(),
        isPredefined: false,
      };
      setCharacters(prev => [...prev, newCharacter]);
      setSelectedCharacter(newCharacter);
    }
    setCharacterToEdit(null);
    setCurrentView(AppView.Chat);
  }, [characterToEdit, selectedCharacter]);

  const handleBackToSelection = useCallback(() => {
    setSelectedCharacter(null);
    setCharacterToEdit(null);
    setCurrentView(AppView.CharacterSelection);
  }, []);
  
  const handleDeleteCharacter = useCallback((characterId: string) => {
    setCharacters(prev => prev.filter(c => c.id !== characterId));
    if (selectedCharacter?.id === characterId) {
      setSelectedCharacter(null);
      setCurrentView(AppView.CharacterSelection);
    }
  }, [selectedCharacter]);

  const handleToggleFavorite = useCallback((characterId: string) => {
    setCharacters(prev => prev.map(c => 
      c.id === characterId 
        ? { ...c, isFavorite: !c.isFavorite }
        : c
    ));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const filteredCharacters = characters.filter(character => {
    const matchesSearch = character.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         character.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         character.categories.some(cat => cat.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || character.categories.includes(selectedCategory);
    const matchesFavorites = !showFavoritesOnly || character.isFavorite;
    return matchesSearch && matchesCategory && matchesFavorites;
  });

  const sortedCharacters = [...filteredCharacters].sort((a, b) => {
    if (sortOrder === 'name') {
      return a.name.localeCompare(b.name);
    } else {
      // Sort by first category
      const aCategory = a.categories[0] || '';
      const bCategory = b.categories[0] || '';
      return aCategory.localeCompare(bCategory);
    }
  });

  const renderView = () => {
    switch (currentView) {
      case AppView.CharacterCreation:
        return (
          <CharacterCreator 
            onSave={handleSaveCharacter} 
            onCancel={handleBackToSelection}
            initialData={characterToEdit || undefined}
          />
        );
      case AppView.Chat:
        if (selectedCharacter) {
          return <ChatWindow character={selectedCharacter} onBack={handleBackToSelection} />;
        }
        // Fallback if somehow in chat view without a character
        setCurrentView(AppView.CharacterSelection); 
        return null;
      case AppView.CharacterSelection:
      default:
        return (
          <CharacterSelector 
            characters={sortedCharacters}
            onSelectCharacter={handleSelectCharacter}
            onCreateCharacter={handleCreateCharacter}
            onDeleteCharacter={handleDeleteCharacter}
            onEditCharacter={handleEditCharacter}
            onToggleFavorite={handleToggleFavorite}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            showFavoritesOnly={showFavoritesOnly}
            onToggleFavoritesOnly={() => setShowFavoritesOnly(prev => !prev)}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
          />
        );
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-2 sm:p-4 bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)]`}>
      <div className="w-full max-w-2xl bg-[var(--bg-secondary)] shadow-2xl rounded-lg overflow-hidden h-[calc(100vh-1rem)] sm:h-[calc(100vh-4rem)] max-h-[800px] sm:max-h-[700px] relative">
        {currentView === AppView.CharacterSelection && (
          <div className="absolute top-2 right-2 z-10">
            <ThemeToggle currentTheme={theme} onToggle={toggleTheme} />
          </div>
        )}
        {renderView()}
      </div>
      <footer className="text-center mt-2 sm:mt-4 text-xs text-[var(--text-tertiary)] px-2">
        <p>AI Character Chat Simulator. Powered by Oswaldinho the Great.</p>
        <p className="hidden sm:block">Ensure your Gemini API Key is configured in your environment (process.env.API_KEY).</p>
      </footer>
    </div>
  );
};

export default App;
