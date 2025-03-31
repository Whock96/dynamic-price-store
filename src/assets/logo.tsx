
import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const Logo: React.FC<LogoProps> = ({ className, size = 'md', color = '#006341' }) => {
  const sizes = {
    sm: { width: 100, height: 50 },
    md: { width: 180, height: 70 },
    lg: { width: 250, height: 100 },
  };

  const { width, height } = sizes[size];

  return (
    <img 
      src="/lovable-uploads/68daf61d-816f-4f86-8b3f-4f0970296cf0.png" 
      width={width}
      height={height}
      alt="Ferplas Logo" 
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
};

export default Logo;
