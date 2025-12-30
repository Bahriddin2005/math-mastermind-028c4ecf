import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageBackground } from '@/components/layout/PageBackground';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { Achievements } from '@/components/Achievements';
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
  Palette
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        .select('username, avatar_url, total_problems_solved, best_streak, total_score, created_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setUsername(data.username || '');
        setAvatarUrl(data.avatar_url);
        setCreatedAt(data.created_at);
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
    if (!user) return;
    
    setUploading(true);

    try {
      const fileName = `${user.id}/avatar.jpg`;

      // Upload cropped image to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedBlob, { 
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl + '?t=' + Date.now()); // Add cache buster
      toast.success('Avatar yangilandi!');
    } catch (error: any) {
      toast.error('Avatar yuklanmadi: ' + error.message);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <SettingsIcon className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-muted-foreground text-sm">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <PageBackground className="flex flex-col">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <main className="flex-1 container px-3 sm:px-4 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {/* Header Section */}
          <div className="flex items-center justify-between gap-3 opacity-0 animate-slide-up" style={{ animationFillMode: 'forwards' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Orqaga</span>
            </Button>
            
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                <SettingsIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-display font-bold">Sozlamalar</h1>
              </div>
            </div>
            
            <div className="w-[60px] sm:w-[80px]" /> {/* Spacer for centering */}
          </div>

          {/* Profile Hero Card */}
          <Card className="overflow-hidden border-0 shadow-xl opacity-0 animate-slide-up" style={{ animationDelay: '50ms', animationFillMode: 'forwards' }}>
            {/* Gradient Header */}
            <div className="h-24 sm:h-32 bg-gradient-to-r from-primary via-primary/90 to-accent relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yIDItNCAyLTRzLTItMi00LTJjMCAwLTIgMi0yIDRzMiA0IDIgNCAyLTIgNC0yYzAtMi0yLTQtMi00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
              <div className="absolute top-4 right-4 flex gap-2">
                <div className="px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  <span className="hidden sm:inline">Faol</span>
                </div>
              </div>
            </div>
            
            <CardContent className="relative pt-0 pb-4 sm:pb-6">
              {/* Avatar - Positioned to overlap header */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 sm:-mt-14">
                <div className="relative group self-center sm:self-auto">
                  <div className="p-1 rounded-full bg-background shadow-xl">
                    <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-background">
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-primary text-2xl sm:text-3xl font-display">
                        {username.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <button
                    onClick={handleAvatarClick}
                    disabled={uploading}
                    className="absolute bottom-1 right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
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
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
                    {username || 'Foydalanuvchi'}
                  </h2>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[180px] sm:max-w-none">{user?.email}</span>
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
              
              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-2 sm:gap-4 mt-4 sm:mt-6">
                <div className="text-center p-2 sm:p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-lg sm:text-xl font-bold text-foreground">{profileStats.totalProblems}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Yechilgan</p>
                </div>
                <div className="text-center p-2 sm:p-3 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20">
                  <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 mx-auto mb-1" />
                  <p className="text-lg sm:text-xl font-bold text-foreground">{profileStats.bestStreak}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Eng yaxshi</p>
                </div>
                <div className="text-center p-2 sm:p-3 rounded-xl bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20">
                  <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 mx-auto mb-1" />
                  <p className="text-lg sm:text-xl font-bold text-foreground">{profileStats.totalScore}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Ball</p>
                </div>
                <div className="text-center p-2 sm:p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 mx-auto mb-1" />
                  <p className="text-lg sm:text-xl font-bold text-foreground">{profileStats.totalGames}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">O'yin</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Username Section */}
            <Card className="opacity-0 animate-slide-up overflow-hidden" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
              <CardHeader className="pb-3 bg-gradient-to-r from-accent/10 to-transparent">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-accent/20 flex items-center justify-center">
                    <User className="h-4 w-4 text-accent" />
                  </div>
                  Foydalanuvchi nomi
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Reytingda ko'rinadigan ismingiz
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm">Ism</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ismingizni kiriting"
                    maxLength={30}
                    className="h-10 sm:h-11"
                  />
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    2-30 ta belgi, faqat harflar, raqamlar va _ ishlatish mumkin
                  </p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto gap-2">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saqlanmoqda...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Saqlash
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Avatar Upload Section */}
            <Card className="opacity-0 animate-slide-up overflow-hidden" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
              <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-transparent">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Camera className="h-4 w-4 text-primary" />
                  </div>
                  Profil rasmi
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Profilingiz uchun rasm tanlang (max 2MB)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-primary/20">
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/10 to-accent/10 text-primary text-lg font-display">
                        {username.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={handleAvatarClick}
                      disabled={uploading}
                      className="absolute inset-0 rounded-full bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    >
                      {uploading ? (
                        <Loader2 className="h-5 w-5 text-background animate-spin" />
                      ) : (
                        <Crop className="h-5 w-5 text-background" />
                      )}
                    </button>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-3">
                      Rasmni yuklang va avtomatik kesish oynasidan foydalaning
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAvatarClick}
                      disabled={uploading}
                      className="gap-2"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Yuklanmoqda...
                        </>
                      ) : (
                        <>
                          <Camera className="h-4 w-4" />
                          Rasm yuklash
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Theme Section */}
            <Card className="opacity-0 animate-slide-up overflow-hidden" style={{ animationDelay: '175ms', animationFillMode: 'forwards' }}>
              <CardHeader className="pb-3 bg-gradient-to-r from-yellow-500/10 to-transparent">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <Palette className="h-4 w-4 text-yellow-500" />
                  </div>
                  Mavzu sozlamalari
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Ilova ko'rinishini sozlang
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border/50">
                    <div className="flex items-center gap-3">
                      {mounted && theme === 'dark' ? (
                        <Moon className="h-5 w-5 text-blue-400" />
                      ) : (
                        <Sun className="h-5 w-5 text-yellow-500" />
                      )}
                      <div>
                        <p className="font-medium text-sm">Rejim</p>
                        <p className="text-xs text-muted-foreground">
                          {mounted ? (theme === 'dark' ? "Qorong'u rejim" : "Yorug' rejim") : "Yuklanmoqda..."}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 p-1 rounded-lg bg-background border border-border/50">
                      <button
                        onClick={() => setTheme('light')}
                        className={`p-2 rounded-md transition-all ${
                          mounted && theme === 'light' 
                            ? 'bg-primary text-primary-foreground shadow-sm' 
                            : 'hover:bg-secondary text-muted-foreground'
                        }`}
                        aria-label="Yorug' rejim"
                      >
                        <Sun className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setTheme('dark')}
                        className={`p-2 rounded-md transition-all ${
                          mounted && theme === 'dark' 
                            ? 'bg-primary text-primary-foreground shadow-sm' 
                            : 'hover:bg-secondary text-muted-foreground'
                        }`}
                        aria-label="Qorong'u rejim"
                      >
                        <Moon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Rejimni o'zgartirish orqali ilovaning umumiy ko'rinishini o'zgartiring
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Achievements Section */}
          <div className="opacity-0 animate-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
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
