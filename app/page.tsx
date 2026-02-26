"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Character, AppView } from '../types';
import { PREDEFINED_CHARACTERS, LOCAL_STORAGE_CHARACTERS_KEY } from '../constants';
import CharacterSelector from '../components/CharacterSelector';
import CharacterCreator from '../components/CharacterCreator';
import ChatWindow from '../components/ChatWindow';
import LandingPage from '../components/LandingPage';
import AuthForms from '../components/AuthForms';
import ThemeToggle from '../components/ThemeToggle';
import { supabase } from '../services/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

const THEME_STORAGE_KEY = 'aiCharacterChat_theme';

const Page: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.Landing);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        setCurrentView(AppView.CharacterSelection);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: any) => {
      setUser(session?.user ?? null);
      if (session) {
        setCurrentView(AppView.CharacterSelection);
      } else {
        setCurrentView(AppView.Landing);
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  const [characters, setCharacters] = useState<Character[]>(PREDEFINED_CHARACTERS);
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

  const fetchCharacters = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .or(`user_id.eq.${user.id},is_predefined.eq.true`);

    if (error) {
      console.error('Error fetching characters:', error);
      return;
    }

    if (data) {
      const mappedCharacters: Character[] = data.map((c: any) => ({
        id: c.id,
        name: c.name,
        avatar: c.avatar,
        bio: c.bio,
        personalityPrompt: c.personality_prompt,
        isPredefined: c.is_predefined,
        isFavorite: c.is_favorite,
        categories: c.categories,
        voiceSettings: c.voice_settings
      }));
      setCharacters(mappedCharacters);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCharacters();
    } else {
      setCharacters(PREDEFINED_CHARACTERS);
    }
  }, [user, fetchCharacters]);

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
    if (character.isPredefined) return;
    setCharacterToEdit(character);
    setCurrentView(AppView.CharacterCreation);
  }, []);

  const handleSaveCharacter = useCallback(async (characterData: Omit<Character, 'id' | 'isPredefined'>) => {
    if (!user) return;

    try {
      if (characterToEdit) {
        const { error } = await supabase
          .from('characters')
          .update({
            name: characterData.name,
            avatar: characterData.avatar,
            bio: characterData.bio,
            personality_prompt: characterData.personalityPrompt,
            categories: characterData.categories,
            voice_settings: characterData.voiceSettings
          })
          .eq('id', characterToEdit.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('characters')
          .insert({
            user_id: user.id,
            name: characterData.name,
            avatar: characterData.avatar,
            bio: characterData.bio,
            personality_prompt: characterData.personalityPrompt,
            categories: characterData.categories,
            voice_settings: characterData.voiceSettings,
            is_predefined: false
          });

        if (error) throw error;
      }

      await fetchCharacters();
      setCurrentView(AppView.CharacterSelection);
      setCharacterToEdit(null);
    } catch (err) {
      console.error('Error saving character:', err);
    }
  }, [characterToEdit, user, fetchCharacters]);

  const handleBackToSelection = useCallback(() => {
    setSelectedCharacter(null);
    setCharacterToEdit(null);
    setCurrentView(AppView.CharacterSelection);
  }, []);

  const handleDeleteCharacter = useCallback(async (characterId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', characterId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting character:', error);
      return;
    }

    await fetchCharacters();
    if (selectedCharacter?.id === characterId) {
      setSelectedCharacter(null);
      setCurrentView(AppView.CharacterSelection);
    }
  }, [selectedCharacter, user, fetchCharacters]);

  const handleToggleFavorite = useCallback(async (characterId: string) => {
    const character = characters.find(c => c.id === characterId);
    if (!character || character.isPredefined || !user) return;

    const { error } = await supabase
      .from('characters')
      .update({ is_favorite: !character.isFavorite })
      .eq('id', characterId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error toggling favorite:', error);
      return;
    }

    await fetchCharacters();
  }, [characters, user, fetchCharacters]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentView(AppView.Landing);
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
      case AppView.Landing:
        return (
          <LandingPage
            onGetStarted={() => setCurrentView(AppView.Signup)}
            onLogin={() => setCurrentView(AppView.Login)}
          />
        );
      case AppView.Login:
        return (
          <AuthForms
            type="login"
            onBack={() => setCurrentView(AppView.Landing)}
            onSwitch={() => setCurrentView(AppView.Signup)}
            onSuccess={(data) => {
              setUser(data.user);
              setCurrentView(AppView.CharacterSelection);
            }}
          />
        );
      case AppView.Signup:
        return (
          <AuthForms
            type="signup"
            onBack={() => setCurrentView(AppView.Landing)}
            onSwitch={() => setCurrentView(AppView.Login)}
            onSuccess={(data) => {
              setUser(data.user);
              setCurrentView(AppView.CharacterSelection);
            }}
          />
        );
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
          return <ChatWindow character={selectedCharacter} onBack={handleBackToSelection} user={user} />;
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
    <div className={`min-h-screen w-full flex flex-col items-center justify-center p-2 sm:p-6 bg-gradient-to-br from-[var(--gradient-start)] to-[var(--gradient-end)]`}>
      <div className="w-full max-w-6xl bg-[var(--bg-secondary)] shadow-2xl rounded-2xl overflow-hidden h-[calc(100vh-1rem)] sm:h-[calc(100vh-4rem)] flex flex-col relative">
        {currentView === AppView.CharacterSelection && (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="p-2 text-[var(--text-tertiary)] hover:text-[var(--error-color)] transition-colors"
              title="Logout"
            >
              <i className="fas fa-sign-out-alt"></i>
            </button>
            <ThemeToggle currentTheme={theme} onToggle={toggleTheme} />
          </div>
        )}
        {renderView()}
      </div>
      <footer className="text-center mt-2 sm:mt-4 text-xs text-[var(--text-tertiary)] px-2">
        <p>Minimind - AI Character Chat Simulator. Powered by Oswaldinho the Great.</p>
        <p className="hidden sm:block">Ensure your Gemini API Key is configured in your environment (process.env.API_KEY).</p>
      </footer>
    </div>
  );
};

export default Page;
