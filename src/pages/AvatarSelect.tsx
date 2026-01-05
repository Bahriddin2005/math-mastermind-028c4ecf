import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Crown, Sparkles, Wand2, Bot, Zap, Shield, Rocket, Star, Sword, Brain, Flame, Ghost, Heart, Diamond, Moon, Sun, Gamepad2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PageBackground } from '@/components/layout/PageBackground';
import confetti from 'canvas-confetti';
import { useSound } from '@/hooks/useSound';

// Intro phrases for each avatar (text without emojis for TTS)
const INTRO_PHRASES: Record<string, { text: string; display: string }[]> = {
  ninja: [
    { text: "Soyada yashirinaman", display: "Soyada yashirinaman... ⚡" },
    { text: "Tezlik mening kuchim!", display: "Tezlik - mening kuchim!" },
    { text: "Hech kim meni tutolmaydi!", display: "Hech kim meni tutolmaydi!" }
  ],
  robot: [
    { text: "Bip bup! Men tayorman", display: "Beep boop! Men tayorman 🤖" },
    { text: "Barcha hisoblarni bajaraman!", display: "Barcha hisoblarni bajaraman!" },
    { text: "Xatolik? Bu nima?", display: "Xatolik? Bu nima? 😎" }
  ],
  star: [
    { text: "Men porlab turaman", display: "Men porlab turaman ✨" },
    { text: "Qorong'ulikda ham yorug'man!", display: "Qorong'ulikda ham yorug'man!" },
    { text: "Yulduzlar bilan birga!", display: "Yulduzlar bilan birga!" }
  ],
  gamer: [
    { text: "O'yin boshlansin!", display: "O'yin boshlansin! 🎮" },
    { text: "Yangi rekord qo'yaman!", display: "Yangi rekord qo'yaman!" },
    { text: "Game over? Hech qachon!", display: "Game over? Hech qachon!" }
  ],
  wizard: [
    { text: "Abrakadabra!", display: "Abrakadabra! ✨" },
    { text: "Sehr kuchim cheksiz!", display: "Sehr kuchim cheksiz!" },
    { text: "Matematika bu sehr!", display: "Matematika - bu sehr!" }
  ],
  superhero: [
    { text: "Kuch men bilan!", display: "Kuch men bilan! 💪" },
    { text: "Yaxshilik g'alaba qiladi!", display: "Yaxshilik g'alaba qiladi!" },
    { text: "Men yetib keldim!", display: "Men yetib keldim!" }
  ],
  astronaut: [
    { text: "Uch, ikki, bir, Uchish!", display: "3... 2... 1... Uchish! 🚀" },
    { text: "Kosmosdan salom!", display: "Kosmosdan salom!" },
    { text: "Yulduzlarga yo'l olaman!", display: "Yulduzlarga yo'l olaman!" }
  ],
  warrior: [
    { text: "Jangga tayyorman!", display: "Jangga tayyorman! ⚔️" },
    { text: "Qo'rquv bu nima?", display: "Qo'rquv - bu nima?" },
    { text: "G'alaba bizniki!", display: "G'alaba bizniki!" }
  ],
  genius: [
    { text: "Fikrlash bu oson!", display: "Fikrlash - bu oson! 🧠" },
    { text: "Aqlim o'tkir!", display: "Aqlim o'tkir!" },
    { text: "Har qanday masalani yechaman!", display: "Har qanday masalani yechaman!" }
  ],
  phoenix: [
    { text: "Men kul ichidan tug'ilaman!", display: "Men kul ichidan tug'ilaman! 🔥" },
    { text: "Mening kuchim yonadi!", display: "Mening kuchim yonadi!" },
    { text: "Hech narsa to'xtatolmaydi!", display: "Hech narsa to'xtatolmaydi!" }
  ],
  shadow: [
    { text: "Men soyalardaman", display: "Men soyalardaman... 👻" },
    { text: "Sirli va tezkorman!", display: "Sirli va tezkorman!" },
    { text: "Hech kim ko'rmaydi!", display: "Hech kim ko'rmaydi!" }
  ],
  diamond: [
    { text: "Men eng noyobman!", display: "Men eng noyobman! 💎" },
    { text: "Porloq va bemisl!", display: "Porloq va bemisl!" },
    { text: "Olmos kabi mustahkam!", display: "Olmos kabi mustahkam!" }
  ],
  moonknight: [
    { text: "Tunda uyg'onaman", display: "Tunda uyg'onaman 🌙" },
    { text: "Oy nuri bilan!", display: "Oy nuri bilan!" },
    { text: "Qorong'ulik do'stim!", display: "Qorong'ulik do'stim!" }
  ],
  sunknight: [
    { text: "Yorug'lik tarqataman", display: "Yorug'lik tarqataman ☀️" },
    { text: "Quyosh kabi kuchli!", display: "Quyosh kabi kuchli!" },
    { text: "Nur sochaman!", display: "Nur sochaman!" }
  ],
  loveheart: [
    { text: "Sevgi bilan!", display: "Sevgi bilan! ❤️" },
    { text: "Yuragim katta!", display: "Yuragim katta!" },
    { text: "Mehribonlik kuchim!", display: "Mehribonlik kuchim!" }
  ],
};

