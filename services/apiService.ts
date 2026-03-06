import { Character } from '../types';

const getVoiceIdForCharacter = (name: string): string | undefined => {
    const n = name.toLowerCase();

    // Hardcoded community/premade IDs for common characters
    if (n.includes('rick sanchez')) return '2EiwWnXFnvU5JabPnv8n'; // Clyde (Gravelly/Rick-like)
    if (n.includes('morty smith')) return 'AZnzlk1XvdvUeBnXmlld'; // Young/Nervous
    if (n.includes('darth vader')) return 'pNInz6obpguemS3ad7mE'; // Adam (Deep/Vader-like)
    if (n.includes('yoda')) return 'N2lVS1wzih964MvYFrbd'; // Community Yoda
    if (n.includes('harry potter')) return 'ErXw9S1naIW6xiD8i41B'; // Antoni (British/Young)
    if (n.includes('hermione')) return 'EXAVITQu4vr4ARTeXPZC'; // Bella (British/Smart)

    return undefined;
};

export const fetchRickAndMortyCharacters = async (page: number = 1): Promise<Character[]> => {
    try {
        const response = await fetch(`https://rickandmortyapi.com/api/character?page=${page}`);
        if (!response.ok) throw new Error('Failed to fetch Rick and Morty characters');
        const data = await response.json();

        return data.results.map((char: any) => ({
            id: `rm-${char.id}`,
            name: char.name,
            avatar: char.image,
            bio: `${char.species} from ${char.origin.name}. Status: ${char.status}.`,
            personalityPrompt: `You are ${char.name} from Rick and Morty. You are a ${char.species}. Your status is ${char.status}. Speak in the style of this character. If you are Rick Sanchez, be cynical, scientific, and occasionally burp. If you are Morty, be anxious and hesitant. Otherwise, stay true to the show's dark humor and sci-fi themes. Keep responses concise and human-like.`,
            isPredefined: false,
            categories: ['Cartoon', 'Sci-Fi', 'Rick and Morty'],
            isFavorite: false,
            voiceSettings: {
                voiceId: getVoiceIdForCharacter(char.name),
                pitch: 1.0,
                rate: 1.0,
                lang: 'en-US'
            }
        }));
    } catch (error) {
        console.error('Error fetching Rick and Morty characters:', error);
        return [];
    }
};

export const fetchHarryPotterCharacters = async (): Promise<Character[]> => {
    try {
        const response = await fetch('https://hp-api.onrender.com/api/characters');
        if (!response.ok) throw new Error('Failed to fetch Harry Potter characters');
        const data = await response.json();

        // Filter characters with images and limited to first 30 for performance/quality
        return data
            .filter((char: any) => char.image)
            .slice(0, 30)
            .map((char: any) => ({
                id: `hp-${char.id || char.name.toLowerCase().replace(/\s+/g, '-')}`,
                name: char.name,
                avatar: char.image,
                bio: `A ${char.house || 'mysterious'} wizard/witch from Hogwarts. Ancestry: ${char.ancestry || 'unknown'}. Patronus: ${char.patronus || 'unknown'}.`,
                personalityPrompt: `You are ${char.name} from Harry Potter. You belong to ${char.house} house. Your patronus is a ${char.patronus}. Speak in the style of this character, staying true to the magical world of Hogwarts. Be brave if you are Gryffindor, ambitious if Slytherin, wise if Ravenclaw, or loyal if Hufflepuff. Keep responses concise and human-like.`,
                isPredefined: false,
                categories: ['Magic', 'Harry Potter', char.house || 'Hogwarts'],
                isFavorite: false,
                voiceSettings: {
                    voiceId: getVoiceIdForCharacter(char.name),
                    pitch: 1.0,
                    rate: 1.0,
                    lang: 'en-GB' // British English for Harry Potter
                }
            }));
    } catch (error) {
        console.error('Error fetching Harry Potter characters:', error);
        return [];
    }
};

