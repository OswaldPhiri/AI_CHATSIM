import React from 'react';
import { ChatMessage } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const bubbleClasses = isUser 
    ? 'bg-sky-600 text-white self-end rounded-l-lg rounded-tr-lg' 
    : 'bg-gray-600 text-gray-100 self-start rounded-r-lg rounded-tl-lg';
  
  const containerClasses = isUser ? 'flex justify-end' : 'flex justify-start';

  return (
    <div className={`${containerClasses} mb-1.5 sm:mb-2`}>
      <div className={`p-2 sm:p-3 max-w-[85%] sm:max-w-xl shadow ${bubbleClasses}`}>
        {message.isLoading && message.sender === 'ai' && !message.text ? (
          <div className="flex items-center">
            <LoadingSpinner size="sm" /> <span className="ml-2 text-xs sm:text-sm">Thinking...</span>
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-sm sm:text-base">{message.text || (message.isLoading ? "..." : "")}</p>
        )}
        {/* <span className="block text-xs mt-1 opacity-70">
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span> */}
      </div>
    </div>
  );
};

export default MessageBubble;
