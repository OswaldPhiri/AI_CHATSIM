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

// Assume process.env.API_KEY is available in the environment
const API_KEY = process.env.API_KEY;
let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.warn("API_KEY environment variable not set. Gemini API will not function.");
}

const ChatWindow: React.FC<ChatWindowProps> = ({ character, onBack }) => {
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

  const chatHistoryKey = `${LOCAL_STORAGE_CHAT_HISTORY_KEY_PREFIX}${character.id}`;

  useEffect(() => {
    // Load chat history from localStorage
    const savedHistory = localStorage.getItem(chatHistoryKey);
    if (savedHistory) {
      setMessages(JSON.parse(savedHistory));
    } else {
      setMessages([]); // Start fresh if no history
    }

    // Initialize Gemini Chat session
    if (ai) {
      const chatInstance = ai.chats.create({
        model: GEMINI_MODEL_NAME,
        config: {
          systemInstruction: character.personalityPrompt,
        },
        // history: savedHistory ? JSON.parse(savedHistory).map(msg => ({ // TODO: Map to Gemini history format
        //   role: msg.sender === 'user' ? 'user' : 'model',
        //   parts: [{text: msg.text}]
        // })) : [] // This mapping might be complex; starting fresh chat session for now
      });
      setGeminiChat(chatInstance);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character, chatHistoryKey]); // Re-init on character change

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Save chat history to localStorage
    if (messages.length > 0) {
      localStorage.setItem(chatHistoryKey, JSON.stringify(messages.filter(m => !m.isLoading)));
    }
  }, [messages, chatHistoryKey]);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || isLoading || !geminiChat) return;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      text: inputText,
      sender: 'user',
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    const aiMessageId = uuidv4();
    setMessages(prev => [...prev, { id: aiMessageId, text: '', sender: 'ai', timestamp: Date.now(), isLoading: true }]);

    try {
      const stream = await geminiChat.sendMessageStream({ message: userMessage.text });
      let fullText = "";
      for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (chunkText) {
          fullText += chunkText;
          setMessages(prev =>
            prev.map(msg =>
              msg.id === aiMessageId ? { ...msg, text: fullText, isLoading: true } : msg
            )
          );
        }
      }
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId ? { ...msg, text: fullText, isLoading: false } : msg
        )
      );
      if (isTTSEnabled && fullText) {
        speak(fullText, character.voiceSettings);
      }
    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId ? { ...msg, text: 'Sorry, I encountered an error. Please try again.', isLoading: false, sender: 'ai' } : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, geminiChat, character.personalityPrompt, isTTSEnabled, speak, character.voiceSettings]);

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
    <div className="flex flex-col h-full bg-gray-800">
      <header className="p-4 bg-gray-700 shadow-md flex items-center justify-between">
        <div className="flex items-center">
          <IconButton 
            icon={<i className="fas fa-arrow-left"></i>} 
            onClick={onBack} 
            className="mr-3 text-sky-400 hover:text-sky-300 transition-colors duration-200"
            ariaLabel="Back to character selection"
          />
          <span className="text-3xl mr-3 animate-bounce">{character.avatar}</span>
          <div>
            <h2 className="text-xl font-semibold text-sky-400">{character.name}</h2>
            <p className="text-xs text-gray-400 truncate max-w-xs">{character.bio}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {browserSupportsSpeechRecognition && (
            <div className="relative group">
              <IconButton
                icon={<i className={`fas ${isTTSEnabled ? 'fa-volume-up text-green-400' : 'fa-volume-mute text-gray-400'} transition-colors duration-200`}></i>}
                onClick={toggleTTS}
                ariaLabel={isTTSEnabled ? "Disable Text-to-Speech" : "Enable Text-to-Speech"}
                className="hover:bg-gray-600 p-2 rounded-full transition-all duration-200"
              />
              {isTTSEnabled && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
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
            className="hover:bg-gray-600 p-2 rounded-full transition-all duration-200"
          />
        </div>
      </header>

      <div className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {isLoading && messages[messages.length -1]?.sender === 'ai' && messages[messages.length -1]?.isLoading && (
        <div className="px-4 py-2 text-sm text-gray-400 flex items-center animate-pulse">
          <LoadingSpinner size="sm" />
          <span className="ml-2">{character.name} is typing...</span>
        </div>
      )}

      <div className="p-4 bg-gray-700 shadow-up">
        <div className="flex items-center bg-gray-600 rounded-lg p-1 transition-all duration-200 focus-within:ring-2 focus-within:ring-sky-500">
          {browserSupportsSpeechRecognition && (
            <IconButton
              icon={<i className={`fas fa-microphone ${isListening ? 'text-red-500 animate-pulse' : 'text-sky-400'} transition-colors duration-200`}></i>}
              onClick={toggleListening}
              disabled={isLoading || !browserSupportsSpeechRecognition}
              className="p-3 hover:bg-gray-500 rounded-full transition-all duration-200"
              ariaLabel={isListening ? "Stop Listening" : "Start Listening"}
            />
          )}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (handleSendMessage(), e.preventDefault())}
            placeholder={isListening ? "Listening..." : `Message ${character.name}...`}
            className="flex-grow bg-transparent p-3 text-gray-100 focus:outline-none placeholder-gray-400 transition-colors duration-200"
            disabled={isLoading || isListening}
          />
          <IconButton
            icon={<i className="fas fa-paper-plane text-sky-400 transition-colors duration-200"></i>}
            onClick={handleSendMessage}
            disabled={isLoading || !inputText.trim()}
            className="p-3 hover:bg-gray-500 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            ariaLabel="Send message"
          />
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
