import { useState, useCallback, useRef, useEffect } from 'react';

type SoundType = 'correct' | 'incorrect' | 'tick' | 'complete' | 'start' | 'bead' | 'beadHigh' | 'countdown' | 'levelUp' | 'combo' | 'winner' | 'pop' | 'whoosh' | 'sparkle' | 'bounce';

// Web Audio API based sound generator
const createAudioContext = () => {
  return new (window.AudioContext || (window as any).webkitAudioContext)();
};

export const useSound = () => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Load preference from localStorage
    const saved = localStorage.getItem('iqromax-sound');
    if (saved !== null) {
      setSoundEnabled(saved === 'true');
    }
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem('iqromax-sound', String(newValue));
      return newValue;
    });
  }, []);

  const playSound = useCallback((type: SoundType) => {
    if (!soundEnabled) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = createAudioContext();
      }
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      const now = ctx.currentTime;

      switch (type) {
        case 'correct':
          // Happy ascending tone
          oscillator.frequency.setValueAtTime(523.25, now); // C5
          oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5
          oscillator.frequency.setValueAtTime(783.99, now + 0.2); // G5
          gainNode.gain.setValueAtTime(0.3, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
          oscillator.start(now);
          oscillator.stop(now + 0.4);
          break;

        case 'incorrect':
          // Low buzzer
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(150, now);
          oscillator.frequency.setValueAtTime(100, now + 0.1);
          gainNode.gain.setValueAtTime(0.2, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          oscillator.start(now);
          oscillator.stop(now + 0.3);
          break;

        case 'tick':
          // Quick tick
          oscillator.frequency.setValueAtTime(800, now);
          gainNode.gain.setValueAtTime(0.1, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
          oscillator.start(now);
          oscillator.stop(now + 0.05);
          break;

        case 'complete':
          // Victory fanfare
          oscillator.frequency.setValueAtTime(523.25, now);
          oscillator.frequency.setValueAtTime(659.25, now + 0.15);
          oscillator.frequency.setValueAtTime(783.99, now + 0.3);
          oscillator.frequency.setValueAtTime(1046.5, now + 0.45);
          gainNode.gain.setValueAtTime(0.3, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
          oscillator.start(now);
          oscillator.stop(now + 0.7);
          break;

        case 'start':
          // Start beep
          oscillator.frequency.setValueAtTime(440, now);
          oscillator.frequency.setValueAtTime(880, now + 0.1);
          gainNode.gain.setValueAtTime(0.2, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          oscillator.start(now);
          oscillator.stop(now + 0.2);
          break;

        case 'bead':
           // Fun xylophone-like sound for lower beads
          oscillator.type = 'sine';
           oscillator.frequency.setValueAtTime(523.25, now); // C5
           oscillator.frequency.exponentialRampToValueAtTime(392, now + 0.15);
           gainNode.gain.setValueAtTime(0.25, now);
           gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          oscillator.start(now);
           oscillator.stop(now + 0.2);
          break;

        case 'beadHigh':
           // Bright bell-like sound for upper bead (5 value)
          oscillator.type = 'sine';
           oscillator.frequency.setValueAtTime(880, now); // A5
           oscillator.frequency.setValueAtTime(1046.5, now + 0.05); // C6
           oscillator.frequency.exponentialRampToValueAtTime(659.25, now + 0.15);
           gainNode.gain.setValueAtTime(0.2, now);
           gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
          oscillator.start(now);
           oscillator.stop(now + 0.25);
          break;

        case 'countdown':
          // Countdown beep - higher pitch for urgency
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(600, now);
          gainNode.gain.setValueAtTime(0.25, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
          oscillator.start(now);
          oscillator.stop(now + 0.15);
          break;

        case 'levelUp':
          // Level up - triumphant ascending
          oscillator.frequency.setValueAtTime(440, now);
          oscillator.frequency.setValueAtTime(554.37, now + 0.1);
          oscillator.frequency.setValueAtTime(659.25, now + 0.2);
          oscillator.frequency.setValueAtTime(880, now + 0.3);
          gainNode.gain.setValueAtTime(0.3, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
          oscillator.start(now);
          oscillator.stop(now + 0.5);
          break;

        case 'combo':
          // Combo sound - quick double beep
          oscillator.frequency.setValueAtTime(700, now);
          oscillator.frequency.setValueAtTime(900, now + 0.08);
          gainNode.gain.setValueAtTime(0.2, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          oscillator.start(now);
          oscillator.stop(now + 0.2);
          break;

        case 'winner':
          // Winner fanfare - epic victory
          oscillator.frequency.setValueAtTime(392, now);
          oscillator.frequency.setValueAtTime(523.25, now + 0.15);
          oscillator.frequency.setValueAtTime(659.25, now + 0.3);
          oscillator.frequency.setValueAtTime(783.99, now + 0.45);
          oscillator.frequency.setValueAtTime(1046.5, now + 0.6);
          gainNode.gain.setValueAtTime(0.35, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
          oscillator.start(now);
          oscillator.stop(now + 0.9);
          break;

        case 'pop':
           // Cute bubble pop for drag start
          oscillator.type = 'sine';
           oscillator.frequency.setValueAtTime(600, now);
           oscillator.frequency.setValueAtTime(900, now + 0.03);
           oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.1);
           gainNode.gain.setValueAtTime(0.2, now);
           gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
          oscillator.start(now);
           oscillator.stop(now + 0.12);
          break;

        case 'whoosh':
          // Whoosh sound - like a swipe
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(300, now);
          oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
          oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.25);
          gainNode.gain.setValueAtTime(0.15, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
          oscillator.start(now);
          oscillator.stop(now + 0.25);
          break;

        case 'sparkle':
          // Magical sparkle sound
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(1200, now);
          oscillator.frequency.setValueAtTime(1800, now + 0.05);
          oscillator.frequency.setValueAtTime(1400, now + 0.1);
          oscillator.frequency.setValueAtTime(2000, now + 0.15);
          gainNode.gain.setValueAtTime(0.2, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
          oscillator.start(now);
          oscillator.stop(now + 0.25);
          break;

        case 'bounce':
          // Bouncy cartoon sound
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(400, now);
          oscillator.frequency.setValueAtTime(600, now + 0.05);
          oscillator.frequency.setValueAtTime(350, now + 0.1);
          oscillator.frequency.setValueAtTime(500, now + 0.15);
          gainNode.gain.setValueAtTime(0.3, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          oscillator.start(now);
          oscillator.stop(now + 0.2);
          break;
      }
    } catch (e) {
      console.log('Sound not available');
    }
  }, [soundEnabled]);

  return { soundEnabled, toggleSound, playSound };
};
