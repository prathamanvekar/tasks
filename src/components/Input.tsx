import React, { useState } from 'react';
import { playTickSound } from '../utils/sounds';

interface InputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  onMouseEnter?: () => void;
  onToggleNotDone?: () => void;
}

const Input: React.FC<InputProps> = ({
  id,
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  disabled = false,
  onMouseEnter,
  onToggleNotDone
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    playTickSound();
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const isNotDone = value === '__NOT_DONE__';

  // Determine if the label should be floating
  const isFloating = isFocused || value.trim() !== '';

  const chars = label.split('');

  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-grow">
        <div 
          className={`form-control-wrapper ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
          onMouseEnter={onMouseEnter}
        >
          <div className={`form-control ${isFloating ? 'floating' : ''}`}>
            <input
              id={id}
              type={type}
              value={isNotDone ? 'not done' : value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              required={required && !isNotDone}
              disabled={disabled || isNotDone}
              className={`font-mono text-sm tracking-wide ${isNotDone ? 'line-through text-[var(--text-muted)] opacity-60' : ''}`}
            />
            <label htmlFor={id} className="select-none font-sans text-sm tracking-wider">
              {chars.map((char, index) => (
                <span
                  key={index}
                  style={{ transitionDelay: `${index * 40}ms` }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </label>
          </div>
        </div>
      </div>
      {onToggleNotDone && !disabled && (
        <button
          type="button"
          onClick={onToggleNotDone}
          className="text-3xs font-mono border border-[var(--border)] px-2.5 py-1.5 rounded bg-[var(--code-bg)] hover:bg-[var(--text-h)] hover:text-[var(--bg)] transition-all cursor-pointer lowercase focus:outline-none select-none flex-shrink-0"
        >
          {isNotDone ? '[ undo ]' : '[ not done ]'}
        </button>
      )}
    </div>
  );
};

export default Input;
