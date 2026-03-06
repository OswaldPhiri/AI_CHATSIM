import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Character, ChatMessage } from '../types';
import MessageBubble from '../components/MessageBubble';
import IconButton from './IconButton';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { supabase } from '../services/supabaseClient';

interface ChatWindowProps {
  character: Character;
  onBack: () => void;
  user: any;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ character, onBack, user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
        isLoading: m.is_loading,
        avatar: m.sender === 'ai' ? character.avatar : undefined
      })));
    }
  }, [user, character.id]);

  useEffect(() => {
    fetchMessages();
  }, [character, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || isLoading || !user) return;

    const userMessageText = inputText;
    const timestamp = Date.now();
    const conversationId = character.id; // Simulating conversation ID with character ID for now

    // 1. Optimistic update (UI)
    const tempUserMsgId = crypto.randomUUID();
    setMessages((prev: ChatMessage[]) => [...prev, { id: tempUserMsgId, text: userMessageText, sender: 'user', timestamp }]);
    setInputText('');
    setIsLoading(true);

    const aiMessageId = crypto.randomUUID();
    setMessages((prev: ChatMessage[]) => [...prev, { id: aiMessageId, text: '', sender: 'ai', timestamp: Date.now(), isLoading: true, avatar: character.avatar }]);

    try {
      // 2. Call Serverless API
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          message: userMessageText,
          characterId: character.id,
          conversationId: conversationId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || 'Failed to get response from AI');
      }

      const { reply } = await response.json();

      // 3. Update UI
      setMessages((prev: ChatMessage[]) =>
        prev.map((msg: ChatMessage) =>
          msg.id === aiMessageId ? { ...msg, text: reply, isLoading: false } : msg
        )
      );

      if (isTTSEnabled && reply) {
        speak(reply, character.voiceSettings);
      }
    } catch (error: any) {
      console.error('Error in chat flow:', error);
      setMessages((prev: ChatMessage[]) =>
        prev.map((msg: ChatMessage) =>
          msg.id === aiMessageId ? { ...msg, text: `Error: ${error.message || 'Sorry, I encountered an error. Please try again.'}`, isLoading: false, sender: 'ai' } : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, character, user, isTTSEnabled, speak]);

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
            <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-[var(--bg-tertiary)] rounded-full overflow-hidden text-3xl">
              {character.avatar.startsWith('http') ? (
                <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
              ) : (
                <span>{character.avatar}</span>
              )}
            </div>
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
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
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
