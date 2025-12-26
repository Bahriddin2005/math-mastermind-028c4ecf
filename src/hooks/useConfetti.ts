import { useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';

export const useConfetti = () => {
  const lastStreakRef = useRef(0);

  const triggerStreakConfetti = useCallback((streak: number) => {
    // Only trigger when crossing the 5-streak threshold
    if (streak >= 5 && lastStreakRef.current < 5) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1'],
      });
    }
    
    // Trigger for every 5 streak milestone
    if (streak > 0 && streak % 5 === 0 && streak !== lastStreakRef.current) {
      confetti({
        particleCount: 50 + streak * 5,
        spread: 60 + streak * 2,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1'],
      });
    }
    
    lastStreakRef.current = streak;
  }, []);

  const triggerLevelUpConfetti = useCallback(() => {
    // Fire confetti from both sides
    const duration = 2000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FFA500', '#45B7D1'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#FF6B6B', '#4ECDC4', '#9B59B6'],
      });
    }, 250);
  }, []);

  const triggerCompletionConfetti = useCallback((accuracy: number) => {
    if (accuracy >= 80) {
      // Big celebration for high accuracy
      triggerLevelUpConfetti();
    } else if (accuracy >= 60) {
      // Medium celebration
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
    }
  }, [triggerLevelUpConfetti]);

  const resetStreak = useCallback(() => {
    lastStreakRef.current = 0;
  }, []);

  return {
    triggerStreakConfetti,
    triggerLevelUpConfetti,
    triggerCompletionConfetti,
    resetStreak,
  };
};
