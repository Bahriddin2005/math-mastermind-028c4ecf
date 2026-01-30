import { PageBackground } from '@/components/layout/PageBackground';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { useSound } from '@/hooks/useSound';
import { Shield, Lock, Eye, Users, Database, Mail, RefreshCw, FileText } from 'lucide-react';

const Privacy = () => {
  const { soundEnabled, toggleSound } = useSound();

  const sections = [
    {
      icon: Database,
      title: "Qanday ma'lumotlar to'planadi",
      items: [
        "Ro'yxatdan o'tish ma'lumotlari: ism, email, telefon raqami",
        "Profil ma'lumotlari: foydalanuvchi nomi, avatar",
        "O'yin statistikasi: to'g'ri javoblar, ball, streak",
        "Qurilma ma'lumotlari: brauzer turi, IP manzil (anonim)",
      ],
    },
    {
      icon: Lock,
      title: "Ma'lumotlar qanday ishlatiladi",
      items: [
        "Xizmatni taqdim etish va yaxshilash uchun",
        "Foydalanuvchi tajribasini personalizatsiya qilish",
        "Ota-onalarga farzand statistikasini ko'rsatish",
        "Texnik yordam va xavfsizlik uchun",
      ],
    },
    {
      icon: Shield,
      title: "Bolalar maxfiyligini himoya qilish",
      items: [
        "13 yoshdan kichik foydalanuvchilar ota-ona ruxsati bilan ro'yxatdan o'tadi",
        "Bolalar profillari maxsus himoyalangan",
        "Shaxsiy ma'lumotlar uchinchi tomonlarga berilmaydi",
        "Ota-onalar istalgan vaqtda bola profilini o'chirishi mumkin",
      ],
    },
    {
      icon: Eye,
      title: "Ma'lumotlarni ulashish",
      items: [
        "Ma'lumotlar uchinchi tomonlarga sotilmaydi",
        "Faqat qonun talab qilganda hukumat organlariga",
        "Statistik ma'lumotlar anonim shaklda tahlil uchun",
        "To'lov xizmatlari (Click, Payme) bilan xavfsiz ulashish",
      ],
    },
    {
      icon: RefreshCw,
      title: "Sizning huquqlaringiz",
      items: [
        "Shaxsiy ma'lumotlaringizga kirish huquqi",
        "Ma'lumotlarni tuzatish yoki yangilash",
        "Hisobni va barcha ma'lumotlarni o'chirish",
        "Ma'lumotlarni eksport qilish (PDF/Excel)",
      ],
    },
    {
      icon: FileText,
      title: "Cookie siyosati",
      items: [
        "Sayt ishlashi uchun zarur cookie'lar",
        "Tajribani yaxshilash uchun analitik cookie'lar",
        "Siz cookie'larni brauzer orqali boshqarishingiz mumkin",
        "Cookie'larni o'chirish xizmat sifatiga ta'sir qilishi mumkin",
      ],
    },
  ];

  return (
    <PageBackground className="min-h-screen">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      
      <main className="container px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 mb-4 shadow-xl">
            <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
            Maxfiylik Siyosati
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
            IQROMAX platformasida sizning ma'lumotlaringiz qanday to'planadi, ishlatiladi va himoyalanadi haqida to'liq ma'lumot.
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">
            Oxirgi yangilangan: 2024-yil 1-dekabr
          </p>
        </div>

        {/* Sections */}
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {sections.map((section, index) => (
            <Card key={index} className="border-border/50 overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center flex-shrink-0">
                    <section.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-foreground mb-3">
                      {section.title}
                    </h2>
                    <ul className="space-y-2">
                      {section.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-primary mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Section */}
        <Card className="max-w-4xl mx-auto mt-8 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">Savollar bormi?</h3>
                <p className="text-sm text-muted-foreground">
                  Maxfiylik bo'yicha savollaringiz bo'lsa, bizga murojaat qiling:{' '}
                  <a href="mailto:privacy@iqromax.uz" className="text-primary hover:underline">
                    privacy@iqromax.uz
                  </a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </PageBackground>
  );
};

export default Privacy;
