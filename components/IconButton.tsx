import React from 'react';

interface IconButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onClick,
  className = '',
  disabled = false,
  ariaLabel,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center transition-all duration-200 ${
        disabled
          ? 'opacity-50 cursor-not-allowed bg-[var(--button-disabled)]'
          : 'hover:bg-[var(--bg-hover)] active:scale-95 bg-[var(--bg-tertiary)]'
      } ${className}`}
    >
      {icon}
    </button>
  );
};

export default IconButton;
