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

      <main className="flex-1 container px-4 py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Biz bilan bog'laning
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Savollaringiz bormi? Biz sizga yordam berishga tayyormiz. 
              Quyidagi forma orqali yoki ijtimoiy tarmoqlarimiz orqali murojaat qiling.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card className="border-border/40 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  Xabar yuborish
                </CardTitle>
                <CardDescription>
                  Formani to'ldiring, biz tez orada javob beramiz
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Logged in user info badge */}
                  {user && profileLoaded && (
                    <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg mb-2">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        Ma'lumotlaringiz avtomatik to'ldirildi
                      </span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name">Ism</Label>
                    <div className="relative">
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Ismingizni kiriting"
                        className={`${errors.name ? 'border-destructive' : ''} ${profileLoaded && user ? 'bg-muted/50 pr-10' : ''}`}
                        readOnly={profileLoaded && !!user}
                      />
                      {profileLoaded && user && (
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                      )}
                    </div>
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="email@example.com"
                        className={`${errors.email ? 'border-destructive' : ''} ${profileLoaded && user ? 'bg-muted/50 pr-10' : ''}`}
                        readOnly={profileLoaded && !!user}
                      />
                      {profileLoaded && user && (
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                      )}
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Mavzu</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Xabar mavzusi"
                      className={errors.subject ? 'border-destructive' : ''}
                    />
                    {errors.subject && (
                      <p className="text-sm text-destructive">{errors.subject}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Xabar</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Xabaringizni yozing..."
                      rows={5}
                      className={errors.message ? 'border-destructive' : ''}
                    />
                    {errors.message && (
                      <p className="text-sm text-destructive">{errors.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
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
              <Card className="border-border/40 shadow-xl overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader className="pb-2 relative">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Aloqa ma'lumotlari</CardTitle>
                      <CardDescription className="text-xs">Biz bilan bog'laning</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 relative pt-2">
                  {contactInfo.map((info, index) => (
                    <div 
                      key={info.label} 
                      className="group/item flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-muted/50 to-transparent hover:from-primary/10 hover:to-primary/5 border border-transparent hover:border-primary/20 transition-all duration-300"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 group-hover/item:scale-110 transition-transform duration-300 shadow-sm">
                        <info.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{info.label}</p>
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
                        <ExternalLink className="h-4 w-4 text-muted-foreground group-hover/item:text-primary transition-colors flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Social Links - Beautiful Design */}
              <Card className="border-border/40 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-accent/10 to-transparent rounded-full blur-2xl" />
                <CardHeader className="pb-3 relative">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/20">
                      <MessageCircle className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Ijtimoiy tarmoqlar</CardTitle>
                      <CardDescription className="text-xs">Bizni kuzatib boring</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 relative">
                  {socialLinks.map((social, index) => (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`group/social flex items-center gap-4 p-4 rounded-2xl text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] ${social.color}`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover/social:bg-white/30 transition-colors">
                        <social.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-base">{social.name}</p>
                        <p className="text-sm text-white/80 truncate">{social.description}</p>
                      </div>
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center group-hover/social:bg-white/20 transition-colors">
                        <ExternalLink className="h-4 w-4" />
                      </div>
                    </a>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </PageBackground>
  );
};

export default Contact;
