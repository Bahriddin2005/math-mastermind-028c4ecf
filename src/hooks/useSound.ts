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

  const playiOSBeadSound = useCallback((ctx: AudioContext, isUpper: boolean) => {
    const now = ctx.currentTime;
    
    // Create multiple layered oscillators for rich, realistic iOS-like click
    // Layer 1: Sharp attack transient (like iPhone keyboard click)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const filter1 = ctx.createBiquadFilter();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(isUpper ? 1800 : 1200, now);
    osc1.frequency.exponentialRampToValueAtTime(isUpper ? 900 : 600, now + 0.03);
    filter1.type = 'highpass';
    filter1.frequency.setValueAtTime(400, now);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.06);
    
    // Layer 2: Woody resonance body (like real soroban bead on bamboo)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    const filter2 = ctx.createBiquadFilter();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(isUpper ? 680 : 440, now);
    osc2.frequency.exponentialRampToValueAtTime(isUpper ? 320 : 220, now + 0.08);
    filter2.type = 'bandpass';
    filter2.frequency.setValueAtTime(isUpper ? 800 : 500, now);
    filter2.Q.setValueAtTime(3, now);
    gain2.gain.setValueAtTime(0.2, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc2.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.1);
    
    // Layer 3: Subtle haptic-style sub thump (iOS Taptic feel)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(isUpper ? 150 : 100, now);
    osc3.frequency.exponentialRampToValueAtTime(60, now + 0.04);
    gain3.gain.setValueAtTime(0.15, now);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now);
    osc3.stop(now + 0.05);

    // Layer 4: High harmonic shimmer (glass-like iOS clarity)
    const osc4 = ctx.createOscillator();
    const gain4 = ctx.createGain();
    osc4.type = 'sine';
    osc4.frequency.setValueAtTime(isUpper ? 3200 : 2400, now);
    osc4.frequency.exponentialRampToValueAtTime(isUpper ? 1600 : 1200, now + 0.025);
    gain4.gain.setValueAtTime(0.08, now);
    gain4.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    osc4.connect(gain4);
    gain4.connect(ctx.destination);
    osc4.start(now);
    osc4.stop(now + 0.035);
  }, []);

  const playSound = useCallback((type: SoundType) => {
    if (!soundEnabled) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = createAudioContext();
      }
      const ctx = audioContextRef.current;
      
      // Resume context if suspended (iOS requirement)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Use special iOS-style bead sounds
      if (type === 'bead') {
        playiOSBeadSound(ctx, false);
        return;
      }
      if (type === 'beadHigh') {
        playiOSBeadSound(ctx, true);
        return;
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      const now = ctx.currentTime;

      switch (type) {
        case 'correct':
          oscillator.frequency.setValueAtTime(523.25, now);
          oscillator.frequency.setValueAtTime(659.25, now + 0.1);
          oscillator.frequency.setValueAtTime(783.99, now + 0.2);
          gainNode.gain.setValueAtTime(0.3, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
          oscillator.start(now);
          oscillator.stop(now + 0.4);
          break;

        case 'incorrect':
          oscillator.type = 'sawtooth';
          oscillator.frequency.setValueAtTime(150, now);
          oscillator.frequency.setValueAtTime(100, now + 0.1);
          gainNode.gain.setValueAtTime(0.2, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
          oscillator.start(now);
          oscillator.stop(now + 0.3);
          break;

        case 'tick':
          oscillator.frequency.setValueAtTime(800, now);
          gainNode.gain.setValueAtTime(0.1, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
          oscillator.start(now);
          oscillator.stop(now + 0.05);
          break;

        case 'complete':
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
          oscillator.frequency.setValueAtTime(440, now);
          oscillator.frequency.setValueAtTime(880, now + 0.1);
          gainNode.gain.setValueAtTime(0.2, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          oscillator.start(now);
          oscillator.stop(now + 0.2);
          break;

        case 'countdown':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(600, now);
          gainNode.gain.setValueAtTime(0.25, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
          oscillator.start(now);
          oscillator.stop(now + 0.15);
          break;

        case 'levelUp':
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
          oscillator.frequency.setValueAtTime(700, now);
          oscillator.frequency.setValueAtTime(900, now + 0.08);
          gainNode.gain.setValueAtTime(0.2, now);
          gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
          oscillator.start(now);
          oscillator.stop(now + 0.2);
          break;

        case 'winner':
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
  }, [soundEnabled, playiOSBeadSound]);

  return { soundEnabled, toggleSound, playSound };
};
