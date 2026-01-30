import { PageBackground } from '@/components/layout/PageBackground';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { useSound } from '@/hooks/useSound';
import { FileText, CheckCircle2, AlertTriangle, Ban, CreditCard, Scale, Mail, Building2 } from 'lucide-react';

const Terms = () => {
  const { soundEnabled, toggleSound } = useSound();

  const sections = [
    {
      icon: CheckCircle2,
      title: "Foydalanish shartlari",
      content: [
        "IQROMAX platformasidan foydalanish uchun siz ushbu shartlarga rozilik bildirasiz.",
        "13 yoshdan kichik foydalanuvchilar ota-ona yoki vasiy ruxsati bilan ro'yxatdan o'tishlari kerak.",
        "Foydalanuvchi akkauntdagi barcha faoliyat uchun javobgardir.",
        "Bir akkauntni bir nechta shaxs ishlatishi taqiqlanadi.",
      ],
    },
    {
      icon: CreditCard,
      title: "To'lovlar va obunalar",
      content: [
        "Bepul tarif cheklangan funksiyalar bilan taqdim etiladi.",
        "Premium obunalar oylik yoki yillik to'lov asosida.",
        "To'lovlar Click, Payme va bank kartalari orqali qabul qilinadi.",
        "Obunani bekor qilish keyingi davr boshida kuchga kiradi.",
        "To'langan vaqt uchun pulni qaytarish amalga oshirilmaydi.",
      ],
    },
    {
      icon: Ban,
      title: "Taqiqlangan harakatlar",
      content: [
        "Platformadagi kontentni ruxsatsiz nusxalash yoki tarqatish.",
        "Boshqa foydalanuvchilar nomidan harakat qilish.",
        "Platformaga zarar yetkazuvchi skript yoki dasturlar ishlatish.",
        "Boshqa foydalanuvchilarni bezovta qilish yoki haqorat qilish.",
        "Yolg'on ma'lumotlar bilan ro'yxatdan o'tish.",
      ],
    },
    {
      icon: AlertTriangle,
      title: "Javobgarlik chegaralari",
      content: [
        "Platforma 'bor holda' (as-is) taqdim etiladi.",
        "Texnik nosozliklar uchun javobgarlik cheklangan.",
        "Foydalanuvchi tomonidan kiritilgan ma'lumotlar uchun platforma javobgar emas.",
        "Uchinchi tomon xizmatlari (to'lov tizimlari) uchun ular javobgar.",
      ],
    },
    {
      icon: Scale,
      title: "Nizolarni hal qilish",
      content: [
        "Barcha nizolar birinchi navbatda muzokaralar orqali hal qilinadi.",
        "Nizolar O'zbekiston Respublikasi qonunchiligiga muvofiq hal etiladi.",
        "Nizolarni hal qilish uchun Toshkent shahar sudlari vakolatli.",
      ],
    },
    {
      icon: FileText,
      title: "Intellektual mulk",
      content: [
        "Platformadagi barcha kontent IQROMAX mulkidir.",
        "Logotip, dizayn va kontent himoyalangan.",
        "Foydalanuvchilarga shaxsiy foydalanish uchun litsenziya beriladi.",
        "Tijoriy maqsadlarda foydalanish alohida shartnoma talab qiladi.",
      ],
    },
  ];

  return (
    <PageBackground className="min-h-screen">
      <Navbar soundEnabled={soundEnabled} onToggleSound={toggleSound} />
      
      <main className="container px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 mb-4 shadow-xl">
            <FileText className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
            Foydalanish Shartlari
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
            IQROMAX platformasidan foydalanish qoidalari va shartlari. Platformadan foydalanish ushbu shartlarni qabul qilganingizni bildiradi.
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
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <section.icon className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-foreground mb-3">
                      {section.title}
                    </h2>
                    <ul className="space-y-2">
                      {section.content.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-amber-500 mt-1">•</span>
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

        {/* Company Info */}
        <Card className="max-w-4xl mx-auto mt-8 border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">Kompaniya ma'lumotlari</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p><strong>Nomi:</strong> IQROMAX</p>
                  <p><strong>Manzil:</strong> Toshkent shahri, O'zbekiston</p>
                  <p><strong>Email:</strong> <a href="mailto:info@iqromax.uz" className="text-primary hover:underline">info@iqromax.uz</a></p>
                  <p><strong>Telefon:</strong> <a href="tel:+998990053000" className="text-primary hover:underline">+998 99 005 30 00</a></p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="max-w-4xl mx-auto mt-4 border-border/50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-foreground">Savollar bormi?</h3>
                <p className="text-sm text-muted-foreground">
                  Shartlar bo'yicha savollaringiz bo'lsa:{' '}
                  <a href="mailto:legal@iqromax.uz" className="text-primary hover:underline">
                    legal@iqromax.uz
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

export default Terms;
