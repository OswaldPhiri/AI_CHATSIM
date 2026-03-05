import React, { useState } from 'react';
import { Character } from '../types';
import { AVAILABLE_CATEGORIES } from '../constants';
import IconButton from './IconButton';

interface CharacterSelectorProps {
  characters: Character[];
  onSelectCharacter: (character: Character) => void;
  onCreateCharacter: () => void;
  onDeleteCharacter: (characterId: string) => void;
  onEditCharacter: (character: Character) => void;
  onToggleFavorite: (characterId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  showFavoritesOnly: boolean;
  onToggleFavoritesOnly: () => void;
  sortOrder: 'name' | 'category';
  onSortOrderChange: (order: 'name' | 'category') => void;
  onImportCharacters: () => void;
}

const CharacterSelector: React.FC<CharacterSelectorProps> = ({
  characters,
  onSelectCharacter,
  onCreateCharacter,
  onDeleteCharacter,
  onEditCharacter,
  onToggleFavorite,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  showFavoritesOnly,
  onToggleFavoritesOnly,
  sortOrder,
  onSortOrderChange,
  onImportCharacters,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  return (
    <div className="p-3 sm:p-6 bg-[var(--bg-secondary)] text-[var(--text-primary)] h-full flex flex-col">
      <header className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--accent-primary)] text-center animate-fade-in">
          Choose Your Character
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-tertiary)] text-center mt-1 animate-fade-in-delay">
          Select a character to chat with or create your own
        </p>
      </header>

      <div className="space-y-3 sm:space-y-4 animate-slide-down">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <div className="relative flex-grow">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search characters..."
              className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg py-2 px-3 pl-8 text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus)]"
            />
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-tertiary)]"></i>
          </div>
          <div className="flex gap-2">
            <select
              value={selectedCategory || ''}
              onChange={(e) => onCategoryChange(e.target.value || null)}
              className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg py-2 px-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus)]"
            >
              <option value="">All Categories</option>
              {AVAILABLE_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <button
              onClick={onToggleFavoritesOnly}
              className={`px-3 py-2 rounded-lg transition-colors duration-200 ${showFavoritesOnly
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-[var(--input-bg)] text-[var(--text-primary)] border border-[var(--input-border)]'
                }`}
            >
              <i className="fas fa-star"></i>
            </button>
            <select
              value={sortOrder}
              onChange={(e) => onSortOrderChange(e.target.value as 'name' | 'category')}
              className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg py-2 px-3 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus)]"
            >
              <option value="name">Sort by Name</option>
              <option value="category">Sort by Category</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-4 flex-grow overflow-y-auto pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-[var(--bg-tertiary)] scrollbar-track-[var(--bg-secondary)]">
        {characters.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-tertiary)] animate-fade-in">
            <p>No characters found. Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {characters.map(character => (
              <div
                key={character.id}
                className="bg-[var(--bg-tertiary)] rounded-lg p-3 sm:p-4 hover:shadow-lg transition-all duration-200 cursor-pointer group animate-fade-in"
                onClick={() => onSelectCharacter(character)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-[var(--bg-secondary)] rounded-full overflow-hidden text-2xl sm:text-3xl">
                      {character.avatar.startsWith('http') ? (
                        <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{character.avatar}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors duration-200">
                        {character.name}
                      </h3>
                      <p className="text-sm text-[var(--text-tertiary)] line-clamp-2">
                        {character.bio}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <IconButton
                      icon={<i className={`fas fa-star ${character.isFavorite ? 'text-yellow-400' : 'text-[var(--text-tertiary)]'}`}></i>}
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        onToggleFavorite(character.id);
                      }}
                      ariaLabel={character.isFavorite ? "Remove from favorites" : "Add to favorites"}
                      className="hover:bg-[var(--bg-secondary)] p-1.5 sm:p-2 rounded-full transition-all duration-200 hover-lift"
                    />
                    {!character.isPredefined && (
                      <>
                        <IconButton
                          icon={<i className="fas fa-edit text-[var(--accent-primary)]"></i>}
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            onEditCharacter(character);
                          }}
                          ariaLabel="Edit character"
                          className="hover:bg-[var(--bg-secondary)] p-1.5 sm:p-2 rounded-full transition-all duration-200 hover-lift"
                        />
                        <IconButton
                          icon={<i className="fas fa-trash-alt text-[var(--error-color)]"></i>}
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            if (window.confirm(`Are you sure you want to delete ${character.name}?`)) {
                              onDeleteCharacter(character.id);
                            }
                          }}
                          ariaLabel="Delete character"
                          className="hover:bg-[var(--bg-secondary)] p-1.5 sm:p-2 rounded-full transition-all duration-200 hover-lift"
                        />
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {character.categories.map(category => (
                    <span
                      key={category}
                      className="text-xs px-2 py-1 bg-[var(--bg-secondary)] text-[var(--text-tertiary)] rounded-full"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-3 animate-slide-up">
        <button
          onClick={onCreateCharacter}
          className="flex-1 bg-[var(--button-primary)] hover:bg-[var(--button-hover)] text-[var(--button-text)] font-semibold py-2 px-4 rounded-lg transition-colors duration-200 hover-lift"
        >
          Create New Character
        </button>
        <button
          onClick={onImportCharacters}
          className="flex-1 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold py-2 px-4 rounded-lg transition-colors duration-200 hover-lift border border-[var(--border-color)]"
        >
          Import from API
        </button>
      </div>
    </div>
  );
};

export default CharacterSelector;
