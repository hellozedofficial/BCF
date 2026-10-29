'use client';

import React, { useState } from 'react';
import './CircularText.css';

export default function CircularText({
  text = 'BANGLADESH CARROM FEDERATION ✦ SINCE 1990 ✦ ',
  spinDuration = 20,
  onHover = 'speedUp',
  className = '',
  centerContent = null
}) {
  const [isHovered, setIsHovered] = useState(false);
  const letters = Array.from(text);

  const getDuration = () => {
    if (!isHovered) return `${spinDuration}s`;
    switch (onHover) {
      case 'speedUp':
        return `${spinDuration / 4}s`;
      case 'slowDown':
        return `${spinDuration * 2}s`;
      case 'pause':
        return '0s';
      default:
        return `${spinDuration}s`;
    }
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`circular-text ${className}`}
        style={{
          '--spin-duration': getDuration(),
          animationPlayState: isHovered && onHover === 'pause' ? 'paused' : 'running'
        }}
        aria-label={text}
      >
        {letters.map((letter, i) => {
          const rotationDeg = (360 / letters.length) * i;
          return (
            <span
              key={i}
              style={{
                transform: `rotate(${rotationDeg}deg) translateY(-54px)`,
                WebkitTransform: `rotate(${rotationDeg}deg) translateY(-54px)`
              }}
            >
              {letter}
            </span>
          );
        })}
      </div>

      {/* Center Emblem/Icon if provided */}
      {centerContent && (
        <div className="circular-text-center">
          {centerContent}
        </div>
      )}
    </div>
  );
}
