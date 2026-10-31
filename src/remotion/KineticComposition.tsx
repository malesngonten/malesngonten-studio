import React from 'react';
import { 
  AbsoluteFill, 
  interpolate, 
  spring, 
  useCurrentFrame, 
  useVideoConfig 
} from 'remotion';
import { CompositionProps } from '../contracts/types.ts';

export const KineticComposition: React.FC<CompositionProps> = ({
  headline = 'STOP BIKIN KONTEN MANUAL!',
  highlightWord = 'MANUAL',
  subtext = 'Bikin video reels & tiktok 10x lebih cepat pakai Remotion + AI',
  tagline = '#MalesNgonten #CreatorEconomy',
  primaryColor = '#ffffff',
  accentColor = '#a1a1aa',
  bgColor = '#0c0d10',
  fontStyle = 'display',
  authorHandle = '@official.malesngonten',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background pulses & rotations
  const bgRotation = interpolate(frame, [0, 180], [0, 45], {
    extrapolateRight: 'clamp',
  });

  const orbScale = interpolate(
    Math.sin((frame / fps) * Math.PI * 2),
    [-1, 1],
    [0.85, 1.15]
  );

  // Entrance spring for headline
  const headlineEntrance = spring({
    frame,
    fps,
    config: {
      damping: 12,
      stiffness: 100,
      mass: 0.8,
    },
  });

  // Entrance spring for subtext with slight delay
  const subtextEntrance = spring({
    frame: frame - 15,
    fps,
    config: {
      damping: 14,
      stiffness: 90,
    },
  });

  // Split headline into words for kinetic highlighting
  const words = headline.split(' ');

  // Dynamic progress line at the bottom
  const progressWidth = interpolate(frame, [0, 180], [0, 100], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bgColor,
        fontFamily: fontStyle === 'mono' ? '"JetBrains Mono", monospace' : '"Plus Jakarta Sans", sans-serif',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '60px 48px',
        overflow: 'hidden',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* Dynamic Background Elements */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          right: '-20%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${primaryColor}44 0%, transparent 70%)`,
          filter: 'blur(60px)',
          transform: `scale(${orbScale}) rotate(${bgRotation}deg)`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '-25%',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}33 0%, transparent 70%)`,
          filter: 'blur(70px)',
          transform: `scale(${orbScale})`,
          pointerEvents: 'none',
        }}
      />

      {/* Decorative Grid Lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top Header & Tagline */}
      <div
        style={{
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%)',
            backdropFilter: 'blur(10px)',
            padding: '8px 18px',
            borderRadius: '9999px',
          }}
        >
          <img
            src="/assets/aistudio/PhotoRoom-20261031_185018_f6d34a51.png"
            alt="Males Ngonten"
            style={{
              width: '32px',
              height: '32px',
              objectFit: 'contain',
            }}
          />
          <span
            style={{
              fontSize: '15px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: '#ffffff',
            }}
          >
            MALES NGONTEN
          </span>
        </div>

        {/* Live Audio / Motion Equalizer Bars */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '4px',
            height: '24px',
            padding: '0 8px',
          }}
        >
          {[0.8, 1.4, 0.6, 1.2, 0.9, 1.5, 0.7].map((factor, i) => {
            const h = interpolate(
              Math.sin((frame / 4 + i) * factor),
              [-1, 1],
              [6, 24]
            );
            return (
              <div
                key={i}
                style={{
                  width: '4px',
                  height: `${h}px`,
                  backgroundColor: i % 2 === 0 ? primaryColor : accentColor,
                  borderRadius: '2px',
                  transition: 'height 0.05s ease',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Center Kinetic Typography Area */}
      <div
        style={{
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: '28px',
          width: '100%',
        }}
      >
        {/* Kinetic Words */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '14px',
            maxWidth: '920px',
            transform: `scale(${interpolate(headlineEntrance, [0, 1], [0.85, 1])}) translateY(${interpolate(
              headlineEntrance,
              [0, 1],
              [40, 0]
            )}px)`,
            opacity: interpolate(headlineEntrance, [0, 1], [0, 1]),
          }}
        >
          {words.map((word, idx) => {
            const isHighlight =
              word.toUpperCase().replace(/[^A-Z]/g, '') ===
              highlightWord.toUpperCase().replace(/[^A-Z]/g, '');

            // Individual word stagger
            const wordDelay = Math.min(idx * 3, 20);
            const wordPop = spring({
              frame: frame - wordDelay,
              fps,
              config: { damping: 10, stiffness: 120 },
            });

            return (
              <span
                key={idx}
                style={{
                  fontSize: '54px',
                  fontWeight: 900,
                  lineHeight: 1.15,
                  letterSpacing: '-0.02em',
                  transform: `scale(${interpolate(wordPop, [0, 1], [0.7, 1])})`,
                  display: 'inline-block',
                  ...(isHighlight
                    ? {
                        backgroundColor: '#ffffff',
                        color: '#090a0d',
                        padding: '4px 20px',
                        borderRadius: '12px',
                        boxShadow: '0 8px 30px rgba(255,255,255,0.4)',
                        transform: `scale(${interpolate(wordPop, [0, 1], [0.7, 1.05])}) rotate(-1.5deg)`,
                      }
                    : {
                        color: '#ffffff',
                        textShadow: '0 4px 20px rgba(0,0,0,0.8)',
                      }),
                }}
              >
                {word}
              </span>
            );
          })}
        </div>

        {/* Subtext Animated Entrance */}
        <div
          style={{
            maxWidth: '820px',
            fontSize: '24px',
            fontWeight: 500,
            lineHeight: 1.45,
            color: 'rgba(255, 255, 255, 0.85)',
            transform: `translateY(${interpolate(subtextEntrance, [0, 1], [30, 0])}px)`,
            opacity: interpolate(subtextEntrance, [0, 1], [0, 1]),
            textShadow: '0 2px 10px rgba(0,0,0,0.6)',
          }}
        >
          {subtext}
        </div>

        {/* Category Pill / Tag */}
        <div
          style={{
            marginTop: '8px',
            padding: '8px 22px',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 100%)',
            borderRadius: '9999px',
            color: '#ffffff',
            fontSize: '15px',
            fontWeight: 600,
            letterSpacing: '0.04em',
            transform: `scale(${interpolate(subtextEntrance, [0, 1], [0.9, 1])})`,
            opacity: interpolate(subtextEntrance, [0, 1], [0, 1]),
          }}
        >
          {tagline}
        </div>
      </div>

      {/* Footer Area with Handle and Scrubber bar */}
      <div
        style={{
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '18px',
            color: 'rgba(255, 255, 255, 0.6)',
          }}
        >
          <span style={{ fontWeight: 600, color: '#ffffff' }}>{authorHandle}</span>
          <span style={{ fontSize: '15px', letterSpacing: '0.05em' }}>
            {Math.floor(frame / fps)}s / 6s
          </span>
        </div>

        {/* Video Scrubber Line */}
        <div
          style={{
            width: '100%',
            height: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            borderRadius: '9999px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressWidth}%`,
              height: '100%',
              backgroundColor: primaryColor,
              borderRadius: '9999px',
              boxShadow: `0 0 12px ${primaryColor}`,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
