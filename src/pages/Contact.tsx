import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PageBackground } from '@/components/layout/PageBackground';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useSound } from '@/hooks/useSound';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Send, 
  Mail, 
  Phone, 
  MapPin, 
  MessageCircle,
  Instagram,
  Youtube,
  ExternalLink,
  User,
  CheckCircle2
} from 'lucide-react';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().trim().min(1, "Ism kiritilishi shart").max(100, "Ism juda uzun"),
  email: z.string().trim().email("Email noto'g'ri formatda").max(255, "Email juda uzun"),
  subject: z.string().trim().min(1, "Mavzu kiritilishi shart").max(200, "Mavzu juda uzun"),
  message: z.string().trim().min(10, "Xabar kamida 10 ta belgidan iborat bo'lishi kerak").max(1000, "Xabar juda uzun"),
});

const Contact = () => {
  const { soundEnabled, toggleSound } = useSound();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Foydalanuvchi ma'lumotlarini avtomatik to'ldirish
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) {
        setProfileLoaded(false);
        return;
      }

      // Email ni auth dan olish
      const userEmail = user.email || '';

      // Username ni profiles dan olish
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .single();

      setFormData(prev => ({
        ...prev,
        name: profile?.username || prev.name,
        email: userEmail || prev.email,
      }));
      setProfileLoaded(true);
    };

    loadUserProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          name: result.data.name,
          email: result.data.email,
          subject: result.data.subject,
          message: result.data.message,
        });

      if (error) throw error;

      toast.success("Xabaringiz muvaffaqiyatli yuborildi!", {
        description: "Tez orada siz bilan bog'lanamiz.",
      });

      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Xatolik yuz berdi", {
        description: "Iltimos, qaytadan urinib ko'ring.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const socialLinks = [
    {
      name: 'Telegram',
      icon: MessageCircle,
      href: 'https://t.me/mentalarifmetika_uz',
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Telegram kanalimizga qo\'shiling',
    },
    {
      name: 'Instagram',
      icon: Instagram,
      href: 'https://instagram.com/iqromaxcom',
      color: 'bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
      description: 'Bizni Instagramda kuzating',
    },
    {
      name: 'YouTube',
      icon: Youtube,
      href: 'https://www.youtube.com/@iqromaxcom',
      color: 'bg-red-500 hover:bg-red-600',
      description: 'Video darslarimizni tomosha qiling',
    },
  ];

  const contactInfo = [
    {
      icon: Mail,
      label: 'Email',
      value: 'info@iqromax.uz',
      href: 'mailto:info@iqromax.uz',
    },
    {
      icon: Phone,
      label: 'Telefon',
      value: '+998 99 005 30 00',
      href: 'tel:+998990053000',
    },
    {
      icon: MapPin,
      label: 'Manzil',
      value: "Toshkent sh., O'zbekiston",
      href: null,
    },
  ];

  return (
    <PageBackground className="flex flex-col">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />

      <main className="flex-1">
        {/* Hero Section with gradient - Dark mode optimized */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 dark:from-primary/15 dark:via-background dark:to-accent/15">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-64 sm:w-80 h-64 sm:h-80 bg-gradient-to-br from-primary/20 dark:from-primary/30 to-primary/5 dark:to-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="absolute -bottom-40 -left-40 w-64 sm:w-80 h-64 sm:h-80 bg-gradient-to-tr from-accent/20 dark:from-accent/30 to-accent/5 dark:to-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          </div>
          
          {/* Decorative dots pattern */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          
          <div className="container px-4 py-8 sm:py-10 md:py-14 relative">
            <div className="max-w-5xl mx-auto text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-foreground mb-3 sm:mb-4">
                Biz bilan bog'laning
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
                Savollaringiz bormi? Biz sizga yordam berishga tayyormiz. 
                Quyidagi forma orqali yoki ijtimoiy tarmoqlarimiz orqali murojaat qiling.
              </p>
            </div>
          </div>
        </div>

        <div className="container px-3 sm:px-4 py-6 sm:py-8 md:py-12">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              {/* Contact Form */}
              <Card className="border-border/50 dark:border-border/30 shadow-lg dark:shadow-xl backdrop-blur-sm bg-card/95 dark:bg-card/50 opacity-0 animate-fade-in" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20">
                      <Send className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    Xabar yuborish
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Formani to'ldiring, biz tez orada javob beramiz
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 px-4 sm:px-6 pb-4 sm:pb-6">
                  <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                    {/* Logged in user info badge */}
                    {user && profileLoaded && (
                      <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-lg mb-2">
                        <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          Ma'lumotlaringiz avtomatik to'ldirildi
                        </span>
                      </div>
                    )}

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="name" className="text-sm sm:text-base">Ism</Label>
                      <div className="relative">
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Ismingizni kiriting"
                          className={`h-10 sm:h-11 text-sm sm:text-base ${errors.name ? 'border-destructive' : ''} ${profileLoaded && user ? 'bg-muted/50 dark:bg-muted/30 pr-10' : ''}`}
                          readOnly={profileLoaded && !!user}
                        />
                        {profileLoaded && user && (
                          <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                        )}
                      </div>
                      {errors.name && (
                        <p className="text-xs sm:text-sm text-destructive">{errors.name}</p>
                      )}
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
                      <div className="relative">
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="email@example.com"
                          className={`h-10 sm:h-11 text-sm sm:text-base ${errors.email ? 'border-destructive' : ''} ${profileLoaded && user ? 'bg-muted/50 dark:bg-muted/30 pr-10' : ''}`}
                          readOnly={profileLoaded && !!user}
                        />
                        {profileLoaded && user && (
                          <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                        )}
                      </div>
                      {errors.email && (
                        <p className="text-xs sm:text-sm text-destructive">{errors.email}</p>
                      )}
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="subject" className="text-sm sm:text-base">Mavzu</Label>
                      <Input
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="Xabar mavzusi"
                        className={`h-10 sm:h-11 text-sm sm:text-base ${errors.subject ? 'border-destructive' : ''}`}
                      />
                      {errors.subject && (
                        <p className="text-xs sm:text-sm text-destructive">{errors.subject}</p>
                      )}
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="message" className="text-sm sm:text-base">Xabar</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Xabaringizni yozing..."
                        rows={4}
                        className={`text-sm sm:text-base min-h-[100px] sm:min-h-[120px] ${errors.message ? 'border-destructive' : ''}`}
                      />
                      {errors.message && (
                        <p className="text-xs sm:text-sm text-destructive">{errors.message}</p>
                      )}
                    </div>

                    <Button type="submit" className="w-full h-10 sm:h-11 text-sm sm:text-base" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      {isSubmitting ? 'Yuborilmoqda...' : 'Yuborish'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Contact Info & Social Links */}
              <div className="space-y-4 sm:space-y-6">
                {/* Contact Info - Beautiful Design */}
                <Card className="border-border/50 dark:border-border/30 shadow-xl dark:shadow-2xl overflow-hidden relative backdrop-blur-sm bg-card/95 dark:bg-card/50 group opacity-0 animate-fade-in" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 dark:from-primary/10 dark:to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardHeader className="pb-2 relative">
                    <div className="flex items-center gap-3">
                      <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/15 border border-primary/20 dark:border-primary/30">
                        <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base sm:text-lg">Aloqa ma'lumotlari</CardTitle>
                        <CardDescription className="text-xs">Biz bilan bog'laning</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3 relative pt-2">
                    {contactInfo.map((info, index) => (
                      <div 
                        key={info.label} 
                        className="group/item flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-muted/50 to-transparent dark:from-muted/30 dark:to-transparent hover:from-primary/10 hover:to-primary/5 dark:hover:from-primary/20 dark:hover:to-primary/10 border border-transparent hover:border-primary/20 dark:hover:border-primary/30 transition-all duration-300"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/15 flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 transition-transform duration-300 shadow-sm border border-primary/10 dark:border-primary/20">
                          <info.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide">{info.label}</p>
                          {info.href ? (
                            <a 
                              href={info.href}
                              className="font-semibold text-foreground hover:text-primary transition-colors text-sm sm:text-base truncate block"
                            >
                              {info.value}
                            </a>
                          ) : (
                            <p className="font-semibold text-foreground text-sm sm:text-base truncate">{info.value}</p>
                          )}
                        </div>
                        {info.href && (
                          <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground group-hover/item:text-primary transition-colors flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Social Links - Beautiful Design */}
                <Card className="border-border/50 dark:border-border/30 shadow-xl dark:shadow-2xl overflow-hidden relative backdrop-blur-sm bg-card/95 dark:bg-card/50 opacity-0 animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
                  <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-bl from-accent/10 dark:from-accent/20 to-transparent rounded-full blur-2xl" />
                  <CardHeader className="pb-2 sm:pb-3 relative">
                    <div className="flex items-center gap-3">
                      <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 dark:from-accent/30 dark:to-accent/15 border border-accent/20 dark:border-accent/30">
                        <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                      </div>
                      <div>
                        <CardTitle className="text-base sm:text-lg">Ijtimoiy tarmoqlar</CardTitle>
                        <CardDescription className="text-xs">Bizni kuzatib boring</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3 relative">
                    {socialLinks.map((social, index) => (
                      <a
                        key={social.name}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group/social flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg dark:hover:shadow-xl active:scale-[0.98] ${social.color}`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover/social:bg-white/30 transition-colors">
                          <social.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm sm:text-base">{social.name}</p>
                          <p className="text-xs sm:text-sm text-white/80 truncate">{social.description}</p>
                        </div>
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/10 flex items-center justify-center group-hover/social:bg-white/20 transition-colors">
                          <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </div>
                      </a>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </PageBackground>
  );
};

export default Contact;
