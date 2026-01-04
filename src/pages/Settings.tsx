import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageBackground } from '@/components/layout/PageBackground';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Achievements } from '@/components/Achievements';
import { DailyRemindersSettings } from '@/components/DailyRemindersSettings';
import { NotificationSettings } from '@/components/NotificationSettings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarCropDialog } from '@/components/AvatarCropDialog';
import { UserChatHistory } from '@/components/UserChatHistory';
import { useSound } from '@/hooks/useSound';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  ArrowLeft,
  User,
  Camera,
  Save,
  Loader2,
  Crop,
  Settings as SettingsIcon,
  Trophy,
  Target,
  Flame,
  Star,
  MessageCircle,
  Shield,
  Mail,
  Calendar,
  Sun,
  Moon,
  Palette,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useTheme } from 'next-themes';

const usernameSchema = z.string()
  .min(2, "Ism kamida 2 ta belgi bo'lishi kerak")
  .max(30, "Ism 30 ta belgidan oshmasligi kerak")
  .regex(/^[a-zA-Z0-9_\s]+$/, 'Faqat harflar, raqamlar va _ ishlatish mumkin');

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { soundEnabled, toggleSound } = useSound();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [dailyGoal, setDailyGoal] = useState(20);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  
  // Profile stats for achievements
  const [profileStats, setProfileStats] = useState({
    totalProblems: 0,
    bestStreak: 0,
    totalScore: 0,
    totalGames: 0,
  });
  
  // Crop dialog state
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Voice settings
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    const saved = localStorage.getItem('numberTrainer_voiceEnabled');
    return saved !== null ? saved === 'true' : true;
  });

  // TTS provider settings: 'browser' or 'elevenlabs'
  const [ttsProvider, setTtsProvider] = useState<'browser' | 'elevenlabs'>(() => {
    const saved = localStorage.getItem('ttsProvider');
    return saved === 'elevenlabs' ? 'elevenlabs' : 'browser';
  });

  const toggleVoice = () => {
    const newValue = !voiceEnabled;
    setVoiceEnabled(newValue);
    localStorage.setItem('numberTrainer_voiceEnabled', String(newValue));
    localStorage.setItem('flashCard_voiceEnabled', String(newValue));
    toast.success(newValue ? "Ovoz yoqildi" : "Ovoz o'chirildi");
  };

  const handleTtsProviderChange = (provider: 'browser' | 'elevenlabs') => {
    setTtsProvider(provider);
    localStorage.setItem('ttsProvider', provider);
    toast.success(
      provider === 'elevenlabs'
        ? "ElevenLabs professional ovozi tanlandi"
        : "Brauzer ovozi tanlandi"
    );
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_url, total_problems_solved, best_streak, total_score, created_at, daily_goal')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setUsername(data.username || '');
        setAvatarUrl(data.avatar_url);
        setCreatedAt(data.created_at);
        setDailyGoal(data.daily_goal || 20);
        setProfileStats({
          totalProblems: data.total_problems_solved || 0,
          bestStreak: data.best_streak || 0,
          totalScore: data.total_score || 0,
          totalGames: 0,
        });
      }
      
      // Fetch game sessions count
      const { count } = await supabase
        .from('game_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (count) {
        setProfileStats(prev => ({ ...prev, totalGames: count }));
      }
      
      setLoading(false);
    };

    fetchProfile();
  }, [user, navigate]);

  // Update preview URL when file is selected
  useEffect(() => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  }, [selectedFile]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Rasm hajmi 2MB dan oshmasligi kerak");
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      toast.error("Faqat JPG, PNG, GIF yoki WebP formatlar qo'llab-quvvatlanadi");
      return;
    }

    // Open crop dialog
    setSelectedFile(file);
    setCropDialogOpen(true);
    
    // Reset input
    e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user) {
      toast.error('Iltimos, avval tizimga kiring');
      return;
    }
    
    setUploading(true);
    console.log('Starting avatar upload for user:', user.id);
    console.log('Blob size:', croppedBlob.size);

    try {
      const fileName = `${user.id}/avatar.jpg`;
      console.log('Uploading to path:', fileName);

      // Upload cropped image to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedBlob, { 
          upsert: true,
          contentType: 'image/jpeg'
        });

      console.log('Upload response:', { uploadData, uploadError });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log('Public URL:', publicUrl);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }

      setAvatarUrl(publicUrl + '?t=' + Date.now()); // Add cache buster
      toast.success('Avatar yangilandi!');
    } catch (error: any) {
      console.error('Full error:', error);
      toast.error('Avatar yuklanmadi: ' + (error.message || 'Noma\'lum xato'));
    } finally {
      setUploading(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate username
    const result = usernameSchema.safeParse(username.trim());
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.trim() })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Profil yangilandi!');
    } catch (error: any) {
      toast.error('Xatolik yuz berdi: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDailyGoal = async () => {
    if (!user) return;
    
    setSavingGoal(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ daily_goal: dailyGoal })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Kunlik maqsad yangilandi!');
    } catch (error: any) {
      toast.error('Xatolik yuz berdi: ' + error.message);
    } finally {
      setSavingGoal(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <PageBackground className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border-4 border-primary/20 dark:border-primary/40 border-t-primary animate-spin" />
            <SettingsIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground dark:text-muted-foreground/80 text-sm">Yuklanmoqda...</p>
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground className="flex flex-col min-h-screen">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <main className="flex-1 container px-3 sm:px-4 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {/* Header Section - Dark mode enhanced */}
          <div className="flex items-center justify-between gap-3 opacity-0 animate-slide-up" style={{ animationFillMode: 'forwards' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-1.5 text-muted-foreground hover:text-foreground dark:hover:bg-secondary/50"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Orqaga</span>
            </Button>
            
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md dark:shadow-lg dark:shadow-primary/20">
                <SettingsIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-display font-bold text-foreground dark:text-foreground/95">Sozlamalar</h1>
              </div>
            </div>
            
            <div className="w-[60px] sm:w-[80px]" /> {/* Spacer for centering */}
          </div>

          {/* Profile Hero Card - Dark mode enhanced */}
          <Card className="overflow-hidden border-0 shadow-xl dark:shadow-2xl dark:shadow-primary/10 opacity-0 animate-slide-up bg-card dark:bg-card/90 backdrop-blur-sm" style={{ animationDelay: '50ms', animationFillMode: 'forwards' }}>
            {/* Gradient Header */}
            <div className="h-24 sm:h-32 bg-gradient-to-r from-primary via-primary/90 to-accent dark:from-primary/90 dark:via-primary/70 dark:to-accent/80 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJjMCAwLTIgMi0yIDRzMiA0IDIgNCAyLTIgNC0yYzAtMi0yLTQtMi00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30 dark:opacity-15" />
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex gap-2">
                <div className="px-2 py-1 rounded-full bg-white/20 dark:bg-white/15 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1 shadow-sm">
                  <Shield className="h-3 w-3" />
                  <span className="hidden sm:inline">Faol</span>
                </div>
              </div>
            </div>
            
            <CardContent className="relative pt-0 pb-4 sm:pb-6 bg-card dark:bg-card/50">
              {/* Avatar - Positioned to overlap header */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 -mt-12 sm:-mt-14">
                <div className="relative group self-center sm:self-auto">
                  <div className="p-1 rounded-full bg-background dark:bg-card shadow-xl dark:shadow-2xl dark:shadow-primary/10">
                    <Avatar className="h-20 w-20 sm:h-24 md:h-28 sm:w-24 md:w-28 border-4 border-background dark:border-card/80">
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 dark:from-primary/35 dark:to-accent/30 text-primary text-xl sm:text-2xl md:text-3xl font-display">
                        {username.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <button
                    onClick={handleAvatarClick}
                    disabled={uploading}
                    className="absolute bottom-0.5 right-0.5 sm:bottom-1 sm:right-1 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-primary text-primary-foreground shadow-lg dark:shadow-primary/30 flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors"
                  >
                    {uploading ? (
                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                    ) : (
                      <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                
                <div className="flex-1 text-center sm:text-left pb-2">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-foreground dark:text-foreground/95">
                    {username || 'Foydalanuvchi'}
                  </h2>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mt-1 text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground/80">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      <span className="truncate max-w-[160px] sm:max-w-[180px] md:max-w-none">{user?.email}</span>
                    </span>
                    {createdAt && (
                      <span className="hidden sm:flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(createdAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Quick Stats - Dark mode enhanced */}
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2 md:gap-4 mt-3 sm:mt-4 md:mt-6">
                <div className="text-center p-1.5 sm:p-2 md:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 dark:from-blue-500/25 dark:to-blue-500/10 border border-blue-500/20 dark:border-blue-500/35">
                  <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-500 mx-auto mb-0.5 sm:mb-1" />
                  <p className="text-sm sm:text-lg md:text-xl font-bold text-foreground dark:text-foreground/95">{profileStats.totalProblems}</p>
                  <p className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground dark:text-muted-foreground/80">Yechilgan</p>
                </div>
                <div className="text-center p-1.5 sm:p-2 md:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 dark:from-orange-500/25 dark:to-orange-500/10 border border-orange-500/20 dark:border-orange-500/35">
                  <Flame className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-orange-500 mx-auto mb-0.5 sm:mb-1" />
                  <p className="text-sm sm:text-lg md:text-xl font-bold text-foreground dark:text-foreground/95">{profileStats.bestStreak}</p>
                  <p className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground dark:text-muted-foreground/80">Eng yaxshi</p>
                </div>
                <div className="text-center p-1.5 sm:p-2 md:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 dark:from-yellow-500/25 dark:to-yellow-500/10 border border-yellow-500/20 dark:border-yellow-500/35">
                  <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-yellow-500 mx-auto mb-0.5 sm:mb-1" />
                  <p className="text-sm sm:text-lg md:text-xl font-bold text-foreground dark:text-foreground/95">{profileStats.totalScore}</p>
                  <p className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground dark:text-muted-foreground/80">Ball</p>
                </div>
                <div className="text-center p-1.5 sm:p-2 md:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 dark:from-purple-500/25 dark:to-purple-500/10 border border-purple-500/20 dark:border-purple-500/35">
                  <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-purple-500 mx-auto mb-0.5 sm:mb-1" />
                  <p className="text-sm sm:text-lg md:text-xl font-bold text-foreground dark:text-foreground/95">{profileStats.totalGames}</p>
                  <p className="text-[8px] sm:text-[10px] md:text-xs text-muted-foreground dark:text-muted-foreground/80">O'yin</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings Cards Grid - Dark mode enhanced */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            {/* Username Section */}
            <Card className="opacity-0 animate-slide-up overflow-hidden bg-card dark:bg-card/90 border-border/40 dark:border-border/20 backdrop-blur-sm" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
              <CardHeader className="pb-2 sm:pb-3 bg-gradient-to-r from-accent/10 to-transparent dark:from-accent/20 dark:to-transparent px-4 sm:px-6">
                <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2 text-foreground dark:text-foreground/95">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-accent/20 dark:bg-accent/35 flex items-center justify-center">
                    <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
                  </div>
                  Foydalanuvchi nomi
                </CardTitle>
                <CardDescription className="text-[10px] sm:text-xs md:text-sm text-muted-foreground dark:text-muted-foreground/80">
                  Reytingda ko'rinadigan ismingiz
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 px-4 sm:px-6">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="username" className="text-xs sm:text-sm text-foreground dark:text-foreground/90">Ism</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ismingizni kiriting"
                    maxLength={30}
                    className="h-9 sm:h-10 md:h-11 text-sm sm:text-base bg-secondary/30 dark:bg-secondary/20 border-border/40 dark:border-border/20 text-foreground dark:text-foreground/95 placeholder:text-muted-foreground dark:placeholder:text-muted-foreground/60"
                  />
                  <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground dark:text-muted-foreground/70">
                    2-30 ta belgi, faqat harflar, raqamlar va _ ishlatish mumkin
                  </p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto gap-2 h-9 sm:h-10 text-sm shadow-md dark:shadow-lg dark:shadow-primary/10">
                  {saving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                      Saqlanmoqda...
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Saqlash
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Avatar Upload Section - Dark mode enhanced */}
            <Card className="opacity-0 animate-slide-up overflow-hidden bg-card dark:bg-card/90 border-border/40 dark:border-border/20 backdrop-blur-sm" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
              <CardHeader className="pb-2 sm:pb-3 bg-gradient-to-r from-primary/10 to-transparent dark:from-primary/20 dark:to-transparent px-4 sm:px-6">
                <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2 text-foreground dark:text-foreground/95">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-primary/20 dark:bg-primary/35 flex items-center justify-center">
                    <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  </div>
                  Profil rasmi
                </CardTitle>
                <CardDescription className="text-[10px] sm:text-xs md:text-sm text-muted-foreground dark:text-muted-foreground/80">
                  Profilingiz uchun rasm tanlang (max 2MB)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3 sm:pt-4 px-4 sm:px-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="relative group flex-shrink-0">
                    <Avatar className="h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20 border-2 border-primary/20 dark:border-primary/35">
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/25 dark:to-accent/20 text-primary text-base sm:text-lg font-display">
                        {username.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={handleAvatarClick}
                      disabled={uploading}
                      className="absolute inset-0 rounded-full bg-foreground/50 dark:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-background dark:text-white animate-spin" />
                      ) : (
                        <Crop className="h-4 w-4 sm:h-5 sm:w-5 text-background dark:text-white" />
                      )}
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground/80 mb-2 sm:mb-3 line-clamp-2">
                      Rasmni yuklang va avtomatik kesish oynasidan foydalaning
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAvatarClick}
                      disabled={uploading}
                      className="gap-1.5 sm:gap-2 h-8 sm:h-9 text-xs sm:text-sm border-border/40 dark:border-border/20 hover:bg-secondary/50 dark:hover:bg-secondary/30"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                          <span className="hidden xs:inline">Yuklanmoqda...</span>
                          <span className="xs:hidden">...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          Rasm yuklash
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Daily Goal Section */}
            <Card className="opacity-0 animate-slide-up overflow-hidden bg-card dark:bg-card/90 border-border/40 dark:border-border/20 backdrop-blur-sm" style={{ animationDelay: '175ms', animationFillMode: 'forwards' }}>
              <CardHeader className="pb-2 sm:pb-3 bg-gradient-to-r from-green-500/10 to-transparent dark:from-green-500/20 dark:to-transparent px-4 sm:px-6">
                <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2 text-foreground dark:text-foreground/95">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-green-500/20 dark:bg-green-500/35 flex items-center justify-center">
                    <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                  </div>
                  Kunlik maqsad
                </CardTitle>
                <CardDescription className="text-[10px] sm:text-xs md:text-sm text-muted-foreground dark:text-muted-foreground/80">
                  Kunlik yechish kerak bo'lgan masalalar soni
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 px-4 sm:px-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dailyGoal" className="text-xs sm:text-sm text-foreground dark:text-foreground/90">
                      Masalalar soni
                    </Label>
                    <span className="text-lg sm:text-xl font-bold text-green-500">{dailyGoal}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDailyGoal(Math.max(5, dailyGoal - 5))}
                      disabled={dailyGoal <= 5}
                      className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                    >
                      -5
                    </Button>
                    <input
                      type="range"
                      id="dailyGoal"
                      min={5}
                      max={100}
                      step={5}
                      value={dailyGoal}
                      onChange={(e) => setDailyGoal(Number(e.target.value))}
                      className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-green-500"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDailyGoal(Math.min(100, dailyGoal + 5))}
                      disabled={dailyGoal >= 100}
                      className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                    >
                      +5
                    </Button>
                  </div>
                  
                  <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
                    <span>Min: 5</span>
                    <span>Tavsiya: 20-30</span>
                    <span>Max: 100</span>
                  </div>
                </div>
                
                <Button 
                  onClick={handleSaveDailyGoal} 
                  disabled={savingGoal} 
                  className="w-full sm:w-auto gap-2 h-9 sm:h-10 text-sm shadow-md dark:shadow-lg dark:shadow-green-500/10 bg-green-500 hover:bg-green-600"
                >
                  {savingGoal ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                      Saqlanmoqda...
                    </>
                  ) : (
                    <>
                      <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Maqsadni saqlash
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Theme Section - Dark mode enhanced */}
            <Card className="opacity-0 animate-slide-up overflow-hidden bg-card dark:bg-card/90 border-border/40 dark:border-border/20 backdrop-blur-sm" style={{ animationDelay: '175ms', animationFillMode: 'forwards' }}>
              <CardHeader className="pb-2 sm:pb-3 bg-gradient-to-r from-yellow-500/10 to-transparent dark:from-yellow-500/20 dark:to-transparent px-4 sm:px-6">
                <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2 text-foreground dark:text-foreground/95">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-yellow-500/20 dark:bg-yellow-500/35 flex items-center justify-center">
                    <Palette className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500" />
                  </div>
                  Mavzu sozlamalari
                </CardTitle>
                <CardDescription className="text-[10px] sm:text-xs md:text-sm text-muted-foreground dark:text-muted-foreground/80">
                  Ilova ko'rinishini sozlang
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3 sm:pt-4 px-4 sm:px-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-secondary/50 dark:bg-secondary/20 border border-border/50 dark:border-border/20">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {mounted && theme === 'dark' ? (
                        <Moon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                      ) : (
                        <Sun className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                      )}
                      <div>
                        <p className="font-medium text-xs sm:text-sm text-foreground dark:text-foreground/95">Rejim</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground dark:text-muted-foreground/80">
                          {mounted ? (theme === 'dark' ? "Qorong'u rejim" : "Yorug' rejim") : "Yuklanmoqda..."}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 sm:gap-1 p-0.5 sm:p-1 rounded-md sm:rounded-lg bg-background dark:bg-secondary/30 border border-border/50 dark:border-border/20">
                      <button
                        onClick={() => setTheme('light')}
                        className={`p-1.5 sm:p-2 rounded-md transition-all ${
                          mounted && theme === 'light' 
                            ? 'bg-primary text-primary-foreground shadow-sm dark:shadow-md' 
                            : 'hover:bg-secondary dark:hover:bg-secondary/50 text-muted-foreground'
                        }`}
                        aria-label="Yorug' rejim"
                      >
                        <Sun className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                      <button
                        onClick={() => setTheme('dark')}
                        className={`p-1.5 sm:p-2 rounded-md transition-all ${
                          mounted && theme === 'dark' 
                            ? 'bg-primary text-primary-foreground shadow-sm dark:shadow-md' 
                            : 'hover:bg-secondary dark:hover:bg-secondary/50 text-muted-foreground'
                        }`}
                        aria-label="Qorong'u rejim"
                      >
                        <Moon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-[10px] sm:text-xs text-muted-foreground dark:text-muted-foreground/70">
                    Rejimni o'zgartirish orqali ilovaning umumiy ko'rinishini o'zgartiring
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Voice Settings Section */}
            <Card className="opacity-0 animate-slide-up overflow-hidden bg-card dark:bg-card/90 border-border/40 dark:border-border/20 backdrop-blur-sm" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
              <CardHeader className="pb-2 sm:pb-3 bg-gradient-to-r from-green-500/10 to-transparent dark:from-green-500/20 dark:to-transparent px-4 sm:px-6">
                <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2 text-foreground dark:text-foreground/95">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-green-500/20 dark:bg-green-500/35 flex items-center justify-center">
                    <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                  </div>
                  Ovoz sozlamalari
                </CardTitle>
                <CardDescription className="text-[10px] sm:text-xs md:text-sm text-muted-foreground dark:text-muted-foreground/80">
                  Mashq paytida ovozli o'qishni sozlang
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3 sm:pt-4 px-4 sm:px-6">
                <div className="space-y-3 sm:space-y-4">
                  {/* Voice on/off toggle */}
                  <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-secondary/50 dark:bg-secondary/20 border border-border/50 dark:border-border/20">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {voiceEnabled ? (
                        <Volume2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                      ) : (
                        <VolumeX className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium text-xs sm:text-sm text-foreground dark:text-foreground/95">
                          Ovozli o'qish
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground dark:text-muted-foreground/80">
                          {voiceEnabled ? "Sonlar ovozda o'qiladi" : "Ovoz o'chirilgan"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={toggleVoice}
                      className={`relative w-11 h-6 sm:w-12 sm:h-7 rounded-full transition-all duration-300 ${
                        voiceEnabled 
                          ? 'bg-green-500 shadow-md shadow-green-500/30' 
                          : 'bg-muted dark:bg-secondary/50'
                      }`}
                      aria-label={voiceEnabled ? "Ovozni o'chirish" : "Ovozni yoqish"}
                    >
                      <span 
                        className={`absolute top-0.5 left-0.5 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                          voiceEnabled ? 'translate-x-5 sm:translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* TTS Provider selection */}
                  {voiceEnabled && (
                    <div className="p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-secondary/50 dark:bg-secondary/20 border border-border/50 dark:border-border/20 space-y-2">
                      <p className="font-medium text-xs sm:text-sm text-foreground dark:text-foreground/95 mb-2">
                        TTS provider
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleTtsProviderChange('browser')}
                          className={`p-2 sm:p-3 rounded-lg text-center transition-all ${
                            ttsProvider === 'browser'
                              ? 'bg-primary text-primary-foreground shadow-md'
                              : 'bg-background dark:bg-secondary/30 hover:bg-muted text-foreground border border-border/50'
                          }`}
                        >
                          <p className="font-medium text-xs sm:text-sm">Brauzer</p>
                          <p className="text-[9px] sm:text-[10px] opacity-80">Bepul, tez</p>
                        </button>
                        <button
                          onClick={() => handleTtsProviderChange('elevenlabs')}
                          className={`p-2 sm:p-3 rounded-lg text-center transition-all ${
                            ttsProvider === 'elevenlabs'
                              ? 'bg-primary text-primary-foreground shadow-md'
                              : 'bg-background dark:bg-secondary/30 hover:bg-muted text-foreground border border-border/50'
                          }`}
                        >
                          <p className="font-medium text-xs sm:text-sm">ElevenLabs</p>
                          <p className="text-[9px] sm:text-[10px] opacity-80">Professional AI</p>
                        </button>
                      </div>
                      {ttsProvider === 'elevenlabs' && (
                        <p className="text-[9px] sm:text-[10px] text-amber-500 dark:text-amber-400 mt-1">
                          ⚠️ ElevenLabs API key text_to_speech ruxsatiga ega bo'lishi kerak
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Sound effects toggle */}
                  <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-secondary/50 dark:bg-secondary/20 border border-border/50 dark:border-border/20">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {soundEnabled ? (
                        <Volume2 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                      ) : (
                        <VolumeX className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium text-xs sm:text-sm text-foreground dark:text-foreground/95">
                          Effekt ovozlari
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground dark:text-muted-foreground/80">
                          {soundEnabled ? "To'g'ri/noto'g'ri javob ovozlari" : "Effektlar o'chirilgan"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={toggleSound}
                      className={`relative w-11 h-6 sm:w-12 sm:h-7 rounded-full transition-all duration-300 ${
                        soundEnabled 
                          ? 'bg-blue-500 shadow-md shadow-blue-500/30' 
                          : 'bg-muted dark:bg-secondary/50'
                      }`}
                      aria-label={soundEnabled ? "Effektlarni o'chirish" : "Effektlarni yoqish"}
                    >
                      <span 
                        className={`absolute top-0.5 left-0.5 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                          soundEnabled ? 'translate-x-5 sm:translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notification Settings Section */}
          <div className="opacity-0 animate-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
            <NotificationSettings />
          </div>

          {/* Daily Reminders Section */}
          <div className="opacity-0 animate-slide-up" style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}>
            <DailyRemindersSettings />
          </div>

          {/* Achievements Section */}
          <div className="opacity-0 animate-slide-up" style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}>
            <Achievements
              totalProblems={profileStats.totalProblems}
              bestStreak={profileStats.bestStreak}
              totalScore={profileStats.totalScore}
              totalGames={profileStats.totalGames}
            />
          </div>

          {/* Chat History Section */}
          <div className="opacity-0 animate-slide-up" style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}>
            <UserChatHistory />
          </div>
        </div>
      </main>

      {/* Avatar Crop Dialog */}
      <AvatarCropDialog
        open={cropDialogOpen}
        onOpenChange={setCropDialogOpen}
        imageFile={selectedFile}
        onCropComplete={handleCropComplete}
      />
    </PageBackground>
  );
};

export default Settings;
