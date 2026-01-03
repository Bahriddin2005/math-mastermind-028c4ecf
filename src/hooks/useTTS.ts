import { useRef, useCallback, useState } from 'react';

interface TTSOptions {
  voiceId?: string;
  useElevenLabs?: boolean;
}

export const useTTS = (options: TTSOptions = {}) => {
  const { voiceId = 'EXAVITQu4vr4xnSDxMaL', useElevenLabs = true } = options;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Web Speech API fallback
  const speakWithBrowser = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'uz-UZ';
      utterance.rate = 1.2;
      utterance.pitch = 1;
      
      const voices = window.speechSynthesis.getVoices();
      const uzVoice = voices.find(v => v.lang.startsWith('uz'));
      const ruVoice = voices.find(v => v.lang.startsWith('ru'));
      
      if (uzVoice) {
        utterance.voice = uzVoice;
      } else if (ruVoice) {
        utterance.voice = ruVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // ElevenLabs TTS
  const speakWithElevenLabs = useCallback(async (text: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Clean up previous audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, voiceId }),
        }
      );

      if (!response.ok) {
        throw new Error(`TTS request failed: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      await audio.play();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('ElevenLabs TTS error:', err);
      // Fallback to browser TTS
      speakWithBrowser(text);
    } finally {
      setIsLoading(false);
    }
  }, [voiceId, speakWithBrowser]);

  // Main speak function - formats math operations
  const speakNumber = useCallback((number: string, isAddition: boolean, isFirst: boolean) => {
    let text: string;
    
    if (isFirst) {
      text = number;
    } else {
      text = isAddition ? `qo'sh ${number}` : `ayir ${number}`;
    }
    
    if (useElevenLabs) {
      speakWithElevenLabs(text);
    } else {
      speakWithBrowser(text);
    }
  }, [useElevenLabs, speakWithElevenLabs, speakWithBrowser]);

  // Stop current playback
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Cleanup
  const cleanup = useCallback(() => {
    stop();
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, [stop]);

  return {
    speakNumber,
    speakWithElevenLabs,
    speakWithBrowser,
    stop,
    cleanup,
    isLoading,
    error,
  };
};
