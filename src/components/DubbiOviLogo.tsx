import React from 'react';

interface DubbiOviLogoProps {
  className?: string;
}

export const DubbiOviLogo: React.FC<DubbiOviLogoProps> = ({
  className = ''
}) => {
  const badgeStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #009E52 0%, #00C853 100%)',
    boxShadow: '0 0 15px rgba(0, 200, 83, 0.3)',
  };

  const textGradientStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #e2e8f0 0%, #00C853 70%, #00FF88 100%)',
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
