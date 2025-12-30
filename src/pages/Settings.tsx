import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';

const usernameSchema = z.string()
  .min(2, "Ism kamida 2 ta belgi bo'lishi kerak")
  .max(30, "Ism 30 ta belgidan oshmasligi kerak")
  .regex(/^[a-zA-Z0-9_\s]+$/, 'Faqat harflar, raqamlar va _ ishlatish mumkin');

const Settings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { soundEnabled, toggleSound } = useSound();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
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
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_url, total_problems_solved, best_streak, total_score')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setUsername(data.username || '');
        setAvatarUrl(data.avatar_url);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <main className="flex-1 container px-4 py-6 md:py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="opacity-0 animate-fade-in"
            style={{ animationFillMode: 'forwards' }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Orqaga
          </Button>

          {/* Page title */}
          <div className="opacity-0 animate-slide-up" style={{ animationFillMode: 'forwards' }}>
            <h1 className="text-2xl md:text-3xl font-display font-bold">Sozlamalar</h1>
            <p className="text-muted-foreground mt-1">Profil ma'lumotlaringizni boshqaring</p>
          </div>

          {/* Avatar Section */}
          <Card className="opacity-0 animate-slide-up" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                Profil rasmi
              </CardTitle>
              <CardDescription>
                Profilingiz uchun rasm tanlang (max 2MB). Rasm avtomatik kesiladi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-4 border-primary/20">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-display">
                      {username.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={handleAvatarClick}
                    disabled={uploading}
                    className="absolute inset-0 rounded-full bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    {uploading ? (
                      <Loader2 className="h-6 w-6 text-background animate-spin" />
                    ) : (
                      <Crop className="h-6 w-6 text-background" />
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
                <div className="flex-1">
                  <p className="font-medium">{username || 'Foydalanuvchi'}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAvatarClick}
                    disabled={uploading}
                    className="mt-3 gap-2"
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

          {/* Username Section */}
          <Card className="opacity-0 animate-slide-up" style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-accent" />
                Foydalanuvchi nomi
              </CardTitle>
              <CardDescription>
                Reytingda ko'rinadigan ismingiz
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Ism</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ismingizni kiriting"
                  maxLength={30}
                />
                <p className="text-xs text-muted-foreground">
                  2-30 ta belgi, faqat harflar, raqamlar va _ ishlatish mumkin
                </p>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saqlanmoqda...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Saqlash
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Achievements Section */}
          <Achievements
            totalProblems={profileStats.totalProblems}
            bestStreak={profileStats.bestStreak}
            totalScore={profileStats.totalScore}
            totalGames={profileStats.totalGames}
          />

          {/* Chat History Section */}
          <UserChatHistory />
        </div>
      </main>

      {/* Avatar Crop Dialog */}
      <AvatarCropDialog
        open={cropDialogOpen}
        onOpenChange={setCropDialogOpen}
        imageFile={selectedFile}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};

export default Settings;
