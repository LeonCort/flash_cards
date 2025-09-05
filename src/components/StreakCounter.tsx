import { useEffect, useState } from 'react';
import './StreakCounter.css';

interface StreakCounterProps {
  streak: number;
  className?: string;
}

export default function StreakCounter({ streak, className = '' }: StreakCounterProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevStreak, setPrevStreak] = useState(streak);

  useEffect(() => {
    if (streak > prevStreak) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
    setPrevStreak(streak);
  }, [streak, prevStreak]);

  const getStreakIcon = () => {
    if (streak === 0) return '⭐';
    if (streak < 3) return '🔥';
    if (streak < 5) return '🚀';
    if (streak < 10) return '⚡';
    return '💎';
  };

  const getStreakMessage = () => {
    if (streak === 0) return 'Start your streak!';
    if (streak === 1) return 'Great start!';
    if (streak < 3) return 'Keep it up!';
    if (streak < 5) return 'On fire!';
    if (streak < 10) return 'Amazing streak!';
    return 'Legendary!';
  };

  return (
    <div className={`streak-counter ${className} ${isAnimating ? 'animating' : ''}`}>
      <div className="streak-icon">
        {getStreakIcon()}
      </div>
      <div className="streak-content">
        <div className="streak-number">{streak}</div>
        <div className="streak-label">Streak</div>
      </div>
      {streak > 0 && (
        <div className="streak-message">{getStreakMessage()}</div>
      )}
    </div>
  );
}
