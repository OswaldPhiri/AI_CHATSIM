import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Character, ChatMessage } from '../types';
import { GEMINI_MODEL_NAME, LOCAL_STORAGE_CHAT_HISTORY_KEY_PREFIX } from '../constants';
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import MessageBubble from './MessageBubble';
import IconButton from './IconButton';
import LoadingSpinner from './LoadingSpinner';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

interface ChatWindowProps {
  character: Character;
  onBack: () => void;
}

const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

const ChatWindow: React.FC<ChatWindowProps> = ({ character, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [geminiChat, setGeminiChat] = useState<Chat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatHistoryKey = `${LOCAL_STORAGE_CHAT_HISTORY_KEY_PREFIX}${character.id}`;

  const [isTTSEnabled, setIsTTSEnabled] = useState(false);
  const { speak, stopSpeaking, isSpeaking, availableVoices, error: ttsError } = useTextToSpeech();
  const { isListening, startListening, stopListening, browserSupportsSpeechRecognition } = useSpeechRecognition({
    onResult: handleSpeechResult,
    onError: (error) => {
      console.error('Speech recognition error:', error);
      setError('Speech recognition failed. Please try again.');
    }
  });

  const ai = API_KEY ? new GoogleGenAI(API_KEY) : null;

  const handleSpeechResult = useCallback((transcript: string) => {
    setInputText(transcript);
  }, []);

  useEffect(() => {
    // Load chat history from localStorage
    const savedHistory = localStorage.getItem(chatHistoryKey);
    if (savedHistory) {
      setMessages(JSON.parse(savedHistory));
    } else {
      setMessages([]); // Start fresh if no history
    }

    // Initialize Gemini Chat session
    if (!API_KEY || error) {
      setError("API Key is not configured");
      return;
    }

    try {
      if (ai) {
        const chatInstance = ai.chats.create({
          model: GEMINI_MODEL_NAME,
          config: { systemInstruction: character.personalityPrompt },
        });
        setGeminiChat(chatInstance);
        setError(null);
      }
    } catch (err) {
      console.error('Error initializing Gemini chat:', err);
      setError("Failed to initialize chat. Please try again later.");
    }
  }, [character.personalityPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Save chat history to localStorage
    if (messages.length > 0) {
      localStorage.setItem(chatHistoryKey, JSON.stringify(messages.filter(m => !m.isLoading)));
    }
  }, [messages, chatHistoryKey]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !geminiChat || isLoading) return;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      content: inputText.trim(),
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    const aiMessage: ChatMessage = {
      id: uuidv4(),
      content: '',
      sender: 'ai',
      isLoading: true,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage, aiMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const result = await geminiChat.sendMessage(userMessage.content);
      const response = await result.response;
      const text = response.text();

      setMessages(prev => prev.map(msg => 
        msg.id === aiMessage.id 
          ? { ...msg, content: text, isLoading: false }
          : msg
      ));

      if (isTTSEnabled) {
        speak(text, character.voiceSettings);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
      setMessages(prev => prev.filter(msg => msg.id !== aiMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear the chat history for this character?")) {
      setMessages([]);
      localStorage.removeItem(chatHistoryKey);
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
    if (isSpeaking) {
      stopSpeaking();
    }
    setIsTTSEnabled(prev => !prev);
  };
  
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Show error toast if TTS error occurs
  useEffect(() => {
    if (ttsError) {
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in-out';
      toast.textContent = ttsError;
      document.body.appendChild(toast);
      
      // Remove toast after 3 seconds
      const timeout = setTimeout(() => {
        toast.remove();
      }, 3000);
      
      return () => {
        clearTimeout(timeout);
        toast.remove();
      };
    }
  }, [ttsError]);

  if (!API_KEY || error) {
    return (
      <div className="p-6 flex flex-col h-full items-center justify-center text-center">
        <h2 className="text-xl font-semibold text-red-400 mb-4">
          {!API_KEY ? "API Key Missing" : "Error"}
        </h2>
        <p className="text-gray-300">
          {!API_KEY 
            ? "The Gemini API Key (process.env.API_KEY) is not configured."
            : error}
        </p>
        <p className="text-gray-400 text-sm mt-2">
          {!API_KEY 
            ? "Please ensure it's set in your environment to use the chat features."
            : "Please try again or contact support if the problem persists."}
        </p>
        <button 
          onClick={onBack} 
          className="mt-6 bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Back to Character Selection
        </button>
      </div>
    );
  }


  return (
    <div className="flex flex-col h-full bg-gray-800">
      <header className="p-2 sm:p-4 bg-gray-700 shadow-md flex items-center justify-between">
        <div className="flex items-center min-w-0">
          <IconButton 
            icon={<i className="fas fa-arrow-left"></i>} 
            onClick={onBack} 
            className="mr-2 sm:mr-3 text-sky-400 hover:text-sky-300 transition-colors duration-200"
            ariaLabel="Back to character selection"
          />
          <span className="text-2xl sm:text-3xl mr-2 sm:mr-3 animate-bounce flex-shrink-0">{character.avatar}</span>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-semibold text-sky-400 truncate">{character.name}</h2>
            <p className="text-xs text-gray-400 truncate">{character.bio}</p>
          </div>
        </div>
        <div className="flex items-center space-x-1 sm:space-x-2 ml-2">
          {browserSupportsSpeechRecognition && (
            <div className="relative group">
              <IconButton
                icon={<i className={`fas ${isTTSEnabled ? 'fa-volume-up text-green-400' : 'fa-volume-mute text-gray-400'} transition-colors duration-200`}></i>}
                onClick={toggleTTS}
                ariaLabel={isTTSEnabled ? "Disable Text-to-Speech" : "Enable Text-to-Speech"}
                className="hover:bg-gray-600 p-1.5 sm:p-2 rounded-full transition-all duration-200"
              />
              {isTTSEnabled && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 hidden sm:block">
                  <p className="text-xs text-gray-300 mb-1">Voice Settings:</p>
                  <p className="text-xs text-gray-400">
                    {character.voiceSettings?.voiceName || 'Default Voice'}<br/>
                    Pitch: {character.voiceSettings?.pitch || 1}<br/>
                    Rate: {character.voiceSettings?.rate || 1}
                  </p>
                </div>
              )}
            </div>
          )}
          <IconButton
            icon={<i className="fas fa-trash-alt text-red-500 hover:text-red-400 transition-colors duration-200"></i>}
            onClick={handleClearHistory}
            ariaLabel="Clear chat history"
            className="hover:bg-gray-600 p-1.5 sm:p-2 rounded-full transition-all duration-200"
          />
        </div>
      </header>

      <div className="flex-grow overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {isLoading && messages[messages.length -1]?.sender === 'ai' && messages[messages.length -1]?.isLoading && (
        <div className="px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-400 flex items-center animate-pulse">
          <LoadingSpinner size="sm" />
          <span className="ml-2">{character.name} is typing...</span>
        </div>
      )}

      <div className="p-2 sm:p-4 bg-gray-700 shadow-up">
        <div className="flex items-center bg-gray-600 rounded-lg p-1 transition-all duration-200 focus-within:ring-2 focus-within:ring-sky-500">
          {browserSupportsSpeechRecognition && (
            <IconButton
              icon={<i className={`fas fa-microphone ${isListening ? 'text-red-500 animate-pulse' : 'text-sky-400'} transition-colors duration-200`}></i>}
              onClick={toggleListening}
              disabled={isLoading || !browserSupportsSpeechRecognition}
              className="p-2 sm:p-3 hover:bg-gray-500 rounded-full transition-all duration-200"
              ariaLabel={isListening ? "Stop Listening" : "Start Listening"}
            />
          )}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (handleSendMessage(), e.preventDefault())}
            placeholder={isListening ? "Listening..." : `Message ${character.name}...`}
            className="flex-grow bg-transparent p-2 sm:p-3 text-sm sm:text-base text-gray-100 focus:outline-none placeholder-gray-400 transition-colors duration-200"
            disabled={isLoading || isListening}
          />
          <IconButton
            icon={<i className="fas fa-paper-plane text-sky-400 transition-colors duration-200"></i>}
            onClick={handleSendMessage}
            disabled={isLoading || !inputText.trim()}
            className="p-2 sm:p-3 hover:bg-gray-500 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            ariaLabel="Send message"
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-out {
          0% { opacity: 0; transform: translateY(1rem); }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-1rem); }
        }
        .animate-fade-in-out {
          animation: fade-in-out 3s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ChatWindow;