export const fetchDisneyCharacters = async (page: number = 1): Promise<Character[]> => {
    try {
        const response = await fetch(`https://api.disneyapi.dev/character?page=${page}&pageSize=50`);
        if (!response.ok) throw new Error('Failed to fetch Disney characters');
        const data = await response.json();

        return data.data.map((char: any) => ({
            id: `disney-${char._id}`,
            name: char.name,
            avatar: char.imageUrl || '✨',
            bio: `A classic Disney character known from ${char.films?.[0] || 'various Disney productions'}.`,
            personalityPrompt: `You are ${char.name} from Disney. You are known for being a part of ${char.films?.join(', ') || 'the Disney world'}. Speak in the style of this character, being magical, friendly, and family-oriented. Stay true to your personality in the movies. Keep responses concise and human-like.`,
            isPredefined: false,
            categories: ['Disney', 'Cartoon', 'Hero'],
            isFavorite: false,
            voiceSettings: {
                voiceId: getVoiceIdForCharacter(char.name),
                pitch: 1.1,
                rate: 1.0,
                lang: 'en-US'
            }
        }));
    } catch (error) {
        console.error('Error fetching Disney characters:', error);
        return [];
    }
};

export const fetchAnimeCharacters = async (query: string = ''): Promise<Character[]> => {
    try {
        const url = query
            ? `https://api.jikan.moe/v4/characters?q=${encodeURIComponent(query)}&limit=20`
            : `https://api.jikan.moe/v4/top/characters?limit=20`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch Anime characters');
        const data = await response.json();

        return data.data.map((char: any) => ({
            id: `anime-${char.mal_id}`,
            name: char.name,
            avatar: char.images.jpg.image_url,
            bio: char.about ? char.about.substring(0, 150) + '...' : 'A popular anime character.',
            personalityPrompt: `You are ${char.name} from an anime. Speak in the style of this character. Use common anime tropes if appropriate. Be expressive and stay true to your character's known personality traits. Keep responses concise and human-like.`,
            isPredefined: false,
            categories: ['Anime', 'Cartoon', 'Hero'],
            isFavorite: false,
            voiceSettings: {
                voiceId: getVoiceIdForCharacter(char.name),
                pitch: 1.0,
                rate: 1.1,
                lang: 'ja-JP' // Default to Japanese if user prefers, but will speak English with AI
            }
        }));
    } catch (error) {
        console.error('Error fetching Anime characters:', error);
        return [];
    }
};

export const fetchStarWarsCharacters = async (page: number = 1): Promise<Character[]> => {
    try {
        const response = await fetch(`https://swapi.dev/api/people/?page=${page}`);
        if (!response.ok) throw new Error('Failed to fetch Star Wars characters');
        const data = await response.json();

        // Star Wars API doesn't provide images, so we'll use a placeholder or emoji
        return data.results.map((char: any) => {
            const id = char.url.split('/').filter(Boolean).pop();
            return {
                id: `sw-${id}`,
                name: char.name,
                avatar: '🚀', // Placeholder emoji for Star Wars characters without direct image links
                bio: `A character from the Star Wars universe. Height: ${char.height}, Mass: ${char.mass}, Hair: ${char.hair_color}.`,
                personalityPrompt: `You are ${char.name} from Star Wars. Speak in the style of this character. If you are Jedi, talk about the Force. If you are a droid, beep or be meticulous. Stay true to the Star Wars space opera themes. Keep responses concise and human-like.`,
                isPredefined: false,
                categories: ['Star Wars', 'Sci-Fi', 'Hero'],
                isFavorite: false,
                voiceSettings: {
                    voiceId: getVoiceIdForCharacter(char.name),
                    pitch: 1.0,
                    rate: 1.0,
                    lang: 'en-US'
                }
            };
        });
    } catch (error) {
        console.error('Error fetching Star Wars characters:', error);
        return [];
    }
};
