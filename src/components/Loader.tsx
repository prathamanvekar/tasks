import React, { useEffect, useState } from 'react';

interface LoaderProps {
  onComplete: () => void;
}

const Loader: React.FC<LoaderProps> = ({ onComplete }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Show sliding words for 2.2 seconds, then trigger fade out
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2200);

    // Call onComplete after fade out animation (0.5s transition) finishes
    const finishTimer = setTimeout(() => {
      onComplete();
    }, 2700);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onComplete]);

  return (
    <div className={`text-loader-container ${fadeOut ? 'fade-out' : ''}`}>
      <div className="flex items-center justify-center select-none">
        <div className="text-loader">
          <p className="font-bold tracking-tight">tracking</p>
          <div className="text-loader-words">
            <span className="text-loader-word">habits</span>
            <span className="text-loader-word">lessons</span>
            <span className="text-loader-word">problems</span>
            <span className="text-loader-word">projects</span>
            <span className="text-loader-word">habits</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loader;
