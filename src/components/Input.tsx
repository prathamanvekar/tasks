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
}

const Input: React.FC<InputProps> = ({
  id,
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  disabled = false
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    playTickSound();
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  // Determine if the label should be floating
  const isFloating = isFocused || value.trim() !== '';

  const chars = label.split('');

  return (
    <div className={`form-control-wrapper ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className={`form-control ${isFloating ? 'floating' : ''}`}>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          required={required}
          disabled={disabled}
          className="font-mono text-sm tracking-wide"
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
  );
};

export default Input;
