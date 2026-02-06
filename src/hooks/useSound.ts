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

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(2.8, now);
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-15, now);
    compressor.knee.setValueAtTime(6, now);
    compressor.ratio.setValueAtTime(3, now);
    compressor.attack.setValueAtTime(0.001, now);
    compressor.release.setValueAtTime(0.04, now);
    masterGain.connect(compressor);
    compressor.connect(ctx.destination);

    // Crystal/Xylophone style — bright metallic bars with shimmering decay
    // Upper = G#6 (1661Hz), Lower = E5 (659Hz) — iOS Crystal intervals
    const baseFreq = isUpper ? 1661.2 : 659.25;

    // === Layer 1: Metallic bar fundamental (bright sine, fast decay) ===
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, now);
    gain1.gain.setValueAtTime(0.55, now);
    gain1.gain.setTargetAtTime(0.3, now + 0.005, 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // === Layer 2: 3rd partial (xylophone characteristic — 3x freq) ===
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(baseFreq * 3, now);
    gain2.gain.setValueAtTime(0.18, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc2.connect(gain2);
    gain2.connect(masterGain);
    osc2.start(now);
    osc2.stop(now + 0.25);

    // === Layer 3: 6th partial (metallic shimmer) ===
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(baseFreq * 6.27, now);
    gain3.gain.setValueAtTime(0.07, now);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc3.connect(gain3);
    gain3.connect(masterGain);
    osc3.start(now);
    osc3.stop(now + 0.12);

    // === Layer 4: 9.5th partial (inharmonic — crystal bell character) ===
    const osc4 = ctx.createOscillator();
    const gain4 = ctx.createGain();
    osc4.type = 'sine';
    osc4.frequency.setValueAtTime(baseFreq * 9.5, now);
    gain4.gain.setValueAtTime(0.03, now);
    gain4.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    osc4.connect(gain4);
    gain4.connect(masterGain);
    osc4.start(now);
    osc4.stop(now + 0.06);

    // === Layer 5: Hard mallet strike transient ===
    const bufferSize = Math.floor(ctx.sampleRate * 0.008);
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 8);
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(isUpper ? 7000 : 5000, now);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.008);
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noiseSource.start(now);

    // === Layer 6: Sustain shimmer (vibrating metal bar afterglow) ===
    const osc5 = ctx.createOscillator();
    const gain5 = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    // Subtle vibrato for metallic shimmer
    lfo.frequency.setValueAtTime(8, now);
    lfoGain.gain.setValueAtTime(baseFreq * 0.003, now);
    lfo.connect(lfoGain);
    lfoGain.connect(osc5.frequency);
    osc5.type = 'sine';
    osc5.frequency.setValueAtTime(baseFreq * 2.01, now); // Slightly detuned octave
    gain5.gain.setValueAtTime(0.1, now);
    gain5.gain.setTargetAtTime(0.06, now + 0.02, 0.05);
    gain5.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc5.connect(gain5);
    gain5.connect(masterGain);
    lfo.start(now);
    osc5.start(now);
    lfo.stop(now + 0.4);
    osc5.stop(now + 0.4);

    // === Layer 7: Stereo-like reverb (iOS spacious crystal room) ===
    const delay1 = ctx.createDelay(0.15);
    delay1.delayTime.setValueAtTime(0.035, now);
    const dGain1 = ctx.createGain();
    dGain1.gain.setValueAtTime(0.12, now);
    dGain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    const dFilter1 = ctx.createBiquadFilter();
    dFilter1.type = 'lowpass';
    dFilter1.frequency.setValueAtTime(3000, now);
    masterGain.connect(delay1);
    delay1.connect(dFilter1);
    dFilter1.connect(dGain1);
    dGain1.connect(ctx.destination);

    const delay2 = ctx.createDelay(0.2);
    delay2.delayTime.setValueAtTime(0.072, now);
    const dGain2 = ctx.createGain();
    dGain2.gain.setValueAtTime(0.06, now);
    dGain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    const dFilter2 = ctx.createBiquadFilter();
    dFilter2.type = 'lowpass';
    dFilter2.frequency.setValueAtTime(1800, now);
    masterGain.connect(delay2);
    delay2.connect(dFilter2);
    dFilter2.connect(dGain2);
    dGain2.connect(ctx.destination);
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