// Voice IDs for different avatar types - diverse voices for variety
const AVATAR_VOICES: Record<string, string> = {
  // Boys/Male characters
  ninja: 'N2lVS1w4EtoT3dr4eOWO', // Callum - young, energetic
  robot: 'iP95p4xoKVk53GoZ742B', // Chris - clear, robotic feel
  gamer: 'TX3LPaxmHKxFdv7VOQHJ', // Liam - young, excited
  superhero: 'JBFqnCBsd6RMkjVDRZzb', // George - heroic
  astronaut: 'onwK4e9ZLuTAKqWW03F9', // Daniel - calm, professional
  warrior: 'nPczCjzI2devNBz1zQrb', // Brian - strong, confident
  genius: 'cjVigY5qzO86Huf0OWal', // Eric - intelligent
  phoenix: 'CwhRBWXzGAHq8TQ4Fs17', // Roger - powerful
  shadow: 'bIHbv24MWmeRgasZH58o', // Will - mysterious
  // Girls/Female characters
  star: 'pFZP5JQG7iQjIQuC4Bku', // Lily - cheerful
  wizard: 'XrExE9yKIg1WjnnlVkGX', // Matilda - magical
  diamond: 'cgSgspJ2msm6clMCkdW9', // Jessica - elegant
  moonknight: 'FGY2WhTYpPnrIDTdsKH5', // Laura - calm, mystical
  sunknight: 'EXAVITQu4vr4xnSDxMaL', // Sarah - warm, bright
  loveheart: 'Xb7hH8MSUJpSbSDYk0k2', // Alice - sweet, caring
};

