# Replicating the Vibe, Theme, and Philosophy of this Website

This guide compiles the entire design DNA, core styles, visual tokens, interactive mechanics, and philosophy of this portfolio. Use this markdown template to rebuild or port this exact look and feel to any React, Tailwind CSS, or vanilla web project.

---

## 1. Core Philosophy

* **Unapologetically Lowercase**: Every title, heading, role, button, and navigation item is strictly lowercase (`text-transform: lowercase !important`). No exceptions. It gives the layout a relaxed, unified, and contemporary aesthetic.
* **Brutalist-Minimal Hybrid**: Large geometric headings, hairline borders (`1px` or `1.5px`), and solid, offsets/drop-shadows (`box-shadow: 4px 4px 0 var(--text-h)`) that suggest modern software terminals or retro developer docs.
* **Interactive Playfulness**: The design feels alive through custom mouse-hover previews, tactile click animations (sparks), multiple retro theme mappings, and terminal command modes. It is a "living document" that encourages discovery.
* **Typographic Hierarchy**: Distinct geometric sans-serif fonts for titles paired with retro-style monospace for data fields, code blocks, and system states.

---

## 2. Color System & Themes

The site uses CSS custom properties (variables) transitioning smoothly. Add these definitions to your global stylesheet (`index.css` / `globals.css`):

```css
/* Smooth transition mapping */
html, body, p, h1, h2, h3, section, span, div, button, a, input {
  transition: 
    background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    color 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* --- THEMES MAP --- */

:root {
  /* Classic Light Theme */
  --bg: #ffffff;
  --text: #2f2f2f;
  --text-h: #0a0a0a;
  --text-muted: #6f6f6f;
  --border: #e8e8e8;
  --code-bg: #f9f9f9;
  --dropdown-bg: #ffffff;
  --accent: #aa2e25;        /* Deep crimson red */
  --accent-hover: #000000;  /* Bold black focus */
  --go-blue: #007d9c;       /* Go Brand Cyan */
  --switch-thumb: #ffffff;
  --switch-track: #e8e8e8;
  --switch-active-track: #888888;
  --switch-outline: var(--text-h);
  
  --sans: "Century Gothic", CenturyGothic, Geneva, AppleGothic, sans-serif;
  --heading: "Century Gothic", CenturyGothic, Geneva, AppleGothic, sans-serif;
  --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.dark-theme {
  /* Classic Dark Theme */
  --bg: #1f1f1f;
  --text: #d1d1d1;
  --text-h: #ffffff;
  --text-muted: #888888;
  --border: #2e2e2e;
  --code-bg: #282828;
  --dropdown-bg: #2a2a2a;
  --accent: #ff5555;
  --accent-hover: #ffffff;
  --go-blue: #4fc3f7;
  --switch-thumb: #1f1f1f;
  --switch-track: #333333;
  --switch-active-track: #555555;
  --switch-outline: var(--text-h);
}

/* Gruvbox (Warm Sand / Earthy Retro) */
.theme-gruvbox {
  --bg: #fbf1c7;
  --text: #3c3836;
  --text-h: #282828;
  --text-muted: #7c6f64;
  --border: #d5c4a1;
  --code-bg: #ebdbb2;
  --dropdown-bg: #f2e5bc;
  --accent: #9d0006;
  --accent-hover: #b57614;
  --go-blue: #076678;
  --switch-track: #ebdbb2;
  --switch-thumb: #fbf1c7;
}
.dark-theme.theme-gruvbox {
  --bg: #282828;
  --text: #ebdbb2;
  --text-h: #fbf1c7;
  --text-muted: #a89984;
  --border: #3c3836;
  --code-bg: #32302f;
  --dropdown-bg: #1d2021;
  --accent: #cc241d;
  --accent-hover: #fabd2f;
  --go-blue: #83a598;
  --switch-track: #3c3836;
  --switch-thumb: #ebdbb2;
}

/* Tokyo Night (Synthwave Cyberpunk) */
.theme-tokyonight {
  --bg: #f0f2f9;
  --text: #343b58;
  --text-h: #0f1419;
  --text-muted: #565f89;
  --border: #d0d5e8;
  --code-bg: #e1e6f7;
  --dropdown-bg: #ffffff;
  --accent: #f7768e;
  --accent-hover: #7aa2f7;
  --go-blue: #2ac3de;
  --switch-track: #d0d5e8;
  --switch-thumb: #f0f2f9;
}
.dark-theme.theme-tokyonight {
  --bg: #1a1b26;
  --text: #a9b1d6;
  --text-h: #c0caf5;
  --text-muted: #565f89;
  --border: #24283b;
  --code-bg: #20212a;
  --dropdown-bg: #16161e;
  --accent: #f7768e;
  --accent-hover: #7aa2f7;
  --go-blue: #7dcfff;
  --switch-track: #24283b;
  --switch-thumb: #1a1b26;
}

/* Nord (Frosty Arctic Gray) */
.theme-nord {
  --bg: #eceff4;
  --text: #2e3440;
  --text-h: #3b4252;
  --text-muted: #4c566a;
  --border: #d8dee9;
  --code-bg: #e5e9f0;
  --dropdown-bg: #ffffff;
  --accent: #bf616a;
  --accent-hover: #88c0d0;
  --go-blue: #5e81ac;
  --switch-track: #d8dee9;
  --switch-thumb: #eceff4;
}
.dark-theme.theme-nord {
  --bg: #2e3440;
  --text: #d8dee9;
  --text-h: #eceff4;
  --text-muted: #4c566a;
  --border: #3b4252;
  --code-bg: #242933;
  --dropdown-bg: #20242c;
  --accent: #bf616a;
  --accent-hover: #88c0d0;
  --go-blue: #81a1c1;
  --switch-track: #3b4252;
  --switch-thumb: #2e3440;
}

/* Dracula (Gothic Vampire Pastel) */
.theme-dracula {
  --bg: #f8f8f2;
  --text: #282a36;
  --text-h: #44475a;
  --text-muted: #6272a4;
  --border: #e2e2d9;
  --code-bg: #f1f1ea;
  --dropdown-bg: #ffffff;
  --accent: #ff79c6;
  --accent-hover: #8be9fd;
  --go-blue: #bd93f9;
  --switch-track: #e2e2d9;
  --switch-thumb: #f8f8f2;
}
.dark-theme.theme-dracula {
  --bg: #282a36;
  --text: #f8f8f2;
  --text-h: #ffffff;
  --text-muted: #6272a4;
  --border: #44475a;
  --code-bg: #1d1f27;
  --dropdown-bg: #21222c;
  --accent: #ff79c6;
  --accent-hover: #8be9fd;
  --go-blue: #bd93f9;
  --switch-track: #44475a;
  --switch-thumb: #282a36;
}
```

