import React, { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

export interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  textAlign?: React.CSSProperties['textAlign'];
}

const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  delay = 30, // Delay in ms between letters
  duration = 0.8,
  ease = 'power3.out',
  tag = 'h1',
  textAlign = 'left'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lettersRef = useRef<HTMLSpanElement[]>([]);

  useGSAP(() => {
    if (!containerRef.current || !text) return;
    
    // Clear any previous references
    lettersRef.current = lettersRef.current.slice(0, text.length);

    gsap.fromTo(
      lettersRef.current,
      { 
        opacity: 0, 
        y: 20 
      },
      {
        opacity: 1,
        y: 0,
        duration: duration,
        ease: ease,
        stagger: delay / 1000,
        force3D: true
      }
    );
  }, { scope: containerRef, dependencies: [text, delay, duration, ease] });

  const Tag = tag as React.ElementType;
  const chars = text.split('');

  return (
    <Tag 
      ref={containerRef} 
      style={{ textAlign, display: 'inline-block' }} 
      className={`split-parent ${className}`}
    >
      {chars.map((char, index) => (
        <span
          key={index}
          ref={(el) => {
            if (el) lettersRef.current[index] = el;
          }}
          style={{ display: 'inline-block', willChange: 'transform, opacity' }}
          className="no-lowercase"
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </Tag>
  );
};

export default SplitText;
