import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Character, ChatMessage } from '../types';
import { GEMINI_MODEL_NAME } from '../constants';
import { GoogleGenAI, Chat } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import IconButton from './IconButton';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { supabase } from '../services/supabaseClient';
import '../styles/animations.css';

interface ChatWindowProps {
  character: Character;
  onBack: () => void;
  user: any;
}

// Ensure VITE_ prefix for Vite environment variables
const API_KEY = (import.meta as any).env.VITE_GEMINI_API_KEY || (import.meta as any).env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
}

const ChatWindow: React.FC<ChatWindowProps> = ({ character, onBack, user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [geminiChat, setGeminiChat] = useState<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isTTSEnabled, setIsTTSEnabled] = useState(false);
  const { speak, stopSpeaking, isSpeaking, availableVoices } = useTextToSpeech();

  const handleSpeechResult = useCallback((transcript: string) => {
    setInputText(prev => prev + transcript);
  }, []);

  const { isListening, startListening, stopListening, browserSupportsSpeechRecognition } = useSpeechRecognition({ onResult: handleSpeechResult });

  const fetchMessages = useCallback(async () => {
    if (!user || !character.id) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('character_id', character.id)
      .eq('user_id', user.id)
      .order('timestamp', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    if (data) {
      setMessages(data.map((m: any) => ({
        id: m.id,
        text: m.text,
        sender: m.sender,
        timestamp: m.timestamp,
        isLoading: m.is_loading
      })));
    }
  }, [user, character.id]);

  useEffect(() => {
    fetchMessages();

    // Initialize Gemini Chat session
    if (ai) {
      const chatInstance = ai.chats.create({
        model: GEMINI_MODEL_NAME,
        config: {
          systemInstruction: character.personalityPrompt,
        },
      });
      setGeminiChat(chatInstance);
    }
  }, [character, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || isLoading || !geminiChat || !user) return;

    const userMessageText = inputText;
    const timestamp = Date.now();

    // 1. Optimistic update (UI)
    const tempUserMsgId = uuidv4();
    setMessages(prev => [...prev, { id: tempUserMsgId, text: userMessageText, sender: 'user', timestamp }]);
    setInputText('');
    setIsLoading(true);

    const aiMessageId = uuidv4();
    setMessages(prev => [...prev, { id: aiMessageId, text: '', sender: 'ai', timestamp: Date.now(), isLoading: true }]);

    try {
      // 2. Save user message to Supabase
      await supabase.from('messages').insert({
        character_id: character.id,
        user_id: user.id,
        text: userMessageText,
        sender: 'user',
        timestamp
      });

      // 3. Get AI Response
      const stream = await geminiChat.sendMessageStream({ message: userMessageText });
      let fullText = "";
      for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (chunkText) {
          fullText += chunkText;
          setMessages((prev: ChatMessage[]) =>
            prev.map((msg: ChatMessage) =>
              msg.id === aiMessageId ? { ...msg, text: fullText, isLoading: true } : msg
            )
          );
        }
      }

      // 4. Update UI and Save AI message to Supabase
      setMessages((prev: ChatMessage[]) =>
        prev.map((msg: ChatMessage) =>
          msg.id === aiMessageId ? { ...msg, text: fullText, isLoading: false } : msg
        )
      );

      await supabase.from('messages').insert({
        character_id: character.id,
        user_id: user.id,
        text: fullText,
        sender: 'ai',
        timestamp: Date.now()
      });

      if (isTTSEnabled && fullText) {
        speak(fullText, character.voiceSettings);
      }
    } catch (error) {
      console.error('Error in chat flow:', error);
      setMessages((prev: ChatMessage[]) =>
        prev.map((msg: ChatMessage) =>
          msg.id === aiMessageId ? { ...msg, text: 'Sorry, I encountered an error. Please try again.', isLoading: false, sender: 'ai' } : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, geminiChat, character, user, isTTSEnabled, speak]);

  const handleClearHistory = async () => {
    if (window.confirm("Are you sure you want to clear the chat history for this character?") && user) {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('character_id', character.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing history:', error);
        return;
      }

      setMessages([]);
      // Re-initialize Gemini Chat session for a fresh start without history
      if (ai) {
        const chatInstance = ai.chats.create({
          model: GEMINI_MODEL_NAME,
          config: { systemInstruction: character.personalityPrompt },
        });
        setGeminiChat(chatInstance);
      }
    }
  };

  const toggleTTS = () => {
    if (isSpeaking) stopSpeaking();
    setIsTTSEnabled(prev => !prev);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!API_KEY) {
    return (
      <div className="p-6 flex flex-col h-full items-center justify-center text-center">
        <h2 className="text-xl font-semibold text-red-400 mb-4">API Key Missing</h2>
        <p className="text-gray-300">The Gemini API Key (process.env.API_KEY) is not configured.</p>
        <p className="text-gray-400 text-sm">Please ensure it's set in your environment to use the chat features.</p>
        <button onClick={onBack} className="mt-6 bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 px-4 rounded-lg">
          Back to Character Selection
        </button>
      </div>
    );
  }


  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)]">
      <header className="p-4 border-b border-[var(--border-color)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <IconButton
              icon={<i className="fas fa-arrow-left text-[var(--text-primary)] hover:text-[var(--text-hover)]"></i>}
              onClick={onBack}
              className="mr-2 sm:mr-3 text-[var(--text-primary)] hover:text-[var(--text-hover)] transition-colors duration-200 hover-lift"
              ariaLabel="Back to character selection"
            />
            <span className="text-3xl">{character.avatar}</span>
            <div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)]">{character.name}</h2>
              <p className="text-sm text-[var(--text-tertiary)]">{character.bio}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {browserSupportsSpeechRecognition && (
              <div className="relative group">
                <IconButton
                  icon={<i className={`fas fa-volume-${isTTSEnabled ? 'up' : 'mute'} text-[var(--accent-primary)]`}></i>}
                  onClick={toggleTTS}
                  ariaLabel={isTTSEnabled ? "Disable Text-to-Speech" : "Enable Text-to-Speech"}
                  className="hover:bg-[var(--bg-tertiary)] p-2 rounded-full transition-all duration-200 hover-lift"
                />
                {isTTSEnabled && (
                  <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-tertiary)] rounded-lg shadow-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 hidden sm:block animate-scale-in">
                    <p className="text-xs text-[var(--text-tertiary)] mb-1">Voice Settings:</p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {character.voiceSettings?.voiceName || 'Default Voice'}<br />
                      Pitch: {character.voiceSettings?.pitch || 1}<br />
                      Rate: {character.voiceSettings?.rate || 1}
                    </p>
                  </div>
                )}
              </div>
            )}
            <IconButton
              icon={<i className="fas fa-trash-alt text-[var(--error-color)]"></i>}
              onClick={handleClearHistory}
              ariaLabel="Clear chat history"
              className="hover:bg-[var(--bg-tertiary)] p-2 rounded-full transition-all duration-200 hover-lift"
            />
          </div>
        </div>
      </header>

      <div className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[var(--bg-tertiary)] scrollbar-track-[var(--bg-secondary)]">
        {messages.map((msg, index) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-lg p-3 ${msg.sender === 'user'
                ? 'bg-[var(--accent-primary)] text-[var(--button-text)]'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                }`}
            >
              <p className="text-sm sm:text-base whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
        {isLoading && messages[messages.length - 1]?.sender === 'ai' && messages[messages.length - 1]?.isLoading && (
          <div className="flex justify-start">
            <div className="bg-[var(--bg-tertiary)] rounded-lg p-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="flex items-center bg-[var(--bg-tertiary)] rounded-lg p-1 transition-all duration-200 focus-within:ring-2 focus-within:ring-[var(--input-focus)]">
          {browserSupportsSpeechRecognition && (
            <IconButton
              icon={<i className={`fas fa-microphone ${isListening ? 'text-[var(--error-color)] animate-pulse' : 'text-[var(--text-primary)]'} transition-colors duration-200`}></i>}
              onClick={toggleListening}
              disabled={isLoading || !browserSupportsSpeechRecognition}
              className="p-2 sm:p-3 hover:bg-[var(--bg-tertiary)] rounded-full transition-all duration-200 hover-lift"
              ariaLabel={isListening ? "Stop Listening" : "Start Listening"}
            />
          )}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (handleSendMessage(), e.preventDefault())}
            placeholder={isListening ? "Listening..." : `Message ${character.name}...`}
            className="flex-grow bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg py-2 px-3 text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus)]"
            disabled={isLoading || isListening}
          />
          <IconButton
            icon={<i className="fas fa-paper-plane text-[var(--button-text)] hover:text-[var(--button-hover)] transition-colors duration-200"></i>}
            onClick={handleSendMessage}
            disabled={isLoading || !inputText.trim() || isListening}
            className={`p-2 sm:p-3 hover:bg-[var(--bg-tertiary)] rounded-full transition-all duration-200 hover-lift disabled:opacity-50 disabled:cursor-not-allowed ${isLoading || !inputText.trim() || isListening
              ? 'bg-[var(--button-disabled)] text-[var(--text-tertiary)]'
              : 'bg-[var(--button-primary)] hover:bg-[var(--button-hover)] text-[var(--button-text)]'
              }`}
            ariaLabel="Send message"
          />
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
