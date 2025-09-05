interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
  showText?: boolean;
  animated?: boolean;
}

export default function ProgressBar({ 
  current, 
  total, 
  className = '', 
  showText = true,
  animated = true 
}: ProgressBarProps) {
  const percentage = Math.round((current / total) * 100);
  
  return (
    <div className={`progress-container ${className}`}>
      {showText && (
        <div className="progress-text">
          <span className="progress-current">{current}</span>
          <span className="progress-separator">/</span>
          <span className="progress-total">{total}</span>
          <span className="progress-percentage">({percentage}%)</span>
        </div>
      )}
      <div className="progress-bar">
        <div 
          className={`progress-fill ${animated ? 'animated' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