---

## 3. Typography & Page Layout Settings

The typography relies on large, geometric shapes with clean text scaling. Add these rules to your stylesheet:

```css
body {
  margin: 0;
  padding: 0;
  background-color: var(--bg);
  color: var(--text);
  font-family: var(--sans);
  font-size: 1.25rem;
  line-height: 1.65;
  letter-spacing: -0.01em;
}

/* Set everything to lowercase */
h1, h2, h3, .project-title, .skills-label, .achievement-title, .work-role, .work-company, button {
  text-transform: lowercase !important;
}

/* Layout container centering */
#root {
  width: 100%;
  max-width: 812px;
  margin: 0 auto;
  padding: 100px 30px;
  box-sizing: border-box;
}

/* Headings scale */
h1 {
  font-size: 48px;
  line-height: 1.2;
  font-weight: 800;
  color: var(--text-h);
  letter-spacing: -0.025em;
}

h2 {
  font-size: 18px;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  margin-top: 60px;
  margin-bottom: 24px;
  font-weight: 700;
}
```

---

## 4. Key Visual Interactions (CSS Transitions)

### 4.1 Underline Navigation/Links (Draw Left-to-Right)
Links don't use the standard `text-decoration`. Instead, they use a dynamic progress line that draws outwards from the left on hover:

```css
a {
  color: var(--accent);
  text-decoration: none;
  position: relative;
  display: inline-block;
  transition: color 0.25s ease;
}

a::after {
  content: '';
  position: absolute;
  width: 100%;
  transform: scaleX(0);
  height: 1.5px;
  bottom: -1px;
  left: 0;
  background-color: var(--accent-hover);
  transform-origin: bottom right;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

a:hover {
  color: var(--accent-hover);
}

a:hover::after {
  transform-origin: bottom left;
  transform: scaleX(1);
}
```

### 4.2 Interactive Skill Tags (3D Shift shadow)
Hovering over tags pushes them up and reveals a sharp, retro shadow box behind them:

```css
.skill-tag {
  background-color: var(--code-bg);
  border: 1px solid var(--border);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 14px;
  color: var(--text);
  font-family: var(--sans);
  display: inline-block;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.skill-tag:hover {
  background-color: var(--text-h);
  color: var(--bg);
  border-color: var(--text-h);
  transform: translate(-1.5px, -1.5px);
  box-shadow: 2px 2px 0 var(--text-h);
}
```

### 4.3 Dot-Underlined Highlights (`.highlight-term`)
Dotted underlines show descriptions, changing to a solid block color on cursor hover:

```css
.highlight-term {
  position: relative;
  display: inline;
  border-bottom: 1.5px dotted var(--text-muted);
  cursor: default;
}

.highlight-term::after {
  content: '';
  position: absolute;
  width: 100%;
  transform: scaleX(0);
  height: 1.5px;
  bottom: -1px;
  left: 0;
  background-color: var(--accent);
  transform-origin: bottom right;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.highlight-term:hover::after {
  transform-origin: bottom left;
  transform: scaleX(1);
}
```

---

## 5. Premium Interactive Components

### 5.1 Click Sparks Canvas Particle Effect
Add this React canvas component wrapper to your root layout to emit radial particles centered exactly where the cursor clicks:

