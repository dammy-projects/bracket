import React from 'react';

interface TeamBadgeProps {
  logoUrl?: string | null;
  name?: string;
  tag?: string;
  color?: string;
  size?: number | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  style?: React.CSSProperties;
}

export const TeamBadge: React.FC<TeamBadgeProps> = ({
  logoUrl,
  name = '',
  tag = '',
  color = '#3b82f6',
  size = 'md',
  className = '',
  style = {},
}) => {
  let pixelSize = 32;
  let fontSize = '0.75rem';

  if (typeof size === 'number') {
    pixelSize = size;
    fontSize = `${Math.max(10, Math.floor(pixelSize * 0.36))}px`;
  } else {
    switch (size) {
      case 'sm':
        pixelSize = 24;
        fontSize = '0.65rem';
        break;
      case 'md':
        pixelSize = 32;
        fontSize = '0.75rem';
        break;
      case 'lg':
        pixelSize = 48;
        fontSize = '0.95rem';
        break;
      case 'xl':
        pixelSize = 64;
        fontSize = '1.25rem';
        break;
    }
  }

  // Derive display text: prefer short department tag or initials of name
  const getBadgeText = (): string => {
    if (tag && tag.trim().length <= 5) {
      return tag.trim();
    }
    if (!name) return 'TM';
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 3).toUpperCase();
  };

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name || 'Team Logo'}
        className={`team-badge-img ${className}`}
        style={{
          width: `${pixelSize}px`,
          height: `${pixelSize}px`,
          minWidth: `${pixelSize}px`,
          minHeight: `${pixelSize}px`,
          borderRadius: '8px',
          objectFit: 'cover',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          ...style,
        }}
      />
    );
  }

  const badgeText = getBadgeText();

  return (
    <div
      className={`team-badge-fallback ${className}`}
      style={{
        width: `${pixelSize}px`,
        height: `${pixelSize}px`,
        minWidth: `${pixelSize}px`,
        minHeight: `${pixelSize}px`,
        borderRadius: '8px',
        background: `linear-gradient(135deg, ${color} 0%, rgba(15, 23, 42, 0.85) 100%)`,
        border: `1px solid ${color}88`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        fontWeight: 800,
        fontSize,
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        boxShadow: `0 2px 8px ${color}33`,
        userSelect: 'none',
        ...style,
      }}
      title={name || tag}
    >
      {badgeText}
    </div>
  );
};
