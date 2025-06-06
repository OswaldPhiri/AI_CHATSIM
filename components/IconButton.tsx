
import React from 'react';

interface IconButtonProps {
  icon: React.ReactNode;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  disabled?: boolean;
  ariaLabel: string;
}

const IconButton: React.FC<IconButtonProps> = ({ icon, onClick, className = '', disabled = false, ariaLabel }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50 ${
        disabled ? 'text-gray-500 cursor-not-allowed' : 'text-sky-400 hover:bg-gray-700'
      } ${className}`}
    >
      {icon}
    </button>
  );
};

export default IconButton;
