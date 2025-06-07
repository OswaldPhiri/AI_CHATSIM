import React from 'react';
import IconButton from './IconButton';

interface ThemeToggleProps {
  currentTheme: 'light' | 'dark';
  onToggle: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ currentTheme, onToggle }) => {
  return (
    <IconButton
      icon={
        <i className={`fas ${currentTheme === 'dark' ? 'fa-sun text-yellow-400' : 'fa-moon text-blue-400'} transition-colors duration-200`}></i>
      }
      onClick={onToggle}
      ariaLabel={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} theme`}
      className="hover:bg-gray-600 dark:hover:bg-gray-700 p-2 rounded-full transition-all duration-200 hover-lift"
    />
  );
};

export default ThemeToggle; 