// Avatar intro component with voice
const AvatarIntro = ({ 
  avatar, 
  onClose 
}: { 
  avatar: AvatarOption; 
  onClose: () => void;
}) => {
  const [phase, setPhase] = useState<'entering' | 'showing' | 'phrase' | 'exiting'>('entering');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const phrases = INTRO_PHRASES[avatar.id] || [{ text: "Salom!", display: "Salom! 👋" }];
  
  // Play voice intro (optional - fails gracefully if TTS unavailable)
  const playVoiceIntro = useCallback(async () => {
    try {
      setIsPlayingVoice(true);
      const voiceId = AVATAR_VOICES[avatar.id] || 'EXAVITQu4vr4xnSDxMaL';
      const introText = phrases[0].text;
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            text: introText, 
            voiceId 
          }),
        }
      );

      // Only play if response is successful and is audio
      if (response.ok && response.headers.get('content-type')?.includes('audio')) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        audioRef.current = new Audio(audioUrl);
        audioRef.current.volume = 0.8;
        await audioRef.current.play();
      }
      // If TTS fails, intro animation continues without voice
    } catch (error) {
      // Silently fail - voice is optional enhancement
      console.log('Voice intro skipped:', error);
    } finally {
      setIsPlayingVoice(false);
    }
  }, [avatar.id, phrases]);

  useEffect(() => {
    // Animation sequence
    const timers: NodeJS.Timeout[] = [];
    
    timers.push(setTimeout(() => setPhase('showing'), 300));
    timers.push(setTimeout(() => {
      setPhase('phrase');
      playVoiceIntro(); // Play voice when phrase starts
    }, 800));
    timers.push(setTimeout(() => setPhraseIndex(1), 1800));
    timers.push(setTimeout(() => setPhraseIndex(2), 2800));
    timers.push(setTimeout(() => setPhase('exiting'), 3800));
    timers.push(setTimeout(() => onClose(), 4200));
    
    return () => {
      timers.forEach(clearTimeout);
      // Cleanup audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [onClose, playVoiceIntro]);

  // Confetti burst on show
  useEffect(() => {
    if (phase === 'showing') {
      const colors = avatar.rarity === 'legendary' ? ['#FFD700', '#FFA500', '#FF69B4', '#00CED1'] :
                     avatar.rarity === 'epic' ? ['#9B59B6', '#8E44AD', '#E74C3C'] :
                     avatar.rarity === 'rare' ? ['#3498DB', '#2980B9', '#1ABC9C'] :
                     ['#95A5A6', '#7F8C8D', '#BDC3C7'];
      
      confetti({
        particleCount: avatar.rarity === 'legendary' ? 150 : 80,
        spread: 100,
        origin: { y: 0.5 },
        colors,
      });
    }
  }, [phase, avatar]);

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300",
        phase === 'entering' ? "bg-black/0" : "bg-black/70",
        phase === 'exiting' && "bg-black/0"
      )}
      onClick={onClose}
    >
      {/* Close button */}
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors z-10"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {/* Main avatar intro */}
      <div 
        className={cn(
          "relative transition-all duration-500 ease-out",
          phase === 'entering' && "scale-0 opacity-0",
          phase === 'showing' && "scale-100 opacity-100",
          phase === 'phrase' && "scale-100 opacity-100",
          phase === 'exiting' && "scale-150 opacity-0"
        )}
      >
        {/* Glow effect */}
        <div 
          className={cn(
            "absolute inset-0 blur-3xl opacity-60 transition-all duration-500",
            `bg-gradient-to-br ${avatar.gradient}`,
            phase === 'showing' && "scale-150",
            phase === 'phrase' && "scale-125 animate-pulse"
          )}
        />

        {/* Ring animations for legendary */}
        {avatar.rarity === 'legendary' && (
          <>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-4 border-amber-400/50 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-yellow-400/60 rounded-full animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </>
        )}

        {/* Epic pulse rings */}
        {avatar.rarity === 'epic' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-56 h-56 border-4 border-purple-400/40 rounded-full animate-pulse" />
          </div>
        )}

        {/* Content card */}
        <div className={cn(
          "relative z-10 p-8 rounded-3xl text-center",
          "bg-gradient-to-br",
          avatar.gradient,
          "shadow-2xl"
        )}>
          {/* Crown for legendary */}
          {avatar.rarity === 'legendary' && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2">
              <div className="text-5xl animate-bounce">👑</div>
            </div>
          )}

          {/* Big emoji with animation */}
          <div 
            className={cn(
              "text-9xl mb-4 transition-all duration-700",
              phase === 'phrase' && "animate-bounce"
            )}
            style={{
              filter: avatar.rarity === 'legendary' ? 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.8))' : 
                      avatar.rarity === 'epic' ? 'drop-shadow(0 0 15px rgba(147, 51, 234, 0.6))' : 
                      'none'
            }}
          >
            {avatar.emoji}
          </div>

          {/* Name with entrance */}
          <div 
            className={cn(
              "text-3xl font-black text-white mb-2 transition-all duration-500",
              phase === 'entering' && "translate-y-4 opacity-0",
              phase !== 'entering' && "translate-y-0 opacity-100"
            )}
          >
            {avatar.name}
          </div>

          {/* Rarity badge */}
          <div className={cn(
            "inline-block px-4 py-1 rounded-full text-sm font-bold mb-4",
            "bg-white/20 text-white"
          )}>
            {avatar.rarity === 'legendary' && '👑 '}
            {avatar.rarity === 'epic' && '💜 '}
            {avatar.rarity === 'rare' && '💙 '}
            {RARITY_CONFIG[avatar.rarity].label}
          </div>

          {/* Phrase display */}
          <div 
            className={cn(
              "min-h-[60px] flex items-center justify-center transition-all duration-300",
              phase !== 'phrase' && "opacity-0 scale-90",
              phase === 'phrase' && "opacity-100 scale-100"
            )}
          >
            <div className="text-xl font-bold text-white/95 px-6 py-3 rounded-2xl bg-white/10 backdrop-blur-sm">
              {phrases[Math.min(phraseIndex, phrases.length - 1)].display}
            </div>
          </div>

          {/* Sparkles */}
          <div className="absolute top-4 left-4 text-2xl animate-pulse">✨</div>
          <div className="absolute top-8 right-6 text-xl animate-pulse" style={{ animationDelay: '0.3s' }}>⭐</div>
          <div className="absolute bottom-6 left-8 text-xl animate-pulse" style={{ animationDelay: '0.6s' }}>🌟</div>
          <div className="absolute bottom-4 right-4 text-2xl animate-pulse" style={{ animationDelay: '0.9s' }}>💫</div>
        </div>
      </div>
    </div>
  );
};

