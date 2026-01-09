import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiProps {
  trigger?: boolean;
  type?: 'celebration' | 'success' | 'stars' | 'fireworks';
  duration?: number;
}

export const useConfettiEffect = () => {
  const triggerConfetti = (type: 'celebration' | 'success' | 'stars' | 'fireworks' = 'celebration') => {
    const defaults = {
      zIndex: 9999,
      disableForReducedMotion: true,
    };

    switch (type) {
      case 'celebration':
        // Big celebration from both sides
        const duration = 3000;
        const end = Date.now() + duration;
        
        const frame = () => {
          confetti({
            ...defaults,
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.6 },
            colors: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EC4899'],
          });
          confetti({
            ...defaults,
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.6 },
            colors: ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EC4899'],
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };
        frame();
        break;

      case 'success':
        // Quick burst from center
        confetti({
          ...defaults,
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0'],
        });
        break;

      case 'stars':
        // Gold stars burst
        confetti({
          ...defaults,
          particleCount: 50,
          spread: 100,
          origin: { y: 0.5 },
          colors: ['#FFD700', '#FFC107', '#FF9800', '#FFEB3B'],
          shapes: ['star'],
          scalar: 1.5,
        });
        break;

      case 'fireworks':
        // Multiple firework bursts
        const colors = [
          ['#8B5CF6', '#A78BFA'],
          ['#3B82F6', '#60A5FA'],
          ['#10B981', '#34D399'],
          ['#F59E0B', '#FBBF24'],
          ['#EC4899', '#F472B6'],
        ];

        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            confetti({
              ...defaults,
              particleCount: 80,
              spread: 60,
              origin: {
                x: 0.2 + Math.random() * 0.6,
                y: 0.3 + Math.random() * 0.3,
              },
              colors: colors[i % colors.length],
            });
          }, i * 300);
        }
        break;
    }
  };

  return { triggerConfetti };
};

export const Confetti = ({ trigger = false, type = 'celebration', duration = 3000 }: ConfettiProps) => {
  const { triggerConfetti } = useConfettiEffect();

  useEffect(() => {
    if (trigger) {
      triggerConfetti(type);
    }
  }, [trigger, type]);

  return null;
};
