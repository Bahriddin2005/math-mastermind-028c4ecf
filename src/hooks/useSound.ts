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

    // Master compressor for polished iOS-quality output
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-24, now);
    compressor.knee.setValueAtTime(12, now);
    compressor.ratio.setValueAtTime(4, now);
    compressor.attack.setValueAtTime(0.002, now);
    compressor.release.setValueAtTime(0.05, now);
    compressor.connect(ctx.destination);

    // === Layer 1: Noise burst transient (realistic click impact) ===
    const bufferSize = ctx.sampleRate * 0.015;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(isUpper ? 4500 : 3000, now);
    noiseFilter.Q.setValueAtTime(1.5, now);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(isUpper ? 0.5 : 0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(compressor);
    noiseSource.start(now);

    // === Layer 2: Sharp attack tone (iOS Taptic precision) ===
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    const filter1 = ctx.createBiquadFilter();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(isUpper ? 2200 : 1400, now);
    osc1.frequency.exponentialRampToValueAtTime(isUpper ? 1100 : 700, now + 0.025);
    filter1.type = 'highpass';
    filter1.frequency.setValueAtTime(600, now);
    filter1.Q.setValueAtTime(0.7, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(compressor);
    osc1.start(now);
    osc1.stop(now + 0.04);

    // === Layer 3: Wood body resonance (real soroban bamboo rod) ===
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    const filter2 = ctx.createBiquadFilter();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(isUpper ? 720 : 480, now);
    osc2.frequency.exponentialRampToValueAtTime(isUpper ? 360 : 240, now + 0.07);
    filter2.type = 'bandpass';
    filter2.frequency.setValueAtTime(isUpper ? 900 : 600, now);
    filter2.Q.setValueAtTime(5, now);
    gain2.gain.setValueAtTime(0.18, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc2.connect(filter2);
    filter2.connect(gain2);
    gain2.connect(compressor);
    osc2.start(now);
    osc2.stop(now + 0.09);

    // === Layer 4: Sub-bass thump (physical weight sensation) ===
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(isUpper ? 180 : 120, now);
    osc3.frequency.exponentialRampToValueAtTime(50, now + 0.035);
    gain3.gain.setValueAtTime(0.22, now);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    osc3.connect(gain3);
    gain3.connect(compressor);
    osc3.start(now);
    osc3.stop(now + 0.045);

    // === Layer 5: Harmonic overtone (glass-clear iOS shine) ===
    const osc4 = ctx.createOscillator();
    const gain4 = ctx.createGain();
    osc4.type = 'sine';
    osc4.frequency.setValueAtTime(isUpper ? 3600 : 2800, now);
    osc4.frequency.exponentialRampToValueAtTime(isUpper ? 1800 : 1400, now + 0.02);
    gain4.gain.setValueAtTime(0.06, now);
    gain4.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc4.connect(gain4);
    gain4.connect(compressor);
    osc4.start(now);
    osc4.stop(now + 0.03);

    // === Layer 6: Secondary resonance tail (natural decay) ===
    const osc5 = ctx.createOscillator();
    const gain5 = ctx.createGain();
    const filter5 = ctx.createBiquadFilter();
    osc5.type = 'sine';
    osc5.frequency.setValueAtTime(isUpper ? 1050 : 780, now + 0.01);
    osc5.frequency.exponentialRampToValueAtTime(isUpper ? 520 : 390, now + 0.12);
    filter5.type = 'lowpass';
    filter5.frequency.setValueAtTime(2000, now);
    filter5.frequency.exponentialRampToValueAtTime(500, now + 0.12);
    gain5.gain.setValueAtTime(0, now);
    gain5.gain.linearRampToValueAtTime(0.08, now + 0.01);
    gain5.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc5.connect(filter5);
    filter5.connect(gain5);
    gain5.connect(compressor);
    osc5.start(now);
    osc5.stop(now + 0.12);
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
