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
  durationInSeconds = 6,
  layers,
  timelineLayers,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentSec = frame / fps;

  // Resolve layers from timelineLayers or fallback layers config
  const headlineLayer = timelineLayers?.find(l => l.id === 'headline' || l.type === 'headline');
  const subtextLayer = timelineLayers?.find(l => l.id === 'subtext' || l.type === 'subtext');
  const taglineLayer = timelineLayers?.find(l => l.id === 'tagline' || l.type === 'tagline');
  const authorLayer = timelineLayers?.find(l => l.id === 'author' || l.type === 'author');

  const taglineCfg = {
    startSec: taglineLayer?.startSec ?? layers?.tagline?.startSec ?? 0,
    durationSec: taglineLayer?.durationSec ?? layers?.tagline?.durationSec ?? durationInSeconds,
    x: taglineLayer?.x ?? layers?.tagline?.x ?? 0,
    y: taglineLayer?.y ?? layers?.tagline?.y ?? 0,
    scale: taglineLayer?.scale ?? layers?.tagline?.scale ?? 1,
    visible: (taglineLayer ? taglineLayer.visible : layers?.tagline?.visible) !== false,
  };

  const headlineCfg = {
    startSec: headlineLayer?.startSec ?? layers?.headline?.startSec ?? 0,
    durationSec: headlineLayer?.durationSec ?? layers?.headline?.durationSec ?? durationInSeconds,
    x: headlineLayer?.x ?? layers?.headline?.x ?? 0,
    y: headlineLayer?.y ?? layers?.headline?.y ?? 0,
    scale: headlineLayer?.scale ?? layers?.headline?.scale ?? 1,
    visible: (headlineLayer ? headlineLayer.visible : layers?.headline?.visible) !== false,
  };

  const subtextCfg = {
    startSec: subtextLayer?.startSec ?? layers?.subtext?.startSec ?? 0.3,
    durationSec: subtextLayer?.durationSec ?? layers?.subtext?.durationSec ?? Math.max(0.5, durationInSeconds - 0.3),
    x: subtextLayer?.x ?? layers?.subtext?.x ?? 0,
    y: subtextLayer?.y ?? layers?.subtext?.y ?? 0,
    scale: subtextLayer?.scale ?? layers?.subtext?.scale ?? 1,
    visible: (subtextLayer ? subtextLayer.visible : layers?.subtext?.visible) !== false,
  };

  const authorCfg = {
    startSec: authorLayer?.startSec ?? layers?.author?.startSec ?? 0,
    durationSec: authorLayer?.durationSec ?? layers?.author?.durationSec ?? durationInSeconds,
    x: authorLayer?.x ?? layers?.author?.x ?? 0,
    y: authorLayer?.y ?? layers?.author?.y ?? 0,
    scale: authorLayer?.scale ?? layers?.author?.scale ?? 1,
    visible: (authorLayer ? authorLayer.visible : layers?.author?.visible) !== false,
  };

  const isTaglineActive = taglineCfg.visible && currentSec >= taglineCfg.startSec && currentSec <= (taglineCfg.startSec + taglineCfg.durationSec);
  const isHeadlineActive = headlineCfg.visible && currentSec >= headlineCfg.startSec && currentSec <= (headlineCfg.startSec + headlineCfg.durationSec);
  const isSubtextActive = subtextCfg.visible && currentSec >= subtextCfg.startSec && currentSec <= (subtextCfg.startSec + subtextCfg.durationSec);
  const isAuthorActive = authorCfg.visible && currentSec >= authorCfg.startSec && currentSec <= (authorCfg.startSec + authorCfg.durationSec);

  // Background pulses & rotations
  const bgRotation = interpolate(frame, [0, 180], [0, 45], {
    extrapolateRight: 'clamp',
  });

  const orbScale = interpolate(
    Math.sin((frame / fps) * Math.PI * 2),
    [-1, 1],
    [0.85, 1.15]
  );

  // Entrance spring for headline (relative to headlineCfg.startSec)
  const headlineFrame = Math.max(0, frame - Math.floor(headlineCfg.startSec * fps));
  const headlineEntrance = spring({
    frame: headlineFrame,
    fps,
    config: {
      damping: 12,
      stiffness: 100,
      mass: 0.8,
    },
  });

  // Entrance spring for subtext with slight delay
  const subtextFrame = Math.max(0, frame - Math.floor(subtextCfg.startSec * fps));
  const subtextEntrance = spring({
    frame: subtextFrame,
    fps,
    config: {
      damping: 14,
      stiffness: 90,
    },
  });

  // Split headline into words for kinetic highlighting
  const words = headline.split(' ');

  // Dynamic progress line at the bottom
  const progressWidth = interpolate(frame, [0, durationInSeconds * fps], [0, 100], {
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
          opacity: isTaglineActive ? 1 : 0,
          transform: `translate(${taglineCfg.x}px, ${taglineCfg.y}px) scale(${taglineCfg.scale})`,
          transformOrigin: 'top center',
          transition: 'opacity 0.15s ease',
          pointerEvents: isTaglineActive ? 'auto' : 'none',
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
            STUDIO KREATOR
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
        {/* Kinetic Words (Headline Layer) */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '14px',
            maxWidth: '920px',
            transform: `translate(${headlineCfg.x}px, ${headlineCfg.y}px) scale(${headlineCfg.scale * interpolate(headlineEntrance, [0, 1], [0.85, 1])}) translateY(${interpolate(
              headlineEntrance,
              [0, 1],
              [40, 0]
            )}px)`,
            opacity: isHeadlineActive ? interpolate(headlineEntrance, [0, 1], [0, 1]) : 0,
            transformOrigin: 'center center',
            transition: 'opacity 0.15s ease',
            pointerEvents: isHeadlineActive ? 'auto' : 'none',
          }}
        >
          {words.map((word, idx) => {
            const isHighlight =
              word.toUpperCase().replace(/[^A-Z]/g, '') ===
              highlightWord.toUpperCase().replace(/[^A-Z]/g, '');

            // Individual word stagger
            const wordDelay = Math.min(idx * 3, 20);
            const wordPop = spring({
              frame: Math.max(0, headlineFrame - wordDelay),
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

        {/* Subtext Animated Entrance (Subtext Layer) */}
        <div
          style={{
            maxWidth: '820px',
            fontSize: '24px',
            fontWeight: 500,
            lineHeight: 1.45,
            color: 'rgba(255, 255, 255, 0.85)',
            transform: `translate(${subtextCfg.x}px, ${subtextCfg.y}px) scale(${subtextCfg.scale}) translateY(${interpolate(subtextEntrance, [0, 1], [30, 0])}px)`,
            opacity: isSubtextActive ? interpolate(subtextEntrance, [0, 1], [0, 1]) : 0,
            transformOrigin: 'center center',
            transition: 'opacity 0.15s ease',
            textShadow: '0 2px 10px rgba(0,0,0,0.6)',
            pointerEvents: isSubtextActive ? 'auto' : 'none',
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
            transform: `translate(${taglineCfg.x}px, ${taglineCfg.y}px) scale(${taglineCfg.scale * interpolate(subtextEntrance, [0, 1], [0.9, 1])})`,
            opacity: isTaglineActive ? interpolate(subtextEntrance, [0, 1], [0, 1]) : 0,
            transition: 'opacity 0.15s ease',
            pointerEvents: isTaglineActive ? 'auto' : 'none',
          }}
        >
          {tagline}
        </div>
      </div>

      {/* Footer Area with Handle and Scrubber bar (Author Layer) */}
      <div
        style={{
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '100%',
          opacity: isAuthorActive ? 1 : 0,
          transform: `translate(${authorCfg.x}px, ${authorCfg.y}px) scale(${authorCfg.scale})`,
          transformOrigin: 'bottom center',
          transition: 'opacity 0.15s ease',
          pointerEvents: isAuthorActive ? 'auto' : 'none',
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
            {Math.floor(frame / fps)}s / {durationInSeconds}s
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

      {/* Dynamic Custom Layers from Timeline / Asset Management */}
      {timelineLayers?.filter(l => !['headline', 'subtext', 'tagline', 'author'].includes(l.id)).map(l => {
        const isActive = l.visible !== false && currentSec >= l.startSec && currentSec <= (l.startSec + l.durationSec);
        if (!isActive) return null;

        return (
          <div
            key={l.id}
            style={{
              position: 'absolute',
              zIndex: 20,
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) translate(${l.x}px, ${l.y}px) scale(${l.scale})`,
              pointerEvents: 'none',
              transition: 'opacity 0.1s ease',
            }}
          >
            {l.type === 'image' && l.content && (
              <img
                src={l.content}
                alt={l.name}
                style={{
                  maxWidth: '460px',
                  maxHeight: '460px',
                  objectFit: 'contain',
                  borderRadius: '16px',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                }}
              />
            )}
            {l.type === 'text' && (
              <div
                style={{
                  color: l.color || '#ffffff',
                  fontSize: '34px',
                  fontWeight: 800,
                  textShadow: '0 4px 20px rgba(0,0,0,0.9)',
                  padding: '8px 18px',
                  whiteSpace: 'nowrap',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {l.content || l.name}
              </div>
            )}
            {l.type === 'audio' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: 'rgba(15, 12, 30, 0.6)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '9999px',
                  color: '#c084fc',
                  fontWeight: 600,
                  fontSize: '13px',
                }}
              >
                <span>🎵 {l.name}</span>
              </div>
            )}
            {l.type === 'video' && l.content && (
              <video
                src={l.content}
                autoPlay
                muted
                loop
                style={{
                  maxWidth: '480px',
                  maxHeight: '480px',
                  borderRadius: '16px',
                  objectFit: 'cover',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                }}
              />
            )}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