interface AvatarOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  emoji: string;
  gradient: string;
  description: string;
  bgColor: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const AVATAR_OPTIONS: AvatarOption[] = [
  // Common - bolalar uchun sodda va tushunarli
  {
    id: 'ninja',
    name: 'Ninja',
    icon: <Zap className="h-8 w-8" />,
    emoji: '🥷',
    gradient: 'from-purple-500 to-indigo-600',
    description: 'Tez va chaqqon',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    rarity: 'common',
  },
  {
    id: 'robot',
    name: 'Robot',
    icon: <Bot className="h-8 w-8" />,
    emoji: '🤖',
    gradient: 'from-cyan-500 to-blue-600',
    description: 'Aqlli robot',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
    rarity: 'common',
  },
  {
    id: 'star',
    name: 'Yulduzcha',
    icon: <Star className="h-8 w-8" />,
    emoji: '⭐',
    gradient: 'from-amber-400 to-yellow-500',
    description: 'Porloq yulduz',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    rarity: 'common',
  },
  {
    id: 'gamer',
    name: "O'yinchi",
    icon: <Gamepad2 className="h-8 w-8" />,
    emoji: '🎮',
    gradient: 'from-green-500 to-emerald-600',
    description: "O'yin ustasi",
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    rarity: 'common',
  },
  // Rare
  {
    id: 'wizard',
    name: 'Sehrgar',
    icon: <Wand2 className="h-8 w-8" />,
    emoji: '🧙‍♂️',
    gradient: 'from-violet-500 to-purple-600',
    description: 'Sehr ustasi',
    bgColor: 'bg-violet-50 dark:bg-violet-950/30',
    rarity: 'rare',
  },
  {
    id: 'superhero',
    name: 'Qahramon',
    icon: <Shield className="h-8 w-8" />,
    emoji: '🦸',
    gradient: 'from-red-500 to-orange-600',
    description: 'Super kuchli',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    rarity: 'rare',
  },
  {
    id: 'astronaut',
    name: 'Kosmonavt',
    icon: <Rocket className="h-8 w-8" />,
    emoji: '👨‍🚀',
    gradient: 'from-slate-500 to-gray-600',
    description: 'Koinot sayohatchisi',
    bgColor: 'bg-slate-50 dark:bg-slate-950/30',
    rarity: 'rare',
  },
  {
    id: 'warrior',
    name: 'Jangchi',
    icon: <Sword className="h-8 w-8" />,
    emoji: '⚔️',
    gradient: 'from-rose-500 to-red-600',
    description: 'Jasur jangchi',
    bgColor: 'bg-rose-50 dark:bg-rose-950/30',
    rarity: 'rare',
  },
  // Epic
  {
    id: 'genius',
    name: 'Dono',
    icon: <Brain className="h-8 w-8" />,
    emoji: '🧠',
    gradient: 'from-pink-500 to-rose-600',
    description: 'Super aqlli',
    bgColor: 'bg-pink-50 dark:bg-pink-950/30',
    rarity: 'epic',
  },
  {
    id: 'phoenix',
    name: 'Feniks',
    icon: <Flame className="h-8 w-8" />,
    emoji: '🔥',
    gradient: 'from-orange-500 to-red-600',
    description: "O't qushi",
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    rarity: 'epic',
  },
  {
    id: 'shadow',
    name: 'Soya',
    icon: <Ghost className="h-8 w-8" />,
    emoji: '👻',
    gradient: 'from-gray-600 to-slate-700',
    description: 'Sirli qahramon',
    bgColor: 'bg-gray-100 dark:bg-gray-900/50',
    rarity: 'epic',
  },
  // Legendary
  {
    id: 'diamond',
    name: 'Olmos',
    icon: <Diamond className="h-8 w-8" />,
    emoji: '💎',
    gradient: 'from-cyan-400 via-blue-500 to-purple-500',
    description: 'Eng noyob',
    bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
    rarity: 'legendary',
  },
  {
    id: 'moonknight',
    name: 'Oy Ritsari',
    icon: <Moon className="h-8 w-8" />,
    emoji: '🌙',
    gradient: 'from-indigo-500 via-purple-500 to-pink-500',
    description: 'Tun qahramoni',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
    rarity: 'legendary',
  },
  {
    id: 'sunknight',
    name: 'Quyosh',
    icon: <Sun className="h-8 w-8" />,
    emoji: '☀️',
    gradient: 'from-yellow-400 via-orange-500 to-red-500',
    description: "Yorug'lik beruvchi",
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    rarity: 'legendary',
  },
  {
    id: 'loveheart',
    name: 'Sevgi',
    icon: <Heart className="h-8 w-8" />,
    emoji: '❤️',
    gradient: 'from-pink-400 via-rose-500 to-red-500',
    description: 'Mehribon yurak',
    bgColor: 'bg-pink-50 dark:bg-pink-950/30',
    rarity: 'legendary',
  },
];

