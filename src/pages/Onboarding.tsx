import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageBackground } from '@/components/layout/PageBackground';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { AvatarCropDialog } from '@/components/AvatarCropDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useConfettiEffect } from '@/components/kids/Confetti';
import { toast } from 'sonner';
import { Camera, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import pandaMascot from '@/assets/panda-mascot.png';

// Predefined avatar options for kids
const AVATAR_OPTIONS = [
  '🦁', '🐻', '🐼', '🐨', '🐯', '🦊', '🐰', '🐱',
  '🐶', '🦄', '🐲', '🦋', '🐸', '🐵', '🐷', '🦉',
];

const Onboarding = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, isParent, isTeacher, isStudent } = useUserRole();
  const navigate = useNavigate();
  const { triggerConfetti } = useConfettiEffect();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Crop dialog state
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      checkExistingProfile();
    }
  }, [user, authLoading]);

  const checkExistingProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('user_id', user.id)
      .maybeSingle();

    // If profile has a non-default username, skip onboarding
    if (data?.username && data.username !== 'Player') {
      navigate('/');
      return;
    }

    // Pre-fill username from auth metadata if available
    const metaUsername = user.user_metadata?.username;
    if (metaUsername && metaUsername !== 'Player') {
      setUsername(metaUsername);
    }

    setCheckingProfile(false);
  };

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
    setAvatarUrl(null);
    triggerConfetti('success');
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

      setAvatarUrl(publicUrl + '?t=' + Date.now());
      setSelectedEmoji(null);
      toast.success('Avatar yuklandi!');
      triggerConfetti('stars');
    } catch (error: any) {
      toast.error('Avatar yuklanmadi: ' + error.message);
    } finally {
      setUploading(false);
      setSelectedFile(null);
    }
  };

  const handleComplete = async () => {
    if (!user || !username.trim()) {
      toast.error("Iltimos, ismingizni kiriting");
      return;
    }

    setSaving(true);
    try {
      const updateData: any = { username: username.trim() };
      
      if (avatarUrl) {
        updateData.avatar_url = avatarUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) throw error;

      triggerConfetti('celebration');
      toast.success("Xush kelibsiz, " + username.trim() + "! 🎉");
      
      // Small delay to show confetti
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error: any) {
      toast.error('Xatolik: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !username.trim()) {
      toast.error("Iltimos, ismingizni kiriting");
      return;
    }
    if (step === 2) {
      setStep(3); // Go to role-specific welcome
      return;
    }
    setStep(2);
  };

  // Role-specific welcome content
  const getRoleWelcome = () => {
    if (isParent) {
      return {
        title: "Farzandingiz rivojlanishini kuzating! 👨‍👩‍👧",
        subtitle: "Ota-ona paneli tayyor",
        features: [
          { emoji: "📊", text: "Kunlik va haftalik hisobotlar" },
          { emoji: "📈", text: "Rivojlanish grafiklari" },
          { emoji: "💡", text: "Shaxsiy tavsiyalar" },
          { emoji: "🔔", text: "Avtomatik bildirishnomalar" },
        ],
        cta: "Nazoratni boshlash",
      };
    }
    if (isTeacher) {
      return {
        title: "Professional vositalar tayyor! 👩‍🏫",
        subtitle: "O'qituvchi paneli",
        features: [
          { emoji: "🧮", text: "Abakus simulyator" },
          { emoji: "📚", text: "Kurslar va darslar" },
          { emoji: "📋", text: "O'quvchi hisobotlari" },
          { emoji: "📝", text: "Sertifikatlar va PDF" },
        ],
        cta: "Panelga o'tish",
      };
    }
    // Student
    return {
      title: "Sarguzashtga tayyor! 🎮",
      subtitle: "O'ynab o'rganamiz",
      features: [
        { emoji: "🧮", text: "Abakus simulyator" },
        { emoji: "🏆", text: "Haftalik musobaqalar" },
        { emoji: "⭐", text: "Ball va yutuqlar" },
        { emoji: "📚", text: "Video darslar" },
      ],
      cta: "O'yinni boshlash",
    };
  };

  if (authLoading || checkingProfile) {
    return (
      <PageBackground className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </PageBackground>
    );
  }

  return (
    <PageBackground className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              {/* Mascot */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="mb-6"
              >
                <img 
                  src={pandaMascot} 
                  alt="Panda" 
                  className="w-32 h-32 mx-auto drop-shadow-xl"
                />
              </motion.div>

              {/* Welcome text */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <h1 className="text-3xl font-display font-black text-foreground mb-2">
                  Xush kelibsiz! 🎉
                </h1>
                <p className="text-muted-foreground mb-8">
                  Keling, profilingizni sozlaylik
                </p>
              </motion.div>

              {/* Name input */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
              >
                <div className="text-left">
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Ismingiz nima? 👋
                  </label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ismingizni kiriting..."
                    className="text-lg h-14 text-center font-medium"
                    maxLength={20}
                    autoFocus
                  />
                </div>

                <Button
                  onClick={nextStep}
                  disabled={!username.trim()}
                  className="w-full h-14 text-lg font-bold gap-2"
                >
                  Davom etish
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </motion.div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              {/* Avatar preview */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring" }}
                className="mb-6 relative inline-block"
              >
                <div className="p-1 rounded-full bg-gradient-to-r from-primary via-accent to-primary shadow-xl">
                  <Avatar className="h-28 w-28 border-4 border-background">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-4xl">
                      {selectedEmoji || username.charAt(0).toUpperCase() || '🦊'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
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
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-2xl font-display font-black text-foreground mb-2">
                  Salom, {username}! 👋
                </h2>
                <p className="text-muted-foreground mb-6">
                  Avatar tanlang yoki rasm yuklang
                </p>
              </motion.div>

              {/* Emoji grid */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 mb-6 border"
              >
                <div className="grid grid-cols-8 gap-2">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiSelect(emoji)}
                      className={`text-2xl sm:text-3xl p-1.5 sm:p-2 rounded-xl hover:bg-primary/10 hover:scale-110 transition-all ${
                        selectedEmoji === emoji ? 'bg-primary/20 ring-2 ring-primary scale-110' : ''
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Next button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="space-y-3"
              >
                <Button
                  onClick={nextStep}
                  className="w-full h-14 text-lg font-bold gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                >
                  Davom etish
                  <ArrowRight className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="text-muted-foreground"
                >
                  ← Orqaga
                </Button>
              </motion.div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              {/* Mascot */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="mb-5"
              >
                <img 
                  src={pandaMascot} 
                  alt="Panda" 
                  className="w-24 h-24 mx-auto drop-shadow-xl"
                />
              </motion.div>

              {(() => {
                const welcome = getRoleWelcome();
                return (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h2 className="text-2xl font-display font-black text-foreground mb-1">
                        {welcome.title}
                      </h2>
                      <p className="text-muted-foreground mb-6">{welcome.subtitle}</p>
                    </motion.div>

                    {/* Features list */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-card/80 backdrop-blur-sm rounded-2xl p-4 mb-6 border space-y-3"
                    >
                      {welcome.features.map((f, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + i * 0.1 }}
                          className="flex items-center gap-3 text-left"
                        >
                          <span className="text-2xl">{f.emoji}</span>
                          <span className="text-sm font-medium">{f.text}</span>
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* Complete button */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                      className="space-y-3"
                    >
                      <Button
                        onClick={handleComplete}
                        disabled={saving}
                        className="w-full h-14 text-lg font-bold gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                      >
                        {saving ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5" />
                            {welcome.cta}
                          </>
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={() => setStep(2)}
                        className="text-muted-foreground"
                      >
                        ← Orqaga
                      </Button>
                    </motion.div>
                  </>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
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

export default Onboarding;
