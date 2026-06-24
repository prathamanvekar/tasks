import React, { useRef, useEffect } from 'react';
import { playScratchSound } from '../utils/sounds';

interface CheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({ id, checked, onChange, label, disabled = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<any[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const nextChecked = e.target.checked;
    playScratchSound();
    onChange(nextChecked);
  };

  // Trigger local ASCII particle explosion when checked transitions from false to true
  useEffect(() => {
    if (checked) {
      triggerExplosion();
    } else {
      // Instantly clear particles when unchecked
      particlesRef.current = [];
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      clearCanvas();
    }
  }, [checked]);

  // Clean up animation frames on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const triggerExplosion = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI setup
    canvas.width = 100;
    canvas.height = 100;

    const chars = ['+', '*', 'x', '•', 'o'];
    const count = 12;
    const particles = [];
    const cx = 50;
    const cy = 50;

    // Fetch active theme accent color dynamically
    let activeColor = '#a78bfa';
    try {
      const resolved = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      if (resolved) {
        activeColor = resolved;
      }
    } catch {}

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 2.2;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.2, // slight upward float
        char: chars[Math.floor(Math.random() * chars.length)],
        size: 9 + Math.floor(Math.random() * 6), // 9px to 14px
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.02,
        rotation: Math.random() * Math.PI * 2,
        vRotation: (Math.random() * 2 - 1) * 0.08
      });
    }

    particlesRef.current = particles;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let active = false;

      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        p.rotation += p.vRotation;

        if (p.alpha > 0) {
          active = true;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = activeColor;
          ctx.globalAlpha = p.alpha;
          ctx.font = `${p.size}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.char, 0, 0);
          ctx.restore();
        }
      });

      if (active) {
        animationFrameRef.current = requestAnimationFrame(tick);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className={`checkbox-wrapper flex items-center ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <input 
        type="checkbox" 
        className="check" 
        id={id} 
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
      />
      <label htmlFor={id} className="label flex items-center select-none text-[var(--text)] font-sans text-base cursor-pointer">
        <div className="relative flex-shrink-0 mr-3 w-[36px] h-[36px] flex items-center justify-center">
          {/* Local canvas positioned behind the checkbox SVG */}
          <canvas 
            ref={canvasRef}
            style={{ width: '100px', height: '100px' }}
            className="absolute pointer-events-none select-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0"
          />
          <svg width={36} height={36} viewBox="0 0 95 95" className="relative z-10 transition-transform duration-200 active:scale-95">
            <rect x={30} y={20} width={50} height={50} stroke="var(--text-h)" strokeWidth={2.5} fill="none" />
            <g transform="translate(0,-952.36222)">
              <path 
                d="m 56,963 c -102,122 6,9 7,9 17,-5 -66,69 -38,52 122,-77 -7,14 18,4 29,-11 45,-43 23,-4" 
                stroke="var(--accent)" 
                strokeWidth={4.5} 
                fill="none" 
                className="path1" 
              />
            </g>
          </svg>
        </div>
        <span className={`transition-all duration-300 font-sans tracking-wide lowercase ${checked ? 'line-through text-[var(--text-muted)] opacity-60' : 'text-[var(--text-h)] font-medium'}`}>
          {label}
        </span>
      </label>
    </div>
  );
};

export default Checkbox;