const RARITY_CONFIG = {
  common: { label: 'Oddiy', color: 'text-gray-600 dark:text-gray-400', bgLabel: 'bg-gray-100 dark:bg-gray-800' },
  rare: { label: 'Kam', color: 'text-blue-600 dark:text-blue-400', bgLabel: 'bg-blue-100 dark:bg-blue-900/50' },
  epic: { label: 'Epic', color: 'text-purple-600 dark:text-purple-400', bgLabel: 'bg-purple-100 dark:bg-purple-900/50' },
  legendary: { label: 'Afsonaviy', color: 'text-amber-600 dark:text-amber-400', bgLabel: 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/50 dark:to-yellow-900/50' },
};

export const AvatarSelect = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { playSound } = useSound();
  const [selectedAvatar, setSelectedAvatar] = useState<string>('ninja');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [showingIntro, setShowingIntro] = useState<AvatarOption | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setCurrentProfile(data);
        setUsername(data.username || '');
        if (data.avatar_url) {
          const avatarType = AVATAR_OPTIONS.find(a => 
            data.avatar_url?.includes(a.id)
          );
          if (avatarType) {
            setSelectedAvatar(avatarType.id);
          }
        }
      }
    };
    
    loadProfile();
  }, [user]);

  const handleCloseIntro = useCallback(() => {
    setShowingIntro(null);
  }, []);

  const handleSelectAvatar = (avatar: AvatarOption) => {
    // Only show intro if selecting a different avatar
    if (selectedAvatar !== avatar.id) {
      setSelectedAvatar(avatar.id);
      playSound?.('levelUp');
      setShowingIntro(avatar);
    }
  };

  const handleSave = async () => {
    if (!user || !username.trim()) {
      toast.error("Ism kiriting 📝");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const selectedAvatarData = AVATAR_OPTIONS.find(a => a.id === selectedAvatar);
      const avatarUrl = `avatar:${selectedAvatar}`;
      
      const { error } = await supabase
        .from('profiles')
        .update({
          username: username.trim(),
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      playSound?.('levelUp');
      
      // Celebration confetti
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#FFD700', '#4ECDC4', '#FF6B6B', '#45B7D1', '#96CEB4', '#9B59B6'],
      });
      
      toast.success(`${selectedAvatarData?.emoji} ${selectedAvatarData?.name} tanlandi!`);
      
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error("Xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedAvatarData = AVATAR_OPTIONS.find(a => a.id === selectedAvatar);

  // Group avatars by rarity
  const groupedAvatars = {
    legendary: AVATAR_OPTIONS.filter(a => a.rarity === 'legendary'),
    epic: AVATAR_OPTIONS.filter(a => a.rarity === 'epic'),
    rare: AVATAR_OPTIONS.filter(a => a.rarity === 'rare'),
    common: AVATAR_OPTIONS.filter(a => a.rarity === 'common'),
  };

  return (
    <PageBackground>
      {/* Avatar Intro Modal */}
      {showingIntro && (
        <AvatarIntro avatar={showingIntro} onClose={handleCloseIntro} />
      )}
      
      <div className="min-h-screen py-6 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Header - chiroyli va sodda */}
          <div className="text-center space-y-3">
            <div 
              className="inline-block animate-fade-in"
              style={{ animationDelay: '0ms' }}
            >
              <div className="text-6xl mb-2">🎭</div>
              <h1 className="text-3xl sm:text-4xl font-black text-foreground">
                Qahramoningizni tanlang!
              </h1>
              <p className="text-muted-foreground mt-2">
                O'zingizga yoqqan qahramoni bosing ✨
              </p>
            </div>
          </div>

          {/* Username Input - katta va tushunarli */}
          <Card 
            className="border-2 border-primary/30 shadow-lg animate-fade-in" 
            style={{ animationDelay: '100ms' }}
          >
            <CardContent className="pt-5 pb-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-lg font-bold flex items-center gap-2">
                  👤 Sizning ismingiz
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masalan: Ali, Madina..."
                  className="text-xl h-14 border-2 focus:border-primary font-medium"
                  maxLength={20}
                />
              </div>
            </CardContent>
          </Card>

          {/* Avatar Groups */}
          {Object.entries(groupedAvatars).map(([rarity, avatars], groupIndex) => (
            <div 
              key={rarity} 
              className="space-y-3 animate-fade-in"
              style={{ animationDelay: `${150 + groupIndex * 100}ms` }}
            >
              {/* Rarity Label */}
              <div className="flex items-center justify-center gap-3">
                <div className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-bold",
                  RARITY_CONFIG[rarity as keyof typeof RARITY_CONFIG].bgLabel,
                  RARITY_CONFIG[rarity as keyof typeof RARITY_CONFIG].color
                )}>
                  {rarity === 'legendary' && '👑 '}
                  {rarity === 'epic' && '💜 '}
                  {rarity === 'rare' && '💙 '}
                  {rarity === 'common' && '⚪ '}
                  {RARITY_CONFIG[rarity as keyof typeof RARITY_CONFIG].label}
                </div>
              </div>

              {/* Avatar Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {avatars.map((avatar, index) => {
                  const isSelected = selectedAvatar === avatar.id;
                  
                  return (
                    <button
                      key={avatar.id}
                      onClick={() => handleSelectAvatar(avatar)}
                      className={cn(
                        "relative p-4 rounded-2xl border-3 transition-all duration-200",
                        "active:scale-95 focus:outline-none focus:ring-4 focus:ring-primary/30",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-lg shadow-primary/20 scale-105"
                          : cn(
                              "border-border/50 hover:border-primary/50 hover:shadow-md",
                              avatar.bgColor
                            )
                      )}
                      style={{
                        animationDelay: `${200 + groupIndex * 100 + index * 50}ms`,
                      }}
                    >
                      {/* Selected checkmark */}
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-lg z-10">
                          <Check className="h-4 w-4 text-primary-foreground" strokeWidth={3} />
                        </div>
                      )}

                      {/* Legendary shimmer effect */}
                      {avatar.rarity === 'legendary' && isSelected && (
                        <div className="absolute inset-0 rounded-2xl overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-300/30 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                        </div>
                      )}

                      {/* Avatar Emoji - katta va ko'rinadigan */}
                      <div className={cn(
                        "text-5xl mb-2 transition-transform duration-200",
                        isSelected && "scale-110"
                      )}>
                        {avatar.emoji}
                      </div>

                      {/* Name */}
                      <div className={cn(
                        "font-bold text-sm",
                        isSelected ? "text-primary" : "text-foreground"
                      )}>
                        {avatar.name}
                      </div>

                      {/* Description - only on selected */}
                      {isSelected && (
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {avatar.description}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Selected Avatar Preview */}
          {selectedAvatarData && (
            <Card 
              className="overflow-hidden border-2 border-primary/30 animate-scale-in"
            >
              <div className={cn(
                "p-5 bg-gradient-to-br text-white",
                selectedAvatarData.gradient
              )}>
                <div className="flex items-center gap-4">
                  {/* Big emoji */}
                  <div className="text-6xl bg-white/20 rounded-2xl p-3">
                    {selectedAvatarData.emoji}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-bold",
                        "bg-white/20"
                      )}>
                        {RARITY_CONFIG[selectedAvatarData.rarity].label}
                      </span>
                    </div>
                    <div className="text-2xl font-black flex items-center gap-2">
                      {username || 'Ismingiz'}
                      {selectedAvatarData.rarity === 'legendary' && (
                        <span>👑</span>
                      )}
                    </div>
                    <div className="text-sm opacity-90">
                      {selectedAvatarData.name} - {selectedAvatarData.description}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Save Button - katta va chiroyli */}
          <Button
            onClick={handleSave}
            disabled={isLoading || !username.trim()}
            size="lg"
            className={cn(
              "w-full h-16 text-xl font-bold rounded-2xl",
              "bg-gradient-to-r from-primary via-purple-600 to-pink-600",
              "hover:opacity-90 transition-all",
              "shadow-lg shadow-primary/30",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saqlanmoqda...</span>
              </div>
            ) : (
              <span className="flex items-center gap-2">
                <span className="text-2xl">🚀</span>
                Boshlash!
              </span>
            )}
          </Button>
          
          {/* Tip for kids */}
          <p className="text-center text-sm text-muted-foreground animate-fade-in">
            💡 Keyinroq sozlamalardan o'zgartirish mumkin
          </p>
        </div>
      </div>
      
      {/* Shimmer animation keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </PageBackground>
  );
};

export default AvatarSelect;
