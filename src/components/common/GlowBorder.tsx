import React from 'react';

interface GlowBorderProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  borderRadius?: string;
  innerRadius?: string;
  speed?: string;
}

/**
 * 1px Rotating Border Glow
 * - Strictly 1px border width (no thick borders).
 * - Background is 100% solid, static (#14151a), NEVER animates or glows.
 * - Only the razor-thin 1px border perimeter rotates!
 */
export const GlowBorder: React.FC<GlowBorderProps> = ({
  children,
  className = '',
  innerClassName = '',
  borderRadius = 'rounded-[26px]',
  innerRadius = 'rounded-[25px]',
  speed = '4s',
}) => {
  return (
    <div className={`relative ${borderRadius} p-[1px] overflow-hidden ${className}`}>
      {/* 1px Rotating Conic Beam - strictly along the 1px perimeter */}
      <div 
        className="absolute inset-[-150%] pointer-events-none animate-spin"
        style={{
          background: 'conic-gradient(from 0deg, transparent 0deg, transparent 45deg, #ff453a 90deg, #ff9f0a 135deg, #ffd60a 180deg, #30d158 225deg, #00e5ff 270deg, #0a84ff 315deg, #bf5af2 345deg, #ff453a 360deg)',
          animationDuration: speed,
        }}
      />

      {/* 100% SOLID STATIC INNER CONTAINER - completely covers the background */}
      <div className={`relative ${innerRadius} bg-[#14151a] z-10 w-full ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
};

export const GlowPill: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  title?: string;
}> = ({ children, onClick, className = '', title }) => {
  return (
    <div className={`relative rounded-full p-[1px] overflow-hidden inline-flex ${className}`}>
      {/* 1px Rotating Beam */}
      <div 
        className="absolute inset-[-150%] pointer-events-none animate-spin"
        style={{
          background: 'conic-gradient(from 0deg, #ff453a, #ff9f0a, #ffd60a, #30d158, #00e5ff, #0a84ff, #bf5af2, #ff375f, #ff453a)',
          animationDuration: '3.5s',
        }}
      />
      {/* Solid Static Button */}
      <button
        type="button"
        onClick={onClick}
        title={title}
        className="relative rounded-full bg-[#16171d] px-4 py-2 z-10 text-white font-medium text-xs sm:text-sm flex items-center gap-2 cursor-pointer active:scale-95 transition-transform"
      >
        {children}
      </button>
    </div>
  );
};
