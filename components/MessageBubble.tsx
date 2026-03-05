import React from 'react';
import { ChatMessage } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isAI = message.sender === 'ai';
  const isUser = message.sender === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
      <div
        className={`relative max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2 sm:px-5 sm:py-3 shadow-md transition-all duration-300 ${isAI
            ? 'bg-[var(--accent-primary)] text-[var(--button-text)] rounded-tl-none hover:bg-[var(--accent-hover)]'
            : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-tr-none hover:bg-[var(--bg-hover)]'
          }`}
      >
        {message.isLoading ? (
          <div className="flex items-center space-x-2 min-w-[60px]">
            <LoadingSpinner size="sm" />
            <span className="text-sm animate-pulse text-[var(--text-primary)]">Thinking...</span>
          </div>
        ) : (
          <>
            <div className="prose prose-sm sm:prose-base prose-invert max-w-none">
              {message.text.split('\n').map((line, i) => (
                <p key={i} className="mb-1 last:mb-0">
                  {line}
                </p>
              ))}
            </div>
            {isAI && (
              <div className="absolute -left-2 -top-2 w-8 h-8 bg-[var(--accent-primary)] rounded-full flex items-center justify-center shadow-md transform transition-transform duration-300 group-hover:scale-110 overflow-hidden">
                {message.avatar?.startsWith('http') ? (
                  <img src={message.avatar} alt="AI Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg">{message.avatar}</span>
                )}
              </div>
            )}
            {isUser && (
              <div className="absolute -right-2 -top-2 w-8 h-8 bg-[var(--bg-tertiary)] rounded-full flex items-center justify-center shadow-md transform transition-transform duration-300 group-hover:scale-110">
                <i className="fas fa-user text-[var(--text-tertiary)]"></i>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
