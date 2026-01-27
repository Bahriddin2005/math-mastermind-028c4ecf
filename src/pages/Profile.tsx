import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageBackground } from '@/components/layout/PageBackground';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Mascot } from '@/components/Mascot';
import { GameCard } from '@/components/kids/GameCard';
import { ProgressRing } from '@/components/kids/ProgressRing';
import { StarBadge } from '@/components/kids/StarBadge';
import { useConfettiEffect } from '@/components/kids/Confetti';
import { AvatarCropDialog } from '@/components/AvatarCropDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSound } from '@/hooks/useSound';
import { toast } from 'sonner';
import { formatPhoneNumber, unformatPhoneNumber } from '@/lib/phoneFormatter';
import {
  ArrowLeft,
  Camera,
  Save,
  Loader2,
  Trophy,
  Target,
  Flame,
  Star,
  Zap,
  Crown,
  Award,
  Sparkles,
  Medal,
  Gift,
  Settings,
  Edit3,
  Check,
  LogOut,
  Phone,
} from 'lucide-react';

// Predefined avatar options for kids
const AVATAR_OPTIONS = [
  '🦁', '🐻', '🐼', '🐨', '🐯', '🦊', '🐰', '🐱',
  '🐶', '🦄', '🐲', '🦋', '🐸', '🐵', '🐷', '🦉',
];

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { soundEnabled, toggleSound } = useSound();
  const { triggerConfetti } = useConfettiEffect();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  
  // Crop dialog state
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Profile stats
  const [stats, setStats] = useState({
    totalProblems: 0,
    bestStreak: 0,
    totalScore: 0,
    totalGames: 0,
    level: 1,
    xp: 0,
    coins: 0,
    energy: 100,
  });

  // Badges
  const [badges, setBadges] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileData) {
      setUsername(profileData.username || '');
      setAvatarUrl(profileData.avatar_url);
      // Format phone number for display
      if (profileData.phone_number) {
        setPhoneNumber(formatPhoneNumber(profileData.phone_number));
      }
      setStats(prev => ({
        ...prev,
        totalProblems: profileData.total_problems_solved || 0,
        bestStreak: profileData.best_streak || 0,
        totalScore: profileData.total_score || 0,
      }));
    }

    // Fetch gamification data
    const { data: gamificationData } = await supabase
      .from('user_gamification')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (gamificationData) {
      setStats(prev => ({
        ...prev,
        level: gamificationData.level || 1,
        xp: gamificationData.total_xp || 0,
        energy: gamificationData.energy || 100,
      }));
    }

    // Fetch coins
    const { data: currencyData } = await supabase
      .from('user_game_currency')
      .select('coins')
      .eq('user_id', user.id)
      .maybeSingle();

    if (currencyData) {
      setStats(prev => ({
        ...prev,
        coins: currencyData.coins || 0,
      }));
    }

    // Fetch badges
    const { data: badgesData } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false })
      .limit(12);

    if (badgesData) {
      setBadges(badgesData);
    }

    // Fetch game count
    const { count } = await supabase
      .from('game_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (count) {
      setStats(prev => ({ ...prev, totalGames: count }));
    }

    setLoading(false);
  };

  const handleEmojiSelect = async (emoji: string) => {
    if (!user) return;
    setSelectedEmoji(emoji);
    
    // We'll use data URL for emoji avatar
    const emojiUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(emoji)}`;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', user.id);
      
      if (error) throw error;
      setAvatarUrl(null);
      toast.success('Avatar tanlandi!');
      triggerConfetti('success');
    } catch (error: any) {
      toast.error('Xatolik: ' + error.message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Rasm hajmi 2MB dan oshmasligi kerak");
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      toast.error("Faqat JPG, PNG, GIF yoki WebP formatlar qo'llab-quvvatlanadi");
      return;
    }

    setSelectedFile(file);
    setCropDialogOpen(true);
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user) return;
    
    setUploading(true);
    try {
      const fileName = `${user.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedBlob, { 
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl + '?t=' + Date.now());
      setSelectedEmoji(null);
      toast.success('Avatar yangilandi!');
      triggerConfetti('stars');
    } catch (error: any) {
      toast.error('Avatar yuklanmadi: ' + error.message);
    } finally {
      setUploading(false);
      setSelectedFile(null);
    }
  };

  const handleSaveName = async () => {
    if (!user || !username.trim()) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.trim() })
        .eq('user_id', user.id);

      if (error) throw error;
      setEditingName(false);
      toast.success('Ism yangilandi!');
    } catch (error: any) {
      toast.error('Xatolik: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePhone = async () => {
    if (!user) return;
    
    setSavingPhone(true);
    try {
      const cleanPhone = phoneNumber ? unformatPhoneNumber(phoneNumber) : null;
      const { error } = await supabase
        .from('profiles')
        .update({ phone_number: cleanPhone })
        .eq('user_id', user.id);

      if (error) throw error;
      setEditingPhone(false);
      toast.success('Telefon raqami yangilandi!');
    } catch (error: any) {
      toast.error('Xatolik: ' + error.message);
    } finally {
      setSavingPhone(false);
    }
  };

  const xpProgress = (stats.xp % 1000) / 10;
  const xpToNextLevel = 1000 - (stats.xp % 1000);

  if (loading) {
    return (
      <PageBackground className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Mascot mood="thinking" size="lg" animate />
          <p className="text-lg font-bold text-kids-purple animate-pulse">Yuklanmoqda...</p>
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground className="min-h-screen pb-24">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <div className="container px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Orqaga
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/settings')}
              className="gap-1.5"
            >
              <Settings className="h-4 w-4" />
              Sozlamalar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await signOut();
                navigate('/');
                toast.success('Tizimdan chiqdingiz');
              }}
              className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Chiqish
            </Button>
          </div>
        </div>

        {/* Profile Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-kids-purple via-kids-pink to-kids-blue p-6 mb-6">
          {/* Decorative elements */}
          <div className="absolute top-4 right-4 text-4xl animate-bounce-soft">⭐</div>
          <div className="absolute bottom-4 left-4 text-3xl animate-bounce-soft" style={{ animationDelay: '0.3s' }}>🎮</div>
          
          <div className="relative flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar Section */}
            <div className="relative">
              <div className="p-1 rounded-full bg-white/20 shadow-2xl">
                <Avatar className="h-28 w-28 sm:h-36 sm:w-36 border-4 border-white/30">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-kids-yellow to-kids-orange text-4xl sm:text-5xl">
                    {selectedEmoji || username.charAt(0).toUpperCase() || '🦊'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-white text-kids-purple shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
              >
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Name & Level */}
            <div className="flex-1 text-center sm:text-left text-white">
              {editingName ? (
                <div className="flex items-center gap-2 mb-2">
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/50 text-xl font-bold"
                    placeholder="Ismingiz"
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveName}
                    disabled={saving}
                    className="bg-white text-kids-purple hover:bg-white/90"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-display font-black">{username || "O'yinchi"}</h1>
                  <button 
                    onClick={() => setEditingName(true)}
                    className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Phone Number */}
              {editingPhone ? (
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                    <Input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/50 pl-10"
                      placeholder="+998 90 123 45 67"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={handleSavePhone}
                    disabled={savingPhone}
                    className="bg-white text-kids-purple hover:bg-white/90"
                  >
                    {savingPhone ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
                  <Phone className="h-4 w-4 text-white/70" />
                  <span className="text-white/80 text-sm">{phoneNumber || "Telefon qo'shilmagan"}</span>
                  <button 
                    onClick={() => setEditingPhone(true)}
                    className="p-1 rounded-full hover:bg-white/20 transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <Badge className="bg-white/20 text-white border-0 gap-1.5 px-3 py-1.5">
                  <Crown className="h-4 w-4 text-kids-yellow" />
                  Level {stats.level}
                </Badge>
                <Badge className="bg-white/20 text-white border-0 gap-1.5 px-3 py-1.5">
                  <Zap className="h-4 w-4 text-kids-yellow" />
                  {stats.xp.toLocaleString()} XP
                </Badge>
                <Badge className="bg-white/20 text-white border-0 gap-1.5 px-3 py-1.5">
                  <Gift className="h-4 w-4 text-kids-yellow" />
                  {stats.coins.toLocaleString()} coin
                </Badge>
              </div>

              {/* XP Progress */}
              <div className="mt-4 max-w-xs mx-auto sm:mx-0">
                <div className="flex justify-between text-xs text-white/80 mb-1">
                  <span>Keyingi levelga</span>
                  <span>{xpToNextLevel} XP qoldi</span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-kids-yellow to-kids-orange rounded-full transition-all duration-500"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Emoji Avatar Picker */}
        <Card className="mb-6 border-2 border-kids-purple/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="text-2xl">🎭</span>
              Avatar tanlang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-8 gap-2">
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiSelect(emoji)}
                  className={`text-3xl p-2 rounded-xl hover:bg-kids-purple/10 hover:scale-110 transition-all ${
                    selectedEmoji === emoji ? 'bg-kids-purple/20 ring-2 ring-kids-purple' : ''
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-kids-blue/10 to-kids-blue/5 border-kids-blue/20">
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 text-kids-blue mx-auto mb-2" />
              <p className="text-2xl font-bold text-kids-blue">{stats.totalProblems}</p>
              <p className="text-xs text-muted-foreground">Yechilgan</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-kids-orange/10 to-kids-orange/5 border-kids-orange/20">
            <CardContent className="p-4 text-center">
              <Flame className="h-8 w-8 text-kids-orange mx-auto mb-2" />
              <p className="text-2xl font-bold text-kids-orange">{stats.bestStreak}</p>
              <p className="text-xs text-muted-foreground">Eng yaxshi</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-kids-yellow/10 to-kids-yellow/5 border-kids-yellow/20">
            <CardContent className="p-4 text-center">
              <Star className="h-8 w-8 text-kids-yellow mx-auto mb-2" />
              <p className="text-2xl font-bold text-kids-yellow">{stats.totalScore.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Ball</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-kids-green/10 to-kids-green/5 border-kids-green/20">
            <CardContent className="p-4 text-center">
              <Trophy className="h-8 w-8 text-kids-green mx-auto mb-2" />
              <p className="text-2xl font-bold text-kids-green">{stats.totalGames}</p>
              <p className="text-xs text-muted-foreground">O'yinlar</p>
            </CardContent>
          </Card>
        </div>

        {/* Badges Collection */}
        <Card className="mb-6 border-2 border-kids-yellow/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <span className="text-2xl">🏅</span>
                Medallarim
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/badges')}>
                Barchasini ko'rish →
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {badges.length === 0 ? (
              <div className="text-center py-8">
                <Mascot mood="thinking" size="md" message="Hali medallar yo'q. O'ynab, medallar yutib oling!" />
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    className="flex flex-col items-center p-3 rounded-2xl bg-gradient-to-br from-kids-yellow/10 to-kids-orange/10 border border-kids-yellow/20 hover:scale-105 transition-transform"
                  >
                    <span className="text-3xl mb-1">{badge.badge_icon}</span>
                    <p className="text-xs font-medium text-center">{badge.badge_name}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <GameCard
            title="O'yna"
            icon={Zap}
            color="purple"
            onClick={() => navigate('/mental-arithmetic')}
            size="sm"
          />
          <GameCard
            title="Kurslar"
            icon={Award}
            color="green"
            onClick={() => navigate('/courses')}
            size="sm"
          />
          <GameCard
            title="Reyting"
            icon={Trophy}
            color="yellow"
            onClick={() => navigate('/dashboard')}
            size="sm"
          />
          <GameCard
            title="Yutuqlar"
            icon={Sparkles}
            color="pink"
            onClick={() => navigate('/achievements')}
            size="sm"
          />
        </div>
      </div>

      {/* Crop Dialog */}
      <AvatarCropDialog
        open={cropDialogOpen}
        onOpenChange={setCropDialogOpen}
        imageFile={selectedFile}
        onCropComplete={handleCropComplete}
      />
    </PageBackground>
  );
};

export default Profile;
