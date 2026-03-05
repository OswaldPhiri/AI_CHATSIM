import React, { useState, useEffect } from 'react';
import { Character } from '../types';
import { fetchRickAndMortyCharacters, fetchHarryPotterCharacters, fetchDisneyCharacters, fetchAnimeCharacters, fetchStarWarsCharacters } from '../services/apiService';
import IconButton from './IconButton';
import LoadingSpinner from './LoadingSpinner';

interface CharacterImporterProps {
    onImport: (characters: Character[]) => void;
    onCancel: () => void;
}

const CharacterImporter: React.FC<CharacterImporterProps> = ({ onImport, onCancel }) => {
    const [source, setSource] = useState<'rickandmorty' | 'harrypotter' | 'disney' | 'anime' | 'starwars'>('rickandmorty');
    const [characters, setCharacters] = useState<Character[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    const loadCharacters = async () => {
        setLoading(true);
        let fetched: Character[] = [];
        try {
            if (source === 'rickandmorty') {
                fetched = await fetchRickAndMortyCharacters(page);
            } else if (source === 'harrypotter') {
                fetched = await fetchHarryPotterCharacters();
            } else if (source === 'disney') {
                fetched = await fetchDisneyCharacters(page);
            } else if (source === 'anime') {
                fetched = await fetchAnimeCharacters(searchQuery);
            } else if (source === 'starwars') {
                fetched = await fetchStarWarsCharacters(page);
            }
            setCharacters(fetched);
        } catch (error) {
            console.error('Error loading characters:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (source !== 'anime' || !searchQuery) {
            loadCharacters();
        }
    }, [source, page]);

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedIds(next);
    };

    const handleImport = () => {
        const toImport = characters.filter(c => selectedIds.has(c.id));
        onImport(toImport);
    };

    const selectAll = () => {
        setSelectedIds(new Set(characters.map(c => c.id)));
    };

    const deselectAll = () => {
        setSelectedIds(new Set());
    };

    return (
        <div className="p-3 sm:p-6 bg-[var(--bg-secondary)] text-[var(--text-primary)] h-full flex flex-col">
            <header className="mb-4 sm:mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-[var(--accent-primary)]">Import Characters</h2>
                    <p className="text-xs sm:text-sm text-[var(--text-tertiary)]">Choose characters from public APIs to add to your collection</p>
                </div>
                <div className="flex gap-2">
                    <select
                        value={source}
                        onChange={(e) => {
                            setSource(e.target.value as any);
                            setPage(1);
                            setSearchQuery('');
                            setSelectedIds(new Set());
                        }}
                        className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg py-1 px-2 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus)]"
                    >
                        <option value="rickandmorty">Rick and Morty</option>
                        <option value="harrypotter">Harry Potter</option>
                        <option value="disney">Disney</option>
                        <option value="anime">Anime (Search)</option>
                        <option value="starwars">Star Wars</option>
                    </select>
                </div>
            </header>

            {source === 'anime' && (
                <div className="mb-4 flex gap-2">
                    <input
                        type="text"
                        placeholder="Search anime characters (e.g. Naruto, Goku)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-grow bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg py-1.5 px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus)]"
                        onKeyPress={(e) => e.key === 'Enter' && loadCharacters()}
                    />
                    <button
                        onClick={loadCharacters}
                        className="bg-[var(--accent-primary)] text-white px-4 py-1.5 rounded-lg text-sm font-semibold"
                    >
                        Search
                    </button>
                </div>
            )}

            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                    <button onClick={selectAll} className="text-xs bg-[var(--bg-tertiary)] px-2 py-1 rounded hover:bg-[var(--bg-hover)]">Select All</button>
                    <button onClick={deselectAll} className="text-xs bg-[var(--bg-tertiary)] px-2 py-1 rounded hover:bg-[var(--bg-hover)]">Deselect All</button>
                </div>
                <div className="text-sm font-medium">
                    {selectedIds.size} selected
                </div>
            </div>

            <div className="flex-grow overflow-y-auto pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-[var(--bg-tertiary)] scrollbar-track-[var(--bg-secondary)]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full">
                        <LoadingSpinner size="lg" />
                        <p className="mt-2 text-[var(--text-tertiary)]">Fetching characters...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                        {characters.map(char => (
                            <div
                                key={char.id}
                                onClick={() => toggleSelect(char.id)}
                                className={`relative bg-[var(--bg-tertiary)] rounded-lg p-2 cursor-pointer transition-all border-2 ${selectedIds.has(char.id) ? 'border-[var(--accent-primary)]' : 'border-transparent'}`}
                            >
                                <div className="aspect-square rounded-md overflow-hidden bg-[var(--bg-secondary)] mb-2 flex items-center justify-center text-3xl">
                                    {char.avatar.startsWith('http') ? (
                                        <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{char.avatar}</span>
                                    )}
                                </div>
                                <p className="text-xs font-semibold truncate text-[var(--text-primary)]">{char.name}</p>
                                {selectedIds.has(char.id) && (
                                    <div className="absolute top-1 right-1 bg-[var(--accent-primary)] text-white rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                                        <i className="fas fa-check text-[10px]"></i>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
                {(source === 'rickandmorty' || source === 'disney' || source === 'starwars') && (
                    <div className="flex items-center gap-2 mr-auto mb-2 sm:mb-0">
                        <button
                            disabled={page === 1 || loading}
                            onClick={() => setPage(p => p - 1)}
                            className="px-3 py-1 bg-[var(--bg-tertiary)] rounded disabled:opacity-30 hover:bg-[var(--bg-hover)]"
                        >
                            Previous
                        </button>
                        <span className="text-sm">Page {page}</span>
                        <button
                            disabled={loading || characters.length === 0}
                            onClick={() => setPage(p => p + 1)}
                            className="px-3 py-1 bg-[var(--bg-tertiary)] rounded hover:bg-[var(--bg-hover)]"
                        >
                            Next
                        </button>
                    </div>
                )}
                <div className="flex gap-2 w-full sm:w-auto ml-auto">
                    <button
                        onClick={onCancel}
                        className="flex-1 sm:flex-none bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold py-2 px-6 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        disabled={selectedIds.size === 0}
                        onClick={handleImport}
                        className="flex-1 sm:flex-none bg-[var(--button-primary)] hover:bg-[var(--button-hover)] text-[var(--button-text)] font-semibold py-2 px-8 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Import Selected
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CharacterImporter;
