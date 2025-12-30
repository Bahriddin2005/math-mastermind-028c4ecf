import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PageBackground } from '@/components/layout/PageBackground';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useSound } from '@/hooks/useSound';
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
  ExternalLink
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
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      href: 'https://t.me/iqromax',
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Telegram kanalimizga qo\'shiling',
    },
    {
      name: 'Instagram',
      icon: Instagram,
      href: 'https://instagram.com/iqromax',
      color: 'bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600',
      description: 'Bizni Instagramda kuzating',
    },
    {
      name: 'YouTube',
      icon: Youtube,
      href: 'https://youtube.com/@iqromax',
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
      value: '+998 90 123 45 67',
      href: 'tel:+998901234567',
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
                  <div className="space-y-2">
                    <Label htmlFor="name">Ism</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Ismingizni kiriting"
                      className={errors.name ? 'border-destructive' : ''}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="email@example.com"
                      className={errors.email ? 'border-destructive' : ''}
                    />
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
            <div className="space-y-6">
              {/* Contact Info */}
              <Card className="border-border/40 shadow-lg h-[280px] flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <CardTitle>Aloqa ma'lumotlari</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 flex-1 flex flex-col justify-center">
                  {contactInfo.map((info) => (
                    <div key={info.label} className="flex items-center gap-4 h-[56px]">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <info.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{info.label}</p>
                        {info.href ? (
                          <a 
                            href={info.href}
                            className="font-medium text-foreground hover:text-primary transition-colors"
                          >
                            {info.value}
                          </a>
                        ) : (
                          <p className="font-medium text-foreground">{info.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Social Links */}
              <Card className="border-border/40 shadow-lg h-[280px] flex flex-col">
                <CardHeader className="flex-shrink-0">
                  <CardTitle>Ijtimoiy tarmoqlar</CardTitle>
                  <CardDescription>Bizni kuzatib boring</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 flex-1 flex flex-col justify-center">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-4 p-4 rounded-xl text-white transition-all h-[72px] ${social.color}`}
                    >
                      <social.icon className="h-6 w-6 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{social.name}</p>
                        <p className="text-sm text-white/80 truncate">{social.description}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 flex-shrink-0" />
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
