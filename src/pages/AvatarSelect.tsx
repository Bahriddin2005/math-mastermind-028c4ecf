import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Crown, Sparkles, Wand2, Bot, Zap, Shield, Rocket, Star, Sword, Brain, Flame, Ghost, Heart, Diamond, Moon, Sun, Gamepad2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PageBackground } from '@/components/layout/PageBackground';
import confetti from 'canvas-confetti';
import { useSound } from '@/hooks/useSound';

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

  const handleSelectAvatar = (avatar: AvatarOption) => {
    setSelectedAvatar(avatar.id);
    playSound?.('correct');
    
    // Confetti based on rarity
    const particleCount = avatar.rarity === 'legendary' ? 80 : 
                          avatar.rarity === 'epic' ? 50 : 
                          avatar.rarity === 'rare' ? 35 : 20;
    
    const colors = avatar.rarity === 'legendary' ? ['#FFD700', '#FFA500', '#FF69B4', '#00CED1'] :
                   avatar.rarity === 'epic' ? ['#9B59B6', '#8E44AD', '#E74C3C'] :
                   avatar.rarity === 'rare' ? ['#3498DB', '#2980B9', '#1ABC9C'] :
                   ['#95A5A6', '#7F8C8D', '#BDC3C7'];
    
    confetti({
      particleCount,
      spread: 60,
      origin: { y: 0.7 },
      colors,
    });
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
