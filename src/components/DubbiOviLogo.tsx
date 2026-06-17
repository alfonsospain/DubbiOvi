import React from 'react';

interface DubbiOviLogoProps {
  className?: string;
}

export const DubbiOviLogo: React.FC<DubbiOviLogoProps> = ({
  className = ''
}) => {
  const badgeStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    boxShadow: '0 0 20px rgba(139, 92, 246, 0.45)',
  };

  const textGradientStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #c084fc 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        style={badgeStyle}
        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-lg tracking-tighter"
      >
        DO
      </div>

      <span
        style={textGradientStyle}
        className="font-bold text-2xl tracking-tight"
      >
        DubbiOvi
      </span>
    </div>
  );
};
