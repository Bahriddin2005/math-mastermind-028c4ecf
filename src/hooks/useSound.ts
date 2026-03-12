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

    // Subtle random variation for each click — feels alive
    const pitchVar = 1 + (Math.random() - 0.5) * 0.06;
    const volVar = 0.9 + Math.random() * 0.2;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(1.8 * volVar, now);

    // Gentle compressor for polish
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-18, now);
    compressor.knee.setValueAtTime(8, now);
    compressor.ratio.setValueAtTime(4, now);
    compressor.attack.setValueAtTime(0.001, now);
    compressor.release.setValueAtTime(0.06, now);
    masterGain.connect(compressor);
    compressor.connect(ctx.destination);

    // ── Warm wood tone palette ──
    const baseFreq = isUpper
      ? (880 + Math.random() * 60) * pitchVar   // A5 area — bright clack
      : (440 + Math.random() * 40) * pitchVar;  // A4 area — deep clack

    // Layer 1: Fundamental — warm sine body
    const osc1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.92, now + 0.18);
    g1.gain.setValueAtTime(0.42, now);
    g1.gain.setValueAtTime(0.38, now + 0.008);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc1.connect(g1);
    g1.connect(masterGain);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Layer 2: 3rd harmonic — wood character
    const osc2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(baseFreq * 3, now);
    osc2.frequency.exponentialRampToValueAtTime(baseFreq * 2.7, now + 0.08);
    g2.gain.setValueAtTime(0.12, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc2.connect(g2);
    g2.connect(masterGain);
    osc2.start(now);
    osc2.stop(now + 0.1);

    // Layer 3: 5th harmonic — sparkle
    const osc3 = ctx.createOscillator();
    const g3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(baseFreq * 5.04, now);
    g3.gain.setValueAtTime(0.04, now);
    g3.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc3.connect(g3);
    g3.connect(masterGain);
    osc3.start(now);
    osc3.stop(now + 0.05);

    // Layer 4: Sub-resonance — body warmth
    const oscSub = ctx.createOscillator();
    const gSub = ctx.createGain();
    oscSub.type = 'sine';
    oscSub.frequency.setValueAtTime(baseFreq * 0.5, now);
    gSub.gain.setValueAtTime(0.18, now);
    gSub.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    oscSub.connect(gSub);
    gSub.connect(masterGain);
    oscSub.start(now);
    oscSub.stop(now + 0.18);

    // Layer 5: Transient click — crisp attack
    const clickLen = Math.floor(ctx.sampleRate * 0.006);
    const clickBuf = ctx.createBuffer(1, clickLen, ctx.sampleRate);
    const clickData = clickBuf.getChannelData(0);
    for (let i = 0; i < clickLen; i++) {
      const env = Math.pow(1 - i / clickLen, 10);
      clickData[i] = (Math.random() * 2 - 1) * env;
    }
    const clickSrc = ctx.createBufferSource();
    clickSrc.buffer = clickBuf;
    const clickFilter = ctx.createBiquadFilter();
    clickFilter.type = 'bandpass';
    clickFilter.frequency.setValueAtTime(isUpper ? 5500 : 3800, now);
    clickFilter.Q.setValueAtTime(1.2, now);
    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.5, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.008);
    clickSrc.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(masterGain);
    clickSrc.start(now);

    // Layer 6: Shaped noise burst — wood texture
    const noiseLen = Math.floor(ctx.sampleRate * 0.02);
    const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const noiseData = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) {
      const env = Math.exp(-i / (noiseLen * 0.15));
      noiseData[i] = (Math.random() * 2 - 1) * env * 0.6;
    }
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuf;
    const noiseHP = ctx.createBiquadFilter();
    noiseHP.type = 'highpass';
    noiseHP.frequency.setValueAtTime(800, now);
    const noiseLP = ctx.createBiquadFilter();
    noiseLP.type = 'lowpass';
    noiseLP.frequency.setValueAtTime(isUpper ? 8000 : 5000, now);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.22, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
    noiseSrc.connect(noiseHP);
    noiseHP.connect(noiseLP);
    noiseLP.connect(noiseGain);
    noiseGain.connect(masterGain);
    noiseSrc.start(now);

    // Layer 7: Micro-reverb — sense of space
    const reverbLen = Math.floor(ctx.sampleRate * 0.3);
    const reverbBuf = ctx.createBuffer(2, reverbLen, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = reverbBuf.getChannelData(ch);
      for (let i = 0; i < reverbLen; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (reverbLen * 0.12));
      }
    }
    const convolver = ctx.createConvolver();
    convolver.buffer = reverbBuf;
    const reverbGain = ctx.createGain();
    reverbGain.gain.setValueAtTime(0.06, now);
    reverbGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    const reverbLP = ctx.createBiquadFilter();
    reverbLP.type = 'lowpass';
    reverbLP.frequency.setValueAtTime(2500, now);
    masterGain.connect(convolver);
    convolver.connect(reverbLP);
    reverbLP.connect(reverbGain);
    reverbGain.connect(ctx.destination);
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