```tsx
import React, { useRef, useEffect, useCallback } from 'react';

interface Spark {
  x: number;
  y: number;
  angle: number;
  startTime: number;
}

export const ClickSpark: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);
  const startTimeRef = useRef<number | null>(null);

  const sparkColor = 'var(--accent)';
  const sparkSize = 8;
  const sparkRadius = 16;
  const sparkCount = 8;
  const duration = 400;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const resizeCanvas = () => {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  const draw = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    sparksRef.current = sparksRef.current.filter((spark) => {
      const elapsed = timestamp - spark.startTime;
      if (elapsed >= duration) return false;

      const progress = elapsed / duration;
      const eased = progress * (2 - progress); // Ease-out effect

      const distance = eased * sparkRadius;
      const lineLength = sparkSize * (1 - eased);

      const x1 = spark.x + distance * Math.cos(spark.angle);
      const y1 = spark.y + distance * Math.sin(spark.angle);
      const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
      const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

      ctx.strokeStyle = sparkColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      return true;
    });

    requestAnimationFrame(draw);
  }, [sparkColor]);

  useEffect(() => {
    let animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [draw]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const now = performance.now();
    const newSparks = Array.from({ length: sparkCount }, (_, i) => ({
      x,
      y,
      angle: (2 * Math.PI * i) / sparkCount,
      startTime: now,
    }));

    sparksRef.current.push(...newSparks);
  };

  return (
    <div onClick={handleClick} style={{ position: 'relative', width: '100%', minHeight: '100vh' }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 9999,
        }}
      />
      {children}
    </div>
  );
};
```

---

### 5.2 Hover Preview Card (Portaled Custom Tooltip)
When hovering over links or projects, a card appears containing ASCII architecture text flow diagrams, statistics, or previews that float smoothly near the mouse cursor:

```css
/* Card container styling */
.diagram-preview-card {
  width: 380px;
  max-width: 95vw;
  padding: 14px;
  font-family: var(--mono);
  font-size: 12px;
  line-height: 1.45;
  background-color: var(--dropdown-bg);
  border: 1.5px solid var(--text-h);
  box-shadow: 4px 4px 0 var(--text-h);
  color: var(--text);
  border-radius: 6px;
  position: absolute;
  pointer-events: none;
  z-index: 10000;
}

.diagram-header {
  font-weight: 700;
  font-size: 11px;
  color: var(--text-h);
  border-bottom: 1px dotted var(--border);
  padding-bottom: 6px;
  margin-bottom: 8px;
  text-transform: lowercase;
}

.diagram-body {
  white-space: pre;
  color: var(--text-muted);
}

.diagram-node {
  color: var(--text-h);
  font-weight: 700;
}
```

---

### 5.3 Retro Spring Slider (Theme Toggle)
A switch controller that raises and bounces dynamically on hover states:

```css
.switch {
  --switch_width: 2.2em;
  --switch_height: 1.1em;
  --thumb_color: var(--switch-thumb);
  --track_color: var(--switch-track);
  --track_active_color: var(--switch-active-track);
  --outline_color: var(--switch-outline);
  font-size: 17px;
  position: fixed;
  top: 32px;
  right: 32px;
  display: inline-block;
  width: var(--switch_width);
  height: var(--switch_height);
  z-index: 10001;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  box-sizing: border-box;
  border: 2px solid var(--outline_color);
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--track_color);
  transition: 0.15s;
  border-radius: var(--switch_height);
}

.slider:before {
  box-sizing: border-box;
  position: absolute;
  content: "";
  height: var(--switch_height);
  width: var(--switch_height);
  border: 2px solid var(--outline_color);
  border-radius: 100%;
  left: -2px;
  bottom: -2px;
  background-color: var(--thumb_color);
  transform: translateY(-0.2em);
  box-shadow: 0 0.2em 0 var(--outline_color);
  transition: 0.15s;
}

input:checked + .slider {
  background-color: var(--track_active_color);
}

input:hover + .slider:before {
  transform: translateY(-0.3em);
  box-shadow: 0 0.3em 0 var(--outline_color);
}

input:checked + .slider:before {
  transform: translateX(calc(var(--switch_width) - var(--switch_height))) translateY(-0.2em);
}

input:hover:checked + .slider:before {
  transform: translateX(calc(var(--switch_width) - var(--switch_height))) translateY(-0.3em);
  box-shadow: 0 0.3em 0 var(--outline_color);
}
```

---

### 5.4 Command Palette Modal
Activates globally on `Ctrl + K` or `Cmd + K`.
* **Design**: Standardized overlay backdrop filter (`backdrop-filter: blur(4px)`).
* **Modal Body**:
  * Outer border uses neo-brutalist shadow offset: `box-shadow: 8px 8px 0 var(--text-h);`.
  * Keyboard support (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`).
  * Swaps themes dynamically by attaching class tokens (`.theme-gruvbox`, `.theme-tokyonight`) directly to `document.documentElement`.
  * CLI Terminal console sub-window embedded directly inside the palette dropdown options.
